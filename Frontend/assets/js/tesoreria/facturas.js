window.Modules = window.Modules || {};

window.Modules.tesoreriaFacturas = (function () {
    let facturas = [];
    let facturasFiltradas = [];

    async function init() {
        await cargarFacturas();
        configurarEventos();
    }

    function configurarEventos() {
        const btnFiltrar = document.getElementById('btn-filtrar-tesoreria-facturas');
        const inputBuscar = document.getElementById('filtro-tesoreria-facturas');
        const selectEstado = document.getElementById('filtro-tesoreria-estado-factura');

        if (btnFiltrar && !btnFiltrar.dataset.bound) {
            btnFiltrar.dataset.bound = 'true';
            btnFiltrar.addEventListener('click', aplicarFiltros);
        }

        if (inputBuscar && !inputBuscar.dataset.bound) {
            inputBuscar.dataset.bound = 'true';
            inputBuscar.addEventListener('input', aplicarFiltros);
        }

        if (selectEstado && !selectEstado.dataset.bound) {
            selectEstado.dataset.bound = 'true';
            selectEstado.addEventListener('change', aplicarFiltros);
        }
    }

    async function cargarFacturas() {
        const tabla = document.getElementById('tabla-tesoreria-facturas');

        try {
            const response = await window.ApiService.obtenerFacturas();
            facturas = Array.isArray(response.data) ? response.data : [];
            facturasFiltradas = [...facturas];

            renderResumen(facturasFiltradas);
            renderTabla();
        } catch (error) {
            console.error('Error cargando facturas de tesorería:', error);
            window.UI.showMessage(
                'tesoreria-facturas-message',
                'danger',
                error.message || 'No se pudieron cargar las facturas.'
            );

            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="7">Error cargando facturas.</td></tr>';
            }
        }
    }

    function aplicarFiltros() {
        const texto = String(document.getElementById('filtro-tesoreria-facturas')?.value || '')
            .trim()
            .toLowerCase();

        const estado = String(document.getElementById('filtro-tesoreria-estado-factura')?.value || '')
            .trim()
            .toLowerCase();

        facturasFiltradas = facturas.filter((item) => {
            const coincideTexto =
                !texto ||
                String(item.NumeroFactura || '').toLowerCase().includes(texto) ||
                String(item.NombreEstudiante || item.Estudiante || '').toLowerCase().includes(texto) ||
                String(item.NombrePeriodo || '').toLowerCase().includes(texto) ||
                String(item.Carnet || '').toLowerCase().includes(texto);

            const estadoFactura = String(item.EstadoFactura || item.Estado || '').trim().toLowerCase();
            const coincideEstado = !estado || estadoFactura === estado;

            return coincideTexto && coincideEstado;
        });

        renderResumen(facturasFiltradas);
        renderTabla();
    }

    function renderResumen(data) {
        const total = data.length;
        const monto = data.reduce(
            (acc, item) => acc + Number(item.Total || item.MontoTotal || 0),
            0
        );
        const pendiente = data.reduce(
            (acc, item) => acc + Number(item.SaldoPendiente || 0),
            0
        );

        setText('tesoreria-facturas-total', total);
        setText('tesoreria-facturas-monto', window.Helpers.formatCurrency(monto));
        setText('tesoreria-facturas-pendiente', window.Helpers.formatCurrency(pendiente));
    }

    function renderTabla() {
        const tabla = document.getElementById('tabla-tesoreria-facturas');
        if (!tabla) return;

        if (!facturasFiltradas.length) {
            tabla.innerHTML = '<tr><td colspan="7">No hay facturas para mostrar.</td></tr>';
            return;
        }

        tabla.innerHTML = facturasFiltradas
            .sort((a, b) => {
                const fechaA = new Date(a.FechaFactura || a.Fecha || 0).getTime();
                const fechaB = new Date(b.FechaFactura || b.Fecha || 0).getTime();
                return fechaB - fechaA;
            })
            .map((item) => `
                <tr>
                    <td>${escapeHtml(item.NumeroFactura || 'N/D')}</td>
                    <td>${escapeHtml(item.NombreEstudiante || item.Estudiante || 'N/D')}</td>
                    <td>${escapeHtml(item.NombrePeriodo || 'N/D')}</td>
                    <td>${escapeHtml(window.Helpers.formatCurrency(item.Total || item.MontoTotal || 0))}</td>
                    <td>${escapeHtml(window.Helpers.formatCurrency(item.MontoPagado || 0))}</td>
                    <td>${escapeHtml(window.Helpers.formatCurrency(item.SaldoPendiente || 0))}</td>
                    <td>
                        <span class="badge ${getBadgeEstadoFactura(item.EstadoFactura || item.Estado || 'N/D')}">
                            ${escapeHtml(item.EstadoFactura || item.Estado || 'N/D')}
                        </span>
                    </td>
                </tr>
            `).join('');
    }

    return {
        init
    };
})();