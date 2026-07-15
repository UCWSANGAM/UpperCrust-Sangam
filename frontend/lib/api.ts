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

let refreshPromise: Promise<string | null> | null = null;

// Access tokens last 15 minutes. Rather than showing a confusing "0 results" page
// when one expires mid-session, silently exchange it for a new one using the
// refresh token and retry the original request. Only if that fails do we send
// the person back to login.
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = sessionStorage.getItem('refreshToken');
  if (!refreshToken) return null;

  try {
    const { data } = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, { refreshToken });
    sessionStorage.setItem('accessToken', data.accessToken);
    sessionStorage.setItem('refreshToken', data.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retried) {
      original._retried = true;

      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const newToken = await refreshPromise;

      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }

      // Refresh genuinely failed — session is over, say so and send them back to login
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('sessionExpiredMessage', 'Your session expired — please log in again.');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
