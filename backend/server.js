const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.get('/healthz', (req, res) => res.status(200).json({ status: 'ok' }));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/habitaciones', require('./routes/habitaciones.routes'));
app.use('/api/huespedes', require('./routes/huespedes.routes'));
app.use('/api/reservas', require('./routes/reservas.routes'));
app.use('/api/checkin', require('./routes/checkin.routes'));
app.use('/api/minibar', require('./routes/minibar.routes'));
app.use('/api/empleados', require('./routes/empleados.routes'));
app.use('/api/reportes', require('./routes/reportes.routes'));
app.use('/api/config', require('./routes/config.routes'));
app.use('/api/auditoria', require('./routes/auditoria.routes'));
app.use('/api/egresos', require('./routes/egresos.routes'));

app.get('/', (req, res) => res.send('API Hotel Capitolio del Llano funcionando ✅'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));