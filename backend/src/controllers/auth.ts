import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import jwt from 'jsonwebtoken';
import { generateToken } from '../middleware/auth';

// JWT Secret 
const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret';

// Durata del cookie in millisecondi (1 giorno)
const COOKIE_MAX_AGE = 24 * 60 * 60 * 1000;

/**
 * Controller per la registrazione
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // Verifica che tutti i campi obbligatori siano presenti
    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: 'Dati mancanti. Email, password e nome sono obbligatori.' 
      });
    }

    // Registrazione dell'utente con Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        }
      }
    });

    if (error) {
      console.error('Errore durante la registrazione con Supabase:', error);
      return res.status(400).json({ 
        error: error.message || 'Errore durante la registrazione.' 
      });
    }

    if (!data.user) {
      return res.status(500).json({ 
        error: 'Errore durante la creazione dell\'utente.' 
      });
    }

    // Genera il token JWT
    const token = jwt.sign(
      { 
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata.full_name
      }, 
      JWT_SECRET, 
      { expiresIn: '1d' }
    );

    // Imposta il cookie
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: COOKIE_MAX_AGE,
      sameSite: 'lax'
    });

    // Invia la risposta
    res.status(201).json({
      message: 'Registrazione completata con successo',
      user: {
        id: data.user.id,
        name: data.user.user_metadata.full_name,
        email: data.user.email,
        role: 'user'
      },
      token
    });
  } catch (error: any) {
    console.error('Errore durante la registrazione:', error);
    res.status(500).json({ error: 'Errore durante la registrazione. Riprova più tardi.' });
  }
};

/**
 * Controller per il login
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Verifica che email e password siano presenti
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email e password sono obbligatori.' 
      });
    }

    console.log('Tentativo di login backend per:', email);

    // Login con Supabase
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Errore durante il login con Supabase:', error);
        return res.status(401).json({ 
          error: 'Credenziali non valide. Controlla email e password.' 
        });
      }

      if (!data.user) {
        return res.status(401).json({ 
          error: 'Utente non trovato.' 
        });
      }

      // Genera il token JWT con la funzione di utilità
      const token = generateToken(
        data.user.id,
        data.user.email || '',
        data.user.user_metadata?.full_name || ''
      );

      // Imposta il cookie
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: COOKIE_MAX_AGE,
        sameSite: 'lax'
      });

      console.log('Login backend completato con successo per:', data.user.email);

      // Invia la risposta
      res.status(200).json({
        message: 'Login effettuato con successo',
        user: {
          id: data.user.id,
          name: data.user.user_metadata?.full_name || email,
          email: data.user.email,
          role: 'user'
        },
        token
      });
    } catch (supabaseError) {
      console.error('Errore tecnico durante il login con Supabase:', supabaseError);
      return res.status(500).json({ 
        error: 'Errore durante l\'autenticazione. Riprova più tardi.' 
      });
    }
  } catch (error: any) {
    console.error('Errore durante il login:', error);
    res.status(500).json({ error: 'Errore durante il login. Riprova più tardi.' });
  }
};

/**
 * Controller per il logout
 */
export const logout = async (req: Request, res: Response) => {
  try {
    // Cancella il cookie
    res.clearCookie('authToken');
    
    // Logout da Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Errore durante il logout da Supabase:', error);
    }
    
    res.status(200).json({ message: 'Logout effettuato con successo' });
  } catch (error: any) {
    console.error('Errore durante il logout:', error);
    res.status(500).json({ error: 'Errore durante il logout. Riprova più tardi.' });
  }
};

/**
 * Controller per ottenere i dati dell'utente corrente
 */
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    // req.user è già impostato dal middleware di autenticazione
    if (!req.user) {
      return res.status(401).json({ error: 'Utente non autenticato.' });
    }
    
    res.status(200).json({ user: req.user });
  } catch (error: any) {
    console.error('Errore durante il recupero dei dati utente:', error);
    res.status(500).json({ error: 'Errore durante il recupero dei dati utente. Riprova più tardi.' });
  }
}; 