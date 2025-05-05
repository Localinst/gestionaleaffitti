import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { api } from '@/services/api'; // Importiamo l'API reale
import { queryKeys } from '@/lib/queryKeys';

// Definisce le chiavi delle query comuni che vengono utilizzate in più pagine
// Queste saranno pre-caricate quando l'utente naviga
const COMMON_QUERIES = [
  queryKeys.dashboard.summary,
  queryKeys.properties.list,
  queryKeys.settings.all
];

// Mappa le pagine alle query che dovrebbero essere pre-caricate quando l'utente naviga verso quella pagina
const PAGE_SPECIFIC_PREFETCH: Record<string, readonly (readonly string[])[]> = {
  '/dashboard': [
    queryKeys.transactions.list,
    queryKeys.properties.list,
    queryKeys.dashboard.activities
  ],
  '/properties': [
    queryKeys.tenants.list,
    queryKeys.contracts.list
  ],
  '/tenants': [
    queryKeys.contracts.list
  ],
  '/transactions': [
    queryKeys.properties.list
  ]
};

export function DataPrefetcher({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const location = useLocation();
  
  // Pre-carica i dati comuni all'avvio dell'applicazione
  useEffect(() => {
    // Pre-carica le query comuni una sola volta all'avvio
    COMMON_QUERIES.forEach(queryKey => {
      // Verifica se i dati sono già in cache prima di richiedere
      if (!queryClient.getQueryData(queryKey)) {
        // Utilizziamo prefetchQuery per pre-caricare i dati senza renderli
        queryClient.prefetchQuery({
          queryKey: queryKey,
          queryFn: () => fetchData(queryKey),
          staleTime: 10 * 60 * 1000, // 10 minuti
        });
      }
    });
  }, [queryClient]);
  
  // Pre-carica i dati specifici della pagina quando l'utente naviga
  useEffect(() => {
    // Determina quali query pre-caricare in base al percorso corrente
    const pathToCheck = Object.keys(PAGE_SPECIFIC_PREFETCH).find(path => 
      location.pathname.startsWith(path)
    );
    
    if (pathToCheck) {
      const queriesToPrefetch = PAGE_SPECIFIC_PREFETCH[pathToCheck];
      
      // Pre-carica le query specifiche per questa pagina
      queriesToPrefetch.forEach(queryKey => {
        // Verifica se i dati sono già in cache prima di richiedere
        if (!queryClient.getQueryData(queryKey)) {
          queryClient.prefetchQuery({
            queryKey: queryKey,
            queryFn: () => fetchData(queryKey),
            staleTime: 5 * 60 * 1000, // 5 minuti
          });
        }
      });
    }
  }, [location.pathname, queryClient]);
  
  return <>{children}</>;
}

// Funzione che recupera i dati in base alla chiave di query
async function fetchData(queryKey: readonly string[]): Promise<any> {
  // Qui mappiamo le chiavi di query alle funzioni API appropriate
  const [resource, action = 'list', ...params] = queryKey;
  
  try {
    switch (resource) {
      case 'dashboard':
        if (action === 'summary') return api.dashboard.getSummary();
        if (action === 'activities') return api.dashboard.getActivities?.() || [];
        break;
        
      case 'properties':
        if (action === 'list') return api.properties.getAll();
        if (action === 'detail' && params[0]) return api.properties.getById(params[0]);
        break;
        
      case 'tenants':
        if (action === 'list') return api.tenants.getAll();
        if (action === 'detail' && params[0]) return api.tenants.getById(params[0]);
        break;
        
      case 'transactions':
        if (action === 'list') return api.transactions.getAll();
        if (action === 'detail' && params[0]) return api.transactions.getById?.(params[0]) || null;
        break;
        
      case 'contracts':
        if (action === 'list') return api.contracts?.getAll() || [];
        if (action === 'detail' && params[0]) return api.contracts?.getById?.(params[0]) || null;
        break;
        
      case 'settings':
        // Gestisci le impostazioni se hai un endpoint appropriato
        return {};
        
      default:
        console.warn(`Nessun handler per la chiave di query: ${queryKey.join('.')}`);
        return null;
    }
  } catch (error) {
    console.error(`Errore durante il recupero dei dati per ${queryKey.join('.')}:`, error);
    return null;
  }
}

export default DataPrefetcher; 