// frontend/js/registro/comprobantes.js

window.Modules = window.Modules || {};

window.Modules.registroComprobantes = (function () {
    let comprobantes = [];
    let filtrados = [];

    async function init() {
        await cargarComprobantes();
        configurarEventos();
    }

    function configurarEventos() {
        const btn = document.getElementById('btn-filtrar-registro-comprobante');
        const input = document.getElementById('filtro-registro-comprobante');

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
        const tabla = document.getElementById('tabla-registro-comprobantes');

        try {
            window.UI.clearMessage('registro-comprobantes-message');

            const response = await window.ApiService.obtenerComprobantes();
            comprobantes = Array.isArray(response.data) ? response.data : [];
            filtrados = [...comprobantes];

            renderTabla();
        } catch (error) {
            console.error('Error cargando comprobantes:', error);
            window.UI.showMessage(
                'registro-comprobantes-message',
                'danger',
                error.message || 'No se pudieron cargar los comprobantes.'
            );

            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="6">Error cargando comprobantes.</td></tr>';
            }
        }
    }

    function aplicarFiltros() {
        const texto = String(document.getElementById('filtro-registro-comprobante')?.value || '')
            .trim()
            .toLowerCase();

        filtrados = comprobantes.filter((item) => {
            return (
                !texto ||
                String(item.NombreEstudiante || item.Estudiante || '').toLowerCase().includes(texto) ||
                String(item.NumeroFactura || item.FacturaID || '').toLowerCase().includes(texto) ||
                String(item.ComprobanteMatricula || item.Comprobante || item.MatriculaID || '').toLowerCase().includes(texto) ||
                String(item.Carnet || '').toLowerCase().includes(texto)
            );
        });

        renderTabla();
    }

    function renderTabla() {
        const tabla = document.getElementById('tabla-registro-comprobantes');
        if (!tabla) return;

        if (!filtrados.length) {
            tabla.innerHTML = '<tr><td colspan="6">No hay comprobantes para mostrar.</td></tr>';
            return;
        }

        tabla.innerHTML = filtrados
            .sort((a, b) => {
                const fechaA = new Date(a.FechaMatricula || a.FechaComprobante || a.Fecha || 0).getTime();
                const fechaB = new Date(b.FechaMatricula || b.FechaComprobante || b.Fecha || 0).getTime();
                return fechaB - fechaA;
            })
            .map((item) => `
                <tr>
                    <td>${escapeHtml(item.ComprobanteMatricula || item.Comprobante || `CMP-${item.MatriculaID || 'N/D'}`)}</td>
                    <td>${escapeHtml(item.NombreEstudiante || item.Estudiante || 'N/D')}</td>
                    <td>${escapeHtml(item.Carnet || 'N/D')}</td>
                    <td>${escapeHtml(item.NumeroFactura || 'N/D')}</td>
                    <td>${escapeHtml(formatearFecha(item.FechaMatricula || item.FechaComprobante || item.Fecha))}</td>
                    <td>${escapeHtml(window.Helpers.formatCurrency(item.MontoTotal || item.CostoTotal || item.Total || 0))}</td>
                </tr>
            `).join('');
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
        init
    };
})();