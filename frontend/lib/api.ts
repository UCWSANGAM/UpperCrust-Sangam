import axios from 'axios';

// All calls go through this instance so auth headers / refresh logic live in one place.
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // set in Railway to the backend's public URL
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
