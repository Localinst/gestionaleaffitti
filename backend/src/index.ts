import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import timeout from 'connect-timeout';
import { propertiesRouter } from './routes/properties';
import { tenantsRouter } from './routes/tenants';
import { transactionsRouter } from './routes/transactions';
import { dashboardRouter } from './routes/dashboard';
import { authRouter } from './routes/auth';
import { reportsRouter } from './routes/reports';
import contractsRouter from './routes/contracts';
import activitiesRouter from './routes/activities';
import { tourismRouter } from './routes/tourism';
import integrationsRouter from './routes/integrations';
import { authenticate } from './middleware/auth';
import { startSyncService } from './services/sync-service';
import paymentsRouter from './routes/payments';

// Definisci solo requestId, timedout è già definito da connect-timeout
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:8080';

// Timeout globale per le richieste (20 secondi)
app.use(timeout('20s'));
app.use(haltOnTimedout);

// Configura il middleware per salvare il rawBody per Stripe
app.use(
  express.json({
    verify: (req: any, res, buf) => {
      if (req.originalUrl.startsWith('/api/payments/webhook')) {
        req.rawBody = buf.toString();
      }
    },
  })
);

// Tracciamento delle richieste attive per identificare richieste zombie
const activeRequests = new Map<string, { 
  startTime: number, 
  url: string, 
  method: string,
  timeout: NodeJS.Timeout 
}>();

// Domini consentiti
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:8081',
  'https://statuesque-malabi-216764.netlify.app',
  'https://gestionaleaffitti.netlify.app'
];

// Aggiungiamo un controllo per verificare se siamo in produzione
const isProduction = process.env.NODE_ENV === 'production';

// Configurazione CORS con gestione esplicita delle richieste preflight
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Log dettagliato dell'origine
  console.log(`CORS check - Richiesta da origine: ${origin || 'nessuna origine'}`);
  
  // In produzione, controlliamo la whitelist. In sviluppo, accettiamo qualsiasi origine
  const isAllowed = origin && (
    !isProduction || 
    allowedOrigins.includes(origin) || 
    origin.includes('netlify.app') || 
    origin.includes('localhost')
  );
  
  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    // Log dettagliato dell'impostazione header
    console.log(`CORS: Impostato Access-Control-Allow-Origin a ${origin}`);
  } else if (!origin) {
    // Se non c'è origine (ad es. richieste curl, postman), consentire comunque
    res.setHeader('Access-Control-Allow-Origin', '*');
    console.log('CORS: Nessuna origine, impostato Access-Control-Allow-Origin a *');
  } else {
    console.log(`CORS: Origine non consentita: ${origin}`);
  }
  
  // Imposta sempre questi headers indipendentemente dall'origine
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 ore
  
  next();
});

// Middleware di debug per logging delle richieste
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - Origin: ${req.headers.origin || 'nessuna origine'}`);
  next();
});

// Gestione esplicita di tutte le richieste OPTIONS
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  
  // Log dettagliato della richiesta OPTIONS
  console.log(`Richiesta OPTIONS ricevuta - Origin: ${origin || 'nessuna origine'}`);
  console.log(`Headers: ${JSON.stringify(req.headers)}`);

  // Imposta le intestazioni CORS per la risposta preflight
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 ore
    
    console.log('Intestazioni CORS impostate per risposta preflight');
  } else {
    console.log(`Origine non consentita: ${origin}`);
  }
  
  // Termina la richiesta OPTIONS con status 204 No Content
  return res.status(204).end();
});

// Non è necessario il middleware dei cookie poiché ora usiamo solo token JWT in header
// app.use(cookieParser());

app.use(express.json());

// Aggiungi un endpoint di ping speciale che mostra anche gli header della richiesta
app.get('/api/cors-test', (req, res) => {
  const requestHeaders = req.headers;
  const responseHeaders = res.getHeaders();
  
  console.log('CORS Test - Request Headers:', JSON.stringify(requestHeaders));
  console.log('CORS Test - Response Headers:', JSON.stringify(responseHeaders));
  
  return res.json({
    message: 'CORS Test OK',
    timestamp: new Date().toISOString(),
    requestHeaders,
    responseHeaders,
    origin: req.headers.origin || 'nessuna origine'
  });
});

// Rotte pubbliche
app.use('/api/auth', authRouter);

// Rotte protette
app.use('/api/properties', authenticate, propertiesRouter);
app.use('/api/tenants', authenticate, tenantsRouter);
app.use('/api/transactions', authenticate, transactionsRouter);
app.use('/api/dashboard', authenticate, dashboardRouter);
app.use('/api/reports', authenticate, reportsRouter);
app.use('/api/contracts', authenticate, contractsRouter);
app.use('/api/activities', authenticate, activitiesRouter);
app.use('/api/tourism', authenticate, tourismRouter);
app.use('/api/integrations', authenticate, integrationsRouter);
app.use('/api/payments', authenticate, paymentsRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server configurato per accettare richieste da origini definite nella lista allowedOrigins`);
  
  // Avvia il servizio di sincronizzazione in produzione
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_SYNC === 'true') {
    startSyncService();
  } else {
    console.log('Servizio di sincronizzazione disabilitato in ambiente di sviluppo');
    console.log('Per abilitarlo, imposta ENABLE_SYNC=true nelle variabili d\'ambiente');
  }
});

function haltOnTimedout(req: any, res: any, next: any) {
  if (!req.timedout) next();
  else {
    console.error(`[TIMEOUT] ${req.method} ${req.originalUrl}`);
    
    // Chiudi esplicitamente la richiesta
    if (!res.headersSent) {
      res.status(408).json({ error: 'Request timeout' });
    }
    
    // Pulisci dalle richieste attive
    if (req.requestId && activeRequests.has(req.requestId)) {
      const request = activeRequests.get(req.requestId);
      if (request) {
        clearTimeout(request.timeout);
      }
      activeRequests.delete(req.requestId);
    }
  }
}

// Middleware per monitorare le richieste attive
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = Date.now() + Math.random().toString(36).substring(2, 15);
  const startTime = Date.now();
  
  // Mantieni traccia della richiesta
  req.requestId = requestId;
  activeRequests.set(requestId, {
    startTime,
    url: req.originalUrl,
    method: req.method,
    // Imposta un timeout per forzare la terminazione delle richieste zombie
    timeout: setTimeout(() => {
      console.error(`[ZOMBIE REQUEST] Richiesta ${requestId} in corso da ${Date.now() - startTime}ms: ${req.method} ${req.originalUrl}`);
      
      // Registra tutte le richieste attive per il debug
      console.log(`Richieste attive (${activeRequests.size}):`, 
        Array.from(activeRequests.entries())
          .map(([id, r]) => `${id}: ${r.method} ${r.url} (${Date.now() - r.startTime}ms)`)
      );
      
      // Se la richiesta è ancora attiva, forza la terminazione
      if (activeRequests.has(requestId)) {
        console.error(`Terminazione forzata della richiesta zombie: ${requestId}`);
        res.status(408).json({ error: 'Request timeout' });
      }
    }, 10000) // 10 secondi
  });
  
  // Registra il completamento della richiesta
  res.on('finish', () => {
    const request = activeRequests.get(requestId);
    if (request) {
      clearTimeout(request.timeout);
      activeRequests.delete(requestId);
      const duration = Date.now() - request.startTime;
      
      // Log solo per richieste lente (> 1000ms)
      if (duration > 1000) {
        console.log(`[SLOW] ${req.method} ${req.originalUrl} completata in ${duration}ms`);
      }
    }
  });
  
  next();
}); 