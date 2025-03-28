
// Tipi di base
export interface Property {
  id: number;
  name: string;
  address: string;
  city: string;
  type: string;
  units: number;
  purchase_price: number;
  current_value: number;
  image_url?: string;
  unit_names?: string[] | string;
  created_at?: string;
  updated_at?: string;
  description?: string;
}

export interface Tenant {
  id: number;
  property_id: string | number;
  name: string;
  email: string;
  phone: string;
  lease_start: Date | string;
  lease_end: Date | string;
  rent_amount: number;
  rent: number;
  unit?: string;
  status?: 'active' | 'late' | 'pending';
}

export interface Transaction {
  id: number;
  property_id: number | string;
  tenant_id?: number | null;
  unit_index?: string;
  date: Date;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  property_name?: string;
  tenant_name?: string;
}

export interface Contract {
  id: number;
  property_id: number;
  tenant_id: number;
  start_date: Date | string;
  end_date: Date | string;
  rent_amount: number;
  deposit_amount: number;
  status: 'active' | 'expired' | 'terminated';
}

export interface Owner {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  tax_id: string;
}

interface DashboardSummary {
  totalProperties: number;
  totalUnits: number;
  totalTenants: number;
  occupancyRate: string;
  rentIncome: number;
}

import { DashboardSummaryResponse } from '@/components/dashboard/DashboardPage';

// Configurazione dell'URL API di base
function getAPIBaseUrl() {
  // Per debugging, mostra sempre quale URL viene usato
  const result = getActualAPIBaseUrl();
  console.log('API Base URL configurato:', result);
  return result;
}

// La funzione interna che determina l'URL effettivo
function getActualAPIBaseUrl() {
  // In ambiente di produzione, usa l'URL diretto del backend
  if (window.location.hostname !== 'localhost') {
    return 'https://gestionaleaffitti.onrender.com/api';
  }
  
  // In ambiente di sviluppo locale, usa localhost
  return `${window.location.protocol}//${window.location.hostname}:3000/api`;
}

// URL base dell'API
const API_URL = getAPIBaseUrl();

console.log('API Base URL:', API_URL);

// Interfacce per l'autenticazione
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: AuthUser;
  token: string;
}

// Funzione di utilità per ottenere le opzioni di richiesta con il token di autenticazione
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('authToken');
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Funzione di utilità per ottenere le opzioni della richiesta
const getRequestOptions = (method: string = 'GET', body?: any): RequestInit => {
  const options: RequestInit = {
    method,
    headers: getAuthHeaders()
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  return options;
};

// Funzione utility per gestire gli errori 401 in modo silenzioso
const handleApiError = (endpoint: string, status: number, error: any) => {
  // Per qualsiasi errore, logga solo in console
  console.error(`Errore nell'endpoint ${endpoint}:`, status, error);
};

/**
 * Assicura che tutti i valori numerici nelle transazioni siano effettivamente numeri
 * e non stringhe che potrebbero causare concatenazione.
 */
const ensureNumericValues = (transactions: Transaction[]): Transaction[] => {
  return transactions.map(transaction => {
    // Crea una copia della transazione per non modificare l'originale
    const cleanedTransaction = { ...transaction };
    
    // Converti il campo amount in un numero se è una stringa
    if (transaction.amount !== undefined && transaction.amount !== null) {
      if (typeof transaction.amount === 'string') {
        // Rimuovi caratteri non numerici tranne il punto decimale
        const cleanedAmount = String(transaction.amount).replace(/[^\d.-]/g, '');
        cleanedTransaction.amount = parseFloat(cleanedAmount);
        
        // Se la conversione fallisce, imposta a 0
        if (isNaN(cleanedTransaction.amount)) {
          console.warn(`Valore non valido nella transazione: ${transaction.amount}`);
          cleanedTransaction.amount = 0;
        }
      } else if (typeof transaction.amount !== 'number') {
        // Assicura che sia un numero anche se non è una stringa
        cleanedTransaction.amount = Number(transaction.amount) || 0;
      }
    }
    
    return cleanedTransaction;
  });
};

// API Auth
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  console.log('Effettuando login a:', `${API_URL}/auth/login`);
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    // Log dettagliato della risposta
    console.log('Login response status:', response.status);
    
    if (!response.ok) {
      let errorMessage = `Errore durante il login (${response.status})`;
      
      try {
        // Prova a interpretare la risposta come JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } else {
          // Se non è JSON, prova a leggere il testo
          const errorText = await response.text();
          console.error('Risposta non-JSON ricevuta:', errorText.substring(0, 200) + '...');
          if (response.status === 404) {
            errorMessage = 'Server API non raggiungibile. Verifica la configurazione del server.';
          }
        }
      } catch (parseError) {
        console.error('Errore nel parsing della risposta:', parseError);
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Login riuscito, dati utente ricevuti');
    return data;
  } catch (error) {
    console.error('Errore durante il login:', error);
    throw error;
  }
}

export async function register(userData: RegisterRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Errore durante la registrazione');
  }

  return response.json();
}

export async function logout(): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Errore durante il logout');
  }

  return response.json();
}

export async function getCurrentUser(): Promise<{ user: AuthUser }> {
  const response = await fetch(`${API_URL}/auth/me`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Non autenticato');
    }
    const error = await response.json();
    throw new Error(error.error || 'Errore durante il recupero dei dati utente');
  }

  return response.json();
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Errore durante il cambio password');
  }

  return response.json();
}

// API Properties
export async function getProperties(): Promise<Property[]> {
  try {
    const response = await fetch(`${API_URL}/properties`, getRequestOptions());
    
    if (!response.ok) {
      handleApiError('properties', response.status, null);
      throw new Error(`Errore nel caricamento delle proprietà: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.error('La risposta non è un array:', data);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Exception in getProperties:', error);
    return [];
  }
}

export async function getPropertyById(id: number): Promise<Property | null> {
  try {
    const response = await fetch(`${API_URL}/properties/${id}`, getRequestOptions());
    
    if (!response.ok) {
      console.error('Errore nella richiesta property by id:', response.status);
      throw new Error(`Errore nel caricamento della proprietà: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Exception in getPropertyById:', error);
    return null;
  }
}

// API Tenants
export async function getTenants(): Promise<Tenant[]> {
  try {
    const response = await fetch(`${API_URL}/tenants`, getRequestOptions());
    
    if (!response.ok) {
      handleApiError('tenants', response.status, response.statusText);
      throw new Error(`Errore nel caricamento degli inquilini: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.error('La risposta non è un array:', data);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Exception in getTenants:', error);
    return [];
  }
}

export async function getTenantsByProperty(propertyId: number | string): Promise<Tenant[]> {
  try {
    console.log('Richiesta getTenantsByProperty con ID:', propertyId, 'di tipo:', typeof propertyId);
    const response = await fetch(`${API_URL}/tenants?propertyId=${propertyId}`, getRequestOptions());
    
    if (!response.ok) {
      console.error('Errore nella richiesta tenants by property:', response.status);
      throw new Error(`Errore nel caricamento degli inquilini per proprietà: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Risposta API getTenantsByProperty:', data);
    
    if (!Array.isArray(data)) {
      console.error('La risposta non è un array:', data);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Exception in getTenantsByProperty:', error);
    return [];
  }
}

// API Transactions
export async function getTransactions(): Promise<Transaction[]> {
  try {
    const response = await fetch(`${API_URL}/transactions`, getRequestOptions());
    
    if (!response.ok) {
      handleApiError('transactions', response.status, null);
      throw new Error(`Errore nel caricamento delle transazioni: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.error('La risposta non è un array:', data);
      return [];
    }
    
    // Applica la funzione per garantire valori numerici
    return ensureNumericValues(data);
  } catch (error) {
    console.error('Exception in getTransactions:', error);
    return [];
  }
}

export async function getTransactionsByProperty(propertyId: number): Promise<Transaction[]> {
  try {
    const response = await fetch(`${API_URL}/transactions/property/${propertyId}`, getRequestOptions());
    
    if (!response.ok) {
      if (response.status === 401) {
        handleApiError('getTransactionsByProperty', 401, 'Non autenticato');
        throw new Error('Non autenticato');
      }
      const error = await response.json();
      throw new Error(error.error || `Errore durante il recupero delle transazioni per la proprietà ${propertyId}`);
    }
    
    const data = await response.json();
    
    // Applica la funzione per garantire valori numerici
    return ensureNumericValues(data);
  } catch (error) {
    console.error(`Errore durante il recupero delle transazioni per la proprietà:`, error);
    throw error;
  }
}

// Funzione di utilità per fetch con timeout
async function fetchWithTimeout(url: string, options: RequestInit, timeout = 15000): Promise<Response> {
  // Crea un controller per poter annullare la richiesta
  const controller = new AbortController();
  const { signal } = controller;
  
  // Crea un timer che annullerà la richiesta dopo il timeout specificato
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);
  
  try {
    // Aggiungi il signal alle opzioni di fetch
    const response = await fetch(url, { ...options, signal });
    
    // Pulisci il timer se la richiesta ha avuto successo
    clearTimeout(timeoutId);
    
    return response;
  } catch (error) {
    // Pulisci il timer in caso di errore
    clearTimeout(timeoutId);
    
    // Se l'errore è dovuto al timeout (aborted), lancia un errore specifico
    if (error.name === 'AbortError') {
      throw new Error(`La richiesta a ${url} ha superato il timeout di ${timeout}ms`);
    }
    
    // Altrimenti, rilancia l'errore originale
    throw error;
  }
}

// API Dashboard con timeout
export async function getDashboardSummary(): Promise<DashboardSummaryResponse> {
  console.log('Iniziando richiesta dashboard summary...');
  const startTime = Date.now();
  
  try {
    // Usa fetchWithTimeout invece di fetch normale, con timeout di 15 secondi
    const response = await fetchWithTimeout(
      `${API_URL}/dashboard/summary`, 
      getRequestOptions(),
      15000 // 15 secondi di timeout
    );
    
    // Log del tempo di risposta
    const responseTime = Date.now() - startTime;
    console.log(`Risposta ricevuta in ${responseTime}ms`);
    
    if (!response.ok) {
      handleApiError('dashboard/summary', response.status, null);
      throw new Error(`Errore nel caricamento del riepilogo dashboard: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    // Calcola quanto tempo è passato prima dell'errore
    const errorTime = Date.now() - startTime;
    
    // Log specifico per errori di timeout
    if (error.message && error.message.includes('timeout')) {
      console.error(`Timeout nella richiesta dashboard dopo ${errorTime}ms: ${error.message}`);
    } else {
      console.error(`Errore nella richiesta dashboard dopo ${errorTime}ms:`, error);
    }
    
    // Restituisci un oggetto predefinito in caso di errore
    return {
      totalProperties: 0,
      totalUnits: 0,
      totalTenants: 0,
      occupancyRate: "0.0",
      rentIncome: 0
    };
  }
}

// Debug function per verificare l'autenticazione
export async function debugAuth(): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/dashboard/debug`, getRequestOptions());
    
    if (!response.ok) {
      handleApiError('dashboard/debug', response.status, null);
      throw new Error(`Errore nel caricamento delle informazioni di debug: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching debug info:', error);
    return {
      authenticated: false,
      error: 'Errore nella richiesta di debug'
    };
  }
}

// Funzioni per la creazione, aggiornamento ed eliminazione di dati
export async function createProperty(property: any): Promise<Property> {
  try {
    console.log('API_URL:', API_URL);
    console.log('Property data being sent:', property);
    
    const response = await fetch(`${API_URL}/properties`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(property)
    });
    
    // Controlla la risposta della preflight CORS
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
    
    if (!response.ok) {
      console.error('Errore nella creazione della proprietà:', response.status);
      const errorText = await response.text();
      console.error('Risposta del server:', errorText);
      throw new Error(`Errore nella creazione della proprietà: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Exception in createProperty:', error);
    throw error;
  }
}

export async function updateProperty(id: number, property: Partial<Property>): Promise<Property | null> {
  try {
    const response = await fetch(`${API_URL}/properties/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(property)
    });
    
    if (!response.ok) {
      console.error('Errore nell\'aggiornamento della proprietà:', response.status);
      throw new Error(`Errore nell'aggiornamento della proprietà: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Exception in updateProperty:', error);
    return null;
  }
}

export async function deleteProperty(id: number): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/properties/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      console.error('Errore nell\'eliminazione della proprietà:', response.status);
      throw new Error(`Errore nell'eliminazione della proprietà: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error('Exception in deleteProperty:', error);
    return false;
  }
}

export async function createTenant(tenant: Omit<Tenant, 'id'>): Promise<Tenant> {
  try {
    console.log('Tenant data being sent:', tenant);
    
    const response = await fetch(`${API_URL}/tenants`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(tenant)
    });
    
    if (!response.ok) {
      console.error('Errore nella creazione dell\'inquilino:', response.status);
      throw new Error(`Errore nella creazione dell'inquilino: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Exception in createTenant:', error);
    throw error;
  }
}

export async function createTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
  try {
    // Validazione dei dati prima dell'invio
    if (!transaction.property_id) {
      throw new Error('ID proprietà mancante o non valido');
    }
    
    // Non convertiamo più property_id in numero, poiché potrebbe essere un UUID
    // Lasciamo che il backend gestisca il tipo corretto
    
    // Assicurati che amount sia un numero positivo
    if (typeof transaction.amount !== 'number' || transaction.amount <= 0) {
      throw new Error('L\'importo deve essere un numero positivo');
    }
    
    // Assicurati che date sia un oggetto Date valido
    if (!(transaction.date instanceof Date) && typeof transaction.date !== 'string') {
      throw new Error('La data non è valida');
    }
    
    console.log('Transaction data being sent:', transaction);
    
    const response = await fetch(`${API_URL}/transactions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(transaction)
    });
    
    if (!response.ok) {
      console.error('Errore nella creazione della transazione:', response.status);
      
      // Tenta di leggere il messaggio di errore JSON
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || `Errore nella creazione della transazione: ${response.status}`);
      } catch (jsonError) {
        // Fallback se non è possibile leggere il JSON
        throw new Error(`Errore nella creazione della transazione: ${response.status}`);
      }
    }
    
    return response.json();
  } catch (error) {
    console.error('Exception in createTransaction:', error);
    throw error;
  }
}
// API Contracts
export async function getContracts(): Promise<Contract[]> {
  try {
    const response = await fetch(`${API_URL}/contracts`, getRequestOptions());
    
    if (!response.ok) {
      console.error('Errore nella richiesta contracts:', response.status);
      throw new Error(`Errore nel caricamento dei contratti: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.error('La risposta non è un array:', data);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Exception in getContracts:', error);
    return [];
  }
}

export async function getContractsByProperty(propertyId: number): Promise<Contract[]> {
  try {
    const response = await fetch(`${API_URL}/contracts?propertyId=${propertyId}`, getRequestOptions());
    
    if (!response.ok) {
      console.error('Errore nella richiesta contracts by property:', response.status);
      throw new Error(`Errore nel caricamento dei contratti per proprietà: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.error('La risposta non è un array:', data);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Exception in getContractsByProperty:', error);
    return [];
  }
}

// API Owners
export async function getOwners(): Promise<Owner[]> {
  try {
    const response = await fetch(`${API_URL}/owners`, getRequestOptions());
    
    if (!response.ok) {
      console.error('Errore nella richiesta owners:', response.status);
      throw new Error(`Errore nel caricamento dei proprietari: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.error('La risposta non è un array:', data);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Exception in getOwners:', error);
    return [];
  }
}

// Oggetto API con tutti i metodi per semplificare le chiamate
export const api = {
  auth: {
    login,
    register,
    logout,
    getCurrentUser,
    changePassword,
    debugAuth
  },
  properties: {
    getAll: getProperties,
    getById: getPropertyById,
    create: createProperty,
    update: updateProperty,
    delete: deleteProperty
  },
  tenants: {
    getAll: getTenants,
    getByProperty: getTenantsByProperty,
    create: createTenant
  },
  transactions: {
    getAll: getTransactions,
    getByProperty: getTransactionsByProperty,
    create: createTransaction
  },
  contracts: {
    getAll: getContracts,
    getByProperty: getContractsByProperty
  },
  owners: {
    getAll: getOwners
  },
  dashboard: {
    getSummary: getDashboardSummary
  },
  utils: {
    fetchWithTimeout
  }
};
