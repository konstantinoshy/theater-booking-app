const authService = require('../services/authService');

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'name, email and password are required' });

  try {
    const existing = await authService.findUserByEmail(email);
    if (existing)
      return res.status(409).json({ error: 'Email already in use' });

    const userId = await authService.createUser(name, email, password);
    res.status(201).json({ message: 'User registered successfully', user_id: userId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'email and password are required' });

  try {
    const user = await authService.findUserByEmail(email);
    if (!user)
      return res.status(401).json({ error: 'Invalid credentials' });

    const match = await authService.verifyPassword(password, user.password);
    if (!match)
      return res.status(401).json({ error: 'Invalid credentials' });

    const payload = { user_id: user.user_id, email: user.email, name: user.name };
    const tokens = authService.generateTokens(payload);

    res.json({
      ...tokens,
      user: { user_id: user.user_id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.refresh = (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(400).json({ error: 'refreshToken is required' });

  try {
    const accessToken = authService.refreshAccessToken(refreshToken);
    res.json({ accessToken });
  } catch {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
};
