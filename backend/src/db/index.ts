import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Verifica se utilizzare l'URL di connessione diretto o il pooler
const SUPABASE_DB_HOST = process.env.DB_HOST || "db.fdufcrgckojbaghdvhgj.supabase.co";
// L'ID del progetto è l'identificativo nella URL, ad esempio fdufcrgckojbaghdvhgj
const PROJECT_ID = SUPABASE_DB_HOST.split('.')[1] || 'fdufcrgckojbaghdvhgj';

// Controlla se è definito un URL del pooler completo
const POOLER_URL = process.env.POOLER_URL;

let poolConfig = {
  user: process.env.DB_USER,
  host: SUPABASE_DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: {
    rejectUnauthorized: false
  }
};

// Se viene fornito un URL del pooler completo, usa quello invece
if (POOLER_URL) {
  console.log('Utilizzo URL del pooler fornito:', POOLER_URL);
  
  // Analizza l'URL per estrarre i componenti
  const url = new URL(POOLER_URL);
  
  poolConfig = {
    user: url.username,
    password: url.password,
    host: url.hostname,
    port: parseInt(url.port),
    database: url.pathname.substring(1), // Rimuove lo slash iniziale
    ssl: {
      rejectUnauthorized: false
    }
  };
} else {
  console.log('Utilizzo connessione diretta al database:', SUPABASE_DB_HOST);
}

// Crea il pool di connessione
const pool = new Pool(poolConfig);

// Log della configurazione
console.log('Configurazione database:', {
  host: poolConfig.host,
  database: poolConfig.database,
  port: poolConfig.port,
  ssl: poolConfig.ssl ? 'configurato' : 'non configurato'
});

// Gestione degli errori di connessione
pool.on('error', (err) => {
  console.error('Errore imprevisto nel pool di connessione:', err);
});

export default pool; 