/**
 * Configurazione CORS per il backend
 * 
 * Questo file contiene la configurazione corretta per CORS nel backend Express.
 * Copia e incolla questo codice nel file backend/src/index.ts sostituendo la configurazione CORS esistente.
 */

// Configurazione CORS semplificata che ammette tutte le origini
app.use((req, res, next) => {
  // Permetti tutte le origini senza restrizioni
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Registro l'origine della richiesta per debug
  const origin = req.headers.origin;
  console.log(`Richiesta da origine: ${origin || 'nessuna origine'} - ${new Date().toISOString()}`);
  
  // Altri header CORS necessari
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  // Non impostare credentials su true quando si usa '*' come origin
  // res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 ore
  
  // Gestione richieste preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
});

// IMPORTANTE: Rimuovi o commenta la vecchia configurazione cors() in index.ts
// app.use(cors({...})); 