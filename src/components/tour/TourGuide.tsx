import React, { useEffect, useState, useCallback } from 'react';
import Joyride, { CallBackProps, STATUS, Step, ACTIONS } from 'react-joyride';
import { useTutorial } from '@/context/TutorialContext';
import { useLocation } from 'react-router-dom';

export function TourGuide() {
  const { isOpen, setIsOpen, steps, setSteps, closeTutorial } = useTutorial();
  const location = useLocation();
  const [filteredSteps, setFilteredSteps] = useState<Step[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  // Gestore degli errori
  const handleError = useCallback((e: Error) => {
    console.error('TourGuide: Errore imprevisto:', e);
    setError(e);
    // Chiudi il tutorial in caso di errore
    closeTutorial();
  }, [closeTutorial]);

  // Reset dell'errore quando cambia lo stato di apertura
  useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  // Aggiungi un gestore di errori globale per il componente
  useEffect(() => {
    if (!isOpen) return;
    
    const errorHandler = (event: ErrorEvent) => {
      // Controlliamo se l'errore è correlato al nostro componente
      if (event.message?.toLowerCase().includes('joyride') || 
          event.message?.toLowerCase().includes('tour') ||
          event.filename?.includes('TourGuide')) {
        console.error('TourGuide: Errore di runtime intercettato:', event.message);
        closeTutorial();
        
        // Previeni la propagazione dell'errore
        event.preventDefault();
      }
    };
    
    window.addEventListener('error', errorHandler);
    
    return () => {
      window.removeEventListener('error', errorHandler);
    };
  }, [isOpen, closeTutorial]);

  // Effettua il filtraggio degli step quando steps o isOpen cambiano
  useEffect(() => {
    if (!steps || steps.length === 0 || !isOpen) return;

    try {
      // Filtra gli step in base alla pagina corrente per evitare errori
      const validSteps = steps.filter(step => {
        // Sempre mantieni gli step generici
        if (step.target === 'body') return true;
        if (step.target === 'aside') return true;
        
        try {
          // Per tutti gli altri, verifica se l'elemento esiste
          const target = document.querySelector(step.target as string);
          return !!target;
        } catch (error) {
          // In caso di selettore non valido, escludiamo lo step
          console.error('Errore nel filtro step:', error);
          return false;
        }
      });

      console.log('TourGuide: Step filtrati:', validSteps.length);
      setFilteredSteps(validSteps);
    } catch (e) {
      handleError(e as Error);
    }
  }, [steps, isOpen, location.pathname, handleError]);

  // Evita cicli di aggiornamento inutili
  useEffect(() => {
    if (isOpen && filteredSteps.length === 0 && steps.length > 0) {
      console.log('TourGuide: Nessun target valido trovato, chiudo il tutorial');
      setIsOpen(false);
    }
  }, [filteredSteps, isOpen, steps, setIsOpen]);
  
  // Aggiungi un gestore di eventi a livello globale per prevenire che i clic casuali chiudano il tutorial
  useEffect(() => {
    if (!isOpen) return;
    
    // Funzione per prevenire il click propagation se l'utente clicca fuori dal tooltip
    const handleClickOutside = (e: MouseEvent) => {
      // Previeni che i clic casuali chiudano il tutorial
      const tooltipElements = document.querySelectorAll('[data-tour-elem="tooltip"], [data-tour-elem="controls"]');
      const overlayElement = document.querySelector('[data-tour-elem="overlay"]');
      
      // Se l'elemento cliccato non è il tooltip e non è un elemento interagibile all'interno dello spotlight
      const isTooltip = Array.from(tooltipElements).some(elem => elem.contains(e.target as Node));
      const isOverlayClick = overlayElement && overlayElement.contains(e.target as Node);
      
      // Se non è un clic sul tooltip e non è un clic consentito con spotlightClicks
      if (!isTooltip && isOverlayClick) {
        e.stopPropagation();
        e.preventDefault();
        console.log('TourGuide: Clic esterno bloccato per prevenire chiusura accidentale');
      }
    };
    
    // Aggiungi il listener per intercettare i clic
    document.addEventListener('click', handleClickOutside, true);
    document.addEventListener('mousedown', handleClickOutside, true);
    
    // Cleanup
    return () => {
      document.removeEventListener('click', handleClickOutside, true);
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isOpen]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index, action, lifecycle } = data;
    
    console.log('TourGuide: Callback ricevuto:', { status, type, index, action, lifecycle });
    
    // Gestisci il completamento del tutorial
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      console.log('TourGuide: Tutorial completato o saltato');
      closeTutorial(status === STATUS.FINISHED);
      setCurrentIndex(0);
      return;
    }

    // Gestisci i clic sull'overlay
    if (type === 'overlay:click') {
      // Blocca l'azione predefinita, che sarebbe quella di chiudere il tutorial
      console.log('TourGuide: Clic sull\'overlay intercettato, ignoro');
      return;
    }

    // Aggiorna l'indice corrente quando cambia
    if (type === 'step:after' && action === ACTIONS.NEXT && typeof index === 'number') {
      const nextIndex = index + 1;
      console.log(`TourGuide: Avanzamento allo step ${nextIndex}`);
      setCurrentIndex(nextIndex);
    } else if (type === 'step:after' && action === ACTIONS.PREV && typeof index === 'number' && index > 0) {
      const prevIndex = index - 1;
      console.log(`TourGuide: Tornando allo step ${prevIndex}`);
      setCurrentIndex(prevIndex);
    }

    // Gestisci errori di target non trovati
    if (type === 'error:target_not_found') {
      console.warn(`TourGuide: Target non trovato per lo step ${index}:`, filteredSteps[index]?.target);
      
      if (typeof index === 'number') {
        if (action === ACTIONS.NEXT && index < filteredSteps.length - 1) {
          // Avanza automaticamente al prossimo step se il target non è trovato
          console.log(`TourGuide: Target non trovato, avanzo allo step ${index + 1}`);
          setTimeout(() => {
            setCurrentIndex(index + 1);
          }, 100);
        } else if (action === ACTIONS.PREV && index > 0) {
          // Torna al passo precedente se l'utente ha cliccato "indietro"
          console.log(`TourGuide: Target non trovato, torno allo step ${index - 1}`);
          setTimeout(() => {
            setCurrentIndex(index - 1);
          }, 100);
        }
      }
    }
  };

  // Se c'è stato un errore, mostriamo un messaggio
  if (error) {
    // Tentativo di reset
    setTimeout(() => {
      closeTutorial();
      setError(null);
    }, 100);
    return null;
  }

  // Non renderizzare nulla se non necessario
  if (!steps || steps.length === 0 || !isOpen || filteredSteps.length === 0) {
    return null;
  }

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      stepIndex={currentIndex}
      hideCloseButton={false}
      hideBackButton={false}
      run={isOpen}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={filteredSteps}
      disableOverlayClose={true}
      disableCloseOnEsc={false}
      disableScrolling={false}
      spotlightClicks={false}
      spotlightPadding={5}
      disableBeacon
      locale={{
        back: 'Indietro',
        close: 'Chiudi',
        last: 'Fine',
        next: 'Avanti',
        skip: 'Salta'
      }}
      styles={{
        options: {
          arrowColor: '#f0f5ff',
          backgroundColor: '#f0f5ff',
          overlayColor: 'rgba(0, 30, 60, 0.4)',
          primaryColor: '#3b82f6',
          textColor: '#1e3a8a',
          zIndex: 1000,
          width: 400,
          spotlightShadow: '0 0 15px rgba(0, 0, 0, 0.3)',
        },
        buttonNext: {
          backgroundColor: '#3b82f6',
          color: 'white',
          fontSize: '14px',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer',
        },
        buttonBack: {
          color: '#3b82f6',
          marginRight: 10,
          fontSize: '14px',
          cursor: 'pointer',
        },
        buttonSkip: {
          color: '#64748b',
          fontSize: '14px',
        },
        tooltip: {
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltipTitle: {
          fontSize: '18px',
          fontWeight: 'bold',
          margin: '0 0 10px 0',
          color: '#1e3a8a',
        },
        tooltipContent: {
          fontSize: '14px',
          color: '#334155',
        },
        overlay: {
          cursor: 'not-allowed'
        },
        spotlight: {
          backgroundColor: 'transparent',
        }
      }}
    />
  );
} 