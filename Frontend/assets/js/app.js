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
            marcarNavActiva('');
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
    await abrirDashboardDirecto();
    marcarNavActiva('');
}

async function abrirModuloDirecto(page) {
    switch (page) {
        case './pages/dashboard.html':
            await abrirDashboardDirecto();
            break;
        case './pages/estudiantes.html':
            await abrirEstudiantesDirecto();
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
   DASHBOARD
========================= */
async function abrirDashboardDirecto() {
    await cargarHtmlEnContenedor(
        './pages/dashboard.html',
        'Dashboard',
        'Resumen general del sistema'
    );

    await cargarDashboardDirecto();
}

async function cargarDashboardDirecto() {
    try {
        UI.clearMessage('dashboard-message');

        const response = await ApiService.obtenerDashboardResumen();
        const payload = response?.data ?? {};

        const resumen = payload.resumen || {};
        const matriculasRecientes = Array.isArray(payload.matriculasRecientes) ? payload.matriculasRecientes : [];
        const pagosRecientes = Array.isArray(payload.pagosRecientes) ? payload.pagosRecientes : [];
        const periodos = Array.isArray(payload.periodos) ? payload.periodos : [];

        setText('dash-total-estudiantes', resumen.TotalEstudiantes ?? 0);
        setText('dash-estudiantes-activos', resumen.EstudiantesActivos ?? 0);
        setText('dash-total-cursos', resumen.TotalCursos ?? 0);
        setText('dash-cursos-activos', resumen.CursosActivos ?? 0);
        setText('dash-total-periodos', resumen.TotalPeriodos ?? 0);
        setText('dash-periodos-activos', resumen.PeriodosActivos ?? 0);
        setText('dash-total-secciones', resumen.TotalSecciones ?? 0);
        setText('dash-secciones-activas', resumen.SeccionesActivas ?? 0);
        setText('dash-total-matriculas', resumen.TotalMatriculas ?? 0);
        setText('dash-matriculas-pendientes', resumen.MatriculasPendientes ?? 0);
        setText('dash-matriculas-confirmadas', resumen.MatriculasConfirmadas ?? 0);
        setText('dash-total-pagos', resumen.TotalPagos ?? 0);
        setText('dash-monto-recaudado', Helpers.formatCurrency(resumen.MontoRecaudado ?? 0));
        setText('dash-facturas-pendientes', resumen.FacturasPendientes ?? 0);
        setText('dash-saldo-pendiente-total', Helpers.formatCurrency(resumen.SaldoPendienteTotal ?? 0));

        const tablaMatriculas = document.getElementById('tabla-dashboard-matriculas');
        if (tablaMatriculas) {
            tablaMatriculas.innerHTML = matriculasRecientes.length
                ? matriculasRecientes.map(item => `
                    <tr>
                        <td>${escapeHtml(item.MatriculaID)}</td>
                        <td>${escapeHtml(item.NombreEstudiante || 'N/D')}</td>
                        <td>${escapeHtml(construirNombrePeriodo(item))}</td>
                        <td>${escapeHtml(item.CreditosTotales ?? 0)}</td>
                        <td>${Helpers.formatCurrency(item.CostoTotal ?? 0)}</td>
                        <td>
                            <span class="badge ${getBadgeEstadoMatricula(item.EstadoMatricula)}">
                                ${escapeHtml(item.EstadoMatricula || 'N/D')}
                            </span>
                        </td>
                    </tr>
                `).join('')
                : `<tr><td colspan="6">No hay matrículas recientes</td></tr>`;
        }

        const tablaPagos = document.getElementById('tabla-dashboard-pagos');
        if (tablaPagos) {
            tablaPagos.innerHTML = pagosRecientes.length
                ? pagosRecientes.map(item => `
                    <tr>
                        <td>${escapeHtml(item.PagoID)}</td>
                        <td>${escapeHtml(item.NombreEstudiante || 'N/D')}</td>
                        <td>${escapeHtml(item.NumeroFactura || 'N/D')}</td>
                        <td>${Helpers.formatCurrency(item.MontoPago ?? 0)}</td>
                        <td>${escapeHtml(item.MetodoPago || 'N/D')}</td>
                        <td>
                            <span class="badge ${getBadgeEstadoPago(item.EstadoPago)}">
                                ${escapeHtml(item.EstadoPago || 'N/D')}
                            </span>
                        </td>
                    </tr>
                `).join('')
                : `<tr><td colspan="6">No hay pagos recientes</td></tr>`;
        }

        const tablaPeriodos = document.getElementById('tabla-dashboard-periodos');
        if (tablaPeriodos) {
            tablaPeriodos.innerHTML = periodos.length
                ? periodos.map(item => `
                    <tr>
                        <td>${escapeHtml(item.PeriodoID)}</td>
                        <td>${escapeHtml(item.NombrePeriodo || 'N/D')}</td>
                        <td>${escapeHtml(item.TipoPeriodo || 'N/D')}</td>
                        <td>${escapeHtml(item.Anio ?? 'N/D')}</td>
                        <td>
                            <span class="badge ${getBadgeEstado(item.EstadoPeriodo)}">
                                ${escapeHtml(item.EstadoPeriodo || 'N/D')}
                            </span>
                        </td>
                    </tr>
                `).join('')
                : `<tr><td colspan="5">No hay períodos registrados</td></tr>`;
        }
    } catch (error) {
        console.error('Error cargando dashboard:', error);
        UI.showMessage('dashboard-message', 'danger', error.message || 'No se pudo cargar el dashboard.');
    }
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
                <td>${escapeHtml(est.NombreCompleto || 'N/D')}</td>
                <td>${escapeHtml(est.CorreoInstitucional || 'N/D')}</td>
                <td>
                    <span class="badge ${getBadgeEstado(est.EstadoAcademico)}">
                        ${escapeHtml(est.EstadoAcademico || 'N/D')}
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

        const btnNuevo = document.getElementById('btn-nuevo-estudiante');
        if (btnNuevo) {
            btnNuevo.textContent = 'Actualizar listado';
            btnNuevo.onclick = async () => {
                UI.clearMessage('estudiantes-message');
                await cargarEstudiantesDirecto();
            };
        }
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

    tabla.innerHTML = `<tr><td colspan="6">Cargando cursos...</td></tr>`;

    try {
        const response = await ApiService.obtenerCursos();
        const data = Array.isArray(response.data) ? response.data : [];

        tabla.innerHTML = data.length
            ? data.map(c => `
                <tr>
                    <td>${escapeHtml(c.CursoID)}</td>
                    <td>${escapeHtml(c.CodigoCurso || 'N/D')}</td>
                    <td>${escapeHtml(c.NombreCurso || 'N/D')}</td>
                    <td>${escapeHtml(c.Creditos ?? 0)}</td>
                    <td>
                        <span class="badge ${getBadgeEstado(c.EstadoCurso)}">
                            ${escapeHtml(c.EstadoCurso || 'N/D')}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-outline" onclick="verDetalleCurso(${c.CursoID})">
                            Ver
                        </button>
                    </td>
                </tr>
            `).join('')
            : `<tr><td colspan="6">No hay cursos registrados</td></tr>`;

        window.__cursosCache = data;

        const btnNuevo = document.getElementById('btn-nuevo-curso');
        if (btnNuevo) {
            btnNuevo.textContent = 'Actualizar listado';
            btnNuevo.onclick = async () => {
                UI.clearMessage('cursos-message');
                await cargarCursosDirecto();
            };
        }
    } catch (error) {
        console.error(error);
        tabla.innerHTML = `<tr><td colspan="6">Error cargando cursos</td></tr>`;
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

    tabla.innerHTML = `<tr><td colspan="7">Cargando períodos...</td></tr>`;

    try {
        const response = await ApiService.obtenerPeriodos();
        const data = Array.isArray(response.data) ? response.data : [];

        tabla.innerHTML = data.length
            ? data.map(p => `
                <tr>
                    <td>${escapeHtml(p.PeriodoID)}</td>
                    <td>${escapeHtml(p.NombrePeriodo || 'N/D')}</td>
                    <td>${escapeHtml(p.TipoPeriodo || 'N/D')}</td>
                    <td>${escapeHtml(formatearFecha(p.FechaInicio))}</td>
                    <td>${escapeHtml(formatearFecha(p.FechaFin))}</td>
                    <td>
                        <span class="badge ${getBadgeEstado(p.EstadoPeriodo)}">
                            ${escapeHtml(p.EstadoPeriodo || 'N/D')}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-outline" onclick="verDetallePeriodo(${p.PeriodoID})">
                            Ver
                        </button>
                    </td>
                </tr>
            `).join('')
            : `<tr><td colspan="7">No hay períodos registrados</td></tr>`;

        window.__periodosCache = data;

        const btnNuevo = document.getElementById('btn-nuevo-periodo');
        if (btnNuevo) {
            btnNuevo.textContent = 'Actualizar listado';
            btnNuevo.onclick = async () => {
                UI.clearMessage('periodos-message');
                await cargarPeriodosDirecto();
            };
        }
    } catch (error) {
        console.error(error);
        tabla.innerHTML = `<tr><td colspan="7">Error cargando períodos</td></tr>`;
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

    tabla.innerHTML = `<tr><td colspan="7">Cargando secciones...</td></tr>`;

    try {
        const response = await ApiService.obtenerSecciones();
        const data = Array.isArray(response.data) ? response.data : [];

        const secciones = normalizarSecciones(data);

        tabla.innerHTML = secciones.length
            ? secciones.map(s => `
                <tr>
                    <td>${escapeHtml(s.SeccionID)}</td>
                    <td>${escapeHtml(s.NombreCurso || 'N/D')}</td>
                    <td>${escapeHtml(construirPeriodoTexto(s))}</td>
                    <td>${escapeHtml(s.CupoMaximo ?? 0)}</td>
                    <td>${escapeHtml(s.CupoDisponible ?? 0)}</td>
                    <td>
                        <span class="badge ${getBadgeEstado(s.EstadoSeccion)}">
                            ${escapeHtml(s.EstadoSeccion || 'N/D')}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-outline" onclick="verDetalleSeccion(${s.SeccionID})">
                            Ver
                        </button>
                    </td>
                </tr>
            `).join('')
            : `<tr><td colspan="7">No hay secciones registradas</td></tr>`;

        window.__seccionesCache = secciones;

        const btnNueva = document.getElementById('btn-nueva-seccion');
        if (btnNueva) {
            btnNueva.textContent = 'Actualizar listado';
            btnNueva.onclick = async () => {
                UI.clearMessage('secciones-message');
                await cargarSeccionesDirecto();
            };
        }
    } catch (error) {
        console.error(error);
        tabla.innerHTML = `<tr><td colspan="7">Error cargando secciones</td></tr>`;
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

    tabla.innerHTML = `<tr><td colspan="6">Cargando usuarios...</td></tr>`;

    try {
        const response = await ApiService.obtenerUsuarios();
        const data = Array.isArray(response.data) ? response.data : [];

        tabla.innerHTML = data.length
            ? data.map(u => `
                <tr>
                    <td>${escapeHtml(u.UsuarioID)}</td>
                    <td>${escapeHtml(u.NombreCompleto || 'N/D')}</td>
                    <td>${escapeHtml(u.CorreoInstitucional || 'N/D')}</td>
                    <td>
                        <span class="badge ${getBadgeRol(u.RolSistema)}">
                            ${escapeHtml(u.RolSistema || 'N/D')}
                        </span>
                    </td>
                    <td>
                        <span class="badge ${getBadgeEstado(u.EstadoUsuario)}">
                            ${escapeHtml(u.EstadoUsuario || 'N/D')}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-outline" onclick="verDetalleUsuario(${u.UsuarioID})">
                            Ver
                        </button>
                    </td>
                </tr>
            `).join('')
            : `<tr><td colspan="6">No hay usuarios registrados</td></tr>`;

        window.__usuariosCache = data;

        setText('usuarios-total', data.length);
        setText(
            'usuarios-activos',
            data.filter(u => String(u.EstadoUsuario || '').toLowerCase() === 'activo').length
        );
        setText(
            'usuarios-estudiantes',
            data.filter(u => String(u.RolSistema || '') === 'Estudiante').length
        );
        setText(
            'usuarios-docentes',
            data.filter(u => String(u.RolSistema || '') === 'Docente').length
        );

        const btnNuevo = document.getElementById('btn-nuevo-usuario');
        if (btnNuevo) {
            btnNuevo.textContent = 'Actualizar listado';
            btnNuevo.onclick = async () => {
                UI.clearMessage('usuarios-message');
                await cargarUsuariosDirecto();
            };
        }

        prepararFiltrosUsuarios();
    } catch (error) {
        console.error(error);
        tabla.innerHTML = `<tr><td colspan="6">Error cargando usuarios</td></tr>`;
    }
}

function prepararFiltrosUsuarios() {
    const btnFiltrar = document.getElementById('btn-filtrar-usuarios');
    const inputBuscar = document.getElementById('filtro-usuario-buscar');
    const selectRol = document.getElementById('filtro-usuario-rol');
    const selectEstado = document.getElementById('filtro-usuario-estado');

    const aplicar = () => {
        const usuarios = Array.isArray(window.__usuariosCache) ? window.__usuariosCache : [];
        const texto = String(inputBuscar?.value || '').trim().toLowerCase();
        const rol = String(selectRol?.value || '').trim();
        const estado = String(selectEstado?.value || '').trim();

        const filtrados = usuarios.filter(usuario => {
            const coincideTexto =
                !texto ||
                String(usuario.NombreCompleto || '').toLowerCase().includes(texto) ||
                String(usuario.CorreoInstitucional || '').toLowerCase().includes(texto) ||
                String(usuario.Identificacion || '').toLowerCase().includes(texto);

            const coincideRol = !rol || String(usuario.RolSistema || '') === rol;
            const coincideEstado = !estado || String(usuario.EstadoUsuario || '') === estado;

            return coincideTexto && coincideRol && coincideEstado;
        });

        const tabla = document.getElementById('tabla-usuarios');
        if (!tabla) return;

        tabla.innerHTML = filtrados.length
            ? filtrados.map(u => `
                <tr>
                    <td>${escapeHtml(u.UsuarioID)}</td>
                    <td>${escapeHtml(u.NombreCompleto || 'N/D')}</td>
                    <td>${escapeHtml(u.CorreoInstitucional || 'N/D')}</td>
                    <td>
                        <span class="badge ${getBadgeRol(u.RolSistema)}">
                            ${escapeHtml(u.RolSistema || 'N/D')}
                        </span>
                    </td>
                    <td>
                        <span class="badge ${getBadgeEstado(u.EstadoUsuario)}">
                            ${escapeHtml(u.EstadoUsuario || 'N/D')}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-outline" onclick="verDetalleUsuario(${u.UsuarioID})">
                            Ver
                        </button>
                    </td>
                </tr>
            `).join('')
            : `<tr><td colspan="6">No hay usuarios para mostrar</td></tr>`;

        setText('usuarios-total', filtrados.length);
        setText(
            'usuarios-activos',
            filtrados.filter(u => String(u.EstadoUsuario || '').toLowerCase() === 'activo').length
        );
        setText(
            'usuarios-estudiantes',
            filtrados.filter(u => String(u.RolSistema || '') === 'Estudiante').length
        );
        setText(
            'usuarios-docentes',
            filtrados.filter(u => String(u.RolSistema || '') === 'Docente').length
        );
    };

    if (btnFiltrar && !btnFiltrar.dataset.bound) {
        btnFiltrar.dataset.bound = 'true';
        btnFiltrar.addEventListener('click', aplicar);
    }

    if (inputBuscar && !inputBuscar.dataset.bound) {
        inputBuscar.dataset.bound = 'true';
        inputBuscar.addEventListener('input', aplicar);
    }

    if (selectRol && !selectRol.dataset.bound) {
        selectRol.dataset.bound = 'true';
        selectRol.addEventListener('change', aplicar);
    }

    if (selectEstado && !selectEstado.dataset.bound) {
        selectEstado.dataset.bound = 'true';
        selectEstado.addEventListener('change', aplicar);
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

    tabla.innerHTML = `<tr><td colspan="5">Cargando programas...</td></tr>`;

    try {
        const response = await ApiService.obtenerProgramas();
        const data = Array.isArray(response.data) ? response.data : [];

        tabla.innerHTML = data.length
            ? data.map(p => `
                <tr>
                    <td>${escapeHtml(p.ProgramaAcademicoID)}</td>
                    <td>${escapeHtml(p.CodigoPrograma || 'N/D')}</td>
                    <td>${escapeHtml(p.NombrePrograma || 'N/D')}</td>
                    <td>${escapeHtml(p.TotalEstudiantes ?? 0)}</td>
                    <td>
                        <button class="btn btn-outline" onclick="verDetallePrograma(${p.ProgramaAcademicoID})">
                            Ver
                        </button>
                    </td>
                </tr>
            `).join('')
            : `<tr><td colspan="5">No hay programas registrados</td></tr>`;

        window.__programasCache = data;

        const totalEstudiantes = data.reduce((acc, item) => acc + Number(item.TotalEstudiantes || 0), 0);
        const promedio = data.length ? Math.round(totalEstudiantes / data.length) : 0;

        setText('programas-total', data.length);
        setText('programas-estudiantes', totalEstudiantes);
        setText('programas-promedio', promedio);

        const btnNuevo = document.getElementById('btn-nuevo-programa');
        if (btnNuevo) {
            btnNuevo.textContent = 'Actualizar listado';
            btnNuevo.onclick = async () => {
                UI.clearMessage('programas-message');
                await cargarProgramasDirecto();
            };
        }

        prepararFiltrosProgramas();
    } catch (error) {
        console.error(error);
        tabla.innerHTML = `<tr><td colspan="5">Error cargando programas</td></tr>`;
    }
}

function prepararFiltrosProgramas() {
    const btnFiltrar = document.getElementById('btn-filtrar-programas');
    const inputBuscar = document.getElementById('filtro-programa-buscar');

    const aplicar = () => {
        const programas = Array.isArray(window.__programasCache) ? window.__programasCache : [];
        const texto = String(inputBuscar?.value || '').trim().toLowerCase();

        const filtrados = programas.filter(programa =>
            !texto ||
            String(programa.CodigoPrograma || '').toLowerCase().includes(texto) ||
            String(programa.NombrePrograma || '').toLowerCase().includes(texto)
        );

        const tabla = document.getElementById('tabla-programas');
        if (!tabla) return;

        tabla.innerHTML = filtrados.length
            ? filtrados.map(p => `
                <tr>
                    <td>${escapeHtml(p.ProgramaAcademicoID)}</td>
                    <td>${escapeHtml(p.CodigoPrograma || 'N/D')}</td>
                    <td>${escapeHtml(p.NombrePrograma || 'N/D')}</td>
                    <td>${escapeHtml(p.TotalEstudiantes ?? 0)}</td>
                    <td>
                        <button class="btn btn-outline" onclick="verDetallePrograma(${p.ProgramaAcademicoID})">
                            Ver
                        </button>
                    </td>
                </tr>
            `).join('')
            : `<tr><td colspan="5">No hay programas para mostrar</td></tr>`;

        const totalEstudiantes = filtrados.reduce((acc, item) => acc + Number(item.TotalEstudiantes || 0), 0);
        const promedio = filtrados.length ? Math.round(totalEstudiantes / filtrados.length) : 0;

        setText('programas-total', filtrados.length);
        setText('programas-estudiantes', totalEstudiantes);
        setText('programas-promedio', promedio);
    };

    if (btnFiltrar && !btnFiltrar.dataset.bound) {
        btnFiltrar.dataset.bound = 'true';
        btnFiltrar.addEventListener('click', aplicar);
    }

    if (inputBuscar && !inputBuscar.dataset.bound) {
        inputBuscar.dataset.bound = 'true';
        inputBuscar.addEventListener('input', aplicar);
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

    tabla.innerHTML = `<tr><td colspan="9">Cargando facturas...</td></tr>`;

    try {
        const response = await ApiService.obtenerFacturas();
        const data = Array.isArray(response.data) ? response.data : [];

        renderTablaFacturas(data);
        renderResumenFacturas(data);

        window.__facturasCache = data;

        prepararFiltrosFacturas();
    } catch (error) {
        console.error(error);
        tabla.innerHTML = `<tr><td colspan="9">Error cargando facturas</td></tr>`;
    }
}

function renderTablaFacturas(data) {
    const tabla = document.getElementById('tabla-facturas');
    if (!tabla) return;

    tabla.innerHTML = data.length
        ? data.map(f => `
            <tr>
                <td>${escapeHtml(f.FacturaID)}</td>
                <td>${escapeHtml(f.NumeroFactura || 'N/D')}</td>
                <td>${escapeHtml(f.NombreEstudiante || 'N/D')}</td>
                <td>${escapeHtml(f.NombrePeriodo || 'N/D')}</td>
                <td>${Helpers.formatCurrency(f.Total ?? 0)}</td>
                <td>${Helpers.formatCurrency(f.MontoPagado ?? 0)}</td>
                <td>${Helpers.formatCurrency(f.SaldoPendiente ?? 0)}</td>
                <td>
                    <span class="badge ${getBadgeEstadoFactura(f.EstadoFactura)}">
                        ${escapeHtml(f.EstadoFactura || 'N/D')}
                    </span>
                </td>
                <td>
                    <button class="btn btn-outline" onclick="verDetalleFactura(${f.FacturaID})">
                        Ver
                    </button>
                </td>
            </tr>
        `).join('')
        : `<tr><td colspan="9">No hay facturas para mostrar</td></tr>`;
}

function renderResumenFacturas(data) {
    const totalFacturas = data.length;
    const totalMonto = data.reduce((acc, item) => acc + Number(item.Total || 0), 0);
    const totalSaldo = data.reduce((acc, item) => acc + Number(item.SaldoPendiente || 0), 0);

    setText('facturas-total', totalFacturas);
    setText('facturas-monto-total', Helpers.formatCurrency(totalMonto));
    setText('facturas-saldo-total', Helpers.formatCurrency(totalSaldo));
}

function prepararFiltrosFacturas() {
    const btnFiltrar = document.getElementById('btn-filtrar-facturas');
    const inputBuscar = document.getElementById('filtro-factura-buscar');
    const selectEstado = document.getElementById('filtro-factura-estado');

    const aplicar = () => {
        const facturas = Array.isArray(window.__facturasCache) ? window.__facturasCache : [];
        const texto = String(inputBuscar?.value || '').trim().toLowerCase();
        const estado = String(selectEstado?.value || '').trim();

        const filtradas = facturas.filter(factura => {
            const coincideTexto =
                !texto ||
                String(factura.NumeroFactura || '').toLowerCase().includes(texto) ||
                String(factura.NombreEstudiante || '').toLowerCase().includes(texto) ||
                String(factura.Carnet || '').toLowerCase().includes(texto) ||
                String(factura.NombrePeriodo || '').toLowerCase().includes(texto);

            const coincideEstado =
                !estado || String(factura.EstadoFactura || '') === estado;

            return coincideTexto && coincideEstado;
        });

        renderTablaFacturas(filtradas);
        renderResumenFacturas(filtradas);
    };

    if (btnFiltrar && !btnFiltrar.dataset.bound) {
        btnFiltrar.dataset.bound = 'true';
        btnFiltrar.addEventListener('click', aplicar);
    }

    if (inputBuscar && !inputBuscar.dataset.bound) {
        inputBuscar.dataset.bound = 'true';
        inputBuscar.addEventListener('input', aplicar);
    }

    if (selectEstado && !selectEstado.dataset.bound) {
        selectEstado.dataset.bound = 'true';
        selectEstado.addEventListener('change', aplicar);
    }
}

window.pagarFactura = async function (facturaID) {
    try {
        const facturas = Array.isArray(window.__facturasCache) ? window.__facturasCache : [];
        const factura = facturas.find(f => Number(f.FacturaID) === Number(facturaID));

        if (!factura) {
            alert('No se encontró la factura.');
            return;
        }

        if (!factura.EstudianteID || !factura.PeriodoID) {
            alert('La factura no tiene los datos necesarios para registrar el pago.');
            return;
        }

        const saldoPendiente = Number(factura.SaldoPendiente ?? 0);
        const montoPago = saldoPendiente > 0 ? saldoPendiente : Number(factura.Total ?? 0);

        await ApiService.registrarPago({
            facturaId: Number(factura.FacturaID),
            estudianteId: Number(factura.EstudianteID),
            periodoId: Number(factura.PeriodoID),
            montoPago,
            metodoPago: 'Tarjeta',
            referenciaPago: `WEB-${Date.now()}`
        });

        alert('Pago realizado correctamente');
        await cargarFacturasDirecto();
    } catch (error) {
        alert(error.message || 'Error al pagar');
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

    tabla.innerHTML = `<tr><td colspan="9">Cargando estados de cuenta...</td></tr>`;

    try {
        const response = await ApiService.obtenerEstadosCuenta();
        const data = Array.isArray(response.data) ? response.data : [];

        renderTablaEstadosCuenta(data);
        renderResumenEstadosCuenta(data);

        window.__estadosCuentaCache = data;

        prepararFiltrosEstadosCuenta();
    } catch (error) {
        console.error(error);
        tabla.innerHTML = `<tr><td colspan="9">Error cargando estados de cuenta</td></tr>`;
    }
}

function renderTablaEstadosCuenta(data) {
    const tabla = document.getElementById('tabla-estado-cuenta');
    if (!tabla) return;

    tabla.innerHTML = data.length
        ? data.map(e => `
            <tr>
                <td>${escapeHtml(e.EstadoCuentaID)}</td>
                <td>${escapeHtml(e.NumeroFactura || 'N/D')}</td>
                <td>${escapeHtml(e.NombreEstudiante || 'N/D')}</td>
                <td>${escapeHtml(e.NombrePeriodo || 'N/D')}</td>
                <td>${Helpers.formatCurrency(e.MontoTotal ?? 0)}</td>
                <td>${Helpers.formatCurrency(e.MontoPagado ?? 0)}</td>
                <td>${Helpers.formatCurrency(e.SaldoPendiente ?? 0)}</td>
                <td>
                    <span class="badge ${getBadgeEstadoFactura(e.EstadoCuenta)}">
                        ${escapeHtml(e.EstadoCuenta || 'N/D')}
                    </span>
                </td>
                <td>
                    <button class="btn btn-outline" onclick="verDetalleEstadoCuenta(${e.EstadoCuentaID})">
                        Ver
                    </button>
                </td>
            </tr>
        `).join('')
        : `<tr><td colspan="9">No hay estados de cuenta para mostrar</td></tr>`;
}

function renderResumenEstadosCuenta(data) {
    const totalRegistros = data.length;
    const montoTotal = data.reduce((acc, item) => acc + Number(item.MontoTotal || 0), 0);
    const montoPagado = data.reduce((acc, item) => acc + Number(item.MontoPagado || 0), 0);
    const saldoPendiente = data.reduce((acc, item) => acc + Number(item.SaldoPendiente || 0), 0);

    setText('estado-cuenta-total', totalRegistros);
    setText('estado-cuenta-monto-total', Helpers.formatCurrency(montoTotal));
    setText('estado-cuenta-monto-pagado', Helpers.formatCurrency(montoPagado));
    setText('estado-cuenta-saldo-pendiente', Helpers.formatCurrency(saldoPendiente));
}

function prepararFiltrosEstadosCuenta() {
    const btnFiltrar = document.getElementById('btn-filtrar-estado-cuenta');
    const inputBuscar = document.getElementById('filtro-estado-cuenta-buscar');
    const selectEstado = document.getElementById('filtro-estado-cuenta-estado');

    const aplicar = () => {
        const estadosCuenta = Array.isArray(window.__estadosCuentaCache) ? window.__estadosCuentaCache : [];
        const texto = String(inputBuscar?.value || '').trim().toLowerCase();
        const estado = String(selectEstado?.value || '').trim();

        const filtrados = estadosCuenta.filter(item => {
            const coincideTexto =
                !texto ||
                String(item.NumeroFactura || '').toLowerCase().includes(texto) ||
                String(item.NombreEstudiante || '').toLowerCase().includes(texto) ||
                String(item.Carnet || '').toLowerCase().includes(texto) ||
                String(item.NombrePeriodo || '').toLowerCase().includes(texto);

            const coincideEstado =
                !estado || String(item.EstadoCuenta || '') === estado;

            return coincideTexto && coincideEstado;
        });

        renderTablaEstadosCuenta(filtrados);
        renderResumenEstadosCuenta(filtrados);
    };

    if (btnFiltrar && !btnFiltrar.dataset.bound) {
        btnFiltrar.dataset.bound = 'true';
        btnFiltrar.addEventListener('click', aplicar);
    }

    if (inputBuscar && !inputBuscar.dataset.bound) {
        inputBuscar.dataset.bound = 'true';
        inputBuscar.addEventListener('input', aplicar);
    }

    if (selectEstado && !selectEstado.dataset.bound) {
        selectEstado.dataset.bound = 'true';
        selectEstado.addEventListener('change', aplicar);
    }
}

/* =========================
   HELPERS EXTRA
========================= */
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = value;
    }
}

function formatearFecha(valor) {
    if (!valor) return 'N/D';

    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return String(valor);

    return fecha.toLocaleDateString('es-CR');
}

function construirNombrePeriodo(item) {
    return [
        item?.NombrePeriodo || 'N/D',
        item?.TipoPeriodo || null,
        item?.Anio || null
    ]
        .filter(Boolean)
        .join(' - ');
}

function construirPeriodoTexto(item) {
    return [
        item?.NombrePeriodo || 'N/D',
        item?.TipoPeriodo || null,
        item?.Anio || null
    ]
        .filter(Boolean)
        .join(' - ');
}

function getBadgeEstado(estado) {
    switch (String(estado || '').toLowerCase()) {
        case 'activo':
        case 'activa':
        case 'confirmada':
        case 'pagado':
        case 'pagada':
        case 'aplicado':
        case 'exitoso':
            return 'badge-success';
        case 'pendiente':
            return 'badge-warning';
        case 'inactivo':
        case 'inactiva':
        case 'anulada':
        case 'cancelado':
        case 'cancelada':
        case 'rechazado':
        case 'rechazada':
        case 'vencido':
            return 'badge-danger';
        default:
            return 'badge-gray';
    }
}

function getBadgeEstadoFactura(estado) {
    return getBadgeEstado(estado);
}

function getBadgeEstadoMatricula(estado) {
    return getBadgeEstado(estado);
}

function getBadgeEstadoPago(estado) {
    return getBadgeEstado(estado);
}

function getBadgeRol(rol) {
    switch (String(rol || '').toLowerCase()) {
        case 'estudiante':
            return 'badge-info';
        case 'docente':
            return 'badge-success';
        case 'usuario':
            return 'badge-gray';
        default:
            return 'badge-gray';
    }
}

function normalizarSecciones(data) {
    const mapa = new Map();

    for (const item of data) {
        const id = Number(item.SeccionID);
        if (!id) continue;

        if (!mapa.has(id)) {
            mapa.set(id, {
                SeccionID: id,
                NumeroSeccion: item.NumeroSeccion ?? '',
                CupoMaximo: Number(item.CupoMaximo ?? 0),
                CupoDisponible: Number(item.CupoDisponible ?? 0),
                EstadoSeccion: item.EstadoSeccion ?? '',
                CursoID: item.CursoID ?? null,
                CodigoCurso: item.CodigoCurso ?? '',
                NombreCurso: item.NombreCurso ?? '',
                PeriodoID: item.PeriodoID ?? null,
                NombrePeriodo: item.NombrePeriodo ?? '',
                TipoPeriodo: item.TipoPeriodo ?? '',
                Anio: item.Anio ?? '',
                DocenteID: item.DocenteID ?? null,
                Docente: item.Docente ?? '',
                horarios: [],
                aulas: []
            });
        }

        const seccion = mapa.get(id);

        const horario = construirHorarioDesdeFila(item);
        if (horario && !seccion.horarios.includes(horario)) {
            seccion.horarios.push(horario);
        }

        const aula = construirAulaDesdeFila(item);
        if (aula && !seccion.aulas.includes(aula)) {
            seccion.aulas.push(aula);
        }
    }

    return Array.from(mapa.values()).map(item => ({
        ...item,
        HorarioTexto: item.horarios.length ? item.horarios.join(' | ') : 'N/D',
        AulaTexto: item.aulas.length ? item.aulas.join(' | ') : 'N/D'
    }));
}

function construirHorarioDesdeFila(item) {
    const dia = item.DiaSemana ? String(item.DiaSemana).trim() : '';
    const inicio = item.HoraInicio ? formatearHora(item.HoraInicio) : '';
    const fin = item.HoraFin ? formatearHora(item.HoraFin) : '';

    if (!dia && !inicio && !fin) return '';
    if (dia && inicio && fin) return `${dia} ${inicio} - ${fin}`;

    return [dia, inicio, fin].filter(Boolean).join(' ');
}

function construirAulaDesdeFila(item) {
    const codigo = item.CodigoAula ? String(item.CodigoAula).trim() : '';
    const nombre = item.NombreAula ? String(item.NombreAula).trim() : '';
    const ubicacion = item.Ubicacion ? String(item.Ubicacion).trim() : '';

    return [codigo, nombre, ubicacion].filter(Boolean).join(' - ');
}

function formatearHora(valor) {
    const texto = String(valor || '');
    return texto.length >= 5 ? texto.slice(0, 5) : texto;
}

function escapeHtml(texto) {
    return String(texto ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/* =========================
   MODALES DETALLE
========================= */
window.verDetalleEstudiante = function (id) {
    const estudiantes = Array.isArray(window.__estudiantesCache) ? window.__estudiantesCache : [];
    const est = estudiantes.find(e => Number(e.EstudianteID) === Number(id));
    if (!est) return;

    UI.openModal({
        title: 'Detalle del estudiante',
        body: `
            <p><strong>ID Estudiante:</strong> ${escapeHtml(est.EstudianteID)}</p>
            <p><strong>Carnet:</strong> ${escapeHtml(est.Carnet || 'N/D')}</p>
            <p><strong>Estado académico:</strong> ${escapeHtml(est.EstadoAcademico || 'N/D')}</p>
            <p><strong>Fecha de ingreso:</strong> ${escapeHtml(formatearFecha(est.FechaIngreso))}</p>
            <hr>
            <p><strong>ID Usuario:</strong> ${escapeHtml(est.UsuarioID || 'N/D')}</p>
            <p><strong>Identificación:</strong> ${escapeHtml(est.Identificacion || 'N/D')}</p>
            <p><strong>Nombre completo:</strong> ${escapeHtml(est.NombreCompleto || 'N/D')}</p>
            <p><strong>Correo institucional:</strong> ${escapeHtml(est.CorreoInstitucional || 'N/D')}</p>
            <p><strong>Estado usuario:</strong> ${escapeHtml(est.EstadoUsuario || 'N/D')}</p>
            <hr>
            <p><strong>Programa académico:</strong> ${escapeHtml(est.NombrePrograma || 'N/D')}</p>
            <p><strong>Código programa:</strong> ${escapeHtml(est.CodigoPrograma || 'N/D')}</p>
        `,
        hideFooter: true
    });
};

window.verDetalleCurso = function (id) {
    const cursos = Array.isArray(window.__cursosCache) ? window.__cursosCache : [];
    const cur = cursos.find(c => Number(c.CursoID) === Number(id));
    if (!cur) return;

    UI.openModal({
        title: 'Detalle del curso',
        body: `
            <p><strong>ID:</strong> ${escapeHtml(cur.CursoID)}</p>
            <p><strong>Código:</strong> ${escapeHtml(cur.CodigoCurso || 'N/D')}</p>
            <p><strong>Nombre:</strong> ${escapeHtml(cur.NombreCurso || 'N/D')}</p>
            <p><strong>Créditos:</strong> ${escapeHtml(cur.Creditos ?? 0)}</p>
            <p><strong>Estado:</strong> ${escapeHtml(cur.EstadoCurso || 'N/D')}</p>
            <p><strong>Descripción:</strong> ${escapeHtml(cur.Descripcion || 'N/D')}</p>
        `,
        hideFooter: true
    });
};

window.verDetallePeriodo = function (id) {
    const periodos = Array.isArray(window.__periodosCache) ? window.__periodosCache : [];
    const p = periodos.find(x => Number(x.PeriodoID) === Number(id));
    if (!p) return;

    UI.openModal({
        title: 'Detalle del período',
        body: `
            <p><strong>ID:</strong> ${escapeHtml(p.PeriodoID)}</p>
            <p><strong>Nombre:</strong> ${escapeHtml(p.NombrePeriodo || 'N/D')}</p>
            <p><strong>Tipo:</strong> ${escapeHtml(p.TipoPeriodo || 'N/D')}</p>
            <p><strong>Año:</strong> ${escapeHtml(p.Anio ?? 'N/D')}</p>
            <p><strong>Fecha inicio:</strong> ${escapeHtml(formatearFecha(p.FechaInicio))}</p>
            <p><strong>Fecha fin:</strong> ${escapeHtml(formatearFecha(p.FechaFin))}</p>
            <p><strong>Inicio matrícula:</strong> ${escapeHtml(formatearFecha(p.FechaInicioMatricula))}</p>
            <p><strong>Fin matrícula:</strong> ${escapeHtml(formatearFecha(p.FechaFinMatricula))}</p>
            <p><strong>Estado:</strong> ${escapeHtml(p.EstadoPeriodo || 'N/D')}</p>
        `,
        hideFooter: true
    });
};

window.verDetalleSeccion = function (id) {
    const secciones = Array.isArray(window.__seccionesCache) ? window.__seccionesCache : [];
    const s = secciones.find(x => Number(x.SeccionID) === Number(id));
    if (!s) return;

    UI.openModal({
        title: 'Detalle de la sección',
        body: `
            <p><strong>ID:</strong> ${escapeHtml(s.SeccionID)}</p>
            <p><strong>Curso:</strong> ${escapeHtml(s.NombreCurso || 'N/D')}</p>
            <p><strong>Código curso:</strong> ${escapeHtml(s.CodigoCurso || 'N/D')}</p>
            <p><strong>Período:</strong> ${escapeHtml(construirPeriodoTexto(s))}</p>
            <p><strong>Docente:</strong> ${escapeHtml(s.Docente || 'N/D')}</p>
            <p><strong>Cupo máximo:</strong> ${escapeHtml(s.CupoMaximo ?? 0)}</p>
            <p><strong>Cupo disponible:</strong> ${escapeHtml(s.CupoDisponible ?? 0)}</p>
            <p><strong>Estado:</strong> ${escapeHtml(s.EstadoSeccion || 'N/D')}</p>
            <p><strong>Horario:</strong> ${escapeHtml(s.HorarioTexto || 'N/D')}</p>
            <p><strong>Aula:</strong> ${escapeHtml(s.AulaTexto || 'N/D')}</p>
        `,
        hideFooter: true
    });
};

window.verDetalleUsuario = function (id) {
    const usuarios = Array.isArray(window.__usuariosCache) ? window.__usuariosCache : [];
    const u = usuarios.find(x => Number(x.UsuarioID) === Number(id));
    if (!u) return;

    UI.openModal({
        title: 'Detalle del usuario',
        body: `
            <p><strong>ID:</strong> ${escapeHtml(u.UsuarioID)}</p>
            <p><strong>Nombre completo:</strong> ${escapeHtml(u.NombreCompleto || 'N/D')}</p>
            <p><strong>Correo institucional:</strong> ${escapeHtml(u.CorreoInstitucional || 'N/D')}</p>
            <p><strong>Identificación:</strong> ${escapeHtml(u.Identificacion || 'N/D')}</p>
            <p><strong>Rol:</strong> ${escapeHtml(u.RolSistema || 'N/D')}</p>
            <p><strong>Estado:</strong> ${escapeHtml(u.EstadoUsuario || 'N/D')}</p>
        `,
        hideFooter: true
    });
};

window.verDetallePrograma = function (id) {
    const programas = Array.isArray(window.__programasCache) ? window.__programasCache : [];
    const p = programas.find(x => Number(x.ProgramaAcademicoID) === Number(id));
    if (!p) return;

    UI.openModal({
        title: 'Detalle del programa',
        body: `
            <p><strong>ID:</strong> ${escapeHtml(p.ProgramaAcademicoID)}</p>
            <p><strong>Código:</strong> ${escapeHtml(p.CodigoPrograma || 'N/D')}</p>
            <p><strong>Nombre:</strong> ${escapeHtml(p.NombrePrograma || 'N/D')}</p>
            <p><strong>Total estudiantes:</strong> ${escapeHtml(p.TotalEstudiantes ?? 0)}</p>
        `,
        hideFooter: true
    });
};

window.verDetalleFactura = function (id) {
    const facturas = Array.isArray(window.__facturasCache) ? window.__facturasCache : [];
    const f = facturas.find(x => Number(x.FacturaID) === Number(id));
    if (!f) return;

    UI.openModal({
        title: 'Detalle de la factura',
        body: `
            <p><strong>ID:</strong> ${escapeHtml(f.FacturaID)}</p>
            <p><strong>Número:</strong> ${escapeHtml(f.NumeroFactura || 'N/D')}</p>
            <p><strong>Estudiante:</strong> ${escapeHtml(f.NombreEstudiante || 'N/D')}</p>
            <p><strong>Período:</strong> ${escapeHtml(f.NombrePeriodo || 'N/D')}</p>
            <p><strong>Total:</strong> ${Helpers.formatCurrency(f.Total ?? 0)}</p>
            <p><strong>Pagado:</strong> ${Helpers.formatCurrency(f.MontoPagado ?? 0)}</p>
            <p><strong>Saldo pendiente:</strong> ${Helpers.formatCurrency(f.SaldoPendiente ?? 0)}</p>
            <p><strong>Estado:</strong> ${escapeHtml(f.EstadoFactura || 'N/D')}</p>
        `,
        hideFooter: true
    });
};

window.verDetalleEstadoCuenta = function (id) {
    const estados = Array.isArray(window.__estadosCuentaCache) ? window.__estadosCuentaCache : [];
    const e = estados.find(x => Number(x.EstadoCuentaID) === Number(id));
    if (!e) return;

    UI.openModal({
        title: 'Detalle de estado de cuenta',
        body: `
            <p><strong>ID:</strong> ${escapeHtml(e.EstadoCuentaID)}</p>
            <p><strong>Factura:</strong> ${escapeHtml(e.NumeroFactura || 'N/D')}</p>
            <p><strong>Estudiante:</strong> ${escapeHtml(e.NombreEstudiante || 'N/D')}</p>
            <p><strong>Período:</strong> ${escapeHtml(e.NombrePeriodo || 'N/D')}</p>
            <p><strong>Monto total:</strong> ${Helpers.formatCurrency(e.MontoTotal ?? 0)}</p>
            <p><strong>Monto pagado:</strong> ${Helpers.formatCurrency(e.MontoPagado ?? 0)}</p>
            <p><strong>Saldo pendiente:</strong> ${Helpers.formatCurrency(e.SaldoPendiente ?? 0)}</p>
            <p><strong>Estado:</strong> ${escapeHtml(e.EstadoCuenta || 'N/D')}</p>
        `,
        hideFooter: true
    });
};

