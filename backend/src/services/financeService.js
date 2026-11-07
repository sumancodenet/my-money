import { sequelize } from '../config/database.js';
import { Transaction, Account } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';

export const toNumber = (v) => Number(v || 0);

export const getAccountBalance = async (accountId, { lock = false, t = null } = {}) => {
  const account = await Account.findByPk(accountId, { lock, transaction: t });
  if (!account) throw new ApiError(404, 'Account not found.');
  const txs = await Transaction.findAll({ where: { accountId, status: 'Posted' }, transaction: t, raw: true });
  let balance = toNumber(account.openingBalance);
  for (const tx of txs) {
    const amt = toNumber(tx.amount);
    if (['Income', 'TransferIn', 'OpeningBalance', 'Adjustment', 'Deposit'].includes(tx.type)) balance += amt;
    else if (['Expense', 'TransferOut', 'Withdrawal'].includes(tx.type)) balance -= amt;
  }
  return { account, balance };
};

export const assertSufficientBalance = (balance, amount, account) => {
  const amt = toNumber(amount);
  if (!account.allowOverdraft && balance - amt < 0) {
    throw new ApiError(400, `Insufficient balance. Available ₹${balance.toFixed(2)}`);
  }
  if (account.allowOverdraft && balance - amt < -toNumber(account.overdraftLimit)) {
    throw new ApiError(400, `Overdraft limit exceeded.`);
  }
};

export const checkIdempotency = async (key) => {
  if (!key) return null;
  return Transaction.findOne({ where: { idempotencyKey: key } });
};

export const createTransactionWithLedger = async ({ userId, accountId, categoryId, type, amount, transactionDate, description, referenceNumber, paymentMethod, idempotencyKey, transferReferenceId = null, relatedTransactionId = null }, t) => {
  return Transaction.create({
    userId, accountId, categoryId, type, amount, transactionDate, description, referenceNumber,
    paymentMethod, idempotencyKey, transferReferenceId, relatedTransactionId, status: 'Posted',
  }, { transaction: t });
};
