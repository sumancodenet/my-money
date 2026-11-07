import { Router } from 'express';
import { listAccounts, getAccount, createAccount, updateAccount, deleteAccount, archiveAccount, depositToAccount, withdrawFromAccount } from '../controllers/accountController.js';
import { accountValidator } from '../validators/accountValidators.js';
import { movementValidator } from '../validators/transactionValidators.js';
import { validate } from '../middlewares/validate.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();
router.use(protect);
router.get('/', listAccounts);
router.get('/:id', getAccount);
router.post('/', accountValidator, validate, createAccount);
router.patch('/:id', updateAccount);
router.delete('/:id/:archive?', deleteAccount);
router.post('/:id/archive', archiveAccount);
router.post('/:id/deposit', movementValidator, validate, depositToAccount);
router.post('/:id/withdraw', movementValidator, validate, withdrawFromAccount);
export default router;
