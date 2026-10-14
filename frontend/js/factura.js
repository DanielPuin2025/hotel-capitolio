protegerPagina();

function formatoFechaHora(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
}

async function cargarFactura() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) return mostrarMensaje('Falta el identificador de la factura', 'danger');

  try {
    const f = await apiFetch(`/checkin/${id}/factura`);

    document.getElementById('nombreHotel').textContent = f.hotel.nombre_hotel || 'Hotel Capitolio del Llano';
    document.getElementById('direccionHotel').textContent = f.hotel.direccion || '';
    document.getElementById('telefonoHotel').textContent = f.hotel.telefono || '';

    document.getElementById('numeroFactura').textContent = f.factura_numero;
    document.getElementById('fechaEmision').textContent = new Date().toLocaleDateString('es-CO');

    document.getElementById('huespedNombre').textContent = f.huesped.nombre;
    document.getElementById('huespedDocumento').textContent = f.huesped.documento;
    document.getElementById('huespedTelefono').textContent = f.huesped.telefono || '-';

    document.getElementById('habitacionNumero').textContent = `${f.habitacion.numero} - ${f.habitacion.tipo}`;
    document.getElementById('fechaCheckin').textContent = formatoFechaHora(f.fecha_checkin);
    document.getElementById('fechaCheckout').textContent = formatoFechaHora(f.fecha_checkout);
    document.getElementById('totalNoches').textContent = f.noches;

    let filas = `
      <tr>
        <td>${formatoFecha(f.fecha_checkin)}</td>
        <td>Alojamiento — ${f.habitacion.tipo} (${f.noches} noche${f.noches > 1 ? 's' : ''})</td>
        <td>${f.noches}</td>
        <td>${formatoMoneda(f.habitacion.tarifa)}</td>
        <td>${formatoMoneda(f.subtotalHabitacion)}</td>
      </tr>`;

    filas += f.consumos.map(c => `
      <tr>
        <td>${formatoFecha(c.fecha)}</td>
        <td>Minibar — ${c.nombre}</td>
        <td>${c.cantidad}</td>
        <td>${formatoMoneda(c.precio_unitario)}</td>
        <td>${formatoMoneda(c.total)}</td>
      </tr>`).join('');

    document.getElementById('filasFactura').innerHTML = filas;
    document.getElementById('subtotalHabitacion').textContent = formatoMoneda(f.subtotalHabitacion);
    document.getElementById('subtotalMinibar').textContent = formatoMoneda(f.totalMinibar);
    document.getElementById('totalFactura').textContent = formatoMoneda(f.total);
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
}

cargarFactura();