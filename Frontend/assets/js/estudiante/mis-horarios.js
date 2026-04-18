window.Modules = window.Modules || {};

window.Modules.estudianteMisHorarios = (function () {
    async function init() {
        await cargarMisHorarios();
    }

    async function cargarMisHorarios() {
        const session = window.Auth.getSession();
        const tabla = document.getElementById('tabla-mis-horarios');

        if (!session?.estudianteId) {
            window.UI.showMessage('horarios-message', 'danger', 'No se encontró la sesión del estudiante.');
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
            renderTabla(expandirHorarios(cursos));
        } catch (error) {
            console.error('Error cargando horarios:', error);
            window.UI.showMessage(
                'horarios-message',
                'danger',
                error.message || 'No se pudieron cargar los horarios.'
            );

            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="5">Error cargando horarios.</td></tr>';
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

    function expandirHorarios(cursos) {
        const filas = [];

        for (const item of cursos) {
            if (Array.isArray(item.Horarios) && item.Horarios.length) {
                item.Horarios.forEach((horario) => {
                    filas.push({
                        CodigoCurso: item.CodigoCurso,
                        NombreCurso: item.NombreCurso,
                        DiaSemana: horario.DiaSemana,
                        HoraInicio: horario.HoraInicio,
                        HoraFin: horario.HoraFin,
                        Aula:
                            horario.Aula ||
                            horario.NombreAula ||
                            item.AulaTexto ||
                            item.NombreAula ||
                            'N/D'
                    });
                });
                continue;
            }

            if (Array.isArray(item.horarios) && item.horarios.length) {
                item.horarios.forEach((horario) => {
                    filas.push({
                        CodigoCurso: item.CodigoCurso,
                        NombreCurso: item.NombreCurso,
                        DiaSemana: horario.DiaSemana || horario.diaSemana,
                        HoraInicio: horario.HoraInicio || horario.horaInicio,
                        HoraFin: horario.HoraFin || horario.horaFin,
                        Aula:
                            horario.Aula ||
                            horario.NombreAula ||
                            item.AulaTexto ||
                            item.NombreAula ||
                            'N/D'
                    });
                });
                continue;
            }

            filas.push({
                CodigoCurso: item.CodigoCurso,
                NombreCurso: item.NombreCurso,
                DiaSemana: item.DiaSemana || 'N/D',
                HoraInicio: item.HoraInicio || '',
                HoraFin: item.HoraFin || '',
                Aula: item.AulaTexto || item.NombreAula || 'N/D'
            });
        }

        return filas;
    }

    function renderTabla(horarios) {
        const tabla = document.getElementById('tabla-mis-horarios');
        if (!tabla) return;

        if (!horarios.length) {
            tabla.innerHTML = '<tr><td colspan="5">No hay horarios registrados en el período actual.</td></tr>';
            return;
        }

        tabla.innerHTML = horarios.map((item) => `
            <tr>
                <td>
                    <strong>${escapeHtml(item.CodigoCurso || '')}</strong><br>
                    ${escapeHtml(item.NombreCurso || '')}
                </td>
                <td>${escapeHtml(item.DiaSemana || 'N/D')}</td>
                <td>${escapeHtml(formatearHora(item.HoraInicio || ''))}</td>
                <td>${escapeHtml(formatearHora(item.HoraFin || ''))}</td>
                <td>${escapeHtml(item.Aula || 'N/D')}</td>
            </tr>
        `).join('');
    }

    return {
        init
    };
})();