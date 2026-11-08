import { Router } from 'express';
import { listTransactions, getTransaction, createTransaction, createTransfer, reverseTransaction, deleteTransaction, getStatement } from '../controllers/transactionController.js';
import { transactionValidator, transferValidator } from '../validators/transactionValidators.js';
import { validate } from '../middlewares/validate.js';
import { protect } from '../middlewares/authMiddleware.js';
import { cacheable, invalidateUserCache } from '../middlewares/cache.js';

const router = Router();
router.use(protect);
router.use(invalidateUserCache);
router.get('/', cacheable(30), listTransactions);
router.get('/income', cacheable(30), (req, res, next) => { req.query.type = 'Income'; next(); }, listTransactions);
router.get('/expense', cacheable(30), (req, res, next) => { req.query.type = 'Expense'; next(); }, listTransactions);
router.get('/transfers', cacheable(30), async (req, res) => {
  const { Transaction } = await import('../models/index.js');
  const { Op } = await import('sequelize');
  const where = { userId: req.user.id, transferReferenceId: { [Op.ne]: null } };
  if (req.query.accountId) where.accountId = req.query.accountId;
  if (req.query.search) where.description = { [Op.like]: `%${req.query.search}%` };
  if (req.query.from || req.query.to) {
    where.transactionDate = {};
    if (req.query.from) where.transactionDate[Op.gte] = req.query.from;
    if (req.query.to) where.transactionDate[Op.lte] = req.query.to;
  }
  const txs = await Transaction.findAll({ where, order: [['transactionDate', 'DESC']] });
  res.json({ success: true, message: 'Transfers fetched', data: txs, pagination: null });
});
router.get('/statement', cacheable(30), getStatement);
router.get('/:id', cacheable(30), getTransaction);
router.post('/', transactionValidator, validate, createTransaction);
router.post('/transfer', transferValidator, validate, createTransfer);
router.post('/:id/reverse', reverseTransaction);
router.delete('/:id', deleteTransaction);
export default router;
