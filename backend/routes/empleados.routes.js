const router = require('express').Router();
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const verificarToken = require('../middleware/auth');
const registrarAuditoria = require('../middleware/auditoria');
const soloAdmin = require('../middleware/soloAdmin');

router.use(verificarToken);
router.use(soloAdmin);

router.get('/', async (req, res) => {
  const [rows] = await pool.query('SELECT id, nombre, cargo, usuario, rol, estado FROM empleados ORDER BY nombre');
  res.json(rows);
});

router.post('/', async (req, res) => {
  try {
    const { nombre, cargo, usuario, rol, password } = req.body;
    if (!nombre || !cargo || !usuario || !rol || !password) return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
    await pool.query('INSERT INTO empleados (nombre, cargo, usuario, rol, estado) VALUES (?,?,?,?,"Activo")', [nombre, cargo, usuario, rol]);
    const hash = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO usuarios (nombre, usuario, password, rol) VALUES (?,?,?,?)', [nombre, usuario, hash, rol === 'Administrador' ? 'Administrador' : 'Recepcionista']);
    await registrarAuditoria(req, 'Crear empleado', `${nombre} (${rol})`);
    res.status(201).json({ mensaje: 'Empleado creado correctamente' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ mensaje: 'Ese usuario ya existe' });
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { nombre, cargo, rol, estado } = req.body;
    await pool.query('UPDATE empleados SET nombre=?, cargo=?, rol=?, estado=? WHERE id=?', [nombre, cargo, rol, estado, req.params.id]);

    // Sincroniza el estado con su cuenta de acceso (tabla usuarios), para que
    // un empleado Inactivo no pueda iniciar sesión aunque su contraseña sea correcta
    const [empleado] = await pool.query('SELECT usuario FROM empleados WHERE id=?', [req.params.id]);
    if (empleado.length > 0) {
      await pool.query('UPDATE usuarios SET estado=? WHERE usuario=?', [estado, empleado[0].usuario]);
    }

    res.json({ mensaje: 'Empleado actualizado' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const [actual] = await pool.query('SELECT nombre FROM empleados WHERE id=?', [req.params.id]);
  await pool.query('DELETE FROM empleados WHERE id=?', [req.params.id]);
  await registrarAuditoria(req, 'Eliminar empleado', actual[0]?.nombre || `ID ${req.params.id}`);
  res.json({ mensaje: 'Empleado eliminado' });
});

module.exports = router;