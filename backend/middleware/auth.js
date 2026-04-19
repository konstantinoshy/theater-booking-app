const jwt          = require('jsonwebtoken');
const jwksClient   = require('jwks-rsa');
const authService  = require('../services/authService');

// ── Auth0 JWKS client ──────────────────────────────────────────────────────
const client = jwksClient({
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  cache: true,
  rateLimit: true,
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
}

// ── Middleware ─────────────────────────────────────────────────────────────
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  // Διάβασε το header χωρίς επαλήθευση για να δούμε αν είναι Auth0 token
  const decoded = jwt.decode(token, { complete: true });
  const isAuth0Token = decoded?.payload?.iss?.includes(process.env.AUTH0_DOMAIN);

  if (isAuth0Token) {
    jwt.verify(
      token,
      getKey,
      {
        audience: process.env.AUTH0_AUDIENCE,
        issuer: `https://${process.env.AUTH0_DOMAIN}/`,
        algorithms: ['RS256'],
      },
      async (err, payload) => {
        if (err) {
          console.error('[Auth0 JWT error]', err.message);
          return res.status(401).json({ error: 'Invalid or expired Auth0 token' });
        }
        try {
          const ui = await authService.fetchAuth0UserInfo(token);
          const hintEmail = payload.email || ui?.email || null;
          const hintName =
            payload.name ||
            payload.nickname ||
            ui?.name ||
            ui?.nickname ||
            (hintEmail && hintEmail.includes('@')
              ? hintEmail.split('@')[0]
              : null);

          const row = await authService.findOrCreateAuth0User({
            sub: payload.sub,
            email: hintEmail,
            name: hintName,
          });
          req.user = {
            user_id: row.user_id,
            email: row.email || null,
            name: row.name || null,
            auth0: true,
          };
          next();
        } catch (e) {
          console.error('[Auth0 user provisioning]', e);
          res.status(500).json({ error: 'Server error' });
        }
      }
    );
  } else {
    // ── Legacy JWT (custom email/password) ────────────────────────────────
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { user_id: payload.user_id, email: payload.email, name: payload.name };
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  }
};

module.exports = { authenticate };
