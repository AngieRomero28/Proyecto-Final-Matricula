window.Modules = window.Modules || {};

window.Modules.auditoria = (function () {
    let registros = [];

    async function init() {
        await cargarAuditoria();
        configurarEventos();
    }

    function configurarEventos() {
        const btnFiltrar = document.getElementById('btn-filtrar-auditoria');

        if (btnFiltrar) {
            btnFiltrar.addEventListener('click', aplicarFiltros);
        }
    }

    async function cargarAuditoria() {
        const tabla = document.getElementById('tabla-auditoria');

        try {
            tabla.innerHTML = `<tr><td colspan="5">Cargando...</td></tr>`;

            const res = await ApiService.obtenerAuditoria();
            registros = res.data || [];

            renderTabla(registros);
        } catch (error) {
            console.error(error);
            tabla.innerHTML = `<tr><td colspan="5">Error cargando datos</td></tr>`;
        }
    }

    function renderTabla(data) {
        const tabla = document.getElementById('tabla-auditoria');

        if (!data.length) {
            tabla.innerHTML = `<tr><td colspan="5">No hay registros</td></tr>`;
            return;
        }

        tabla.innerHTML = data.map((r) => `
            <tr>
                <td>${r.AuditoriaID}</td>
                <td>${r.Usuario}</td>
                <td>
                    <span class="badge ${getBadge(r.Accion)}">
                        ${r.Accion}
                    </span>
                </td>
                <td>${r.Descripcion}</td>
                <td>${new Date(r.Fecha).toLocaleString()}</td>
            </tr>
        `).join('');
    }

    function aplicarFiltros() {
        const usuario = document.getElementById('filtro-usuario').value.trim().toLowerCase();
        const accion = document.getElementById('filtro-accion').value.trim().toLowerCase();
        const fecha = document.getElementById('filtro-fecha').value;

        let filtrados = [...registros];

        if (usuario) {
            filtrados = filtrados.filter((r) =>
                String(r.Usuario).toLowerCase().includes(usuario)
            );
        }

        if (accion) {
            filtrados = filtrados.filter((r) =>
                String(r.Accion).toLowerCase().includes(accion)
            );
        }

        if (fecha) {
            filtrados = filtrados.filter((r) => {
                const fechaRegistro = new Date(r.Fecha);
                const yyyy = fechaRegistro.getFullYear();
                const mm = String(fechaRegistro.getMonth() + 1).padStart(2, '0');
                const dd = String(fechaRegistro.getDate()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}` === fecha;
            });
        }

        renderTabla(filtrados);
    }

    function getBadge(accion) {
        switch (accion) {
            case 'CREAR_MATRICULA':
                return 'badge-success';
            case 'REGISTRAR_PAGO':
                return 'badge-info';
            default:
                return 'badge-gray';
        }
    }

    return {
        init
    };
})();