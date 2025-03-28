import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { propertiesRouter } from './routes/properties';
import { tenantsRouter } from './routes/tenants';
import { transactionsRouter } from './routes/transactions';
import { dashboardRouter } from './routes/dashboard';
import { authRouter } from './routes/auth';
import { authenticate } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:8080';

// Domini consentiti - conservati per riferimento futuro
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:8081',
  'https://statuesque-malabi-216764.netlify.app',
  'https://gestionaleaffitti.netlify.app'
];

// Configurazione CORS semplificata che ammette tutte le origini
app.use((req, res, next) => {
  // Permetti tutte le origini senza restrizioni
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Registro l'origine della richiesta per debug
  const origin = req.headers.origin;
  console.log(`Richiesta da origine: ${origin || 'nessuna origine'} - ${new Date().toISOString()}`);
  
  // Altri header CORS necessari
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  // Non impostare credentials su true quando si usa '*' come origin
  // res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 ore
  
  // Gestione richieste preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
});

// Middleware di debug per logging delle richieste
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - Origin: ${req.headers.origin || 'nessuna origine'}`);
  next();
});

// Non è necessario il middleware dei cookie poiché ora usiamo solo token JWT in header
// app.use(cookieParser());

app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server configurato per accettare richieste da TUTTE le origini (CORS aperto)`);
}); 