import React from 'react';
import { useTutorial } from '@/context/TutorialContext';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';

export const TutorialButton: React.FC = () => {
  const { startTutorial } = useTutorial();
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={startTutorial}
      className="flex items-center gap-2"
    >
      <HelpCircle className="h-4 w-4" />
      <span>Guida</span>
    </Button>
  );
};

export default TutorialButton; 