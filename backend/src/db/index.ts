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
  console.log('Utilizzo URL del pooler fornito');
  
  try {
    // Estrai i componenti manualmente anziché con URL parser per evitare problemi con caratteri speciali
    const connectionParts = parseConnectionString(POOLER_URL);
    if (connectionParts) {
      poolConfig = {
        user: connectionParts.user,
        password: connectionParts.password,
        host: connectionParts.host,
        port: connectionParts.port,
        database: connectionParts.database,
        ssl: {
          rejectUnauthorized: false
        }
      };
      console.log('Configurazione pooler estratta correttamente');
    }
  } catch (error) {
    console.error('Errore nel parsing dell\'URL del pooler:', error);
    console.log('Fallback alla connessione diretta al database');
  }
} else {
  console.log('Utilizzo connessione diretta al database:', SUPABASE_DB_HOST);
}

// Funzione per analizzare la connection string manualmente
function parseConnectionString(connectionString: string) {
  try {
    // Formato: postgres://user:password@host:port/database
    const regex = /postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
    const match = connectionString.match(regex);
    
    if (!match) {
      console.error('Formato della connection string non valido');
      return null;
    }
    
    return {
      user: match[1],
      password: match[2],
      host: match[3],
      port: parseInt(match[4]),
      database: match[5]
    };
  } catch (error) {
    console.error('Errore durante il parsing della connection string:', error);
    return null;
  }
}

// Crea il pool di connessione
const pool = new Pool(poolConfig);

// Log della configurazione
console.log('Configurazione database:', {
  host: poolConfig.host,
  database: poolConfig.database,
  port: poolConfig.port,
  user: poolConfig.user,
  ssl: poolConfig.ssl ? 'configurato' : 'non configurato'
});

// Gestione degli errori di connessione
pool.on('error', (err) => {
  console.error('Errore imprevisto nel pool di connessione:', err);
});

export default pool; 