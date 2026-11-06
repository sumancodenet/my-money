import { Budget, FinancialGoal, Reminder, Transaction } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { ApiError } from '../utils/ApiError.js';
import { toNumber } from '../services/financeService.js';
import { Op } from 'sequelize';
import dayjs from 'dayjs';

export const listBudgets = asyncHandler(async (req, res) => {
  const budgets = await Budget.findAll({ where: { userId: req.user.id }, order: [['month', 'DESC']] });
  const enriched = [];
  for (const b of budgets) {
    const from = dayjs(b.month + '-01').format('YYYY-MM-DD');
    const to = dayjs(b.month + '-01').endOf('month').format('YYYY-MM-DD');
    const where = { userId: req.user.id, type: 'Expense', status: 'Posted', transactionDate: { [Op.between]: [from, to] } };
    if (b.categoryId) where.categoryId = b.categoryId;
    const txs = await Transaction.findAll({ where, raw: true });
    const spent = txs.reduce((s, t) => s + toNumber(t.amount), 0);
    enriched.push({ ...b.toJSON(), spent: Number(spent.toFixed(2)), remaining: Number((toNumber(b.budgetAmount) - spent).toFixed(2)), percentage: toNumber(b.budgetAmount) > 0 ? Math.min(100, (spent / toNumber(b.budgetAmount)) * 100) : 0 });
  }
  sendSuccess(res, 200, 'Budgets fetched', enriched);
});

export const upsertBudget = asyncHandler(async (req, res) => {
  const existing = await Budget.findOne({ where: { userId: req.user.id, month: req.body.month, categoryId: req.body.categoryId || null } });
  if (existing) { await existing.update(req.body); return sendSuccess(res, 200, 'Budget updated', existing); }
  const b = await Budget.create({ ...req.body, userId: req.user.id });
  sendSuccess(res, 201, 'Budget created', b);
});

export const listGoals = asyncHandler(async (req, res) => {
  const goals = await FinancialGoal.findAll({ where: { userId: req.user.id }, order: [['targetDate', 'ASC']] });
  sendSuccess(res, 200, 'Goals fetched', goals.map(g => ({ ...g.toJSON(), percentage: toNumber(g.targetAmount) ? Math.min(100, (toNumber(g.currentAmount) / toNumber(g.targetAmount)) * 100) : 0 })));
});

export const createGoal = asyncHandler(async (req, res) => {
  const g = await FinancialGoal.create({ ...req.body, userId: req.user.id });
  sendSuccess(res, 201, 'Goal created', g);
});

export const updateGoal = asyncHandler(async (req, res) => {
  const g = await FinancialGoal.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!g) throw new ApiError(404, 'Goal not found.');
  await g.update(req.body);
  sendSuccess(res, 200, 'Goal updated', g);
});

export const contributeGoal = asyncHandler(async (req, res) => {
  const g = await FinancialGoal.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!g) throw new ApiError(404, 'Goal not found.');
  g.currentAmount = toNumber(g.currentAmount) + toNumber(req.body.amount);
  await g.save();
  sendSuccess(res, 200, 'Contribution added', g);
});

export const listReminders = asyncHandler(async (req, res) => {
  const r = await Reminder.findAll({ where: { userId: req.user.id }, order: [['dueDate', 'ASC']] });
  const enriched = r.map(x => ({ ...x.toJSON(), daysLeft: dayjs(x.dueDate).diff(dayjs(), 'day') }));
  sendSuccess(res, 200, 'Reminders fetched', enriched);
});

export const createReminder = asyncHandler(async (req, res) => {
  const r = await Reminder.create({ ...req.body, userId: req.user.id });
  sendSuccess(res, 201, 'Reminder created', r);
});

export const toggleReminder = asyncHandler(async (req, res) => {
  const r = await Reminder.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!r) throw new ApiError(404, 'Reminder not found.');
  await r.update({ isPaid: !r.isPaid });
  sendSuccess(res, 200, 'Reminder updated', r);
});
