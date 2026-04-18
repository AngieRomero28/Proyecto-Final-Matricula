window.Modules = window.Modules || {};

window.Modules.tesoreriaPagos = (function () {
    let pagos = [];
    let pagosFiltrados = [];

    async function init() {
        await cargarPagos();
        configurarEventos();
    }

    function configurarEventos() {
        const btnFiltrar = document.getElementById('btn-filtrar-tesoreria-pagos');
        const inputBuscar = document.getElementById('filtro-tesoreria-pagos');
        const selectEstado = document.getElementById('filtro-tesoreria-estado-pago');

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

    async function cargarPagos() {
        const tabla = document.getElementById('tabla-tesoreria-pagos');

        try {
            const response = await window.ApiService.obtenerPagos();
            pagos = Array.isArray(response.data) ? response.data : [];
            pagosFiltrados = [...pagos];
            renderTabla();
        } catch (error) {
            console.error('Error cargando pagos:', error);
            window.UI.showMessage(
                'tesoreria-pagos-message',
                'danger',
                error.message || 'No se pudieron cargar los pagos.'
            );

            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="8">Error cargando pagos.</td></tr>';
            }
        }
    }

    function aplicarFiltros() {
        const texto = String(document.getElementById('filtro-tesoreria-pagos')?.value || '')
            .trim()
            .toLowerCase();

        const estado = String(document.getElementById('filtro-tesoreria-estado-pago')?.value || '')
            .trim()
            .toLowerCase();

        pagosFiltrados = pagos.filter((item) => {
            const coincideTexto =
                !texto ||
                String(item.NombreEstudiante || item.Estudiante || '').toLowerCase().includes(texto) ||
                String(item.NumeroFactura || item.FacturaID || '').toLowerCase().includes(texto) ||
                String(item.ReferenciaPago || item.Referencia || '').toLowerCase().includes(texto) ||
                String(item.MetodoPago || item.Metodo || '').toLowerCase().includes(texto);

            const estadoPago = String(item.EstadoPago || item.Estado || '').trim().toLowerCase();
            const coincideEstado = !estado || estadoPago === estado;

            return coincideTexto && coincideEstado;
        });

        renderTabla();
    }

    function renderTabla() {
        const tabla = document.getElementById('tabla-tesoreria-pagos');
        if (!tabla) return;

        if (!pagosFiltrados.length) {
            tabla.innerHTML = '<tr><td colspan="8">No hay pagos para mostrar.</td></tr>';
            return;
        }

        tabla.innerHTML = pagosFiltrados
            .sort((a, b) => {
                const fechaA = new Date(a.FechaPago || a.Fecha || 0).getTime();
                const fechaB = new Date(b.FechaPago || b.Fecha || 0).getTime();
                return fechaB - fechaA;
            })
            .map((item) => `
                <tr>
                    <td>${escapeHtml(item.PagoID || 'N/D')}</td>
                    <td>${escapeHtml(item.NumeroFactura || item.FacturaID || 'N/D')}</td>
                    <td>${escapeHtml(item.NombreEstudiante || item.Estudiante || 'N/D')}</td>
                    <td>${escapeHtml(formatearFecha(item.FechaPago || item.Fecha))}</td>
                    <td>${escapeHtml(window.Helpers.formatCurrency(item.MontoPago || item.Monto || 0))}</td>
                    <td>${escapeHtml(item.MetodoPago || item.Metodo || 'N/D')}</td>
                    <td>${escapeHtml(item.ReferenciaPago || item.Referencia || 'N/D')}</td>
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