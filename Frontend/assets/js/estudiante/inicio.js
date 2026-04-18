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
            const periodoActualId = await obtenerPeriodoActualId();

            const [
                academicoRes,
                financieroRes,
                pagosRes,
                matriculasRes
            ] = await Promise.all([
                window.ApiService.obtenerHistorialAcademicoEstudiante(session.estudianteId),
                window.ApiService.obtenerHistorialFinancieroEstudiante(session.estudianteId),
                window.ApiService.obtenerPagosEstudiante(session.estudianteId),
                window.ApiService.obtenerCursosActualesEstudiante(session.estudianteId, periodoActualId)
            ]);

            const historialAcademico = Array.isArray(academicoRes.data) ? academicoRes.data : [];
            const historialFinanciero = Array.isArray(financieroRes.data) ? financieroRes.data : [];
            const pagos = Array.isArray(pagosRes.data) ? pagosRes.data : [];
            const cursosActuales = Array.isArray(matriculasRes.data) ? matriculasRes.data : [];

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

            setText('est-inicio-cursos', cursosActuales.length);
            setText('est-inicio-creditos', creditosActuales);
            setText('est-inicio-promedio', promedio);
            setText('est-inicio-saldo', window.Helpers.formatCurrency(saldoPendiente));

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

    function renderMovimientos(historialFinanciero, pagos) {
        const tabla = document.getElementById('tabla-estudiante-movimientos');
        if (!tabla) return;

        const movimientosFinancieros = historialFinanciero.map((item) => ({
            fecha: item.FechaFactura || item.FechaActualizacion || item.Fecha || null,
            descripcion: `Factura ${item.NumeroFactura || ''} - ${item.NombrePeriodo || 'Período'}`.trim(),
            monto: Number(item.SaldoPendiente || 0) > 0
                ? `Pendiente ${window.Helpers.formatCurrency(item.SaldoPendiente || 0)}`
                : `Pagado ${window.Helpers.formatCurrency(item.MontoTotal || item.MontoPagado || 0)}`
        }));

        const movimientosPagos = pagos.map((item) => ({
            fecha: item.FechaPago || null,
            descripcion: `Pago aplicado - ${item.MetodoPago || 'Método no indicado'}`,
            monto: window.Helpers.formatCurrency(item.MontoPago || 0)
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
                <td>${escapeHtml(formatearFecha(item.fecha))}</td>
                <td>${escapeHtml(item.descripcion)}</td>
                <td>${escapeHtml(item.monto)}</td>
            </tr>
        `).join('');
    }

    return {
        init
    };
})();