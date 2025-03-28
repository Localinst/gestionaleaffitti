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

// Domini consentiti in un array per maggiore flessibilità
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:8081',
  'https://statuesque-malabi-216764.netlify.app',
  'https://gestionaleaffitti.netlify.app'
];

// Configurazione CORS che supporta credentials
app.use(cors({
  origin: function(origin, callback) {
    // Consenti richieste senza origin (come app mobile o curl)
    if (!origin) return callback(null, true);
    
    // Controlla se l'origin è nella lista dei permessi
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, origin);
    } else {
      // Per sviluppo, accetta anche altre origini sconosciute
      console.log('Richiesta da origine non nella whitelist:', origin);
      callback(null, origin);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware di debug per logging delle richieste
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - Origin: ${req.headers.origin}`);
  next();
});

// Middleware aggiuntivo per assicurarsi che gli header CORS siano corretti per le credenziali
app.use((req, res, next) => {
  // Imposta l'origin specifico invece del wildcard '*'
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
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
    origin: req.headers.origin,
    cors: 'enabled with credentials'
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
  console.log(`Server configurato per accettare richieste con credentials dai seguenti domini:`);
  console.log(allowedOrigins);
}); 