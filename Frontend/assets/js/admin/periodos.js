window.Modules = window.Modules || {};

window.Modules.adminPeriodos = (function () {
    let periodos = [];
    let periodosFiltrados = [];

    async function init() {
        await cargarPeriodos();
        configurarEventos();
    }

    function configurarEventos() {
        const btnActualizar = document.getElementById('btn-admin-nuevo-periodo');
        const btnFiltrar = document.getElementById('btn-filtrar-admin-periodos');
        const inputBuscar = document.getElementById('filtro-admin-periodos');
        const selectEstado = document.getElementById('filtro-admin-estado-periodo');

        if (btnActualizar && !btnActualizar.dataset.bound) {
            btnActualizar.dataset.bound = 'true';
            btnActualizar.textContent = 'Actualizar listado';
            btnActualizar.addEventListener('click', manejarRecargaPeriodos);
        }

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

    async function manejarRecargaPeriodos() {
        window.UI.clearMessage('admin-periodos-message');

        try {
            await cargarPeriodos();
            window.UI.showMessage(
                'admin-periodos-message',
                'success',
                'Listado actualizado correctamente.'
            );
        } catch (error) {
            window.UI.showMessage(
                'admin-periodos-message',
                'danger',
                error.message || 'No se pudo actualizar el listado.'
            );
        }
    }

    async function cargarPeriodos() {
        const tabla = document.getElementById('tabla-admin-periodos');
        if (!tabla) return;

        try {
            tabla.innerHTML = '<tr><td colspan="7">Cargando...</td></tr>';

            const response = await window.ApiService.obtenerPeriodos();
            periodos = Array.isArray(response.data) ? response.data : [];
            periodosFiltrados = [...periodos];

            renderResumen(periodosFiltrados);
            renderTabla();
        } catch (error) {
            console.error('Error cargando períodos:', error);
            tabla.innerHTML = '<tr><td colspan="7">Error cargando datos</td></tr>';
            throw error;
        }
    }

    function aplicarFiltros() {
        const texto = String(document.getElementById('filtro-admin-periodos')?.value || '')
            .trim()
            .toLowerCase();

        const estado = String(document.getElementById('filtro-admin-estado-periodo')?.value || '')
            .trim()
            .toLowerCase();

        periodosFiltrados = periodos.filter((p) => {
            const coincideTexto =
                !texto ||
                String(p.NombrePeriodo || '').toLowerCase().includes(texto) ||
                String(p.TipoPeriodo || '').toLowerCase().includes(texto) ||
                String(p.Anio || '').toLowerCase().includes(texto) ||
                String(p.PeriodoID || '').toLowerCase().includes(texto);

            const estadoPeriodo = String(p.EstadoPeriodo || p.Estado || '')
                .trim()
                .toLowerCase();

            const coincideEstado = !estado || estadoPeriodo === estado;

            return coincideTexto && coincideEstado;
        });

        renderResumen(periodosFiltrados);
        renderTabla();
    }

    function renderResumen(data) {
        const total = data.length;

        const activos = data.filter((p) =>
            String(p.EstadoPeriodo || p.Estado || '').trim().toLowerCase() === 'activo'
        ).length;

        const abiertos = data.filter((p) => {
            if (!p.FechaInicioMatricula || !p.FechaFinMatricula) return false;

            const hoy = new Date();
            const inicio = new Date(p.FechaInicioMatricula);
            const fin = new Date(p.FechaFinMatricula);

            if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
                return false;
            }

            inicio.setHours(0, 0, 0, 0);
            fin.setHours(23, 59, 59, 999);

            return hoy >= inicio && hoy <= fin;
        }).length;

        setText('admin-periodos-total', total);
        setText('admin-periodos-activos', activos);
        setText('admin-periodos-matricula-abierta', abiertos);
    }

    function renderTabla() {
        const tabla = document.getElementById('tabla-admin-periodos');
        if (!tabla) return;

        if (!periodosFiltrados.length) {
            tabla.innerHTML = '<tr><td colspan="7">No hay períodos</td></tr>';
            return;
        }

        tabla.innerHTML = periodosFiltrados.map((p) => {
            const estado = p.EstadoPeriodo || p.Estado || 'N/D';

            return `
                <tr>
                    <td>${escapeHtml(p.PeriodoID)}</td>
                    <td>${escapeHtml(p.NombrePeriodo || 'N/D')}</td>
                    <td>${escapeHtml(p.TipoPeriodo || 'N/D')}</td>
                    <td>${escapeHtml(formatearFecha(p.FechaInicio))}</td>
                    <td>${escapeHtml(formatearFecha(p.FechaFin))}</td>
                    <td>
                        <span class="badge ${getBadgeEstado(estado)}">
                            ${escapeHtml(estado)}
                        </span>
                    </td>
                    <td>
                        <div style="display:flex; gap:6px; flex-wrap:wrap;">
                            <button
                                class="btn btn-outline"
                                onclick="window.Modules.adminPeriodos.ver(${Number(p.PeriodoID)})"
                            >
                                Ver
                            </button>

                            <button
                                class="btn btn-primary"
                                onclick="window.Modules.adminPeriodos.abrirMatricula(${Number(p.PeriodoID)})"
                            >
                                Abrir matrícula
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function abrirMatricula(id) {
        const periodo = periodos.find((p) => Number(p.PeriodoID) === Number(id));
        if (!periodo) return;

        const hoy = new Date();
        const anioActual = hoy.getFullYear();
        const anioPeriodo = Number(periodo.Anio || 0);

        window.UI.openModal({
            title: `Abrir matrícula - ${escapeHtml(periodo.NombrePeriodo || '')}`,
            body: `
                <div class="form-grid">
                    <div>
                        <label>Inicio matrícula</label>
                        <input
                            type="date"
                            id="inicioMatricula"
                            value="${formatearFechaInput(periodo.FechaInicioMatricula)}"
                        >
                    </div>

                    <div>
                        <label>Fin matrícula</label>
                        <input
                            type="date"
                            id="finMatricula"
                            value="${formatearFechaInput(periodo.FechaFinMatricula)}"
                        >
                    </div>
                </div>

                <div class="mt-2 text-muted">
                    El período quedará en estado <strong>Activo</strong>.
                </div>
            `,
            confirmText: 'Guardar',
            cancelText: 'Cancelar',
            onConfirm: async () => {
                const inicio = String(document.getElementById('inicioMatricula')?.value || '').trim();
                const fin = String(document.getElementById('finMatricula')?.value || '').trim();

                if (!inicio || !fin) {
                    throw new Error('Debe completar ambas fechas.');
                }

                const fechaInicio = new Date(`${inicio}T00:00:00`);
                const fechaFin = new Date(`${fin}T23:59:59`);

                if (Number.isNaN(fechaInicio.getTime()) || Number.isNaN(fechaFin.getTime())) {
                    throw new Error('Las fechas ingresadas no son válidas.');
                }

                if (fechaFin < fechaInicio) {
                    throw new Error('La fecha fin de matrícula no puede ser menor que la fecha inicio.');
                }

                if (anioPeriodo < anioActual) {
                    throw new Error('No puedes abrir matrícula en un período de un año ya pasado.');
                }

                if (anioPeriodo > anioActual + 1) {
                    throw new Error('No puedes abrir matrícula para un período demasiado adelantado.');
                }

                await window.ApiService.request(`/periodos/${id}/abrir-matricula`, {
                    method: 'PUT',
                    body: {
                        FechaInicioMatricula: inicio,
                        FechaFinMatricula: fin,
                        EstadoPeriodo: 'Activo'
                    }
                });

                await cargarPeriodos();

                window.UI.showMessage(
                    'admin-periodos-message',
                    'success',
                    'Matrícula abierta correctamente.'
                );
            }
        });
    }

    function ver(id) {
        const p = periodos.find((x) => Number(x.PeriodoID) === Number(id));
        if (!p) return;

        window.UI.openModal({
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
                <p><strong>Estado:</strong> ${escapeHtml(p.EstadoPeriodo || p.Estado || 'N/D')}</p>
            `,
            hideFooter: true
        });
    }

    function getBadgeEstado(estado) {
        switch (String(estado || '').trim().toLowerCase()) {
            case 'activo':
                return 'badge-success';
            case 'inactivo':
            case 'cerrado':
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

    function formatearFechaInput(fecha) {
        if (!fecha) return '';

        const date = new Date(fecha);
        if (Number.isNaN(date.getTime())) return '';

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
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
        ver,
        abrirMatricula
    };
})();