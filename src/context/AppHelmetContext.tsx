import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';

interface AppHelmetContextType {
  setMainH1Used: (used: boolean) => void;
  isMainH1Used: boolean;
  resetMainH1Usage: () => void;
}

const AppHelmetContext = createContext<AppHelmetContextType | undefined>(undefined);

interface AppHelmetProviderProps {
  children: ReactNode;
}

export const AppHelmetProvider: React.FC<AppHelmetProviderProps> = ({ children }) => {
  const [isMainH1Used, setMainH1Used] = useState(false);
  
  const resetMainH1Usage = () => {
    setMainH1Used(false);
  };

  return (
    <AppHelmetContext.Provider value={{ isMainH1Used, setMainH1Used, resetMainH1Usage }}>
      {children}
    </AppHelmetContext.Provider>
  );
};

export const useAppHelmet = (): AppHelmetContextType => {
  const context = useContext(AppHelmetContext);
  if (context === undefined) {
    throw new Error('useAppHelmet must be used within an AppHelmetProvider');
  }
  return context;
};

// Componente per gestire l'H1 principale per SEO
interface MainH1Props {
  children: ReactNode;
  className?: string;
}

export const MainH1: React.FC<MainH1Props> = ({ children, className }) => {
  const { isMainH1Used, setMainH1Used } = useAppHelmet();
  
  React.useEffect(() => {
    // Se il componente viene montato, segna che un H1 è stato utilizzato
    setMainH1Used(true);
    
    // Cleanup quando il componente viene smontato
    return () => {
      setMainH1Used(false);
    };
  }, [setMainH1Used]);

  // Se un H1 è già stato utilizzato in questa pagina, renderizza un H2 invece
  if (isMainH1Used) {
    console.warn('Un H1 è già stato utilizzato in questa pagina. Renderizzato come H2 per evitare duplicati.');
    return <h2 className={className}>{children}</h2>;
  }

  return <h1 className={className}>{children}</h1>;
};

// Hook per controllare se è possibile utilizzare un H1
export const useCanUseH1 = () => {
  const { isMainH1Used } = useAppHelmet();
  return !isMainH1Used;
}; 