import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Verifica se utilizzare l'URL di connessione diretto o il pooler
const SUPABASE_DB_HOST = process.env.DB_HOST || "db.fdufcrgckojbaghdvhgj.supabase.co";
// L'ID del progetto è l'identificativo nella URL, ad esempio fdufcrgckojbaghdvhgj
const PROJECT_ID = SUPABASE_DB_HOST.split('.')[1] || 'fdufcrgckojbaghdvhgj';

// Controlla se è definito un URL del pooler completo
const POOLER_URL = process.env.POOLER_URL;

// Definisco un'interfaccia per il tipo di configurazione che include connectionString
interface ExtendedPoolConfig extends PoolConfig {
  connectionString?: string;
}

// Configurazione di base che potrebbe essere sovrascritta
let poolConfig: ExtendedPoolConfig = {
  user: process.env.DB_USER || 'postgres',
  host: SUPABASE_DB_HOST,
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: {
    rejectUnauthorized: false
  }
};

// Prova a usare la connessione diretta prima
console.log('Tentativo di connessione diretta al database:', SUPABASE_DB_HOST);

// Se viene fornito un URL del database completo, usa quello
if (process.env.DATABASE_URL) {
  console.log('Utilizzo DATABASE_URL fornito');
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  };
}

// Crea il pool di connessione
const pool = new Pool(poolConfig);

// Log della configurazione
console.log('Configurazione database:', {
  host: poolConfig.host || 'da connection string',
  database: poolConfig.database || 'da connection string',
  port: poolConfig.port || 'da connection string',
  user: poolConfig.user || 'da connection string',
  ssl: poolConfig.ssl ? 'configurato' : 'non configurato'
});

// Gestione degli errori di connessione
pool.on('error', (err) => {
  console.error('Errore imprevisto nel pool di connessione:', err);
});

// Test di connessione iniziale
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✓ Connessione al database riuscita!');
    const result = await client.query('SELECT version()');
    console.log('Versione database:', result.rows[0].version);
    client.release();
    return true;
  } catch (err) {
    console.error('✗ Errore nella connessione al database:', err);
    
    // Se fallisce e c'è un POOLER_URL, prova con quello
    if (POOLER_URL && !process.env.DATABASE_URL) {
      console.log('Tentativo con DATABASE_URL...');
      // Aggiorna la configurazione per usare la connessione diretta
      pool.end();
      
      // Usa la connection string diretta
      const directPoolConfig: ExtendedPoolConfig = {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        }
      };
      
      const directPool = new Pool(directPoolConfig);
      
      try {
        const client = await directPool.connect();
        console.log('✓ Connessione con DATABASE_URL riuscita!');
        const result = await client.query('SELECT version()');
        console.log('Versione database:', result.rows[0].version);
        client.release();
        return true;
      } catch (directErr) {
        console.error('✗ Anche la connessione con DATABASE_URL fallita:', directErr);
        return false;
      }
    }
    
    return false;
  }
}

// Esegui il test di connessione all'avvio
testConnection();

export default pool; 