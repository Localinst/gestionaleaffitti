import express from 'express';
import { authenticate } from '../middleware/auth';
import { 
  getAllActivities, 
  createActivity, 
  updateActivityStatus 
} from '../controllers/activities';

const router = express.Router();

// Le rotte per le attività richiedono autenticazione
router.get('/', authenticate, getAllActivities);
router.post('/', authenticate, createActivity);
router.patch('/:id/status', authenticate, updateActivityStatus);

export default router; 