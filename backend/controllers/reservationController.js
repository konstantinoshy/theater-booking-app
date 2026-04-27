const reservationService = require('../services/reservationService');

exports.create = async (req, res) => {
  const { showtime_id, seats } = req.body;
  if (!showtime_id || !seats || seats.length === 0)
    return res.status(400).json({ error: 'showtime_id and seats are required' });

  try {
    const reservationData = await reservationService.create(req.user.user_id, showtime_id, seats);
    res.status(201).json({ 
      message: 'Reservation created', 
      reservation_id: reservationData.reservationId,
      total_price: reservationData.totalPrice,
      seats: reservationData.seats 
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getById = async (req, res) => {
  try {
    const reservation = await reservationService.findByIdAndUser(req.params.id, req.user.user_id);
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });
    res.json(reservation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.update = async (req, res) => {
  const { seats } = req.body;
  if (!seats || seats.length === 0)
    return res.status(400).json({ error: 'seats are required' });

  try {
    await reservationService.update(req.params.id, req.user.user_id, seats);
    const updated = await reservationService.findByIdAndUser(req.params.id, req.user.user_id);
    if (!updated) return res.status(404).json({ error: 'Reservation not found' });
    res.json({
      message: 'Reservation updated',
      reservation_id: Number(req.params.id),
      total_price: Number(updated.total_price),
      seats: (updated.seats || []).map((row) => ({
        seat_category_id: row.seat_category_id,
        quantity: row.quantity,
        seat_details: row.seat_details,
      })),
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.cancel = async (req, res) => {
  try {
    await reservationService.cancel(req.params.id, req.user.user_id);
    res.json({ message: 'Reservation cancelled' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.remove = async (req, res) => {
  try {
    await reservationService.remove(req.params.id, req.user.user_id);
    res.json({ message: 'Reservation deleted' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
