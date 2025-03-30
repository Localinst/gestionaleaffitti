import express from 'express';
import { authenticate } from '../middleware/auth';
import { 
  getAllContracts, 
  getContractById, 
  createContract, 
  updateContract, 
  deleteContract 
} from '../controllers/contracts';

const router = express.Router();

// Non è necessario applicare il middleware qui perché viene già applicato in index.ts
// router.use(authenticate);

// Rotte per i contratti
router.get('/', getAllContracts);
router.get('/:id', getContractById);
router.post('/', createContract);
router.put('/:id', updateContract);
router.delete('/:id', deleteContract);

export default router; 