import { Router } from 'express';
import { 
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  deleteAllTransactions
} from '../controllers/transactions';

const router = Router();

router.get('/', getTransactions);
router.post('/', createTransaction);
// Route per eliminare tutte le transazioni (deve venire PRIMA della route con parametro :id)
router.delete('/all', deleteAllTransactions);
// Route con parametro id (deve venire DOPO la route /all)
router.get('/:id', getTransactionById);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

export { router as transactionsRouter }; 