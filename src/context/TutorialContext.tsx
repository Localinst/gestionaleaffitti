import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Definizione delle fasi del tutorial
export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target: string; // Selettore CSS o ID dell'elemento da evidenziare
  position: 'top' | 'right' | 'bottom' | 'left';
  page?: string; // URL della pagina in cui mostrare questo step
}

// Lista predefinita di fasi del tutorial
const DEFAULT_TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Benvenuto nel Gestionale Affitti',
    description: 'Questo tutorial ti guiderà attraverso le funzionalità principali dell\'applicazione.',
    target: 'body',
    position: 'top',
  },
  {
    id: 'sidebar',
    title: 'Menu di navigazione',
    description: 'Utilizza questa barra laterale per navigare tra le diverse sezioni dell\'applicazione.',
    target: 'aside',
    position: 'right',
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'La dashboard ti mostra una panoramica di tutte le informazioni importanti.',
    target: '[href="/dashboard"]',
    position: 'right',
    page: '/dashboard'
  },
  {
    id: 'properties',
    title: 'Gestione Proprietà',
    description: 'Qui puoi visualizzare e gestire tutte le tue proprietà.',
    target: '[href="/properties"]',
    position: 'right',
    page: '/properties'
  },
  {
    id: 'tenants',
    title: 'Gestione Inquilini',
    description: 'Qui puoi visualizzare e gestire tutti i tuoi inquilini.',
    target: '[href="/tenants"]',
    position: 'right',
    page: '/tenants'
  },
  {
    id: 'transactions',
    title: 'Gestione Transazioni',
    description: 'Qui puoi visualizzare e gestire tutte le transazioni finanziarie.',
    target: '[href="/transactions"]',
    position: 'right',
    page: '/transactions'
  },
  {
    id: 'contracts',
    title: 'Gestione Contratti',
    description: 'Qui puoi visualizzare e gestire tutti i contratti di affitto.',
    target: '[href="/contracts"]',
    position: 'right',
    page: '/contracts'
  },
  {
    id: 'tourism',
    title: 'Locazioni Turistiche',
    description: 'Gestisci le tue proprietà per affitti turistici e controlla le prenotazioni.',
    target: '[href="/tourism"]',
    position: 'right',
    page: '/tourism/properties'
  },
  {
    id: 'activities',
    title: 'Gestione Attività',
    description: 'Pianifica e monitora le attività relative agli immobili.',
    target: '[href="/activities"]',
    position: 'right',
    page: '/activities'
  },
  {
    id: 'reports',
    title: 'Report e Analisi',
    description: 'Visualizza report dettagliati e analizza i dati delle tue proprietà.',
    target: '[href="/reports"]',
    position: 'right',
    page: '/reports'
  },
  {
    id: 'end',
    title: 'Tutorial completato!',
    description: 'Hai completato il tour dell\'applicazione. Puoi riavviare questo tutorial in qualsiasi momento dal menu delle impostazioni.',
    target: 'body',
    position: 'top',
  }
];

// Tipizzazione del context
interface TutorialContextType {
  isActive: boolean;
  currentStep: number;
  steps: TutorialStep[];
  startTutorial: () => void;
  endTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  skipTutorial: () => void;
}

// Creazione del context con valori di default
const TutorialContext = createContext<TutorialContextType>({
  isActive: false,
  currentStep: 0,
  steps: DEFAULT_TUTORIAL_STEPS,
  startTutorial: () => {},
  endTutorial: () => {},
  nextStep: () => {},
  prevStep: () => {},
  goToStep: () => {},
  skipTutorial: () => {},
});

// Hook per usare il context
export const useTutorial = () => useContext(TutorialContext);

// Storage key per salvare lo stato del tutorial
const TUTORIAL_STORAGE_KEY = 'tutorial_completed';

// Provider del context
export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps] = useState<TutorialStep[]>(DEFAULT_TUTORIAL_STEPS);
  const location = useLocation();

  // Controlla se il tutorial è già stato completato
  useEffect(() => {
    const tutorialCompleted = localStorage.getItem(TUTORIAL_STORAGE_KEY) === 'true';
    // Se è il primo accesso all'app e il tutorial non è stato completato, mostralo automaticamente
    if (!tutorialCompleted && location.pathname === '/dashboard') {
      setIsActive(true);
    }
  }, [location]);

  // Ascolta l'evento personalizzato per avviare il tutorial
  useEffect(() => {
    const handleStartTutorial = () => {
      startTutorial();
    };

    window.addEventListener('start-tutorial', handleStartTutorial);

    return () => {
      window.removeEventListener('start-tutorial', handleStartTutorial);
    };
  }, []);

  // Avvia il tutorial
  const startTutorial = () => {
    setCurrentStep(0);
    setIsActive(true);
  };

  // Termina il tutorial
  const endTutorial = () => {
    setIsActive(false);
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
  };

  // Passa al prossimo step
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      endTutorial();
    }
  };

  // Torna allo step precedente
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Vai ad uno step specifico
  const goToStep = (step: number) => {
    if (step >= 0 && step < steps.length) {
      setCurrentStep(step);
    }
  };

  // Salta il tutorial
  const skipTutorial = () => {
    endTutorial();
  };

  return (
    <TutorialContext.Provider
      value={{
        isActive,
        currentStep,
        steps,
        startTutorial,
        endTutorial,
        nextStep,
        prevStep,
        goToStep,
        skipTutorial,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
};

export default TutorialProvider; 