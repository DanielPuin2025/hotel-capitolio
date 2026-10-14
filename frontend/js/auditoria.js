protegerPagina();
if (localStorage.getItem('rol') !== 'Administrador') {
  alert('No tiene permisos de administrador para acceder a esta sección');
  window.location.href = 'dashboard.html';
}

async function cargarAuditoria() {
  try {
    mostrarCargando('tablaAuditoria', 5);
    const registros = await apiFetch('/auditoria');
    document.getElementById('tablaAuditoria').innerHTML = registros.map(r => `
      <tr>
        <td>${new Date(r.fecha).toLocaleString('es-CO')}</td>
        <td>${r.usuario}</td>
        <td><span class="badge bg-secondary">${r.rol}</span></td>
        <td>${r.accion}</td>
        <td>${r.detalle || '-'}</td>
      </tr>`).join('') || '<tr><td colspan="5" class="text-center text-muted">Sin registros de auditoría</td></tr>';
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
}

cargarAuditoria();