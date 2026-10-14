protegerPagina();
const esAdmin = localStorage.getItem('rol') === 'Administrador';

const CLASE_BADGE = {
  'Disponible': 'badge-disponible',
  'Ocupada': 'badge-ocupada',
  'En Limpieza': 'badge-limpieza',
  'Mantenimiento': 'badge-mantenimiento'
};

let modalHabitacion, modalImagen;
document.addEventListener('DOMContentLoaded', () => {
  modalHabitacion = new bootstrap.Modal(document.getElementById('modalHabitacion'));
  modalImagen = new bootstrap.Modal(document.getElementById('modalImagen'));
});

async function cargarHabitaciones() {
  try {
    mostrarCargando('tablaHabitaciones', 6);
    const habitaciones = await apiFetch('/habitaciones');
    document.getElementById('tablaHabitaciones').innerHTML = habitaciones.map(h => `
      <tr>
        <td>${h.numero}</td>
        <td>${h.tipo}</td>
        <td>${formatoMoneda(h.tarifa)}</td>
        <td>${h.capacidad}</td>
        <td><span class="badge ${CLASE_BADGE[h.estado] || 'bg-secondary'}">${h.estado}</span></td>
        <td>
          <div class="dropdown">
            <button class="btn-accion dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" style="border:none;background:none;">
              <i class="bi bi-three-dots-vertical"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end">
              <li><button class="dropdown-item" onclick='editarHabitacion(${JSON.stringify(h)})'><i class="bi bi-pencil-square me-2"></i>Editar</button></li>
              <li><button class="dropdown-item" onclick='abrirImagen(${JSON.stringify(h)})'><i class="bi bi-image me-2"></i>${esAdmin ? 'Agregar imagen' : 'Ver imagen'}</button></li>
              ${esAdmin ? `<li><button class="dropdown-item text-danger" onclick="eliminarHabitacion(${h.id})"><i class="bi bi-trash me-2"></i>Eliminar</button></li>` : ''}
            </ul>
          </div>
        </td>
      </tr>`).join('');
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
}

function abrirNueva() {
  document.getElementById('formHabitacion').reset();
  document.getElementById('habitacionId').value = '';
  document.getElementById('tituloModal').textContent = 'Nueva Habitación';
  document.getElementById('numero').disabled = false;
  document.getElementById('grupoEstado').style.display = 'none';
}

function editarHabitacion(h) {
  document.getElementById('habitacionId').value = h.id;
  document.getElementById('numero').value = h.numero;
  document.getElementById('numero').disabled = true;
  document.getElementById('tipo').value = h.tipo;
  document.getElementById('tarifa').value = h.tarifa;
  document.getElementById('tarifa').disabled = !esAdmin;
  document.getElementById('capacidad').value = h.capacidad;
  document.getElementById('estado').value = h.estado;
  document.getElementById('grupoEstado').style.display = 'block';
  document.getElementById('tituloModal').textContent = 'Editar Habitación';
  modalHabitacion.show();
}

function abrirImagen(h) {
  document.getElementById('habitacionImagenId').value = h.id;
  document.getElementById('imagenArchivo').value = '';

  const titulo = document.getElementById('tituloModalImagen');
  const grupoArchivo = document.getElementById('grupoSeleccionArchivo');
  const btnSubir = document.getElementById('btnSubirImagen');
  const prev = document.getElementById('previsualizacion');

  // Los recepcionistas solo pueden ver la imagen, no cambiarla ni subir una nueva
  titulo.textContent = esAdmin ? 'Agregar Imagen de la Habitación' : `Imagen de la Habitación ${h.numero}`;
  grupoArchivo.style.display = esAdmin ? 'block' : 'none';
  btnSubir.style.display = esAdmin ? 'inline-block' : 'none';

  if (h.imagen_url) {
    prev.innerHTML = `
      <div style="position:relative; display:inline-block;">
        <img src="${h.imagen_url}" style="max-width:100%; max-height:260px; border-radius:8px; display:block;">
        ${esAdmin ? `
        <button type="button" onclick="eliminarImagen()" title="Eliminar imagen"
          style="position:absolute; top:6px; right:6px; background:rgba(220,53,69,0.9); color:#fff; border:none; border-radius:50%; width:28px; height:28px; font-weight:bold; line-height:1;">
          &times;
        </button>` : ''}
      </div>`;
  } else {
    prev.innerHTML = '<p class="text-muted small text-center">Esta habitación no tiene una imagen registrada todavía.</p>';
  }
  modalImagen.show();
}

async function eliminarImagen() {
  if (!confirm('¿Eliminar la imagen de esta habitación?')) return;
  const id = document.getElementById('habitacionImagenId').value;
  try {
    await apiFetch(`/habitaciones/${id}/imagen`, { method: 'DELETE' });
    mostrarMensaje('Imagen eliminada correctamente');
    modalImagen.hide();
    cargarHabitaciones();
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
}

function abrirImagen(h) {
  document.getElementById('habitacionImagenId').value = h.id;
  document.getElementById('imagenArchivo').value = '';
  const prev = document.getElementById('previsualizacion');
  if (h.imagen_url) {
    prev.innerHTML = `
      <div style="position:relative; display:inline-block;">
        <img src="${h.imagen_url}" style="max-width:100%; max-height:200px; border-radius:8px; display:block;">
        <button type="button" onclick="eliminarImagen()" title="Eliminar imagen"
          style="position:absolute; top:6px; right:6px; background:rgba(220,53,69,0.9); color:#fff; border:none; border-radius:50%; width:28px; height:28px; font-weight:bold; line-height:1;">
          &times;
        </button>
      </div>`;
  } else {
    prev.innerHTML = '<p class="text-muted small">Sin imagen registrada</p>';
  }
  modalImagen.show();
}

document.addEventListener('change', (e) => {
  if (e.target.id === 'imagenArchivo' && e.target.files[0]) {
    const prev = document.getElementById('previsualizacion');
    const url = URL.createObjectURL(e.target.files[0]);
    prev.innerHTML = `<img src="${url}" style="max-width:100%; max-height:200px; border-radius:8px;">`;
  }
});

async function guardarImagen() {
  const id = document.getElementById('habitacionImagenId').value;
  const archivo = document.getElementById('imagenArchivo').files[0];
  if (!archivo) return mostrarMensaje('Seleccione un archivo de imagen', 'danger');

  const formData = new FormData();
  formData.append('imagen', archivo);

  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/habitaciones/${id}/imagen`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.mensaje || 'Error al subir la imagen');

    mostrarMensaje('Imagen subida correctamente');
    modalImagen.hide();
    cargarHabitaciones();
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
}

async function guardarHabitacion() {
  const id = document.getElementById('habitacionId').value;
  const body = {
    numero: document.getElementById('numero').value,
    tipo: document.getElementById('tipo').value,
    tarifa: document.getElementById('tarifa').value,
    capacidad: document.getElementById('capacidad').value,
    estado: document.getElementById('estado').value || 'Disponible'
  };

  try {
    if (id) {
      await apiFetch(`/habitaciones/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      mostrarMensaje('Habitación actualizada');
    } else {
      await apiFetch('/habitaciones', { method: 'POST', body: JSON.stringify(body) });
      mostrarMensaje('Habitación creada');
    }
    modalHabitacion.hide();
    cargarHabitaciones();
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
}

async function eliminarHabitacion(id) {
  if (!confirm('¿Eliminar esta habitación?')) return;
  try {
    await apiFetch(`/habitaciones/${id}`, { method: 'DELETE' });
    mostrarMensaje('Habitación eliminada');
    cargarHabitaciones();
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
}

cargarHabitaciones();