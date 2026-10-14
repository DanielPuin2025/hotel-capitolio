const router = require('express').Router();
const pool = require('../config/db');
const verificarToken = require('../middleware/auth');
const registrarAuditoria = require('../middleware/auditoria');

router.use(verificarToken);

router.get('/', async (req, res) => {
  const [rows] = await pool.query(`
    SELECT r.id, r.fecha_entrada, r.fecha_salida, r.estado,
           h.nombre AS huesped, hb.numero AS habitacion, hb.id AS habitacion_id, r.huesped_id
    FROM reservas r
    JOIN huespedes h ON h.id = r.huesped_id
    JOIN habitaciones hb ON hb.id = r.habitacion_id
    ORDER BY r.fecha_entrada DESC`);
  res.json(rows);
});

router.post('/', async (req, res) => {
  try {
    const { huesped_id, habitacion_id, fecha_entrada, fecha_salida } = req.body;
    if (!huesped_id || !habitacion_id || !fecha_entrada || !fecha_salida) return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
    if (new Date(fecha_salida) <= new Date(fecha_entrada)) return res.status(400).json({ mensaje: 'La fecha de salida debe ser posterior a la de entrada' });
       const [resultado] = await pool.query('INSERT INTO reservas (huesped_id, habitacion_id, fecha_entrada, fecha_salida, estado) VALUES (?,?,?,?,?)', [huesped_id, habitacion_id, fecha_entrada, fecha_salida, 'Confirmada']);
    res.status(201).json({ mensaje: 'Reserva creada correctamente', id: resultado.insertId });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { fecha_entrada, fecha_salida, estado } = req.body;
  await pool.query('UPDATE reservas SET fecha_entrada=?, fecha_salida=?, estado=? WHERE id=?', [fecha_entrada, fecha_salida, estado, req.params.id]);
  res.json({ mensaje: 'Reserva actualizada' });
});

router.delete('/:id', async (req, res) => {
  await pool.query('UPDATE reservas SET estado="Cancelada" WHERE id=?', [req.params.id]);
  res.json({ mensaje: 'Reserva cancelada' });
});

// Elimina la reserva por completo, incluyendo su registro de check-in/check-out si existe
router.delete('/:id/eliminar', async (req, res) => {
  try {
    await pool.query('DELETE FROM checkin_checkout WHERE reserva_id = ?', [req.params.id]);
    await pool.query('DELETE FROM reservas WHERE id = ?', [req.params.id]);
    await registrarAuditoria(req, 'Eliminar reserva definitivamente', `Reserva ID ${req.params.id}`);
    res.json({ mensaje: 'Reserva eliminada definitivamente' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
});

module.exports = router;router.delete('/:id', async (req, res) => {
  await pool.query('UPDATE reservas SET estado="Cancelada" WHERE id=?', [req.params.id]);
  res.json({ mensaje: 'Reserva cancelada' });
});

router.delete('/:id/eliminar', async (req, res) => {
  try {
    await pool.query('DELETE FROM checkin_checkout WHERE reserva_id = ?', [req.params.id]);
    await pool.query('DELETE FROM reservas WHERE id = ?', [req.params.id]);
    await registrarAuditoria(req, 'Eliminar reserva definitivamente', `Reserva ID ${req.params.id}`);
    res.json({ mensaje: 'Reserva eliminada definitivamente' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
});

module.exports = router;