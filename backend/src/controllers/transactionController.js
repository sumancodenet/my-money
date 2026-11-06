import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { Transaction, Account, Category } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { ApiError } from '../utils/ApiError.js';
import { sequelize } from '../config/database.js';
import { toNumber, getAccountBalance, assertSufficientBalance, checkIdempotency, createTransactionWithLedger } from '../services/financeService.js';
import dayjs from 'dayjs';

const buildWhere = (userId, query) => {
  const where = { userId, status: 'Posted' };
  if (query.accountId) where.accountId = query.accountId;
  if (query.type) where.type = query.type;
  if (query.categoryId) where.categoryId = query.categoryId;
  if (query.from || query.to) where.transactionDate = {};
  if (query.from) where.transactionDate[Op.gte] = query.from;
  if (query.to) where.transactionDate[Op.lte] = query.to;
  if (query.search) where.description = { [Op.like]: `%${query.search}%` };
  return where;
};

export const listTransactions = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const offset = (page - 1) * limit;
  const where = buildWhere(req.user.id, req.query);
  const { count, rows } = await Transaction.findAndCountAll({
    where, include: [{ model: Account, attributes: ['id', 'bankName'] }, { model: Category, attributes: ['id', 'name', 'icon', 'color'] }],
    order: [['transactionDate', 'DESC'], ['createdAt', 'DESC']], limit, offset,
  });
  sendSuccess(res, 200, 'Transactions fetched', rows, { page, totalPages: Math.ceil(count / limit) || 1, total: count });
});

export const getTransaction = asyncHandler(async (req, res) => {
  const tx = await Transaction.findOne({ where: { id: req.params.id, userId: req.user.id }, include: [Account, Category] });
  if (!tx) throw new ApiError(404, 'Transaction not found.');
  sendSuccess(res, 200, 'Transaction fetched', tx);
});

export const createTransaction = asyncHandler(async (req, res) => {
  const type = req.body.type; // Income | Expense | Adjustment
  if (!['Income', 'Expense', 'Adjustment'].includes(type)) throw new ApiError(400, 'Invalid type. Use Income/Expense/Adjustment.');
  const idKey = req.headers['x-idempotency-key'] || req.body.idempotencyKey;
  if (idKey) { const dup = await checkIdempotency(idKey); if (dup) throw new ApiError(409, 'Duplicate submission prevented.'); }

  const result = await sequelize.transaction(async (t) => {
    const { account, balance } = await getAccountBalance(req.body.accountId, { lock: true, t });
    if (account.userId !== req.user.id) throw new ApiError(403, 'Forbidden.');
    if (type === 'Expense') assertSufficientBalance(balance, req.body.amount, account);
    return createTransactionWithLedger({
      userId: req.user.id, accountId: req.body.accountId, categoryId: req.body.categoryId,
      type, amount: req.body.amount, transactionDate: req.body.transactionDate || new Date().toISOString(),
      description: req.body.description, referenceNumber: req.body.referenceNumber,
      paymentMethod: req.body.paymentMethod, idempotencyKey: idKey,
    }, t);
  });
  sendSuccess(res, 201, 'Transaction posted', result);
});

export const createTransfer = asyncHandler(async (req, res) => {
  const { sourceAccountId, destinationAccountId, amount, transferDate, description, referenceNumber } = req.body;
  const idKey = req.headers['x-idempotency-key'] || req.body.idempotencyKey;
  if (idKey) { const dup = await checkIdempotency(idKey); if (dup) throw new ApiError(409, 'Duplicate submission prevented.'); }
  const ref = uuidv4();

  const result = await sequelize.transaction(async (t) => {
    const src = await Account.findByPk(sourceAccountId, { lock: true, transaction: t });
    const dst = await Account.findByPk(destinationAccountId, { lock: true, transaction: t });
    if (!src || !dst) throw new ApiError(404, 'Account not found.');
    if (src.userId !== req.user.id || dst.userId !== req.user.id) throw new ApiError(403, 'Forbidden.');
    const { balance } = await getAccountBalance(sourceAccountId, { t });
    assertSufficientBalance(balance, amount, src);
    const outTx = await createTransactionWithLedger({ userId: req.user.id, accountId: sourceAccountId, type: 'TransferOut', amount, transactionDate: transferDate || dayjs().format('YYYY-MM-DD'), description, referenceNumber, transferReferenceId: ref, idempotencyKey: idKey }, t);
    const inTx = await createTransactionWithLedger({ userId: req.user.id, accountId: destinationAccountId, type: 'TransferIn', amount, transactionDate: transferDate || dayjs().format('YYYY-MM-DD'), description, referenceNumber, transferReferenceId: ref, relatedTransactionId: outTx.id }, t);
    return { outTx, inTx };
  });
  sendSuccess(res, 201, 'Transfer completed atomically', result);
});

export const reverseTransaction = asyncHandler(async (req, res) => {
  const tx = await Transaction.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!tx) throw new ApiError(404, 'Transaction not found.');
  if (tx.status === 'Reversed') throw new ApiError(400, 'Already reversed.');

  const reversal = await sequelize.transaction(async (t) => {
    if (tx.transferReferenceId) {
      const pair = await Transaction.findAll({ where: { transferReferenceId: tx.transferReferenceId, status: 'Posted' }, transaction: t });
      for (const p of pair) {
        const revType = p.type === 'TransferOut' ? 'TransferIn' : p.type === 'TransferIn' ? 'TransferOut' : 'Adjustment';
        await createTransactionWithLedger({ userId: req.user.id, accountId: p.accountId, type: revType, amount: p.amount, transactionDate: req.body.reversalDate || dayjs().format('YYYY-MM-DD'), description: `Reversal of ${p.id}`, referenceNumber: p.referenceNumber, relatedTransactionId: p.id }, t);
        await p.update({ status: 'Reversed' }, { transaction: t });
      }
      return pair;
    }
    const revTypeMap = { Income: 'Expense', Expense: 'Income', Adjustment: 'Adjustment' };
    const rev = await createTransactionWithLedger({ userId: req.user.id, accountId: tx.accountId, type: revTypeMap[tx.type] || 'Adjustment', amount: tx.amount, transactionDate: req.body.reversalDate || dayjs().format('YYYY-MM-DD'), description: `Reversal of ${tx.id}`, referenceNumber: tx.referenceNumber, relatedTransactionId: tx.id }, t);
    await tx.update({ status: 'Reversed' }, { transaction: t });
    return rev;
  });
  sendSuccess(res, 201, 'Reversal posted', reversal);
});

export const deleteTransaction = asyncHandler(async (req, res) => {
  const tx = await Transaction.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!tx) throw new ApiError(404, 'Transaction not found.');
  if (tx.transferReferenceId) {
    const pair = await Transaction.findAll({ where: { transferReferenceId: tx.transferReferenceId, userId: req.user.id } });
    await Transaction.destroy({ where: { transferReferenceId: tx.transferReferenceId, userId: req.user.id } });
    return sendSuccess(res, 200, `Transfer pair (${pair.length} entries) deleted permanently`);
  }
  await tx.destroy();
  sendSuccess(res, 200, 'Transaction deleted permanently');
});

// Bank Statement — chronological with running balance
export const getStatement = asyncHandler(async (req, res) => {
  const accountId = req.query.accountId || req.params.accountId;
  if (!accountId) throw new ApiError(400, 'accountId is required for statement.');
  const account = await Account.findOne({ where: { id: accountId, userId: req.user.id } });
  if (!account) throw new ApiError(404, 'Account not found.');
  const where = { userId: req.user.id, accountId, status: 'Posted' };
  if (req.query.from || req.query.to) {
    where.transactionDate = {};
    if (req.query.from) where.transactionDate[Op.gte] = req.query.from;
    if (req.query.to) where.transactionDate[Op.lte] = req.query.to;
  }
  const txs = await Transaction.findAll({ where, include: [{ model: Category, attributes: ['name'] }], order: [['transactionDate', 'ASC'], ['createdAt', 'ASC']], raw: true });
  let running = toNumber(account.openingBalance);
  const rows = txs.map(t => {
    const amt = toNumber(t.amount);
    const credit = ['Income', 'TransferIn', 'OpeningBalance', 'Adjustment'].includes(t.type) ? amt : 0;
    const debit = ['Expense', 'TransferOut'].includes(t.type) ? amt : 0;
    running += credit - debit;
    return { ...t, credit, debit, runningBalance: Number(running.toFixed(2)), categoryName: t.CategoryName || t['Category.name'] || '—' };
  });
  sendSuccess(res, 200, 'Bank statement', {
    account: { id: account.id, bankName: account.bankName, openingBalance: toNumber(account.openingBalance), openingDate: account.openingDate },
    openingBalance: toNumber(account.openingBalance),
    closingBalance: Number(running.toFixed(2)),
    totalCredit: rows.reduce((s, r) => s + r.credit, 0),
    totalDebit: rows.reduce((s, r) => s + r.debit, 0),
    entries: rows,
  });
});
