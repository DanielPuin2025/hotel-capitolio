const router = require('express').Router();
const pool = require('../config/db');
const verificarToken = require('../middleware/auth');
const soloAdmin = require('../middleware/soloAdmin');
const registrarAuditoria = require('../middleware/auditoria');
const multer = require('multer');
const path = require('path');

const almacenamiento = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => {
    const nombreUnico = 'habitacion-' + req.params.id + '-' + Date.now() + path.extname(file.originalname);
    cb(null, nombreUnico);
  }
});
const upload = multer({
  storage: almacenamiento,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Solo se permiten archivos de imagen'));
    cb(null, true);
  }
});

router.use(verificarToken);

router.get('/', async (req, res) => {
  const [rows] = await pool.query(`
    SELECT hb.*,
      (SELECT hu.nombre FROM checkin_checkout c
       JOIN reservas r ON r.id = c.reserva_id
       JOIN huespedes hu ON hu.id = r.huesped_id
       WHERE r.habitacion_id = hb.id AND c.fecha_checkout IS NULL
       ORDER BY c.fecha_checkin DESC LIMIT 1) AS huesped_actual
    FROM habitaciones hb
    ORDER BY hb.numero`);
  res.json(rows);
});

router.get('/disponibles', async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM habitaciones WHERE estado = 'Disponible'");
  res.json(rows);
});

router.post('/', async (req, res) => {
  try {
    const { numero, tipo, tarifa, capacidad } = req.body;
    if (!numero || !tipo || !tarifa || !capacidad) return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
    await pool.query('INSERT INTO habitaciones (numero, tipo, tarifa, capacidad) VALUES (?,?,?,?)', [numero, tipo, tarifa, capacidad]);
    res.status(201).json({ mensaje: 'Habitación creada correctamente' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ mensaje: 'Ese número de habitación ya existe' });
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { tipo, tarifa, capacidad, estado } = req.body;

  if (req.usuario.rol !== 'Administrador') {
    const [actual] = await pool.query('SELECT tarifa FROM habitaciones WHERE id=?', [req.params.id]);
    if (actual.length && Number(actual[0].tarifa) !== Number(tarifa)) {
      return res.status(403).json({ mensaje: 'Solo un administrador puede cambiar la tarifa de una habitación' });
    }
  }

  await pool.query(
    'UPDATE habitaciones SET tipo=?, tarifa=?, capacidad=?, estado=? WHERE id=?',
    [tipo, tarifa, capacidad, estado, req.params.id]
  );
  res.json({ mensaje: 'Habitación actualizada' });
});

router.patch('/:id/estado', async (req, res) => {
  const { estado } = req.body;
  await pool.query('UPDATE habitaciones SET estado=? WHERE id=?', [estado, req.params.id]);
  res.json({ mensaje: 'Estado actualizado' });
});

router.post('/:id/imagen', soloAdmin, upload.single('imagen'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ mensaje: 'Debe seleccionar un archivo de imagen' });
    const rutaImagen = `/uploads/${req.file.filename}`;
    await pool.query('UPDATE habitaciones SET imagen_url=? WHERE id=?', [rutaImagen, req.params.id]);
    res.json({ mensaje: 'Imagen subida correctamente', imagen_url: rutaImagen });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
});

router.delete('/:id/imagen', soloAdmin, async (req, res) => {
  try {
    await pool.query('UPDATE habitaciones SET imagen_url=NULL WHERE id=?', [req.params.id]);
    res.json({ mensaje: 'Imagen eliminada correctamente' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const [actual] = await pool.query('SELECT numero FROM habitaciones WHERE id=?', [req.params.id]);
  await pool.query('DELETE FROM habitaciones WHERE id=?', [req.params.id]);
  await registrarAuditoria(req, 'Eliminar habitación', `Habitación ${actual[0]?.numero || req.params.id}`);
  res.json({ mensaje: 'Habitación eliminada' });
});

module.exports = router;