import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

// Chiavi di query per React Query
export const queryKeys = {
  properties: ['properties'],
  propertyById: (id: string) => ['properties', id],
  tenants: ['tenants'],
  tenantsByProperty: (propertyId: string) => ['tenants', 'property', propertyId],
  transactions: ['transactions'],
  transactionsByProperty: (propertyId: string) => ['transactions', 'property', propertyId],
  contracts: ['contracts'],
  contractsByProperty: (propertyId: string) => ['contracts', 'property', propertyId],
  owners: ['owners'],
  dashboardSummary: ['dashboard', 'summary'],
  reports: {
    financialData: (params: Record<string, any>) => ['reports', 'financial', params],
    summary: (params: Record<string, any>) => ['reports', 'summary', params],
    propertyPerformance: (params: Record<string, any>) => ['reports', 'property-performance', params],
  }
};

// Hook per ottenere tutte le proprietà
export function useProperties() {
  return useQuery({
    queryKey: queryKeys.properties,
    queryFn: () => api.properties.getAll(),
  });
}

// Hook per ottenere una proprietà specifica
export function usePropertyById(id: string) {
  return useQuery({
    queryKey: queryKeys.propertyById(id),
    queryFn: () => api.properties.getById(id),
    enabled: !!id, // Esegui la query solo se l'ID è definito
  });
}

// Hook per ottenere tutti gli inquilini
export function useTenants() {
  return useQuery({
    queryKey: queryKeys.tenants,
    queryFn: () => api.tenants.getAll(),
  });
}

// Hook per ottenere gli inquilini di una proprietà specifica
export function useTenantsByProperty(propertyId: string) {
  return useQuery({
    queryKey: queryKeys.tenantsByProperty(propertyId),
    queryFn: () => api.tenants.getByProperty(propertyId),
    enabled: !!propertyId, // Esegui la query solo se l'ID è definito
  });
}

// Hook per ottenere tutte le transazioni
export function useTransactions() {
  return useQuery({
    queryKey: queryKeys.transactions,
    queryFn: () => api.transactions.getAll(),
  });
}

// Hook per ottenere le transazioni di una proprietà specifica
export function useTransactionsByProperty(propertyId: string) {
  return useQuery({
    queryKey: queryKeys.transactionsByProperty(propertyId),
    queryFn: () => api.transactions.getByProperty(propertyId),
    enabled: !!propertyId, // Esegui la query solo se l'ID è definito
  });
}

// Hook per ottenere tutti i contratti
export function useContracts() {
  return useQuery({
    queryKey: queryKeys.contracts,
    queryFn: () => api.contracts.getAll(),
  });
}

// Hook per ottenere i contratti di una proprietà specifica
export function useContractsByProperty(propertyId: string) {
  return useQuery({
    queryKey: queryKeys.contractsByProperty(propertyId),
    queryFn: () => api.contracts.getByProperty(propertyId),
    enabled: !!propertyId, // Esegui la query solo se l'ID è definito
  });
}

// Hook per ottenere tutti i proprietari
export function useOwners() {
  return useQuery({
    queryKey: queryKeys.owners,
    queryFn: () => api.owners.getAll(),
  });
}

// Hook per ottenere il riepilogo della dashboard
export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboardSummary,
    queryFn: () => api.dashboard.getSummary(),
  });
}

// Hook per ottenere i dati finanziari per i report
export function useFinancialData(params: { startDate?: string, endDate?: string, propertyId?: string }) {
  const queryParams = {
    startDate: params.startDate,
    endDate: params.endDate,
    propertyId: params.propertyId !== "all" ? params.propertyId : undefined
  };

  return useQuery({
    queryKey: queryKeys.reports.financialData(queryParams),
    queryFn: () => api.reports.getFinancialData(queryParams),
    enabled: !!(params.startDate && params.endDate), // Esegui la query solo se le date sono definite
  });
}

// Hook per ottenere il riepilogo dei report
export function useReportSummary(params: { startDate?: string, endDate?: string, propertyId?: string }) {
  const queryParams = {
    startDate: params.startDate,
    endDate: params.endDate,
    propertyId: params.propertyId !== "all" ? params.propertyId : undefined
  };

  return useQuery({
    queryKey: queryKeys.reports.summary(queryParams),
    queryFn: () => api.reports.getSummary(queryParams),
    enabled: !!(params.startDate && params.endDate), // Esegui la query solo se le date sono definite
  });
}

// Hook per ottenere i dati di performance delle proprietà per i report
export function usePropertyPerformance(params: { startDate?: string, endDate?: string, propertyId?: string }) {
  const queryParams = {
    startDate: params.startDate,
    endDate: params.endDate,
    propertyId: params.propertyId !== "all" ? params.propertyId : undefined
  };

  return useQuery({
    queryKey: queryKeys.reports.propertyPerformance(queryParams),
    queryFn: () => api.reports.getPropertyPerformance(queryParams),
    enabled: !!(params.startDate && params.endDate), // Esegui la query solo se le date sono definite
  });
} 