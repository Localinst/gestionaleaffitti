import { Router } from 'express';
import { 
  getProperties, 
  getPropertyById, 
  createProperty,
  updateProperty,
  deleteProperty 
} from '../controllers/properties';
import { authenticate } from '../middleware/auth';

const router = Router();

// Applico il middleware di autenticazione a tutte le rotte
router.use(authenticate);

router.get('/', getProperties);
router.get('/:id', getPropertyById);
router.post('/', createProperty);
router.put('/:id', updateProperty);
router.delete('/:id', deleteProperty);

export { router as propertiesRouter }; 