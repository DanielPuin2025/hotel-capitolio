function soloAdmin(req, res, next) {
  if (req.usuario.rol !== 'Administrador') {
    return res.status(403).json({ mensaje: 'No tiene permisos de administrador para realizar esta acción' });
  }
  next();
}

module.exports = soloAdmin;