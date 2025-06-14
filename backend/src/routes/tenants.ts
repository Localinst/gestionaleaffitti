import { Router } from 'express';
import { 
  getTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant,
  deleteAllTenants
} from '../controllers/tenants';
import { authenticate } from '../middleware/auth';

const router = Router();

// Applico il middleware di autenticazione a tutte le rotte
router.use(authenticate);

router.get('/', getTenants);
router.get('/:id', getTenantById);
router.post('/', createTenant);
router.put('/:id', updateTenant);
router.delete('/:id', deleteTenant);
router.delete('/all', deleteAllTenants);

export { router as tenantsRouter }; 