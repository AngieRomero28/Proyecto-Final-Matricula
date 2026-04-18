document.addEventListener('DOMContentLoaded', async () => {
    try {
        await inicializarAplicacion();
    } catch (error) {
        console.error('Error al iniciar la aplicación:', error);
        window.UI.hideLoader?.();
        window.UI.hidePageLoader?.();

        const systemVisible = !document.getElementById('system-shell')?.classList.contains('hidden');

        if (systemVisible) {
            window.UI.showMessage(
                'global-message',
                'danger',
                error.message || 'No se pudo iniciar la aplicación.'
            );
        } else {
            window.UI.showMessage(
                'login-message',
                'danger',
                error.message || 'No se pudo iniciar la aplicación.'
            );
        }
    }
});

async function inicializarAplicacion() {
    window.UI.showLoader?.();

    await cargarComponentesBase();
    configurarEventosLogin();
    configurarEventosGlobales();

    const session = window.Auth.getSession();

    if (session && window.Auth.isAuthenticated()) {
        try {
            await verificarBackend();
            await iniciarSesionUI(session, { restaurada: true });
        } catch (error) {
            console.error('La sesión guardada no pudo restaurarse:', error);
            window.StorageManager.clearSession();

            if (window.SessionUser?.clear) {
                window.SessionUser.clear();
            }

            mostrarLogin();
            window.UI.showMessage(
                'login-message',
                'warning',
                'La sesión anterior no pudo restaurarse. Inicie sesión nuevamente.'
            );
        }
    } else {
        mostrarLogin();
    }

    window.UI.hideLoader?.();
}

async function cargarComponentesBase() {
    const componentes = [
        ['footer-container', './assets/components/footer.html'],
        ['loader-container', './assets/components/loaders.html'],
        ['modal-container', './assets/components/modals.html'],
        ['topbar-container', './assets/components/topbar-base.html']
    ];

    for (const [containerId, path] of componentes) {
        try {
            await window.UI.loadComponent(containerId, path);
        } catch (error) {
            console.warn(`No se pudo cargar ${path}, se continúa con la inicialización.`, error);
        }
    }
}

function configurarEventosLogin() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm || loginForm.dataset.bound === 'true') return;

    loginForm.dataset.bound = 'true';

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const username = document.getElementById('login-user')?.value.trim() || '';
        const password = document.getElementById('login-pass')?.value.trim() || '';

        if (!username || !password) {
            window.UI.showMessage('login-message', 'danger', 'Debe completar usuario y contraseña.');
            return;
        }

        window.UI.clearMessage('login-message');
        window.UI.showLoader?.();

        try {
            await verificarBackend();

            const session = await window.Auth.login({
                username,
                password
            });

            await iniciarSesionUI(session, { restaurada: false });
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            window.UI.showMessage(
                'login-message',
                'danger',
                error.message || 'No se pudo iniciar sesión.'
            );
        } finally {
            window.UI.hideLoader?.();
        }
    });
}

function configurarEventosGlobales() {
    document.addEventListener('click', async (event) => {
        const logoutButton = event.target.closest('[data-action="logout"]');
        if (!logoutButton) return;

        window.Auth.logout();
    });

    document.addEventListener('click', async (event) => {
        const dashboardButton = event.target.closest('[data-action="dashboard"]');
        if (!dashboardButton) return;

        window.UI.showPageLoader?.();
        window.UI.clearMessage('global-message');

        try {
            await abrirVistaInicial();
            marcarNavActiva(null);
        } catch (error) {
            console.error('Error cargando vista inicial:', error);
            window.UI.showMessage(
                'global-message',
                'danger',
                error.message || 'No se pudo cargar la vista inicial.'
            );
        } finally {
            window.UI.hidePageLoader?.();
        }
    });

    document.addEventListener('click', async (event) => {
        const pageButton = event.target.closest('[data-page]');
        if (!pageButton) return;

        const page = pageButton.getAttribute('data-page');
        const title = pageButton.getAttribute('data-title') || 'Módulo';
        const subtitle = pageButton.getAttribute('data-subtitle') || '';

        window.UI.showPageLoader?.();
        window.UI.clearMessage('global-message');

        try {
            if (
                window.AccessControl &&
                typeof window.AccessControl.canAccessPage === 'function'
            ) {
                const permitido = window.AccessControl.canAccessPage(window.Auth.getSession(), page);
                if (!permitido) {
                    throw new Error('No tiene permisos para acceder a esta sección.');
                }
            }

            await abrirModulo(page, title, subtitle);
            marcarNavActiva(page);
        } catch (error) {
            console.error('Error cargando módulo:', error);
            window.UI.showMessage(
                'global-message',
                'danger',
                error.message || 'No se pudo cargar la página solicitada.'
            );
        } finally {
            window.UI.hidePageLoader?.();
        }
    });

    document.addEventListener('click', async (event) => {
        if (event.target.id === 'global-modal-close-btn') {
            window.UI.closeModal?.();
            return;
        }

        if (event.target.id === 'global-modal-cancel-btn') {
            window.UI.closeModal?.();
            return;
        }

        if (event.target.id === 'global-modal-overlay') {
            window.UI.closeModal?.();
            return;
        }

        if (event.target.id === 'global-modal-confirm-btn') {
            await window.UI.confirmModal?.();
        }
    });
}

async function iniciarSesionUI(session, { restaurada = false } = {}) {
    mostrarSistema();

    await cargarSidebarPorRol(session);
    actualizarIdentidadUI(session);

    if (window.SessionUser?.set) {
        window.SessionUser.set(session);
    }

    if (!restaurada && session?.debeCambiarPassword && session?.role === 'estudiante') {
        window.UI.showMessage(
            'global-message',
            'warning',
            'Debe cambiar su contraseña temporal antes de continuar.'
        );
    } else {
        window.UI.clearMessage('global-message');
    }

    await abrirVistaInicial();
}

async function cargarSidebarPorRol(session) {
    const role = session?.role || 'usuario';

    if (
        window.SidebarBuilder &&
        typeof window.SidebarBuilder.render === 'function'
    ) {
        await window.SidebarBuilder.render(role);
        return;
    }

    const fallbackPath = './assets/components/sidebar.html';
    await window.UI.loadComponent('sidebar-container', fallbackPath);
}

async function verificarBackend() {
    const resultado = await window.ApiService.testBackend();
    console.log('Backend verificado correctamente:', resultado);
    return resultado;
}

function mostrarLogin() {
    document.getElementById('login-screen')?.classList.remove('hidden');
    document.getElementById('system-shell')?.classList.add('hidden');
}

function mostrarSistema() {
    document.getElementById('login-screen')?.classList.add('hidden');
    document.getElementById('system-shell')?.classList.remove('hidden');
}

function actualizarIdentidadUI(session) {
    const sidebarUserName = document.getElementById('sidebar-user-name');
    const sidebarUserRole = document.getElementById('sidebar-user-role');
    const sidebarUserAvatar = document.getElementById('sidebar-user-avatar');
    const topbarUserName = document.getElementById('topbar-user-name');

    const nombreMostrar = session?.fullName || session?.username || 'Usuario';
    const rolMostrar = session?.roleLabel || 'Usuario';
    const iniciales = session?.initials || window.Helpers.getInitials(nombreMostrar);

    if (sidebarUserName) sidebarUserName.textContent = nombreMostrar;
    if (sidebarUserRole) sidebarUserRole.textContent = rolMostrar;
    if (sidebarUserAvatar) sidebarUserAvatar.textContent = iniciales;
    if (topbarUserName) topbarUserName.textContent = nombreMostrar;
}

async function abrirVistaInicial() {
    const session = window.Auth.getSession();
    const role = session?.role || 'usuario';

    const routeCandidates = obtenerRutasInicio(role);

    for (const route of routeCandidates) {
        try {
            await abrirModulo(route.path, route.title, route.subtitle);
            marcarNavActiva(route.markAsDashboard ? null : route.path);
            return;
        } catch (error) {
            console.warn(`No se pudo cargar ruta inicial ${route.path}:`, error.message);
        }
    }

    await renderInicioFallback(role, session);
    marcarNavActiva(null);
}

function obtenerRutasInicio(role) {
    const map = {
        admin: [
            {
                path: './pages/admin/inicio.html',
                title: 'Panel de Administración',
                subtitle: 'Gestión general del sistema'
            },
            {
                path: './pages/admin/dashboard.html',
                title: 'Dashboard',
                subtitle: 'Resumen general del sistema',
                markAsDashboard: true
            }
        ],
        registro: [
            {
                path: './pages/registro/inicio.html',
                title: 'Panel de Registro Académico',
                subtitle: 'Gestión académica y matrícula'
            }
        ],
        tesoreria: [
            {
                path: './pages/tesoreria/inicio.html',
                title: 'Panel de Tesorería',
                subtitle: 'Facturación, pagos y estados financieros'
            }
        ],
        auditor: [
            {
                path: './pages/auditor/inicio.html',
                title: 'Portal del Auditor',
                subtitle: 'Bitácoras, trazabilidad y reportes'
            }
        ],
        estudiante: [
            {
                path: './pages/estudiante/inicio.html',
                title: 'Portal del Estudiante',
                subtitle: 'Consulta de matrícula, cursos y pagos'
            }
        ],
        docente: [
            {
                path: './pages/docente/inicio.html',
                title: 'Portal del Docente',
                subtitle: 'Cursos, horarios y estudiantes matriculados'
            }
        ]
    };

    return map[role] || [];
}

async function renderInicioFallback(role, session) {
    const dynamicContainer = prepararContenedorModulo(
        obtenerTituloInicio(role),
        obtenerSubtituloInicio(role)
    );

    const nombre = escapeHtml(session?.fullName || session?.username || 'Usuario');
    const rolLabel = escapeHtml(session?.roleLabel || 'Usuario');

    dynamicContainer.innerHTML = `
        <div class="card">
            <div class="card-header">
                <div>
                    <h3>Bienvenido</h3>
                    <p>Sesión iniciada correctamente</p>
                </div>
            </div>
            <div class="card-body">
                <p><strong>Usuario:</strong> ${nombre}</p>
                <p><strong>Rol:</strong> ${rolLabel}</p>
                <p class="mt-2">
                    La vista inicial de este rol aún no está disponible o no pudo cargarse.
                </p>
            </div>
        </div>
    `;
}

function obtenerTituloInicio(role) {
    const map = {
        admin: 'Panel de Administración',
        registro: 'Panel de Registro Académico',
        tesoreria: 'Panel de Tesorería',
        estudiante: 'Portal del Estudiante',
        docente: 'Portal del Docente',
        auditor: 'Portal del Auditor'
    };

    return map[role] || 'Inicio';
}

function obtenerSubtituloInicio(role) {
    const map = {
        admin: 'Gestión general del sistema',
        registro: 'Gestión académica y matrícula',
        tesoreria: 'Facturación, pagos y estados financieros',
        estudiante: 'Consulta de matrícula, cursos y pagos',
        docente: 'Cursos, horarios y estudiantes matriculados',
        auditor: 'Bitácoras, trazabilidad y reportes'
    };

    return map[role] || 'Panel principal';
}

async function abrirModulo(page, title, subtitle) {
    if (!page) {
        throw new Error('No se indicó la página a cargar.');
    }

    if (window.Router && typeof window.Router.loadPage === 'function') {
        await window.Router.loadPage(page, title, subtitle);
        return;
    }

    await cargarHtmlEnContenedor(page, title, subtitle);
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

    if (window.UI?.setPageHeader) {
        window.UI.setPageHeader(titulo, subtitulo);
    }

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
   HELPERS GLOBALES
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
        case 'parcial':
            return 'badge-warning';

        case 'inactivo':
        case 'inactiva':
        case 'anulada':
        case 'cancelado':
        case 'cancelada':
        case 'rechazado':
        case 'rechazada':
        case 'vencido':
        case 'bloqueado':
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
        case 'tesorería':
        case 'tesoreria':
            return 'badge-warning';
        case 'administrador ti':
        case 'admin':
            return 'badge-danger';
        case 'registro académico':
        case 'registro academico':
        case 'registro':
            return 'badge-info';
        case 'auditor institucional':
        case 'auditor':
            return 'badge-outline';
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
                Docente: item.Docente || item.NombreDocente || '',
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

    return Array.from(mapa.values()).map((item) => ({
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
   EXPONER HELPERS A MÓDULOS
========================= */
window.setText = setText;
window.formatearFecha = formatearFecha;
window.construirNombrePeriodo = construirNombrePeriodo;
window.construirPeriodoTexto = construirPeriodoTexto;
window.getBadgeEstado = getBadgeEstado;
window.getBadgeEstadoFactura = getBadgeEstadoFactura;
window.getBadgeEstadoMatricula = getBadgeEstadoMatricula;
window.getBadgeEstadoPago = getBadgeEstadoPago;
window.getBadgeRol = getBadgeRol;
window.normalizarSecciones = normalizarSecciones;
window.formatearHora = formatearHora;
window.escapeHtml = escapeHtml;