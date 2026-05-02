import React, { createContext, useContext, useEffect, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import api from '../config/api';
import {
  AUTH0_DOMAIN,
  AUTH0_CLIENT_ID,
  AUTH0_AUDIENCE,
  AUTH0_TOKEN_URL,
  AUTH0_REVOKE_URL,
} from '../config/auth0';

WebBrowser.maybeCompleteAuthSession();

// ── Context ────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Redirect URI που ξέρει το Auth0 — πρέπει να ταιριάζει ακριβώς με το dashboard
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'theatre-booking',
    path: '/',
  });

  // ── Φόρτωση session κατά την εκκίνηση ────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync('accessToken');
        if (token) {
          // Προσπάθησε να πάρεις το profile από το backend
          const { data } = await api.get('/user/profile');
          setUser(data);
        }
      } catch {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
      } finally {
        setLoading(false);
      }
    })();

    // Avoid dynamic import('react-native'): Metro's importAll() touches every RN export (e.g. PushNotificationIOS) and breaks Expo Go on iOS.
    const sub = DeviceEventEmitter.addListener('auth:logout', () => {
      setUser(null);
    });
    return () => sub.remove();
  }, []);

  // ── Auth0 Login (PKCE) ────────────────────────────────────────────────────
  const loginWithAuth0 = async () => {
    try {
      // Δημιουργία PKCE code_verifier & code_challenge
      const codeVerifier  = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      const authUrl = buildAuthUrl(codeChallenge);

      // Άνοιγμα Auth0 Universal Login browser
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type !== 'success') {
        throw new Error('Auth0 login cancelled or failed');
      }

      // Εξαγωγή authorization code από URL
      const url    = new URL(result.url);
      const code   = url.searchParams.get('code');
      const state  = url.searchParams.get('state');

      if (!code) throw new Error('No authorization code returned');

      // Ανταλλαγή code → tokens
      const tokenResponse = await fetch(AUTH0_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type:    'authorization_code',
          client_id:     AUTH0_CLIENT_ID,
          code_verifier: codeVerifier,
          code,
          redirect_uri:  redirectUri,
        }),
      });

      const tokens = await tokenResponse.json();
      if (tokens.error) throw new Error(tokens.error_description || tokens.error);

      // Αποθήκευση tokens
      await SecureStore.setItemAsync('accessToken', tokens.access_token);
      if (tokens.refresh_token) {
        await SecureStore.setItemAsync('refreshToken', tokens.refresh_token);
      }

      // Πρώτο API call: δημιουργεί/συνδέει τον χρήστη στη βάση και επιστρέφει numeric user_id
      const { data } = await api.get('/user/profile');
      setUser(data);

    } catch (err) {
      console.error('[Auth0 login error]', err);
      throw err;
    }
  };

  // ── Legacy Login (email/password) ─────────────────────────────────────────
  const login = async (email, password) => {
    const { data } = await api.post('/login', { email, password });
    await SecureStore.setItemAsync('accessToken', data.accessToken);
    await SecureStore.setItemAsync('refreshToken', data.refreshToken);
    setUser(data.user);
  };

  // ── Legacy Register ───────────────────────────────────────────────────────
  const register = async (name, email, password) => {
    await api.post('/register', { name, email, password });
    await login(email, password);
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    const isAuth0 = user?.auth0;
    const refreshTok = await SecureStore.getItemAsync('refreshToken');

    // Δεν ανοίγουμε το /v2/logout σε browser (κενή σελίδα αν λείπει returnTo ή λάθος whitelist).
    // Αναίρεση refresh token στην Auth0 χωρίς εξωτερικό tab — μένεις στην εφαρμογή.
    if (isAuth0 && refreshTok) {
      try {
        await fetch(AUTH0_REVOKE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: AUTH0_CLIENT_ID,
            token: refreshTok,
            token_type_hint: 'refresh_token',
          }).toString(),
        });
      } catch {
        /* best-effort */
      }
    }

    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    setUser(null);
  };

  const toggleNotifications = () => setNotificationsEnabled(prev => !prev);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithAuth0,
        register,
        logout,
        notificationsEnabled,
        toggleNotifications,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// ── PKCE Helpers ──────────────────────────────────────────────────────────
function generateCodeVerifier(length = 64) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let verifier = '';
  for (let i = 0; i < length; i++) {
    verifier += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return verifier;
}

async function generateCodeChallenge(verifier) {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    verifier,
    { encoding: Crypto.CryptoEncoding.BASE64 }
  );
  // Base64URL encode (χωρίς padding)
  return digest.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function generateState(length = 16) {
  return Math.random().toString(36).substring(2, 2 + length);
}

function buildAuthUrl(codeChallenge) {
  const state  = generateState();
  const params = new URLSearchParams({
    response_type:         'code',
    client_id:             AUTH0_CLIENT_ID,
    redirect_uri:          AuthSession.makeRedirectUri({ scheme: 'theatre-booking' }),
    scope:                 'openid profile email offline_access',
    audience:              AUTH0_AUDIENCE,
    code_challenge:        codeChallenge,
    code_challenge_method: 'S256',
    state,
  });
  return `https://${AUTH0_DOMAIN}/authorize?${params.toString()}`;
}
