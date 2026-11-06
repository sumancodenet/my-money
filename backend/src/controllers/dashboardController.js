import { Op } from 'sequelize';
import { Transaction, Account, Budget } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { toNumber } from '../services/financeService.js';
import dayjs from 'dayjs';
import { sequelize } from '../config/database.js';

// In-memory cache — dashboard summary 8s (avoids 5-6 RDS round-trips per refresh)
const summaryCache = new Map();
const CACHE_TTL = 8000;

export const getSummary = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const cached = summaryCache.get(userId);
  if (cached && Date.now() - cached.time < CACHE_TTL) return sendSuccess(res, 200, 'Dashboard summary', cached.data);

  const now = dayjs();
  const monthStart = now.startOf('month').format('YYYY-MM-DD');
  const todayStr = now.format('YYYY-MM-DD');
  const monthKey = now.format('YYYY-MM');

  // Single SQL runs in parallel (was: sequential N+1 loop = 1 + N + 3 round-trips)
  const [accounts, monthTx, todayTx, budget, balances] = await Promise.all([
    Account.findAll({ where: { userId, status: 'Active' }, raw: true }),
    Transaction.findAll({ where: { userId, status: 'Posted', transactionDate: { [Op.gte]: monthStart } }, attributes: ['type', 'amount'], raw: true }),
    Transaction.findAll({ where: { userId, status: 'Posted', transactionDate: todayStr }, attributes: ['type', 'amount'], raw: true }),
    Budget.findOne({ where: { userId, month: monthKey }, raw: true }),
    sequelize.query(
      `SELECT a.id AS accountId, a.bankName, a.openingBalance,
        COALESCE(SUM(CASE WHEN t.type IN ('Income','TransferIn','OpeningBalance','Adjustment') THEN t.amount ELSE -t.amount END), 0) AS net
       FROM Accounts a LEFT JOIN Transactions t ON t.accountId = a.id AND t.status = 'Posted'
       WHERE a.userId = ? AND a.status = 'Active' GROUP BY a.id`,
      { replacements: [userId], type: sequelize.QueryTypes.SELECT }
    ),
  ]);

  let totalBalance = 0;
  const bankBalances = balances.map(b => {
    const bal = toNumber(b.openingBalance) + toNumber(b.net);
    totalBalance += bal;
    return { accountId: b.accountId, bankName: b.bankName, balance: Number(bal.toFixed(2)) };
  });

  const totalIncome = monthTx.filter(t => t.type === 'Income' || t.type === 'TransferIn').reduce((s, t) => s + toNumber(t.amount), 0);
  const totalExpenses = monthTx.filter(t => t.type === 'Expense' || t.type === 'TransferOut').reduce((s, t) => s + toNumber(t.amount), 0);
  const todayExpenses = todayTx.filter(t => t.type === 'Expense').reduce((s, t) => s + toNumber(t.amount), 0);
  const monthlyBudget = budget ? toNumber(budget.budgetAmount) : 0;

  const data = {
    totalBalance: Number(totalBalance.toFixed(2)),
    totalIncome: Number(totalIncome.toFixed(2)),
    totalExpenses: Number(totalExpenses.toFixed(2)),
    netSavings: Number((totalIncome - totalExpenses).toFixed(2)),
    totalBankAccounts: accounts.length,
    monthlyBudget,
    remainingBudget: Number((monthlyBudget - totalExpenses).toFixed(2)),
    todayExpenses: Number(todayExpenses.toFixed(2)),
    bankBalances,
  };
  summaryCache.set(userId, { data, time: Date.now() });
  sendSuccess(res, 200, 'Dashboard summary', data);
});

export const getIncomeExpense = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const from = dayjs().subtract(days, 'day').format('YYYY-MM-DD');
  const txs = await Transaction.findAll({ where: { userId: req.user.id, status: 'Posted', transactionDate: { [Op.gte]: from } }, attributes: ['type', 'amount', 'transactionDate'], raw: true, order: [['transactionDate', 'ASC']] });
  const map = {};
  txs.forEach(t => {
    const d = String(t.transactionDate).slice(0, 10);
    if (!map[d]) map[d] = { date: d, income: 0, expense: 0 };
    if (['Income', 'TransferIn'].includes(t.type)) map[d].income += toNumber(t.amount);
    if (['Expense', 'TransferOut'].includes(t.type)) map[d].expense += toNumber(t.amount);
  });
  sendSuccess(res, 200, 'Income vs Expense data', Object.values(map));
});

export const getCategoryExpenses = asyncHandler(async (req, res) => {
  const rows = await sequelize.query(
    `SELECT c.id, c.name, c.color, c.icon, SUM(t.amount) AS total FROM Transactions t JOIN Categories c ON t.categoryId = c.id WHERE t.userId = ? AND t.type='Expense' AND t.status='Posted' GROUP BY c.id ORDER BY total DESC LIMIT 10`,
    { replacements: [req.user.id], type: sequelize.QueryTypes.SELECT }
  );
  sendSuccess(res, 200, 'Category expenses', rows.map(r => ({ ...r, total: Number(r.total) })));
});

export const getBankBalances = asyncHandler(async (req, res) => {
  const rows = await sequelize.query(
    `SELECT a.id AS accountId, a.bankName, a.openingBalance,
      COALESCE(SUM(CASE WHEN t.type IN ('Income','TransferIn','OpeningBalance','Adjustment') THEN t.amount ELSE -t.amount END), 0) AS net
     FROM Accounts a LEFT JOIN Transactions t ON t.accountId = a.id AND t.status = 'Posted'
     WHERE a.userId = ? GROUP BY a.id`,
    { replacements: [req.user.id], type: sequelize.QueryTypes.SELECT }
  );
  sendSuccess(res, 200, 'Bank balances', rows.map(b => ({ accountId: b.accountId, bankName: b.bankName, balance: Number((toNumber(b.openingBalance) + toNumber(b.net)).toFixed(2)) })));
});
