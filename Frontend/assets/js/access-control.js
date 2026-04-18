window.AccessControl = {
    permissions: {
        admin: [
            './pages/admin/inicio.html',
            './pages/admin/dashboard.html',
            './pages/admin/usuarios.html',
            './pages/admin/programas.html',
            './pages/admin/cursos.html',
            './pages/admin/periodos.html',
            './pages/admin/secciones.html',
            './pages/admin/matriculas.html',
            './pages/admin/pagos.html',
            './pages/admin/facturas.html',
            './pages/admin/reportes.html',
            './pages/admin/auditoria.html'
        ],

        registro: [
            './pages/registro/inicio.html',
            './pages/registro/estudiantes.html',
            './pages/registro/cursos.html',
            './pages/registro/periodos.html',
            './pages/registro/secciones.html',
            './pages/registro/matriculas.html',
            './pages/registro/comprobantes.html'
        ],

        tesoreria: [
            './pages/tesoreria/inicio.html',
            './pages/tesoreria/pagos.html',
            './pages/tesoreria/facturas.html',
            './pages/tesoreria/estado-cuenta.html',
            './pages/tesoreria/morosidad.html',
            './pages/tesoreria/reporte-financiero.html'
        ],

        auditor: [
            './pages/auditor/inicio.html',
            './pages/auditor/auditoria.html',
            './pages/auditor/reportes.html',
            './pages/auditor/comprobantes.html',
            './pages/auditor/trazabilidad.html'
        ],

        estudiante: [
            './pages/estudiante/inicio.html',
            './pages/estudiante/oferta.html',
            './pages/estudiante/mi-matricula.html',
            './pages/estudiante/mis-cursos.html',
            './pages/estudiante/historial-academico.html',
            './pages/estudiante/mis-pagos.html',
            './pages/estudiante/mis-facturas.html',
            './pages/estudiante/cambiar-password.html',
            './pages/estudiante/mis-horarios.html'
        ],

        docente: [
            './pages/docente/inicio.html',
            './pages/docente/mis-cursos.html',
            './pages/docente/mis-secciones.html',
            './pages/docente/estudiantes-curso.html',
            './pages/docente/mis-horarios.html'
        ]
    },

    canAccessPage(session, page) {
        if (!session || !page) return false;

        const role = session.role || 'usuario';
        const allowed = this.permissions[role] || [];

        return allowed.includes(page);
    },

    getDefaultHome(role) {
        const homeMap = {
            admin: './pages/admin/inicio.html',
            registro: './pages/registro/inicio.html',
            tesoreria: './pages/tesoreria/inicio.html',
            auditor: './pages/auditor/inicio.html',
            estudiante: './pages/estudiante/inicio.html',
            docente: './pages/docente/inicio.html'
        };

        return homeMap[role] ?? null;
    }
};