// frontend/js/admin/periodos.js
window.Modules = window.Modules || {};

window.Modules.adminPeriodos = (function () {
    let periodos = [];
    let periodosFiltrados = [];

    async function init() {
        await cargarPeriodos();
        configurarEventos();
    }

    function configurarEventos() {
        const btnNuevo = document.getElementById('btn-admin-nuevo-periodo');
        const btnFiltrar = document.getElementById('btn-filtrar-admin-periodos');
        const inputBuscar = document.getElementById('filtro-admin-periodos');
        const selectEstado = document.getElementById('filtro-admin-estado-periodo');

        if (btnNuevo && !btnNuevo.dataset.bound) {
            btnNuevo.dataset.bound = 'true';
            btnNuevo.addEventListener('click', abrirCrearPeriodo);
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

    async function cargarPeriodos() {
        const tabla = document.getElementById('tabla-admin-periodos');
        if (!tabla) return;

        try {
            window.UI?.clearMessage?.('admin-periodos-message');
            tabla.innerHTML = '<tr><td colspan="8">Cargando...</td></tr>';

            const response = await window.ApiService.obtenerPeriodos();
            periodos = Array.isArray(response.data) ? response.data : [];
            periodosFiltrados = [...periodos];

            renderResumen(periodosFiltrados);
            renderTabla();
        } catch (error) {
            console.error('Error cargando períodos:', error);
            tabla.innerHTML = '<tr><td colspan="8">Error cargando datos</td></tr>';
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
            tabla.innerHTML = '<tr><td colspan="8">No hay períodos</td></tr>';
            return;
        }

        tabla.innerHTML = periodosFiltrados.map((p) => {
            const estado = p.EstadoPeriodo || p.Estado || 'N/D';

            return `
                <tr>
                    <td>${escapeHtml(p.PeriodoID)}</td>
                    <td>${escapeHtml(p.NombrePeriodo || 'N/D')}</td>
                    <td>${escapeHtml(p.TipoPeriodo || 'N/D')}</td>
                    <td>${escapeHtml(p.Anio || 'N/D')}</td>
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

    function abrirCrearPeriodo() {
        const anioActual = new Date().getFullYear();

        window.UI.openModal({
            title: 'Crear nuevo período',
            body: `
                <div class="form-grid">
                    <div>
                        <label for="admin-periodo-nombre">Nombre del período</label>
                        <input type="text" id="admin-periodo-nombre" placeholder="Ej: C2-2026">
                    </div>

                    <div>
                        <label for="admin-periodo-tipo">Tipo de período</label>
                        <select id="admin-periodo-tipo">
                            <option value="">Seleccione</option>
                            <option value="Semestral">Semestral</option>
                            <option value="Cuatrimestral">Cuatrimestral</option>
                            <option value="Trimestral">Trimestral</option>
                        </select>
                    </div>

                    <div>
                        <label for="admin-periodo-anio">Año</label>
                        <input
                            type="number"
                            id="admin-periodo-anio"
                            min="${anioActual}"
                            max="${anioActual + 1}"
                            value="${anioActual}"
                        >
                    </div>

                    <div>
                        <label for="admin-periodo-estado">Estado</label>
                        <select id="admin-periodo-estado">
                            <option value="Planeado">Planeado</option>
                            <option value="Activo">Activo</option>
                            <option value="Inactivo">Inactivo</option>
                            <option value="Cerrado">Cerrado</option>
                            <option value="Finalizado">Finalizado</option>
                        </select>
                    </div>

                    <div>
                        <label for="admin-periodo-fecha-inicio">Fecha inicio</label>
                        <input type="date" id="admin-periodo-fecha-inicio">
                    </div>

                    <div>
                        <label for="admin-periodo-fecha-fin">Fecha fin</label>
                        <input type="date" id="admin-periodo-fecha-fin">
                    </div>

                    <div>
                        <label for="admin-periodo-fecha-inicio-matricula">Inicio matrícula</label>
                        <input type="date" id="admin-periodo-fecha-inicio-matricula">
                    </div>

                    <div>
                        <label for="admin-periodo-fecha-fin-matricula">Fin matrícula</label>
                        <input type="date" id="admin-periodo-fecha-fin-matricula">
                    </div>

                    <div style="grid-column: 1 / -1;">
                        <label for="admin-periodo-costo">Costo del período</label>
                        <input
                            type="number"
                            id="admin-periodo-costo"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                        >
                    </div>
                </div>
            `,
            confirmText: 'Crear período',
            cancelText: 'Cancelar',
            onConfirm: async () => {
                const nombre = String(document.getElementById('admin-periodo-nombre')?.value || '').trim();
                const tipo = String(document.getElementById('admin-periodo-tipo')?.value || '').trim();
                const anio = Number(document.getElementById('admin-periodo-anio')?.value || 0);
                const estado = String(document.getElementById('admin-periodo-estado')?.value || 'Planeado').trim();
                const fechaInicio = String(document.getElementById('admin-periodo-fecha-inicio')?.value || '').trim();
                const fechaFin = String(document.getElementById('admin-periodo-fecha-fin')?.value || '').trim();
                const fechaInicioMatricula = String(document.getElementById('admin-periodo-fecha-inicio-matricula')?.value || '').trim();
                const fechaFinMatricula = String(document.getElementById('admin-periodo-fecha-fin-matricula')?.value || '').trim();
                const costoPeriodo = Number(document.getElementById('admin-periodo-costo')?.value || 0);

                if (!nombre) {
                    throw new Error('Debe ingresar el nombre del período.');
                }

                if (!tipo) {
                    throw new Error('Debe seleccionar si será trimestre, cuatrimestre o semestre.');
                }

                if (!anio || Number.isNaN(anio)) {
                    throw new Error('Debe ingresar un año válido.');
                }

                if (!fechaInicio || !fechaFin) {
                    throw new Error('Debe completar la fecha de inicio y fin del período.');
                }

                if (fechaFin < fechaInicio) {
                    throw new Error('La fecha fin del período no puede ser menor que la fecha inicio.');
                }

                if ((fechaInicioMatricula && !fechaFinMatricula) || (!fechaInicioMatricula && fechaFinMatricula)) {
                    throw new Error('Debe completar ambas fechas de matrícula o dejar ambas vacías.');
                }

                if (fechaInicioMatricula && fechaFinMatricula && fechaFinMatricula < fechaInicioMatricula) {
                    throw new Error('La fecha fin de matrícula no puede ser menor que la fecha inicio de matrícula.');
                }

                if (Number.isNaN(costoPeriodo) || costoPeriodo < 0) {
                    throw new Error('Debe ingresar un costo válido.');
                }

                await window.ApiService.crearPeriodo({
                    NombrePeriodo: nombre,
                    TipoPeriodo: tipo,
                    Anio: anio,
                    FechaInicio: fechaInicio,
                    FechaFin: fechaFin,
                    FechaInicioMatricula: fechaInicioMatricula || null,
                    FechaFinMatricula: fechaFinMatricula || null,
                    EstadoPeriodo: estado,
                    CostoPeriodo: costoPeriodo
                });

                await cargarPeriodos();

                window.UI.showMessage(
                    'admin-periodos-message',
                    'success',
                    'Período creado correctamente.'
                );
            }
        });
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

                await window.ApiService.abrirMatriculaPeriodo(id, {
                    FechaInicioMatricula: inicio,
                    FechaFinMatricula: fin,
                    EstadoPeriodo: 'Activo'
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
                <p><strong>Costo del período:</strong> ${
                    escapeHtml(
                        window.Helpers?.formatCurrency
                            ? window.Helpers.formatCurrency(p.CostoPeriodo || 0)
                            : (p.CostoPeriodo || 0)
                    )
                }</p>
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