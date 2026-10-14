protegerPagina();
document.getElementById('nombreUsuario').textContent = localStorage.getItem('nombre') || '';

const COLORES_ESTADO = {
  'Ocupada': '#e74c3c',
  'Disponible': '#2ecc71',
  'En Limpieza': '#f1c40f',
  'Mantenimiento': '#95a5a6'
};

async function cargarDashboard() {
  try {
    const resumen = await apiFetch('/reportes/resumen');
    document.getElementById('kpiDisponibles').textContent = resumen.habitacionesDisponibles;
    document.getElementById('kpiOcupadas').textContent = resumen.habitacionesOcupadas;
    document.getElementById('kpiReservas').textContent = resumen.reservasHoy;
    document.getElementById('kpiCheckin').textContent = resumen.checkinHoy;

    const labels = resumen.ocupacionPorEstado.map(r => r.estado);
    const datos = resumen.ocupacionPorEstado.map(r => r.total);
    const colores = labels.map(l => COLORES_ESTADO[l] || '#ccc');

        new Chart(document.getElementById('graficoOcupacion'), {
      type: 'doughnut',
      data: { labels, datasets: [{ data: datos, backgroundColor: colores }] },
      options: { plugins: { legend: { position: 'bottom' } } }
    });

    const reservas = await apiFetch('/reservas');
    const proximas = reservas.slice(0, 6);
        document.getElementById('tablaReservasProximas').innerHTML = proximas.map(r => `
      <tr>
        <td>${r.huesped}</td>
        <td>${formatoFecha(r.fecha_entrada)}</td>
        <td>${formatoFecha(r.fecha_salida)}</td>
        <td>${r.habitacion}</td>
        <td><span class="badge bg-${r.estado === 'Confirmada' ? 'success' : (r.estado === 'Cancelada' ? 'danger' : 'warning')}">${r.estado}</span></td>
      </tr>`).join('') || '<tr><td colspan="5" class="text-center text-muted">Sin reservas registradas</td></tr>';
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
}

cargarDashboard();