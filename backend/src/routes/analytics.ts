import express from 'express';
import * as analyticsController from '../controllers/analytics';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Route per la registrazione delle visualizzazioni di pagina (senza autenticazione)
router.post('/track/pageview', analyticsController.trackPageView);

// Route per la registrazione delle conversioni (senza autenticazione)
router.post('/track/conversion', analyticsController.trackConversion);

// Route per ottenere le statistiche (richiede autenticazione)
router.get('/stats', authenticate, analyticsController.getAnalyticsStats);

export default router; 