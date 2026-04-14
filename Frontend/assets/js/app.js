document.addEventListener('DOMContentLoaded', async () => {
    try {
        await inicializarAplicacion();
    } catch (error) {
        console.error('Error al iniciar la aplicación:', error);
        UI.hideLoader();
        UI.hidePageLoader();

        const systemVisible = !document.getElementById('system-shell')?.classList.contains('hidden');

        if (systemVisible) {
            UI.showMessage(
                'global-message',
                'danger',
                error.message || 'No se pudo iniciar la aplicación'
            );
        } else {
            UI.showMessage(
                'login-message',
                'danger',
                error.message || 'No se pudo iniciar la aplicación'
            );
        }
    }
});

async function inicializarAplicacion() {
    UI.showLoader();

    await UI.loadComponent('sidebar-container', './components/sidebar.html');
    await UI.loadComponent('topbar-container', './components/topbar.html');
    await UI.loadComponent('footer-container', './components/footer.html');
    await UI.loadComponent('loader-container', './components/loaders.html');
    await UI.loadComponent('modal-container', './components/modals.html');

    configurarEventosLogin();
    configurarEventosGlobales();

    const session = Auth.getSession();

    if (session) {
        mostrarSistema(session);
        await verificarBackend();
        await abrirVistaInicial();
    } else {
        mostrarLogin();
    }

    UI.hideLoader();
}

function configurarEventosLogin() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const username = document.getElementById('login-user')?.value.trim() || '';
        const password = document.getElementById('login-pass')?.value.trim() || '';
        const role = document.getElementById('login-role')?.value || 'admin';

        if (!username || !password) {
            UI.showMessage('login-message', 'danger', 'Debe completar usuario y contraseña.');
            return;
        }

        UI.clearMessage('login-message');
        UI.showLoader();

        try {
            await verificarBackend();

            const session = Auth.login({ username, role });
            mostrarSistema(session);
            await abrirVistaInicial();
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            UI.showMessage(
                'login-message',
                'danger',
                error.message || 'No se pudo conectar con el backend.'
            );
        } finally {
            UI.hideLoader();
        }
    });
}

function configurarEventosGlobales() {
    document.addEventListener('click', async (event) => {
        const logoutButton = event.target.closest('[data-action="logout"]');
        if (!logoutButton) return;
        Auth.logout();
    });

    document.addEventListener('click', async (event) => {
        const dashboardButton = event.target.closest('[data-action="dashboard"]');
        if (!dashboardButton) return;

        UI.showPageLoader();
        UI.clearMessage('global-message');

        try {
            await abrirDashboardDirecto();
        } catch (error) {
            console.error('Error cargando dashboard:', error);
            UI.showMessage(
                'global-message',
                'danger',
                error.message || 'No se pudo cargar el dashboard.'
            );
        } finally {
            UI.hidePageLoader();
        }
    });

    document.addEventListener('click', async (event) => {
        const pageButton = event.target.closest('[data-page]');
        if (!pageButton) return;

        const page = pageButton.getAttribute('data-page');
        UI.showPageLoader();
        UI.clearMessage('global-message');

        try {
            await abrirModuloDirecto(page);
            marcarNavActiva(page);
        } catch (error) {
            console.error('Error cargando página:', error);
            UI.showMessage(
                'global-message',
                'danger',
                error.message || 'No se pudo cargar la página solicitada.'
            );
        } finally {
            UI.hidePageLoader();
        }
    });

    document.addEventListener('click', async (event) => {
        if (event.target.id === 'global-modal-close-btn') {
            UI.closeModal();
            return;
        }

        if (event.target.id === 'global-modal-cancel-btn') {
            UI.closeModal();
            return;
        }

        if (event.target.id === 'global-modal-overlay') {
            UI.closeModal();
            return;
        }

        if (event.target.id === 'global-modal-confirm-btn') {
            await UI.confirmModal();
        }
    });
}

async function verificarBackend() {
    const resultado = await ApiService.testBackend();
    console.log('Backend verificado correctamente:', resultado);
    return resultado;
}

function mostrarLogin() {
    document.getElementById('login-screen')?.classList.remove('hidden');
    document.getElementById('system-shell')?.classList.add('hidden');
}

function mostrarSistema(session) {
    document.getElementById('login-screen')?.classList.add('hidden');
    document.getElementById('system-shell')?.classList.remove('hidden');

    const sidebarUserName = document.getElementById('sidebar-user-name');
    const sidebarUserRole = document.getElementById('sidebar-user-role');
    const sidebarUserAvatar = document.getElementById('sidebar-user-avatar');
    const topbarUserName = document.getElementById('topbar-user-name');

    if (sidebarUserName) sidebarUserName.textContent = session.username;
    if (sidebarUserRole) sidebarUserRole.textContent = session.displayName;
    if (sidebarUserAvatar) sidebarUserAvatar.textContent = session.initials;
    if (topbarUserName) topbarUserName.textContent = session.displayName;
}

async function abrirVistaInicial() {
    await abrirEstudiantesDirecto();
    marcarNavActiva('./pages/estudiantes.html');
}

async function abrirModuloDirecto(page) {
    switch (page) {
        case './pages/estudiantes.html':
            await abrirEstudiantesDirecto();
            break;
        case './pages/dashboard.html':
            await abrirDashboardDirecto();
            break;
        case './pages/cursos.html':
            await abrirCursosDirecto();
            break;
        case './pages/periodos.html':
            await abrirPeriodosDirecto();
            break;
        case './pages/secciones.html':
            await abrirSeccionesDirecto();
            break;
        case './pages/usuarios.html':
            await abrirUsuariosDirecto();
            break;
        case './pages/programas.html':
            await abrirProgramasDirecto();
            break;
        case './pages/facturas.html':
            await abrirFacturasDirecto();
            break;
        case './pages/estado-cuenta.html':
            await abrirEstadosCuentaDirecto();
            break;
        case './pages/dashboard.html':
            await abrirDashboardDirecto();
            break;
        default:
            await Router.loadPage(
                page,
                document.getElementById('page-title')?.textContent || 'Módulo',
                document.getElementById('page-subtitle')?.textContent || ''
            );
            break;
    }
}

function marcarNavActiva(page) {
    document.querySelectorAll('.nav-item').forEach((item) => {
        item.classList.remove('active');
    });

    if (!page) {
        document.querySelector('[data-action="dashboard"]')?.classList.add('active');
        return;
    }

    document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
}

function prepararContenedorModulo(titulo, subtitulo) {
    const dashboard = document.getElementById('dashboard-home');
    const dynamicContainer = document.getElementById('dynamic-page-container');

    if (!dynamicContainer) {
        throw new Error('No se encontró el contenedor dinámico.');
    }

    if (dashboard) {
        dashboard.classList.add('hidden');
        dashboard.innerHTML = '';
    }

    dynamicContainer.classList.remove('hidden');

    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');

    if (pageTitle) pageTitle.textContent = titulo;
    if (pageSubtitle) pageSubtitle.textContent = subtitulo;

    return dynamicContainer;
}

async function cargarHtmlEnContenedor(pagePath, titulo, subtitulo) {
    const dynamicContainer = prepararContenedorModulo(titulo, subtitulo);

    const responsePage = await fetch(pagePath, {
        cache: 'no-store',
        headers: {
            Accept: 'text/html'
        }
    });

    if (!responsePage.ok) {
        throw new Error(`No se pudo cargar la página ${pagePath}`);
    }

    dynamicContainer.innerHTML = await responsePage.text();
}
/* =========================
   ESTUDIANTES
========================= */
async function abrirEstudiantesDirecto() {
    await cargarHtmlEnContenedor(
        './pages/estudiantes.html',
        'Estudiantes',
        'Gestión de estudiantes'
    );

    await cargarEstudiantesDirecto();
}

async function cargarEstudiantesDirecto() {
    const tabla = document.getElementById('tabla-estudiantes');

    if (!tabla) {
        throw new Error('No se encontró la tabla de estudiantes.');
    }

    tabla.innerHTML = `<tr><td colspan="5">Cargando estudiantes...</td></tr>`;

    try {
        const response = await ApiService.obtenerEstudiantes();
        const estudiantes = Array.isArray(response.data) ? response.data : [];

        if (!estudiantes.length) {
            tabla.innerHTML = `<tr><td colspan="5">No hay estudiantes registrados</td></tr>`;
            return;
        }

        tabla.innerHTML = estudiantes.map(est => `
            <tr>
                <td>${escapeHtml(est.EstudianteID)}</td>
                <td>${escapeHtml(est.NombreCompleto)}</td>
                <td>${escapeHtml(est.CorreoInstitucional)}</td>
                <td>
                    <span class="badge ${getBadgeEstado(est.EstadoAcademico)}">
                        ${escapeHtml(est.EstadoAcademico)}
                    </span>
                </td>
                <td>
                    <button class="btn btn-outline" onclick="verDetalleEstudiante(${est.EstudianteID})">
                        Ver
                    </button>
                </td>
            </tr>
        `).join('');

        window.__estudiantesCache = estudiantes;

    } catch (error) {
        console.error(error);
        tabla.innerHTML = `<tr><td colspan="5">Error cargando datos</td></tr>`;
    }
}

/* =========================
   CURSOS
========================= */
async function abrirCursosDirecto() {
    await cargarHtmlEnContenedor(
        './pages/cursos.html',
        'Cursos',
        'Gestión de cursos'
    );

    await cargarCursosDirecto();
}

async function cargarCursosDirecto() {
    const tabla = document.getElementById('tabla-cursos');
    if (!tabla) return;

    tabla.innerHTML = `<tr><td colspan="5">Cargando cursos...</td></tr>`;

    try {
        const response = await ApiService.obtenerCursos();
        const data = Array.isArray(response.data) ? response.data : [];

        tabla.innerHTML = data.map(c => `
            <tr>
                <td>${escapeHtml(c.CursoID)}</td>
                <td>${escapeHtml(c.Nombre)}</td>
                <td>${escapeHtml(c.Creditos)}</td>
                <td>${escapeHtml(c.Codigo)}</td>
                <td>${escapeHtml(c.Estado)}</td>
            </tr>
        `).join('');

    } catch (error) {
        tabla.innerHTML = `<tr><td colspan="5">Error cargando cursos</td></tr>`;
    }
}

/* =========================
   PERIODOS
========================= */
async function abrirPeriodosDirecto() {
    await cargarHtmlEnContenedor(
        './pages/periodos.html',
        'Períodos',
        'Gestión de períodos'
    );

    await cargarPeriodosDirecto();
}

async function cargarPeriodosDirecto() {
    const tabla = document.getElementById('tabla-periodos');
    if (!tabla) return;

    tabla.innerHTML = `<tr><td colspan="5">Cargando...</td></tr>`;

    try {
        const response = await ApiService.obtenerPeriodos();
        const data = Array.isArray(response.data) ? response.data : [];

        tabla.innerHTML = data.map(p => `
            <tr>
                <td>${p.PeriodoID}</td>
                <td>${p.Nombre}</td>
                <td>${p.FechaInicio}</td>
                <td>${p.FechaFin}</td>
                <td>${p.Estado}</td>
            </tr>
        `).join('');

    } catch {
        tabla.innerHTML = `<tr><td colspan="5">Error</td></tr>`;
    }
}

/* =========================
   SECCIONES
========================= */
async function abrirSeccionesDirecto() {
    await cargarHtmlEnContenedor(
        './pages/secciones.html',
        'Secciones',
        'Gestión de secciones'
    );

    await cargarSeccionesDirecto();
}

async function cargarSeccionesDirecto() {
    const tabla = document.getElementById('tabla-secciones');
    if (!tabla) return;

    tabla.innerHTML = `<tr><td colspan="5">Cargando...</td></tr>`;

    try {
        const response = await ApiService.obtenerSecciones();
        const data = Array.isArray(response.data) ? response.data : [];

        tabla.innerHTML = data.map(s => `
            <tr>
                <td>${s.SeccionID}</td>
                <td>${s.Curso}</td>
                <td>${s.Profesor}</td>
                <td>${s.CupoDisponible}</td>
                <td>${s.Periodo}</td>
            </tr>
        `).join('');

    } catch {
        tabla.innerHTML = `<tr><td colspan="5">Error</td></tr>`;
    }
}
/* =========================
   USUARIOS
========================= */
async function abrirUsuariosDirecto() {
    await cargarHtmlEnContenedor(
        './pages/usuarios.html',
        'Usuarios',
        'Gestión de usuarios'
    );

    await cargarUsuariosDirecto();
}

async function cargarUsuariosDirecto() {
    const tabla = document.getElementById('tabla-usuarios');
    if (!tabla) return;

    tabla.innerHTML = `<tr><td colspan="5">Cargando...</td></tr>`;

    try {
        const response = await ApiService.obtenerUsuarios();
        const data = Array.isArray(response.data) ? response.data : [];

        tabla.innerHTML = data.map(u => `
            <tr>
                <td>${escapeHtml(u.UsuarioID)}</td>
                <td>${escapeHtml(u.NombreCompleto)}</td>
                <td>${escapeHtml(u.Email)}</td>
                <td>${escapeHtml(u.Rol)}</td>
                <td>${escapeHtml(u.Estado)}</td>
            </tr>
        `).join('');

    } catch {
        tabla.innerHTML = `<tr><td colspan="5">Error cargando usuarios</td></tr>`;
    }
}

/* =========================
   PROGRAMAS
========================= */
async function abrirProgramasDirecto() {
    await cargarHtmlEnContenedor(
        './pages/programas.html',
        'Programas',
        'Gestión de programas académicos'
    );

    await cargarProgramasDirecto();
}

async function cargarProgramasDirecto() {
    const tabla = document.getElementById('tabla-programas');
    if (!tabla) return;

    tabla.innerHTML = `<tr><td colspan="5">Cargando...</td></tr>`;

    try {
        const response = await ApiService.obtenerProgramas();
        const data = Array.isArray(response.data) ? response.data : [];

        tabla.innerHTML = data.map(p => `
            <tr>
                <td>${p.ProgramaID}</td>
                <td>${p.Nombre}</td>
                <td>${p.Codigo}</td>
                <td>${p.Estado}</td>
            </tr>
        `).join('');

    } catch {
        tabla.innerHTML = `<tr><td colspan="5">Error</td></tr>`;
    }
}

/* =========================
   FACTURAS
========================= */
async function abrirFacturasDirecto() {
    await cargarHtmlEnContenedor(
        './pages/facturas.html',
        'Facturas',
        'Gestión de facturación'
    );

    await cargarFacturasDirecto();
}

async function cargarFacturasDirecto() {
    const tabla = document.getElementById('tabla-facturas');
    if (!tabla) return;

    tabla.innerHTML = `<tr><td colspan="6">Cargando...</td></tr>`;

    try {
        const response = await ApiService.obtenerFacturas();
        const data = Array.isArray(response.data) ? response.data : [];

        tabla.innerHTML = data.map(f => `
            <tr>
                <td>${f.FacturaID}</td>
                <td>${f.Estudiante}</td>
                <td>${f.Total}</td>
                <td>${f.Estado}</td>
                <td>${f.Fecha}</td>
                <td>
                    <button class="btn btn-primary" onclick="pagarFactura(${f.FacturaID})">
                        Pagar
                    </button>
                </td>
            </tr>
        `).join('');

    } catch {
        tabla.innerHTML = `<tr><td colspan="6">Error</td></tr>`;
    }
}

/* =========================
   PAGOS (ACTUALIZA ESTADO)
========================= */
window.pagarFactura = async function (facturaID) {
    try {
        await ApiService.registrarPago({
            facturaId: facturaID,
            monto: 100 // puedes ajustar dinámico luego
        });

        alert('Pago realizado correctamente');

        // 🔥 Esto refresca automáticamente los datos
        await cargarFacturasDirecto();

    } catch (error) {
        alert('Error al pagar');
        console.error(error);
    }
};

/* =========================
   ESTADO DE CUENTA
========================= */
async function abrirEstadosCuentaDirecto() {
    await cargarHtmlEnContenedor(
        './pages/estado-cuenta.html',
        'Estado de Cuenta',
        'Resumen financiero'
    );

    await cargarEstadosCuentaDirecto();
}

async function cargarEstadosCuentaDirecto() {
    const tabla = document.getElementById('tabla-estado-cuenta');
    if (!tabla) return;

    tabla.innerHTML = `<tr><td colspan="5">Cargando...</td></tr>`;

    try {
        const response = await ApiService.obtenerEstadoCuenta();
        const data = Array.isArray(response.data) ? response.data : [];

        tabla.innerHTML = data.map(e => `
            <tr>
                <td>${e.Estudiante}</td>
                <td>${e.Total}</td>
                <td>${e.Pagado}</td>
                <td>${e.Pendiente}</td>
                <td>${e.Estado}</td>
            </tr>
        `).join('');

    } catch {
        tabla.innerHTML = `<tr><td colspan="5">Error</td></tr>`;
    }
}

/* =========================
   DASHBOARD
========================= */
async function abrirDashboardDirecto() {
    await cargarHtmlEnContenedor(
        './pages/dashboard.html',
        'Dashboard',
        'Resumen general del sistema'
    );
}

/* =========================
   HELPERS
========================= */
function getBadgeEstado(estado) {
    switch ((estado || '').toLowerCase()) {
        case 'activo':
            return 'badge-success';
        case 'inactivo':
            return 'badge-danger';
        default:
            return 'badge-gray';
    }
}

function escapeHtml(texto) {
    return String(texto ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

window.verDetalleEstudiante = function (id) {
    const estudiantes = window.__estudiantesCache || [];
    const est = estudiantes.find(e => e.EstudianteID == id);
    if (!est) return;

    UI.openModal({
        title: 'Detalle del estudiante',
        body: `
            <p><strong>${est.NombreCompleto}</strong></p>
            <p>${est.CorreoInstitucional}</p>
            <p>Estado: ${est.EstadoAcademico}</p>
        `,
        hideFooter: true
    });
};