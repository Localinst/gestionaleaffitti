import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';
import dns from 'dns';
import * as net from 'net';
import { promisify } from 'util';

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

// Funzione per testare la connettività di rete verso l'host del Transaction Pooler
async function testNetworkConnectivity(host: string, port: number): Promise<boolean> {
  console.log(`Test di connettività di rete verso ${host}:${port}...`);
  
  // Test 1: Risoluzione DNS
  try {
    const lookup = promisify(dns.lookup);
    const result = await lookup(host);
    console.log(`Risoluzione DNS di ${host}: ${result.address} (${result.family === 4 ? 'IPv4' : 'IPv6'})`);
  } catch (error) {
    console.error(`Errore nella risoluzione DNS di ${host}:`, error);
    return false;
  }
  
  // Test 2: Connessione TCP
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isConnected = false;
    
    // Timeout dopo 5 secondi
    socket.setTimeout(5000);
    
    socket.on('connect', () => {
      console.log(`✓ Connessione TCP a ${host}:${port} riuscita!`);
      isConnected = true;
      socket.end();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      console.error(`✗ Timeout nella connessione a ${host}:${port}`);
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', (err) => {
      console.error(`✗ Errore nella connessione TCP a ${host}:${port}:`, err);
      resolve(false);
    });
    
    socket.on('close', () => {
      if (!isConnected) {
        console.error(`✗ Connessione a ${host}:${port} chiusa senza successo`);
        resolve(false);
      }
    });
    
    // Tenta la connessione
    try {
      socket.connect(port, host);
    } catch (err) {
      console.error(`✗ Errore nell'avvio della connessione a ${host}:${port}:`, err);
      resolve(false);
    }
  });
}

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
        console.log('POOLER_URL con password codificata.');
        console.log(`Host: ${host}, Port: ${port}, Username: ${username}, Database: ${database}`);
      } else {
        connectionString = poolerUrl;
        console.log('Formato POOLER_URL non riconosciuto, uso originale');
        console.log('URL Transaction Pooler: ' + poolerUrl.replace(/:[^:@]+@/, ':****@'));
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
  
  // Test connettività di rete prima di tentare la connessione al database
  const isReachable = await testNetworkConnectivity(TRANSACTION_POOLER_HOST, TRANSACTION_POOLER_PORT);
  if (!isReachable) {
    console.error(`✗ Host del Transaction Pooler (${TRANSACTION_POOLER_HOST}:${TRANSACTION_POOLER_PORT}) non raggiungibile dalla rete corrente`);
    console.error('Questo potrebbe essere dovuto a:');
    console.error('1. Problemi di rete o firewall');
    console.error('2. Restrizioni di rete sul servizio hosting (Render, ecc.)');
    console.error('3. Il servizio Supabase Transaction Pooler non è disponibile');
    return null;
  }
  
  console.log(`✓ Host del Transaction Pooler (${TRANSACTION_POOLER_HOST}:${TRANSACTION_POOLER_PORT}) raggiungibile dalla rete`);
  
  // Configura il pool usando la stringa di connessione del pooler
  const poolerConfig = {
    connectionString: createSafeConnectionString(connectionString),
    // Forza l'uso di IPv4 attraverso varie opzioni
    family: 4,  // Forza l'uso di IPv4 in Node.js
    // Assicurati che utilizzi IPv4
    host_type: 'ip4', // Forza il resolver DNS a usare IPv4
    ssl: { rejectUnauthorized: false },  // Potrebbe essere necessario per alcuni provider
    // Configurazione del pool
    max: 20, // aumentato il numero massimo di connessioni
    min: 1,  // aumentato il numero minimo di connessioni
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
    console.error('Dettagli completi dell\'errore:', JSON.stringify(err, null, 2));
    
    // Chiudi il pool per evitare memory leak
    poolerPool.end();
    
    // Tentativo di fallback alla connessione diretta
    console.log('Non è possibile connettersi tramite Transaction Pooler. Possibili cause:');
    console.log('1. La password nel pooler URL è errata');
    console.log('2. Il progetto Supabase non ha il Transaction Pooler abilitato');
    console.log('3. Le credenziali non hanno accesso al Transaction Pooler');
    console.log('4. Il servizio Supabase Pooler non è raggiungibile dalla rete corrente');
    console.log('5. Errore nella risoluzione DNS del dominio del pooler');
    
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

// Funzione principale per ottenere una connessione valida
async function getDbPool() {
  // Utilizziamo solo il Transaction Pooler
  console.log('Utilizzo esclusivo del Transaction Pooler (compatibile con IPv4)...');
  let pool = await setupTransactionPooler();
  
  // Se il Transaction Pooler fallisce, restituiamo un pool che genererà errori chiari all'uso
  if (!pool) {
    console.error('CRITICO: Connessione al Transaction Pooler fallita!');
    
    // Crea un pool che non tenterà di connettersi a localhost ma genererà errori chiari
    const mockPool = {
      connect: () => Promise.reject(new Error('Database non disponibile. Connessione al Transaction Pooler fallita.')),
      query: () => Promise.reject(new Error('Database non disponibile. Connessione al Transaction Pooler fallita.')),
      end: () => Promise.resolve(),
      on: () => {},
      // Altre proprietà necessarie per compatibilità
      totalCount: 0,
      idleCount: 0,
      waitingCount: 0
    };
    
    // Crea un oggetto che implementa l'interfaccia Pool ma non si connette realmente
    return mockPool as unknown as Pool;
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