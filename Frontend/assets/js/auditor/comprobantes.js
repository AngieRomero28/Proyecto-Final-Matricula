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

            console.log("🔍 comprobantes backend:", comprobantes);

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
                String(item.NombreEstudiante || item.nombreEstudiante || '').toLowerCase().includes(texto) ||
                String(item.NumeroFactura || item.numeroFactura || '').toLowerCase().includes(texto) ||
                String(item.ComprobanteMatricula || item.ComprobanteID || item.comprobante || '').toLowerCase().includes(texto)
            );
        });

        renderTabla();
    }

    function obtenerIdComprobante(item) {
        return (
            item.ComprobanteMatricula ??
            item.ComprobanteID ??
            item.comprobante ??
            item.MatriculaID ??
            'N/D'
        );
    }

    function obtenerFecha(item) {
        return (
            item.FechaComprobante ??
            item.FechaMatricula ??
            item.Fecha ??
            null
        );
    }

    function obtenerMonto(item) {
        return (
            item.MontoTotal ??
            item.CostoTotal ??
            item.Total ??
            0
        );
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
                const fechaA = new Date(obtenerFecha(a) || 0).getTime();
                const fechaB = new Date(obtenerFecha(b) || 0).getTime();
                return fechaB - fechaA;
            })
            .map((item) => `
                <tr>
                    <td>${escapeHtml(obtenerIdComprobante(item))}</td>
                    <td>${escapeHtml(item.NombreEstudiante || item.nombreEstudiante || 'N/D')}</td>
                    <td>${escapeHtml(item.NumeroFactura || item.numeroFactura || 'N/D')}</td>
                    <td>${escapeHtml(formatearFecha(obtenerFecha(item)))}</td>
                    <td>${escapeHtml(window.Helpers.formatCurrency(obtenerMonto(item)))}</td>
                </tr>
            `).join('');
    }

    return {
        init
    };
})();