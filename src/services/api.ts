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

export interface Activity {
  id: number;
  description: string;
  property_id: string | number;
  property_name?: string;
  tenant_id?: string | number;
  tenant_name?: string;
  date: Date | string;
  type: 'contract_expiration' | 'rent_payment' | 'maintenance' | 'other';
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed' | 'dismissed';
  related_id?: string | number; // ID del contratto o transazione correlata
  created_at?: Date | string;
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

// Importa axios
import axios from 'axios';

// Variabile per memorizzare il context di SubscriptionContext
let subscriptionContextHandle: any = null;

// Funzione per impostare il reference al context dell'abbonamento
export function setSubscriptionContextHandle(handle: any) {
  subscriptionContextHandle = handle;
}

// Configurazione dell'URL API di base
export function getAPIBaseUrl() {
  // Per debugging, mostra sempre quale URL viene usato
  const result = getActualAPIBaseUrl();
  return result;
}

// La funzione interna che determina l'URL effettivo
export function getActualAPIBaseUrl() {
  // In ambiente di produzione, usa l'URL diretto del backend
  if (window.location.hostname !== 'localhost') {
    return 'https://gestionaleaffitti.onrender.com/api';
  }
  
  // In ambiente di sviluppo locale, usa localhost:3000
  return 'http://localhost:3000/api';
}

// Setup degli interceptors di Axios per la gestione centralizzata degli errori
export function setupAxiosInterceptors() {
  // Interceptor di risposta per gestire errori 403 relativi all'abbonamento
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      // Se l'errore è 403 e contiene informazioni sul periodo di prova scaduto
      if (axios.isAxiosError(error) && 
          error.response?.status === 403 && 
          subscriptionContextHandle) {
        
        // Prova a gestire l'errore usando il contesto dell'abbonamento
        const handled = subscriptionContextHandle.handleSubscriptionError(error);
        
        if (handled) {
          // Reindirizza l'utente alla pagina pricing se necessario
          if (window.location.pathname !== '/pricing' && 
              !window.location.pathname.startsWith('/login') &&
              !window.location.pathname.startsWith('/register')) {
            window.location.href = '/pricing';
          }
        }
      }
      
      // Rilancia l'errore per permettere ai componenti di gestirlo se necessario
      return Promise.reject(error);
    }
  );
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
export const getAuthHeaders = (): HeadersInit => {
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

// Funzione per gestire gli errori delle richieste API
export const handleRequestError = (error: any, functionName: string) => {
  console.error(`Errore in ${functionName}:`, error);
  
  if (error.message === 'Failed to fetch') {
    console.error('Errore di connessione al server. Verifica che il server sia in esecuzione.');
  }
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
    
    // Assicuriamoci che l'ID sia sempre una stringa per evitare problemi di tipo uuid vs text
    const propertyIdStr = String(propertyId);
    
    // Aggiungiamo il parametro idType per gestire correttamente la conversione nel backend
    const response = await fetch(`${API_URL}/tenants?propertyId=${propertyIdStr}&idType=uuid`, getRequestOptions());
    
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

export async function getTransactionsByProperty(propertyId: number | string): Promise<Transaction[]> {
  try {
    // Assicuriamoci che l'ID sia sempre una stringa per evitare problemi di tipo uuid vs text
    const propertyIdStr = String(propertyId);
    
    // Aggiungiamo il parametro idType per gestire correttamente la conversione nel backend
    const response = await fetch(`${API_URL}/transactions/property/${propertyIdStr}?idType=uuid`, getRequestOptions());
    
    if (!response.ok) {
      if (response.status === 401) {
        handleApiError('getTransactionsByProperty', 401, 'Non autenticato');
        throw new Error('Non autenticato');
      }
      const error = await response.json();
      throw new Error(error.error || `Errore durante il recupero delle transazioni per la proprietà ${propertyIdStr}`);
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

export async function deleteAllProperties(): Promise<{count: number}> {
  try {
    const response = await fetch(`${API_URL}/properties/all`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      console.error('Errore nell\'eliminazione di tutte le proprietà:', response.status);
      throw new Error(`Errore nell'eliminazione di tutte le proprietà: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Exception in deleteAllProperties:', error);
    throw error;
  }
}

export async function createTenant(tenant: Omit<Tenant, 'id'>): Promise<Tenant> {
  try {
    console.log('Tenant data being sent:', tenant);
    
    // Verifica che i campi obbligatori esistano
    if (!tenant.name) {
      throw new Error("Il nome dell'inquilino è obbligatorio");
    }
    
    // Assicurati che vengano inviati almeno i campi richiesti
    const tenantToSend = {
      name: tenant.name,
      email: tenant.email || '',
      phone: tenant.phone || '',
      ...tenant
    };
    
    const response = await fetch(`${API_URL}/tenants`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(tenantToSend)
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
    // Rimosso controllo obbligatorio per property_id
    // if (!transaction.property_id) {
    //   throw new Error('ID proprietà mancante o non valido');
    // }
    
    // Non convertiamo più property_id in numero, poiché potrebbe essere un UUID
    // Lasciamo che il backend gestisca il tipo corretto
    
    // Assicurati che amount sia un numero positivo
    if (transaction.amount === undefined || transaction.amount === null || (typeof transaction.amount === 'number' && transaction.amount <= 0)) {
      // Modificato per gestire undefined/null e assicurare sia numero > 0
      throw new Error('L\'importo deve essere un numero positivo');
    }
    
    // Assicurati che date sia un oggetto Date valido
    if (!(transaction.date instanceof Date) && typeof transaction.date !== 'string') {
      throw new Error('La data non è valida');
    }
    
    console.log('Transaction data being sent:', transaction);
    
    // LOG AGGIUNTIVO PRIMA DI STRINGIFY
    console.log('Dati transazione PRIMA di JSON.stringify:', transaction);

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

export async function getContractsByProperty(propertyId: number | string): Promise<Contract[]> {
  try {
    console.log('Richiesta getContractsByProperty con ID:', propertyId, 'di tipo:', typeof propertyId);
    
    // Assicuriamoci che l'ID sia sempre una stringa per evitare problemi di tipo uuid vs text
    const propertyIdStr = String(propertyId);
    
    // Aggiungiamo un parametro idType per aiutare il backend a gestire correttamente il tipo
    const response = await fetch(`${API_URL}/contracts?propertyId=${propertyIdStr}&idType=uuid`, getRequestOptions());
    
    if (!response.ok) {
      console.error('Errore nella richiesta contracts by property:', response.status);
      throw new Error(`Errore nel caricamento dei contratti per proprietà: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Risposta API getContractsByProperty:', data);
    
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

export async function createContract(contract: Omit<Contract, 'id'>): Promise<Contract> {
  try {
    // Assicurati che tutti i campi necessari siano presenti
    const contractData = {
      ...contract,
      // Imposta valori predefiniti per eventuali campi mancanti
      start_date: contract.start_date || new Date().toISOString().split('T')[0],
      end_date: contract.end_date || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      rent_amount: contract.rent_amount || 0,
      deposit_amount: contract.deposit_amount || 0,
      status: contract.status || 'active'
    };
    
    const response = await fetch(`${API_URL}/contracts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(contractData),
    });
    
    if (!response.ok) {
      console.error('Errore nella creazione del contratto:', response.status);
      
      // Tenta di leggere il messaggio di errore JSON
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || `Errore nella creazione del contratto: ${response.status}`);
      } catch (jsonError) {
        // Fallback se non è possibile leggere il JSON
        throw new Error(`Errore nella creazione del contratto: ${response.status}`);
      }
    }
    
    return await response.json();
  } catch (error) {
    console.error('Exception in createContract:', error);
    throw error;
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

// API Activities
export async function getActivities(): Promise<Activity[]> {
  try {
    const response = await fetch(`${API_URL}/activities`, getRequestOptions());
    
    if (!response.ok) {
      console.error('Errore nella richiesta activities:', response.status);
      throw new Error(`Errore nel caricamento delle attività: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.error('La risposta non è un array:', data);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Exception in getActivities:', error);
    return [];
  }
}

export async function createActivity(activity: Omit<Activity, 'id'>): Promise<Activity> {
  try {
    const response = await fetch(`${API_URL}/activities`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(activity),
    });
    
    if (!response.ok) {
      console.error('Errore nella creazione dell\'attività:', response.status);
      throw new Error(`Errore nella creazione dell'attività: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Exception in createActivity:', error);
    throw error;
  }
}

export async function updateActivityStatus(id: number, status: Activity['status']): Promise<Activity> {
  try {
    const response = await fetch(`${API_URL}/activities/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    
    if (!response.ok) {
      console.error('Errore nell\'aggiornamento dello stato dell\'attività:', response.status);
      throw new Error(`Errore nell'aggiornamento dello stato dell'attività: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Exception in updateActivityStatus:', error);
    throw error;
  }
}

export async function deleteTransaction(id: number): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/transactions/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Errore server deleteTransaction:', errorData);
      throw new Error(errorData.error || 'Error deleting transaction');
    }

    return true;
  } catch (error) {
    handleRequestError(error, 'deleteTransaction');
    return false;
  }
}

export async function deleteAllTransactions(): Promise<{count: number}> {
  try {
    const response = await fetch(`${API_URL}/transactions/all`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Errore server deleteAllTransactions:', errorData);
      throw new Error(errorData.error || 'Error deleting all transactions');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Exception in deleteAllTransactions:', error);
    throw error;
  }
}

export async function updateTransaction(id: number, transaction: Partial<Transaction>): Promise<Transaction> {
  try {
    if (!id) {
      throw new Error('ID transazione mancante');
    }
    
    // Validazioni base sui dati di aggiornamento
    if (transaction.amount && (typeof transaction.amount !== 'number' || transaction.amount <= 0)) {
      throw new Error('L\'importo deve essere un numero positivo');
    }
    
    // Converti la data in formato ISO se è un oggetto Date
    const dataToSend = { ...transaction };
    if (dataToSend.date && dataToSend.date instanceof Date) {
      // Creiamo un oggetto separato per l'invio, per non modificare l'originale
      dataToSend.date = dataToSend.date.toISOString() as unknown as Date;
    }
    
    console.log('Aggiornamento transazione:', id, dataToSend);
    
    const response = await fetch(`${API_URL}/transactions/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(dataToSend)
    });
    
    if (!response.ok) {
      console.error('Errore nell\'aggiornamento della transazione:', response.status);
      
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || `Errore nell'aggiornamento della transazione: ${response.status}`);
      } catch (jsonError) {
        throw new Error(`Errore nell'aggiornamento della transazione: ${response.status}`);
      }
    }
    
    return response.json();
  } catch (error) {
    console.error('Exception in updateTransaction:', error);
    throw error;
  }
}

// Funzione alternativa per l'importazione di inquilini che bypassa il problema di autorizzazione
export async function importTenantsDirectly(tenants: Omit<Tenant, 'id'>[]): Promise<any> {
  try {
    console.log('Importazione diretta di inquilini:', tenants);
    
    // Effettua una chiamata diretta all'endpoint di importazione specifico
    const response = await fetch(`${API_URL}/import/tenants`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ tenants })
    });

    if (!response.ok) {
      console.error('Errore nell\'importazione diretta degli inquilini:', response.status);
      throw new Error(`Errore nell'importazione diretta degli inquilini: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Exception in importTenantsDirectly:', error);
    throw error;
  }
}

// Funzione alternativa per l'importazione di contratti che bypassa il problema di autorizzazione
export async function importContractsDirectly(contracts: Omit<Contract, 'id'>[]): Promise<any> {
  try {
    console.log('Importazione diretta di contratti:', contracts.length);
    
    // Effettua una chiamata diretta all'endpoint di importazione specifico
    const response = await fetch(`${API_URL}/import/contracts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ contracts })
    });

    if (!response.ok) {
      console.error('Errore nell\'importazione diretta dei contratti:', response.status);
      
      // Tenta di leggere il messaggio di errore JSON
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || `Errore nell'importazione diretta dei contratti: ${response.status}`);
      } catch (jsonError) {
        // Fallback se non è possibile leggere il JSON
        throw new Error(`Errore nell'importazione diretta dei contratti: ${response.status}`);
      }
    }
    
    return response.json();
  } catch (error) {
    console.error('Exception in importContractsDirectly:', error);
    throw error;
  }
}

// Funzione per l'importazione dei dati a blocchi
export const importDataInChunks = async (entityType: string, data: any[], chunkSize: number = 50, onProgress?: (progress: number) => void) => {
  try {
    // Normalizza il tipo di entità (plurale → singolare)
    let normalizedEntityType = entityType;
    
    // Converti il plurale in singolare
    if (entityType === "properties") normalizedEntityType = "property";
    else if (entityType === "tenants") normalizedEntityType = "tenant";
    else if (entityType === "contracts") normalizedEntityType = "contract";
    else if (entityType === "transactions") normalizedEntityType = "transaction";
    else if (entityType === "activities") normalizedEntityType = "activity";
    // Gestione inversa: se è già singolare, lasciarlo così
    else if (entityType === "property" || entityType === "tenant" || 
             entityType === "contract" || entityType === "transaction" || 
             entityType === "activity") {
      normalizedEntityType = entityType;
    }
    
    console.log(`Avvio importazione a blocchi per tipo: ${normalizedEntityType} (originale: ${entityType}). Totale record: ${data.length}, Dimensione blocco: ${chunkSize}`);
    
    // Dividi i dati in blocchi
    const chunks = [];
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }
    
    console.log(`Creati ${chunks.length} blocchi di dati`);
    
    let totalImported = 0;
    
    // OTTIMIZZAZIONE: Usa invio parallelo per transazioni
    if (normalizedEntityType === 'transaction') {
      // Per transazioni, usiamo processamento parallelo con concurrency limit
      const concurrencyLimit = 3; // Numero di richieste parallele massime
      console.log(`Utilizzo processamento parallelo per transazioni (concurrency: ${concurrencyLimit})`);
      
      // Prepara array per tenere traccia delle promesse attive
      let activePromises = [];
      let completedChunksCount = 0;
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkIndex = i;
        
        // Crea una funzione di processamento per questo chunk
        const processChunk = async () => {
          try {
            console.log(`Elaborazione parallela blocco ${chunkIndex+1}/${chunks.length} (${chunk.length} record)`);
            
            // Usa l'endpoint standard per le transazioni
            const apiUrl = `${API_URL}/import/${normalizedEntityType}`;
            
            const response = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
              },
              body: JSON.stringify({ data: chunk }),
              credentials: 'include'
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || `Errore nel blocco ${chunkIndex+1}`);
            }
            
            const result = await response.json();
            completedChunksCount++;
            
            // Aggiorna progresso
            if (onProgress) {
              const currentProgress = Math.round((completedChunksCount / chunks.length) * 100);
              onProgress(currentProgress);
            }
            
            return result.importedCount || 0;
          } catch (error) {
            console.error(`Errore nel blocco ${chunkIndex+1}:`, error);
            completedChunksCount++;
            // Aggiorna comunque il progresso
            if (onProgress) {
              const currentProgress = Math.round((completedChunksCount / chunks.length) * 100);
              onProgress(currentProgress);
            }
            return 0;
          }
        };
        
        // Aggiungi questo processo alla lista delle promesse attive
        activePromises.push(processChunk());
        
        // Se raggiunto il limite di concorrenza o ultimo chunk, attendi che alcune finiscano
        if (activePromises.length >= concurrencyLimit || i === chunks.length - 1) {
          const results = await Promise.all(activePromises);
          totalImported += results.reduce((sum, count) => sum + count, 0);
          // Svuota l'array per il prossimo batch
          activePromises = [];
        }
      }
    } else {
      // Per le altre entità, usa processamento sequenziale
      for (let i = 0; i < chunks.length; i++) {
        try {
          const chunk = chunks[i];
          console.log(`Elaborazione sequenziale blocco ${i+1}/${chunks.length} (${chunk.length} record)`);
          
          // MODIFICA: Usa l'endpoint standard /api/import/:entityType invece di /chunk per le transazioni
          let apiUrl;
          if (normalizedEntityType === 'transaction') {
            // Usa l'endpoint standard per le transazioni
            apiUrl = `${API_URL}/import/${normalizedEntityType}`;
          } else {
            // Usa l'endpoint /chunk per le altre entità
            apiUrl = `${API_URL}/import/${normalizedEntityType}/chunk`;
          }
          
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders()
            },
            body: JSON.stringify({ data: chunk }),
            credentials: 'include'
          });
          
          if (!response.ok) {
            let errorData = null;
            try {
              errorData = await response.json();
            } catch (e) {
              const errorText = await response.text();
              console.error(`Errore nel blocco ${i+1} (non JSON):`, response.status, errorText);
            }
            
            throw new Error(errorData?.error || `Errore nell'importazione del blocco ${i+1} (${response.status}: ${response.statusText})`);
          }
          
          const result = await response.json();
          totalImported += result.importedCount || 0;
          
          // Aggiorna il progresso
          if (onProgress) {
            onProgress(Math.round((i + 1) / chunks.length * 100));
          }
        } catch (chunkError) {
          console.error(`Errore nell'elaborazione del blocco ${i+1}:`, chunkError);
          // Continua con il blocco successivo invece di interrompere tutto il processo
        }
      }
    }
    
    console.log(`Importazione completata: ${totalImported} record importati su ${data.length} totali`);
    
    return { 
      message: `Importazione completata: ${totalImported} record importati`, 
      importedCount: totalImported 
    };
  } catch (error) {
    console.error('Errore nell\'importazione a blocchi:', error);
    throw error;
  }
};

// Funzione per l'importazione dei dati
export const importData = async (entityType: string, data: any[]) => {
  try {
    // Normalizza il tipo di entità (gestisce sia singolare che plurale)
    let normalizedEntityType = entityType;
    
    // Converti il singolare in plurale se necessario
    if (entityType === "property") normalizedEntityType = "properties";
    if (entityType === "tenant") normalizedEntityType = "tenants";
    if (entityType === "contract") normalizedEntityType = "contracts";
    if (entityType === "transaction") normalizedEntityType = "transactions";
    if (entityType === "activity") normalizedEntityType = "activities";
    
    // Gestione specifica per ogni tipo di entità
    switch (normalizedEntityType) {
      case 'properties':
        // Per ogni proprietà, crea un nuovo record
        for (const property of data) {
          // Valida i campi obbligatori prima dell'importazione
          if (!property.name) {
            // Se manca il nome ma c'è un indirizzo, usa l'indirizzo come nome
            if (property.address) {
              property.name = `Proprietà in ${property.address}`;
            } else {
              property.name = "Nuova Proprietà";
            }
          }
          
          // Imposta un valore predefinito per l'indirizzo se mancante
          if (!property.address) {
            property.address = "Indirizzo non specificato";
          }
          
          // Imposta un valore predefinito per la città se mancante
          if (!property.city) {
            property.city = "Non specificata";
          }
          
          // Imposta un valore predefinito per il tipo se mancante
          if (!property.type) {
            property.type = "Altro";
          }
          
          // Assicurati che i campi numerici siano validi
          property.purchase_price = property.purchase_price || 0;
          property.current_value = property.current_value || 0;
          property.units = property.units || 1;
          
          await createProperty(property);
        }
        break;
        
      case 'tenants':
        try {
          // Prepara tutti gli inquilini da importare in un unico array
          const validTenants: Omit<Tenant, 'id'>[] = [];
          
          for (const tenant of data) {
            try {
              // Valida i campi obbligatori per tenant
              if (!tenant.name) {
                console.warn("Nome inquilino mancante, salto questo record");
                continue;
              }
              
              // Creo un oggetto tenant con i campi necessari
              const tenantData: Omit<Tenant, 'id'> = {
                name: tenant.name,
                email: tenant.email || "",
                phone: tenant.phone || "",
                status: "active",
                property_id: tenant.property_id || undefined,
                unit: tenant.unit || "0"
              };
              
              // Aggiungo all'array degli inquilini da importare
              validTenants.push(tenantData);
            } catch (error) {
              console.warn(`Errore nella preparazione dell'inquilino ${tenant.name}:`, error);
            }
          }
          
          if (validTenants.length > 0) {
            // Utilizzo la nuova funzione per importare tutti gli inquilini in una sola chiamata
            await importTenantsDirectly(validTenants);
            console.log(`Importati ${validTenants.length} inquilini con successo`);
          }
        } catch (tenantsError) {
          console.error("Errore durante l'importazione degli inquilini:", tenantsError.message);
          console.error("L'importazione continuerà con le altre entità");
        }
        break;
        
      case 'transactions':
        // Per ogni transazione, crea un nuovo record
        for (const transaction of data) {
          // Rimosso il controllo obbligatorio per property_id
          // if (!transaction.property_id) {
          //   throw new Error("L'ID della proprietà è obbligatorio per la transazione");
          // }
          
          // Validazioni per altri campi rimangono
          if (!transaction.amount) {
            transaction.amount = 0;
          }
          if (!transaction.type) {
            transaction.type = 'expense'; // O gestisci come errore se preferisci
          }
          if (!transaction.date) {
            transaction.date = new Date();
          }
          
          // Assicurati che tenant_id sia null se non fornito
          const transactionToSend = {
            ...transaction,
            tenant_id: transaction.tenant_id || null,
            property_id: transaction.property_id || null // Assicura null anche qui
          };

          await createTransaction(transactionToSend);
        }
        break;
        
      case 'contracts':
        try {
          // Prepara tutti i contratti da importare in un unico array
          const validContracts: Omit<Contract, 'id'>[] = [];
          
          for (const contract of data) {
            try {
              // Prepara i valori predefiniti per i campi obbligatori
              const contractData = {
                ...contract,
                // Se start_date non è definita, imposta a oggi
                start_date: contract.start_date || new Date().toISOString().split('T')[0],
                // Se end_date non è definita, imposta a un anno dopo la data di inizio
                end_date: contract.end_date || (() => {
                  const startDate = new Date(contract.start_date || new Date());
                  const endDate = new Date(startDate);
                  endDate.setFullYear(endDate.getFullYear() + 1);
                  return endDate.toISOString().split('T')[0];
                })(),
                // Imposta valori predefiniti per gli importi
                rent_amount: contract.rent_amount || 0,
                deposit_amount: contract.deposit_amount || 0,
                // Imposta stato predefinito se non specificato
                status: contract.status || 'active'
              };
              
              // Aggiungi al contratto all'array
              validContracts.push(contractData);
            } catch (error) {
              console.warn(`Errore nella preparazione del contratto:`, error);
            }
          }
          
          if (validContracts.length > 0) {
            // Utilizzo la nuova funzione per importare tutti i contratti in una sola chiamata
            const result = await importContractsDirectly(validContracts);
            console.log(`Importati ${result.importedCount || validContracts.length} contratti con successo`);
          }
        } catch (contractsError) {
          console.error("Errore durante l'importazione dei contratti:", contractsError);
          throw contractsError; // Rilancia l'errore per gestirlo a livello superiore
        }
        break;
        
      case 'activities':
        // Per ogni attività, crea un nuovo record
        for (const activity of data) {
          // Valida i campi obbligatori per activity
          if (!activity.description) {
            throw new Error("La descrizione dell'attività è obbligatoria");
          }
          if (!activity.property_id) {
            throw new Error("L'ID della proprietà è obbligatorio per l'attività");
          }
          if (!activity.date) {
            activity.date = new Date();
          }
          
          await createActivity(activity);
        }
        break;
        
      default:
        throw new Error(`Tipo di entità non supportato: ${entityType}`);
    }

    return { message: 'Importazione completata con successo' };
  } catch (error) {
    console.error('Errore nell\'importazione:', error);
    throw error;
  }
};

// Interfaccia per i dati di analytics
export interface AnalyticsData {
  pageViews: Array<{
    date: string;
    views: number;
    unique_visitors: number;
    sessions: number;
  }>;
  visitors: number;
  totalViews: number;
  totalSessions: number;
  averageSessionDuration: number;
  bounceRate: number;
  topPages: Array<{
    name: string;
    views: number;
    avg_time: string;
  }>;
  devices: Array<{
    name: string;
    value: number;
  }>;
  browsers: Array<{
    name: string;
    value: number;
  }>;
  geoData: Array<{
    name: string;
    value: number;
  }>;
  conversions: Array<{
    name: string;
    completato: number;
    abbandonato: number;
  }>;
}

/**
 * Traccia una visualizzazione di pagina inviando i dati al server
 */
export async function trackPageView(data: any): Promise<void> {
  try {
    await fetch(`${API_URL}/analytics/track/pageview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
      credentials: 'include'
    });
  } catch (error) {
    console.error('Errore nel tracciamento della pagina:', error);
    // Non facciamo fallire l'applicazione se il tracciamento fallisce
  }
}

/**
 * Traccia una conversione inviando i dati al server
 */
export async function trackConversion(data: any): Promise<void> {
  try {
    await fetch(`${API_URL}/analytics/track/conversion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
      credentials: 'include'
    });
  } catch (error) {
    console.error('Errore nel tracciamento della conversione:', error);
    // Non facciamo fallire l'applicazione se il tracciamento fallisce
  }
}

/**
 * Ottiene i dati di analytics dal server
 */
export async function getAnalyticsStats(timeRange: string = '7d'): Promise<AnalyticsData> {
  try {
    const response = await fetch(`${API_URL}/analytics/stats?timeRange=${timeRange}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Errore nel recupero delle statistiche: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Errore nel recupero delle statistiche:', error);
    throw error;
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
    delete: deleteProperty,
    deleteAll: deleteAllProperties
  },
  tenants: {
    getAll: getTenants,
    getByProperty: getTenantsByProperty,
    create: createTenant,
    importDirectly: importTenantsDirectly
  },
  transactions: {
    getAll: getTransactions,
    getByProperty: getTransactionsByProperty,
    create: createTransaction
  },
  contracts: {
    getAll: getContracts,
    getByProperty: getContractsByProperty,
    create: createContract,
    importDirectly: importContractsDirectly
  },
  owners: {
    getAll: getOwners
  },
  activities: {
    getAll: getActivities,
    create: createActivity,
    updateStatus: updateActivityStatus
  },
  dashboard: {
    getSummary: getDashboardSummary
  },
  utils: {
    fetchWithTimeout
  },
  import: {
    data: importData,
    dataInChunks: importDataInChunks
  }
};
