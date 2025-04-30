import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import Stripe from 'stripe';

// Estendi l'interfaccia Request per includere l'utente
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// JWT Secret - ora verifichiamo che sia presente
const JWT_SECRET = process.env.JWT_SECRET;
const IS_DEV = process.env.NODE_ENV !== 'production';

// Verifica che JWT_SECRET sia definito all'avvio dell'applicazione
if (!JWT_SECRET) {
  console.error('ERRORE CRITICO: JWT_SECRET non è definito nelle variabili d\'ambiente.');
  console.error('L\'applicazione non può avviarsi in modo sicuro. Imposta JWT_SECRET e riavvia.');
  process.exit(1); // Uscita con errore per evitare avvii insicuri
}

const supabaseClient = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || '',
  {
    auth: {
      persistSession: false,
    }
  }
);

// Costanti per Lemon Squeezy API
const API_URL = process.env.LEMON_SQUEEZY_API_URL || 'https://api.lemonsqueezy.com/v1';
const API_KEY = process.env.LEMON_SQUEEZY_API_KEY;

/**
 * Middleware per verificare l'autenticazione tramite JWT
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In modalità sviluppo, stampa informazioni utili per il debug
    if (IS_DEV) {
      console.log(`[${new Date().toISOString()}] Auth middleware - Path:`, req.path);
      console.log('Auth middleware - Method:', req.method);
      
      if (req.headers.authorization) {
        console.log('Auth middleware - Has Authorization header: Yes');
      } else {
        console.log('Auth middleware - Has Authorization header: No');
      }
    }
    
    // Ottieni il token dall'header Authorization (approccio standard per API REST)
    let token = null;
    
    if (req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      console.log('Auth middleware - Nessun token trovato');
      return res.status(401).json({ error: 'Accesso non autorizzato. Token mancante.' });
    }

    try {
      // Verifica il token con la chiave segreta
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Assicurati che l'ID sia consistente (come stringa)
      if (decoded && typeof decoded === 'object') {
        if (decoded.id && typeof decoded.id !== 'string') {
          decoded.id = String(decoded.id);
        }
      }
      
      req.user = decoded;
      next();
    } catch (error) {
      console.error('Errore nella verifica del token:', error);
      return res.status(401).json({ error: 'Token non valido o scaduto' });
    }
  } catch (error) {
    console.error('Errore di autenticazione:', error);
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
export const generateToken = (userId: string, email: string, name: string, role: string): string => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET non è definito nelle variabili d\'ambiente');
  }
  return jwt.sign({ id: userId, email, name, role }, JWT_SECRET, { expiresIn: '30d' });
};

/**
 * Middleware per verificare che l'utente ha un abbonamento attivo
 */
export const isSubscribed = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verifica se esiste l'utente nella richiesta
    if (!req.user) {
      return res.status(401).json({ message: 'Utente non autenticato' });
    }

    const userId = req.user.id;
    const userEmail = req.user.email;
    
    console.log(`Verifica abbonamento per utente: ID=${userId}, Email=${userEmail}`);

    try {
      // Cercare il customer in Stripe usando l'email
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
        apiVersion: '2025-03-31.basil',
      });
      
      // Cerca il customer in Stripe
      const customers = await stripe.customers.list({
        email: userEmail,
        limit: 1,
      });
      
      // Se non troviamo il customer, l'utente non ha un abbonamento
      if (customers.data.length === 0) {
        console.log(`Nessun customer Stripe trovato per l'email ${userEmail}`);
        return res.status(403).json({ 
          message: 'Accesso negato: non hai un abbonamento attivo',
          subscribed: false 
        });
      }
      
      const customerId = customers.data[0].id;
      
      // Cerca le sottoscrizioni attive per questo customer
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
      });
      
      console.log(`Trovate ${subscriptions.data.length} sottoscrizioni attive per il customer ${customerId}`);
      
      // Se l'utente non ha sottoscrizioni attive, nega l'accesso
      if (subscriptions.data.length === 0) {
        console.log(`Nessun abbonamento attivo trovato per l'utente ${userId} (${userEmail})`);
        return res.status(403).json({ 
          message: 'Accesso negato: non hai un abbonamento attivo',
          subscribed: false 
        });
      }

      console.log(`Utente ${userId} ha un abbonamento attivo`);
      next();
    } catch (error) {
      console.error('Errore nella verifica dell\'abbonamento:', error);
      return res.status(500).json({ 
        message: 'Errore durante la verifica dell\'abbonamento',
        error: error instanceof Error ? error.message : 'Errore sconosciuto'
      });
    }
  } catch (error) {
    console.error('Errore nella verifica dell\'abbonamento:', error);
    return res.status(500).json({ 
      message: 'Errore durante la verifica dell\'abbonamento',
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    });
  }
}; 