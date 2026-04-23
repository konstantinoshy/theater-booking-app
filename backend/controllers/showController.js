const showService = require('../services/showService');

exports.list = async (req, res) => {
  try {
    const rows = await showService.findAll(req.query);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getById = async (req, res) => {
  try {
    const show = await showService.findById(req.params.id);
    if (!show) return res.status(404).json({ error: 'Show not found' });
    res.json(show);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
