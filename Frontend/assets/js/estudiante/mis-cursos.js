window.Modules = window.Modules || {};

window.Modules.estudianteMisCursos = (function () {
    async function init() {
        await cargarMisCursos();
    }

    async function cargarMisCursos() {
        const session = window.Auth.getSession();
        const tabla = document.getElementById('tabla-mis-cursos');

        if (!session?.estudianteId) {
            window.UI.showMessage('mis-cursos-message', 'danger', 'No se encontró la sesión del estudiante.');
            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="6">No se encontró la sesión del estudiante.</td></tr>';
            }
            return;
        }

        try {
            const periodoActualId = await obtenerPeriodoActualId();

            const response = await window.ApiService.obtenerCursosActualesEstudiante(
                session.estudianteId,
                periodoActualId
            );

            const cursos = Array.isArray(response.data) ? response.data : [];

            const totalCursos = cursos.length;
            const totalCreditos = cursos.reduce((acc, item) => acc + Number(item.Creditos || 0), 0);
            const periodoActual = cursos[0]
                ? construirNombrePeriodo(cursos[0])
                : '—';

            setText('mis-cursos-total', totalCursos);
            setText('mis-cursos-creditos', totalCreditos);
            setText('mis-cursos-periodo', periodoActual);

            renderTabla(cursos);
        } catch (error) {
            console.error('Error cargando mis cursos:', error);
            window.UI.showMessage(
                'mis-cursos-message',
                'danger',
                error.message || 'No se pudieron cargar los cursos.'
            );

            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="6">Error cargando cursos.</td></tr>';
            }
        }
    }

    async function obtenerPeriodoActualId() {
        const session = window.Auth.getSession();

        const candidatos = [
            session?.periodoId,
            session?.PeriodoID,
            session?.raw?.PeriodoID,
            session?.raw?.periodoId
        ];

        for (const candidato of candidatos) {
            const num = Number(candidato);
            if (!Number.isNaN(num) && num > 0) {
                return num;
            }
        }

        const response = await window.ApiService.obtenerPeriodos();
        const periodos = Array.isArray(response.data) ? response.data : [];

        const activo = periodos.find((item) => {
            const estado = String(item.EstadoPeriodo || item.estado || '').trim().toLowerCase();
            return ['activo', 'activa', 'vigente', 'abierto', 'abierta'].includes(estado);
        });

        const periodoId = Number(
            activo?.PeriodoID ??
            activo?.periodoId ??
            0
        );

        if (!periodoId) {
            throw new Error('No se encontró un período académico activo.');
        }

        return periodoId;
    }

    function renderTabla(cursos) {
        const tabla = document.getElementById('tabla-mis-cursos');
        if (!tabla) return;

        if (!cursos.length) {
            tabla.innerHTML = '<tr><td colspan="6">No tienes cursos registrados en el período actual.</td></tr>';
            return;
        }

        tabla.innerHTML = cursos.map((item) => {
            const docente =
                item.Docente ||
                item.NombreDocente ||
                'Por definir';

            const horario =
                item.HorarioTexto ||
                construirHorarioSimple(item) ||
                'No definido';

            const estado =
                item.EstadoMatricula ||
                item.Estado ||
                'Confirmada';

            return `
                <tr>
                    <td>${escapeHtml(item.CodigoCurso || '')}</td>
                    <td>${escapeHtml(item.NombreCurso || '')}</td>
                    <td>${escapeHtml(item.Creditos || 0)}</td>
                    <td>${escapeHtml(docente)}</td>
                    <td>${escapeHtml(horario)}</td>
                    <td>
                        <span class="badge ${getBadgeEstadoMatricula(estado)}">
                            ${escapeHtml(estado)}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function construirHorarioSimple(item) {
        return [
            item.DiaSemana || null,
            item.HoraInicio ? formatearHora(item.HoraInicio) : null,
            item.HoraFin ? formatearHora(item.HoraFin) : null
        ].filter(Boolean).join(' ');
    }

    return {
        init
    };
})();