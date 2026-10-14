protegerPagina();

async function cargarReservasParaCheckin() {
  try {
    const reservas = await apiFetch('/reservas');
    const pendientes = reservas.filter(r => r.estado !== 'Cancelada');
       document.getElementById('reservaSelect').innerHTML = pendientes.map(r =>
      `<option value="${r.id}">${r.huesped} - Hab. ${r.habitacion} (${formatoFecha(r.fecha_entrada)} a ${formatoFecha(r.fecha_salida)})</option>`
    ).join('') || '<option value="">No hay reservas disponibles</option>';
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
}

async function realizarCheckin() {
  const reserva_id = document.getElementById('reservaSelect').value;
  if (!reserva_id) return mostrarMensaje('Seleccione una reserva', 'danger');

  try {
    await apiFetch('/checkin/entrada', {
      method: 'POST',
      body: JSON.stringify({
        reserva_id,
        documento: document.getElementById('documentoCheckin').value,
        firma: document.getElementById('firmaCheckin').value
      })
    });
    mostrarMensaje('Check-in realizado correctamente');
    document.getElementById('documentoCheckin').value = '';
    document.getElementById('firmaCheckin').value = '';
    cargarReservasParaCheckin();
    cargarCheckouts();
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
}

async function cargarCheckouts() {
  try {
    mostrarCargando('tablaCheckout', 5);
    const registros = await apiFetch('/checkin');
    document.getElementById('tablaCheckout').innerHTML = registros.map(r => `
      <tr>
        <td>${r.huesped}</td><td>${r.habitacion}</td>
        <td>${r.fecha_checkin ? new Date(r.fecha_checkin).toLocaleString('es-CO') : '-'}</td>
        <td>${r.fecha_checkout ? new Date(r.fecha_checkout).toLocaleString('es-CO') : '<span class="text-muted">Pendiente</span>'}</td>
        <td>${r.fecha_checkout
          ? `<button class="btn btn-sm btn-outline-primary" onclick="verFactura(${r.id})"><i class="bi bi-receipt me-1"></i>Ver Factura</button>`
          : `<button class="btn btn-sm btn-outline-danger" onclick="realizarCheckout(${r.id})">Realizar Check-out</button>`}</td>
      </tr>`).join('') || '<tr><td colspan="5" class="text-center text-muted">Sin registros</td></tr>';
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
}

function verFactura(id) {
  window.open(`factura.html?id=${id}`, '_blank');
}

async function realizarCheckout(id) {
  if (!confirm('¿Confirmar check-out?')) return;
  try {
    await apiFetch(`/checkin/salida/${id}`, { method: 'PUT' });
    mostrarMensaje('Check-out realizado correctamente');
    cargarCheckouts();
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
}

cargarReservasParaCheckin();
cargarCheckouts();