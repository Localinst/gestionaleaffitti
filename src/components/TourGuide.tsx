import { useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useTutorial } from '@/context/TutorialContext';

export function TourGuide() {
  const { isActive, stopTutorial, currentSteps, setCurrentSteps } = useTutorial();

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      stopTutorial();
    }
  };

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={isActive}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={currentSteps}
      styles={{
        options: {
          arrowColor: 'hsl(var(--background))',
          backgroundColor: 'hsl(var(--background))',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          primaryColor: 'hsl(var(--primary))',
          textColor: 'hsl(var(--foreground))',
          zIndex: 1000,
        },
      }}
    />
  );
} 