// frontend/js/admin/reportes.js

window.Modules = window.Modules || {};

window.Modules.adminReportes = (function () {
    async function init() {
        await cargarReportes();
    }

    async function cargarReportes() {
        try {
            window.UI.clearMessage('admin-reportes-message');

            const response = await window.ApiService.obtenerResumenReportes();
            const payload = response?.data ?? response ?? {};

            renderResumen(payload.resumen || payload.Resumen || {});
            renderEstadosCuenta(payload.estadosCuentaResumen || payload.EstadosCuentaResumen || {});
            renderMatriculasPorPeriodo(payload.matriculasPorPeriodo || payload.MatriculasPorPeriodo || []);
            renderPagosPorPeriodo(payload.pagosPorPeriodo || payload.PagosPorPeriodo || []);
            renderCursosMasMatriculados(payload.cursosMasMatriculados || payload.CursosMasMatriculados || []);
            renderHistorialCostos(payload.historialCostos || payload.HistorialCostos || []);
            renderEstudiantesMorosos(payload.estudiantesMorosos || payload.EstudiantesMorosos || []);
        } catch (error) {
            console.error('Error cargando reportes:', error);
            window.UI.showMessage(
                'admin-reportes-message',
                'danger',
                error.message || 'No se pudieron cargar los reportes.'
            );
        }
    }

    function renderResumen(resumen) {
        setText('admin-reporte-total-estudiantes', resumen.TotalEstudiantes ?? 0);
        setText('admin-reporte-total-cursos', resumen.TotalCursos ?? 0);
        setText('admin-reporte-total-periodos', resumen.TotalPeriodos ?? 0);
        setText('admin-reporte-total-secciones', resumen.TotalSecciones ?? 0);
        setText('admin-reporte-total-matriculas', resumen.TotalMatriculas ?? 0);
        setText('admin-reporte-total-pagos', resumen.TotalPagos ?? 0);
        setText('admin-reporte-total-facturas', resumen.TotalFacturas ?? 0);
        setText(
            'admin-reporte-total-recaudado',
            window.Helpers.formatCurrency(resumen.TotalRecaudado ?? resumen.MontoRecaudado ?? 0)
        );
        setText(
            'admin-reporte-saldo-pendiente',
            window.Helpers.formatCurrency(resumen.SaldoPendienteTotal ?? 0)
        );
    }

    function renderEstadosCuenta(data) {
        setText('admin-reporte-ec-total', data.TotalEstadosCuenta ?? 0);
        setText('admin-reporte-ec-pendientes', data.Pendientes ?? 0);
        setText('admin-reporte-ec-pagados', data.Pagados ?? 0);
        setText('admin-reporte-ec-vencidos', data.Vencidos ?? 0);
    }

    function renderMatriculasPorPeriodo(items) {
        const tbody = document.getElementById('tabla-admin-reportes-matriculas-periodo');
        if (!tbody) return;

        if (!items.length) {
            tbody.innerHTML = '<tr><td colspan="6">No hay datos disponibles</td></tr>';
            return;
        }

        tbody.innerHTML = items.map((item) => `
            <tr>
                <td>${escapeHtml(item.NombrePeriodo || '')}</td>
                <td>${escapeHtml(item.TipoPeriodo || '')}</td>
                <td>${escapeHtml(item.Anio ?? '')}</td>
                <td>${escapeHtml(item.TotalMatriculas ?? 0)}</td>
                <td>${escapeHtml(item.TotalCreditos ?? 0)}</td>
                <td>${escapeHtml(window.Helpers.formatCurrency(item.TotalCostoMatricula ?? item.CostoTotal ?? 0))}</td>
            </tr>
        `).join('');
    }

    function renderPagosPorPeriodo(items) {
        const tbody = document.getElementById('tabla-admin-reportes-pagos-periodo');
        if (!tbody) return;

        if (!items.length) {
            tbody.innerHTML = '<tr><td colspan="5">No hay datos disponibles</td></tr>';
            return;
        }

        tbody.innerHTML = items.map((item) => `
            <tr>
                <td>${escapeHtml(item.NombrePeriodo || '')}</td>
                <td>${escapeHtml(item.TipoPeriodo || '')}</td>
                <td>${escapeHtml(item.Anio ?? '')}</td>
                <td>${escapeHtml(item.TotalPagos ?? 0)}</td>
                <td>${escapeHtml(window.Helpers.formatCurrency(item.MontoPagado ?? item.MontoTotal ?? 0))}</td>
            </tr>
        `).join('');
    }

    function renderCursosMasMatriculados(items) {
        const tbody = document.getElementById('tabla-admin-reportes-cursos');
        if (!tbody) return;

        if (!items.length) {
            tbody.innerHTML = '<tr><td colspan="4">No hay datos disponibles</td></tr>';
            return;
        }

        tbody.innerHTML = items.map((item, index) => `
            <tr>
                <td>${escapeHtml(index + 1)}</td>
                <td>${escapeHtml(item.CodigoCurso || '')}</td>
                <td>${escapeHtml(item.NombreCurso || '')}</td>
                <td>${escapeHtml(item.TotalInscripciones ?? 0)}</td>
            </tr>
        `).join('');
    }

    function renderHistorialCostos(items) {
        const tbody = document.getElementById('tabla-admin-reportes-historial-costos');
        if (!tbody) return;

        if (!items.length) {
            tbody.innerHTML = '<tr><td colspan="6">No hay historial de costos disponible</td></tr>';
            return;
        }

        tbody.innerHTML = items.map((item) => `
            <tr>
                <td>${escapeHtml(item.TipoPeriodo || 'N/D')}</td>
                <td>${escapeHtml(item.Anio ?? 'N/D')}</td>
                <td>${escapeHtml(window.Helpers.formatCurrency(item.CostoCredito ?? 0))}</td>
                <td>${escapeHtml(window.Helpers.formatCurrency(item.CostoMatriculaBase ?? 0))}</td>
                <td>${escapeHtml(formatearFecha(item.FechaInicioVigencia))}</td>
                <td>${escapeHtml(item.EstadoCosto || 'N/D')}</td>
            </tr>
        `).join('');
    }

    function renderEstudiantesMorosos(items) {
        const tbody = document.getElementById('tabla-admin-reportes-morosos');
        if (!tbody) return;

        if (!items.length) {
            tbody.innerHTML = '<tr><td colspan="6">No hay estudiantes morosos</td></tr>';
            return;
        }

        tbody.innerHTML = items.map((item) => `
            <tr>
                <td>${escapeHtml(item.Carnet || 'N/D')}</td>
                <td>${escapeHtml(item.NombreCompleto || item.NombreEstudiante || 'N/D')}</td>
                <td>${escapeHtml(item.NumeroFactura || 'N/D')}</td>
                <td>${escapeHtml(item.NombrePeriodo || 'N/D')}</td>
                <td>${escapeHtml(window.Helpers.formatCurrency(item.MontoTotal || item.Total || 0))}</td>
                <td>${escapeHtml(window.Helpers.formatCurrency(item.SaldoPendiente || 0))}</td>
            </tr>
        `).join('');
    }

    function formatearFecha(fecha) {
        if (!fecha) return 'N/D';

        const date = new Date(fecha);
        if (Number.isNaN(date.getTime())) return 'N/D';

        return date.toLocaleDateString('es-CR');
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