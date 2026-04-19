// frontend/js/registro/inicio.js

window.Modules = window.Modules || {};

window.Modules.registroInicio = (function () {
    async function init() {
        await cargarInicioRegistro();
    }

    async function cargarInicioRegistro() {
        const tabla = document.getElementById('tabla-registro-movimientos');

        try {
            window.UI.clearMessage('registro-inicio-message');

            const [estudiantesRes, matriculasRes, cursosRes, periodosRes] = await Promise.all([
                window.ApiService.obtenerEstudiantes(),
                window.ApiService.obtenerMatriculas(),
                window.ApiService.obtenerCursos(),
                window.ApiService.obtenerPeriodos()
            ]);

            const estudiantes = Array.isArray(estudiantesRes.data) ? estudiantesRes.data : [];
            const matriculas = Array.isArray(matriculasRes.data) ? matriculasRes.data : [];
            const cursos = Array.isArray(cursosRes.data) ? cursosRes.data : [];
            const periodos = Array.isArray(periodosRes.data) ? periodosRes.data : [];

            const estudiantesActivos = estudiantes.filter((item) =>
                String(item.EstadoAcademico || item.Estado || '').trim().toLowerCase() === 'activo'
            ).length;

            const matriculasPendientes = matriculas.filter((item) =>
                String(item.EstadoMatricula || item.Estado || '').trim().toLowerCase() === 'pendiente'
            ).length;

            const periodosActivos = periodos.filter((item) =>
                String(item.EstadoPeriodo || item.Estado || '').trim().toLowerCase() === 'activo'
            ).length;

            setText('registro-total-estudiantes', estudiantes.length);
            setText('registro-estudiantes-activos', estudiantesActivos);
            setText('registro-total-cursos', cursos.length);
            setText('registro-total-periodos-activos', periodosActivos);
            setText('registro-total-matriculas', matriculas.length);
            setText('registro-matriculas-pendientes', matriculasPendientes);

            renderTablaMovimientos(matriculas);
        } catch (error) {
            console.error('Error cargando inicio de registro:', error);
            window.UI.showMessage(
                'registro-inicio-message',
                'danger',
                error.message || 'No se pudo cargar la información de registro.'
            );

            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="6">Error cargando movimientos.</td></tr>';
            }
        }
    }

    function renderTablaMovimientos(matriculas) {
        const tabla = document.getElementById('tabla-registro-movimientos');
        if (!tabla) return;

        const movimientos = [...matriculas]
            .sort((a, b) => {
                const fechaA = new Date(a.FechaMatricula || a.Fecha || 0).getTime();
                const fechaB = new Date(b.FechaMatricula || b.Fecha || 0).getTime();
                return fechaB - fechaA;
            })
            .slice(0, 10);

        if (!movimientos.length) {
            tabla.innerHTML = '<tr><td colspan="6">No hay matrículas recientes.</td></tr>';
            return;
        }

        tabla.innerHTML = movimientos.map((item) => `
            <tr>
                <td>${escapeHtml(formatearFecha(item.FechaMatricula || item.Fecha))}</td>
                <td>${escapeHtml(item.MatriculaID || 'N/D')}</td>
                <td>${escapeHtml(item.NombreEstudiante || item.Estudiante || 'N/D')}</td>
                <td>${escapeHtml(item.Carnet || 'N/D')}</td>
                <td>${escapeHtml(item.NombrePeriodo || 'N/D')}</td>
                <td>
                    <span class="badge ${getBadgeEstado(item.EstadoMatricula || item.Estado || 'N/D')}">
                        ${escapeHtml(item.EstadoMatricula || item.Estado || 'N/D')}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    function getBadgeEstado(estado) {
        switch (String(estado || '').trim().toLowerCase()) {
            case 'confirmada':
                return 'badge-success';
            case 'pendiente':
            case 'parcial':
                return 'badge-warning';
            case 'cancelada':
            case 'anulada':
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

    return {
        init
    };
})();