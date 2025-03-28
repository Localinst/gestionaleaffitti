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

// Configurazione CORS più sicura
app.use(cors({
  origin: function(origin: string | undefined, callback: (err: Error | null, origin?: string | boolean) => void) {
    // Per richieste senza origin (come quelle da Postman o cURL)
    if (!origin) {
      if (process.env.NODE_ENV === 'production') {
        return callback(new Error('Non sono consentite richieste senza origine in produzione'), false);
      } else {
        return callback(null, true);
      }
    }
    
    // Controlla se l'origin è nella lista dei permessi
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, origin);
    } else {
      // In produzione, rifiuta origini non autorizzate
      callback(new Error('Origine non autorizzata dal CORS'), false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware di debug per logging delle richieste
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - Origin: ${req.headers.origin}`);
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
    origin: req.headers.origin
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
  console.log(`Server configurato per accettare richieste dai seguenti domini:`);
  console.log(allowedOrigins);
}); 