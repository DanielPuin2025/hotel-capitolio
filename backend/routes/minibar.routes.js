const router = require('express').Router();
const pool = require('../config/db');
const verificarToken = require('../middleware/auth');

router.use(verificarToken);

router.get('/productos', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM minibar_productos ORDER BY nombre');
  res.json(rows);
});

router.post('/productos', async (req, res) => {
  try {
    const { nombre, precio_unitario, stock } = req.body;
    if (!nombre || !precio_unitario) return res.status(400).json({ mensaje: 'Nombre y precio unitario son obligatorios' });
    await pool.query('INSERT INTO minibar_productos (nombre, precio_unitario, stock) VALUES (?,?,?)', [nombre, precio_unitario, stock || 0]);
    res.status(201).json({ mensaje: 'Producto registrado correctamente' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
});

router.put('/productos/:id', async (req, res) => {
  try {
    const { nombre, precio_unitario, stock } = req.body;
    await pool.query('UPDATE minibar_productos SET nombre=?, precio_unitario=?, stock=? WHERE id=?', [nombre, precio_unitario, stock, req.params.id]);
    res.json({ mensaje: 'Producto actualizado' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
});

router.delete('/productos/:id', async (req, res) => {
  await pool.query('DELETE FROM minibar_productos WHERE id=?', [req.params.id]);
  res.json({ mensaje: 'Producto eliminado' });
});

router.get('/consumos', async (req, res) => {
  const { habitacion_id, fecha } = req.query;
  let query = `
    SELECT mc.id, mc.cantidad, mc.fecha, p.nombre AS producto, p.precio_unitario,
           (mc.cantidad * p.precio_unitario) AS total, hb.numero AS habitacion
    FROM minibar_consumos mc
    JOIN minibar_productos p ON p.id = mc.producto_id
    JOIN habitaciones hb ON hb.id = mc.habitacion_id WHERE 1=1`;
  const params = [];
  if (habitacion_id) { query += ' AND mc.habitacion_id = ?'; params.push(habitacion_id); }
  if (fecha) { query += ' AND mc.fecha = ?'; params.push(fecha); }
  query += ' ORDER BY mc.id DESC';
  const [rows] = await pool.query(query, params);
  res.json(rows);
});

router.post('/consumos', async (req, res) => {
  try {
    const { habitacion_id, producto_id, cantidad, fecha } = req.body;
    if (!habitacion_id || !producto_id || !cantidad) {
      return res.status(400).json({ mensaje: 'Habitación, producto y cantidad son obligatorios' });
    }
    await pool.query(
      'INSERT INTO minibar_consumos (habitacion_id, producto_id, cantidad, fecha) VALUES (?,?,?,?)',
      [habitacion_id, producto_id, cantidad, fecha || new Date().toISOString().slice(0, 10)]
    );
    await pool.query('UPDATE minibar_productos SET stock = GREATEST(stock - ?, 0) WHERE id = ?', [cantidad, producto_id]);
    res.status(201).json({ mensaje: 'Consumo registrado' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
});

router.delete('/consumos/:id', async (req, res) => {
  await pool.query('DELETE FROM minibar_consumos WHERE id=?', [req.params.id]);
  res.json({ mensaje: 'Consumo eliminado' });
});

module.exports = router;