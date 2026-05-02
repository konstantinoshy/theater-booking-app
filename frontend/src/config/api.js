import axios from 'axios';
import { DeviceEventEmitter } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {
  isLikelyAuth0AccessToken,
  refreshAuth0Tokens,
} from './auth0';

export const BASE_URL = 'http://192.168.1.32:3000/api'; // LAN IP — ίδιο δίκτυο Wi-Fi
// Για Android emulator χρησιμοποίησε: http://10.0.2.2:3000/api

const api = axios.create({ baseURL: BASE_URL });

// Προσθέτει αυτόματα το Authorization header
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Αν το token έχει λήξει: Auth0 → token endpoint · legacy → backend /refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        const accessToken = await SecureStore.getItemAsync('accessToken');
        if (!refreshToken) throw new Error('no refresh token');

        let newAccess;

        if (isLikelyAuth0AccessToken(accessToken)) {
          const tokens = await refreshAuth0Tokens(refreshToken);
          newAccess = tokens.access_token;
          await SecureStore.setItemAsync('accessToken', newAccess);
          if (tokens.refresh_token) {
            await SecureStore.setItemAsync('refreshToken', tokens.refresh_token);
          }
        } else {
          const { data } = await axios.post(`${BASE_URL}/refresh`, { refreshToken });
          newAccess = data.accessToken;
          await SecureStore.setItemAsync('accessToken', newAccess);
        }

        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        DeviceEventEmitter.emit('auth:logout');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
