window.Modules = window.Modules || {};

window.Modules.auditoria = (function () {
    let registros = [];

    async function init() {
        await cargarAuditoria();
        configurarEventos();
    }

    function configurarEventos() {
        const btnFiltrar = document.getElementById('btn-filtrar-auditoria');

        if (btnFiltrar && !btnFiltrar.dataset.bound) {
            btnFiltrar.dataset.bound = 'true';
            btnFiltrar.addEventListener('click', aplicarFiltros);
        }
    }

    async function cargarAuditoria() {
        const tabla = document.getElementById('tabla-auditoria');

        try {
            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="5">Cargando...</td></tr>';
            }

            const res = await window.ApiService.obtenerAuditoria();
            registros = Array.isArray(res.data) ? res.data : [];

            renderTabla(registros);
        } catch (error) {
            console.error('Error cargando auditoría:', error);
            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="5">Error cargando datos</td></tr>';
            }
        }
    }

    function renderTabla(data) {
        const tabla = document.getElementById('tabla-auditoria');
        if (!tabla) return;

        if (!data.length) {
            tabla.innerHTML = '<tr><td colspan="5">No hay registros</td></tr>';
            return;
        }

        tabla.innerHTML = data.map((r, index) => `
            <tr>
                <td>${escapeHtml(r.AuditoriaID ?? index + 1)}</td>
                <td>${escapeHtml(r.Usuario || r.username || 'N/D')}</td>
                <td>
                    <span class="badge ${getBadge(r.Accion || r.accion)}">
                        ${escapeHtml(r.Accion || r.accion || 'N/D')}
                    </span>
                </td>
                <td>${escapeHtml(r.Descripcion || r.descripcion || 'Sin descripción')}</td>
                <td>${escapeHtml(formatearFecha(r.Fecha || r.fecha))}</td>
            </tr>
        `).join('');
    }

    function aplicarFiltros() {
        const usuario = String(document.getElementById('filtro-usuario')?.value || '')
            .trim()
            .toLowerCase();

        const accion = String(document.getElementById('filtro-accion')?.value || '')
            .trim()
            .toLowerCase();

        const fecha = String(document.getElementById('filtro-fecha')?.value || '').trim();

        let filtrados = [...registros];

        if (usuario) {
            filtrados = filtrados.filter((r) =>
                String(r.Usuario || r.username || '').toLowerCase().includes(usuario)
            );
        }

        if (accion) {
            filtrados = filtrados.filter((r) =>
                String(r.Accion || r.accion || '').toLowerCase().includes(accion)
            );
        }

        if (fecha) {
            filtrados = filtrados.filter((r) => {
                const valorFecha = r.Fecha || r.fecha;
                const fechaRegistro = new Date(valorFecha);

                if (Number.isNaN(fechaRegistro.getTime())) {
                    return false;
                }

                const yyyy = fechaRegistro.getFullYear();
                const mm = String(fechaRegistro.getMonth() + 1).padStart(2, '0');
                const dd = String(fechaRegistro.getDate()).padStart(2, '0');

                return `${yyyy}-${mm}-${dd}` === fecha;
            });
        }

        renderTabla(filtrados);
    }

    function getBadge(accion) {
        switch (String(accion || '').trim().toUpperCase()) {
            case 'CREAR_MATRICULA':
                return 'badge-success';
            case 'REGISTRAR_PAGO':
                return 'badge-info';
            case 'ANULAR_MATRICULA':
            case 'ELIMINAR_USUARIO':
            case 'BLOQUEAR_USUARIO':
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