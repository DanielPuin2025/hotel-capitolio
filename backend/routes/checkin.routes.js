const router = require('express').Router();
const pool = require('../config/db');
const verificarToken = require('../middleware/auth');

router.use(verificarToken);

router.get('/', async (req, res) => {
  const [rows] = await pool.query(`
    SELECT c.id, c.fecha_checkin, c.fecha_checkout, r.id AS reserva_id,
           h.nombre AS huesped, hb.numero AS habitacion, hb.id AS habitacion_id
    FROM checkin_checkout c
    JOIN reservas r ON r.id = c.reserva_id
    JOIN huespedes h ON h.id = r.huesped_id
    JOIN habitaciones hb ON hb.id = r.habitacion_id
    ORDER BY c.id DESC`);
  res.json(rows);
});

router.post('/entrada', async (req, res) => {
  try {
    const { reserva_id, firma } = req.body;
    if (!reserva_id) return res.status(400).json({ mensaje: 'Debe seleccionar una reserva' });
    const [reservaRows] = await pool.query('SELECT * FROM reservas WHERE id = ?', [reserva_id]);
    if (reservaRows.length === 0) return res.status(404).json({ mensaje: 'Reserva no encontrada' });

    await pool.query('INSERT INTO checkin_checkout (reserva_id, fecha_checkin, firma) VALUES (?, NOW(), ?)', [reserva_id, firma || null]);
    await pool.query('UPDATE habitaciones SET estado="Ocupada" WHERE id=?', [reservaRows[0].habitacion_id]);
    res.status(201).json({ mensaje: 'Check-in realizado correctamente' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
});

router.put('/salida/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM checkin_checkout WHERE id=?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ mensaje: 'Registro no encontrado' });

    const [reservaRows] = await pool.query('SELECT * FROM reservas WHERE id=?', [rows[0].reserva_id]);

    await pool.query('UPDATE checkin_checkout SET fecha_checkout=NOW() WHERE id=?', [req.params.id]);
    await pool.query('UPDATE habitaciones SET estado="En Limpieza" WHERE id=?', [reservaRows[0].habitacion_id]);
    res.json({ mensaje: 'Check-out realizado correctamente' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
});

// Genera los datos de la factura para un registro de check-in/check-out
router.get('/:id/factura', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.id, c.fecha_checkin, c.fecha_checkout,
             h.nombre AS huesped_nombre, h.documento, h.telefono,
             hb.id AS habitacion_id, hb.numero AS habitacion_numero, hb.tipo AS habitacion_tipo, hb.tarifa
      FROM checkin_checkout c
      JOIN reservas r ON r.id = c.reserva_id
      JOIN huespedes h ON h.id = r.huesped_id
      JOIN habitaciones hb ON hb.id = r.habitacion_id
      WHERE c.id = ?`, [req.params.id]);

    if (rows.length === 0) return res.status(404).json({ mensaje: 'Registro no encontrado' });
    const registro = rows[0];

    const fechaInicio = new Date(registro.fecha_checkin).toISOString().slice(0, 10);
    const fechaFin = new Date(registro.fecha_checkout || new Date()).toISOString().slice(0, 10);

    const [consumos] = await pool.query(`
      SELECT mc.fecha, mc.cantidad, p.nombre, p.precio_unitario, (mc.cantidad * p.precio_unitario) AS total
      FROM minibar_consumos mc
      JOIN minibar_productos p ON p.id = mc.producto_id
      WHERE mc.habitacion_id = ? AND mc.fecha BETWEEN ? AND ?
      ORDER BY mc.fecha`, [registro.habitacion_id, fechaInicio, fechaFin]);

    const [configRows] = await pool.query('SELECT * FROM configuracion LIMIT 1');
    const hotel = configRows[0] || {};

    const msPorDia = 1000 * 60 * 60 * 24;
    const entrada = new Date(registro.fecha_checkin);
    const salida = new Date(registro.fecha_checkout || new Date());
    let noches = Math.ceil((salida - entrada) / msPorDia);
    if (noches < 1) noches = 1;

    const subtotalHabitacion = noches * Number(registro.tarifa);
    const totalMinibar = consumos.reduce((acc, c) => acc + Number(c.total), 0);
    const total = subtotalHabitacion + totalMinibar;

    res.json({
      factura_numero: 'FAC-' + String(registro.id).padStart(4, '0'),
      hotel,
      huesped: { nombre: registro.huesped_nombre, documento: registro.documento, telefono: registro.telefono },
      habitacion: { numero: registro.habitacion_numero, tipo: registro.habitacion_tipo, tarifa: registro.tarifa },
      fecha_checkin: registro.fecha_checkin,
      fecha_checkout: registro.fecha_checkout,
      noches,
      subtotalHabitacion,
      consumos,
      totalMinibar,
      total,
    });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
});

module.exports = router;