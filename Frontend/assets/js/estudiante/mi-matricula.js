window.Modules = window.Modules || {};

window.Modules.estudianteMiMatricula = (function () {
    async function init() {
        await cargarMiMatricula();
    }

    async function cargarMiMatricula() {
        const session = window.Auth.getSession();
        const tabla = document.getElementById('tabla-mi-matricula');

        if (!session?.estudianteId) {
            window.UI.showMessage('mi-matricula-message', 'danger', 'No se encontró la sesión del estudiante.');
            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="5">No se encontró la sesión del estudiante.</td></tr>';
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
            const totalCosto = cursos.reduce((acc, item) => {
                return acc + Number(
                    item.CostoCurso ??
                    item.CostoTotal ??
                    item.MontoTotal ??
                    0
                );
            }, 0);

            setText('mi-matricula-cursos', totalCursos);
            setText('mi-matricula-creditos', totalCreditos);
            setText('mi-matricula-costo', window.Helpers.formatCurrency(totalCosto));

            renderTabla(cursos);
        } catch (error) {
            console.error('Error cargando mi matrícula:', error);
            window.UI.showMessage(
                'mi-matricula-message',
                'danger',
                error.message || 'No se pudo cargar la matrícula.'
            );

            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="5">Error cargando matrícula.</td></tr>';
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
        const tabla = document.getElementById('tabla-mi-matricula');
        if (!tabla) return;

        if (!cursos.length) {
            tabla.innerHTML = '<tr><td colspan="5">No tienes cursos matriculados en el período actual.</td></tr>';
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
                    <td>
                        <strong>${escapeHtml(item.CodigoCurso || '')}</strong><br>
                        ${escapeHtml(item.NombreCurso || '')}
                    </td>
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