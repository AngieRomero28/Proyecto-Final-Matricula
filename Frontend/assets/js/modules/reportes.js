window.Modules = window.Modules || {};

window.Modules.reportes = (function () {
    async function init() {
        await cargarReportes();
    }

    async function cargarReportes() {
        try {
            UI.clearMessage('reportes-message');

            const response = await ApiService.obtenerResumenReportes();
            const data = response.data || {};

            renderResumen(data.resumen || {});
            renderEstadosCuenta(data.estadosCuentaResumen || {});
            renderMatriculasPorPeriodo(data.matriculasPorPeriodo || []);
            renderPagosPorPeriodo(data.pagosPorPeriodo || []);
            renderCursosMasMatriculados(data.cursosMasMatriculados || []);
        } catch (error) {
            console.error('Error cargando reportes:', error);
            UI.showMessage('reportes-message', 'danger', error.message || 'No se pudieron cargar los reportes.');
        }
    }

    function renderResumen(resumen) {
        setText('reporte-total-estudiantes', resumen.TotalEstudiantes ?? 0);
        setText('reporte-total-cursos', resumen.TotalCursos ?? 0);
        setText('reporte-total-periodos', resumen.TotalPeriodos ?? 0);
        setText('reporte-total-secciones', resumen.TotalSecciones ?? 0);
        setText('reporte-total-matriculas', resumen.TotalMatriculas ?? 0);
        setText('reporte-total-pagos', resumen.TotalPagos ?? 0);
        setText('reporte-total-facturas', resumen.TotalFacturas ?? 0);
        setText('reporte-total-recaudado', Helpers.formatCurrency(resumen.TotalRecaudado ?? 0));
        setText('reporte-saldo-pendiente', Helpers.formatCurrency(resumen.SaldoPendienteTotal ?? 0));
    }

    function renderEstadosCuenta(data) {
        setText('reporte-ec-total', data.TotalEstadosCuenta ?? 0);
        setText('reporte-ec-pendientes', data.Pendientes ?? 0);
        setText('reporte-ec-pagados', data.Pagados ?? 0);
        setText('reporte-ec-vencidos', data.Vencidos ?? 0);
    }

    function renderMatriculasPorPeriodo(items) {
        const tbody = document.getElementById('tabla-reportes-matriculas-periodo');
        if (!tbody) return;

        if (!items.length) {
            tbody.innerHTML = '<tr><td colspan="6">No hay datos disponibles</td></tr>';
            return;
        }

        tbody.innerHTML = items.map((item) => `
            <tr>
                <td>${escapeHtml(item.NombrePeriodo || '')}</td>
                <td>${escapeHtml(item.TipoPeriodo || '')}</td>
                <td>${item.Anio ?? ''}</td>
                <td>${item.TotalMatriculas ?? 0}</td>
                <td>${item.TotalCreditos ?? 0}</td>
                <td>${Helpers.formatCurrency(item.TotalCostoMatricula ?? 0)}</td>
            </tr>
        `).join('');
    }

    function renderPagosPorPeriodo(items) {
        const tbody = document.getElementById('tabla-reportes-pagos-periodo');
        if (!tbody) return;

        if (!items.length) {
            tbody.innerHTML = '<tr><td colspan="5">No hay datos disponibles</td></tr>';
            return;
        }

        tbody.innerHTML = items.map((item) => `
            <tr>
                <td>${escapeHtml(item.NombrePeriodo || '')}</td>
                <td>${escapeHtml(item.TipoPeriodo || '')}</td>
                <td>${item.Anio ?? ''}</td>
                <td>${item.TotalPagos ?? 0}</td>
                <td>${Helpers.formatCurrency(item.MontoPagado ?? 0)}</td>
            </tr>
        `).join('');
    }

    function renderCursosMasMatriculados(items) {
        const tbody = document.getElementById('tabla-reportes-cursos');
        if (!tbody) return;

        if (!items.length) {
            tbody.innerHTML = '<tr><td colspan="4">No hay datos disponibles</td></tr>';
            return;
        }

        tbody.innerHTML = items.map((item, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(item.CodigoCurso || '')}</td>
                <td>${escapeHtml(item.NombreCurso || '')}</td>
                <td>${item.TotalInscripciones ?? 0}</td>
            </tr>
        `).join('');
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