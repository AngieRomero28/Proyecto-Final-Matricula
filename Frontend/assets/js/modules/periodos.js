window.Modules = window.Modules || {};

window.Modules.periodos = (function () {
    let periodos = [];

    async function init() {
        await cargarPeriodos();
        configurarEventos();
    }

    function configurarEventos() {
        const btnNuevo = document.getElementById('btn-nuevo-periodo');

        if (btnNuevo) {
            btnNuevo.textContent = 'Actualizar listado';
            btnNuevo.onclick = manejarRecargaPeriodos;
        }
    }

    async function manejarRecargaPeriodos() {
        UI.clearMessage('periodos-message');

        try {
            await cargarPeriodos();
            UI.showMessage(
                'periodos-message',
                'success',
                'Listado de períodos actualizado correctamente.'
            );
        } catch (error) {
            UI.showMessage(
                'periodos-message',
                'danger',
                error.message || 'No se pudo actualizar el listado.'
            );
        }
    }

    async function cargarPeriodos() {
        const tabla = document.getElementById('tabla-periodos');
        if (!tabla) return;

        try {
            tabla.innerHTML = `<tr><td colspan="7">Cargando...</td></tr>`;

            const response = await ApiService.obtenerPeriodos();
            periodos = Array.isArray(response.data) ? response.data : [];

            renderTabla();
        } catch (error) {
            console.error('Error cargando períodos:', error);
            tabla.innerHTML = `<tr><td colspan="7">Error cargando datos</td></tr>`;
            throw error;
        }
    }

    function renderTabla() {
        const tabla = document.getElementById('tabla-periodos');
        if (!tabla) return;

        if (!periodos.length) {
            tabla.innerHTML = `<tr><td colspan="7">No hay períodos registrados</td></tr>`;
            return;
        }

        tabla.innerHTML = periodos.map((p) => {
            const estado = p.EstadoPeriodo || 'N/D';
            const badgeClass = getBadgeEstado(estado);

            return `
                <tr>
                    <td>${escapeHtml(p.PeriodoID)}</td>
                    <td>${escapeHtml(p.NombrePeriodo || 'N/D')}</td>
                    <td>${escapeHtml(p.TipoPeriodo || 'N/D')}</td>
                    <td>${escapeHtml(formatearFecha(p.FechaInicio))}</td>
                    <td>${escapeHtml(formatearFecha(p.FechaFin))}</td>
                    <td>
                        <span class="badge ${badgeClass}">
                            ${escapeHtml(estado)}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-outline" onclick="Modules.periodos.ver(${Number(p.PeriodoID)})">
                            Ver
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function ver(id) {
        const p = periodos.find((x) => Number(x.PeriodoID) === Number(id));
        if (!p) return;

        UI.openModal({
            title: 'Detalle del período',
            body: `
                <p><strong>ID:</strong> ${escapeHtml(p.PeriodoID)}</p>
                <p><strong>Nombre:</strong> ${escapeHtml(p.NombrePeriodo || 'N/D')}</p>
                <p><strong>Tipo:</strong> ${escapeHtml(p.TipoPeriodo || 'N/D')}</p>
                <p><strong>Año:</strong> ${escapeHtml(p.Anio || 'N/D')}</p>
                <p><strong>Fecha inicio:</strong> ${escapeHtml(formatearFecha(p.FechaInicio))}</p>
                <p><strong>Fecha fin:</strong> ${escapeHtml(formatearFecha(p.FechaFin))}</p>
                <p><strong>Inicio matrícula:</strong> ${escapeHtml(formatearFecha(p.FechaInicioMatricula))}</p>
                <p><strong>Fin matrícula:</strong> ${escapeHtml(formatearFecha(p.FechaFinMatricula))}</p>
                <p><strong>Estado:</strong> ${escapeHtml(p.EstadoPeriodo || 'N/D')}</p>
            `,
            hideFooter: true
        });
    }

    function getBadgeEstado(estado) {
        switch (String(estado || '').toLowerCase()) {
            case 'activo':
                return 'badge-success';
            case 'inactivo':
            case 'cerrado':
                return 'badge-danger';
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