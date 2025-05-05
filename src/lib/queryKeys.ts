/**
 * File di utility per definire le chiavi di query utilizzate nell'applicazione
 * Questa struttura centralizzata rende più facile mantenere la coerenza
 * nelle chiavi di query tra i vari componenti
 */

export const queryKeys = {
  // Chiavi per la dashboard
  dashboard: {
    all: ['dashboard'] as const,
    summary: ['dashboard', 'summary'] as const,
    activities: ['dashboard', 'activities'] as const,
    stats: ['dashboard', 'stats'] as const
  },
  
  // Chiavi per le proprietà
  properties: {
    all: ['properties'] as const,
    list: ['properties', 'list'] as const,
    detail: (id: string) => ['properties', 'detail', id] as const,
    stats: ['properties', 'stats'] as const
  },
  
  // Chiavi per i contratti
  contracts: {
    all: ['contracts'] as const,
    list: ['contracts', 'list'] as const,
    detail: (id: string) => ['contracts', 'detail', id] as const,
    active: ['contracts', 'active'] as const,
    expiring: ['contracts', 'expiring'] as const
  },
  
  // Chiavi per gli inquilini
  tenants: {
    all: ['tenants'] as const,
    list: ['tenants', 'list'] as const,
    detail: (id: string) => ['tenants', 'detail', id] as const
  },
  
  // Chiavi per le transazioni
  transactions: {
    all: ['transactions'] as const,
    list: ['transactions', 'list'] as const,
    detail: (id: string) => ['transactions', 'detail', id] as const,
    recent: ['transactions', 'recent'] as const,
    byProperty: (propertyId: string) => ['transactions', 'by-property', propertyId] as const,
    byTenant: (tenantId: string) => ['transactions', 'by-tenant', tenantId] as const
  },
  
  // Chiavi per le notifiche
  notifications: {
    all: ['notifications'] as const,
    list: ['notifications', 'list'] as const,
    unread: ['notifications', 'unread'] as const
  },
  
  // Chiavi per le impostazioni utente
  settings: {
    all: ['settings'] as const,
    user: ['settings', 'user'] as const,
    application: ['settings', 'application'] as const
  }
};

export default queryKeys; 