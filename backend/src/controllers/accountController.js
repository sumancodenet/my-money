import { Op } from 'sequelize';
import { Account, Transaction } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { ApiError } from '../utils/ApiError.js';
import { toNumber, getAccountBalance, assertSufficientBalance, checkIdempotency, createTransactionWithLedger } from '../services/financeService.js';
import { sequelize } from '../config/database.js';

export const listAccounts = asyncHandler(async (req, res) => {
  // Single SQL aggregate — was N+1 sequential Transaction queries (main slowness)
  const rows = await sequelize.query(
    `SELECT a.*, COALESCE(SUM(CASE WHEN t.type IN ('Income','TransferIn','OpeningBalance','Adjustment','Deposit') THEN t.amount ELSE -t.amount END), 0) AS net
     FROM Accounts a LEFT JOIN Transactions t ON t.accountId = a.id AND t.status = 'Posted'
     WHERE a.userId = ? GROUP BY a.id ORDER BY a.createdAt DESC`,
    { replacements: [req.user.id], type: sequelize.QueryTypes.SELECT }
  );
  const enriched = rows.map(a => ({ ...a, currentBalance: Number((toNumber(a.openingBalance) + toNumber(a.net)).toFixed(2)) }));
  sendSuccess(res, 200, 'Accounts fetched', enriched);
});

export const getAccount = asyncHandler(async (req, res) => {
  const { account, balance } = await getAccountBalance(req.params.id);
  if (account.userId !== req.user.id) throw new ApiError(404, 'Account not found.');
  sendSuccess(res, 200, 'Account fetched', { ...account.toJSON(), currentBalance: Number(balance.toFixed(2)) });
});

export const createAccount = asyncHandler(async (req, res) => {
  const account = await sequelize.transaction(async (t) => {
    const acc = await Account.create({ ...req.body, userId: req.user.id }, { transaction: t });
    if (toNumber(req.body.openingBalance) > 0) {
      await Transaction.create({ userId: req.user.id, accountId: acc.id, type: 'OpeningBalance', amount: req.body.openingBalance, transactionDate: req.body.openingDate || new Date(), description: 'Opening balance', status: 'Posted' }, { transaction: t });
    }
    return acc;
  });
  const { balance } = await getAccountBalance(account.id);
  sendSuccess(res, 201, 'Account created', { ...account.toJSON(), currentBalance: Number(balance.toFixed(2)) });
});

export const updateAccount = asyncHandler(async (req, res) => {
  const acc = await Account.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!acc) throw new ApiError(404, 'Account not found.');
  await acc.update(req.body);
  sendSuccess(res, 200, 'Account updated', acc);
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const acc = await Account.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!acc) throw new ApiError(404, 'Account not found.');
  const hasTx = await Transaction.count({ where: { accountId: acc.id, status: 'Posted' } });
  if (hasTx > 0) throw new ApiError(400, 'Cannot delete account with transactions. Archive instead.');
  await acc.destroy();
  sendSuccess(res, 200, 'Account deleted');
});

// Deposit (paisa bank me jama) / Withdrawal (paisa bank se nikala)
// POST /accounts/:id/deposit | POST /accounts/:id/withdraw
// Body: { amount, transactionDate?, description?, referenceNumber?, paymentMethod? }
const postAccountMovement = async (req, res, type) => {
  const { amount, transactionDate, description, referenceNumber, paymentMethod } = req.body;
  const idKey = req.headers['x-idempotency-key'] || req.body.idempotencyKey;
  if (idKey) {
    const dup = await checkIdempotency(idKey);
    if (dup) throw new ApiError(409, 'Duplicate submission prevented.');
  }
  const result = await sequelize.transaction(async (t) => {
    const { account, balance } = await getAccountBalance(req.params.id, { lock: true, t });
    if (account.userId !== req.user.id) throw new ApiError(403, 'Forbidden.');
    if (account.status !== 'Active') throw new ApiError(400, `Account is ${account.status.toLowerCase()}. Deposit/withdrawal not allowed.`);
    if (type === 'Withdrawal') assertSufficientBalance(balance, amount, account);
    const tx = await createTransactionWithLedger({
      userId: req.user.id,
      accountId: account.id,
      type,
      amount,
      transactionDate: transactionDate || new Date().toISOString(),
      description: description || type,
      referenceNumber,
      paymentMethod,
      idempotencyKey: idKey,
    }, t);
    const newBalance = type === 'Deposit' ? balance + toNumber(amount) : balance - toNumber(amount);
    return { tx, account, currentBalance: Number(newBalance.toFixed(2)) };
  });
  sendSuccess(res, 201, type === 'Deposit' ? 'Deposit successful' : 'Withdrawal successful', {
    transaction: result.tx,
    account: { ...result.account.toJSON(), currentBalance: result.currentBalance },
    currentBalance: result.currentBalance,
  });
};

export const depositToAccount = asyncHandler(async (req, res) => postAccountMovement(req, res, 'Deposit'));
export const withdrawFromAccount = asyncHandler(async (req, res) => postAccountMovement(req, res, 'Withdrawal'));

export const archiveAccount = asyncHandler(async (req, res) => {
  const acc = await Account.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!acc) throw new ApiError(404, 'Account not found.');
  await acc.update({ status: 'Archived' });
  sendSuccess(res, 200, 'Account archived', acc);
});
