const API_URL = 'http://localhost:3000/api';

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
  }
}; 