const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

export const api = {
  getToken: () => localStorage.getItem('autotrack_token'),
  setToken: (token) => localStorage.setItem('autotrack_token', token),
  clearToken: () => localStorage.removeItem('autotrack_token'),

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || data.error || 'Network request failed');
    }
    return data;
  },

  login: (email, password) => api.request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),

  register: (name, email, password) => api.request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  }),

  getProfile: () => api.request('/auth/profile'),

  getVehicles: () => api.request('/vehicles'),
  getVehicle: (id) => api.request(`/vehicles/${id}`),
  createVehicle: (data) => api.request('/vehicles', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateVehicle: (id, data) => api.request(`/vehicles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteVehicle: (id) => api.request(`/vehicles/${id}`, {
    method: 'DELETE',
  }),

  getServices: (vehicleId) => api.request(`/vehicles/${vehicleId}/services`),
  createService: (vehicleId, data) => api.request(`/vehicles/${vehicleId}/services`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  deleteService: (vehicleId, logId) => api.request(`/vehicles/${vehicleId}/services/${logId}`, {
    method: 'DELETE',
  }),
  getAnalytics: (vehicleId, refresh = false) => api.request(`/vehicles/${vehicleId}/analytics${refresh ? '?refresh=true' : ''}`),
};
