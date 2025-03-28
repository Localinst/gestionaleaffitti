/**
 * Configurazione CORS per il backend
 * 
 * Questo file contiene la configurazione corretta per CORS nel backend Express.
 * Copia e incolla questo codice nel file backend/src/index.ts sostituendo la configurazione CORS esistente.
 */

// Domini consentiti - assicurati di includere tutti i domini frontend
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:8081',
  'https://statuesque-malabi-216764.netlify.app',
  'https://gestionaleaffitti.netlify.app'
];

// Configurazione CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Registro l'origine della richiesta per debug
  console.log(`Richiesta da origine: ${origin || 'nessuna origine'} - ${new Date().toISOString()}`);
  
  // Permetti l'origine se è nell'elenco o in sviluppo locale
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // Per richieste senza origine, come quelle server-side
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else {
    // Per altre origini, usa una politica più restrittiva o registra per debug
    console.log(`Origine non consentita: ${origin}`);
    res.setHeader('Access-Control-Allow-Origin', '*'); // In produzione, dovresti rimuovere questa linea
  }
  
  // Altri header CORS necessari
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 ore
  
  // Gestione richieste preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
});

// IMPORTANTE: Rimuovi o commenta la vecchia configurazione cors() in index.ts
// app.use(cors({...})); 