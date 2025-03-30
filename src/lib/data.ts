import { Activity } from "@/services/api";

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  type: string;
  units: number;
  value: number;
  image: string;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  leaseStart: string;
  leaseEnd: string;
  rent: number;
  propertyId: string;
  unit: string;
  status: 'active' | 'late' | 'pending';
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  propertyId: string;
  tenantId?: string;
}

// Sample Properties
export const propertiesData: Property[] = [
 
];

// Sample Tenants
export const tenantsData: Tenant[] = [
 
];

// Sample Transactions
export const transactionsData: Transaction[] = [
  
];

// Dashboard Stats
export const getIncomeStats = () => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months.map(month => ({
    name: month,
    income: Math.floor(Math.random() * 20000) + 10000,
    expenses: Math.floor(Math.random() * 8000) + 2000,
  }));
};

export const getOccupancyRate = () => {
  return [
    { name: "Occupied", value: 85 },
    { name: "Vacant", value: 15 }
  ];
};

export const getPropertyTypeDistribution = async () => {
  try {
    // Ottieni le proprietà reali dal database
    const properties = await getProperties();
    
    // Raggruppa le proprietà per tipo
    const typeCount: { [key: string]: number } = {};
    
    // Conta le proprietà per ogni tipo
    properties.forEach(property => {
      const type = property.type || 'Altro'; // Usa 'Altro' se il tipo non è specificato
      // Traduci i tipi in italiano
      const translatedType = translatePropertyType(type);
      typeCount[translatedType] = (typeCount[translatedType] || 0) + 1;
    });
    
    // Converti in array nel formato richiesto dal grafico
    const result = Object.entries(typeCount).map(([name, value]) => ({ name, value }));
    
    // Se non ci sono dati, restituisci un valore di default
    if (result.length === 0) {
      return [
        { name: "Appartamenti", value: 0 },
        { name: "Case", value: 0 },
        { name: "Commerciale", value: 0 }
      ];
    }
    
    return result;
  } catch (error) {
    console.error('Errore durante il recupero delle tipologie di proprietà:', error);
    // In caso di errore, restituisci i dati di esempio
    return [
      { name: "Appartamenti", value: 65 },
      { name: "Case", value: 20 },
      { name: "Commerciale", value: 15 }
    ];
  }
};

// Funzione di supporto per tradurre i tipi di proprietà in italiano
function translatePropertyType(type: string): string {
  const translations: { [key: string]: string } = {
    'Apartments': 'Appartamenti',
    'Houses': 'Case',
    'Commercial': 'Commerciale',
    'Apartment': 'Appartamenti',
    'House': 'Case',
    'Condo': 'Condominio',
    'Duplex': 'Duplex',
    'Townhouse': 'Villetta a schiera',
    'Office': 'Ufficio',
    'Retail': 'Negozio',
    'Industrial': 'Industriale'
  };
  
  return translations[type] || type; // Restituisci la traduzione o il tipo originale se non trovato
}

export const getRentCollectionStatus = () => {
  return [
    { name: "Paid", value: 75 },
    { name: "Pending", value: 15 },
    { name: "Late", value: 10 }
  ];
};

export const getRecentActivities = async (): Promise<any[]> => {
  try {
    // Usa lo stesso URL base usato in api.ts
    const hostname = window.location.hostname;
    const API_BASE_URL = hostname !== 'localhost' 
      ? '/api'  // In produzione usa URL relativo
      : `${window.location.protocol}//${hostname}:3000/api`;
    
    console.log('Richiesta activities a:', `${API_BASE_URL}/activities`);
    const response = await fetch(`${API_BASE_URL}/activities`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      console.error('Risposta API activities non ok:', response.status, response.statusText);
      throw new Error(`Errore nel recupero delle attività: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || !Array.isArray(data)) {
      console.log('Nessuna attività trovata o formato non valido, uso dati statici');
      // Restituisci dati statici come fallback
      return [
        { id: 1, description: "Contratto in scadenza", property: "Marina Towers", date: new Date() },
        { id: 2, description: "Richiesta manutenzione", property: "Highland Residences", date: new Date() },
        { id: 3, description: "Pagamento affitto ricevuto", property: "Lakeside Villa", date: new Date() },
        { id: 4, description: "Avviso rinnovo contratto", property: "Downtown Lofts", date: new Date() }
      ];
    }
    
    // Formatta i dati per la visualizzazione
    return data.map((activity: Activity) => ({
      id: activity.id,
      description: activity.description,
      property: activity.property_name || "Proprietà sconosciuta",
      date: activity.date
    })).slice(0, 5); // Mostra solo le prime 5 attività
    
  } catch (error) {
    console.error('Errore durante il recupero delle attività:', error);
    // Restituisci dati statici come fallback in caso di errore
    return [
      { id: 1, description: "Contratto in scadenza", property: "Marina Towers", date: new Date() },
      { id: 2, description: "Richiesta manutenzione", property: "Highland Residences", date: new Date() },
      { id: 3, description: "Pagamento affitto ricevuto", property: "Lakeside Villa", date: new Date() },
      { id: 4, description: "Avviso rinnovo contratto", property: "Downtown Lofts", date: new Date() }
    ];
  }
};

// Funzione per ottenere gli headers con autenticazione
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

// Funzioni per recuperare dati dal database
export const getProperties = async (): Promise<Property[]> => {
  try {
    // Usa lo stesso URL base usato in api.ts
    const hostname = window.location.hostname;
    const API_BASE_URL = hostname !== 'localhost' 
      ? '/api'  // In produzione usa URL relativo
      : `${window.location.protocol}//${hostname}:3000/api`;
    
    console.log('Richiesta properties a:', `${API_BASE_URL}/properties`);
    const response = await fetch(`${API_BASE_URL}/properties`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      console.error('Risposta API properties non ok:', response.status, response.statusText);
      throw new Error(`Errore nel recupero delle proprietà: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || !Array.isArray(data)) {
      throw new Error('Formato risposta API properties non valido');
    }
    
    return data;
  } catch (error) {
    console.error('Errore durante il recupero delle proprietà:', error);
    throw error; // Rilancia l'errore per permettere alla UI di gestirlo
  }
};

export const getTenants = async (): Promise<Tenant[]> => {
  try {
    // Usa lo stesso URL base usato in api.ts
    const hostname = window.location.hostname;
    const API_BASE_URL = hostname !== 'localhost' 
      ? '/api'  // In produzione usa URL relativo
      : `${window.location.protocol}//${hostname}:3000/api`;
    
    console.log('Richiesta tenants a:', `${API_BASE_URL}/tenants`);
    const response = await fetch(`${API_BASE_URL}/tenants`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      console.error('Risposta API tenants non ok:', response.status, response.statusText);
      throw new Error(`Errore nel recupero degli inquilini: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || !Array.isArray(data)) {
      throw new Error('Formato risposta API tenants non valido');
    }
    
    return data;
  } catch (error) {
    console.error('Errore durante il recupero degli inquilini:', error);
    throw error; // Rilancia l'errore per permettere alla UI di gestirlo
  }
};

export const getTransactionsData = async (): Promise<Transaction[]> => {
  try {
    // Usa lo stesso URL base usato in api.ts
    const hostname = window.location.hostname;
    const API_BASE_URL = hostname !== 'localhost' 
      ? '/api'  // In produzione usa URL relativo
      : `${window.location.protocol}//${hostname}:3000/api`;
    
    console.log('Richiesta transactions a:', `${API_BASE_URL}/transactions`);
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      console.error('Risposta API transactions non ok:', response.status, response.statusText);
      throw new Error(`Errore nel recupero delle transazioni: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || !Array.isArray(data)) {
      throw new Error('Formato risposta API transactions non valido');
    }
    
    return data;
  } catch (error) {
    console.error('Errore durante il recupero delle transazioni:', error);
    throw error; // Rilancia l'errore per permettere alla UI di gestirlo
  }
};

// Calculate dashboard summary metrics
export const getDashboardSummary = async () => {
  try {
    const [properties, tenants, transactions] = await Promise.all([
      getProperties(),
      getTenants(),
      getTransactionsData()
    ]);
    
    const totalProperties = properties.length;
    const totalUnits = properties.reduce((sum, property) => sum + property.units, 0);
    const totalTenants = tenants.length;
    
    const rentIncome = transactions
      .filter(t => t.type === "income" && t.category === "Rent")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const netIncome = rentIncome - expenses;
    
    const occupancyRate = totalUnits > 0 ? (totalTenants / totalUnits) * 100 : 0;
    
    return {
      totalProperties,
      totalUnits,
      totalTenants,
      rentIncome,
      expenses,
      netIncome,
      occupancyRate: occupancyRate.toFixed(1)
    };
  } catch (error) {
    console.error('Errore durante il calcolo del riepilogo della dashboard:', error);
    return {
      totalProperties: 0,
      totalUnits: 0,
      totalTenants: 0,
      rentIncome: 0,
      expenses: 0,
      netIncome: 0,
      occupancyRate: '0.0'
    };
  }
};

// L'interfaccia Headers è definita globalmente in TypeScript, quindi
// definiamo un tipo per i nostri headers
type HeadersInit = {
  [key: string]: string;
};
