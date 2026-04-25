const seatService = require('../services/seatService');

exports.list = async (req, res) => {
  const { showtimeId } = req.query;
  if (!showtimeId) return res.status(400).json({ error: 'showtimeId query param is required' });

  try {
    const rows = await seatService.findByShowtimeId(showtimeId);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
