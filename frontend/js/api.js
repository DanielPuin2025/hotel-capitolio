const API_URL = '/api';

async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 401 || res.status === 403) {
    if (data.mensaje && data.mensaje.includes('Token')) {
      localStorage.clear();
      window.location.href = 'index.html';
    }
  }

  if (!res.ok) throw new Error(data.mensaje || 'Error en la solicitud');
  return data;
}

function formatoMoneda(valor) {
  return '$' + Number(valor || 0).toLocaleString('es-CO');
}

function formatoFecha(fecha) {
  if (!fecha) return '-';
  const d = new Date(fecha);
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
}

function formatoFecha(fecha) {
  if (!fecha) return '-';
  const d = new Date(fecha);
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
}

function mostrarMensaje(texto, tipo = 'success') {
  const contenedor = document.createElement('div');
  contenedor.className = `alert alert-${tipo} position-fixed top-0 end-0 m-3 shadow`;
  contenedor.style.zIndex = 2000;
  contenedor.textContent = texto;
  document.body.appendChild(contenedor);
  setTimeout(() => contenedor.remove(), 3000);
}

function mostrarCargando(idElemento, colSpan = 6, texto = 'Cargando información...') {
  const el = document.getElementById(idElemento);
  if (!el) return;
  el.innerHTML = `
    <tr>
      <td colspan="${colSpan}">
        <div class="cargando-spinner">
          <div class="spinner-border" role="status"></div>
          <small>${texto}</small>
        </div>
      </td>
    </tr>`;
}

function protegerPagina() {
  if (!localStorage.getItem('token')) {
    window.location.href = 'index.html';
  }
}

function cerrarSesion() {
  localStorage.clear();
  window.location.href = 'index.html';
}