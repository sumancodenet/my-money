import { Router } from 'express';
import { listTransactions, getTransaction, createTransaction, createTransfer, reverseTransaction, deleteTransaction, getStatement } from '../controllers/transactionController.js';
import { transactionValidator, transferValidator } from '../validators/transactionValidators.js';
import { validate } from '../middlewares/validate.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();
router.use(protect);
router.get('/', listTransactions);
router.get('/income', (req, res, next) => { req.query.type = 'Income'; next(); }, listTransactions);
router.get('/expense', (req, res, next) => { req.query.type = 'Expense'; next(); }, listTransactions);
router.get('/transfers', async (req, res) => {
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
router.get('/statement', getStatement);
router.get('/:id', getTransaction);
router.post('/', transactionValidator, validate, createTransaction);
router.post('/transfer', transferValidator, validate, createTransfer);
router.post('/:id/reverse', reverseTransaction);
router.delete('/:id', deleteTransaction);
export default router;
