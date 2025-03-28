import { Router } from 'express';
import { register, login, logout, getCurrentUser } from '../controllers/auth';
import { authenticate } from '../middleware/auth';

const router = Router();

// Log delle richieste al router auth
router.use((req, res, next) => {
  console.log(`Auth Router - ${req.method} ${req.path} - Origin: ${req.headers.origin || 'nessuna origine'}`);
  
  // Se è una richiesta OPTIONS, rispondi immediatamente
  if (req.method === 'OPTIONS') {
    console.log('Auth Router - Gestione richiesta OPTIONS');
    
    // Assicurati che l'origine sia impostata (dovrebbe già essere fatto dal middleware globale)
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Max-Age', '86400'); // 24 ore
    }
    
    return res.status(204).end();
  }
  
  next();
});

// Rotte pubbliche
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Rotte protette
router.get('/me', authenticate, getCurrentUser);

export { router as authRouter }; 