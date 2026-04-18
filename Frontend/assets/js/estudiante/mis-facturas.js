window.Modules = window.Modules || {};

window.Modules.misFacturas = (function () {
    async function init() {
        await cargarMisFacturas();
    }

    async function cargarMisFacturas() {
        const session = Auth.getSession();
        const tabla = document.getElementById('tabla-mis-facturas');

        if (!session?.estudianteId) {
            UI.showMessage('facturas-message', 'danger', 'No se encontró la sesión del estudiante.');
            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="6">No se encontró la sesión del estudiante.</td></tr>';
            }
            return;
        }

        try {
            const response = await ApiService.obtenerHistorialFinancieroEstudiante(session.estudianteId);
            const facturas = Array.isArray(response.data) ? response.data : [];

            const total = facturas.length;
            const monto = facturas.reduce((acc, item) => acc + Number(item.MontoTotal || 0), 0);
            const pendiente = facturas.reduce((acc, item) => acc + Number(item.SaldoPendiente || 0), 0);

            setText('mis-facturas-total', total);
            setText('mis-facturas-monto', Helpers.formatCurrency(monto));
            setText('mis-facturas-pendiente', Helpers.formatCurrency(pendiente));

            renderTabla(facturas);
        } catch (error) {
            console.error('Error cargando facturas del estudiante:', error);
            UI.showMessage('facturas-message', 'danger', error.message || 'No se pudieron cargar las facturas.');

            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="6">Error cargando facturas.</td></tr>';
            }
        }
    }

    function renderTabla(facturas) {
        const tabla = document.getElementById('tabla-mis-facturas');
        if (!tabla) return;

        if (!facturas.length) {
            tabla.innerHTML = '<tr><td colspan="6">No hay facturas registradas.</td></tr>';
            return;
        }

        tabla.innerHTML = facturas.map((item) => `
            <tr>
                <td>${escapeHtml(item.NumeroFactura || 'N/D')}</td>
                <td>${escapeHtml(item.NombrePeriodo || 'N/D')}</td>
                <td>${Helpers.formatCurrency(item.MontoTotal || 0)}</td>
                <td>${Helpers.formatCurrency(item.MontoPagado || 0)}</td>
                <td>${Helpers.formatCurrency(item.SaldoPendiente || 0)}</td>
                <td>
                    <span class="badge ${getBadgeEstadoFactura(item.EstadoFactura || item.EstadoCuenta)}">
                        ${escapeHtml(item.EstadoFactura || item.EstadoCuenta || 'N/D')}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    return {
        init
    };
})();