const router = require('express').Router();
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const intentos = {};
const MAX_INTENTOS = 3;

router.post('/login', async (req, res) => {
  try {
    const { usuario, password } = req.body;
    if (!usuario || !password) return res.status(400).json({ mensaje: 'Usuario y contraseña son obligatorios' });

    intentos[usuario] = intentos[usuario] || 0;
    if (intentos[usuario] >= MAX_INTENTOS) {
      return res.status(403).json({ mensaje: 'Cuenta bloqueada por intentos fallidos.' });
    }

    const [rows] = await pool.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);
    if (rows.length === 0) {
      intentos[usuario]++;
      return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
    }

    const user = rows[0];
    if (user.estado === 'Inactivo') return res.status(403).json({ mensaje: 'Usuario inactivo.' });

    const valido = await bcrypt.compare(password, user.password);
    if (!valido) {
      intentos[usuario]++;
      const restantes = MAX_INTENTOS - intentos[usuario];
      return res.status(401).json({
        mensaje: restantes > 0 ? `Usuario o contraseña incorrectos. Intentos restantes: ${restantes}` : 'Cuenta bloqueada.'
      });
    }

    intentos[usuario] = 0;
    const token = jwt.sign({ id: user.id, rol: user.rol, nombre: user.nombre }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, nombre: user.nombre, rol: user.rol });
   } catch (err) {
    console.error('ERROR EN LOGIN:', err);
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
});

module.exports = router;
