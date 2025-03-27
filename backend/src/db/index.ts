import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';
import dns from 'dns';

// Forza Node.js a utilizzare IPv4
process.env.NODE_OPTIONS = '--dns-result-order=ipv4first';
// Forza il resolver DNS a usare solo IPv4
dns.setDefaultResultOrder('ipv4first');

dotenv.config();

// Funzione per verificare e correggere la stringa di connessione
const createSafeConnectionString = (connectionString: string) => {
  try {
    // Prova a creare un URL per vedere se è valido
    new URL(connectionString);
    return connectionString;
  } catch (error) {
    // Se la stringa non è un URL valido, prova a correggerla
    console.log('Correzione della stringa di connessione in corso...');
    
    // Formato tipico: postgres://username:password@host:port/database
    const match = connectionString.match(/^postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/);
    
    if (match) {
      const [, username, password, host, port, database] = match;
      // Codifica la password per URL
      const encodedPassword = encodeURIComponent(password);
      const safeConnectionString = `postgres://${username}:${encodedPassword}@${host}:${port}/${database}`;
      console.log('Stringa di connessione corretta generata');
      return safeConnectionString;
    }
    
    console.log('Impossibile correggere la stringa di connessione');
    return connectionString;
  }
};

// Verifica se utilizzare l'URL di connessione diretto o il pooler
const SUPABASE_DB_HOST = process.env.DB_HOST || "db.fdufcrgckojbaghdvhgj.supabase.co";
// L'ID del progetto è l'identificativo nella URL, ad esempio fdufcrgckojbaghdvhgj
const PROJECT_ID = SUPABASE_DB_HOST.split('.')[1] || 'fdufcrgckojbaghdvhgj';

// Controlla se è definito un URL del pooler completo
const POOLER_URL = process.env.POOLER_URL;

// Definisco un'interfaccia per il tipo di configurazione che include connectionString
interface ExtendedPoolConfig extends PoolConfig {
  connectionString?: string;
  // Proprietà avanzate per pg-node
  family?: number; // 4 per IPv4, 6 per IPv6
}

// SOLUZIONE PER FORZARE IPV4: Ricava l'indirizzo IPv4 dal nome host
async function getIPv4Address(hostname: string): Promise<string> {
  return new Promise((resolve, reject) => {
    dns.lookup(hostname, { family: 4 }, (err, address) => {
      if (err) {
        console.error(`Errore risolvendo ${hostname} in IPv4:`, err);
        reject(err);
      } else {
        console.log(`Risolto ${hostname} in IPv4: ${address}`);
        resolve(address);
      }
    });
  });
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
  },
  // Forza l'uso di IPv4
  family: 4
};

// Log della configurazione iniziale
console.log('Tentativo di connessione diretta al database:', SUPABASE_DB_HOST);

// Se viene fornito un URL del database completo, usa quello
if (process.env.DATABASE_URL) {
  console.log('Utilizzo DATABASE_URL fornito');
  
  const safeConnectionString = createSafeConnectionString(process.env.DATABASE_URL);
  
  poolConfig = {
    connectionString: safeConnectionString,
    ssl: {
      rejectUnauthorized: false
    },
    // Forza l'uso di IPv4
    family: 4
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
  ssl: poolConfig.ssl ? 'configurato' : 'non configurato',
  family: poolConfig.family
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
    
    // SOLUZIONE ALTERNATIVA: Prova a risolvere manualmente l'indirizzo IPv4 e connettersi
    if (poolConfig.host && !poolConfig.connectionString) {
      try {
        console.log('Tentativo di risoluzione IPv4 manuale...');
        const ipv4Address = await getIPv4Address(poolConfig.host);
        
        // Crea un nuovo pool con l'indirizzo IPv4
        pool.end();
        const ipv4PoolConfig: ExtendedPoolConfig = {
          ...poolConfig,
          host: ipv4Address
        };
        
        console.log('Tentativo con indirizzo IPv4 risolto:', ipv4Address);
        const ipv4Pool = new Pool(ipv4PoolConfig);
        
        const ipv4Client = await ipv4Pool.connect();
        console.log('✓ Connessione con IPv4 risolto riuscita!');
        const result = await ipv4Client.query('SELECT version()');
        console.log('Versione database:', result.rows[0].version);
        ipv4Client.release();
        return true;
      } catch (ipv4Err) {
        console.error('✗ Anche la connessione con IPv4 risolto fallita:', ipv4Err);
      }
    }
    
    // Se fallisce e c'è DATABASE_URL, prova con quello come fallback
    if (process.env.DATABASE_URL && !poolConfig.connectionString) {
      console.log('Tentativo con DATABASE_URL...');
      // Aggiorna la configurazione per usare la connessione diretta
      pool.end();
      
      // Usa la connection string diretta
      const directPoolConfig: ExtendedPoolConfig = {
        connectionString: createSafeConnectionString(process.env.DATABASE_URL),
        ssl: {
          rejectUnauthorized: false
        },
        family: 4
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
      }
    }
    
    return false;
  }
}

// Esegui il test di connessione all'avvio
testConnection();

export default pool; 