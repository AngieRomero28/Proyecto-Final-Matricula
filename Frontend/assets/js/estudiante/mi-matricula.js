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
            const periodoActualId = await resolverPeriodoConCursos(session.estudianteId);

            if (!periodoActualId) {
                setTextSafe('mi-matricula-cursos', 0);
                setTextSafe('mi-matricula-creditos', 0);
                setTextSafe('mi-matricula-costo', formatCurrencySafe(0));
                renderTabla([]);
                return;
            }

            const response = await window.ApiService.obtenerCursosActualesEstudiante(
                session.estudianteId,
                periodoActualId
            );

            const cursosRaw = Array.isArray(response?.data) ? response.data : [];
            const cursos = agruparCursosActuales(cursosRaw);

            const totalCursos = cursos.length;
            const totalCreditos = cursos.reduce((acc, item) => acc + Number(item.Creditos || 0), 0);

            const totalCosto = deducirCostoTotal(cursosRaw);

            setTextSafe('mi-matricula-cursos', totalCursos);
            setTextSafe('mi-matricula-creditos', totalCreditos);
            setTextSafe('mi-matricula-costo', formatCurrencySafe(totalCosto));

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

    function agruparCursosActuales(rows) {
        const mapa = new Map();

        for (const item of rows) {
            const key = `${item.SeccionID || ''}-${item.CursoID || ''}-${item.MatriculaID || ''}`;

            if (!mapa.has(key)) {
                mapa.set(key, {
                    ...item,
                    Horarios: [],
                    HorarioTexto: item.HorarioTexto || '',
                    AulaTexto: item.AulaTexto || ''
                });
            }

            const curso = mapa.get(key);
            const horarioTexto = construirHorarioTexto(item);
            const aulaTexto = construirAulaTexto(item);

            if (horarioTexto) {
                const existe = curso.Horarios.some((h) => h.HorarioTexto === horarioTexto && h.AulaTexto === aulaTexto);
                if (!existe) {
                    curso.Horarios.push({
                        DiaSemana: item.DiaSemana || '',
                        HoraInicio: item.HoraInicio || '',
                        HoraFin: item.HoraFin || '',
                        HorarioTexto: horarioTexto,
                        AulaTexto: aulaTexto
                    });
                }
            }
        }

        return Array.from(mapa.values()).map((curso) => {
            if (!curso.HorarioTexto && curso.Horarios.length) {
                curso.HorarioTexto = curso.Horarios.map((h) => h.HorarioTexto).filter(Boolean).join(' | ');
            }

            if (!curso.AulaTexto && curso.Horarios.length) {
                curso.AulaTexto = curso.Horarios.map((h) => h.AulaTexto).filter(Boolean).join(' | ');
            }

            return curso;
        });
    }

    function deducirCostoTotal(rows) {
        if (!rows.length) return 0;

        const montos = rows
            .map((item) => Number(item.CostoTotal ?? item.MontoTotal ?? 0))
            .filter((n) => !Number.isNaN(n));

        return montos.length ? Math.max(...montos) : 0;
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
                construirHorarioTexto(item) ||
                'No definido';

            const estado =
                item.EstadoMatricula ||
                item.Estado ||
                'Confirmada';

            return `
                <tr>
                    <td>
                        <strong>${escapeHtmlSafe(item.CodigoCurso || '')}</strong><br>
                        ${escapeHtmlSafe(item.NombreCurso || '')}
                    </td>
                    <td>${escapeHtmlSafe(item.Creditos || 0)}</td>
                    <td>${escapeHtmlSafe(docente)}</td>
                    <td>${escapeHtmlSafe(horario)}</td>
                    <td>
                        <span class="badge ${getBadgeEstadoSafe(estado)}">
                            ${escapeHtmlSafe(estado)}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
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

    function setTextSafe(id, value) {
        if (typeof window.setText === 'function') {
            window.setText(id, value);
            return;
        }

        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    function formatHourSafe(value) {
        if (typeof window.formatearHora === 'function') {
            return window.formatearHora(value);
        }
        return String(value || '');
    }

    function formatCurrencySafe(value) {
        if (window.Helpers?.formatCurrency) {
            return window.Helpers.formatCurrency(value);
        }
        return String(value ?? 0);
    }

    function getBadgeEstadoSafe(value) {
        if (typeof window.getBadgeEstadoMatricula === 'function') {
            return window.getBadgeEstadoMatricula(value);
        }
        return 'badge-gray';
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