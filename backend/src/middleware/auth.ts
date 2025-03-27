import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Estendi l'interfaccia Request per includere l'utente
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret';
const IS_DEV = process.env.NODE_ENV !== 'production';

const supabaseClient = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || '', // Modifica qui: usa ANON_KEY invece di SERVICE_KEY
  {
    auth: {
      persistSession: false, // Per operazioni server, non è necessario persistere
    }
  }
);

/**
 * Middleware per verificare l'autenticazione tramite JWT
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In modalità sviluppo, stampa informazioni utili per il debug
    if (IS_DEV) {
      console.log(`[${new Date().toISOString()}] Auth middleware - Path:`, req.path);
      console.log('Auth middleware - Method:', req.method);
      console.log('Auth middleware - Headers:', Object.keys(req.headers).join(', '));
      
      if (req.headers.authorization) {
        console.log('Auth middleware - Has Authorization header: Yes', 
          req.headers.authorization.substring(0, 20) + '...');
      } else {
        console.log('Auth middleware - Has Authorization header: No');
      }
      
      console.log('Auth middleware - Cookie count:', req.cookies ? Object.keys(req.cookies).length : 0);
    }
    
    // Ottieni il token dal cookie o dall'header Authorization
    let token = req.cookies?.authToken;
    
    if (!token && req.headers.authorization) {
      // Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
      const authHeader = req.headers.authorization;
      console.log('Auth middleware - Authorization header:', authHeader);
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      console.log('Auth middleware - Nessun token trovato');
      
      // In modalità sviluppo, consenti le richieste anche senza token
      if (IS_DEV) {
        console.log('Auth middleware - SVILUPPO: consentito accesso senza token');
        req.user = {
          id: '00000000-0000-4000-a000-000000000000', // UUID valido per testing
          email: 'sviluppo@esempio.com',
          name: 'Utente Test',
          role: 'admin'
        };
        next();
        return;
      }
      
      return res.status(401).json({ error: 'Accesso non autorizzato. Token mancante.' });
    }

    // Aggiungi questi log per migliorare il debug
    console.log('Token trovato:', token);
    try {
      // Verifica il token con la chiave segreta
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('Token decodificato:', decoded);
      
      // Assicurati che l'ID sia consistente (come stringa)
      if (decoded && typeof decoded === 'object') {
        if (decoded.id && typeof decoded.id !== 'string') {
          decoded.id = String(decoded.id);
        }
        
        console.log('User ID estratto dal token:', decoded.id);
      }
      
      // Verifica anche la sessione Supabase se necessario
      // Se usi Supabase per l'autenticazione, potresti dover richiamare 
      // le API di Supabase per verificare la sessione
      
      req.user = decoded;
      next();
    } catch (error) {
      console.error('Errore nella verifica del token:', error);
      
      // In modalità sviluppo, consenti le richieste anche con token non valido
      if (IS_DEV) {
        console.log('Auth middleware - SVILUPPO: consentito accesso nonostante token non valido');
        req.user = {
          id: '00000000-0000-4000-a000-000000000000', // UUID valido per testing
          email: 'sviluppo@esempio.com',
          name: 'Utente Test',
          role: 'admin'
        };
        next();
        return;
      }
      
      return res.status(401).json({ error: 'Token non valido o scaduto' });
    }
  } catch (error) {
    console.error('Errore di autenticazione:', error);
    
    // In modalità sviluppo, consenti le richieste anche in caso di errore
    if (IS_DEV) {
      console.log('Auth middleware - SVILUPPO: consentito accesso nonostante errore');
      req.user = {
        id: '00000000-0000-4000-a000-000000000000', // UUID valido per testing
        email: 'sviluppo@esempio.com',
        name: 'Utente Test',
        role: 'admin'
      };
      next();
      return;
    }
    
    res.status(401).json({ error: 'Token non valido o scaduto.' });
  }
};

/**
 * Middleware per verificare il ruolo dell'utente
 */
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Accesso non autorizzato. Effettua il login.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Non hai i permessi necessari per accedere a questa risorsa.' });
    }

    next();
  };
};

/**
 * Genera un token JWT
 */
export const generateToken = (userId: string, email: string, name: string): string => {
  return jwt.sign({ id: userId, email, name }, JWT_SECRET, { expiresIn: '1d' });
}; 