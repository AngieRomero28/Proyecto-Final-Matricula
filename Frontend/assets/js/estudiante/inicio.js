window.Modules = window.Modules || {};

window.Modules.estudianteInicio = (function () {
    async function init() {
        await cargarResumenInicio();
    }

    async function cargarResumenInicio() {
        const tabla = document.getElementById('tabla-estudiante-movimientos');
        const session = window.Auth.getSession();

        if (!session?.estudianteId) {
            window.UI.showMessage('global-message', 'danger', 'No se encontró la sesión del estudiante.');
            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="3">No se encontró la sesión del estudiante.</td></tr>';
            }
            return;
        }

        try {
            const periodoActualId = await resolverPeriodoConCursos(session.estudianteId);

            const [
                academicoRes,
                financieroRes,
                pagosRes,
                matriculasRes
            ] = await Promise.all([
                window.ApiService.obtenerHistorialAcademicoEstudiante(session.estudianteId),
                window.ApiService.obtenerHistorialFinancieroEstudiante(session.estudianteId),
                window.ApiService.obtenerPagosEstudiante(session.estudianteId),
                periodoActualId
                    ? window.ApiService.obtenerCursosActualesEstudiante(session.estudianteId, periodoActualId)
                    : Promise.resolve({ data: [] })
            ]);

            const historialAcademico = Array.isArray(academicoRes?.data) ? academicoRes.data : [];
            const historialFinanciero = Array.isArray(financieroRes?.data) ? financieroRes.data : [];
            const pagos = Array.isArray(pagosRes?.data) ? pagosRes.data : [];
            const cursosActualesRaw = Array.isArray(matriculasRes?.data) ? matriculasRes.data : [];
            const cursosActuales = agruparCursosActuales(cursosActualesRaw);

            const creditosActuales = cursosActuales.reduce(
                (acc, item) => acc + Number(item.Creditos || 0),
                0
            );

            const cursosConNota = historialAcademico.filter((item) =>
                item.Calificacion !== null &&
                item.Calificacion !== undefined &&
                item.Calificacion !== ''
            );

            const promedio = cursosConNota.length
                ? (
                    cursosConNota.reduce((acc, item) => acc + Number(item.Calificacion || 0), 0) /
                    cursosConNota.length
                ).toFixed(2)
                : '0.00';

            const saldoPendiente = historialFinanciero.reduce(
                (acc, item) => acc + Number(item.SaldoPendiente || 0),
                0
            );

            setTextSafe('est-inicio-cursos', cursosActuales.length);
            setTextSafe('est-inicio-creditos', creditosActuales);
            setTextSafe('est-inicio-promedio', promedio);
            setTextSafe('est-inicio-saldo', formatCurrencySafe(saldoPendiente));

            renderMovimientos(historialFinanciero, pagos);
        } catch (error) {
            console.error('Error cargando inicio del estudiante:', error);
            window.UI.showMessage(
                'global-message',
                'danger',
                error.message || 'No se pudo cargar el inicio del estudiante.'
            );

            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="3">Error cargando información.</td></tr>';
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
            const estado = String(item.EstadoPeriodo || item.estado || '')
                .trim()
                .toLowerCase();

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

    function renderMovimientos(historialFinanciero, pagos) {
        const tabla = document.getElementById('tabla-estudiante-movimientos');
        if (!tabla) return;

        const movimientosFinancieros = historialFinanciero.map((item) => ({
            fecha: item.FechaFactura || item.FechaActualizacion || item.Fecha || null,
            descripcion: `Factura ${item.NumeroFactura || ''} - ${item.NombrePeriodo || 'Período'}`.trim(),
            monto: Number(item.SaldoPendiente || 0) > 0
                ? `Pendiente ${formatCurrencySafe(item.SaldoPendiente || 0)}`
                : `Pagado ${formatCurrencySafe(item.MontoTotal || item.MontoPagado || item.Total || 0)}`
        }));

        const movimientosPagos = pagos.map((item) => ({
            fecha: item.FechaPago || null,
            descripcion: `Pago aplicado - ${item.MetodoPago || 'Método no indicado'}`,
            monto: formatCurrencySafe(item.MontoPago || 0)
        }));

        const movimientos = [...movimientosFinancieros, ...movimientosPagos]
            .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0))
            .slice(0, 10);

        if (!movimientos.length) {
            tabla.innerHTML = '<tr><td colspan="3">No hay movimientos recientes.</td></tr>';
            return;
        }

        tabla.innerHTML = movimientos.map((item) => `
            <tr>
                <td>${escapeHtmlSafe(formatDateSafe(item.fecha))}</td>
                <td>${escapeHtmlSafe(item.descripcion)}</td>
                <td>${escapeHtmlSafe(item.monto)}</td>
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

    function setTextSafe(id, value) {
        if (typeof window.setText === 'function') {
            window.setText(id, value);
            return;
        }

        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    function formatDateSafe(value) {
        if (typeof window.formatearFecha === 'function') {
            return window.formatearFecha(value);
        }
        return value || 'N/D';
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