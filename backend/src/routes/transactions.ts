import { Router } from 'express';
import { 
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction
} from '../controllers/transactions';
import { authenticate } from '../middleware/auth';

const router = Router();

// Applico il middleware di autenticazione a tutte le rotte
router.use(authenticate);

router.get('/', getTransactions);
router.get('/:id', getTransactionById);
router.post('/', createTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

export { router as transactionsRouter }; 