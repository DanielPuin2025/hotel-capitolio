protegerPagina();
let modalHuesped;
document.addEventListener('DOMContentLoaded', () => {
  modalHuesped = new bootstrap.Modal(document.getElementById('modalHuesped'));
  cargarHabitacionesDisponibles();
});

async function cargarHabitacionesDisponibles() {
  try {
    const disponibles = await apiFetch('/habitaciones/disponibles');
    document.getElementById('habitacionAsignada').innerHTML =
      '<option value="">Seleccione una habitación</option>' +
      disponibles.map(h => `<option value="${h.id}">${h.numero} - ${h.tipo}</option>`).join('');
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
}

let huespedesCache = [];

function renderizarHuespedes(lista) {
  document.getElementById('tablaHuespedes').innerHTML = lista.map(h => `
    <tr>
      <td>${h.nombre}</td><td>${h.documento}</td><td>${h.telefono || '-'}</td>
      <td>${h.profesion || '-'}</td><td>${h.procedencia || '-'}</td>
      <td>${h.habitacion_actual ? `<span class="badge bg-primary">${h.habitacion_actual}</span>` : '<span class="text-muted">Sin hospedar</span>'}</td>
      <td><button class="btn-accion text-danger" onclick="eliminarHuesped(${h.id})"><i class="bi bi-trash"></i></button></td>
    </tr>`).join('') || '<tr><td colspan="7" class="text-center text-muted">No se encontraron huéspedes</td></tr>';
}

async function cargarHuespedes() {
  try {
    mostrarCargando('tablaHuespedes', 7);
    huespedesCache = await apiFetch('/huespedes');
    renderizarHuespedes(huespedesCache);
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
}

document.getElementById('buscarNombreHuesped').addEventListener('input', (e) => {
  const texto = e.target.value.trim().toLowerCase();
  const filtrados = texto
    ? huespedesCache.filter(h => h.nombre.toLowerCase().includes(texto))
    : huespedesCache;
  renderizarHuespedes(filtrados);
});

async function guardarHuesped() {
  const habitacionId = document.getElementById('habitacionAsignada').value;
  if (!habitacionId) return mostrarMensaje('Debe seleccionar una habitación', 'danger');

  const body = {
    nombre: document.getElementById('nombre').value,
    documento: document.getElementById('documento').value,
    telefono: document.getElementById('telefono').value,
    profesion: document.getElementById('profesion').value,
    procedencia: document.getElementById('procedencia').value
  };

  try {
    const nuevoHuesped = await apiFetch('/huespedes', { method: 'POST', body: JSON.stringify(body) });

    const hoy = new Date().toISOString().slice(0, 10);
    const manana = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

    const nuevaReserva = await apiFetch('/reservas', {
      method: 'POST',
      body: JSON.stringify({
        huesped_id: nuevoHuesped.id,
        habitacion_id: habitacionId,
        fecha_entrada: hoy,
        fecha_salida: manana
      })
    });

    await apiFetch('/checkin/entrada', {
      method: 'POST',
      body: JSON.stringify({ reserva_id: nuevaReserva.id })
    });

    mostrarMensaje('Huésped registrado y asignado a la habitación');
    modalHuesped.hide();
    document.getElementById('formHuesped').reset();
    cargarHuespedes();
    cargarHabitacionesDisponibles();
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
}

async function eliminarHuesped(id) {
  if (!confirm('¿Eliminar este huésped?')) return;
  try {
    await apiFetch(`/huespedes/${id}`, { method: 'DELETE' });
    mostrarMensaje('Huésped eliminado');
    cargarHuespedes();
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
}

cargarHuespedes();