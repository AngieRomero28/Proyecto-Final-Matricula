window.Modules = window.Modules || {};

window.Modules.docenteInicio = (function () {
    async function init() {
        await cargarInicioDocente();
    }

    async function cargarInicioDocente() {
        const session = window.Auth.getSession();
        const tabla = document.getElementById('tabla-docente-resumen');

        if (!session?.userId) {
            window.UI.showMessage('docente-inicio-message', 'danger', 'Sesión no válida.');
            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="4">Sesión no válida.</td></tr>';
            }
            return;
        }

        try {
            const response = await window.ApiService.obtenerSecciones();
            const data = Array.isArray(response.data) ? response.data : [];

            const misSecciones = obtenerSeccionesDocente(data, session);

            const cursos = new Set(misSecciones.map((s) => s.CursoID)).size;
            const totalSecciones = misSecciones.length;
            const totalEstudiantes = misSecciones.reduce(
                (acc, s) => acc + Number((s.CupoMaximo || 0) - (s.CupoDisponible || 0)),
                0
            );
            const totalHorarios = misSecciones.reduce(
                (acc, s) => acc + (Array.isArray(s.horarios) ? s.horarios.length : 0),
                0
            );

            setText('docente-total-cursos', cursos);
            setText('docente-total-secciones', totalSecciones);
            setText('docente-total-estudiantes', totalEstudiantes);
            setText('docente-total-horarios', totalHorarios);

            renderTabla(misSecciones);
        } catch (error) {
            console.error('Error cargando inicio docente:', error);
            window.UI.showMessage(
                'docente-inicio-message',
                'danger',
                error.message || 'Error cargando datos.'
            );

            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="4">Error cargando datos.</td></tr>';
            }
        }
    }

    function obtenerSeccionesDocente(data, session) {
        const normalizadas = window.normalizarSecciones
            ? window.normalizarSecciones(data)
            : data;

        const docenteIdSesion = Number(
            session.docenteId ??
            session.userId ??
            0
        );

        return normalizadas.filter((s) => {
            const docenteIdFila = Number(
                s.DocenteID ??
                s.docenteId ??
                s.UsuarioDocenteID ??
                0
            );

            return docenteIdSesion > 0 && docenteIdFila === docenteIdSesion;
        });
    }

    function renderTabla(data) {
        const tabla = document.getElementById('tabla-docente-resumen');
        if (!tabla) return;

        if (!data.length) {
            tabla.innerHTML = '<tr><td colspan="4">No hay datos disponibles.</td></tr>';
            return;
        }

        tabla.innerHTML = data.map((item) => `
            <tr>
                <td>${escapeHtml(item.NombreCurso || '')}</td>
                <td>${escapeHtml(item.NumeroSeccion || '')}</td>
                <td>${escapeHtml(construirNombrePeriodo(item))}</td>
                <td>${escapeHtml(
                    String(Number(item.CupoMaximo || 0) - Number(item.CupoDisponible || 0))
                )}</td>
            </tr>
        `).join('');
    }

    return { init };
})();