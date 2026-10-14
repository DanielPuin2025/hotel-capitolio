const router = require('express').Router();
const pool = require('../config/db');
const verificarToken = require('../middleware/auth');
const soloAdmin = require('../middleware/soloAdmin');

router.use(verificarToken);
router.use(soloAdmin);

router.get('/', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM auditoria ORDER BY fecha DESC LIMIT 200');
  res.json(rows);
});

module.exports = router;