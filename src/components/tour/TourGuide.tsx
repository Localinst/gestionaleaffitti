import React, { useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step, ACTIONS } from 'react-joyride';
import { useTutorial } from '@/context/TutorialContext';
import { useLocation } from 'react-router-dom';

export function TourGuide() {
  const { isOpen, setIsOpen, steps, setSteps } = useTutorial();
  const location = useLocation();

  // Log quando il componente si monta o quando cambia isOpen
  useEffect(() => {
    console.log('TourGuide: Componente montato/aggiornato');
    console.log('TourGuide: isOpen:', isOpen);
    console.log('TourGuide: steps:', steps);
  }, [isOpen, steps]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index, action } = data;
    console.log('TourGuide: Callback ricevuto:', { status, type, index, action });
    
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      console.log('TourGuide: Tutorial completato o saltato');
      setIsOpen(false);
    }

    // Salta gli elementi non trovati
    if (type === 'error:target_not_found' && action === 'next' && index < steps.length - 1) {
      console.log('TourGuide: Target non trovato, salto allo step successivo');
      data.lifecycle = 'complete';
    }
  };

  // Se non ci sono passaggi o il tutorial non è aperto, non mostrare nulla
  if (!steps || steps.length === 0 || !isOpen) {
    console.log('TourGuide: Nessun step disponibile o tutorial non aperto');
    return null;
  }

  // Filtra gli step in base alla pagina corrente per evitare errori
  const filteredSteps = steps.filter(step => {
    // Sempre mantieni i body
    if (step.target === 'body') return true;
    // Sempre mantieni la sidebar
    if (step.target === 'aside') return true;
    // Per tutti gli altri, verifica se l'elemento esiste
    const target = document.querySelector(step.target as string);
    return !!target;
  });

  console.log('TourGuide: Step filtrati:', filteredSteps.length);

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton={false}
      hideBackButton={false}
      run={isOpen}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={filteredSteps}
      disableOverlayClose
      disableScrolling
      spotlightClicks
      spotlightPadding={5}
      disableBeacon
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
        },
        buttonBack: {
          color: '#3b82f6',
          marginRight: 10,
          fontSize: '14px',
        },
        buttonSkip: {
          color: '#64748b',
          fontSize: '14px',
        },
        buttonClose: {
          display: 'none',
        },
        beacon: {
          display: 'none',
        },
        beaconInner: {
          display: 'none',
        },
        beaconOuter: {
          display: 'none',
        },
        overlay: {
          cursor: 'default',
        },
        spotlight: {
          borderRadius: '8px',
          boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.3)',
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
      }}
    />
  );
} 