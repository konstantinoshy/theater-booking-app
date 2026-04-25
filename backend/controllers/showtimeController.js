const showtimeService = require('../services/showtimeService');

exports.list = async (req, res) => {
  const { showId } = req.query;
  if (!showId) return res.status(400).json({ error: 'showId query param is required' });

  try {
    const rows = await showtimeService.findByShowId(showId);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getById = async (req, res) => {
  try {
    const showtime = await showtimeService.findById(req.params.id);
    if (!showtime) return res.status(404).json({ error: 'Showtime not found' });
    res.json(showtime);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
