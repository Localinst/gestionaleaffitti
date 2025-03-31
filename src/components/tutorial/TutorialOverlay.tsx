import React, { useEffect, useState } from 'react';
import { useTutorial } from '@/context/TutorialContext';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export const TutorialOverlay: React.FC = () => {
  const { 
    isActive, 
    currentStep, 
    steps, 
    nextStep, 
    prevStep, 
    skipTutorial 
  } = useTutorial();
  
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const navigate = useNavigate();
  
  // Gestisce la posizione del tooltip
  useEffect(() => {
    if (!isActive) return;
    
    const currentTutorialStep = steps[currentStep];
    
    // Se lo step corrente ha una pagina specifica, naviga ad essa
    if (currentTutorialStep.page) {
      navigate(currentTutorialStep.page);
    }
    
    // Trova l'elemento target
    const findElement = () => {
      setTimeout(() => {
        const element = document.querySelector(currentTutorialStep.target) as HTMLElement;
        
        if (element) {
          setTargetElement(element);
          
          // Calcola la posizione del tooltip
          const rect = element.getBoundingClientRect();
          
          let top = 0;
          let left = 0;
          
          switch (currentTutorialStep.position) {
            case 'top':
              top = rect.top - 10 - 150; // 150px è l'altezza stimata del tooltip
              left = rect.left + rect.width / 2 - 150; // 300px è la larghezza stimata del tooltip
              break;
            case 'right':
              top = rect.top + rect.height / 2 - 75;
              left = rect.right + 10;
              break;
            case 'bottom':
              top = rect.bottom + 10;
              left = rect.left + rect.width / 2 - 150;
              break;
            case 'left':
              top = rect.top + rect.height / 2 - 75;
              left = rect.left - 10 - 300;
              break;
          }
          
          // Assicura che il tooltip sia sempre visibile nella finestra
          top = Math.max(10, top);
          top = Math.min(window.innerHeight - 160, top);
          left = Math.max(10, left);
          left = Math.min(window.innerWidth - 310, left);
          
          setTooltipPosition({ top, left });
          
          // Aggiungi un effetto di highlight all'elemento
          element.classList.add('tutorial-highlight');
        }
      }, 300); // Breve timeout per permettere alla navigazione di completarsi
    };
    
    findElement();
    
    // Rimuovi l'highlight quando cambi step
    return () => {
      if (targetElement) {
        targetElement.classList.remove('tutorial-highlight');
      }
    };
  }, [isActive, currentStep, steps, navigate]);
  
  if (!isActive) return null;
  
  const currentTutorialStep = steps[currentStep];
  
  return (
    <>
      {/* Overlay semitrasparente */}
      <div className="fixed inset-0 bg-black/50 z-[999] pointer-events-none" />
      
      {/* Tooltip del tutorial */}
      <AnimatePresence>
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="fixed z-[1000] bg-card shadow-lg rounded-lg p-4 w-[300px]"
          style={{
            top: tooltipPosition.top + 'px',
            left: tooltipPosition.left + 'px',
          }}
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">{currentTutorialStep.title}</h3>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={skipTutorial}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            {currentTutorialStep.description}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {currentStep + 1} / {steps.length}
            </div>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Indietro
              </Button>
              
              <Button
                size="sm"
                variant="default"
                onClick={nextStep}
              >
                {currentStep === steps.length - 1 ? 'Fine' : 'Avanti'}
                {currentStep !== steps.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default TutorialOverlay; 