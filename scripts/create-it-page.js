// Utilizzo di CommonJS per compatibilità
const fs = require('fs');
const path = require('path');

// Directory di destinazione (dist)
const distDir = path.resolve(__dirname, '../dist');
const itDir = path.join(distDir, 'it');

console.log('Creating Italian page with visible SEO content...');

// Crea la directory italiana se non esiste
if (!fs.existsSync(itDir)) {
  console.log('Creating directory for Italian...');
  fs.mkdirSync(itDir, { recursive: true });
}

// Contenuto HTML con SEO visibile
const htmlContent = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tenoris360 - Software di Gestione Immobili in Affitto</title>
  <meta name="description" content="Semplifica la gestione di affitti, inquilini, pagamenti e scadenze. Prova Tenoris360 gratis per 14 giorni, senza carta di credito.">
  <meta name="keywords" content="software gestione affitti, gestionale locazioni, gestionale affitti, software gestione locazione immobili, programma gestione immobili affitto, software affitti, gestione affitti software, software contratti locazione">
  
  <!-- Canonical tag and alternates -->
  <link rel="canonical" href="https://tenoris360.com/it/">
  <link rel="alternate" hreflang="it" href="https://tenoris360.com/it/">
  <link rel="alternate" hreflang="en" href="https://tenoris360.com/en/">
  <link rel="alternate" hreflang="en-gb" href="https://tenoris360.com/en-gb/">
  <link rel="alternate" hreflang="fr" href="https://tenoris360.com/fr/">
  <link rel="alternate" hreflang="de" href="https://tenoris360.com/de/">
  <link rel="alternate" hreflang="es" href="https://tenoris360.com/es/">
  <link rel="alternate" hreflang="x-default" href="https://tenoris360.com/">
  
  <!-- Preload main application script and styles -->
  <link rel="stylesheet" href="../assets/index.css">
  <script type="module" src="../assets/index.js"></script>
</head>
<body>
  <div id="root"></div>
  
  <!-- Contenuto SEO visibile per i crawler e utenti -->
  <section class="seo-content visible-seo" style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5;">
    <h1 style="font-size: 2rem; color: #2a2a2a; margin-bottom: 1rem;">Gestisci le tue proprietà con semplicità, automazione e controllo</h1>
    
    <p style="margin-bottom: 1.5rem; font-size: 1.1rem;">Tenoris360 è il software gestionale per property manager, proprietari e agenzie immobiliari che desiderano automatizzare la gestione di affitti brevi, lunghi e immobili in locazione. Dimentica fogli Excel, WhatsApp e confusione: con Tenoris360 gestisci contratti, scadenze, pagamenti, documenti e inquilini da un'unica piattaforma semplice e veloce.</p>
    
    <p style="margin-bottom: 2rem;"><strong>➡️ Provalo gratis per 14 giorni – Nessuna carta richiesta</strong></p>
    
    <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 1.5rem;">
      <div style="flex: 1; min-width: 300px;">
        <h2 style="font-size: 1.3rem; color: #3a3a3a;">🧩 Tutto in un'unica piattaforma</h2>
        <p>Gestione affitti, inquilini, contratti e scadenze. Tieni sotto controllo ogni proprietà con uno strumento semplice, visivo e professionale.</p>
      </div>
      
      <div style="flex: 1; min-width: 300px;">
        <h2 style="font-size: 1.3rem; color: #3a3a3a;">⚡ Automatizza le operazioni ripetitive</h2>
        <ul>
          <li>Notifiche automatiche per scadenze</li>
          <li>Invio email ai locatari</li>
          <li>Promemoria per pagamenti</li>
        </ul>
      </div>
    </div>
    
    <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 1.5rem;">
      <div style="flex: 1; min-width: 300px;">
        <h2 style="font-size: 1.3rem; color: #3a3a3a;">📊 Dashboard intuitiva</h2>
        <p>Visualizza in tempo reale quanto guadagni da ogni immobile, filtrando per mese, unità, o inquilino.</p>
      </div>
      
      <div style="flex: 1; min-width: 300px;">
        <h2 style="font-size: 1.3rem; color: #3a3a3a;">🔐 Sicurezza dei dati</h2>
        <p>Tutti i dati sono protetti e salvati in cloud. Niente più documenti sparsi o persi.</p>
      </div>
    </div>
  </section>
  
  <!-- Contenuto SEO nascosto per i crawler -->
  <div id="seo-content" style="display:none;">
    <h1>Gestisci le tue proprietà con semplicità, automazione e controllo</h1>
    
    <p>Tenoris360 è il software gestionale per property manager, proprietari e agenzie immobiliari che desiderano automatizzare la gestione di affitti brevi, lunghi e immobili in locazione. Dimentica fogli Excel, WhatsApp e confusione: con Tenoris360 gestisci contratti, scadenze, pagamenti, documenti e inquilini da un'unica piattaforma semplice e veloce.</p>
    
    <p><strong>➡️ Provalo gratis per 14 giorni – Nessuna carta richiesta</strong></p>
    
    <h2>🧩 Tutto in un'unica piattaforma</h2>
    <p>Gestione affitti, inquilini, contratti e scadenze. Tieni sotto controllo ogni proprietà con uno strumento semplice, visivo e professionale.</p>
    
    <h2>⚡ Automatizza le operazioni ripetitive</h2>
    <ul>
      <li>Notifiche automatiche per scadenze</li>
      <li>Invio email ai locatari</li>
      <li>Promemoria per pagamenti</li>
    </ul>
    
    <h2>📊 Dashboard intuitiva per il monitoraggio delle entrate</h2>
    <p>Visualizza in tempo reale quanto guadagni da ogni immobile, filtrando per mese, unità, o inquilino.</p>
    
    <h2>🔐 Sicurezza dei dati al primo posto</h2>
    <p>Tutti i dati sono protetti e salvati in cloud. Niente più documenti sparsi o persi.</p>
    
    <h2>Chi siamo</h2>
    <p>Tenoris360 nasce da chi vive ogni giorno la gestione immobiliare. Abbiamo creato questo gestionale per rendere il lavoro dei property manager più snello, professionale e meno stressante. È pensato per chi ha 2 immobili… o 200.</p>
    
    <h2>Domande frequenti</h2>
    
    <h3>A chi è utile Tenoris360?</h3>
    <p>A property manager, agenzie, proprietari privati e chi affitta immobili a lungo o breve termine.</p>
    
    <h3>Devo installare qualcosa?</h3>
    <p>No, è una web app: funziona da browser, anche su smartphone.</p>
    
    <h3>Quanto costa Tenoris360?</h3>
    <p>Puoi provarlo gratis per 14 giorni. Dopo, scegli il piano adatto alle tue esigenze.</p>
    
    <h3>Serve la carta di credito per provarlo?</h3>
    <p>No, puoi testarlo senza impegno e senza inserire dati di pagamento.</p>
    
    <footer>
      <p>Software gestionale per affitti e locazioni – Tenoris360</p>
      <p>Creato in Italia per property manager italiani.</p>
      <p>Contatti • Assistenza • Accedi</p>
    </footer>
  </div>
  
  <script>
    // Set language to Italian
    window.initialLanguage = 'it-IT';
    
    // Nascondi il contenuto SEO dopo il caricamento dell'applicazione
    window.addEventListener('load', function() {
      // Rimuovi solo il contenuto SEO nascosto
      const seoContent = document.getElementById('seo-content');
      if (seoContent) {
        seoContent.parentNode.removeChild(seoContent);
      }
      
      // Nascondi la sezione SEO visibile quando l'app React è completamente caricata
      setTimeout(function() {
        const visibleSeoContent = document.querySelector('.visible-seo');
        if (visibleSeoContent) {
          visibleSeoContent.style.display = 'none';
        }
      }, 2000); // Aspetta 2 secondi per assicurarsi che l'app React sia caricata
    });
  </script>
</body>
</html>`;

// Scrivi il file
const filePath = path.join(itDir, 'index.html');
fs.writeFileSync(filePath, htmlContent);

console.log(`Created ${filePath}`);
console.log('Done!'); 