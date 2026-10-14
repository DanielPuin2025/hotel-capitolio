const router = require('express').Router();
const pool = require('../config/db');
const verificarToken = require('../middleware/auth');

router.use(verificarToken);

router.get('/', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM configuracion LIMIT 1');
  res.json(rows[0] || {});
});

const soloAdmin = require('../middleware/soloAdmin');

router.put('/', soloAdmin, async (req, res) => {
  const { nombre_hotel, direccion, telefono, moneda } = req.body;
  const [existe] = await pool.query('SELECT id FROM configuracion LIMIT 1');
  if (existe.length === 0) {
    await pool.query('INSERT INTO configuracion (nombre_hotel, direccion, telefono, moneda) VALUES (?,?,?,?)', [nombre_hotel, direccion, telefono, moneda]);
  } else {
    await pool.query('UPDATE configuracion SET nombre_hotel=?, direccion=?, telefono=?, moneda=? WHERE id=?', [nombre_hotel, direccion, telefono, moneda, existe[0].id]);
  }
  res.json({ mensaje: 'Configuración guardada correctamente' });
});

module.exports = router;