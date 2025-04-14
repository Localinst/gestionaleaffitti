import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';
import dns from 'dns';

// Forza Node.js a utilizzare esclusivamente IPv4
process.env.NODE_OPTIONS = '--dns-result-order=ipv4first';
dns.setDefaultResultOrder('ipv4first');

// Forza esplicitamente l'uso di IPv4
console.log('Forzando l\'uso esclusivo di IPv4 per le connessioni al database...');

// Forciamo TypeScript/Node a usare IPv4
if (dns.promises && typeof dns.promises.setDefaultResultOrder === 'function') {
  dns.promises.setDefaultResultOrder('ipv4first');
}

// Forza a livello TCP
process.env.FAMILY = 'ipv4';
process.env.UV_THREADPOOL_SIZE = '64';  // Aumenta il threadpool per operazioni di rete
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';  // Solo per test, rimuovere in produzione

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
  console.log('Il Transaction Pooler è ottimizzato per IPv4 ed è l\'opzione preferita');
  
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
    // Forza l'uso di IPv4 attraverso varie opzioni
    family: 4,  // Forza l'uso di IPv4 in Node.js
    // Assicurati che utilizzi IPv4
    host_type: 'ip4', // Forza il resolver DNS a usare IPv4
    ssl: { rejectUnauthorized: false },  // Potrebbe essere necessario per alcuni provider
    // Configurazione del pool
    max: 5, // ridotto drasticamente per evitare troppe connessioni simultanee
    min: 1,  // minimo di connessioni da mantenere
    idleTimeoutMillis: 5000, // aumentato timeout di inattività a 5 secondi
    connectionTimeoutMillis: 10000, // aumentato timeout di connessione a 10 secondi
    maxUses: 500, // drasticamente ridotto il numero massimo di query per connessione
    statement_timeout: 20000, // aumentato timeout delle query (20 secondi)
    query_timeout: 20000, // aumentato timeout delle query (20 secondi)
    allowExitOnIdle: true, // permette al pool di chiudersi quando è inattivo
    // Ricicla proattivamente le connessioni per evitare connessioni zombie
    idlePingInterval: 10000, // Verifica connessioni inattive ogni 10 secondi
    connectionRetryCount: 5, // Aumentato i tentativi di riconnessione
    connectionRetryDelay: 2000 // Aumentato attesa tra tentativi in ms
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
  
  // Forzare esplicitamente l'uso di IPv4
  try {
    // Risolvi manualmente l'host in un indirizzo IPv4
    const host = process.env.DB_HOST || 'db.fdufcrgckojbaghdvhgj.supabase.co';
    console.log(`Tentativo di risolvere ${host} in indirizzo IPv4...`);
    
    // Forza l'ambiente a usare IPv4 per questa connessione
    process.env.NODE_OPTIONS = '--dns-result-order=ipv4first';
  } catch (err) {
    console.error('Errore durante la risoluzione IPv4:', err);
  }
  
  // Configurazione per connessione diretta
  let directConfig: PoolConfig;
  
  if (process.env.DATABASE_URL) {
    // Usa la stringa di connessione fornita
    const safeConnectionString = createSafeConnectionString(process.env.DATABASE_URL);
    directConfig = {
      connectionString: safeConnectionString,
      // Forza l'uso di IPv4 a livello di socket
      family: 4,
      // Aggiungi opzioni extra TCP per forzare IPv4
      ssl: { rejectUnauthorized: false }
    };
  } else {
    // Usa i parametri individuali
    directConfig = {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'db.fdufcrgckojbaghdvhgj.supabase.co',
      database: process.env.DB_NAME || 'postgres',
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '5432'),
      // Forza l'uso di IPv4 a livello di socket
      family: 4,
      // Aggiungi opzioni extra TCP per forzare IPv4
      ssl: { rejectUnauthorized: false }
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
  // Dato che il database accetta solo IPv4, proviamo prima con il Transaction Pooler
  console.log('Priorità al Transaction Pooler (compatibile con IPv4)...');
  let pool = await setupTransactionPooler();
  
  // Se il Transaction Pooler fallisce, solo allora proviamo la connessione diretta
  if (!pool) {
    console.log('Transaction Pooler fallito, tentativo con connessione diretta...');
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
    
    // Nota informativa sulle risorse
    console.log('INFO: Connessione stabilita tramite Transaction Pooler a Supabase');
    console.log('INFO: Utilizzando configurazione ottimizzata per ambiente Render');
    console.log('INFO: Preferito Transaction Pooler (compatibile con IPv4)');
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

// Funzione wrapper per gestire le query in modo sicuro
export const executeQuery = async <T>(
  queryFn: (client: any) => Promise<T>
): Promise<T> => {
  let client = null;
  const startTime = Date.now();
  
  try {
    client = await pool.connect();
    const result = await queryFn(client);
    const duration = Date.now() - startTime;
    
    // Log dettagliato solo per query lente (> 500ms)
    if (duration > 500) {
      console.log(`Query completata in ${duration}ms (lenta)`);
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Errore durante l'esecuzione della query dopo ${duration}ms:`, error);
    throw error;
  } finally {
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        console.error('Errore nel rilasciare il client:', releaseError);
      }
    }
  }
};

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