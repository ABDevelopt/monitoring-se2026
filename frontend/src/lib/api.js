// frontend/src/lib/api.js
// Axios instance terpusat — semua API call lewat sini

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Penting: kirim cookie session di setiap request
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: jika 401, redirect ke login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Hindari redirect loop di halaman login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
