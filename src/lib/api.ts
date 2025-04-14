// Funzione per determinare l'URL dell'API in base all'ambiente
const getApiUrl = () => {
  // In produzione, usa URL relativo
  if (window.location.hostname !== 'localhost') {
    return '/api';
  }
  // In sviluppo, usa localhost
  return 'http://localhost:3000/api';
};

const API_URL = getApiUrl();

// Configurazione globale per timeout e retry
const API_TIMEOUT = 15000; // 15 secondi di timeout
const MAX_RETRIES = 1; // Numero massimo di tentativi in caso di timeout

// Funzione avanzata per fetch con timeout e retry
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = API_TIMEOUT, retries = MAX_RETRIES): Promise<Response> {
  return new Promise(async (resolve, reject) => {
    // Controller per abortire la richiesta in caso di timeout
    const controller = new AbortController();
    const { signal } = controller;
    
    // Timer per il timeout
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.warn(`Timeout nella richiesta a ${url} dopo ${timeout}ms`);
    }, timeout);
    
    // Incrementa il contatore di richieste attive
    activeRequests++;
    console.log(`Iniziata richiesta a ${url} - Richieste attive: ${activeRequests}`);
    
    // Funzione per eseguire la richiesta con possibilità di retry
    const executeRequest = async (attemptNumber = 0) => {
      try {
        console.log(`Esecuzione richiesta a ${url} - tentativo ${attemptNumber + 1}`);
        const response = await fetch(url, { ...options, signal });
        clearTimeout(timeoutId);
        
        // Rilascia lo slot di richiesta
        activeRequests--;
        console.log(`Completata richiesta a ${url} - Richieste attive: ${activeRequests}`);
        
        resolve(response);
      } catch (error) {
        clearTimeout(timeoutId);
        
        // Rilascia lo slot di richiesta in caso di errore
        activeRequests--;
        console.log(`Errore nella richiesta a ${url} - Richieste attive: ${activeRequests}`);
        
        // Se l'errore è dovuto al timeout (abort) e abbiamo ancora tentativi disponibili
        if (error.name === 'AbortError' && attemptNumber < retries) {
          console.warn(`Richiesta abortita, ritentativo ${attemptNumber + 1}/${retries + 1}`);
          // Riprova dopo un breve delay (backoff esponenziale)
          const delay = Math.min(1000 * Math.pow(2, attemptNumber), 5000);
          setTimeout(() => executeRequest(attemptNumber + 1), delay);
        } else {
          // Se abbiamo esaurito i tentativi o si tratta di un altro errore
          console.error(`Errore definitivo nella richiesta dopo ${attemptNumber + 1} tentativi:`, error);
          reject(error);
        }
      }
    };
    
    // Avvia la richiesta
    executeRequest();
  });
}

// Limita il numero di richieste parallele
const MAX_CONCURRENT_REQUESTS = 9999; // Valore molto alto che in pratica elimina la limitazione
let activeRequests = 0;

// Funzione per ottenere gli headers con autenticazione
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Handler generico per gli errori delle richieste
export const handleRequestError = (endpoint: string, error: any) => {
  console.error(`Errore nella richiesta a ${endpoint}:`, error);
  
  // Se è un errore di timeout, possiamo mostrare un messaggio specifico
  if (error.name === 'AbortError') {
    return { error: 'La richiesta ha impiegato troppo tempo. Il server potrebbe essere sovraccarico o non raggiungibile.' };
  }
  
  // Altri tipi di errori
  return { error: "Si è verificato un errore di connessione. Prova ad aggiornare la pagina o a riavviare l'applicazione." };
};

export const api = {
  properties: {
    getAll: async () => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/properties`, {
          headers: getAuthHeaders()
        });
        return res.json();
      } catch (error) {
        return handleRequestError('properties/getAll', error);
      }
    },
    getById: async (id: string) => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/properties/${id}`, {
          headers: getAuthHeaders()
        });
        return res.json();
      } catch (error) {
        return handleRequestError(`properties/getById/${id}`, error);
      }
    },
    create: async (data: any) => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/properties`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(data)
        });
        return res.json();
      } catch (error) {
        return handleRequestError('properties/create', error);
      }
    },
    update: async (id: string, data: any) => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/properties/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(data)
        });
        return res.json();
      } catch (error) {
        return handleRequestError(`properties/update/${id}`, error);
      }
    },
    delete: async (id: string) => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/properties/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        return res.json();
      } catch (error) {
        return handleRequestError(`properties/delete/${id}`, error);
      }
    }
  },
  tenants: {
    getAll: async () => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/tenants`, {
          headers: getAuthHeaders()
        });
        return res.json();
      } catch (error) {
        return handleRequestError('tenants/getAll', error);
      }
    },
    getById: async (id: string) => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/tenants/${id}`, {
          headers: getAuthHeaders()
        });
        return res.json();
      } catch (error) {
        return handleRequestError(`tenants/getById/${id}`, error);
      }
    },
    create: async (data: any) => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/tenants`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(data)
        });
        return res.json();
      } catch (error) {
        return handleRequestError('tenants/create', error);
      }
    },
    update: async (id: string, data: any) => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/tenants/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(data)
        });
        return res.json();
      } catch (error) {
        return handleRequestError(`tenants/update/${id}`, error);
      }
    },
    delete: async (id: string) => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/tenants/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        return res.json();
      } catch (error) {
        return handleRequestError(`tenants/delete/${id}`, error);
      }
    }
  },
  transactions: {
    getAll: async () => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/transactions`, {
          headers: getAuthHeaders()
        });
        return res.json();
      } catch (error) {
        return handleRequestError('transactions/getAll', error);
      }
    },
    getById: async (id: string) => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/transactions/${id}`, {
          headers: getAuthHeaders()
        });
        return res.json();
      } catch (error) {
        return handleRequestError(`transactions/getById/${id}`, error);
      }
    },
    create: async (data: any) => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/transactions`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(data)
        });
        return res.json();
      } catch (error) {
        return handleRequestError('transactions/create', error);
      }
    },
    update: async (id: string, data: any) => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/transactions/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(data)
        });
        return res.json();
      } catch (error) {
        return handleRequestError(`transactions/update/${id}`, error);
      }
    },
    delete: async (id: string) => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/transactions/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        return res.json();
      } catch (error) {
        return handleRequestError(`transactions/delete/${id}`, error);
      }
    }
  },
  dashboard: {
    getSummary: async () => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/dashboard/summary`, {
          headers: getAuthHeaders()
        });
        return res.json();
      } catch (error) {
        return handleRequestError('dashboard/getSummary', error);
      }
    },
    getChartData: async () => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/dashboard/charts`, {
          headers: getAuthHeaders()
        });
        return res.json();
      } catch (error) {
        return handleRequestError('dashboard/getChartData', error);
      }
    },
    debug: async () => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/dashboard/debug`, {
          headers: getAuthHeaders()
        });
        return res.json();
      } catch (error) {
        return handleRequestError('dashboard/debug', error);
      }
    }
  },
  reports: {
    getSummary: async (params: any) => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/reports/summary${formatQueryParams(params)}`, {
          headers: getAuthHeaders()
        });
        return res.json();
      } catch (error) {
        return handleRequestError('reports/getSummary', error);
      }
    },
    getPropertyPerformance: async (params: any) => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/reports/properties${formatQueryParams(params)}`, {
          headers: getAuthHeaders()
        });
        return res.json();
      } catch (error) {
        return handleRequestError('reports/getPropertyPerformance', error);
      }
    },
    getFinancialData: async (params: any) => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/reports/financial${formatQueryParams(params)}`, {
          headers: getAuthHeaders()
        });
        return res.json();
      } catch (error) {
        return handleRequestError('reports/getFinancialData', error);
      }
    },
    exportReport: async (format: string, params: any) => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/reports/export/${format}${formatQueryParams(params)}`, {
          headers: getAuthHeaders()
        });
        return res.blob();
      } catch (error) {
        console.error(`Errore nell'esportazione del report:`, error);
        throw new Error('Non è stato possibile esportare il report. Riprova più tardi.');
      }
    }
  }
};

// Funzione per formattare i parametri di query URL
function formatQueryParams(params: Record<string, any>): string {
  if (!params || Object.keys(params).length === 0) return '';
  
  const queryString = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
    
  return queryString ? `?${queryString}` : '';
} 