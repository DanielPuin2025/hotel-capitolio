const jwt = require('jsonwebtoken');
require('dotenv').config();

function verificarToken(req, res, next) {
  const header = req.headers['authorization'];
  const token = header && header.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      mensaje: 'Token no proporcionado'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        mensaje: 'Token inválido o expirado'
      });
    }

    req.usuario = decoded;
    next();
  });
}

module.exports = verificarToken;