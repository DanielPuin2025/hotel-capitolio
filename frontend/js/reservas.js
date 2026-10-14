protegerPagina();

document.getElementById('buscarHuesped').addEventListener('input', async (e) => {
  const texto = e.target.value.trim();
  const lista = document.getElementById('listaSugerencias');
  document.getElementById('huespedId').value = '';
  if (texto.length < 2) { lista.innerHTML = ''; return; }

  try {
    const resultados = await apiFetch(`/huespedes/buscar/${texto}`);
    lista.innerHTML = resultados.map(h => `
      <button type="button" class="list-group-item list-group-item-action" onclick="seleccionarHuesped(${h.id}, '${h.nombre.replace(/'/g, "")}')">
        ${h.nombre} - ${h.documento}
      </button>`).join('');
  } catch (err) { lista.innerHTML = ''; }
});

function seleccionarHuesped(id, nombre) {
  document.getElementById('huespedId').value = id;
  document.getElementById('buscarHuesped').value = nombre;
  document.getElementById('listaSugerencias').innerHTML = '';
}

document.getElementById('tipoHabitacion').addEventListener('change', cargarHabitacionesDisponibles);

async function cargarHabitacionesDisponibles() {
  try {
    const tipo = document.getElementById('tipoHabitacion').value;
    const habitaciones = await apiFetch('/habitaciones/disponibles');
    const filtradas = tipo ? habitaciones.filter(h => h.tipo === tipo) : habitaciones;
    const select = document.getElementById('habitacionId');
    select.innerHTML = filtradas.map(h => `<option value="${h.id}">${h.numero} - ${h.tipo} (${formatoMoneda(h.tarifa)})</option>`).join('');
    document.getElementById('avisoDisponibles').textContent = `Habitaciones disponibles para estas fechas: ${filtradas.length}`;
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
}

async function confirmarReserva() {
  let huespedId = document.getElementById('huespedId').value;
  const nombreHuesped = document.getElementById('buscarHuesped').value.trim();
  const documento = document.getElementById('documentoNuevo').value.trim();

  try {
    if (!huespedId && nombreHuesped && documento) {
      await apiFetch('/huespedes', {
        method: 'POST',
        body: JSON.stringify({
          nombre: nombreHuesped,
          documento,
          telefono: document.getElementById('telefonoNuevo').value
        })
      });
      const lista = await apiFetch(`/huespedes/buscar/${documento}`);
      huespedId = lista[0]?.id;
    }

    if (!huespedId) return mostrarMensaje('Seleccione o registre un huésped', 'danger');

    const body = {
      huesped_id: huespedId,
      habitacion_id: document.getElementById('habitacionId').value,
      fecha_entrada: document.getElementById('fechaEntrada').value,
      fecha_salida: document.getElementById('fechaSalida').value
    };
    if (!body.habitacion_id || !body.fecha_entrada || !body.fecha_salida) {
      return mostrarMensaje('Complete fecha de entrada, salida y habitación', 'danger');
    }

    await apiFetch('/reservas', { method: 'POST', body: JSON.stringify(body) });
    mostrarMensaje('Reserva confirmada correctamente');
    document.getElementById('formReserva').reset();
    cargarReservas();
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
}

async function cargarReservas() {
  try {
    mostrarCargando('tablaReservas', 6);
    const reservas = await apiFetch('/reservas');
    document.getElementById('tablaReservas').innerHTML = reservas.map(r => `
            <tr>
        <td>${r.huesped}</td><td>${r.habitacion}</td><td>${formatoFecha(r.fecha_entrada)}</td><td>${formatoFecha(r.fecha_salida)}</td>
        <td><span class="badge bg-${r.estado === 'Confirmada' ? 'success' : (r.estado === 'Cancelada' ? 'danger' : 'warning')}">${r.estado}</span></td>
        <td>
          <button class="btn-accion text-warning" onclick="cancelarReserva(${r.id})" title="Cancelar"><i class="bi bi-x-circle"></i></button>
          <button class="btn-accion text-danger" onclick="eliminarReservaDefinitivo(${r.id})" title="Eliminar definitivamente"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`).join('') || '<tr><td colspan="6" class="text-center text-muted">Sin reservas</td></tr>';
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
}

async function cancelarReserva(id) {
  if (!confirm('¿Cancelar esta reserva?')) return;
  try {
    await apiFetch(`/reservas/${id}`, { method: 'DELETE' });
    mostrarMensaje('Reserva cancelada');
    cargarReservas();
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
}

async function eliminarReservaDefinitivo(id) {
  if (!confirm('¿Eliminar esta reserva DEFINITIVAMENTE? Esta acción no se puede deshacer.')) return;
  try {
    await apiFetch(`/reservas/${id}/eliminar`, { method: 'DELETE' });
    mostrarMensaje('Reserva eliminada definitivamente');
    cargarReservas();
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
}

cargarHabitacionesDisponibles();
cargarReservas();