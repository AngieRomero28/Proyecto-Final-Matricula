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
            const periodoActualId = await resolverPeriodoConCursos(session.estudianteId);

            if (!periodoActualId) {
                renderTabla([]);
                return;
            }

            const response = await window.ApiService.obtenerCursosActualesEstudiante(
                session.estudianteId,
                periodoActualId
            );

            const cursos = Array.isArray(response?.data) ? response.data : [];
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

    async function resolverPeriodoConCursos(estudianteId) {
        const session = window.Auth.getSession();

        const candidatosSesion = [
            session?.periodoId,
            session?.PeriodoID,
            session?.raw?.PeriodoID,
            session?.raw?.periodoId
        ];

        for (const candidato of candidatosSesion) {
            const periodoId = Number(candidato);
            if (!Number.isNaN(periodoId) && periodoId > 0) {
                const tieneCursos = await periodoTieneCursos(estudianteId, periodoId);
                if (tieneCursos) return periodoId;
            }
        }

        const response = await window.ApiService.obtenerPeriodos();
        const periodos = Array.isArray(response?.data) ? response.data : [];

        const ordenados = [...periodos].sort((a, b) => {
            const anioA = Number(a?.Anio || 0);
            const anioB = Number(b?.Anio || 0);
            if (anioA !== anioB) return anioB - anioA;

            const idA = Number(a?.PeriodoID || a?.periodoId || 0);
            const idB = Number(b?.PeriodoID || b?.periodoId || 0);
            return idB - idA;
        });

        const activos = ordenados.filter((item) => {
            const estado = String(item.EstadoPeriodo || item.estado || '').trim().toLowerCase();
            return ['activo', 'activa', 'vigente', 'abierto', 'abierta'].includes(estado);
        });

        for (const item of [...activos, ...ordenados]) {
            const periodoId = Number(item?.PeriodoID ?? item?.periodoId ?? 0);
            if (!periodoId) continue;

            const tieneCursos = await periodoTieneCursos(estudianteId, periodoId);
            if (tieneCursos) return periodoId;
        }

        return null;
    }

    async function periodoTieneCursos(estudianteId, periodoId) {
        try {
            const response = await window.ApiService.obtenerCursosActualesEstudiante(estudianteId, periodoId);
            const rows = Array.isArray(response?.data) ? response.data : [];
            return rows.length > 0;
        } catch (error) {
            return false;
        }
    }

    function expandirHorarios(cursos) {
        const filas = [];
        const vistos = new Set();

        for (const item of cursos) {
            const horarioTextoPlano = construirHorarioTexto(item);
            const aulaTextoPlano = construirAulaTexto(item);

            if (Array.isArray(item.Horarios) && item.Horarios.length) {
                item.Horarios.forEach((horario) => {
                    const key = [
                        item.CodigoCurso,
                        horario.DiaSemana,
                        horario.HoraInicio,
                        horario.HoraFin,
                        horario.AulaTexto || horario.NombreAula || ''
                    ].join('|');

                    if (vistos.has(key)) return;
                    vistos.add(key);

                    filas.push({
                        CodigoCurso: item.CodigoCurso,
                        NombreCurso: item.NombreCurso,
                        DiaSemana: horario.DiaSemana,
                        HoraInicio: horario.HoraInicio,
                        HoraFin: horario.HoraFin,
                        Aula:
                            horario.Aula ||
                            horario.AulaTexto ||
                            horario.NombreAula ||
                            aulaTextoPlano ||
                            'N/D'
                    });
                });
                continue;
            }

            if (Array.isArray(item.horarios) && item.horarios.length) {
                item.horarios.forEach((horario) => {
                    const key = [
                        item.CodigoCurso,
                        horario.DiaSemana || horario.diaSemana,
                        horario.HoraInicio || horario.horaInicio,
                        horario.HoraFin || horario.horaFin,
                        horario.Aula || horario.NombreAula || ''
                    ].join('|');

                    if (vistos.has(key)) return;
                    vistos.add(key);

                    filas.push({
                        CodigoCurso: item.CodigoCurso,
                        NombreCurso: item.NombreCurso,
                        DiaSemana: horario.DiaSemana || horario.diaSemana,
                        HoraInicio: horario.HoraInicio || horario.horaInicio,
                        HoraFin: horario.HoraFin || horario.horaFin,
                        Aula:
                            horario.Aula ||
                            horario.NombreAula ||
                            aulaTextoPlano ||
                            'N/D'
                    });
                });
                continue;
            }

            const key = [
                item.CodigoCurso,
                item.DiaSemana || '',
                item.HoraInicio || '',
                item.HoraFin || '',
                aulaTextoPlano || ''
            ].join('|');

            if (vistos.has(key)) continue;
            vistos.add(key);

            filas.push({
                CodigoCurso: item.CodigoCurso,
                NombreCurso: item.NombreCurso,
                DiaSemana: item.DiaSemana || 'N/D',
                HoraInicio: item.HoraInicio || '',
                HoraFin: item.HoraFin || '',
                Aula: aulaTextoPlano || 'N/D',
                HorarioTexto: horarioTextoPlano
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
                    <strong>${escapeHtmlSafe(item.CodigoCurso || '')}</strong><br>
                    ${escapeHtmlSafe(item.NombreCurso || '')}
                </td>
                <td>${escapeHtmlSafe(item.DiaSemana || 'N/D')}</td>
                <td>${escapeHtmlSafe(formatHourSafe(item.HoraInicio || ''))}</td>
                <td>${escapeHtmlSafe(formatHourSafe(item.HoraFin || ''))}</td>
                <td>${escapeHtmlSafe(item.Aula || 'N/D')}</td>
            </tr>
        `).join('');
    }

    function construirHorarioTexto(item) {
        const dia = item.DiaSemana || '';
        const inicio = item.HoraInicio ? formatHourSafe(item.HoraInicio) : '';
        const fin = item.HoraFin ? formatHourSafe(item.HoraFin) : '';

        if (!dia && !inicio && !fin) return '';
        if (dia && inicio && fin) return `${dia} ${inicio} - ${fin}`;
        return [dia, inicio, fin].filter(Boolean).join(' ');
    }

    function construirAulaTexto(item) {
        return [
            item.CodigoAula || '',
            item.NombreAula || '',
            item.Ubicacion || ''
        ].filter(Boolean).join(' - ');
    }

    function formatHourSafe(value) {
        if (typeof window.formatearHora === 'function') {
            return window.formatearHora(value);
        }
        return String(value || '');
    }

    function escapeHtmlSafe(value) {
        if (typeof window.escapeHtml === 'function') {
            return window.escapeHtml(value);
        }
        return String(value ?? '');
    }

    return {
        init
    };
})();