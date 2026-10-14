const bcrypt = require('bcryptjs');
const pool = require('./config/db');

async function seed() {
  const hash = await bcrypt.hash('admin123', 10);
  const [existe] = await pool.query('SELECT id FROM usuarios WHERE usuario = "admin"');
  if (existe.length > 0) {
    await pool.query('UPDATE usuarios SET password = ? WHERE usuario = "admin"', [hash]);
  } else {
    await pool.query('INSERT INTO usuarios (nombre, usuario, password, rol) VALUES (?,?,?,?)', ['Administrador', 'admin', hash, 'Administrador']);
  }
  console.log('✅ Usuario admin listo (usuario: admin, contraseña: admin123)');
  process.exit(0);
}
seed().catch(err => { console.error(err.message); process.exit(1); });