// API client helper for the Supermarket Billing System
const BASE_API_URL = ''; // Proxied through Vite dev server locally, absolute URL for production

// Helper to get token from storage
const getToken = () => localStorage.getItem('token');

// Helper to set token to storage
export const setToken = (token) => localStorage.setItem('token', token);

// Helper to clear token
export const clearToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Generic fetch wrapper
async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${BASE_API_URL}${endpoint}`, config);
    
    // Automatically redirect/clear session on 401 Unauthorized
    if (response.status === 401) {
      clearToken();
      window.dispatchEvent(new Event('auth-status-change'));
      return { success: false, error: 'Unauthorized. Please login again.' };
    }

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.message || data.error || 'Server error occurred' };
    }
    
    return data;
  } catch (err) {
    console.error('API request failed:', err);
    return { success: false, error: 'Network error. Make sure backend is running.' };
  }
}

// Authentication APIs
export const authApi = {
  login: async (username, password) => {
    const res = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (res.success && res.token) {
      setToken(res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
    }
    return res;
  },
  logout: () => {
    clearToken();
    window.dispatchEvent(new Event('auth-status-change'));
  },
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
  checkSession: async () => {
    return await apiRequest('/api/auth/me');
  }
};

// Dashboard APIs
export const dashboardApi = {
  getMetrics: async () => await apiRequest('/api/dashboard/metrics'),
  getCharts: async () => await apiRequest('/api/dashboard/charts'),
};

// Categories & Products APIs
export const productsApi = {
  getCategories: async () => await apiRequest('/api/categories'),
  addCategory: async (data) => await apiRequest('/api/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  editCategory: async (id, data) => await apiRequest(`/api/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteCategory: async (id) => await apiRequest(`/api/categories/${id}`, {
    method: 'DELETE',
  }),
  
  getProducts: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    const queryStr = params.toString() ? `?${params.toString()}` : '';
    return await apiRequest(`/api/products${queryStr}`);
  },
  addProduct: async (data) => await apiRequest('/api/products', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  editProduct: async (id, data) => await apiRequest(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteProduct: async (id) => await apiRequest(`/api/products/${id}`, {
    method: 'DELETE',
  }),
};

// Inventory APIs
export const inventoryApi = {
  getInventory: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    const queryStr = params.toString() ? `?${params.toString()}` : '';
    return await apiRequest(`/api/inventory${queryStr}`);
  },
  replenish: async (id, quantity, remarks) => await apiRequest(`/api/inventory/replenish/${id}`, {
    method: 'POST',
    body: JSON.stringify({ add_quantity: quantity, remarks }),
  }),
};

// Billing APIs
export const billingApi = {
  searchProducts: async (query) => await apiRequest(`/api/billing/search?query=${encodeURIComponent(query)}`),
  checkout: async (cartData) => await apiRequest('/api/billing/checkout', {
    method: 'POST',
    body: JSON.stringify(cartData),
  }),
  getReceipt: async (id) => await apiRequest(`/api/billing/receipt/${id}`),
};

// Reports and Analytics APIs
export const reportsApi = {
  getHistory: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.bill_number) params.append('bill_number', filters.bill_number);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.payment_mode) params.append('payment_mode', filters.payment_mode);
    const queryStr = params.toString() ? `?${params.toString()}` : '';
    return await apiRequest(`/api/reports/history${queryStr}`);
  },
  getBillDetails: async (id) => await apiRequest(`/api/reports/view/${id}`),
  getAnalytics: async () => await apiRequest('/api/reports/analytics'),
};

// Database Setup APIs
export const dbSetupApi = {
  getStatus: async () => await apiRequest('/api/db-setup/status'),
  initialize: async () => await apiRequest('/api/db-setup/initialize', { method: 'POST' }),
};
