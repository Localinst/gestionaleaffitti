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

// Middleware
app.use(cors({
  origin: [
    CLIENT_URL,
    'http://localhost:5173', 
    'http://localhost:8080', 
    'http://localhost:8081',
    'https://gestionaleaffitti.netlify.app',
    'https://67e570f94387435b6d081ea9--statuesque-malabi-216764.netlify.app'
  ],
  credentials: true // Necessario per i cookie
}));

console.log('CORS configurato per accettare richieste da:', [
  CLIENT_URL,
  'http://localhost:5173', 
  'http://localhost:8080', 
  'http://localhost:8081',
  'https://gestionaleaffitti.netlify.app',
  'https://67e570f94387435b6d081ea9--statuesque-malabi-216764.netlify.app'
]);

app.use(express.json());
app.use(cookieParser());

// Rotte pubbliche
app.use('/api/auth', authRouter);

// Rotte protette
app.use('/api/properties', authenticate, propertiesRouter);
app.use('/api/tenants', authenticate, tenantsRouter);
app.use('/api/transactions', authenticate, transactionsRouter);
app.use('/api/dashboard', authenticate, dashboardRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Accettando richieste dal client: ${CLIENT_URL}`);
}); 