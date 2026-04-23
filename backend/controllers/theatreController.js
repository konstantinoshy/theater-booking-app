const theatreService = require('../services/theatreService');

exports.list = async (req, res) => {
  try {
    const rows = await theatreService.findAll(req.query);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getById = async (req, res) => {
  try {
    const theatre = await theatreService.findById(req.params.id);
    if (!theatre) return res.status(404).json({ error: 'Theatre not found' });
    res.json(theatre);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
