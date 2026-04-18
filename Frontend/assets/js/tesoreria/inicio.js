window.Modules = window.Modules || {};

window.Modules.tesoreriaInicio = (function () {
    async function init() {
        await cargarInicioTesoreria();
    }

    async function cargarInicioTesoreria() {
        const tabla = document.getElementById('tabla-tesoreria-movimientos');

        try {
            const [pagosRes, facturasRes] = await Promise.all([
                window.ApiService.obtenerPagos(),
                window.ApiService.obtenerFacturas()
            ]);

            const pagos = Array.isArray(pagosRes.data) ? pagosRes.data : [];
            const facturas = Array.isArray(facturasRes.data) ? facturasRes.data : [];

            const montoRecaudado = pagos.reduce(
                (acc, item) => acc + Number(item.MontoPago || item.Monto || 0),
                0
            );

            const saldoPendiente = facturas.reduce(
                (acc, item) => acc + Number(item.SaldoPendiente || 0),
                0
            );

            const facturasPendientes = facturas.filter((item) => {
                const estado = String(item.EstadoFactura || item.Estado || '')
                    .trim()
                    .toLowerCase();

                return ['pendiente', 'parcial', 'vencida', 'vencido'].includes(estado);
            }).length;

            setText('tesoreria-monto-recaudado', window.Helpers.formatCurrency(montoRecaudado));
            setText('tesoreria-saldo-pendiente', window.Helpers.formatCurrency(saldoPendiente));
            setText('tesoreria-facturas-pendientes', facturasPendientes);
            setText('tesoreria-total-pagos', pagos.length);

            renderTablaMovimientos(pagos);
        } catch (error) {
            console.error('Error cargando inicio de tesorería:', error);
            window.UI.showMessage(
                'tesoreria-inicio-message',
                'danger',
                error.message || 'No se pudo cargar la información financiera.'
            );

            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="5">Error cargando movimientos.</td></tr>';
            }
        }
    }

    function renderTablaMovimientos(pagos) {
        const tabla = document.getElementById('tabla-tesoreria-movimientos');
        if (!tabla) return;

        const movimientos = [...pagos]
            .sort((a, b) => {
                const fechaA = new Date(a.FechaPago || a.Fecha || 0).getTime();
                const fechaB = new Date(b.FechaPago || b.Fecha || 0).getTime();
                return fechaB - fechaA;
            })
            .slice(0, 10);

        if (!movimientos.length) {
            tabla.innerHTML = '<tr><td colspan="5">No hay movimientos recientes.</td></tr>';
            return;
        }

        tabla.innerHTML = movimientos.map((item) => `
            <tr>
                <td>${escapeHtml(formatearFecha(item.FechaPago || item.Fecha))}</td>
                <td>${escapeHtml(item.NombreEstudiante || item.Estudiante || 'N/D')}</td>
                <td>${escapeHtml(item.NumeroFactura || item.FacturaID || 'N/D')}</td>
                <td>${escapeHtml(window.Helpers.formatCurrency(item.MontoPago || item.Monto || 0))}</td>
                <td>
                    <span class="badge ${getBadgeEstadoPago(item.EstadoPago || item.Estado || 'N/D')}">
                        ${escapeHtml(item.EstadoPago || item.Estado || 'N/D')}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    return {
        init
    };
})();