if (localStorage.getItem('token')) window.location.href = 'dashboard.html';

document.getElementById('usuario').value = localStorage.getItem('usuarioRecordado') || '';

document.getElementById('formLogin').addEventListener('submit', async (e) => {
  e.preventDefault();
  const usuario = document.getElementById('usuario').value.trim();
  const password = document.getElementById('password').value;
  const recordar = document.getElementById('recordar').checked;
  const mensajeError = document.getElementById('mensajeError');
  mensajeError.textContent = '';

  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ usuario, password })
    });

    localStorage.setItem('token', data.token);
    localStorage.setItem('nombre', data.nombre);
    localStorage.setItem('rol', data.rol);
    if (recordar) localStorage.setItem('usuarioRecordado', usuario);
    else localStorage.removeItem('usuarioRecordado');

    window.location.href = 'dashboard.html';
  } catch (err) {
    mensajeError.textContent = err.message;
  }
});

function iniciarCreditos() {
  const texto = document.getElementById('creditosTexto');
  // Reinicia la animación cada vez que se abre el modal
  texto.style.animation = 'none';
  void texto.offsetWidth; // fuerza al navegador a "olvidar" la animación anterior
  texto.style.animation = 'subirCreditos 40s linear forwards';
}