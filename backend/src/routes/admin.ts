import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { supabase } from '../lib/supabase'; // Client backend con service_role

// Interfaccia per la richiesta autenticata (potrebbe già esistere altrove)
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const router = Router();

// Proteggiamo tutte le rotte di questo file
router.use(authenticate); 
router.use(authorize(['admin'])); // Solo gli admin possono accedere

/**
 * GET /api/admin/users
 * Recupera la lista degli utenti (solo per admin)
 */
router.get('/users', async (req: AuthenticatedRequest, res: Response) => {
  console.log(`[ADMIN API] Richiesta ricevuta da ${req.user?.email} per GET /users`);
  try {
    // Recupera gli utenti usando la funzione admin specifica
    // Aggiungere paginazione se necessario per gestire molti utenti
    const { data: { users }, error } = await supabase.auth.admin.listUsers({
      page: 1, // Esempio: prima pagina
      perPage: 1000, // Esempio: massimo 1000 utenti (limite Supabase di default)
    });

    if (error) {
      console.error('Errore durante il recupero degli utenti (listUsers):', error);
      return res.status(500).json({ error: 'Errore interno durante il recupero degli utenti.', details: error.message });
    }

    // Formatta i dati per corrispondere all'interfaccia User del frontend
    const formattedUsers = users.map(user => ({
      id: user.id,
      // Usa ?? per concatenare fallback in modo più pulito
      name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'N/A',
      email: user.email ?? 'N/A',
      createdAt: user.created_at,
      lastLogin: user.last_sign_in_at,
      status: (user as any).banned_until ? 'inactive' : (user.email_confirmed_at ? 'active' : 'pending')
    }));

    console.log(`[ADMIN API] Restituiti ${formattedUsers.length} utenti.`);
    res.status(200).json(formattedUsers);

  } catch (error: any) {
    console.error('Errore non gestito in GET /api/admin/users:', error);
    res.status(500).json({ error: 'Errore server imprevisto.', details: error.message });
  }
});

export default router; 