import { Router } from 'express';
import { getDashboardSummary } from '../controllers/dashboard';
import { Request, Response } from 'express';

const router = Router();

// Endpoint di riepilogo dashboard
router.get('/summary', getDashboardSummary);

// Endpoint di debug per verificare l'autenticazione
router.get('/debug', (req: Request, res: Response) => {
  try {
    res.json({
      authenticated: !!req.user,
      user: req.user || null,
      timestamp: new Date().toISOString(),
      headers: {
        authorization: req.headers.authorization ? 'Present (partially hidden)' : 'Missing',
        cookie: req.headers.cookie ? 'Present (partially hidden)' : 'Missing'
      }
    });
  } catch (error: any) {
    console.error('Errore nell\'endpoint di debug:', error);
    res.status(500).json({
      error: 'Errore nel recupero delle informazioni di debug',
      message: error.message
    });
  }
});

export { router as dashboardRouter }; 