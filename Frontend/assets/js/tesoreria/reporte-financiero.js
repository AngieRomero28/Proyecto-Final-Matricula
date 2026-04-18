window.Modules = window.Modules || {};

window.Modules.tesoreriaReporteFinanciero = (function () {
    async function init() {
        await cargarReporte();
    }

    async function cargarReporte() {
        try {
            const [pagosRes, facturasRes] = await Promise.all([
                window.ApiService.obtenerPagos(),
                window.ApiService.obtenerFacturas()
            ]);

            const pagos = Array.isArray(pagosRes.data) ? pagosRes.data : [];
            const facturas = Array.isArray(facturasRes.data) ? facturasRes.data : [];

            const recaudado = pagos.reduce(
                (a, i) => a + Number(i.MontoPago || i.Monto || 0),
                0
            );

            const facturado = facturas.reduce(
                (a, i) => a + Number(i.Total || i.MontoTotal || 0),
                0
            );

            const pendiente = facturas.reduce(
                (a, i) => a + Number(i.SaldoPendiente || 0),
                0
            );

            setText('tesoreria-reporte-recaudado', window.Helpers.formatCurrency(recaudado));
            setText('tesoreria-reporte-facturado', window.Helpers.formatCurrency(facturado));
            setText('tesoreria-reporte-pendiente', window.Helpers.formatCurrency(pendiente));
            setText('tesoreria-reporte-pagos', pagos.length);

            renderPorPeriodo(facturas);
            renderEstados(facturas);
        } catch (error) {
            console.error('Error generando reporte financiero:', error);
            window.UI.showMessage(
                'tesoreria-reporte-message',
                'danger',
                error.message || 'Error generando reporte.'
            );
        }
    }

    function renderPorPeriodo(facturas) {
        const tabla = document.getElementById('tabla-tesoreria-reporte-periodos');
        if (!tabla) return;

        const mapa = new Map();

        facturas.forEach((f) => {
            const key = f.NombrePeriodo || 'N/D';

            if (!mapa.has(key)) {
                mapa.set(key, {
                    periodo: key,
                    tipo: f.TipoPeriodo || '',
                    anio: f.Anio || '',
                    total: 0,
                    monto: 0
                });
            }

            const item = mapa.get(key);
            item.total += 1;
            item.monto += Number(f.Total || f.MontoTotal || 0);
        });

        const lista = Array.from(mapa.values());

        if (!lista.length) {
            tabla.innerHTML = '<tr><td colspan="5">Sin datos.</td></tr>';
            return;
        }

        tabla.innerHTML = lista
            .sort((a, b) => {
                if (Number(b.anio || 0) !== Number(a.anio || 0)) {
                    return Number(b.anio || 0) - Number(a.anio || 0);
                }

                return String(a.periodo).localeCompare(String(b.periodo));
            })
            .map((p) => `
                <tr>
                    <td>${escapeHtml(p.periodo)}</td>
                    <td>${escapeHtml(p.tipo)}</td>
                    <td>${escapeHtml(p.anio)}</td>
                    <td>${escapeHtml(p.total)}</td>
                    <td>${escapeHtml(window.Helpers.formatCurrency(p.monto))}</td>
                </tr>
            `).join('');
    }

    function renderEstados(facturas) {
        const tabla = document.getElementById('tabla-tesoreria-reporte-estados');
        if (!tabla) return;

        const mapa = new Map();

        facturas.forEach((f) => {
            const estado = f.EstadoFactura || f.Estado || 'N/D';

            if (!mapa.has(estado)) {
                mapa.set(estado, { count: 0, monto: 0 });
            }

            const item = mapa.get(estado);
            item.count += 1;
            item.monto += Number(f.Total || f.MontoTotal || 0);
        });

        const lista = Array.from(mapa.entries());

        if (!lista.length) {
            tabla.innerHTML = '<tr><td colspan="3">Sin datos.</td></tr>';
            return;
        }

        tabla.innerHTML = lista.map(([estado, val]) => `
            <tr>
                <td>${escapeHtml(estado)}</td>
                <td>${escapeHtml(val.count)}</td>
                <td>${escapeHtml(window.Helpers.formatCurrency(val.monto))}</td>
            </tr>
        `).join('');
    }

    return { init };
})();