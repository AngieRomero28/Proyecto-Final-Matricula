window.Modules = window.Modules || {};

window.Modules.auditorReportes = (function () {
    async function init() {
        configurarEventos();
    }

    function configurarEventos() {
        const btn = document.getElementById('btn-generar-auditor-reporte');

        if (btn && !btn.dataset.bound) {
            btn.dataset.bound = 'true';
            btn.addEventListener('click', generarReporte);
        }
    }

    async function generarReporte() {
        const tipo = document.getElementById('select-auditor-reporte')?.value || '';

        if (!tipo) {
            window.UI.showMessage('auditor-reportes-message', 'warning', 'Seleccione un reporte.');
            return;
        }

        window.UI.clearMessage('auditor-reportes-message');

        try {
            switch (tipo) {
                case 'resumen':
                    await cargarResumen();
                    break;
                case 'matriculas':
                    await cargarMatriculas();
                    break;
                case 'pagos':
                    await cargarPagos();
                    break;
                case 'facturas':
                    await cargarFacturas();
                    break;
                case 'estado-cuenta':
                    await cargarEstadosCuenta();
                    break;
                default:
                    throw new Error('Tipo de reporte no soportado.');
            }
        } catch (error) {
            console.error('Error generando reporte de auditor:', error);
            window.UI.showMessage(
                'auditor-reportes-message',
                'danger',
                error.message || 'No se pudo generar el reporte.'
            );
        }
    }

    async function cargarResumen() {
        const response = await window.ApiService.obtenerResumenReportes();
        const data = response?.data || {};

        const filas = [
            ['Total estudiantes', data.TotalEstudiantes ?? data.totalEstudiantes ?? 0],
            ['Total cursos', data.TotalCursos ?? data.totalCursos ?? 0],
            ['Total períodos', data.TotalPeriodos ?? data.totalPeriodos ?? 0],
            ['Total matrículas', data.TotalMatriculas ?? data.totalMatriculas ?? 0],
            ['Total pagos', data.TotalPagos ?? data.totalPagos ?? 0],
            ['Monto recaudado', window.Helpers.formatCurrency(data.MontoRecaudado ?? data.montoRecaudado ?? 0)],
            ['Saldo pendiente total', window.Helpers.formatCurrency(data.SaldoPendienteTotal ?? data.saldoPendienteTotal ?? 0)]
        ];

        setHead(['Indicador', 'Valor']);
        setBody(
            filas.map(([label, value]) => `
                <tr>
                    <td>${escapeHtml(label)}</td>
                    <td>${escapeHtml(value)}</td>
                </tr>
            `).join('')
        );
    }

    async function cargarMatriculas() {
        const response = await window.ApiService.obtenerMatriculas();
        const data = Array.isArray(response.data) ? response.data : [];

        setHead(['ID', 'Estudiante', 'Período', 'Créditos', 'Costo', 'Estado']);
        setBody(
            data.map((item) => `
                <tr>
                    <td>${escapeHtml(item.MatriculaID || 'N/D')}</td>
                    <td>${escapeHtml(item.NombreEstudiante || item.Estudiante || 'N/D')}</td>
                    <td>${escapeHtml(item.NombrePeriodo || 'N/D')}</td>
                    <td>${escapeHtml(item.CreditosTotales || item.Creditos || 0)}</td>
                    <td>${escapeHtml(window.Helpers.formatCurrency(item.CostoTotal || item.MontoTotal || 0))}</td>
                    <td>${escapeHtml(item.EstadoMatricula || item.Estado || 'N/D')}</td>
                </tr>
            `).join('') || '<tr><td colspan="6">No hay datos.</td></tr>'
        );
    }

    async function cargarPagos() {
        const response = await window.ApiService.obtenerPagos();
        const data = Array.isArray(response.data) ? response.data : [];

        setHead(['ID', 'Factura', 'Estudiante', 'Fecha', 'Monto', 'Estado']);
        setBody(
            data.map((item) => `
                <tr>
                    <td>${escapeHtml(item.PagoID || 'N/D')}</td>
                    <td>${escapeHtml(item.NumeroFactura || item.FacturaID || 'N/D')}</td>
                    <td>${escapeHtml(item.NombreEstudiante || item.Estudiante || 'N/D')}</td>
                    <td>${escapeHtml(formatearFecha(item.FechaPago || item.Fecha))}</td>
                    <td>${escapeHtml(window.Helpers.formatCurrency(item.MontoPago || item.Monto || 0))}</td>
                    <td>${escapeHtml(item.EstadoPago || item.Estado || 'N/D')}</td>
                </tr>
            `).join('') || '<tr><td colspan="6">No hay datos.</td></tr>'
        );
    }

    async function cargarFacturas() {
        const response = await window.ApiService.obtenerFacturas();
        const data = Array.isArray(response.data) ? response.data : [];

        setHead(['Número', 'Estudiante', 'Período', 'Total', 'Saldo', 'Estado']);
        setBody(
            data.map((item) => `
                <tr>
                    <td>${escapeHtml(item.NumeroFactura || 'N/D')}</td>
                    <td>${escapeHtml(item.NombreEstudiante || item.Estudiante || 'N/D')}</td>
                    <td>${escapeHtml(item.NombrePeriodo || 'N/D')}</td>
                    <td>${escapeHtml(window.Helpers.formatCurrency(item.Total || item.MontoTotal || 0))}</td>
                    <td>${escapeHtml(window.Helpers.formatCurrency(item.SaldoPendiente || 0))}</td>
                    <td>${escapeHtml(item.EstadoFactura || item.Estado || 'N/D')}</td>
                </tr>
            `).join('') || '<tr><td colspan="6">No hay datos.</td></tr>'
        );
    }

    async function cargarEstadosCuenta() {
        const response = await window.ApiService.obtenerEstadosCuenta();
        const data = Array.isArray(response.data) ? response.data : [];

        setHead(['Factura', 'Estudiante', 'Total', 'Pagado', 'Saldo', 'Estado']);
        setBody(
            data.map((item) => `
                <tr>
                    <td>${escapeHtml(item.NumeroFactura || item.FacturaID || 'N/D')}</td>
                    <td>${escapeHtml(item.NombreEstudiante || item.Estudiante || 'N/D')}</td>
                    <td>${escapeHtml(window.Helpers.formatCurrency(item.MontoTotal || item.Total || 0))}</td>
                    <td>${escapeHtml(window.Helpers.formatCurrency(item.MontoPagado || 0))}</td>
                    <td>${escapeHtml(window.Helpers.formatCurrency(item.SaldoPendiente || 0))}</td>
                    <td>${escapeHtml(item.EstadoCuenta || item.Estado || 'N/D')}</td>
                </tr>
            `).join('') || '<tr><td colspan="6">No hay datos.</td></tr>'
        );
    }

    function setHead(columns) {
        const head = document.getElementById('tabla-auditor-reportes-head');
        if (!head) return;

        head.innerHTML = `
            <tr>
                ${columns.map((col) => `<th>${escapeHtml(col)}</th>`).join('')}
            </tr>
        `;
    }

    function setBody(html) {
        const body = document.getElementById('tabla-auditor-reportes-body');
        if (!body) return;

        body.innerHTML = html;
    }

    return {
        init
    };
})();