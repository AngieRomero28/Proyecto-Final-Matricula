window.Modules = window.Modules || {};

window.Modules.auditorAuditoria = (function () {
    let eventos = [];
    let filtrados = [];

    async function init() {
        await cargarAuditoria();
        configurarEventos();
    }

    function configurarEventos() {
        const btnFiltrar = document.getElementById('btn-filtrar-auditor-auditoria');
        const inputUsuario = document.getElementById('filtro-auditor-usuario');
        const inputAccion = document.getElementById('filtro-auditor-accion');
        const inputFecha = document.getElementById('filtro-auditor-fecha');

        if (btnFiltrar && !btnFiltrar.dataset.bound) {
            btnFiltrar.dataset.bound = 'true';
            btnFiltrar.addEventListener('click', aplicarFiltros);
        }

        if (inputUsuario && !inputUsuario.dataset.bound) {
            inputUsuario.dataset.bound = 'true';
            inputUsuario.addEventListener('input', aplicarFiltros);
        }

        if (inputAccion && !inputAccion.dataset.bound) {
            inputAccion.dataset.bound = 'true';
            inputAccion.addEventListener('input', aplicarFiltros);
        }

        if (inputFecha && !inputFecha.dataset.bound) {
            inputFecha.dataset.bound = 'true';
            inputFecha.addEventListener('change', aplicarFiltros);
        }
    }

    async function cargarAuditoria() {
        const tabla = document.getElementById('tabla-auditor-auditoria');

        try {
            const response = await window.ApiService.obtenerAuditoria();
            eventos = Array.isArray(response.data) ? response.data : [];
            filtrados = [...eventos];
            renderTabla();
        } catch (error) {
            console.error('Error cargando auditoría:', error);
            window.UI.showMessage(
                'auditor-auditoria-message',
                'danger',
                error.message || 'No se pudo cargar la auditoría.'
            );

            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="5">Error cargando auditoría.</td></tr>';
            }
        }
    }

    function aplicarFiltros() {
        const usuario = String(document.getElementById('filtro-auditor-usuario')?.value || '')
            .trim()
            .toLowerCase();

        const accion = String(document.getElementById('filtro-auditor-accion')?.value || '')
            .trim()
            .toLowerCase();

        const fecha = String(document.getElementById('filtro-auditor-fecha')?.value || '').trim();

        filtrados = eventos.filter((item) => {
            const usuarioTexto = String(item.Usuario || item.username || '').toLowerCase();
            const accionTexto = String(item.Accion || item.accion || '').toLowerCase();
            const fechaTexto = String(item.Fecha || item.fecha || '');

            const coincideUsuario = !usuario || usuarioTexto.includes(usuario);
            const coincideAccion = !accion || accionTexto.includes(accion);
            const coincideFecha = !fecha || fechaTexto.slice(0, 10) === fecha;

            return coincideUsuario && coincideAccion && coincideFecha;
        });

        renderTabla();
    }

    function renderTabla() {
        const tabla = document.getElementById('tabla-auditor-auditoria');
        if (!tabla) return;

        if (!filtrados.length) {
            tabla.innerHTML = '<tr><td colspan="5">No hay eventos para mostrar.</td></tr>';
            return;
        }

        tabla.innerHTML = filtrados
            .sort((a, b) => {
                const fechaA = new Date(a.Fecha || a.fecha || 0).getTime();
                const fechaB = new Date(b.Fecha || b.fecha || 0).getTime();
                return fechaB - fechaA;
            })
            .map((item, index) => `
                <tr>
                    <td>${escapeHtml(item.AuditoriaID || item.id || index + 1)}</td>
                    <td>${escapeHtml(item.Usuario || item.username || 'N/D')}</td>
                    <td>${escapeHtml(item.Accion || item.accion || 'N/D')}</td>
                    <td>${escapeHtml(item.Descripcion || item.descripcion || 'Sin descripción')}</td>
                    <td>${escapeHtml(formatearFecha(item.Fecha || item.fecha))}</td>
                </tr>
            `).join('');
    }

    return {
        init
    };
})();