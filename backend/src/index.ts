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

// CORS Preflight
app.options('*', cors());

// Middleware CORS più semplificato
app.use(cors());

// Middleware di debug per logging delle richieste
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - Origin: ${req.headers.origin}`);
  next();
});

// Middleware aggiuntivo per assicurarsi che gli header CORS siano sempre presenti
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Gestione delle richieste preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

app.use(express.json());
app.use(cookieParser());

// Route di test per verificare che il server funzioni
app.get('/api/ping', (req, res) => {
  return res.json({
    message: 'Server API disponibile',
    timestamp: new Date().toISOString(),
    headers: req.headers,
    cors: 'enabled'
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
  console.log(`Server pronto ad accettare richieste da qualsiasi client (CORS permissivo)`);
}); 