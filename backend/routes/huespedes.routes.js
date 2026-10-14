const router = require('express').Router();
const pool = require('../config/db');
const verificarToken = require('../middleware/auth');
const registrarAuditoria = require('../middleware/auditoria');

router.use(verificarToken);

router.get('/', async (req, res) => {
  const [rows] = await pool.query(`
    SELECT h.*,
      (SELECT hb.numero FROM checkin_checkout c
       JOIN reservas r ON r.id = c.reserva_id
       JOIN habitaciones hb ON hb.id = r.habitacion_id
       WHERE r.huesped_id = h.id AND c.fecha_checkout IS NULL
       ORDER BY c.fecha_checkin DESC LIMIT 1) AS habitacion_actual
    FROM huespedes h
    ORDER BY h.nombre`);
  res.json(rows);
});

router.get('/buscar/:texto', async (req, res) => {
  const texto = `%${req.params.texto}%`;
  const [rows] = await pool.query('SELECT * FROM huespedes WHERE nombre LIKE ? OR documento LIKE ? LIMIT 10', [texto, texto]);
  res.json(rows);
});

router.post('/', async (req, res) => {
  try {
    const { nombre, documento, telefono, profesion, procedencia } = req.body;
    if (!nombre || !documento) return res.status(400).json({ mensaje: 'Nombre y documento son obligatorios' });
    const [existe] = await pool.query('SELECT id FROM huespedes WHERE documento = ?', [documento]);
    if (existe.length > 0) return res.status(409).json({ mensaje: 'Ya existe un huésped con ese documento' });
    const [resultado] = await pool.query('INSERT INTO huespedes (nombre, documento, telefono, profesion, procedencia) VALUES (?,?,?,?,?)', [nombre, documento, telefono, profesion, procedencia]);
    res.status(201).json({ mensaje: 'Huésped registrado correctamente', id: resultado.insertId });
   } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { nombre, telefono, profesion, procedencia } = req.body;
  await pool.query('UPDATE huespedes SET nombre=?, telefono=?, profesion=?, procedencia=? WHERE id=?', [nombre, telefono, profesion, procedencia, req.params.id]);
  res.json({ mensaje: 'Huésped actualizado' });
});

router.delete('/:id', async (req, res) => {
  try {
    const [actual] = await pool.query('SELECT nombre FROM huespedes WHERE id=?', [req.params.id]);
    await pool.query('DELETE FROM huespedes WHERE id=?', [req.params.id]);
    await registrarAuditoria(req, 'Eliminar huésped', actual[0]?.nombre || `ID ${req.params.id}`);
    res.json({ mensaje: 'Huésped eliminado' });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
      return res.status(409).json({ mensaje: 'No se puede eliminar: este huésped tiene reservas registradas' });
    }
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
});

module.exports = router;