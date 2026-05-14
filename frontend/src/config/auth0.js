/** Μοναδικό σημείο ρυθμίσεων Auth0 (Authorization Code + PKCE). */

export const AUTH0_DOMAIN = 'dev-s5swzwt4aze0v4a2.us.auth0.com';
export const AUTH0_CLIENT_ID = 'kUWvjYmJQoS5F0KNuPfoNFbGKyyeVTZb';
export const AUTH0_AUDIENCE = `https://${AUTH0_DOMAIN}/api/v2/`;

/** Iss όπως εμφανίζεται στο JWT από Auth0 (με trailing slash). */
export const AUTH0_ISSUER = `https://${AUTH0_DOMAIN}/`;

export const AUTH0_AUTHORIZE_URL = `https://${AUTH0_DOMAIN}/authorize`;
export const AUTH0_TOKEN_URL = `https://${AUTH0_DOMAIN}/oauth/token`;
export const AUTH0_REVOKE_URL = `https://${AUTH0_DOMAIN}/oauth/revoke`;

export function decodeJwtPayload(accessToken) {
  if (!accessToken || typeof accessToken !== 'string') return null;
  const segments = accessToken.split('.');
  if (segments.length < 2) return null;
  try {
    const b64 = segments[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = '='.repeat((4 - (b64.length % 4)) % 4);
    const raw = globalThis.atob(b64 + pad);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isLikelyAuth0AccessToken(accessToken) {
  const p = decodeJwtPayload(accessToken);
  return typeof p?.iss === 'string' && p.iss === AUTH0_ISSUER;
}

/** Ανανέωση μέσω refresh token στο Auth0 (όχι το /api/refresh του backend). */
export async function refreshAuth0Tokens(refreshToken) {
  const response = await fetch(AUTH0_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      client_id: AUTH0_CLIENT_ID,
      refresh_token: refreshToken,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg = data.error_description || data.error || `HTTP ${response.status}`;
    const err = new Error(msg);
    err.auth0Refresh = true;
    throw err;
  }
  return data;
}
