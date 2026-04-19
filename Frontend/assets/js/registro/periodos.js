// frontend/js/registro/periodos.js

window.Modules = window.Modules || {};

window.Modules.registroPeriodos = (function () {
    let periodos = [];
    let periodosFiltrados = [];

    async function init() {
        await cargarPeriodos();
        configurarEventos();
    }

    function configurarEventos() {
        const btnFiltrar = document.getElementById('btn-filtrar-registro-periodos');
        const inputBuscar = document.getElementById('filtro-registro-periodos');
        const selectEstado = document.getElementById('filtro-registro-estado-periodo');

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

    async function cargarPeriodos() {
        const tabla = document.getElementById('tabla-registro-periodos');

        try {
            window.UI.clearMessage('registro-periodos-message');

            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="7">Cargando períodos...</td></tr>';
            }

            const response = await window.ApiService.obtenerPeriodos();
            periodos = Array.isArray(response.data) ? response.data : [];
            periodosFiltrados = [...periodos];

            renderResumen();
            renderTabla();
        } catch (error) {
            console.error('Error cargando períodos:', error);
            window.UI.showMessage(
                'registro-periodos-message',
                'danger',
                error.message || 'No se pudieron cargar los períodos.'
            );

            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="7">Error cargando períodos.</td></tr>';
            }
        }
    }

    function aplicarFiltros() {
        const texto = String(document.getElementById('filtro-registro-periodos')?.value || '')
            .trim()
            .toLowerCase();

        const estado = String(document.getElementById('filtro-registro-estado-periodo')?.value || '')
            .trim()
            .toLowerCase();

        periodosFiltrados = periodos.filter((item) => {
            const coincideTexto =
                !texto ||
                String(item.NombrePeriodo || '').toLowerCase().includes(texto) ||
                String(item.TipoPeriodo || '').toLowerCase().includes(texto) ||
                String(item.Anio || '').toLowerCase().includes(texto);

            const estadoPeriodo = String(item.EstadoPeriodo || item.Estado || '')
                .trim()
                .toLowerCase();

            const coincideEstado = !estado || estadoPeriodo === estado;

            return coincideTexto && coincideEstado;
        });

        renderResumen();
        renderTabla();
    }

    function renderResumen() {
        const total = periodosFiltrados.length;

        const activos = periodosFiltrados.filter((item) =>
            String(item.EstadoPeriodo || item.Estado || '').trim().toLowerCase() === 'activo'
        ).length;

        const abiertosMatricula = periodosFiltrados.filter((item) => {
            const hoy = new Date();
            const inicio = new Date(item.FechaInicioMatricula);
            const fin = new Date(item.FechaFinMatricula);

            if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
                return false;
            }

            inicio.setHours(0, 0, 0, 0);
            fin.setHours(23, 59, 59, 999);

            return hoy >= inicio && hoy <= fin;
        }).length;

        setText('registro-periodos-total', total);
        setText('registro-periodos-activos', activos);
        setText('registro-periodos-matricula-abierta', abiertosMatricula);
    }

    function renderTabla() {
        const tabla = document.getElementById('tabla-registro-periodos');
        if (!tabla) return;

        if (!periodosFiltrados.length) {
            tabla.innerHTML = '<tr><td colspan="7">No hay períodos para mostrar.</td></tr>';
            return;
        }

        tabla.innerHTML = periodosFiltrados
            .sort((a, b) => {
                const anioA = Number(a.Anio || 0);
                const anioB = Number(b.Anio || 0);
                if (anioA !== anioB) return anioB - anioA;
                return Number(b.PeriodoID || 0) - Number(a.PeriodoID || 0);
            })
            .map((item) => `
                <tr>
                    <td>${escapeHtml(item.PeriodoID || 'N/D')}</td>
                    <td>${escapeHtml(item.NombrePeriodo || 'N/D')}</td>
                    <td>${escapeHtml(item.TipoPeriodo || 'N/D')}</td>
                    <td>${escapeHtml(formatearFecha(item.FechaInicio))}</td>
                    <td>${escapeHtml(formatearFecha(item.FechaFin))}</td>
                    <td>
                        <span class="badge ${getBadgeEstado(item.EstadoPeriodo || item.Estado || 'N/D')}">
                            ${escapeHtml(item.EstadoPeriodo || item.Estado || 'N/D')}
                        </span>
                    </td>
                    <td>
                        <button
                            class="btn btn-outline"
                            onclick="window.Modules.registroPeriodos.ver(${Number(item.PeriodoID)})"
                        >
                            Ver
                        </button>
                    </td>
                </tr>
            `).join('');
    }

    function ver(id) {
        const item = periodos.find((x) => Number(x.PeriodoID) === Number(id));
        if (!item) return;

        window.UI.openModal({
            title: 'Detalle del período',
            body: `
                <p><strong>ID:</strong> ${escapeHtml(item.PeriodoID)}</p>
                <p><strong>Nombre:</strong> ${escapeHtml(item.NombrePeriodo || 'N/D')}</p>
                <p><strong>Tipo:</strong> ${escapeHtml(item.TipoPeriodo || 'N/D')}</p>
                <p><strong>Año:</strong> ${escapeHtml(item.Anio || 'N/D')}</p>
                <p><strong>Fecha inicio:</strong> ${escapeHtml(formatearFecha(item.FechaInicio))}</p>
                <p><strong>Fecha fin:</strong> ${escapeHtml(formatearFecha(item.FechaFin))}</p>
                <p><strong>Inicio matrícula:</strong> ${escapeHtml(formatearFecha(item.FechaInicioMatricula))}</p>
                <p><strong>Fin matrícula:</strong> ${escapeHtml(formatearFecha(item.FechaFinMatricula))}</p>
                <p><strong>Estado:</strong> ${escapeHtml(item.EstadoPeriodo || item.Estado || 'N/D')}</p>
            `,
            hideFooter: true
        });
    }

    function getBadgeEstado(estado) {
        switch (String(estado || '').trim().toLowerCase()) {
            case 'activo':
                return 'badge-success';
            case 'cerrado':
            case 'inactivo':
            case 'finalizado':
                return 'badge-danger';
            case 'planeado':
                return 'badge-warning';
            default:
                return 'badge-gray';
        }
    }

    function formatearFecha(fecha) {
        if (!fecha) return 'N/D';

        const date = new Date(fecha);
        if (Number.isNaN(date.getTime())) return 'N/D';

        return date.toLocaleDateString('es-CR');
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
        ver
    };
})();