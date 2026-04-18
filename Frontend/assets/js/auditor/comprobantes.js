window.Modules = window.Modules || {};

window.Modules.auditorComprobantes = (function () {
    let comprobantes = [];
    let filtrados = [];

    async function init() {
        await cargarComprobantes();
        configurarEventos();
    }

    function configurarEventos() {
        const btn = document.getElementById('btn-filtrar-auditor-comprobante');
        const input = document.getElementById('filtro-auditor-comprobante');

        if (btn && !btn.dataset.bound) {
            btn.dataset.bound = 'true';
            btn.addEventListener('click', aplicarFiltros);
        }

        if (input && !input.dataset.bound) {
            input.dataset.bound = 'true';
            input.addEventListener('input', aplicarFiltros);
        }
    }

    async function cargarComprobantes() {
        const tabla = document.getElementById('tabla-auditor-comprobantes');

        try {
            const response = await window.ApiService.obtenerComprobantes();
            comprobantes = Array.isArray(response.data) ? response.data : [];
            filtrados = [...comprobantes];
            renderTabla();
        } catch (error) {
            console.error('Error cargando comprobantes:', error);
            window.UI.showMessage(
                'auditor-comprobantes-message',
                'danger',
                error.message || 'No se pudieron cargar los comprobantes.'
            );

            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="5">Error cargando comprobantes.</td></tr>';
            }
        }
    }

    function aplicarFiltros() {
        const texto = String(document.getElementById('filtro-auditor-comprobante')?.value || '')
            .trim()
            .toLowerCase();

        filtrados = comprobantes.filter((item) => {
            return (
                !texto ||
                String(item.NombreEstudiante || item.Estudiante || '').toLowerCase().includes(texto) ||
                String(item.NumeroFactura || item.FacturaID || '').toLowerCase().includes(texto) ||
                String(item.Comprobante || item.ComprobanteID || '').toLowerCase().includes(texto)
            );
        });

        renderTabla();
    }

    function renderTabla() {
        const tabla = document.getElementById('tabla-auditor-comprobantes');
        if (!tabla) return;

        if (!filtrados.length) {
            tabla.innerHTML = '<tr><td colspan="5">No hay comprobantes para mostrar.</td></tr>';
            return;
        }

        tabla.innerHTML = filtrados
            .sort((a, b) => {
                const fechaA = new Date(a.FechaComprobante || a.FechaMatricula || a.Fecha || 0).getTime();
                const fechaB = new Date(b.FechaComprobante || b.FechaMatricula || b.Fecha || 0).getTime();
                return fechaB - fechaA;
            })
            .map((item) => `
                <tr>
                    <td>${escapeHtml(item.Comprobante || item.ComprobanteID || 'N/D')}</td>
                    <td>${escapeHtml(item.NombreEstudiante || item.Estudiante || 'N/D')}</td>
                    <td>${escapeHtml(item.NumeroFactura || item.FacturaID || 'N/D')}</td>
                    <td>${escapeHtml(formatearFecha(item.FechaComprobante || item.FechaMatricula || item.Fecha))}</td>
                    <td>${escapeHtml(window.Helpers.formatCurrency(item.MontoTotal || item.CostoTotal || item.Total || 0))}</td>
                </tr>
            `).join('');
    }

    return {
        init
    };
})();