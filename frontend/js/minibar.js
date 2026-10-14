protegerPagina();
let modalConsumo, modalProducto;
let productosCache = [];

document.addEventListener('DOMContentLoaded', () => {
  modalConsumo = new bootstrap.Modal(document.getElementById('modalConsumo'));
  modalProducto = new bootstrap.Modal(document.getElementById('modalProducto'));
  document.getElementById('fechaConsumo').value = new Date().toISOString().slice(0, 10);
});

async function cargarSelects() {
  try {
    const habitaciones = await apiFetch('/habitaciones');
    const opcionesHab = habitaciones.map(h => `<option value="${h.id}">${h.numero}</option>`).join('');
    document.getElementById('habitacionConsumo').innerHTML = opcionesHab;
    document.getElementById('filtroHabitacion').innerHTML = '<option value="">Todas</option>' + opcionesHab;

    productosCache = await apiFetch('/minibar/productos');
    document.getElementById('listaProductos').innerHTML =
      productosCache.map(p => `<option value="${p.nombre}">`).join('');
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
}

async function cargarConsumos() {
  try {
    mostrarCargando('tablaMinibar', 5);
    const habitacion_id = document.getElementById('filtroHabitacion').value;
    const fecha = document.getElementById('filtroFecha').value;
    const params = new URLSearchParams();
    if (habitacion_id) params.append('habitacion_id', habitacion_id);
    if (fecha) params.append('fecha', fecha);

    const consumos = await apiFetch(`/minibar/consumos?${params.toString()}`);
    let total = 0;
    document.getElementById('tablaMinibar').innerHTML = consumos.map(c => {
      total += Number(c.total);
      return `<tr>
        <td>${c.producto}</td><td>${c.cantidad}</td><td>${formatoMoneda(c.precio_unitario)}</td>
        <td>${formatoMoneda(c.total)}</td>
        <td><button class="btn-accion text-danger" onclick="eliminarConsumo(${c.id})"><i class="bi bi-trash"></i></button></td>
      </tr>`;
    }).join('') || '<tr><td colspan="5" class="text-center text-muted">Sin consumos</td></tr>';

    document.getElementById('totalCobrar').textContent = formatoMoneda(total);
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
}

async function cargarInventario() {
  try {
    mostrarCargando('tablaInventario', 5);
    productosCache = await apiFetch('/minibar/productos');
    document.getElementById('tablaInventario').innerHTML = productosCache.map(p => {
      const pocaExistencia = p.stock < 5;
      return `<tr class="${pocaExistencia ? 'table-warning' : ''}">
        <td>${p.nombre}</td>
        <td>${formatoMoneda(p.precio_unitario)}</td>
        <td>${p.stock}</td>
        <td>${pocaExistencia
          ? '<span class="badge bg-danger"><i class="bi bi-exclamation-triangle-fill me-1"></i>Poca cantidad</span>'
          : '<span class="badge bg-success">Disponible</span>'}</td>
        <td>
          <button class="btn-accion" onclick='editarProductoInventario(${JSON.stringify(p)})'><i class="bi bi-pencil-square"></i></button>
          <button class="btn-accion text-danger" onclick="eliminarProductoInventario(${p.id})"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`;
    }).join('') || '<tr><td colspan="5" class="text-center text-muted">Sin productos registrados</td></tr>';
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
}

function abrirNuevoProducto() {
  document.getElementById('formProducto').reset();
  document.getElementById('productoId').value = '';
  document.getElementById('tituloModalProducto').textContent = 'Registrar Producto';
}

function editarProductoInventario(p) {
  document.getElementById('productoId').value = p.id;
  document.getElementById('nombreProductoInventario').value = p.nombre;
  document.getElementById('precioProductoInventario').value = p.precio_unitario;
  document.getElementById('stockProductoInventario').value = p.stock;
  document.getElementById('tituloModalProducto').textContent = 'Editar Producto';
  modalProducto.show();
}

async function guardarProductoInventario() {
  const id = document.getElementById('productoId').value;
  const body = {
    nombre: document.getElementById('nombreProductoInventario').value,
    precio_unitario: document.getElementById('precioProductoInventario').value,
    stock: document.getElementById('stockProductoInventario').value,
  };

  try {
    if (id) {
      await apiFetch(`/minibar/productos/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      mostrarMensaje('Producto actualizado');
    } else {
      await apiFetch('/minibar/productos', { method: 'POST', body: JSON.stringify(body) });
      mostrarMensaje('Producto registrado correctamente');
    }
    modalProducto.hide();
    cargarInventario();
    cargarSelects();
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
}

async function eliminarProductoInventario(id) {
  if (!confirm('¿Eliminar este producto del inventario?')) return;
  try {
    await apiFetch(`/minibar/productos/${id}`, { method: 'DELETE' });
    mostrarMensaje('Producto eliminado');
    cargarInventario();
    cargarSelects();
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
}

async function guardarConsumo() {
  const nombreProducto = document.getElementById('nombreProducto').value.trim();
  const precio = document.getElementById('precioProducto').value;

  if (!nombreProducto) return mostrarMensaje('Escriba el nombre del producto', 'danger');

  try {
    let producto = productosCache.find(p => p.nombre.toLowerCase() === nombreProducto.toLowerCase());

    if (!producto) {
      if (!precio) return mostrarMensaje('Este producto es nuevo, indique su precio unitario', 'danger');
      await apiFetch('/minibar/productos', {
        method: 'POST',
        body: JSON.stringify({ nombre: nombreProducto, precio_unitario: precio, stock: 0 })
      });
      productosCache = await apiFetch('/minibar/productos');
      producto = productosCache.find(p => p.nombre.toLowerCase() === nombreProducto.toLowerCase());
    }

    const body = {
      habitacion_id: document.getElementById('habitacionConsumo').value,
      producto_id: producto.id,
      cantidad: document.getElementById('cantidadConsumo').value,
      fecha: document.getElementById('fechaConsumo').value
    };

    await apiFetch('/minibar/consumos', { method: 'POST', body: JSON.stringify(body) });
    mostrarMensaje('Consumo registrado');
    modalConsumo.hide();
    document.getElementById('formConsumo').reset();
    cargarSelects();
    cargarConsumos();
    cargarInventario();
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
}

async function eliminarConsumo(id) {
  if (!confirm('¿Eliminar este consumo?')) return;
  try {
    await apiFetch(`/minibar/consumos/${id}`, { method: 'DELETE' });
    mostrarMensaje('Consumo eliminado');
    cargarConsumos();
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
}

cargarSelects().then(() => {
  cargarConsumos();
  cargarInventario();
});