// Utilizzo di CommonJS per compatibilità con Node.js
const fs = require('fs');
const path = require('path');

// Lista delle lingue supportate
const languages = [
  { code: 'en', langCode: 'en-US', title: 'Rental Property Management Software', 
    description: 'Comprehensive rental property management software for landlords, property managers, and real estate professionals.' },
  { code: 'en-gb', langCode: 'en-GB', title: 'Rental Property Management Software', 
    description: 'Comprehensive rental property management software for landlords, property managers, and real estate professionals.' },
  { code: 'fr', langCode: 'fr-FR', title: 'Logiciel de Gestion de Biens Locatifs', 
    description: 'Logiciel complet de gestion de biens locatifs pour propriétaires, gestionnaires de biens et professionnels de l\'immobilier.' },
  { code: 'de', langCode: 'de-DE', title: 'Mietverwaltungssoftware', 
    description: 'Umfassende Mietverwaltungssoftware für Vermieter, Immobilienverwalter und Immobilienprofis.' },
  { code: 'es', langCode: 'es-ES', title: 'Software de Gestión de Propiedades en Alquiler', 
    description: 'Software completo de gestión de propiedades en alquiler para propietarios, administradores de propiedades y profesionales inmobiliarios.' },
  { code: 'it', langCode: 'it-IT', title: 'Software di Gestione Immobili in Affitto', 
    description: 'Software completo per la gestione di immobili in affitto per proprietari, amministratori di immobili e professionisti immobiliari.' }
];

// Directory di destinazione (dist)
const distDir = path.resolve(__dirname, '../dist');

console.log('Starting language pages creation...');

// Assicurati che la directory dist esista
if (!fs.existsSync(distDir)) {
  console.log('Creating dist directory...');
  fs.mkdirSync(distDir, { recursive: true });
}

// Crea le pagine per ogni lingua
languages.forEach(lang => {
  const langDir = path.join(distDir, lang.code);
  
  // Crea la directory della lingua se non esiste
  if (!fs.existsSync(langDir)) {
    console.log(`Creating directory for ${lang.code}...`);
    fs.mkdirSync(langDir, { recursive: true });
  }
  
  // Crea il file HTML per la lingua
  const htmlContent = createHtmlTemplate(lang, languages);
  
  // Scrivi il file
  const filePath = path.join(langDir, 'index.html');
  fs.writeFileSync(filePath, htmlContent);
  
  console.log(`Created ${filePath}`);
});

console.log('Language pages creation complete!');

// Funzione per creare il template HTML
function createHtmlTemplate(currentLang, allLangs) {
  // Genera i link hreflang per tutte le lingue
  const hreflangs = allLangs.map(lang => {
    return `  <link rel="alternate" hreflang="${lang.code === 'en-gb' ? 'en-gb' : lang.code}" href="https://tenoris360.com/${lang.code === 'it' ? '' : lang.code + '/'}">`;
  }).join('\n');
  
  // Aggiungi x-default (punta alla versione italiana)
  const xDefault = `  <link rel="alternate" hreflang="x-default" href="https://tenoris360.com/">`;
  
  return `<!DOCTYPE html>
<html lang="${currentLang.code}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tenoris360 - ${currentLang.title}</title>
  <meta name="description" content="Tenoris360 - ${currentLang.description}">
  
  <!-- Canonical tag and alternates -->
  <link rel="canonical" href="https://tenoris360.com/${currentLang.code === 'it' ? '' : currentLang.code + '/'}">
${hreflangs}
${xDefault}
  
  <!-- Preload main application script and styles -->
  <link rel="stylesheet" href="${currentLang.code === 'it' ? '' : '../'}assets/index.css">
  <script type="module" src="${currentLang.code === 'it' ? '' : '../'}assets/index.js"></script>
</head>
<body>
  <div id="root"></div>
  <script>
    // Set language to ${currentLang.code}
    window.initialLanguage = '${currentLang.langCode}';
  </script>
</body>
</html>`;
} 