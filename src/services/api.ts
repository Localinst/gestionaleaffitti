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
}

export interface Transaction {
  id: number;
  property_id: number;
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
  // In ambiente di produzione, usa sempre l'URL hardcoded per evitare problemi
  if (window.location.hostname !== 'localhost') {
    return 'https://gestionale-affitti-api.onrender.com/api';
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
    
    return data;
  } catch (error) {
    console.error('Exception in getTransactions:', error);
    return [];
  }
}

export async function getTransactionsByProperty(propertyId: number): Promise<Transaction[]> {
  try {
    const response = await fetch(`${API_URL}/transactions?propertyId=${propertyId}`, getRequestOptions());
    
    if (!response.ok) {
      console.error('Errore nella richiesta transactions by property:', response.status);
      throw new Error(`Errore nel caricamento delle transazioni per proprietà: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.error('La risposta non è un array:', data);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Exception in getTransactionsByProperty:', error);
    return [];
  }
}

// API Dashboard
export async function getDashboardSummary(): Promise<DashboardSummaryResponse> {
  try {
    const response = await fetch(`${API_URL}/dashboard/summary`, getRequestOptions());
    
    if (!response.ok) {
      handleApiError('dashboard/summary', response.status, null);
      throw new Error(`Errore nel caricamento del riepilogo dashboard: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
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
    console.log('Invio dati al server:', property);
    console.log('API_URL:', API_URL);
    console.log('authToken:', localStorage.getItem('authToken') ? 'presente' : 'mancante');
    
    const response = await fetch(`${API_URL}/properties`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(property),
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
      body: JSON.stringify(property),
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
      headers: getAuthHeaders(),
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
    // Adattare i nomi dei campi per il backend
    const backendData = {
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone,
      lease_start: tenant.lease_start,
      lease_end: tenant.lease_end,
      rent: tenant.rent,  // utilizziamo direttamente il campo rent
      property_id: tenant.property_id,
      unit: "",                  // valori di default per campi richiesti
      status: "active"
    };

    const response = await fetch(`${API_URL}/tenants`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(backendData),
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
    const response = await fetch(`${API_URL}/transactions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(transaction),
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