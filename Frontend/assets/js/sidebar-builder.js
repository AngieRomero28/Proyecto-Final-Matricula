window.SidebarBuilder = {
    async render(role) {
        const container = document.getElementById('sidebar-container');
        if (!container) return;

        container.innerHTML = this.build(role);
    },

    build(role) {
        const roleLabel =
            window.Auth && typeof window.Auth.getDisplayName === 'function'
                ? window.Auth.getDisplayName(role)
                : 'Usuario';

        const menus = {
            admin: [
                this.section('General', [
                    this.dashboardButton('Dashboard'),
                    this.pageButton(
                        './pages/admin/inicio.html',
                        '📋',
                        'Inicio',
                        'Panel Administrativo',
                        'Vista general del administrador'
                    )
                ]),
                this.section('Gestión Académica', [
                    this.pageButton(
                        './pages/admin/usuarios.html',
                        '👥',
                        'Usuarios',
                        'Usuarios',
                        'Gestión de usuarios y roles'
                    ),
                    this.pageButton(
                        './pages/admin/programas.html',
                        '🎓',
                        'Programas',
                        'Programas',
                        'Programas académicos'
                    ),
                    this.pageButton(
                        './pages/admin/cursos.html',
                        '📚',
                        'Cursos',
                        'Cursos',
                        'Catálogo general de cursos'
                    ),
                    this.pageButton(
                        './pages/admin/periodos.html',
                        '🗓️',
                        'Períodos',
                        'Períodos',
                        'Administración de períodos académicos'
                    ),
                    this.pageButton(
                        './pages/admin/secciones.html',
                        '🏫',
                        'Secciones',
                        'Secciones',
                        'Gestión de secciones, horarios y cupos'
                    ),
                    this.pageButton(
                        './pages/admin/matriculas.html',
                        '📝',
                        'Matrículas',
                        'Matrículas',
                        'Control general de matrículas'
                    )
                ]),
                this.section('Finanzas y Control', [
                    this.pageButton(
                        './pages/admin/pagos.html',
                        '💰',
                        'Pagos',
                        'Pagos',
                        'Pagos registrados del sistema'
                    ),
                    this.pageButton(
                        './pages/admin/facturas.html',
                        '🧾',
                        'Facturas',
                        'Facturas',
                        'Gestión de facturación'
                    ),
                    this.pageButton(
                        './pages/admin/reportes.html',
                        '📈',
                        'Reportes',
                        'Reportes',
                        'Reportes académicos y financieros'
                    ),
                    this.pageButton(
                        './pages/admin/auditoria.html',
                        '🛡️',
                        'Auditoría',
                        'Auditoría',
                        'Bitácora del sistema'
                    )
                ])
            ],

            registro: [
                this.section('General', [
                    this.dashboardButton('Dashboard'),
                    this.pageButton(
                        './pages/registro/inicio.html',
                        '📋',
                        'Inicio',
                        'Registro Académico',
                        'Vista general del área de registro'
                    )
                ]),
                this.section('Gestión Académica', [
                    this.pageButton(
                        './pages/registro/estudiantes.html',
                        '🎓',
                        'Estudiantes',
                        'Estudiantes',
                        'Gestión de estudiantes'
                    ),
                    this.pageButton(
                        './pages/registro/cursos.html',
                        '📚',
                        'Cursos',
                        'Cursos',
                        'Catálogo de cursos'
                    ),
                    this.pageButton(
                        './pages/registro/periodos.html',
                        '🗓️',
                        'Períodos',
                        'Períodos',
                        'Períodos académicos'
                    ),
                    this.pageButton(
                        './pages/registro/secciones.html',
                        '🏫',
                        'Secciones',
                        'Secciones',
                        'Oferta académica'
                    ),
                    this.pageButton(
                        './pages/registro/matriculas.html',
                        '📝',
                        'Matrículas',
                        'Matrículas',
                        'Proceso de matrícula'
                    ),
                    this.pageButton(
                        './pages/registro/comprobantes.html',
                        '📄',
                        'Comprobantes',
                        'Comprobantes',
                        'Comprobantes de matrícula'
                    )
                ])
            ],

            tesoreria: [
                this.section('General', [
                    this.dashboardButton('Dashboard'),
                    this.pageButton(
                        './pages/tesoreria/inicio.html',
                        '📋',
                        'Inicio',
                        'Tesorería',
                        'Resumen financiero institucional'
                    )
                ]),
                this.section('Financiero', [
                    this.pageButton(
                        './pages/tesoreria/pagos.html',
                        '💰',
                        'Pagos',
                        'Pagos',
                        'Gestión de pagos'
                    ),
                    this.pageButton(
                        './pages/tesoreria/facturas.html',
                        '🧾',
                        'Facturas',
                        'Facturas',
                        'Gestión de facturas'
                    ),
                    this.pageButton(
                        './pages/tesoreria/estado-cuenta.html',
                        '📊',
                        'Estado de Cuenta',
                        'Estado de Cuenta',
                        'Estados financieros'
                    ),
                    this.pageButton(
                        './pages/tesoreria/morosidad.html',
                        '⚠️',
                        'Morosidad',
                        'Morosidad',
                        'Saldos pendientes y bloqueos financieros'
                    ),
                    this.pageButton(
                        './pages/tesoreria/reporte-financiero.html',
                        '📈',
                        'Reporte Financiero',
                        'Reporte Financiero',
                        'Resumen financiero institucional'
                    )
                ])
            ],

            auditor: [
                this.section('General', [
                    this.dashboardButton('Dashboard'),
                    this.pageButton(
                        './pages/auditor/inicio.html',
                        '📋',
                        'Inicio',
                        'Portal del Auditor',
                        'Vista general del auditor institucional'
                    )
                ]),
                this.section('Auditoría', [
                    this.pageButton(
                        './pages/auditor/auditoria.html',
                        '🛡️',
                        'Auditoría',
                        'Auditoría',
                        'Bitácora del sistema'
                    ),
                    this.pageButton(
                        './pages/auditor/reportes.html',
                        '📈',
                        'Reportes',
                        'Reportes',
                        'Reportes institucionales'
                    ),
                    this.pageButton(
                        './pages/auditor/comprobantes.html',
                        '📄',
                        'Comprobantes',
                        'Comprobantes',
                        'Comprobantes emitidos'
                    ),
                    this.pageButton(
                        './pages/auditor/trazabilidad.html',
                        '🔎',
                        'Trazabilidad',
                        'Trazabilidad',
                        'Seguimiento de operaciones'
                    )
                ])
            ],

            estudiante: [
                this.section('General', [
                    this.pageButton(
                        './pages/estudiante/inicio.html',
                        '🏠',
                        'Inicio',
                        'Portal del Estudiante',
                        'Resumen académico y financiero'
                    )
                ]),
                this.section('Mi Portal', [
                    this.pageButton(
                        './pages/estudiante/oferta.html',
                        '📚',
                        'Oferta disponible',
                        'Oferta disponible',
                        'Cursos que puede matricular'
                    ),
                    this.pageButton(
                        './pages/estudiante/mi-matricula.html',
                        '📝',
                        'Mi matrícula',
                        'Mi matrícula',
                        'Cursos del período actual'
                    ),
                    this.pageButton(
                        './pages/estudiante/mis-cursos.html',
                        '📖',
                        'Mis cursos',
                        'Mis cursos',
                        'Resumen de cursos actuales'
                    ),
                    this.pageButton(
                        './pages/estudiante/mis-horarios.html',
                        '🗓️',
                        'Mis horarios',
                        'Mis horarios',
                        'Horarios de cursos activos'
                    ),
                    this.pageButton(
                        './pages/estudiante/historial-academico.html',
                        '🎓',
                        'Historial académico',
                        'Historial académico',
                        'Cursos llevados y aprobados'
                    ),
                    this.pageButton(
                        './pages/estudiante/mis-pagos.html',
                        '💰',
                        'Mis pagos',
                        'Mis pagos',
                        'Pagos realizados'
                    ),
                    this.pageButton(
                        './pages/estudiante/mis-facturas.html',
                        '🧾',
                        'Mis facturas',
                        'Mis facturas',
                        'Facturación histórica'
                    ),
                    this.pageButton(
                        './pages/estudiante/cambiar-password.html',
                        '🔐',
                        'Cambiar contraseña',
                        'Cambiar contraseña',
                        'Actualizar contraseña personal'
                    )
                ])
            ],

            docente: [
                this.section('General', [
                    this.pageButton(
                        './pages/docente/inicio.html',
                        '🏠',
                        'Inicio',
                        'Portal del Docente',
                        'Resumen general de sus cursos'
                    )
                ]),
                this.section('Docencia', [
                    this.pageButton(
                        './pages/docente/mis-cursos.html',
                        '📚',
                        'Mis cursos',
                        'Mis cursos',
                        'Cursos asignados'
                    ),
                    this.pageButton(
                        './pages/docente/mis-secciones.html',
                        '🏫',
                        'Mis secciones',
                        'Mis secciones',
                        'Secciones asignadas'
                    ),
                    this.pageButton(
                        './pages/docente/estudiantes-curso.html',
                        '👨‍🎓',
                        'Estudiantes matriculados',
                        'Estudiantes matriculados',
                        'Listado por curso'
                    ),
                    this.pageButton(
                        './pages/docente/mis-horarios.html',
                        '🗓️',
                        'Mis horarios',
                        'Mis horarios',
                        'Horarios de impartición'
                    )
                ])
            ]
        };

        const sections = menus[role] || [
            this.section('General', [
                this.dashboardButton('Inicio')
            ])
        ];

        return `
            <div class="sidebar">
                <div class="sidebar-brand">
                    <h2>🎓 Sistema de Matrícula</h2>
                    <span>Universidad</span>
                </div>

                <div class="sidebar-user">
                    <div class="user-avatar" id="sidebar-user-avatar">U</div>
                    <div class="user-info">
                        <strong id="sidebar-user-name">Usuario</strong>
                        <span id="sidebar-user-role">${roleLabel}</span>
                    </div>
                </div>

                ${sections.join('')}

                <div class="sidebar-footer">
                    <button class="nav-item" data-action="logout">
                        <span>↩️</span>
                        <span>Cerrar sesión</span>
                    </button>
                </div>
            </div>
        `;
    },

    section(label, items) {
        return `
            <div class="nav-section">
                <div class="nav-section-label">${label}</div>
                ${items.join('')}
            </div>
        `;
    },

    dashboardButton(text) {
        return `
            <button class="nav-item active" data-action="dashboard">
                <span>🏠</span>
                <span>${text}</span>
            </button>
        `;
    },

    pageButton(page, icon, text, title, subtitle) {
        return `
            <button
                class="nav-item"
                data-page="${page}"
                data-title="${title}"
                data-subtitle="${subtitle}"
            >
                <span>${icon}</span>
                <span>${text}</span>
            </button>
        `;
    }
};