// services/api.js
// Central axios instance. `withCredentials` lets the HTTP-only auth cookie flow
// on every request. Base URL is relative in dev (Vite proxy) and configurable
// via VITE_API_URL for production (Render backend).
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

// Normalise error messages so components can show `err.message` directly.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong. Please try again.';
    return Promise.reject({ ...error, message, status: error.response?.status });
  }
);

export default api;
