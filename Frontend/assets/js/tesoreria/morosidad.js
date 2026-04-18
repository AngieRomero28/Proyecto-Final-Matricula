window.Modules = window.Modules || {};

window.Modules.tesoreriaMorosidad = (function () {
    let data = [];
    let filtrado = [];

    async function init() {
        await cargarDatos();
        configurarEventos();
    }

    function configurarEventos() {
        const btn = document.getElementById('btn-filtrar-morosidad');
        const input = document.getElementById('filtro-morosidad-buscar');

        if (btn && !btn.dataset.bound) {
            btn.dataset.bound = 'true';
            btn.addEventListener('click', aplicarFiltros);
        }

        if (input && !input.dataset.bound) {
            input.dataset.bound = 'true';
            input.addEventListener('input', aplicarFiltros);
        }
    }

    async function cargarDatos() {
        const tabla = document.getElementById('tabla-tesoreria-morosidad');

        try {
            const response = await window.ApiService.obtenerFacturas();
            const facturas = Array.isArray(response.data) ? response.data : [];

            data = facturas.filter((f) => Number(f.SaldoPendiente || 0) > 0);
            filtrado = [...data];

            renderResumen();
            renderTabla();
        } catch (error) {
            console.error('Error cargando morosidad:', error);
            window.UI.showMessage(
                'tesoreria-morosidad-message',
                'danger',
                error.message || 'Error cargando morosidad.'
            );

            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="6">Error cargando morosidad.</td></tr>';
            }
        }
    }

    function aplicarFiltros() {
        const texto = String(document.getElementById('filtro-morosidad-buscar')?.value || '')
            .trim()
            .toLowerCase();

        filtrado = data.filter((item) => {
            return (
                !texto ||
                String(item.NombreEstudiante || item.Estudiante || '').toLowerCase().includes(texto) ||
                String(item.Carnet || '').toLowerCase().includes(texto) ||
                String(item.NumeroFactura || '').toLowerCase().includes(texto)
            );
        });

        renderResumen();
        renderTabla();
    }

    function renderResumen() {
        const total = filtrado.length;
        const monto = filtrado.reduce((a, i) => a + Number(i.SaldoPendiente || 0), 0);

        setText('tesoreria-morosidad-total', total);
        setText('tesoreria-morosidad-monto', window.Helpers.formatCurrency(monto));
    }

    function renderTabla() {
        const tabla = document.getElementById('tabla-tesoreria-morosidad');
        if (!tabla) return;

        if (!filtrado.length) {
            tabla.innerHTML = '<tr><td colspan="6">No hay morosidad.</td></tr>';
            return;
        }

        tabla.innerHTML = filtrado
            .sort((a, b) => {
                const fechaA = new Date(a.FechaFactura || a.Fecha || 0).getTime();
                const fechaB = new Date(b.FechaFactura || b.Fecha || 0).getTime();
                return fechaB - fechaA;
            })
            .map((item) => `
                <tr>
                    <td>${escapeHtml(item.NombreEstudiante || item.Estudiante || 'N/D')}</td>
                    <td>${escapeHtml(item.Carnet || 'N/D')}</td>
                    <td>${escapeHtml(window.Helpers.formatCurrency(item.SaldoPendiente || 0))}</td>
                    <td>${escapeHtml(obtenerMotivo(item))}</td>
                    <td>${escapeHtml(formatearFecha(item.FechaFactura || item.Fecha))}</td>
                    <td>
                        <span class="badge badge-danger">Moroso</span>
                    </td>
                </tr>
            `).join('');
    }

    function obtenerMotivo(item) {
        if (Number(item.SaldoPendiente || 0) > 0) {
            return 'Saldo pendiente';
        }

        return item.Motivo || 'Restricción financiera';
    }

    return { init };
})();