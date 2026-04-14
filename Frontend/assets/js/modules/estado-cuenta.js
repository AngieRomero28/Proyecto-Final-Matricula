window.Modules = window.Modules || {};

window.Modules.estadoCuenta = (function () {
    let estadosCuenta = [];
    let estadosCuentaFiltrados = [];

    async function init() {
        await cargarEstadosCuenta();
        configurarEventos();
    }

    function configurarEventos() {
        const btnFiltrar = document.getElementById('btn-filtrar-estado-cuenta');
        const inputBuscar = document.getElementById('filtro-estado-cuenta-buscar');
        const selectEstado = document.getElementById('filtro-estado-cuenta-estado');

        if (btnFiltrar) {
            btnFiltrar.addEventListener('click', aplicarFiltros);
        }

        if (inputBuscar) {
            inputBuscar.addEventListener('input', aplicarFiltros);
        }

        if (selectEstado) {
            selectEstado.addEventListener('change', aplicarFiltros);
        }
    }

    async function cargarEstadosCuenta() {
        const tabla = document.getElementById('tabla-estado-cuenta');

        try {
            if (tabla) {
                tabla.innerHTML = `<tr><td colspan="9">Cargando estados de cuenta...</td></tr>`;
            }

            const response = await ApiService.obtenerEstadosCuenta();
            estadosCuenta = Array.isArray(response.data) ? response.data : [];
            estadosCuentaFiltrados = [...estadosCuenta];

            renderResumen();
            renderTabla();
        } catch (error) {
            console.error('Error cargando estados de cuenta:', error);
            if (tabla) {
                tabla.innerHTML = `<tr><td colspan="9">Error cargando estados de cuenta</td></tr>`;
            }
            UI.showMessage('estado-cuenta-message', 'danger', error.message || 'No se pudieron cargar los estados de cuenta.');
        }
    }

    function aplicarFiltros() {
        const texto = String(document.getElementById('filtro-estado-cuenta-buscar')?.value || '').trim().toLowerCase();
        const estado = String(document.getElementById('filtro-estado-cuenta-estado')?.value || '').trim();

        estadosCuentaFiltrados = estadosCuenta.filter((item) => {
            const coincideTexto =
                !texto ||
                String(item.NumeroFactura || '').toLowerCase().includes(texto) ||
                String(item.NombreEstudiante || '').toLowerCase().includes(texto) ||
                String(item.Carnet || '').toLowerCase().includes(texto) ||
                String(item.NombrePeriodo || '').toLowerCase().includes(texto);

            const coincideEstado =
                !estado || String(item.EstadoCuenta || '') === estado;

            return coincideTexto && coincideEstado;
        });

        renderResumen();
        renderTabla();
    }

    function renderResumen() {
        const totalRegistros = estadosCuentaFiltrados.length;
        const montoTotal = estadosCuentaFiltrados.reduce((acc, item) => acc + Number(item.MontoTotal || 0), 0);
        const montoPagado = estadosCuentaFiltrados.reduce((acc, item) => acc + Number(item.MontoPagado || 0), 0);
        const saldoPendiente = estadosCuentaFiltrados.reduce((acc, item) => acc + Number(item.SaldoPendiente || 0), 0);

        setText('estado-cuenta-total', totalRegistros);
        setText('estado-cuenta-monto-total', Helpers.formatCurrency(montoTotal));
        setText('estado-cuenta-monto-pagado', Helpers.formatCurrency(montoPagado));
        setText('estado-cuenta-saldo-pendiente', Helpers.formatCurrency(saldoPendiente));
    }

    function renderTabla() {
        const tabla = document.getElementById('tabla-estado-cuenta');
        if (!tabla) return;

        if (!estadosCuentaFiltrados.length) {
            tabla.innerHTML = `<tr><td colspan="9">No hay estados de cuenta para mostrar</td></tr>`;
            return;
        }

        tabla.innerHTML = estadosCuentaFiltrados.map((item) => `
            <tr>
                <td>${item.EstadoCuentaID}</td>
                <td>${escapeHtml(item.NumeroFactura || '')}</td>
                <td>${escapeHtml(item.NombreEstudiante || '')}</td>
                <td>${escapeHtml(item.NombrePeriodo || '')}</td>
                <td>${Helpers.formatCurrency(item.MontoTotal || 0)}</td>
                <td>${Helpers.formatCurrency(item.MontoPagado || 0)}</td>
                <td>${Helpers.formatCurrency(item.SaldoPendiente || 0)}</td>
                <td>
                    <span class="badge ${getBadgeEstado(item.EstadoCuenta)}">
                        ${escapeHtml(item.EstadoCuenta || 'N/D')}
                    </span>
                </td>
                <td>
                    <button class="btn btn-outline" onclick="Modules.estadoCuenta.verDetalle(${item.EstadoCuentaID})">
                        Ver
                    </button>
                </td>
            </tr>
        `).join('');
    }

    function verDetalle(id) {
        const item = estadosCuenta.find((ec) => Number(ec.EstadoCuentaID) === Number(id));
        if (!item) return;

        UI.openModal({
            title: `Estado de cuenta #${item.EstadoCuentaID}`,
            body: `
                <div class="resumen-financiero">
                    <div class="mini-card">
                        <div class="mini-card-label">Monto total</div>
                        <div class="mini-card-value">${Helpers.formatCurrency(item.MontoTotal || 0)}</div>
                    </div>
                    <div class="mini-card">
                        <div class="mini-card-label">Pagado</div>
                        <div class="mini-card-value">${Helpers.formatCurrency(item.MontoPagado || 0)}</div>
                    </div>
                    <div class="mini-card">
                        <div class="mini-card-label">Saldo pendiente</div>
                        <div class="mini-card-value">${Helpers.formatCurrency(item.SaldoPendiente || 0)}</div>
                    </div>
                </div>

                <div class="mt-2">
                    <p><strong>Factura:</strong> ${escapeHtml(item.NumeroFactura || '')}</p>
                    <p><strong>Fecha emisión:</strong> ${formatearFecha(item.FechaEmision)}</p>
                    <p><strong>Fecha generación:</strong> ${formatearFecha(item.FechaGeneracion)}</p>
                    <p><strong>Última actualización:</strong> ${formatearFecha(item.FechaActualizacion)}</p>
                    <p><strong>Estudiante:</strong> ${escapeHtml(item.NombreEstudiante || '')}</p>
                    <p><strong>Carnet:</strong> ${escapeHtml(item.Carnet || '')}</p>
                    <p><strong>Correo:</strong> ${escapeHtml(item.CorreoInstitucional || '')}</p>
                    <p><strong>Período:</strong> ${escapeHtml(item.NombrePeriodo || '')} ${escapeHtml(item.TipoPeriodo || '')} ${item.Anio ? `(${item.Anio})` : ''}</p>
                    <p><strong>Estado cuenta:</strong> ${escapeHtml(item.EstadoCuenta || '')}</p>
                    <p><strong>Estado factura:</strong> ${escapeHtml(item.EstadoFactura || '')}</p>
                    <p><strong>Estado matrícula:</strong> ${escapeHtml(item.EstadoMatricula || 'N/D')}</p>
                    <p><strong>Comprobante:</strong> ${escapeHtml(item.ComprobanteMatricula || 'N/D')}</p>
                </div>
            `,
            hideFooter: true
        });
    }

    function getBadgeEstado(estado) {
        switch (estado) {
            case 'Pagado':
                return 'badge-success';
            case 'Pendiente':
                return 'badge-warning';
            case 'Vencido':
                return 'badge-danger';
            default:
                return 'badge-gray';
        }
    }

    function formatearFecha(valor) {
        if (!valor) return 'N/D';
        const fecha = new Date(valor);
        return Number.isNaN(fecha.getTime()) ? 'N/D' : fecha.toLocaleString();
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