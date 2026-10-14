const router = require('express').Router();
const pool = require('../config/db');
const verificarToken = require('../middleware/auth');
const soloAdmin = require('../middleware/soloAdmin');

router.use(verificarToken);

router.get('/resumen', async (req, res) => {
  const [[disponibles]] = await pool.query("SELECT COUNT(*) AS total FROM habitaciones WHERE estado='Disponible'");
  const [[ocupadas]] = await pool.query("SELECT COUNT(*) AS total FROM habitaciones WHERE estado='Ocupada'");
  const [[reservasHoy]] = await pool.query('SELECT COUNT(*) AS total FROM reservas WHERE fecha_entrada = CURDATE()');
  const [[checkinHoy]] = await pool.query('SELECT COUNT(*) AS total FROM checkin_checkout WHERE DATE(fecha_checkin) = CURDATE()');
  const [porEstado] = await pool.query('SELECT estado, COUNT(*) AS total FROM habitaciones GROUP BY estado');
  res.json({ habitacionesDisponibles: disponibles.total, habitacionesOcupadas: ocupadas.total, reservasHoy: reservasHoy.total, checkinHoy: checkinHoy.total, ocupacionPorEstado: porEstado });
});

router.get('/ocupacion-promedio', soloAdmin, async (req, res) => {
  const { desde, hasta } = req.query;
  const [[totalHab]] = await pool.query('SELECT COUNT(*) AS total FROM habitaciones');
  const [[reservasRango]] = await pool.query('SELECT COUNT(*) AS total FROM reservas WHERE fecha_entrada BETWEEN ? AND ?', [desde, hasta]);
  const porcentaje = totalHab.total > 0 ? Math.round((reservasRango.total / totalHab.total) * 100) : 0;
  const [[ingresos]] = await pool.query(`SELECT COALESCE(SUM(hb.tarifa),0) AS total FROM reservas r JOIN habitaciones hb ON hb.id = r.habitacion_id WHERE r.fecha_entrada BETWEEN ? AND ? AND r.estado != 'Cancelada'`, [desde, hasta]);
  res.json({ porcentajeOcupacion: porcentaje, totalIngresos: ingresos.total, totalReservas: reservasRango.total });
});
router.get('/ocupacion-diaria', soloAdmin, async (req, res) => {
  const { desde, hasta } = req.query;
  const [rows] = await pool.query('SELECT fecha_entrada AS fecha, COUNT(*) AS reservas FROM reservas WHERE fecha_entrada BETWEEN ? AND ? GROUP BY fecha_entrada ORDER BY fecha_entrada', [desde, hasta]);
  res.json(rows);
});

// Ingresos totales generados en un día específico (reservas + consumos de minibar)
router.get('/ingresos-dia', soloAdmin, async (req, res) => {
  try {
    const { fecha } = req.query;
    if (!fecha) return res.status(400).json({ mensaje: 'Debe indicar la fecha' });

    const [[reservasRow]] = await pool.query(`
      SELECT COALESCE(SUM(hb.tarifa), 0) AS total
      FROM reservas r
      JOIN habitaciones hb ON hb.id = r.habitacion_id
      WHERE r.fecha_entrada = ? AND r.estado != 'Cancelada'`, [fecha]);

    const [[minibarRow]] = await pool.query(`
      SELECT COALESCE(SUM(mc.cantidad * p.precio_unitario), 0) AS total
      FROM minibar_consumos mc
      JOIN minibar_productos p ON p.id = mc.producto_id
      WHERE mc.fecha = ?`, [fecha]);

    const [[egresosRow]] = await pool.query(
      'SELECT COALESCE(SUM(monto), 0) AS total FROM egresos WHERE fecha = ?', [fecha]
    );

    const totalReservas = Number(reservasRow.total);
    const totalMinibar = Number(minibarRow.total);
    const totalEgresos = Number(egresosRow.total);
    const totalIngresos = totalReservas + totalMinibar;

    res.json({
      fecha,
      totalReservas,
      totalMinibar,
      totalIngresos,
      totalEgresos,
      totalFinal: totalIngresos - totalEgresos,
    });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
});

module.exports = router;