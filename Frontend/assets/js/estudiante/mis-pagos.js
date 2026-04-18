window.Modules = window.Modules || {};

window.Modules.misPagos = (function () {
    async function init() {
        await cargarMisPagos();
    }

    async function cargarMisPagos() {
        const session = window.Auth.getSession();
        const tabla = document.getElementById('tabla-mis-pagos');

        if (!session?.estudianteId) {
            window.UI.showMessage('pagos-message', 'danger', 'No se encontró la sesión del estudiante.');
            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="5">No se encontró la sesión del estudiante.</td></tr>';
            }
            return;
        }

        try {
            const [pagosRes, financieroRes] = await Promise.all([
                window.ApiService.obtenerPagosEstudiante(session.estudianteId),
                window.ApiService.obtenerHistorialFinancieroEstudiante(session.estudianteId)
            ]);

            const pagos = Array.isArray(pagosRes?.data) ? pagosRes.data : [];
            const financiero = Array.isArray(financieroRes?.data) ? financieroRes.data : [];

            const totalPagado = pagos.reduce((acc, item) => acc + Number(item.MontoPago || 0), 0);
            const pendiente = financiero.reduce((acc, item) => acc + Number(item.SaldoPendiente || 0), 0);

            setTextSafe('pagos-total', formatCurrencySafe(totalPagado));
            setTextSafe('pagos-pendiente', formatCurrencySafe(pendiente));

            renderTabla(pagos);
        } catch (error) {
            console.error('Error cargando pagos del estudiante:', error);
            window.UI.showMessage(
                'pagos-message',
                'danger',
                error.message || 'No se pudieron cargar los pagos.'
            );

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
                <td>${escapeHtmlSafe(item.NumeroFactura || 'N/D')}</td>
                <td>${escapeHtmlSafe(formatDateSafe(item.FechaPago))}</td>
                <td>${escapeHtmlSafe(formatCurrencySafe(item.MontoPago || 0))}</td>
                <td>${escapeHtmlSafe(item.MetodoPago || 'N/D')}</td>
                <td>
                    <span class="badge ${getBadgeEstadoPagoSafe(item.EstadoPago)}">
                        ${escapeHtmlSafe(item.EstadoPago || 'N/D')}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    function setTextSafe(id, value) {
        if (typeof window.setText === 'function') {
            window.setText(id, value);
            return;
        }

        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    function formatDateSafe(value) {
        if (typeof window.formatearFecha === 'function') {
            return window.formatearFecha(value);
        }
        return value || 'N/D';
    }

    function formatCurrencySafe(value) {
        if (window.Helpers?.formatCurrency) {
            return window.Helpers.formatCurrency(value);
        }
        return String(value ?? 0);
    }

    function getBadgeEstadoPagoSafe(value) {
        if (typeof window.getBadgeEstadoPago === 'function') {
            return window.getBadgeEstadoPago(value);
        }
        return 'badge-gray';
    }

    function escapeHtmlSafe(value) {
        if (typeof window.escapeHtml === 'function') {
            return window.escapeHtml(value);
        }
        return String(value ?? '');
    }

    return {
        init
    };
})();