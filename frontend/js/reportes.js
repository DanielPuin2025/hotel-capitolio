protegerPagina();
if (localStorage.getItem('rol') !== 'Administrador') {
  alert('No tiene permisos de administrador para acceder a esta sección');
  window.location.href = 'dashboard.html';
}
let graficoActual;

const hoy = new Date();
const hace7dias = new Date();
hace7dias.setDate(hoy.getDate() - 7);
document.getElementById('fechaHasta').value = hoy.toISOString().slice(0, 10);
document.getElementById('fechaDesde').value = hace7dias.toISOString().slice(0, 10);

async function generarReporte() {
  const desde = document.getElementById('fechaDesde').value;
  const hasta = document.getElementById('fechaHasta').value;
  if (!desde || !hasta) return mostrarMensaje('Seleccione el rango de fechas', 'danger');

  try {
    const promedio = await apiFetch(`/reportes/ocupacion-promedio?desde=${desde}&hasta=${hasta}`);
    document.getElementById('kpiOcupacionPromedio').textContent = `${promedio.porcentajeOcupacion}%`;
    document.getElementById('kpiIngresos').textContent = formatoMoneda(promedio.totalIngresos);
    document.getElementById('kpiTotalReservas').textContent = promedio.totalReservas;

    const diaria = await apiFetch(`/reportes/ocupacion-diaria?desde=${desde}&hasta=${hasta}`);
    const labels = diaria.map(d => new Date(d.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' }));
    const datos = diaria.map(d => d.reservas);

    if (graficoActual) graficoActual.destroy();
    graficoActual = new Chart(document.getElementById('graficoOcupacionDiaria'), {
      type: 'line',
      data: { labels, datasets: [{ label: 'Reservas', data: datos, borderColor: '#16305c', tension: 0.3, fill: false }] },
      options: { plugins: { legend: { display: false } } }
    });
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
}

generarReporte();

// ----- Calendario Anual -----
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
let anioCalendario = new Date().getFullYear();

function abrirCalendarioAnual() {
  anioCalendario = new Date().getFullYear();
  document.getElementById('resultadoDiaCalendario').style.display = 'none';
  renderizarCalendarioAnual();
}

function cambiarAnioCalendario(delta) {
  anioCalendario += delta;
  document.getElementById('resultadoDiaCalendario').style.display = 'none';
  renderizarCalendarioAnual();
}

function renderizarCalendarioAnual() {
  document.getElementById('anioCalendario').textContent = anioCalendario;
  const contenedor = document.getElementById('calendarioAnual');
  contenedor.innerHTML = MESES.map((nombreMes, indiceMes) => construirMesHTML(indiceMes, nombreMes)).join('');
}

function construirMesHTML(indiceMes, nombreMes) {
  const primerDiaSemana = new Date(anioCalendario, indiceMes, 1).getDay(); // 0=domingo
  const diasEnMes = new Date(anioCalendario, indiceMes + 1, 0).getDate();

  let celdas = '';
  for (let i = 0; i < primerDiaSemana; i++) celdas += `<div></div>`;
  for (let dia = 1; dia <= diasEnMes; dia++) {
    const fechaISO = `${anioCalendario}-${String(indiceMes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    celdas += `<div class="dia-calendario" onclick="consultarIngresosDia('${fechaISO}')">${dia}</div>`;
  }

  return `
    <div class="col-md-3 col-sm-4 col-6">
      <div class="card card-resumen p-2">
        <h6 class="text-center mb-2">${nombreMes}</h6>
        <div class="mini-calendario">
          <div class="dia-nombre">D</div><div class="dia-nombre">L</div><div class="dia-nombre">M</div>
          <div class="dia-nombre">M</div><div class="dia-nombre">J</div><div class="dia-nombre">V</div><div class="dia-nombre">S</div>
          ${celdas}
        </div>
      </div>
    </div>`;
}

async function consultarIngresosDia(fechaISO) {
  const panel = document.getElementById('resultadoDiaCalendario');
  panel.style.display = 'block';
  panel.textContent = 'Consultando...';

  try {
    const datos = await apiFetch(`/reportes/ingresos-dia?fecha=${fechaISO}`);
    const fechaTexto = formatoFecha(fechaISO);
    const colorFinal = datos.totalFinal >= 0 ? 'text-success' : 'text-danger';
    panel.innerHTML = `
      <strong>${fechaTexto}</strong><br>
      Ingresos (Reservas ${formatoMoneda(datos.totalReservas)} + Minibar ${formatoMoneda(datos.totalMinibar)}) = ${formatoMoneda(datos.totalIngresos)}<br>
      Egresos: − ${formatoMoneda(datos.totalEgresos)}<br>
      <strong class="${colorFinal}">Total final del día: ${formatoMoneda(datos.totalFinal)}</strong>`;
  } catch (err) {
    panel.textContent = err.message;
  }
}

// ----- Egresos -----
async function cargarEgresos() {
  try {
    mostrarCargando('tablaEgresos', 5);
    document.getElementById('fechaEgreso').value = new Date().toISOString().slice(0, 10);

    const egresos = await apiFetch('/egresos');
    let total = 0;
    document.getElementById('tablaEgresos').innerHTML = egresos.map(e => {
      total += Number(e.monto);
      return `<tr>
        <td>${formatoFecha(e.fecha)}</td>
        <td>${e.concepto}</td>
        <td>${formatoMoneda(e.monto)}</td>
        <td>${e.observacion || '-'}</td>
        <td><button class="btn-accion text-danger" onclick="eliminarEgreso(${e.id})"><i class="bi bi-trash"></i></button></td>
      </tr>`;
    }).join('') || '<tr><td colspan="5" class="text-center text-muted">Sin egresos registrados</td></tr>';

    document.getElementById('totalEgresosGeneral').textContent = formatoMoneda(total);
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
}

async function guardarEgreso() {
  const body = {
    concepto: document.getElementById('conceptoEgreso').value,
    monto: document.getElementById('montoEgreso').value,
    fecha: document.getElementById('fechaEgreso').value,
    observacion: document.getElementById('observacionEgreso').value,
  };

  if (!body.concepto || !body.monto || !body.fecha) {
    return mostrarMensaje('Complete concepto, monto y fecha', 'danger');
  }

  try {
    await apiFetch('/egresos', { method: 'POST', body: JSON.stringify(body) });
    mostrarMensaje('Egreso registrado correctamente');
    document.getElementById('formEgreso').reset();
    document.getElementById('fechaEgreso').value = new Date().toISOString().slice(0, 10);
    cargarEgresos();
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
}

async function eliminarEgreso(id) {
  if (!confirm('¿Eliminar este egreso?')) return;
  try {
    await apiFetch(`/egresos/${id}`, { method: 'DELETE' });
    mostrarMensaje('Egreso eliminado');
    cargarEgresos();
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
}