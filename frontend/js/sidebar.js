const ITEMS_MENU = [
  { texto: 'Inicio', href: 'dashboard.html', icono: 'bi-house' },
  { texto: 'Reservas', href: 'reservas.html', icono: 'bi-calendar-check' },
  { texto: 'Habitaciones', href: 'habitaciones.html', icono: 'bi-door-closed' },
  { texto: 'Huéspedes', href: 'huespedes.html', icono: 'bi-people' },
  { texto: 'Check-in / Check-out', href: 'checkin.html', icono: 'bi-box-arrow-in-right' },
  { texto: 'Minibar', href: 'minibar.html', icono: 'bi-cup-straw' },
  { texto: 'Empleados', href: 'empleados.html', icono: 'bi-person-badge', soloAdmin: true },
   { texto: 'Reportes', href: 'reportes.html', icono: 'bi-bar-chart', soloAdmin: true },
  { texto: 'Configuración', href: 'configuracion.html', icono: 'bi-gear', soloAdmin: true },
  { texto: 'Auditoría', href: 'auditoria.html', icono: 'bi-clock-history', soloAdmin: true }
];

function renderSidebar() {
  const paginaActual = window.location.pathname.split('/').pop();
  const rol = localStorage.getItem('rol');
  const menuFiltrado = ITEMS_MENU.filter(item => !item.soloAdmin || rol === 'Administrador');
  const enlaces = menuFiltrado.map(item => `
    <a href="${item.href}" class="${paginaActual === item.href ? 'active' : ''}">
      <i class="bi ${item.icono} me-2"></i>${item.texto}
    </a>`).join('');

     document.getElementById('sidebar-placeholder').innerHTML = `
    <div class="sidebar">
      <div class="logo" id="logoEasterEgg" style="cursor:pointer;">
        <img src="img/logo.png" alt="Logo Hotel Capitolio del Llano">
      </div>
      ${enlaces}
      <a href="#" onclick="cerrarSesion()"><i class="bi bi-box-arrow-right me-2"></i>Cerrar Sesión</a>
      <button type="button" class="boton-modo-nocturno" id="btnModoNocturno" title="Modo Recepción Nocturna">
        <i class="bi bi-moon-stars-fill"></i>
      </button>
    </div>`;
}
document.addEventListener('DOMContentLoaded', () => {
  renderSidebar();
  activarEasterEgg();
  inicializarModoNocturno();
});

function inicializarModoNocturno() {
  const preferencia = localStorage.getItem('modoNocturno'); // 'on', 'off' o null (automático)
  const horaActual = new Date().getHours();
  const esHorarioNocturno = horaActual >= 20 || horaActual < 6;

  const debeActivarse = preferencia === 'on' || (preferencia === null && esHorarioNocturno);
  aplicarModoNocturno(debeActivarse);

  const boton = document.getElementById('btnModoNocturno');
  if (boton) {
    boton.addEventListener('click', () => {
      const activoAhora = document.documentElement.classList.contains('modo-nocturno');
      const nuevoEstado = !activoAhora;
      localStorage.setItem('modoNocturno', nuevoEstado ? 'on' : 'off');
      aplicarModoNocturno(nuevoEstado);
    });
  }
}

function aplicarModoNocturno(activar) {
  document.documentElement.classList.toggle('modo-nocturno', activar);
  const icono = document.querySelector('#btnModoNocturno i');
  if (icono) icono.className = activar ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
}


function activarEasterEgg() {
  const logo = document.getElementById('logoEasterEgg');
  if (!logo) return;
  let clics = 0;
  let temporizador = null;

  logo.addEventListener('click', () => {
    clics++;
    clearTimeout(temporizador);
    temporizador = setTimeout(() => { clics = 0; }, 800);

    if (clics === 3) {
      clics = 0;
      mostrarEasterEgg();
    }
  });
}

function mostrarEasterEgg() {
  const mensajes = [
    '¡Gracias por hospedarse en nuestro código! 🏨',
    'Juan Pablo, Yojan y Alvaro estuvieron aquí 👋',
    '¿Buscando habitaciones... o huevitos de Pascua? 🥚',
    'Este sistema fue hecho con café y mucha paciencia ☕',
    '¡Felicidades, encontraste el secreto del Hotel Capitolio! ✨',
  ];
  const mensaje = mensajes[Math.floor(Math.random() * mensajes.length)];

  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed; inset:0; z-index:5000;
    display:flex; align-items:center; justify-content:center;
    background:rgba(15,31,61,0.55); backdrop-filter: blur(2px);
    animation: eeFadeIn .25s ease;
  `;
  overlay.innerHTML = `
    <div style="background:#fff; padding:2rem 2.5rem; border-radius:16px; text-align:center; max-width:360px; box-shadow:0 10px 40px rgba(0,0,0,.3); animation: eePop .4s ease;">
      <div style="font-size:2.5rem; margin-bottom:.5rem;">🎉</div>
      <p style="font-weight:600; color:#0f1f3d; margin-bottom:0;">${mensaje}</p>
    </div>
  `;
  overlay.addEventListener('click', () => overlay.remove());
  document.body.appendChild(overlay);

  // confeti simple con emojis cayendo
  const emojis = ['🎊', '✨', '🏨', '🎉', '⭐'];
  for (let i = 0; i < 18; i++) {
    const pieza = document.createElement('div');
    pieza.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    pieza.style.cssText = `
      position:fixed; top:-40px; left:${Math.random() * 100}vw;
      font-size:${18 + Math.random() * 14}px; z-index:5001;
      animation: eeCaer ${2 + Math.random() * 1.5}s ease-in forwards;
      animation-delay:${Math.random() * 0.4}s;
    `;
    document.body.appendChild(pieza);
    setTimeout(() => pieza.remove(), 4000);
  }

  setTimeout(() => overlay.remove(), 4000);
}