const userService = require('../services/userService');

exports.getProfile = async (req, res) => {
  try {
    const user = await userService.getProfile(req.user.user_id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  const { name, email } = req.body;
  if (!name || !name.trim())
    return res.status(400).json({ error: 'name is required' });
  if (!email || !email.includes('@'))
    return res.status(400).json({ error: 'Valid email is required' });

  try {
    await userService.updateProfile(req.user.user_id, name.trim(), email.trim());
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ error: 'currentPassword and newPassword are required' });
  if (newPassword.length < 8)
    return res.status(400).json({ error: 'New password must be at least 8 characters' });

  try {
    await userService.changePassword(req.user.user_id, currentPassword, newPassword);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    await userService.deleteAccount(req.user.user_id);
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getReservations = async (req, res) => {
  try {
    const rows = await userService.getReservations(req.user.user_id);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const rows = await userService.getPayments(req.user.user_id);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updatePreferences = async (req, res) => {
  const { notifications_enabled } = req.body;
  if (typeof notifications_enabled !== 'boolean')
    return res.status(400).json({ error: 'notifications_enabled must be a boolean' });

  try {
    await userService.updatePreferences(req.user.user_id, notifications_enabled);
    res.json({ message: 'Preferences updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getFavorites = async (req, res) => {
  try {
    const rows = await userService.getFavorites(req.user.user_id);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.addFavorite = async (req, res) => {
  const { showId } = req.body;
  if (!showId) return res.status(400).json({ error: 'showId is required' });

  try {
    await userService.addFavorite(req.user.user_id, showId);
    res.status(201).json({ message: 'Added to favorites' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.removeFavorite = async (req, res) => {
  try {
    await userService.removeFavorite(req.user.user_id, req.params.showId);
    res.json({ message: 'Removed from favorites' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
