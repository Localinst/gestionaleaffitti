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
  {
    id: "b51a8696-7413-48e4-b252-16b0ad37b895",
    name: "jhbvj",
    address: "Via Roma 123",
    city: "Milano",
    type: "Apartments",
    units: 5,
    value: 500000,
    image: "/img/property1.jpg"
  },
  {
    id: "d83a3970-f0be-4ea5-a53b-0cf3b7298355",
    name: "srgsd",
    address: "Via Napoli 45",
    city: "Roma",
    type: "Houses",
    units: 3,
    value: 350000,
    image: "/img/property2.jpg"
  }
];

// Sample Tenants
export const tenantsData: Tenant[] = [
  {
    id: "1",
    name: "Marco Rossi",
    email: "marco.rossi@example.com",
    phone: "345-678-9012",
    leaseStart: "2023-01-01",
    leaseEnd: "2023-12-31",
    rent: 1200,
    propertyId: "b51a8696-7413-48e4-b252-16b0ad37b895",
    unit: "3A",
    status: "active"
  },
  {
    id: "2",
    name: "Giulia Bianchi",
    email: "giulia.bianchi@example.com",
    phone: "345-123-4567",
    leaseStart: "2023-02-15",
    leaseEnd: "2024-02-14",
    rent: 950,
    propertyId: "d83a3970-f0be-4ea5-a53b-0cf3b7298355",
    unit: "2B",
    status: "active"
  }
];

// Sample Transactions
export const transactionsData: Transaction[] = [
  {
    id: "1",
    date: "2023-06-01",
    amount: 1200,
    type: "income",
    category: "Rent",
    description: "Affitto Giugno 2023",
    propertyId: "b51a8696-7413-48e4-b252-16b0ad37b895",
    tenantId: "1"
  },
  {
    id: "2",
    date: "2023-06-05",
    amount: 950,
    type: "income",
    category: "Rent",
    description: "Affitto Giugno 2023",
    propertyId: "d83a3970-f0be-4ea5-a53b-0cf3b7298355",
    tenantId: "2"
  },
  {
    id: "3",
    date: "2023-06-10",
    amount: 350,
    type: "expense",
    category: "Maintenance",
    description: "Riparazione impianto idraulico",
    propertyId: "b51a8696-7413-48e4-b252-16b0ad37b895"
  }
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

export const getPropertyTypeDistribution = () => {
  return [
    { name: "Apartments", value: 65 },
    { name: "Houses", value: 20 },
    { name: "Commercial", value: 15 }
  ];
};

export const getRentCollectionStatus = () => {
  return [
    { name: "Paid", value: 75 },
    { name: "Pending", value: 15 },
    { name: "Late", value: 10 }
  ];
};

export const getRecentActivities = () => {
  return [
    { id: 1, description: "New lease signed", property: "Marina Towers", date: "2023-06-28" },
    { id: 2, description: "Maintenance request", property: "Highland Residences", date: "2023-06-27" },
    { id: 3, description: "Rent payment received", property: "Lakeside Villa", date: "2023-06-25" },
    { id: 4, description: "Lease renewal notice", property: "Downtown Lofts", date: "2023-06-23" }
  ];
};

// Funzioni per recuperare dati dal database
export const getProperties = async (): Promise<Property[]> => {
  try {
    // Usa lo stesso URL base usato in api.ts
    const hostname = window.location.hostname;
    const API_BASE_URL = `${window.location.protocol}//${hostname}:3000/api`;
    
    console.log('Richiesta properties a:', `${API_BASE_URL}/properties`);
    const response = await fetch(`${API_BASE_URL}/properties`);
    
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
    const API_BASE_URL = `${window.location.protocol}//${hostname}:3000/api`;
    
    console.log('Richiesta tenants a:', `${API_BASE_URL}/tenants`);
    const response = await fetch(`${API_BASE_URL}/tenants`);
    
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
    const API_BASE_URL = `${window.location.protocol}//${hostname}:3000/api`;
    
    // Ottieni il token di autenticazione
    const token = localStorage.getItem('authToken');
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    console.log('Richiesta transactions a:', `${API_BASE_URL}/transactions`);
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      headers,
      credentials: 'include'
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
