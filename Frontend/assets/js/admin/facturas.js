// frontend/js/admin/facturas.js

window.Modules = window.Modules || {};

window.Modules.adminFacturas = (function () {
    let facturas = [];
    let facturasFiltradas = [];

    async function init() {
        await cargarFacturas();
        configurarEventos();
    }

    function configurarEventos() {
        const btnFiltrar = document.getElementById('btn-filtrar-admin-facturas');
        const inputBuscar = document.getElementById('filtro-admin-facturas');
        const selectEstado = document.getElementById('filtro-admin-estado-factura');

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
        const tabla = document.getElementById('tabla-admin-facturas');

        try {
            window.UI.clearMessage('admin-facturas-message');

            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="8">Cargando facturas...</td></tr>';
            }

            const response = await window.ApiService.obtenerFacturas();
            facturas = Array.isArray(response.data) ? response.data : [];
            facturasFiltradas = [...facturas];

            renderResumen(facturasFiltradas);
            renderTabla();
        } catch (error) {
            console.error('Error cargando facturas admin:', error);
            window.UI.showMessage(
                'admin-facturas-message',
                'danger',
                error.message || 'No se pudieron cargar las facturas.'
            );

            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="8">Error cargando facturas.</td></tr>';
            }
        }
    }

    function aplicarFiltros() {
        const texto = String(document.getElementById('filtro-admin-facturas')?.value || '')
            .trim()
            .toLowerCase();

        const estado = String(document.getElementById('filtro-admin-estado-factura')?.value || '')
            .trim()
            .toLowerCase();

        facturasFiltradas = facturas.filter((item) => {
            const coincideTexto =
                !texto ||
                String(item.NumeroFactura || '').toLowerCase().includes(texto) ||
                String(item.NombreEstudiante || item.Estudiante || '').toLowerCase().includes(texto) ||
                String(item.NombrePeriodo || '').toLowerCase().includes(texto) ||
                String(item.Carnet || '').toLowerCase().includes(texto);

            const estadoFactura = String(item.EstadoFactura || item.Estado || '')
                .trim()
                .toLowerCase();

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

        setText('admin-facturas-total', total);
        setText('admin-facturas-monto', window.Helpers.formatCurrency(monto));
        setText('admin-facturas-pendiente', window.Helpers.formatCurrency(pendiente));
    }

    function renderTabla() {
        const tabla = document.getElementById('tabla-admin-facturas');
        if (!tabla) return;

        if (!facturasFiltradas.length) {
            tabla.innerHTML = '<tr><td colspan="8">No hay facturas para mostrar.</td></tr>';
            return;
        }

        tabla.innerHTML = facturasFiltradas
            .sort((a, b) => {
                const fechaA = new Date(a.FechaEmision || a.FechaFactura || a.Fecha || 0).getTime();
                const fechaB = new Date(b.FechaEmision || b.FechaFactura || b.Fecha || 0).getTime();
                return fechaB - fechaA;
            })
            .map((item) => `
                <tr>
                    <td>${escapeHtml(item.NumeroFactura || 'N/D')}</td>
                    <td>${escapeHtml(item.NombreEstudiante || item.Estudiante || 'N/D')}</td>
                    <td>${escapeHtml(construirPeriodo(item))}</td>
                    <td>${escapeHtml(window.Helpers.formatCurrency(item.Total || item.MontoTotal || 0))}</td>
                    <td>${escapeHtml(window.Helpers.formatCurrency(item.MontoPagado || 0))}</td>
                    <td>${escapeHtml(window.Helpers.formatCurrency(item.SaldoPendiente || 0))}</td>
                    <td>
                        <span class="badge ${getBadgeEstadoFactura(item.EstadoFactura || item.Estado || 'N/D')}">
                            ${escapeHtml(item.EstadoFactura || item.Estado || 'N/D')}
                        </span>
                    </td>
                    <td>
                        <button
                            class="btn btn-outline"
                            onclick="window.Modules.adminFacturas.verDetalle(${Number(item.FacturaID)})"
                        >
                            Ver
                        </button>
                    </td>
                </tr>
            `).join('');
    }

    async function verDetalle(facturaId) {
        try {
            const response = await window.ApiService.obtenerFacturaPorId(facturaId);
            const item = response?.data || null;

            if (!item) {
                throw new Error('No se encontró la factura.');
            }

            window.UI.openModal({
                title: `Factura ${escapeHtml(item.NumeroFactura || item.FacturaID || '')}`,
                body: `
                    <p><strong>Factura:</strong> ${escapeHtml(item.NumeroFactura || 'N/D')}</p>
                    <p><strong>Estudiante:</strong> ${escapeHtml(item.NombreEstudiante || 'N/D')}</p>
                    <p><strong>Carnet:</strong> ${escapeHtml(item.Carnet || 'N/D')}</p>
                    <p><strong>Período:</strong> ${escapeHtml(construirPeriodo(item))}</p>
                    <p><strong>Fecha emisión:</strong> ${escapeHtml(formatearFecha(item.FechaEmision || item.FechaFactura || item.Fecha))}</p>
                    <p><strong>Subtotal:</strong> ${escapeHtml(window.Helpers.formatCurrency(item.Subtotal || 0))}</p>
                    <p><strong>Descuento:</strong> ${escapeHtml(window.Helpers.formatCurrency(item.Descuento || 0))}</p>
                    <p><strong>Total:</strong> ${escapeHtml(window.Helpers.formatCurrency(item.Total || item.MontoTotal || 0))}</p>
                    <p><strong>Monto pagado:</strong> ${escapeHtml(window.Helpers.formatCurrency(item.MontoPagado || 0))}</p>
                    <p><strong>Saldo pendiente:</strong> ${escapeHtml(window.Helpers.formatCurrency(item.SaldoPendiente || 0))}</p>
                    <p><strong>Estado factura:</strong> ${escapeHtml(item.EstadoFactura || 'N/D')}</p>
                    <p><strong>Estado cuenta:</strong> ${escapeHtml(item.EstadoCuenta || 'N/D')}</p>
                    <p><strong>Matrícula ID:</strong> ${escapeHtml(item.MatriculaID || 'N/D')}</p>
                    <p><strong>Estado matrícula:</strong> ${escapeHtml(item.EstadoMatricula || 'N/D')}</p>
                `,
                hideFooter: true
            });
        } catch (error) {
            console.error('Error obteniendo detalle de factura:', error);
            window.UI.showMessage(
                'admin-facturas-message',
                'danger',
                error.message || 'No se pudo obtener el detalle de la factura.'
            );
        }
    }

    function construirPeriodo(item) {
        const partes = [
            item.NombrePeriodo,
            item.TipoPeriodo,
            item.Anio ? `(${item.Anio})` : ''
        ].filter(Boolean);

        return partes.length ? partes.join(' ') : 'N/D';
    }

    function getBadgeEstadoFactura(estado) {
        switch (String(estado || '').trim().toLowerCase()) {
            case 'pagada':
            case 'pagado':
                return 'badge-success';
            case 'pendiente':
            case 'parcial':
                return 'badge-warning';
            case 'anulada':
            case 'rechazada':
                return 'badge-danger';
            default:
                return 'badge-gray';
        }
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
        init,
        verDetalle
    };
})();