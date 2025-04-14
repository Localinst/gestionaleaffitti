import React, { createContext, useContext, useState, useEffect } from 'react';
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

interface TutorialContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  steps: Step[];
  setSteps: (steps: Step[]) => void;
  completedTutorials: string[];
  markTutorialAsCompleted: (tutorialId: string) => void;
  startTutorial: (newSteps?: Step[]) => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

const TUTORIAL_STORAGE_KEY = 'tutorial_completed';

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [completedTutorials, setCompletedTutorials] = useState<string[]>(() => {
    const saved = localStorage.getItem('completedTutorials');
    return saved ? JSON.parse(saved) : [];
  });

  // Log quando isOpen cambia
  useEffect(() => {
    console.log('TutorialContext: isOpen cambiato a:', isOpen);
  }, [isOpen]);

  // Log quando steps cambia
  useEffect(() => {
    console.log('TutorialContext: steps aggiornati:', steps);
  }, [steps]);

  const markTutorialAsCompleted = (tutorialId: string) => {
    console.log('TutorialContext: Marking tutorial as completed:', tutorialId);
    setCompletedTutorials(prev => {
      const newCompleted = [...prev, tutorialId];
      localStorage.setItem('completedTutorials', JSON.stringify(newCompleted));
      return newCompleted;
    });
  };

  const startTutorial = (newSteps: Step[] = DEFAULT_TUTORIAL_STEPS) => {
    console.log('TutorialContext: Avvio tutorial con steps:', newSteps);
    setSteps(newSteps);
    // Impostiamo isOpen a true dopo un piccolo delay per assicurarci che gli steps siano stati impostati
    setTimeout(() => {
      setIsOpen(true);
    }, 100);
  };

  return (
    <TutorialContext.Provider value={{ 
      isOpen, 
      setIsOpen, 
      steps, 
      setSteps, 
      completedTutorials, 
      markTutorialAsCompleted,
      startTutorial 
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