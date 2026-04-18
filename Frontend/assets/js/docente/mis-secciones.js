window.Modules = window.Modules || {};

window.Modules.docenteMisSecciones = (function () {
    async function init() {
        await cargarSecciones();
    }

    async function cargarSecciones() {
        const session = window.Auth.getSession();
        const tabla = document.getElementById('tabla-docente-secciones');

        if (!session?.userId) {
            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="6">Sesión no válida.</td></tr>';
            }
            return;
        }

        try {
            const response = await window.ApiService.obtenerSecciones();
            const data = Array.isArray(response.data) ? response.data : [];

            const mis = obtenerSeccionesDocente(data, session);

            if (!mis.length) {
                tabla.innerHTML = '<tr><td colspan="6">No hay secciones asignadas.</td></tr>';
                return;
            }

            tabla.innerHTML = mis.map((s) => `
                <tr>
                    <td>${escapeHtml(s.NombreCurso || '')}</td>
                    <td>${escapeHtml(s.NumeroSeccion || '')}</td>
                    <td>${escapeHtml(construirNombrePeriodo(s))}</td>
                    <td>${escapeHtml(s.CupoMaximo || 0)}</td>
                    <td>${escapeHtml(s.CupoDisponible || 0)}</td>
                    <td>
                        <span class="badge ${getBadgeEstado(s.EstadoSeccion)}">
                            ${escapeHtml(s.EstadoSeccion || 'N/D')}
                        </span>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error cargando secciones docente:', error);
            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="6">Error cargando secciones.</td></tr>';
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

    return { init };
})();