window.Modules = window.Modules || {};

window.Modules.facturas = (function () {
    let facturas = [];
    let facturasFiltradas = [];

    async function init() {
        await cargarFacturas();
        configurarEventos();
    }

    function configurarEventos() {
        const btnFiltrar = document.getElementById('btn-filtrar-facturas');
        const inputBuscar = document.getElementById('filtro-factura-buscar');
        const selectEstado = document.getElementById('filtro-factura-estado');

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
        const tabla = document.getElementById('tabla-facturas');

        try {
            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="9">Cargando facturas...</td></tr>';
            }

            const response = await window.ApiService.obtenerFacturas();
            facturas = Array.isArray(response.data) ? response.data : [];
            facturasFiltradas = [...facturas];

            renderTabla();
            renderResumen();
        } catch (error) {
            console.error('Error cargando facturas:', error);
            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="9">Error cargando facturas</td></tr>';
            }
            window.UI.showMessage(
                'facturas-message',
                'danger',
                error.message || 'No se pudieron cargar las facturas.'
            );
        }
    }

    function aplicarFiltros() {
        const texto = String(document.getElementById('filtro-factura-buscar')?.value || '')
            .trim()
            .toLowerCase();

        const estado = String(document.getElementById('filtro-factura-estado')?.value || '')
            .trim()
            .toLowerCase();

        facturasFiltradas = facturas.filter((factura) => {
            const estadoFactura = String(factura.EstadoFactura || factura.Estado || '').trim().toLowerCase();

            const coincideTexto =
                !texto ||
                String(factura.NumeroFactura || '').toLowerCase().includes(texto) ||
                String(factura.NombreEstudiante || factura.Estudiante || '').toLowerCase().includes(texto) ||
                String(factura.Carnet || '').toLowerCase().includes(texto) ||
                String(factura.NombrePeriodo || '').toLowerCase().includes(texto);

            const coincideEstado = !estado || estadoFactura === estado;

            return coincideTexto && coincideEstado;
        });

        renderTabla();
        renderResumen();
    }

    function renderResumen() {
        const totalFacturas = facturasFiltradas.length;
        const totalMonto = facturasFiltradas.reduce((acc, item) => acc + Number(item.Total || item.MontoTotal || 0), 0);
        const totalSaldo = facturasFiltradas.reduce((acc, item) => acc + Number(item.SaldoPendiente || 0), 0);

        setText('facturas-total', totalFacturas);
        setText('facturas-monto-total', window.Helpers.formatCurrency(totalMonto));
        setText('facturas-saldo-total', window.Helpers.formatCurrency(totalSaldo));
    }

    function renderTabla() {
        const tabla = document.getElementById('tabla-facturas');
        if (!tabla) return;

        if (!facturasFiltradas.length) {
            tabla.innerHTML = '<tr><td colspan="9">No hay facturas para mostrar</td></tr>';
            return;
        }

        tabla.innerHTML = facturasFiltradas.map((factura) => `
            <tr>
                <td>${escapeHtml(factura.FacturaID)}</td>
                <td>${escapeHtml(factura.NumeroFactura || '')}</td>
                <td>${escapeHtml(factura.NombreEstudiante || factura.Estudiante || '')}</td>
                <td>${escapeHtml(factura.NombrePeriodo || '')}</td>
                <td>${escapeHtml(window.Helpers.formatCurrency(factura.Total || factura.MontoTotal || 0))}</td>
                <td>${escapeHtml(window.Helpers.formatCurrency(factura.MontoPagado || 0))}</td>
                <td>${escapeHtml(window.Helpers.formatCurrency(factura.SaldoPendiente || 0))}</td>
                <td>
                    <span class="badge ${getBadgeEstado(factura.EstadoFactura || factura.Estado)}">
                        ${escapeHtml(factura.EstadoFactura || factura.Estado || 'N/D')}
                    </span>
                </td>
                <td>
                    <button class="btn btn-outline" onclick="window.Modules.facturas.verDetalle(${factura.FacturaID})">
                        Ver
                    </button>
                </td>
            </tr>
        `).join('');
    }

    function verDetalle(id) {
        const factura = facturas.find((f) => Number(f.FacturaID) === Number(id));
        if (!factura) return;

        window.UI.openModal({
            title: `Detalle de factura #${factura.FacturaID}`,
            body: `
                <div class="resumen-financiero">
                    <div class="mini-card">
                        <div class="mini-card-label">Número</div>
                        <div class="mini-card-value">${escapeHtml(factura.NumeroFactura || '')}</div>
                    </div>
                    <div class="mini-card">
                        <div class="mini-card-label">Total</div>
                        <div class="mini-card-value">${window.Helpers.formatCurrency(factura.Total || factura.MontoTotal || 0)}</div>
                    </div>
                    <div class="mini-card">
                        <div class="mini-card-label">Saldo</div>
                        <div class="mini-card-value">${window.Helpers.formatCurrency(factura.SaldoPendiente || 0)}</div>
                    </div>
                </div>

                <div class="mt-2">
                    <p><strong>Estudiante:</strong> ${escapeHtml(factura.NombreEstudiante || factura.Estudiante || '')}</p>
                    <p><strong>Carnet:</strong> ${escapeHtml(factura.Carnet || '')}</p>
                    <p><strong>Correo:</strong> ${escapeHtml(factura.CorreoInstitucional || '')}</p>
                    <p><strong>Período:</strong> ${escapeHtml(factura.NombrePeriodo || '')} ${escapeHtml(factura.TipoPeriodo || '')} ${factura.Anio ? `(${factura.Anio})` : ''}</p>
                    <p><strong>Fecha emisión:</strong> ${formatearFecha(factura.FechaEmision || factura.FechaFactura || factura.Fecha)}</p>
                    <p><strong>Subtotal:</strong> ${window.Helpers.formatCurrency(factura.Subtotal || 0)}</p>
                    <p><strong>Descuento:</strong> ${window.Helpers.formatCurrency(factura.Descuento || 0)}</p>
                    <p><strong>Total:</strong> ${window.Helpers.formatCurrency(factura.Total || factura.MontoTotal || 0)}</p>
                    <p><strong>Monto pagado:</strong> ${window.Helpers.formatCurrency(factura.MontoPagado || 0)}</p>
                    <p><strong>Saldo pendiente:</strong> ${window.Helpers.formatCurrency(factura.SaldoPendiente || 0)}</p>
                    <p><strong>Estado factura:</strong> ${escapeHtml(factura.EstadoFactura || factura.Estado || '')}</p>
                    <p><strong>Estado cuenta:</strong> ${escapeHtml(factura.EstadoCuenta || '')}</p>
                    <p><strong>Matrícula:</strong> ${factura.MatriculaID || 'N/D'}</p>
                    <p><strong>Comprobante:</strong> ${escapeHtml(factura.ComprobanteMatricula || 'N/D')}</p>
                </div>
            `,
            hideFooter: true
        });
    }

    function getBadgeEstado(estado) {
        switch (String(estado || '').trim().toLowerCase()) {
            case 'pagada':
            case 'pagado':
                return 'badge-success';
            case 'pendiente':
            case 'parcial':
                return 'badge-warning';
            case 'anulada':
            case 'cancelada':
                return 'badge-danger';
            default:
                return 'badge-gray';
        }
    }

    function formatearFecha(valor) {
        if (!valor) return 'N/D';
        const fecha = new Date(valor);
        return Number.isNaN(fecha.getTime()) ? 'N/D' : fecha.toLocaleString('es-CR');
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
        init,
        verDetalle
    };
})();