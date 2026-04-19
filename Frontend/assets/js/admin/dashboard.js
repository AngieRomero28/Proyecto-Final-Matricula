window.Modules = window.Modules || {};

window.Modules.adminDashboard = (function () {
    async function init() {
        await cargarDashboard();
    }

    async function cargarDashboard() {
        try {
            window.UI.clearMessage('admin-dashboard-message');

            const response = await window.ApiService.obtenerDashboardResumen();
            const payload = response?.data ?? response ?? {};

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
            console.error('Error cargando dashboard admin:', error);

            window.UI.showMessage(
                'admin-dashboard-message',
                'danger',
                error.message || 'No se pudo cargar el dashboard.'
            );
        }
    }

    function renderResumen(resumen) {
        setText('admin-dash-total-estudiantes', resumen.TotalEstudiantes ?? resumen.totalEstudiantes ?? 0);
        setText('admin-dash-estudiantes-activos', resumen.EstudiantesActivos ?? resumen.estudiantesActivos ?? 0);

        setText('admin-dash-total-cursos', resumen.TotalCursos ?? resumen.totalCursos ?? 0);
        setText('admin-dash-cursos-activos', resumen.CursosActivos ?? resumen.cursosActivos ?? 0);

        setText('admin-dash-total-periodos', resumen.TotalPeriodos ?? resumen.totalPeriodos ?? 0);
        setText('admin-dash-periodos-activos', resumen.PeriodosActivos ?? resumen.periodosActivos ?? 0);

        setText('admin-dash-total-secciones', resumen.TotalSecciones ?? resumen.totalSecciones ?? 0);
        setText('admin-dash-secciones-activas', resumen.SeccionesActivas ?? resumen.seccionesActivas ?? 0);

        setText('admin-dash-total-matriculas', resumen.TotalMatriculas ?? resumen.totalMatriculas ?? 0);
        setText('admin-dash-matriculas-pendientes', resumen.MatriculasPendientes ?? resumen.matriculasPendientes ?? 0);
        setText('admin-dash-matriculas-confirmadas', resumen.MatriculasConfirmadas ?? resumen.matriculasConfirmadas ?? 0);

        setText('admin-dash-total-pagos', resumen.TotalPagos ?? resumen.totalPagos ?? 0);
        setText(
            'admin-dash-monto-recaudado',
            window.Helpers.formatCurrency(resumen.MontoRecaudado ?? resumen.montoRecaudado ?? 0)
        );
        setText('admin-dash-facturas-pendientes', resumen.FacturasPendientes ?? resumen.facturasPendientes ?? 0);
        setText(
            'admin-dash-saldo-pendiente-total',
            window.Helpers.formatCurrency(resumen.SaldoPendienteTotal ?? resumen.saldoPendienteTotal ?? 0)
        );
    }

    function renderMatriculasRecientes(items) {
        const tbody = document.getElementById('tabla-admin-dashboard-matriculas');
        if (!tbody) return;

        if (!items.length) {
            tbody.innerHTML = '<tr><td colspan="6">No hay matrículas recientes</td></tr>';
            return;
        }

        tbody.innerHTML = items.map((item) => `
            <tr>
                <td>${escapeHtml(item.MatriculaID ?? '')}</td>
                <td>${escapeHtml(item.NombreEstudiante || item.Estudiante || '')}</td>
                <td>${escapeHtml(window.construirNombrePeriodo(item))}</td>
                <td>${escapeHtml(item.CreditosTotales ?? item.Creditos ?? 0)}</td>
                <td>${escapeHtml(window.Helpers.formatCurrency(item.CostoTotal ?? item.MontoTotal ?? 0))}</td>
                <td>
                    <span class="badge ${getBadgeMatricula(item.EstadoMatricula || item.Estado)}">
                        ${escapeHtml(item.EstadoMatricula || item.Estado || 'N/D')}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    function renderPagosRecientes(items) {
        const tbody = document.getElementById('tabla-admin-dashboard-pagos');
        if (!tbody) return;

        if (!items.length) {
            tbody.innerHTML = '<tr><td colspan="6">No hay pagos recientes</td></tr>';
            return;
        }

        tbody.innerHTML = items.map((item) => `
            <tr>
                <td>${escapeHtml(item.PagoID ?? '')}</td>
                <td>${escapeHtml(item.NombreEstudiante || item.Estudiante || '')}</td>
                <td>${escapeHtml(item.NumeroFactura || item.FacturaID || '')}</td>
                <td>${escapeHtml(window.Helpers.formatCurrency(item.MontoPago ?? item.Monto ?? 0))}</td>
                <td>${escapeHtml(item.MetodoPago || item.Metodo || '')}</td>
                <td>
                    <span class="badge ${getBadgePago(item.EstadoPago || item.Estado)}">
                        ${escapeHtml(item.EstadoPago || item.Estado || 'N/D')}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    function renderPeriodos(items) {
        const tbody = document.getElementById('tabla-admin-dashboard-periodos');
        if (!tbody) return;

        if (!items.length) {
            tbody.innerHTML = '<tr><td colspan="5">No hay períodos registrados</td></tr>';
            return;
        }

        tbody.innerHTML = items.map((item) => `
            <tr>
                <td>${escapeHtml(item.PeriodoID ?? '')}</td>
                <td>${escapeHtml(item.NombrePeriodo || '')}</td>
                <td>${escapeHtml(item.TipoPeriodo || '')}</td>
                <td>${escapeHtml(item.Anio ?? '')}</td>
                <td>
                    <span class="badge ${getBadgePeriodo(item.EstadoPeriodo || item.Estado)}">
                        ${escapeHtml(item.EstadoPeriodo || item.Estado || 'N/D')}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    function getBadgeMatricula(estado) {
        switch (String(estado || '').trim().toLowerCase()) {
            case 'confirmada':
                return 'badge-success';
            case 'pendiente':
            case 'parcial':
                return 'badge-warning';
            case 'anulada':
            case 'cancelada':
                return 'badge-danger';
            default:
                return 'badge-gray';
        }
    }

    function getBadgePago(estado) {
        switch (String(estado || '').trim().toLowerCase()) {
            case 'exitoso':
            case 'aplicado':
            case 'pagado':
                return 'badge-success';
            case 'pendiente':
                return 'badge-warning';
            case 'rechazado':
            case 'anulado':
                return 'badge-danger';
            default:
                return 'badge-gray';
        }
    }

    function getBadgePeriodo(estado) {
        switch (String(estado || '').trim().toLowerCase()) {
            case 'activo':
            case 'vigente':
                return 'badge-success';
            case 'cerrado':
            case 'inactivo':
                return 'badge-gray';
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