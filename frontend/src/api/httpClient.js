import axios from 'axios';
import { logout } from '../utils/authSession';

const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

httpClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('accessToken');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = String(error?.config?.url || '');
    const isAuthRequest = /\/auth\/(login|register)/.test(requestUrl);

    if (status === 401 && !isAuthRequest) {
      logout();
    }

    return Promise.reject(error);
  },
);

export default httpClient;