import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { propertiesRouter } from './routes/properties';
import { tenantsRouter } from './routes/tenants';
import { transactionsRouter } from './routes/transactions';
import { dashboardRouter } from './routes/dashboard';
import { authRouter } from './routes/auth';
import { reportsRouter } from './routes/reports';
import { authenticate } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:8080';

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

// Route di test per verificare che il server funzioni
app.get('/api/ping', (req, res) => {
  return res.json({
    message: 'Server API disponibile',
    timestamp: new Date().toISOString(),
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server configurato per accettare richieste da origini definite nella lista allowedOrigins`);
}); 