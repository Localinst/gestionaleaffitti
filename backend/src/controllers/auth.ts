import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import jwt from 'jsonwebtoken';
import { generateToken } from '../middleware/auth';

// JWT Secret - con verifica
const JWT_SECRET = process.env.JWT_SECRET;

// Verifichiamo la presenza del JWT_SECRET
if (!JWT_SECRET) {
  console.error('ERRORE CRITICO: JWT_SECRET non è definito nelle variabili d\'ambiente.');
}

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

    // Ruolo predefinito per i nuovi utenti
    const defaultRole = 'user';
    const userName = data.user.user_metadata.full_name || name; // Usa il nome fornito come fallback

    // Genera il token JWT con il ruolo predefinito
    const token = generateToken(
      data.user.id,
      data.user.email || '',
      userName,
      defaultRole // Passa il ruolo predefinito
    );

    // Imposta lo stato di sottoscrizione a trialing per i nuovi utenti
    try {
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        data.user.id,
        {
          // Marca l'utente come in prova; la logica che calcola i 14 giorni
          // utilizza la data di creazione e/o questi campi per determinare lo stato
          user_metadata: {
            ...data.user.user_metadata,
            subscription_status: 'trialing'
          }
        }
      );

      if (updateError) {
        console.warn('Non è stato possibile impostare lo stato trial per il nuovo utente:', updateError);
      }
    } catch (err) {
      console.error('Errore durante l\'impostazione dello stato trial:', err);
    }

    // Invia la risposta con il token e il ruolo predefinito
    res.status(201).json({
      message: 'Registrazione completata con successo',
      user: {
        id: data.user.id,
        name: userName,
        email: data.user.email,
        role: defaultRole // Includi il ruolo predefinito nella risposta
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

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email e password sono obbligatori.' 
      });
    }

    console.log('Tentativo di login backend per:', email);

    try {
      // 1. Autentica l'utente con Supabase
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        console.error('Errore durante il login con Supabase:', signInError);
        return res.status(401).json({ 
          error: 'Credenziali non valide. Controlla email e password.' 
        });
      }

      if (!signInData.user) {
        return res.status(401).json({ 
          error: 'Utente non trovato dopo il login.' // Messaggio più specifico
        });
      }
      
      const userId = signInData.user.id;
      const userEmail = signInData.user.email || ''; // Salva email originale
      
      // 2. Recupera i dati completi dell'utente (inclusi i metadati) usando l'ID
      //    Usiamo supabase.auth.admin che opera con i privilegi di servizio
      const { data: adminUserData, error: adminUserError } = await supabase.auth.admin.getUserById(userId);
      
      if (adminUserError) {
          console.error('Errore durante il recupero dei dati utente admin:', adminUserError);
          // Non bloccare il login, ma usa valori di default e logga l'errore
          // Rimosso toast({ title: "Attenzione", description: "Impossibile recuperare i dettagli completi dell'utente.", variant: "warning" }); 
      }
      
      if (!adminUserData || !adminUserData.user) {
          console.error('Dati utente admin non trovati per ID:', userId);
          // Non bloccare il login, usa valori di default
          // Rimosso toast({ title: "Attenzione", description: "Dati utente dettagliati non trovati.", variant: "warning" }); 
      }

      // Leggi il ruolo da app_metadata dell'utente recuperato, default a 'user'
      const userRole = adminUserData?.user?.app_metadata?.role || 'user';
      // Leggi il nome dai metadati utente standard, fallback all'email
      const userName = adminUserData?.user?.user_metadata?.full_name || userEmail;

      // *** Log di Debug Modificato ***
     // *** Fine Log di Debug ***

      // Genera il token JWT includendo il ruolo
      const token = generateToken(
        userId,
        userEmail,
        userName,
        userRole // Passa il ruolo letto
      );

      console.log(`Login backend completato con successo per: ${userEmail}, Ruolo: ${userRole}`);

      // Invia la risposta con il token e il ruolo corretto
      res.status(200).json({
        message: 'Login effettuato con successo',
        user: {
          id: userId,
          name: userName,
          email: userEmail,
          role: userRole // Includi il ruolo effettivo nella risposta
        },
        token
      });
    } catch (operationError) { // Rinominato per chiarezza
      console.error('Errore operativo durante il login:', operationError);
      return res.status(500).json({ 
        error: 'Errore durante l\'autenticazione. Riprova più tardi.' 
      });
    }
  } catch (requestError: any) { // Rinominato per chiarezza
    console.error('Errore nella gestione della richiesta di login:', requestError);
    res.status(500).json({ error: 'Errore server durante il login. Riprova più tardi.' });
  }
};

/**
 * Controller per il logout
 */
export const logout = async (req: Request, res: Response) => {
  try {
    // Il logout avviene solo lato client rimuovendo il token
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

/**
 * Controller per cambiare la password dell'utente autenticato
 */
export const changePassword = async (req: Request, res: Response) => {
  // Il middleware `authenticate` ha già aggiunto req.user
  if (!req.user || !req.user.id || !req.user.email) {
    return res.status(401).json({ error: 'Utente non autenticato correttamente.' });
  }

  const userId = req.user.id;
  const userEmail = req.user.email;
  const { currentPassword, newPassword } = req.body;

  // Validazione input base
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Password attuale e nuova password sono richieste.' });
  }
  if (newPassword.length < 6) {
     return res.status(400).json({ error: 'La nuova password deve essere lunga almeno 6 caratteri.' });
  }

  try {
    console.log(`[AUTH] Tentativo cambio password per utente: ${userEmail} (ID: ${userId})`);
    
    // 1. Verifica la password attuale
    console.log(`[AUTH] Verifica password attuale per ${userEmail}...`);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: currentPassword,
    });

    if (signInError) {
      console.warn(`[AUTH] Verifica password attuale fallita per ${userEmail}:`, signInError.message);
      return res.status(401).json({ error: 'La password attuale non è corretta.' });
    }
    console.log(`[AUTH] Password attuale verificata con successo per ${userEmail}.`);

    // 2. Aggiorna alla nuova password usando i privilegi admin
    console.log(`[AUTH] Aggiornamento password per utente ID: ${userId}...`);
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      console.error(`[AUTH] Errore durante l'aggiornamento password Supabase per ID ${userId}:`, updateError);
      return res.status(500).json({ error: 'Errore durante l\'aggiornamento della password.', details: updateError.message });
    }

    // Verifica (opzionale ma buona pratica) che l'aggiornamento abbia restituito un utente
    if (!updateData || !updateData.user) {
         console.error(`[AUTH] Nessun dato utente restituito dopo l'aggiornamento password per ID ${userId}`);
         // Potrebbe non essere un errore critico se l'update non restituisce l'utente, ma logghiamolo.
         // Considera se restituire 500 o 200 qui a seconda del comportamento atteso.
    }

    console.log(`[AUTH] Password aggiornata con successo per utente: ${userEmail} (ID: ${userId})`);
    res.status(200).json({ message: 'Password aggiornata con successo.' });

  } catch (error: any) {
    console.error(`[AUTH] Errore non gestito durante cambio password per ${userEmail}:`, error);
    res.status(500).json({ error: 'Errore server imprevisto durante il cambio password.', details: error.message });
  }
}; 