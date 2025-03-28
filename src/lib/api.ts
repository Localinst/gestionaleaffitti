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

export const api = {
  properties: {
    getAll: () => fetch(`${API_URL}/properties`, {
      headers: getAuthHeaders()
    }).then(res => res.json()),
    getById: (id: string) => fetch(`${API_URL}/properties/${id}`, {
      headers: getAuthHeaders()
    }).then(res => res.json()),
    create: (data: any) => fetch(`${API_URL}/properties`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }).then(res => res.json()),
    update: (id: string, data: any) => fetch(`${API_URL}/properties/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }).then(res => res.json()),
    delete: (id: string) => fetch(`${API_URL}/properties/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    }).then(res => res.json())
  },
  tenants: {
    getAll: () => fetch(`${API_URL}/tenants`, {
      headers: getAuthHeaders()
    }).then(res => res.json()),
    getById: (id: string) => fetch(`${API_URL}/tenants/${id}`, {
      headers: getAuthHeaders()
    }).then(res => res.json()),
    create: (data: any) => fetch(`${API_URL}/tenants`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }).then(res => res.json()),
    update: (id: string, data: any) => fetch(`${API_URL}/tenants/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }).then(res => res.json()),
    delete: (id: string) => fetch(`${API_URL}/tenants/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    }).then(res => res.json())
  },
  transactions: {
    getAll: () => fetch(`${API_URL}/transactions`, {
      headers: getAuthHeaders()
    }).then(res => res.json()),
    getById: (id: string) => fetch(`${API_URL}/transactions/${id}`, {
      headers: getAuthHeaders()
    }).then(res => res.json()),
    create: (data: any) => fetch(`${API_URL}/transactions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }).then(res => res.json()),
    update: (id: string, data: any) => fetch(`${API_URL}/transactions/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }).then(res => res.json()),
    delete: (id: string) => fetch(`${API_URL}/transactions/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    }).then(res => res.json())
  },
  dashboard: {
    getSummary: () => fetch(`${API_URL}/dashboard/summary`, {
      headers: getAuthHeaders()
    }).then(res => res.json()),
    getChartData: () => fetch(`${API_URL}/dashboard/charts`, {
      headers: getAuthHeaders()
    }).then(res => res.json()),
    debug: () => fetch(`${API_URL}/dashboard/debug`, {
      headers: getAuthHeaders()
    }).then(res => res.json())
  },
  reports: {
    getSummary: (params: any) => fetch(`${API_URL}/reports/summary${formatQueryParams(params)}`, {
      headers: getAuthHeaders()
    }).then(res => res.json()),
    getPropertyPerformance: (params: any) => fetch(`${API_URL}/reports/properties${formatQueryParams(params)}`, {
      headers: getAuthHeaders()
    }).then(res => res.json()),
    getFinancialData: (params: any) => fetch(`${API_URL}/reports/financial${formatQueryParams(params)}`, {
      headers: getAuthHeaders()
    }).then(res => res.json()),
    exportReport: (format: string, params: any) => fetch(`${API_URL}/reports/export/${format}${formatQueryParams(params)}`, {
      headers: getAuthHeaders()
    }).then(res => res.blob())
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