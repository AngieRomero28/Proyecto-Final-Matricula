window.Modules = window.Modules || {};

window.Modules.dashboard = (function () {
    async function init() {
        await cargarDashboard();
    }

    async function cargarDashboard() {
        try {
            UI.clearMessage('dashboard-message');

            const response = await ApiService.obtenerDashboardResumen();

            // Soporta ambas estructuras:
            // 1) { mensaje, data: { resumen, matriculasRecientes, ... } }
            // 2) { resumen, matriculasRecientes, ... }
            const payload = response?.data ?? response ?? {};

            console.log('Respuesta dashboard:', response);
            console.log('Payload dashboard usado:', payload);

            renderResumen(payload.resumen || {});
            renderMatriculasRecientes(
                Array.isArray(payload.matriculasRecientes) ? payload.matriculasRecientes : []
            );
            renderPagosRecientes(
                Array.isArray(payload.pagosRecientes) ? payload.pagosRecientes : []
            );
            renderPeriodos(
                Array.isArray(payload.periodos) ? payload.periodos : []
            );
        } catch (error) {
            console.error('Error cargando dashboard:', error);

            UI.showMessage(
                'dashboard-message',
                'danger',
                error.message || 'No se pudo cargar el dashboard.'
            );
        }
    }

    function renderResumen(resumen) {
        setText('dash-total-estudiantes', resumen.TotalEstudiantes ?? 0);
        setText('dash-estudiantes-activos', resumen.EstudiantesActivos ?? 0);

        setText('dash-total-cursos', resumen.TotalCursos ?? 0);
        setText('dash-cursos-activos', resumen.CursosActivos ?? 0);

        setText('dash-total-periodos', resumen.TotalPeriodos ?? 0);
        setText('dash-periodos-activos', resumen.PeriodosActivos ?? 0);

        setText('dash-total-secciones', resumen.TotalSecciones ?? 0);
        setText('dash-secciones-activas', resumen.SeccionesActivas ?? 0);

        setText('dash-total-matriculas', resumen.TotalMatriculas ?? 0);
        setText('dash-matriculas-pendientes', resumen.MatriculasPendientes ?? 0);
        setText('dash-matriculas-confirmadas', resumen.MatriculasConfirmadas ?? 0);

        setText('dash-total-pagos', resumen.TotalPagos ?? 0);
        setText('dash-monto-recaudado', Helpers.formatCurrency(resumen.MontoRecaudado ?? 0));
        setText('dash-facturas-pendientes', resumen.FacturasPendientes ?? 0);
        setText('dash-saldo-pendiente-total', Helpers.formatCurrency(resumen.SaldoPendienteTotal ?? 0));
    }

    function renderMatriculasRecientes(items) {
        const tbody = document.getElementById('tabla-dashboard-matriculas');
        if (!tbody) return;

        if (!items.length) {
            tbody.innerHTML = '<tr><td colspan="6">No hay matrículas recientes</td></tr>';
            return;
        }

        tbody.innerHTML = items.map((item) => `
            <tr>
                <td>${item.MatriculaID ?? ''}</td>
                <td>${escapeHtml(item.NombreEstudiante || '')}</td>
                <td>${escapeHtml(construirNombrePeriodo(item))}</td>
                <td>${item.CreditosTotales ?? 0}</td>
                <td>${Helpers.formatCurrency(item.CostoTotal ?? 0)}</td>
                <td>
                    <span class="badge ${getBadgeMatricula(item.EstadoMatricula)}">
                        ${escapeHtml(item.EstadoMatricula || 'N/D')}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    function renderPagosRecientes(items) {
        const tbody = document.getElementById('tabla-dashboard-pagos');
        if (!tbody) return;

        if (!items.length) {
            tbody.innerHTML = '<tr><td colspan="6">No hay pagos recientes</td></tr>';
            return;
        }

        tbody.innerHTML = items.map((item) => `
            <tr>
                <td>${item.PagoID ?? ''}</td>
                <td>${escapeHtml(item.NombreEstudiante || '')}</td>
                <td>${escapeHtml(item.NumeroFactura || '')}</td>
                <td>${Helpers.formatCurrency(item.MontoPago ?? 0)}</td>
                <td>${escapeHtml(item.MetodoPago || '')}</td>
                <td>
                    <span class="badge ${getBadgePago(item.EstadoPago)}">
                        ${escapeHtml(item.EstadoPago || 'N/D')}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    function renderPeriodos(items) {
        const tbody = document.getElementById('tabla-dashboard-periodos');
        if (!tbody) return;

        if (!items.length) {
            tbody.innerHTML = '<tr><td colspan="5">No hay períodos registrados</td></tr>';
            return;
        }

        tbody.innerHTML = items.map((item) => `
            <tr>
                <td>${item.PeriodoID ?? ''}</td>
                <td>${escapeHtml(item.NombrePeriodo || '')}</td>
                <td>${escapeHtml(item.TipoPeriodo || '')}</td>
                <td>${item.Anio ?? ''}</td>
                <td>
                    <span class="badge ${getBadgePeriodo(item.EstadoPeriodo)}">
                        ${escapeHtml(item.EstadoPeriodo || 'N/D')}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    function construirNombrePeriodo(item) {
        const partes = [
            item.NombrePeriodo,
            item.TipoPeriodo,
            item.Anio ? `(${item.Anio})` : ''
        ].filter(Boolean);

        return partes.join(' ');
    }

    function getBadgeMatricula(estado) {
        switch (estado) {
            case 'Confirmada':
                return 'badge-success';
            case 'Pendiente':
                return 'badge-warning';
            case 'Anulada':
                return 'badge-danger';
            default:
                return 'badge-gray';
        }
    }

    function getBadgePago(estado) {
        switch (estado) {
            case 'Exitoso':
            case 'Aplicado':
                return 'badge-success';
            case 'Pendiente':
                return 'badge-warning';
            case 'Rechazado':
                return 'badge-danger';
            default:
                return 'badge-gray';
        }
    }

    function getBadgePeriodo(estado) {
        switch (estado) {
            case 'Activo':
                return 'badge-success';
            case 'Inactivo':
            case 'Cerrado':
                return 'badge-gray';
            default:
                return 'badge-gray';
        }
    }

    function setText(id, value) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = value;
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