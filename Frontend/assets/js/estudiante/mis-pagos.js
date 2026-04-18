window.Modules = window.Modules || {};

window.Modules.misPagos = (function () {
    async function init() {
        await cargarMisPagos();
    }

    async function cargarMisPagos() {
        const session = Auth.getSession();
        const tabla = document.getElementById('tabla-mis-pagos');

        if (!session?.estudianteId) {
            UI.showMessage('pagos-message', 'danger', 'No se encontró la sesión del estudiante.');
            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="5">No se encontró la sesión del estudiante.</td></tr>';
            }
            return;
        }

        try {
            const [pagosRes, financieroRes] = await Promise.all([
                ApiService.obtenerPagosEstudiante(session.estudianteId),
                ApiService.obtenerHistorialFinancieroEstudiante(session.estudianteId)
            ]);

            const pagos = Array.isArray(pagosRes.data) ? pagosRes.data : [];
            const financiero = Array.isArray(financieroRes.data) ? financieroRes.data : [];

            const totalPagado = pagos.reduce((acc, item) => acc + Number(item.MontoPago || 0), 0);
            const pendiente = financiero.reduce((acc, item) => acc + Number(item.SaldoPendiente || 0), 0);

            setText('pagos-total', Helpers.formatCurrency(totalPagado));
            setText('pagos-pendiente', Helpers.formatCurrency(pendiente));

            renderTabla(pagos);
        } catch (error) {
            console.error('Error cargando pagos del estudiante:', error);
            UI.showMessage('pagos-message', 'danger', error.message || 'No se pudieron cargar los pagos.');

            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="5">Error cargando pagos.</td></tr>';
            }
        }
    }

    function renderTabla(pagos) {
        const tabla = document.getElementById('tabla-mis-pagos');
        if (!tabla) return;

        if (!pagos.length) {
            tabla.innerHTML = '<tr><td colspan="5">No hay pagos registrados.</td></tr>';
            return;
        }

        tabla.innerHTML = pagos.map((item) => `
            <tr>
                <td>${escapeHtml(item.NumeroFactura || 'N/D')}</td>
                <td>${escapeHtml(formatearFecha(item.FechaPago))}</td>
                <td>${Helpers.formatCurrency(item.MontoPago || 0)}</td>
                <td>${escapeHtml(item.MetodoPago || 'N/D')}</td>
                <td>
                    <span class="badge ${getBadgeEstadoPago(item.EstadoPago)}">
                        ${escapeHtml(item.EstadoPago || 'N/D')}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    return {
        init
    };
})();