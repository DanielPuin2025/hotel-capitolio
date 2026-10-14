const router = require('express').Router();
const pool = require('../config/db');
const verificarToken = require('../middleware/auth');
const soloAdmin = require('../middleware/soloAdmin');
const registrarAuditoria = require('../middleware/auditoria');

router.use(verificarToken);
router.use(soloAdmin);

router.get('/', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM egresos ORDER BY fecha DESC, id DESC');
  res.json(rows);
});

router.post('/', async (req, res) => {
  try {
    const { concepto, monto, fecha, observacion } = req.body;
    if (!concepto || !monto || !fecha) {
      return res.status(400).json({ mensaje: 'Concepto, monto y fecha son obligatorios' });
    }
    await pool.query(
      'INSERT INTO egresos (concepto, monto, fecha, observacion) VALUES (?,?,?,?)',
      [concepto, monto, fecha, observacion || null]
    );
    await registrarAuditoria(req, 'Registrar egreso', `${concepto} - ${monto}`);
    res.status(201).json({ mensaje: 'Egreso registrado correctamente' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const [actual] = await pool.query('SELECT concepto FROM egresos WHERE id=?', [req.params.id]);
  await pool.query('DELETE FROM egresos WHERE id=?', [req.params.id]);
  await registrarAuditoria(req, 'Eliminar egreso', actual[0]?.concepto || `ID ${req.params.id}`);
  res.json({ mensaje: 'Egreso eliminado' });
});

module.exports = router;