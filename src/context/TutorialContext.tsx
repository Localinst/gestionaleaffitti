import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import type { Step } from 'react-joyride';

// Definizione delle fasi del tutorial corrette per react-joyride
export const DEFAULT_TUTORIAL_STEPS: Step[] = [
  {
    target: 'body',
    content: (
      <div>
        <h2 style={{ color: '#1e3a8a', fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>👋 Benvenuto nel Gestionale Affitti</h2>
        <p style={{ fontSize: '15px', lineHeight: '1.5' }}>Questo tutorial ti guiderà attraverso le funzionalità principali dell'applicazione.</p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: 'aside',
    content: (
      <div>
        <h2 style={{ color: '#1e3a8a', fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>🧭 Menu di navigazione</h2>
        <p style={{ fontSize: '15px', lineHeight: '1.5' }}>Utilizza questa barra laterale per navigare tra le diverse sezioni dell'applicazione.</p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="menu-dashboard"]',
    content: (
      <div>
        <h2 style={{ color: '#1e3a8a', fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>📊 Dashboard</h2>
        <p style={{ fontSize: '15px', lineHeight: '1.5' }}>La dashboard ti mostra una panoramica di tutte le informazioni importanti:</p>
        <ul style={{ fontSize: '14px', paddingLeft: '20px', lineHeight: '1.4', marginTop: '8px' }}>
          <li>Statistiche sulle proprietà</li>
          <li>Occupazione e incassi</li>
          <li>Attività recenti</li>
        </ul>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="menu-properties"]',
    content: (
      <div>
        <h2 style={{ color: '#1e3a8a', fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>🏠 Gestione Proprietà</h2>
        <p style={{ fontSize: '15px', lineHeight: '1.5' }}>Gestisci tutti i tuoi immobili da questa sezione. Puoi:</p>
        <ul style={{ fontSize: '14px', paddingLeft: '20px', lineHeight: '1.4', marginTop: '8px' }}>
          <li>Aggiungere nuove proprietà</li>
          <li>Visualizzare i dettagli</li>
          <li>Modificare le informazioni</li>
        </ul>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="menu-tenants"]',
    content: (
      <div>
        <h2 style={{ color: '#1e3a8a', fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>👥 Gestione Inquilini</h2>
        <p style={{ fontSize: '15px', lineHeight: '1.5' }}>Tieni traccia di tutti gli inquilini dei tuoi immobili:</p>
        <ul style={{ fontSize: '14px', paddingLeft: '20px', lineHeight: '1.4', marginTop: '8px' }}>
          <li>Registra nuovi inquilini</li>
          <li>Visualizza i contatti</li>
          <li>Controlla i pagamenti</li>
        </ul>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="menu-transactions"]',
    content: (
      <div>
        <h2 style={{ color: '#1e3a8a', fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>💰 Gestione Transazioni</h2>
        <p style={{ fontSize: '15px', lineHeight: '1.5' }}>Monitora tutti i movimenti economici:</p>
        <ul style={{ fontSize: '14px', paddingLeft: '20px', lineHeight: '1.4', marginTop: '8px' }}>
          <li>Registra incassi</li>
          <li>Monitora spese</li>
          <li>Visualizza il bilancio</li>
        </ul>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="menu-contracts"]',
    content: (
      <div>
        <h2 style={{ color: '#1e3a8a', fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>📝 Gestione Contratti</h2>
        <p style={{ fontSize: '15px', lineHeight: '1.5' }}>Gestisci i contratti di affitto:</p>
        <ul style={{ fontSize: '14px', paddingLeft: '20px', lineHeight: '1.4', marginTop: '8px' }}>
          <li>Crea nuovi contratti</li>
          <li>Monitora le scadenze</li>
          <li>Gestisci i rinnovi</li>
        </ul>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="menu-tourism"]',
    content: (
      <div>
        <h2 style={{ color: '#1e3a8a', fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>🏝️ Locazioni Turistiche</h2>
        <p style={{ fontSize: '15px', lineHeight: '1.5' }}>Gestisci proprietà per affitti a breve termine:</p>
        <ul style={{ fontSize: '14px', paddingLeft: '20px', lineHeight: '1.4', marginTop: '8px' }}>
          <li>Visualizza prenotazioni</li>
          <li>Gestisci disponibilità</li>
          <li>Monitora le performance</li>
        </ul>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="menu-activities"]',
    content: (
      <div>
        <h2 style={{ color: '#1e3a8a', fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>📅 Gestione Attività</h2>
        <p style={{ fontSize: '15px', lineHeight: '1.5' }}>Pianifica e gestisci tutte le attività:</p>
        <ul style={{ fontSize: '14px', paddingLeft: '20px', lineHeight: '1.4', marginTop: '8px' }}>
          <li>Manutenzioni programmate</li>
          <li>Incontri con inquilini</li>
          <li>Promemoria importanti</li>
        </ul>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="menu-reports"]',
    content: (
      <div>
        <h2 style={{ color: '#1e3a8a', fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>📈 Report e Analisi</h2>
        <p style={{ fontSize: '15px', lineHeight: '1.5' }}>Analizza i dati delle tue proprietà:</p>
        <ul style={{ fontSize: '14px', paddingLeft: '20px', lineHeight: '1.4', marginTop: '8px' }}>
          <li>Rendimento degli investimenti</li>
          <li>Statistiche di occupazione</li>
          <li>Previsioni finanziarie</li>
        </ul>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: 'body',
    content: (
      <div>
        <h2 style={{ color: '#1e3a8a', fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>🎉 Tutorial completato!</h2>
        <p style={{ fontSize: '15px', lineHeight: '1.5' }}>Congratulazioni! Hai completato il tour dell'applicazione.</p>
        <p style={{ fontSize: '14px', marginTop: '10px', color: '#64748b' }}>Puoi riavviare questo tutorial in qualsiasi momento dal menu laterale.</p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  }
];

// Mappa degli step per pagina per un accesso più facile e mirato
export const TUTORIAL_STEPS_BY_PAGE = {
  dashboard: [
    {
      target: '[data-tutorial="dashboard-stats"]',
      content: (
        <div>
          <h2 style={{ color: '#1e3a8a', fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>📈 Statistiche</h2>
          <p style={{ fontSize: '15px', lineHeight: '1.5' }}>Qui puoi vedere le metriche chiave sulle tue proprietà e gli affitti.</p>
        </div>
      ),
      placement: 'bottom' as const,
      disableBeacon: true,
    },
    {
      target: '[data-tutorial="dashboard-chart"]',
      content: (
        <div>
          <h2 style={{ color: '#1e3a8a', fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>📊 Grafici</h2>
          <p style={{ fontSize: '15px', lineHeight: '1.5' }}>Visualizza graficamente l'andamento dei tuoi affitti e delle entrate.</p>
        </div>
      ),
      placement: 'top' as const,
      disableBeacon: true,
    }
  ],
  properties: [
    {
      target: '[data-tutorial="properties-list"]',
      content: (
        <div>
          <h2 style={{ color: '#1e3a8a', fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>🏠 Elenco Proprietà</h2>
          <p style={{ fontSize: '15px', lineHeight: '1.5' }}>Qui vedi l'elenco di tutte le tue proprietà in gestione.</p>
        </div>
      ),
      placement: 'bottom' as const,
      disableBeacon: true,
    },
    {
      target: '[data-tutorial="add-property"]',
      content: (
        <div>
          <h2 style={{ color: '#1e3a8a', fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>➕ Aggiungi Proprietà</h2>
          <p style={{ fontSize: '15px', lineHeight: '1.5' }}>Clicca qui per inserire una nuova proprietà nel sistema.</p>
        </div>
      ),
      placement: 'left' as const,
      disableBeacon: true,
    }
  ],
  tenants: [
    {
      target: '[data-tutorial="tenants-list"]',
      content: (
        <div>
          <h2 style={{ color: '#1e3a8a', fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>👥 Inquilini</h2>
          <p style={{ fontSize: '15px', lineHeight: '1.5' }}>Gestisci i tuoi inquilini e i loro dati.</p>
        </div>
      ),
      placement: 'bottom' as const,
      disableBeacon: true,
    }
  ]
};

interface TutorialContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  steps: Step[];
  setSteps: (steps: Step[]) => void;
  completedTutorials: string[];
  markTutorialAsCompleted: (tutorialId: string) => void;
  startTutorial: (newSteps?: Step[]) => void;
  resetTutorial: () => void;
  closeTutorial: (markCompleted?: boolean) => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

const TUTORIAL_STORAGE_KEY = 'tutorial_completed';
const TUTORIALS_COMPLETED_KEY = 'completedTutorials';

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [completedTutorials, setCompletedTutorials] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(TUTORIALS_COMPLETED_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Errore nel recupero dei tutorial completati:', error);
      return [];
    }
  });
  const location = useLocation();

  // Resetta lo stato del tutorial quando cambia la route
  useEffect(() => {
    console.log('TutorialContext: Cambio di pagina rilevato:', location.pathname);
    
    if (isOpen) {
      // Solo se il tutorial è aperto, controlliamo se dobbiamo chiuderlo
      // Chiudi subito il tutorial
      setIsOpen(false);
      console.log('TutorialContext: Cambio pagina - chiusura tutorial');
      
      // Un timer per dare tempo alla pagina di caricarsi e verificare se gli elementi esistono
      const timer = setTimeout(() => {
        // Controlliamo se nella nuova pagina ci sono elementi di tutorial da mostrare
        const pageId = location.pathname.split('/')[1] || 'dashboard';
        const pageSteps = TUTORIAL_STEPS_BY_PAGE[pageId as keyof typeof TUTORIAL_STEPS_BY_PAGE];
        
        // Se ci sono step specifici per questa pagina, li mostriamo
        if (pageSteps && !completedTutorials.includes(`tour_${pageId}`)) {
          console.log(`TutorialContext: Inizializzazione tutorial per pagina ${pageId}`);
          
          // Usiamo il timer per assicurarci che la pagina sia caricata
          setTimeout(() => {
            // Verifichiamo se almeno uno dei target esiste
            const hasValidTarget = pageSteps.some(step => {
              try {
                if (step.target === 'body' || step.target === 'aside') return true;
                return !!document.querySelector(step.target as string);
              } catch (error) {
                return false;
              }
            });
            
            if (hasValidTarget) {
              console.log(`TutorialContext: Avvio tutorial per pagina ${pageId}`);
              startTutorial(pageSteps);
            }
          }, 500);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  const markTutorialAsCompleted = useCallback((tutorialId: string) => {
    console.log('TutorialContext: Marking tutorial as completed:', tutorialId);
    setCompletedTutorials(prev => {
      // Evita duplicati
      if (prev.includes(tutorialId)) return prev;
      
      const newCompleted = [...prev, tutorialId];
      try {
        localStorage.setItem(TUTORIALS_COMPLETED_KEY, JSON.stringify(newCompleted));
      } catch (error) {
        console.error('Errore nel salvare i tutorial completati:', error);
      }
      return newCompleted;
    });
  }, []);

  const startTutorial = useCallback((newSteps: Step[] = DEFAULT_TUTORIAL_STEPS) => {
    console.log('TutorialContext: Avvio tutorial con steps:', newSteps.length);
    // Chiudi prima qualsiasi tutorial aperto
    setIsOpen(false);
    
    // Pulisci gli step esistenti
    setSteps([]);
    
    // Validazione degli step
    const validSteps = newSteps.filter(step => {
      try {
        if (step.target === 'body' || step.target === 'aside') return true;
        return !!document.querySelector(step.target as string);
      } catch (error) {
        console.error('Errore nella validazione dello step:', error);
        return false;
      }
    });
    
    if (validSteps.length === 0) {
      console.log('TutorialContext: Nessuno step valido trovato, tutorial non avviato');
      return;
    }
    
    // Imposta i nuovi step dopo un breve delay per permettere il reset
    setTimeout(() => {
      setSteps(validSteps);
      
      // Apri il tutorial dopo che gli step sono stati impostati
      setTimeout(() => {
        setIsOpen(true);
      }, 100);
    }, 50);
  }, []);

  const resetTutorial = useCallback(() => {
    setIsOpen(false);
    setSteps([]);
  }, []);

  // Funzione per gestire la chiusura del tutorial con opzione per segnare come completato
  const closeTutorial = useCallback((markCompleted = false) => {
    console.log('TutorialContext: Chiusura controllata del tutorial');
    
    // Se richiesto, segna il tutorial come completato
    if (markCompleted) {
      const pageId = location.pathname.split('/')[1] || 'dashboard';
      markTutorialAsCompleted(`tour_${pageId}`);
    }
    
    // Chiudi il tutorial
    setIsOpen(false);
    setSteps([]);
  }, [location.pathname, markTutorialAsCompleted]);

  return (
    <TutorialContext.Provider value={{ 
      isOpen, 
      setIsOpen, 
      steps, 
      setSteps, 
      completedTutorials, 
      markTutorialAsCompleted,
      startTutorial,
      resetTutorial,
      closeTutorial
    }}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial deve essere usato all\'interno di un TutorialProvider');
  }
  return context;
} 