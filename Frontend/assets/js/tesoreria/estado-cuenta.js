window.Modules = window.Modules || {};

window.Modules.tesoreriaEstadoCuenta = (function () {
    let data = [];
    let filtrado = [];

    async function init() {
        await cargarDatos();
        configurarEventos();
    }

    function configurarEventos() {
        const btn = document.getElementById('btn-filtrar-tesoreria-ec');
        const input = document.getElementById('filtro-tesoreria-ec-buscar');
        const estado = document.getElementById('filtro-tesoreria-ec-estado');

        if (btn && !btn.dataset.bound) {
            btn.dataset.bound = 'true';
            btn.addEventListener('click', aplicarFiltros);
        }

        if (input && !input.dataset.bound) {
            input.dataset.bound = 'true';
            input.addEventListener('input', aplicarFiltros);
        }

        if (estado && !estado.dataset.bound) {
            estado.dataset.bound = 'true';
            estado.addEventListener('change', aplicarFiltros);
        }
    }

    async function cargarDatos() {
        const tabla = document.getElementById('tabla-tesoreria-estado-cuenta');

        try {
            const response = await window.ApiService.obtenerEstadosCuenta();
            data = Array.isArray(response.data) ? response.data : [];
            filtrado = [...data];

            renderResumen(filtrado);
            renderTabla(filtrado);
        } catch (error) {
            console.error('Error cargando estado de cuenta:', error);
            window.UI.showMessage(
                'tesoreria-estado-cuenta-message',
                'danger',
                error.message || 'Error cargando estado de cuenta.'
            );

            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="8">Error cargando estado de cuenta.</td></tr>';
            }
        }
    }

    function aplicarFiltros() {
        const texto = String(document.getElementById('filtro-tesoreria-ec-buscar')?.value || '')
            .trim()
            .toLowerCase();

        const estado = String(document.getElementById('filtro-tesoreria-ec-estado')?.value || '')
            .trim()
            .toLowerCase();

        filtrado = data.filter((item) => {
            const coincideTexto =
                !texto ||
                String(item.NombreEstudiante || item.Estudiante || '').toLowerCase().includes(texto) ||
                String(item.NumeroFactura || item.FacturaID || '').toLowerCase().includes(texto) ||
                String(item.NombrePeriodo || '').toLowerCase().includes(texto);

            const estadoCuenta = String(item.EstadoCuenta || item.Estado || '').trim().toLowerCase();
            const coincideEstado = !estado || estadoCuenta === estado;

            return coincideTexto && coincideEstado;
        });

        renderResumen(filtrado);
        renderTabla(filtrado);
    }

    function renderResumen(lista) {
        const total = lista.length;
        const monto = lista.reduce((a, i) => a + Number(i.MontoTotal || i.Total || 0), 0);
        const pagado = lista.reduce((a, i) => a + Number(i.MontoPagado || 0), 0);
        const pendiente = lista.reduce((a, i) => a + Number(i.SaldoPendiente || 0), 0);

        setText('tesoreria-ec-total', total);
        setText('tesoreria-ec-monto-total', window.Helpers.formatCurrency(monto));
        setText('tesoreria-ec-monto-pagado', window.Helpers.formatCurrency(pagado));
        setText('tesoreria-ec-saldo-pendiente', window.Helpers.formatCurrency(pendiente));
    }

    function renderTabla(lista) {
        const tabla = document.getElementById('tabla-tesoreria-estado-cuenta');
        if (!tabla) return;

        if (!lista.length) {
            tabla.innerHTML = '<tr><td colspan="8">No hay datos.</td></tr>';
            return;
        }

        tabla.innerHTML = lista
            .sort((a, b) => {
                const fechaA = new Date(a.FechaActualizacion || a.Fecha || 0).getTime();
                const fechaB = new Date(b.FechaActualizacion || b.Fecha || 0).getTime();
                return fechaB - fechaA;
            })
            .map((item) => `
                <tr>
                    <td>${escapeHtml(item.EstadoCuentaID || 'N/D')}</td>
                    <td>${escapeHtml(item.NumeroFactura || item.FacturaID || 'N/D')}</td>
                    <td>${escapeHtml(item.NombreEstudiante || item.Estudiante || 'N/D')}</td>
                    <td>${escapeHtml(item.NombrePeriodo || 'N/D')}</td>
                    <td>${escapeHtml(window.Helpers.formatCurrency(item.MontoTotal || item.Total || 0))}</td>
                    <td>${escapeHtml(window.Helpers.formatCurrency(item.MontoPagado || 0))}</td>
                    <td>${escapeHtml(window.Helpers.formatCurrency(item.SaldoPendiente || 0))}</td>
                    <td>
                        <span class="badge ${getBadgeEstado(item.EstadoCuenta || item.Estado || 'N/D')}">
                            ${escapeHtml(item.EstadoCuenta || item.Estado || 'N/D')}
                        </span>
                    </td>
                </tr>
            `).join('');
    }

    return { init };
})();