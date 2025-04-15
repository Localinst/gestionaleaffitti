import React, { createContext, useContext, ReactNode } from 'react';

// Interfaccia per il contesto dell'abbonamento
interface SubscriptionContextProps {
  isSubscribed: boolean;
  subscriptionDetails: {
    plan: string;
    status: string;
    nextBillingDate: Date | null;
  };
}

// Valore di default per il contesto
const defaultSubscriptionContext: SubscriptionContextProps = {
  isSubscribed: true, // Tutti gli utenti sono considerati abbonati
  subscriptionDetails: {
    plan: 'GRATUITO',
    status: 'attivo',
    nextBillingDate: null,
  },
};

// Creazione del contesto
const SubscriptionContext = createContext<SubscriptionContextProps>(defaultSubscriptionContext);

// Hook per utilizzare il contesto
export const useSubscription = () => useContext(SubscriptionContext);

// Provider del contesto
export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Tutti gli utenti ora hanno un abbonamento attivo gratuito
  const subscriptionState: SubscriptionContextProps = {
    isSubscribed: true,
    subscriptionDetails: {
      plan: 'GRATUITO',
      status: 'attivo',
      nextBillingDate: null,
    },
  };

  return (
    <SubscriptionContext.Provider value={subscriptionState}>
      {children}
    </SubscriptionContext.Provider>
  );
}; 