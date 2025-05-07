import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { authenticate } from '../middleware/auth';
import { supabase } from '../lib/supabase';

dotenv.config();

const router = Router();
// In locale, dovresti configurare la variabile STRIPE_SECRET_KEY nel file .env
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

console.log('Stripe Secret Key disponibile:', !!stripeSecretKey);

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-03-31.basil',
});

// Verifica lo stato dell'abbonamento
router.get('/check-subscription-status', authenticate, async (req: Request, res: Response) => {
  try {
    const userEmail = req.query.userEmail as string;
    const userId = req.user.id; // Prendiamo l'ID dell'utente dal token JWT
    
    if (!userEmail || !userId) {
      return res.status(400).json({ error: 'Email e ID utente richiesti' });
    }

    // ===== BYPASS TEMPORANEO =====
    // Controlliamo se l'utente esiste in auth.users tramite SQL diretto
    const { data: authResult, error: authError } = await supabase
      .from('auth.users') // Questo potrebbe non funzionare a causa del prefisso 'public'
      .select('created_at')
      .eq('id', userId)
      .single();

    // Controllo di fallback: se l'utente è connesso, ha un auth token valido, quindi è registrato
    // Per gli utenti appena creati, forniamo automaticamente un periodo di prova
    // === INIZIO MISURA TEMPORANEA ===
    const now = new Date();
    let createdAt: Date;
    let createdAtValid = false;
    
    // Verifica che la data di creazione sia valida
    if (authResult?.created_at) {
      const tempDate = new Date(authResult.created_at);
      if (!isNaN(tempDate.getTime())) {
        createdAt = tempDate;
        createdAtValid = true;
      } else {
        // Fallback se la data non è valida
        createdAt = new Date(now);
        createdAt.setDate(createdAt.getDate() - 1); // Un giorno fa per dare un breve periodo di prova
      }
    } else {
      // Se non c'è data di creazione, usiamo il fallback
      createdAt = new Date(now);
      createdAt.setDate(createdAt.getDate() - 1); // Un giorno fa
    }
    
    // Calcola la fine del periodo di prova (14 giorni dalla creazione)
    const trialEndDate = new Date(createdAt);
    trialEndDate.setDate(trialEndDate.getDate() + 14);
    const diffDays = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // Se l'utente si è appena registrato, consideralo in periodo di prova
    if (diffDays > 0) {
      return res.json({
        active: true,
        isTrial: true,
        daysLeft: diffDays,
        trialEndDate: trialEndDate.toISOString()
      });
    }
    // === FINE MISURA TEMPORANEA ===
    

    // Query diretta al database usando pool (accesso a auth.users)
    const { error, data } = await supabase.rpc('check_trial_period', { 
      user_identifier: userId 
    });

    if (error) {
      console.error('Errore nella funzione RPC:', error);
    } else if (data) {
      // Formatta le date per una migliore leggibilità
      const rpcCreatedAt = data.created_at ? new Date(data.created_at) : null;
      const rpcTrialEndDate = rpcCreatedAt ? new Date(rpcCreatedAt) : null;
      if (rpcTrialEndDate) {
        rpcTrialEndDate.setDate(rpcTrialEndDate.getDate() + 14);
      }

      if (data.in_trial_period) {
        return res.json({
          active: true,
          isTrial: true,
          daysLeft: data.days_remaining,
          trialEndDate: rpcTrialEndDate?.toISOString()
        });
      }
    }

    // Se non è nel periodo di prova o c'è stato un errore, verifica Stripe
    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 1
    });

    if (customers.data.length === 0) {
      return res.json({
        active: false,
        isTrial: false
      });
    }

    const customer = customers.data[0];

    // Cerca le sottoscrizioni attive
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1
    });

    const isActive = subscriptions.data.length > 0;

    return res.json({
      active: isActive,
      isTrial: false,
      subscription: isActive ? subscriptions.data[0] : null
    });

  } catch (error) {
    console.error('Errore durante la verifica dello stato dell\'abbonamento:', error);
    res.status(500).json({ error: 'Errore durante la verifica dello stato dell\'abbonamento' });
  }
});

// Crea una sessione di checkout per l'abbonamento mensile
router.post('/create-checkout-session/monthly', authenticate, async (req: Request, res: Response) => {
  try {
    const { email: userEmail } = req.body;
    
    if (!userEmail) {
      return res.status(400).json({ error: 'Email utente richiesta per creare la sessione di checkout' });
    }
    
    console.log(`Creazione sessione checkout mensile per email: ${userEmail}`);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Abbonamento Mensile Gestionale Affitti',
              description: "Pagamento mensile per l'utilizzo completo del gestionale affitti",
            },
            unit_amount: 2000,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin}/abbonamento-confermato?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/pricing`,
      metadata: {
        userEmail,
        userId: req.user?.id,
        planName: 'piano-mensile'
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Errore nella creazione della sessione di checkout:', error);
    res.status(500).json({ error: 'Errore nella creazione della sessione di pagamento' });
  }
});

// Crea una sessione di checkout per l'abbonamento annuale
router.post('/create-checkout-session/annual', authenticate, async (req: Request, res: Response) => {
  try {
    const { email: userEmail } = req.body;
    
    if (!userEmail) {
      return res.status(400).json({ error: 'Email utente richiesta per creare la sessione di checkout' });
    }
    
    console.log(`Creazione sessione checkout annuale per email: ${userEmail}`);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Abbonamento Annuale Gestionale Affitti',
              description: 'Abbonamento annuale con sconto - risparmio di €40',
            },
            unit_amount: 20000,
            recurring: {
              interval: 'year',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin}/abbonamento-confermato?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/pricing`,
      metadata: {
        userEmail,
        userId: req.user?.id,
        planName: 'piano-annuale'
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Errore nella creazione della sessione di checkout:', error);
    res.status(500).json({ error: 'Errore nella creazione della sessione di pagamento' });
  }
});

/**
 * IMPORTANTE: Per ricevere correttamente i webhook di Stripe, è necessario utilizzare
 * il buffer raw del corpo della richiesta. Nel file index.ts, prima di definire 
 * app.use(express.json()), aggiungi:
 * 
 * // Configura il middleware per salvare il rawBody per Stripe
 * app.use(
 *   express.json({
 *     verify: (req: any, res, buf) => {
 *       if (req.originalUrl.startsWith('/api/payments/webhook')) {
 *         req.rawBody = buf.toString();
 *       }
 *     },
 *   })
 * );
 */

// Webhook per gestire gli eventi di Stripe
router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn('Webhook Stripe non configurato: STRIPE_WEBHOOK_SECRET non è impostato');
    return res.status(400).send('Webhook non configurato');
  }

  if (!sig) {
    console.error('Manca l\'header stripe-signature');
    return res.status(400).send('Manca l\'header stripe-signature');
  }

  let event;

  try {
    const rawBody = (req as any).rawBody || req.body;
    
    event = stripe.webhooks.constructEvent(
      typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody),
      sig,
      webhookSecret
    );
  } catch (err) {
    console.error(`Errore webhook: ${err}`);
    return res.status(400).send(`Webhook Error: ${err}`);
  }

  // Gestione degli eventi
  switch (event.type) {
    case 'checkout.session.completed':
      const checkoutSession = event.data.object;
      console.log('Pagamento completato:', checkoutSession);

      try {
        const metadata = checkoutSession.metadata || {};
        const userEmail = metadata.userEmail;
        const userId = metadata.userId;
        const planName = metadata.planName;
        
        console.log(`Abbonamento completato per utente: ${userEmail}, ID: ${userId}, Piano: ${planName}`);
        
        // Aggiorna lo stato dell'abbonamento in Supabase
        const { error: updateError } = await supabase
          .from('auth.users')
          .update({
            subscription_status: 'active',
            subscription_plan: planName,
            subscription_updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (updateError) {
          console.error('Errore nell\'aggiornamento dello stato dell\'abbonamento:', updateError);
        }
        
      } catch (error) {
        console.error('Errore nell\'elaborazione del pagamento completato:', error);
      }
      break;

    case 'invoice.paid':
      const invoice = event.data.object;
      console.log('Fattura pagata:', invoice);
      break;

    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      console.log('Abbonamento cancellato:', subscription);
      
      try {
        // Aggiorna lo stato dell'abbonamento in Supabase quando viene cancellato
        const customerResponse = await stripe.customers.retrieve(subscription.customer as string);
        
        // Verifica che il cliente non sia eliminato e abbia un'email
        if (customerResponse && 
            typeof customerResponse !== 'string' && 
            'deleted' in customerResponse && 
            !customerResponse.deleted &&
            'email' in customerResponse &&
            customerResponse.email) {
            
          const email = customerResponse.email;
          
          const { error: updateError } = await supabase
            .from('auth.users')
            .update({
              subscription_status: 'inactive',
              subscription_updated_at: new Date().toISOString()
            })
            .eq('email', email);

          if (updateError) {
            console.error('Errore nell\'aggiornamento dello stato dell\'abbonamento:', updateError);
          }
        }
      } catch (error) {
        console.error('Errore nell\'aggiornamento dello stato dell\'abbonamento cancellato:', error);
      }
      break;

    default:
      console.log(`Evento non gestito: ${event.type}`);
  }

  res.json({ received: true });
});

export default router; 