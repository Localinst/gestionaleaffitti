import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Modifica la configurazione per utilizzare il connection pooler di Supabase
// che supporta IPv4 invece della connessione diretta
const pool = new Pool({
  user: process.env.DB_USER,
  // Aggiungi il suffisso "-pooler" al nome host per utilizzare il connection pooler
  host: `${process.env.DB_HOST?.replace('db.', 'db-pooler.')}`,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: {
    rejectUnauthorized: false // necessario per connessioni con Supabase
  }
});

// Log per debug
console.log('Configurazione database con connection pooler:', {
  host: `${process.env.DB_HOST?.replace('db.', 'db-pooler.')}`,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: 'configurato'
});

// Gestione errori del pool
pool.on('error', (err) => {
  console.error('Errore nel pool di connessione:', err);
});

export default pool; 