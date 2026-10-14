const pool = require('../config/db');


async function registrarAuditoria(req, accion, detalle = '') {
  try {
    const usuario = req.usuario ? req.usuario.nombre || req.usuario.id : 'Desconocido';
    const rol = req.usuario ? req.usuario.rol : '-';
    await pool.query(
      'INSERT INTO auditoria (usuario, rol, accion, detalle) VALUES (?,?,?,?)',
      [usuario, rol, accion, detalle]
    );
  } catch (err) {
    console.error('No se pudo registrar la auditoría:', err.message);
  }
}

module.exports = registrarAuditoria;