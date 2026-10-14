protegerPagina();
if (localStorage.getItem('rol') !== 'Administrador') {
  alert('No tiene permisos de administrador para acceder a esta sección');
  window.location.href = 'dashboard.html';
}
let modalEmpleado;
document.addEventListener('DOMContentLoaded', () => {
  modalEmpleado = new bootstrap.Modal(document.getElementById('modalEmpleado'));
});

async function cargarEmpleados() {
  try {
    mostrarCargando('tablaEmpleados', 6);
    const empleados = await apiFetch('/empleados');
    document.getElementById('tablaEmpleados').innerHTML = empleados.map(e => `
      <tr>
        <td>${e.nombre}</td><td>${e.cargo}</td><td>${e.usuario}</td><td>${e.rol}</td>
        <td><span class="badge bg-${e.estado === 'Activo' ? 'success' : 'secondary'}">${e.estado}</span></td>
        <td>
          <button class="btn-accion" onclick="cambiarEstado(${e.id}, '${e.estado === 'Activo' ? 'Inactivo' : 'Activo'}')"><i class="bi bi-arrow-repeat"></i></button>
          <button class="btn-accion text-danger" onclick="eliminarEmpleado(${e.id})"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`).join('') || '<tr><td colspan="6" class="text-center text-muted">Sin empleados registrados</td></tr>';
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
}

async function guardarEmpleado() {
  const body = {
    nombre: document.getElementById('nombreEmp').value,
    cargo: document.getElementById('cargoEmp').value,
    usuario: document.getElementById('usuarioEmp').value,
    password: document.getElementById('passwordEmp').value,
    rol: document.getElementById('rolEmp').value
  };
  try {
    await apiFetch('/empleados', { method: 'POST', body: JSON.stringify(body) });
    mostrarMensaje('Empleado creado correctamente');
    modalEmpleado.hide();
    document.getElementById('formEmpleado').reset();
    cargarEmpleados();
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
}

async function cambiarEstado(id, nuevoEstado) {
  try {
    const empleado = (await apiFetch('/empleados')).find(e => e.id === id);
    await apiFetch(`/empleados/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ nombre: empleado.nombre, cargo: empleado.cargo, rol: empleado.rol, estado: nuevoEstado })
    });
    mostrarMensaje('Estado actualizado');
    cargarEmpleados();
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
}

async function eliminarEmpleado(id) {
  if (!confirm('¿Eliminar este empleado?')) return;
  try {
    await apiFetch(`/empleados/${id}`, { method: 'DELETE' });
    mostrarMensaje('Empleado eliminado');
    cargarEmpleados();
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
}

cargarEmpleados();