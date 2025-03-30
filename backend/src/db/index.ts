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
    const match = connectionString.match(/^postgres(ql)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/);
    
    if (match) {
      const [, protocol, username, password, host, port, database] = match;
      // Codifica la password per URL
      const encodedPassword = encodeURIComponent(password);
      const protocolStr = protocol ? 'postgresql' : 'postgres';
      const safeConnectionString = `${protocolStr}://${username}:${encodedPassword}@${host}:${port}/${database}`;
      console.log('Stringa di connessione corretta generata');
      return safeConnectionString;
    }
    
    console.log('Impossibile correggere la stringa di connessione');
    return connectionString;
  }
};

// Ottieni l'ID del progetto Supabase dalla stringa di connessione o da altre fonti
const getProjectId = (): string => {
  try {
    if (process.env.DATABASE_URL) {
      const urlObj = new URL(process.env.DATABASE_URL);
      const hostParts = urlObj.hostname.split('.');
      // Nel formato standard di Supabase, il project ID è nella seconda parte dell'hostname
      if (hostParts.length >= 2) {
        return hostParts[1];
      }
    }
    
    // Fallback all'estrazione dall'URL Supabase
    if (process.env.SUPABASE_URL) {
      const urlObj = new URL(process.env.SUPABASE_URL);
      const hostParts = urlObj.hostname.split('.');
      if (hostParts.length >= 1) {
        return hostParts[0];
      }
    }
    
    // Valore hardcoded come fallback finale
    return 'fdufcrgckojbaghdvhgj';
  } catch (error) {
    console.error('Errore nell\'estrazione del project ID:', error);
    return 'fdufcrgckojbaghdvhgj';
  }
};

const PROJECT_ID = getProjectId();
console.log('Project ID individuato:', PROJECT_ID);

// Configurazione per l'utilizzo del Transaction Pooler (compatibile con IPv4)
const TRANSACTION_POOLER_HOST = `aws-0-eu-central-1.pooler.supabase.com`;
const TRANSACTION_POOLER_PORT = 6543;

// PRIMA TENTATIVO: Configurazione Transaction Pooler
async function setupTransactionPooler() {
  console.log('Tentativo di connessione tramite Transaction Pooler...');
  
  let connectionString: string;
  
  // Controlla se è già impostato un URL del pooler
  if (process.env.POOLER_URL) {
    console.log('Utilizzo POOLER_URL esplicitamente fornito');
    // Assicuriamoci che la password sia codificata correttamente
    try {
      const poolerUrl = process.env.POOLER_URL;
      // Estrai le parti dell'URL
      const urlMatch = poolerUrl.match(/^(postgresql):\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/);
      if (urlMatch) {
        const [, protocol, username, password, host, port, database] = urlMatch;
        // Codifica la password per URL
        const encodedPassword = encodeURIComponent(password);
        connectionString = `${protocol}://${username}:${encodedPassword}@${host}:${port}/${database}`;
        console.log('POOLER_URL con password codificata');
      } else {
        connectionString = poolerUrl;
        console.log('Formato POOLER_URL non riconosciuto, uso originale');
      }
    } catch (error) {
      console.error('Errore nella codifica della password di POOLER_URL:', error);
      connectionString = process.env.POOLER_URL;
    }
  } else {
    // Verifica se DATABASE_URL è già un URL del pooler
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('pooler.supabase.com')) {
      console.log('DATABASE_URL già configurato per il pooler');
      connectionString = process.env.DATABASE_URL;
    } else {
      // Costruisci una stringa di connessione del pooler
      console.log('Costruzione nuova stringa di connessione del pooler');
      connectionString = constructPoolerUrl();
      console.log('Stringa di connessione del pooler creata');
    }
  }
  
  // Configura il pool usando la stringa di connessione del pooler
  const poolerConfig = {
    connectionString: createSafeConnectionString(connectionString),
    // Forza l'uso di IPv4 come ulteriore sicurezza
    family: 4,
    // Configurazione del pool
    idleTimeoutMillis: 10000, // timeout di inattività ridotto a 10 secondi
    connectionTimeoutMillis: 5000, // timeout di connessione (5 secondi)
    maxUses: 5000, // ridotto il numero massimo di query per connessione prima del riciclo
    statement_timeout: 10000, // timeout delle query (10 secondi)
    query_timeout: 10000, // timeout delle query (10 secondi)
    allowExitOnIdle: true, // permette al pool di chiudersi quando è inattivo
    // Ricicla proattivamente le connessioni per evitare connessioni zombie
    idlePingInterval: 5000, // Verifica connessioni inattive ogni 5 secondi
    connectionRetryCount: 3, // Tentativi di riconnessione
    connectionRetryDelay: 1000 // Attesa tra tentativi in ms
  };
  
  console.log('Configurato per utilizzare il Transaction Pooler (compatibile con IPv4)');
  console.log('Stringa connessione utilizzata:', connectionString.replace(/:[^:@]+@/, ':****@'));

// Crea il pool di connessione
  const poolerPool = new Pool(poolerConfig);
  
  // Test di connessione
  try {
    console.log('Tentativo di connessione al Transaction Pooler...');
    const client = await poolerPool.connect();
    console.log('✓ Connessione al database tramite Transaction Pooler riuscita!');
    const result = await client.query('SELECT version()');
    console.log('Versione database:', result.rows[0].version);
    client.release();
    return poolerPool;
  } catch (err) {
    console.error('✗ Errore nella connessione al Transaction Pooler:', err);
    
    // Chiudi il pool per evitare memory leak
    poolerPool.end();
    
    // Tentativo di fallback alla connessione diretta
    console.log('Non è possibile connettersi tramite Transaction Pooler. Possibili cause:');
    console.log('1. La password nel pooler URL è errata');
    console.log('2. Il progetto Supabase non ha il Transaction Pooler abilitato');
    console.log('3. Le credenziali non hanno accesso al Transaction Pooler');
    
    // Prova con la connessione diretta
    return null;
  }
}

// Costruisci la stringa di connessione per il Transaction Pooler
const constructPoolerUrl = (): string => {
  const username = `postgres.${PROJECT_ID}`;
  const password = process.env.DB_PASSWORD || process.env.SUPABASE_DB_PASSWORD || '';
  const database = 'postgres';
  
  return `postgresql://${username}:${encodeURIComponent(password)}@${TRANSACTION_POOLER_HOST}:${TRANSACTION_POOLER_PORT}/${database}`;
};

// SECONDO TENTATIVO: Configurazione connessione diretta
async function setupDirectConnection() {
  console.log('Tentativo di connessione diretta al database...');
  
  // Configurazione per connessione diretta
  let directConfig: PoolConfig;
  
  if (process.env.DATABASE_URL) {
    // Usa la stringa di connessione fornita
    const safeConnectionString = createSafeConnectionString(process.env.DATABASE_URL);
    directConfig = {
      connectionString: safeConnectionString
    };
  } else {
    // Usa i parametri individuali
    directConfig = {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'db.fdufcrgckojbaghdvhgj.supabase.co',
      database: process.env.DB_NAME || 'postgres',
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '5432')
    };
  }
  
  console.log('Configurazione connessione diretta:', {
    connectionString: directConfig.connectionString ? 'impostato' : 'non impostato',
    host: directConfig.host || 'da connection string'
  });
  
  const directPool = new Pool(directConfig);
      
      try {
        const client = await directPool.connect();
    console.log('✓ Connessione diretta al database riuscita!');
        const result = await client.query('SELECT version()');
        console.log('Versione database:', result.rows[0].version);
        client.release();
    return directPool;
  } catch (err) {
    console.error('✗ Anche la connessione diretta fallita:', err);
    
    // Chiudi il pool per evitare memory leak
    directPool.end();
    
    // Non è possibile connettersi in nessun modo
    console.error('Non è possibile connettersi al database Supabase. Verifica:');
    console.error('1. Le credenziali sono corrette');
    console.error('2. La rete supporta il tipo di connessione (IPv4/IPv6)');
    console.error('3. Il database è attivo e raggiungibile');
    
    return null;
  }
}

// Funzione principale per ottenere una connessione valida
async function getDbPool() {
  // Prima prova con il Transaction Pooler (compatibile con IPv4)
  let pool = await setupTransactionPooler();
  
  // Se fallisce, prova con la connessione diretta
  if (!pool) {
    console.log('Fallback alla connessione diretta...');
    pool = await setupDirectConnection();
  }
  
  // Se entrambi falliscono, restituisci un pool dummy che genererà errori all'uso
  if (!pool) {
    console.error('CRITICO: Tutte le connessioni al database sono fallite!');
    
    // Crea un pool dummy che lancerà errori quando utilizzato
    pool = new Pool({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'postgres',
      database: 'postgres'
    });
    
    // Sovrascrivi il metodo connect per mostrare un errore chiaro
    const originalConnect = pool.connect.bind(pool);
    pool.connect = function() {
      console.error('ERRORE: Tentativo di connessione al database fallito. Database non configurato correttamente.');
      return originalConnect().then(() => {
        throw new Error('Connessione riuscita ma non dovrebbe essere possibile.');
      }).catch((err: Error) => {
        console.error('Dettagli errore di connessione:', err);
        throw new Error('Database non disponibile. Verificare la configurazione.');
      });
    };
  }
  
  // Gestione degli errori di connessione
  pool.on('error', (err: Error) => {
    console.error('Errore imprevisto nel pool di connessione:', err);
  });
  
  return pool;
}

// Esegui la funzione per ottenere un pool di connessione valido
let pool: Pool;

// Inizializza il pool in modo asincrono ma esporta un oggetto sincrono
getDbPool().then(p => {
  if (p) {
    pool = p;
    console.log('Pool di connessione al database inizializzato e pronto');
    
    // Pianifica riavvio periodico del pool per evitare connessioni zombie
    setupPoolMaintenance(p);
  } else {
    console.error('Impossibile inizializzare il pool di connessione al database');
  }
}).catch(err => {
  console.error('Errore durante l\'inizializzazione del pool di connessione:', err);
});

// Estensione dell'interfaccia Pool per aggiungere le proprietà necessarie
interface ExtendedPool extends Pool {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
}

// Funzione per impostare manutenzione periodica del pool
function setupPoolMaintenance(poolInstance: Pool) {
  // Ogni ora (3600000 ms) riavvia il pool per pulire tutte le connessioni
  const cleanupInterval = 3600000;
  
  console.log(`Pool maintenance configurata: cleanup ogni ${cleanupInterval/1000/60} minuti`);
  
  setInterval(async () => {
    try {
      console.log('Esecuzione manutenzione del pool di database...');
      
      // Accedi alle proprietà del pool in modo sicuro
      const extendedPool = poolInstance as ExtendedPool;
      const clientCount = extendedPool.totalCount;
      const idleCount = extendedPool.idleCount;
      
      console.log(`Pool prima del cleanup: totale=${clientCount}, inattivi=${idleCount}`);
      
      // Chiudi tutte le connessioni inattive
      if (idleCount > 0) {
        console.log(`Chiusura di ${idleCount} connessioni inattive`);
        
        // Non possiamo chiudere direttamente le connessioni inattive,
        // ma possiamo forzare il pool a ridurre le sue dimensioni
        try {
          // Forza rilascio di tutte le connessioni inattive
          await poolInstance.query('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = \'idle\'');
          console.log('Connessioni inattive terminate con successo');
        } catch (cleanupError) {
          console.error('Errore nel cleanup delle connessioni:', cleanupError);
        }
      }
      
      console.log('Pool maintenance completata');
    } catch (error) {
      console.error('Errore durante la manutenzione del pool:', error);
    }
  }, cleanupInterval);
}

// Funzione wrapper per gestire le query in modo sicuro
export const executeQuery = async <T>(
  queryFn: (client: any) => Promise<T>
): Promise<T> => {
  let client = null;
  try {
    client = await pool.connect();
    return await queryFn(client);
  } catch (error) {
    console.error('Errore durante l\'esecuzione della query:', error);
    throw error;
  } finally {
    if (client) {
      try {
        client.release();
        console.log('Client rilasciato al pool');
      } catch (releaseError) {
        console.error('Errore nel rilasciare il client:', releaseError);
      }
    }
  }
};

// Aggiungi monitoraggio del pool
const monitorPool = () => {
  if (pool) {
    // Accedi alle proprietà del pool in modo sicuro
    const extendedPool = pool as ExtendedPool;
    const totalCount = extendedPool.totalCount;
    const idleCount = extendedPool.idleCount;
    const waitingCount = extendedPool.waitingCount;
    
    console.log(`[Pool Monitor] Totale: ${totalCount}, Inattivi: ${idleCount}, In attesa: ${waitingCount}`);
    
    // Se ci sono molte connessioni e poche inattive, potrebbe esserci un leak
    if (totalCount > 15 && idleCount < 2) {
      console.warn('[Pool Monitor] ATTENZIONE: Possibile memory leak nelle connessioni al database!');
    }
  }
};

// Monitora il pool ogni 30 secondi
setInterval(monitorPool, 30000);

// Esporta un oggetto proxy che inoltrerà le chiamate al pool effettivo quando sarà pronto
const poolProxy = new Proxy({} as Pool, {
  get: function(target, prop) {
    if (!pool) {
      if (prop === 'connect' || prop === 'query') {
        return function() {
          return Promise.reject(new Error('Il pool di connessione al database non è ancora inizializzato'));
        };
      }
    }
    return pool[prop as keyof Pool];
  }
});

export default poolProxy; 