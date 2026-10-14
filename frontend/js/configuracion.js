protegerPagina();

async function cargarConfig() {
  try {
    const config = await apiFetch('/config');
    document.getElementById('nombreHotel').value = config.nombre_hotel || '';
    document.getElementById('direccionHotel').value = config.direccion || '';
    document.getElementById('telefonoHotel').value = config.telefono || '';
    document.getElementById('monedaHotel').value = config.moneda || 'COP';
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
}

async function guardarConfig() {
  const body = {
    nombre_hotel: document.getElementById('nombreHotel').value,
    direccion: document.getElementById('direccionHotel').value,
    telefono: document.getElementById('telefonoHotel').value,
    moneda: document.getElementById('monedaHotel').value
  };
  try {
    await apiFetch('/config', { method: 'PUT', body: JSON.stringify(body) });
    mostrarMensaje('Configuración guardada correctamente');
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
}

cargarConfig();