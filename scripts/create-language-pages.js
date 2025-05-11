// Utilizzo di ES Modules
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lista delle lingue supportate con meta keywords
const languages = [
  { 
    code: 'en', 
    langCode: 'en-US', 
    title: 'Rental Property Management Software', 
    description: 'Simplify the management of rentals, tenants, payments, and deadlines. Try Tenoris360 free for 14 days, no credit card required.',
    keywords: 'property management software, rental management system, property manager tool, landlord software, tenancy management, rental tracking software, lease management, property automation, real estate management software'
  },
  { 
    code: 'en-gb', 
    langCode: 'en-GB', 
    title: 'Rental Property Management Software', 
    description: 'Simplify the management of rentals, tenants, payments, and deadlines. Try Tenoris360 free for 14 days, no credit card required.',
    keywords: 'property management software, rental management system, property manager tool, landlord software, tenancy management, rental tracking software, lease management, property automation, real estate management software'
  },
  { 
    code: 'fr', 
    langCode: 'fr-FR', 
    title: 'Logiciel de Gestion de Biens Locatifs', 
    description: 'Simplifiez la gestion des locations, locataires, paiements et échéances. Essayez Tenoris360 gratuitement pendant 14 jours, sans carte de crédit.',
    keywords: 'logiciel gestion locative, logiciel gestion immobilière, gestion de propriétés, système gestion locations, logiciel propriétaire immobilier, gestion locataires, automatisation immobilière'
  },
  { 
    code: 'de', 
    langCode: 'de-DE', 
    title: 'Mietverwaltungssoftware', 
    description: 'Vereinfachen Sie die Verwaltung von Mietobjekten, Mietern, Zahlungen und Fristen. Testen Sie Tenoris360 kostenlos für 14 Tage, keine Kreditkarte erforderlich.',
    keywords: 'Immobilienverwaltungssoftware, Mietverwaltungssystem, Immobilienverwalter-Tool, Vermieter-Software, Mietverhältnisverwaltung, Mietverfolgungssoftware, Mietvertragsverwaltung'
  },
  { 
    code: 'es', 
    langCode: 'es-ES', 
    title: 'Software de Gestión de Propiedades en Alquiler', 
    description: 'Simplifique la gestión de alquileres, inquilinos, pagos y plazos. Pruebe Tenoris360 gratis durante 14 días, sin tarjeta de crédito.',
    keywords: 'software gestión inmobiliaria, sistema gestión alquileres, herramienta administrador propiedades, software propietario, gestión arrendamientos, software seguimiento alquileres'
  },
  { 
    code: 'it', 
    langCode: 'it-IT', 
    title: 'Software di Gestione Immobili in Affitto', 
    description: 'Semplifica la gestione di affitti, inquilini, pagamenti e scadenze. Prova Tenoris360 gratis per 14 giorni, senza carta di credito.',
    keywords: 'software gestione affitti, gestionale locazioni, gestionale affitti, software gestione locazione immobili, programma gestione immobili affitto, software affitti, gestione affitti software, software contratti locazione'
  }
];

// Directory di destinazione (dist)
const distDir = path.resolve(__dirname, '../dist');

console.log('Starting language pages creation...');

// Assicurati che la directory dist esista
if (!fs.existsSync(distDir)) {
  console.log('Creating dist directory...');
  fs.mkdirSync(distDir, { recursive: true });
}

// Leggi il file index.html principale per ottenere i nomi dei file CSS e JS
const mainIndexPath = path.join(distDir, 'index.html');
let cssFile = '';
let jsFile = '';

if (fs.existsSync(mainIndexPath)) {
  const mainIndexContent = fs.readFileSync(mainIndexPath, 'utf8');
  
  // Estrai il nome del file CSS
  const cssMatch = mainIndexContent.match(/<link rel="stylesheet"[^>]*href="\/assets\/([^"]+)"/);
  if (cssMatch && cssMatch[1]) {
    cssFile = cssMatch[1];
    console.log(`Found CSS file: ${cssFile}`);
  }
  
  // Estrai il nome del file JS
  const jsMatch = mainIndexContent.match(/<script[^>]*src="\/assets\/([^"]+)"/);
  if (jsMatch && jsMatch[1]) {
    jsFile = jsMatch[1];
    console.log(`Found JS file: ${jsFile}`);
  }
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
  const htmlContent = createHtmlTemplate(lang, languages, cssFile, jsFile);
  
  // Scrivi il file
  const filePath = path.join(langDir, 'index.html');
  fs.writeFileSync(filePath, htmlContent);
  
  console.log(`Created ${filePath}`);
});

console.log('Language pages creation complete!');

// Funzione per ottenere il contenuto SEO in base alla lingua
function getSeoContent(lang) {
  // Contenuto SEO per inglese (USA e UK)
  if (lang.code === 'en' || lang.code === 'en-gb') {
    return {
      h1: "Manage Your Properties with Simplicity, Automation, and Control",
      intro: "Tenoris360 is the management software for property managers, owners, and real estate agencies who want to automate the management of short-term rentals, long-term rentals, and leased properties. Forget Excel spreadsheets, WhatsApp, and confusion: with Tenoris360 you manage contracts, deadlines, payments, documents, and tenants from a single simple and fast platform.",
      cta: "Try it free for 14 days – No credit card required",
      features: {
        platform: {
          title: "Everything in One Platform",
          desc: "Manage rentals, tenants, contracts, and deadlines. Keep track of every property with a simple, visual, and professional tool."
        },
        automation: {
          title: "Automate Repetitive Operations",
          items: [
            "Automatic notifications for deadlines",
            "Email sending to tenants",
            "Payment reminders"
          ]
        },
        dashboard: {
          title: "Intuitive Dashboard for Income Monitoring",
          desc: "View in real-time how much you earn from each property, filtering by month, unit, or tenant."
        },
        security: {
          title: "Data Security First",
          desc: "All data is protected and saved in the cloud. No more scattered or lost documents."
        }
      },
      about: {
        title: "About Us",
        desc: "Tenoris360 was born from those who experience property management every day. We created this management system to make property managers' work more streamlined, professional, and less stressful. It's designed for those who have 2 properties... or 200."
      },
      faq: {
        title: "Frequently Asked Questions",
        items: [
          {
            q: "Who is Tenoris360 useful for?",
            a: "For property managers, agencies, private owners, and those who rent properties for long or short terms."
          },
          {
            q: "Do I need to install anything?",
            a: "No, it's a web app: it works from a browser, even on smartphones."
          },
          {
            q: "How much does Tenoris360 cost?",
            a: "You can try it for free for 14 days. After that, choose the plan that suits your needs."
          },
          {
            q: "Is a credit card required to try it?",
            a: "No, you can test it without commitment and without entering payment details."
          }
        ]
      },
      footer: {
        line1: "Property Management Software for Rentals and Leases – Tenoris360",
        line2: "Created for property managers worldwide.",
        line3: "Contact • Support • Log In"
      }
    };
  }
  
  // Contenuto SEO per italiano
  if (lang.code === 'it') {
    return {
      h1: "Gestisci le tue proprietà con semplicità, automazione e controllo",
      intro: "Tenoris360 è il software gestionale per property manager, proprietari e agenzie immobiliari che desiderano automatizzare la gestione di affitti brevi, lunghi e immobili in locazione. Dimentica fogli Excel, WhatsApp e confusione: con Tenoris360 gestisci contratti, scadenze, pagamenti, documenti e inquilini da un'unica piattaforma semplice e veloce.",
      cta: "Provalo gratis per 14 giorni – Nessuna carta richiesta",
      features: {
        platform: {
          title: "Tutto in un'unica piattaforma",
          desc: "Gestione affitti, inquilini, contratti e scadenze. Tieni sotto controllo ogni proprietà con uno strumento semplice, visivo e professionale."
        },
        automation: {
          title: "Automatizza le operazioni ripetitive",
          items: [
            "Notifiche automatiche per scadenze",
            "Invio email ai locatari",
            "Promemoria per pagamenti"
          ]
        },
        dashboard: {
          title: "Dashboard intuitiva per il monitoraggio delle entrate",
          desc: "Visualizza in tempo reale quanto guadagni da ogni immobile, filtrando per mese, unità, o inquilino."
        },
        security: {
          title: "Sicurezza dei dati al primo posto",
          desc: "Tutti i dati sono protetti e salvati in cloud. Niente più documenti sparsi o persi."
        }
      },
      about: {
        title: "Chi siamo",
        desc: "Tenoris360 nasce da chi vive ogni giorno la gestione immobiliare. Abbiamo creato questo gestionale per rendere il lavoro dei property manager più snello, professionale e meno stressante. È pensato per chi ha 2 immobili… o 200."
      },
      faq: {
        title: "Domande frequenti",
        items: [
          {
            q: "A chi è utile Tenoris360?",
            a: "A property manager, agenzie, proprietari privati e chi affitta immobili a lungo o breve termine."
          },
          {
            q: "Devo installare qualcosa?",
            a: "No, è una web app: funziona da browser, anche su smartphone."
          },
          {
            q: "Quanto costa Tenoris360?",
            a: "Puoi provarlo gratis per 14 giorni. Dopo, scegli il piano adatto alle tue esigenze."
          },
          {
            q: "Serve la carta di credito per provarlo?",
            a: "No, puoi testarlo senza impegno e senza inserire dati di pagamento."
          }
        ]
      },
      footer: {
        line1: "Software gestionale per affitti e locazioni – Tenoris360",
        line2: "Creato in Italia per property manager italiani.",
        line3: "Contatti • Assistenza • Accedi"
      }
    };
  }
  
  // Contenuto SEO per francese
  if (lang.code === 'fr') {
    return {
      h1: "Gérez Vos Propriétés avec Simplicité, Automatisation et Contrôle",
      intro: "Tenoris360 est le logiciel de gestion pour les gestionnaires immobiliers, propriétaires et agences immobilières qui souhaitent automatiser la gestion des locations courte durée, longue durée et des biens loués. Oubliez les feuilles Excel, WhatsApp et la confusion : avec Tenoris360, vous gérez les contrats, les échéances, les paiements, les documents et les locataires à partir d'une plateforme unique, simple et rapide.",
      cta: "Essayez-le gratuitement pendant 14 jours – Aucune carte de crédit requise",
      features: {
        platform: {
          title: "Tout en Une Seule Plateforme",
          desc: "Gestion des locations, locataires, contrats et échéances. Gardez un œil sur chaque propriété avec un outil simple, visuel et professionnel."
        },
        automation: {
          title: "Automatisez les Opérations Répétitives",
          items: [
            "Notifications automatiques pour les échéances",
            "Envoi d'emails aux locataires",
            "Rappels de paiement"
          ]
        },
        dashboard: {
          title: "Tableau de Bord Intuitif pour le Suivi des Revenus",
          desc: "Visualisez en temps réel combien vous gagnez pour chaque propriété, en filtrant par mois, unité ou locataire."
        },
        security: {
          title: "Sécurité des Données en Premier",
          desc: "Toutes les données sont protégées et sauvegardées dans le cloud. Plus de documents éparpillés ou perdus."
        }
      },
      about: {
        title: "Qui Sommes-Nous",
        desc: "Tenoris360 est né de ceux qui vivent la gestion immobilière au quotidien. Nous avons créé ce système de gestion pour rendre le travail des gestionnaires immobiliers plus rationnel, professionnel et moins stressant. Il est conçu pour ceux qui possèdent 2 propriétés... ou 200."
      },
      faq: {
        title: "Questions Fréquemment Posées",
        items: [
          {
            q: "À qui Tenoris360 est-il utile ?",
            a: "Aux gestionnaires immobiliers, agences, propriétaires privés et ceux qui louent des propriétés à long ou court terme."
          },
          {
            q: "Dois-je installer quelque chose ?",
            a: "Non, c'est une application web : elle fonctionne depuis un navigateur, même sur smartphones."
          },
          {
            q: "Combien coûte Tenoris360 ?",
            a: "Vous pouvez l'essayer gratuitement pendant 14 jours. Ensuite, choisissez le forfait qui correspond à vos besoins."
          },
          {
            q: "Une carte de crédit est-elle nécessaire pour l'essayer ?",
            a: "Non, vous pouvez le tester sans engagement et sans saisir de coordonnées de paiement."
          }
        ]
      },
      footer: {
        line1: "Logiciel de Gestion Immobilière pour Locations et Baux – Tenoris360",
        line2: "Créé pour les gestionnaires immobiliers du monde entier.",
        line3: "Contact • Support • Connexion"
      }
    };
  }
  
  // Contenuto SEO per tedesco
  if (lang.code === 'de') {
    return {
      h1: "Verwalten Sie Ihre Immobilien mit Einfachheit, Automatisierung und Kontrolle",
      intro: "Tenoris360 ist die Verwaltungssoftware für Immobilienverwalter, Eigentümer und Immobilienagenturen, die die Verwaltung von Kurzzeitvermietungen, Langzeitvermietungen und Mietobjekten automatisieren möchten. Vergessen Sie Excel-Tabellen, WhatsApp und Verwirrung: Mit Tenoris360 verwalten Sie Verträge, Fristen, Zahlungen, Dokumente und Mieter von einer einzigen einfachen und schnellen Plattform aus.",
      cta: "Testen Sie es kostenlos für 14 Tage – Keine Kreditkarte erforderlich",
      features: {
        platform: {
          title: "Alles auf einer Plattform",
          desc: "Verwaltung von Mietobjekten, Mietern, Verträgen und Fristen. Behalten Sie jede Immobilie mit einem einfachen, visuellen und professionellen Tool im Blick."
        },
        automation: {
          title: "Automatisieren Sie wiederkehrende Vorgänge",
          items: [
            "Automatische Benachrichtigungen für Fristen",
            "E-Mail-Versand an Mieter",
            "Zahlungserinnerungen"
          ]
        },
        dashboard: {
          title: "Intuitives Dashboard zur Einkommensüberwachung",
          desc: "Sehen Sie in Echtzeit, wie viel Sie mit jeder Immobilie verdienen, gefiltert nach Monat, Einheit oder Mieter."
        },
        security: {
          title: "Datensicherheit an erster Stelle",
          desc: "Alle Daten sind geschützt und in der Cloud gespeichert. Keine verstreuten oder verlorenen Dokumente mehr."
        }
      },
      about: {
        title: "Über uns",
        desc: "Tenoris360 entstand aus den Erfahrungen derjenigen, die täglich mit Immobilienverwaltung zu tun haben. Wir haben dieses Verwaltungssystem entwickelt, um die Arbeit von Immobilienverwaltern effizienter, professioneller und weniger stressig zu gestalten. Es ist für diejenigen konzipiert, die 2 Immobilien... oder 200 besitzen."
      },
      faq: {
        title: "Häufig gestellte Fragen",
        items: [
          {
            q: "Für wen ist Tenoris360 nützlich?",
            a: "Für Immobilienverwalter, Agenturen, private Eigentümer und diejenigen, die Immobilien lang- oder kurzfristig vermieten."
          },
          {
            q: "Muss ich etwas installieren?",
            a: "Nein, es ist eine Web-App: Sie funktioniert über einen Browser, auch auf Smartphones."
          },
          {
            q: "Wie viel kostet Tenoris360?",
            a: "Sie können es 14 Tage lang kostenlos testen. Danach wählen Sie den Plan, der Ihren Anforderungen entspricht."
          },
          {
            q: "Wird für den Test eine Kreditkarte benötigt?",
            a: "Nein, Sie können es ohne Verpflichtung und ohne Eingabe von Zahlungsdaten testen."
          }
        ]
      },
      footer: {
        line1: "Immobilienverwaltungssoftware für Vermietungen und Mietverträge – Tenoris360",
        line2: "Entwickelt für Immobilienverwalter weltweit.",
        line3: "Kontakt • Support • Anmelden"
      }
    };
  }
  
  // Contenuto SEO per spagnolo
  if (lang.code === 'es') {
    return {
      h1: "Gestione sus propiedades con simplicidad, automatización y control",
      intro: "Tenoris360 es el software de gestión para administradores de propiedades, propietarios y agencias inmobiliarias que desean automatizar la gestión de alquileres a corto plazo, a largo plazo y propiedades arrendadas. Olvídese de las hojas de Excel, WhatsApp y la confusión: con Tenoris360 gestiona contratos, plazos, pagos, documentos e inquilinos desde una única plataforma simple y rápida.",
      cta: "Pruébelo gratis durante 14 días – No se requiere tarjeta de crédito",
      features: {
        platform: {
          title: "Todo en una sola plataforma",
          desc: "Gestión de alquileres, inquilinos, contratos y plazos. Mantenga un seguimiento de cada propiedad con una herramienta simple, visual y profesional."
        },
        automation: {
          title: "Automatice las operaciones repetitivas",
          items: [
            "Notificaciones automáticas para plazos",
            "Envío de correos electrónicos a inquilinos",
            "Recordatorios de pago"
          ]
        },
        dashboard: {
          title: "Panel intuitivo para el seguimiento de ingresos",
          desc: "Visualice en tiempo real cuánto gana de cada propiedad, filtrando por mes, unidad o inquilino."
        },
        security: {
          title: "Seguridad de datos en primer lugar",
          desc: "Todos los datos están protegidos y guardados en la nube. No más documentos dispersos o perdidos."
        }
      },
      about: {
        title: "Sobre nosotros",
        desc: "Tenoris360 nació de quienes experimentan la gestión inmobiliaria todos los días. Creamos este sistema de gestión para hacer que el trabajo de los administradores de propiedades sea más eficiente, profesional y menos estresante. Está diseñado para quienes tienen 2 propiedades... o 200."
      },
      faq: {
        title: "Preguntas frecuentes",
        items: [
          {
            q: "¿Para quién es útil Tenoris360?",
            a: "Para administradores de propiedades, agencias, propietarios privados y quienes alquilan propiedades a largo o corto plazo."
          },
          {
            q: "¿Necesito instalar algo?",
            a: "No, es una aplicación web: funciona desde un navegador, incluso en smartphones."
          },
          {
            q: "¿Cuánto cuesta Tenoris360?",
            a: "Puede probarlo gratis durante 14 días. Después, elija el plan que se adapte a sus necesidades."
          },
          {
            q: "¿Se requiere una tarjeta de crédito para probarlo?",
            a: "No, puede probarlo sin compromiso y sin ingresar datos de pago."
          }
        ]
      },
      footer: {
        line1: "Software de Gestión Inmobiliaria para Alquileres y Arrendamientos – Tenoris360",
        line2: "Creado para administradores de propiedades en todo el mundo.",
        line3: "Contacto • Soporte • Iniciar sesión"
      }
    };
  }
  
  // Default to English if no language matches
  return getSeoContent({code: 'en'});
}

// Genera il contenuto SEO completo
function generateSeoContent(lang) {
  const content = getSeoContent(lang);
  
  // Build visible SEO section with minimum 250 words
  let visibleSeo = `
  <section class="seo-content visible-seo" style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5;">
    <h1 style="font-size: 2rem; color: #2a2a2a; margin-bottom: 1rem;">${content.h1}</h1>
    
    <p style="margin-bottom: 1.5rem; font-size: 1.1rem;">${content.intro}</p>
    
    <p style="margin-bottom: 2rem;"><strong>➡️ ${content.cta}</strong></p>
    
    <div style="display: flex; flex-wrap: wrap; gap: 20px;">
      <div style="flex: 1; min-width: 300px;">
        <h2 style="font-size: 1.3rem; color: #3a3a3a;">🧩 ${content.features.platform.title}</h2>
        <p>${content.features.platform.desc}</p>
      </div>
      
      <div style="flex: 1; min-width: 300px;">
        <h2 style="font-size: 1.3rem; color: #3a3a3a;">⚡ ${content.features.automation.title}</h2>
        <ul>
          ${content.features.automation.items.map(item => `<li>${item}</li>`).join('\n          ')}
        </ul>
      </div>
    </div>
  </section>`;
  
  // Build hidden SEO section with complete details
  let hiddenSeo = `
  <div id="seo-content" style="display:none;">
    <h1>${content.h1}</h1>
    
    <p>${content.intro}</p>
    
    <p><strong>➡️ ${content.cta}</strong></p>
    
    <h2>🧩 ${content.features.platform.title}</h2>
    <p>${content.features.platform.desc}</p>
    
    <h2>⚡ ${content.features.automation.title}</h2>
    <ul>
      ${content.features.automation.items.map(item => `<li>${item}</li>`).join('\n      ')}
    </ul>
    
    <h2>📊 ${content.features.dashboard.title}</h2>
    <p>${content.features.dashboard.desc}</p>
    
    <h2>🔐 ${content.features.security.title}</h2>
    <p>${content.features.security.desc}</p>
    
    <h2>${content.about.title}</h2>
    <p>${content.about.desc}</p>
    
    <h2>${content.faq.title}</h2>
    
    ${content.faq.items.map(item => `
    <h3>${item.q}</h3>
    <p>${item.a}</p>
    `).join('\n    ')}
    
    <footer>
      <p>${content.footer.line1}</p>
      <p>${content.footer.line2}</p>
      <p>${content.footer.line3}</p>
    </footer>
  </div>`;
  
  return { visibleSeo, hiddenSeo };
}

// Funzione per creare il template HTML
function createHtmlTemplate(currentLang, allLangs, cssFile, jsFile) {
  // Genera i link hreflang per tutte le lingue
  const hreflangs = allLangs.map(lang => {
    return `  <link rel="alternate" hreflang="${lang.code === 'en-gb' ? 'en-gb' : lang.code}" href="https://tenoris360.com/${lang.code === 'it' ? '' : lang.code + '/'}">`;
  }).join('\n');
  
  // Aggiungi x-default (punta alla versione italiana)
  const xDefault = `  <link rel="alternate" hreflang="x-default" href="https://tenoris360.com/">`;
  
  // Genera il contenuto SEO
  const { visibleSeo, hiddenSeo } = generateSeoContent(currentLang);
  
  return `<!DOCTYPE html>
<html lang="${currentLang.code}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tenoris360 - ${currentLang.title}</title>
  <meta name="description" content="${currentLang.description}">
  <meta name="keywords" content="${currentLang.keywords}">
  
  <!-- Canonical tag and alternates -->
  <link rel="canonical" href="https://tenoris360.com/${currentLang.code === 'it' ? '' : currentLang.code + '/'}">
${hreflangs}
${xDefault}
  
  <!-- Preload main application script and styles con percorsi assoluti -->
  <link rel="stylesheet" href="/assets/${cssFile}">
  <script type="module" src="/assets/${jsFile}"></script>
</head>
<body>
  <div id="root"></div>
  
  <!-- Contenuto SEO visibile con minimo 250 parole -->
${visibleSeo}
  
  <!-- Contenuto SEO completo nascosto per i crawler -->
${hiddenSeo}
  
  <script>
    // Set language to ${currentLang.code}
    window.initialLanguage = '${currentLang.langCode}';
    
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
} 