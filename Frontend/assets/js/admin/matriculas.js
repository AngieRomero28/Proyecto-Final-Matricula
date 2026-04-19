window.Modules = window.Modules || {};

window.Modules.adminMatriculas = (function () {
    let matriculas = [];
    let matriculasFiltradas = [];

    async function init() {
        await cargarMatriculas();
        configurarEventos();
    }

    function configurarEventos() {
        const btnFiltrar = document.getElementById('btn-filtrar-admin-matriculas');
        const inputBuscar = document.getElementById('filtro-admin-matriculas');
        const selectEstado = document.getElementById('filtro-admin-estado-matricula');

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

    async function cargarMatriculas() {
        const tabla = document.getElementById('tabla-admin-matriculas');

        try {
            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="8">Cargando matrículas...</td></tr>';
            }

            const response = await window.ApiService.obtenerMatriculas();
            matriculas = Array.isArray(response.data) ? response.data : [];
            matriculasFiltradas = [...matriculas];

            renderResumen(matriculasFiltradas);
            renderTabla();
        } catch (error) {
            console.error('Error cargando matrículas:', error);
            window.UI.showMessage(
                'admin-matriculas-message',
                'danger',
                error.message || 'No se pudieron cargar las matrículas.'
            );

            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="8">Error cargando matrículas.</td></tr>';
            }
        }
    }

    function aplicarFiltros() {
        const texto = String(document.getElementById('filtro-admin-matriculas')?.value || '')
            .trim()
            .toLowerCase();

        const estado = String(document.getElementById('filtro-admin-estado-matricula')?.value || '')
            .trim()
            .toLowerCase();

        matriculasFiltradas = matriculas.filter((item) => {
            const coincideTexto =
                !texto ||
                String(item.MatriculaID || '').toLowerCase().includes(texto) ||
                String(item.NombreEstudiante || item.Estudiante || '').toLowerCase().includes(texto) ||
                String(item.Carnet || '').toLowerCase().includes(texto) ||
                String(item.NombrePeriodo || '').toLowerCase().includes(texto) ||
                String(item.NumeroFactura || '').toLowerCase().includes(texto);

            const estadoMatricula = String(item.EstadoMatricula || item.Estado || '')
                .trim()
                .toLowerCase();

            const coincideEstado = !estado || estadoMatricula === estado;

            return coincideTexto && coincideEstado;
        });

        renderResumen(matriculasFiltradas);
        renderTabla();
    }

    function renderResumen(data) {
        const total = data.length;

        const creditos = data.reduce(
            (acc, item) => acc + Number(item.CreditosTotales || item.Creditos || 0),
            0
        );

        const monto = data.reduce(
            (acc, item) => acc + Number(item.CostoTotal || item.MontoTotal || 0),
            0
        );

        const pendientes = data.filter((item) => {
            const estado = String(item.EstadoMatricula || item.Estado || '')
                .trim()
                .toLowerCase();
            return estado === 'pendiente';
        }).length;

        setText('admin-matriculas-total', total);
        setText('admin-matriculas-creditos', creditos);
        setText('admin-matriculas-monto', window.Helpers.formatCurrency(monto));
        setText('admin-matriculas-pendientes', pendientes);
    }

    function renderTabla() {
        const tabla = document.getElementById('tabla-admin-matriculas');
        if (!tabla) return;

        if (!matriculasFiltradas.length) {
            tabla.innerHTML = '<tr><td colspan="8">No hay matrículas para mostrar.</td></tr>';
            return;
        }

        tabla.innerHTML = [...matriculasFiltradas]
            .sort((a, b) => {
                const fechaA = new Date(a.FechaMatricula || a.Fecha || 0).getTime();
                const fechaB = new Date(b.FechaMatricula || b.Fecha || 0).getTime();
                return fechaB - fechaA;
            })
            .map((item) => `
                <tr>
                    <td>${escapeHtml(item.MatriculaID || 'N/D')}</td>
                    <td>${escapeHtml(item.NombreEstudiante || item.Estudiante || 'N/D')}</td>
                    <td>${escapeHtml(item.Carnet || 'N/D')}</td>
                    <td>${escapeHtml(item.NombrePeriodo || 'N/D')}</td>
                    <td>${escapeHtml(item.CreditosTotales ?? item.Creditos ?? 0)}</td>
                    <td>${escapeHtml(window.Helpers.formatCurrency(item.CostoTotal || item.MontoTotal || 0))}</td>
                    <td>
                        <span class="badge ${getBadgeEstadoMatricula(item.EstadoMatricula || item.Estado || 'N/D')}">
                            ${escapeHtml(item.EstadoMatricula || item.Estado || 'N/D')}
                        </span>
                    </td>
                    <td>
                        <button
                            class="btn btn-outline"
                            onclick="window.Modules.adminMatriculas.ver(${Number(item.MatriculaID)})"
                        >
                            Ver
                        </button>
                    </td>
                </tr>
            `).join('');
    }

    async function ver(id) {
        try {
            const response = await window.ApiService.obtenerMatriculaPorId(id);
            const data = Array.isArray(response.data) ? response.data : [];
            const encabezado = data[0];

            if (!encabezado) return;

            const detalleCursos = data
                .filter((item) => item.CursoID || item.NombreCurso)
                .map((item) => `
                    <li>
                        <strong>${escapeHtml(item.CodigoCurso || 'N/D')}</strong> -
                        ${escapeHtml(item.NombreCurso || 'N/D')}
                        (${escapeHtml(item.Creditos ?? 0)} créditos)
                    </li>
                `)
                .join('');

            window.UI.openModal({
                title: `Detalle de matrícula #${escapeHtml(encabezado.MatriculaID)}`,
                body: `
                    <p><strong>Estudiante:</strong> ${escapeHtml(encabezado.NombreEstudiante || 'N/D')}</p>
                    <p><strong>Carnet:</strong> ${escapeHtml(encabezado.Carnet || 'N/D')}</p>
                    <p><strong>Período:</strong> ${escapeHtml(encabezado.NombrePeriodo || 'N/D')}</p>
                    <p><strong>Fecha:</strong> ${escapeHtml(formatearFecha(encabezado.FechaMatricula || encabezado.Fecha))}</p>
                    <p><strong>Créditos totales:</strong> ${escapeHtml(encabezado.CreditosTotales ?? 0)}</p>
                    <p><strong>Costo total:</strong> ${escapeHtml(window.Helpers.formatCurrency(encabezado.CostoTotal || 0))}</p>
                    <p><strong>Estado:</strong> ${escapeHtml(encabezado.EstadoMatricula || 'N/D')}</p>
                    <p><strong>Factura:</strong> ${escapeHtml(encabezado.NumeroFactura || 'N/D')}</p>
                    <div class="divider"></div>
                    <p><strong>Cursos matriculados:</strong></p>
                    ${detalleCursos ? `<ul>${detalleCursos}</ul>` : '<p>No hay detalle disponible.</p>'}
                `,
                hideFooter: true
            });
        } catch (error) {
            console.error('Error obteniendo detalle de matrícula:', error);
            window.UI.showMessage(
                'admin-matriculas-message',
                'danger',
                error.message || 'No se pudo cargar el detalle de la matrícula.'
            );
        }
    }

    function getBadgeEstadoMatricula(estado) {
        switch (String(estado || '').trim().toLowerCase()) {
            case 'confirmada':
                return 'badge-success';
            case 'pendiente':
            case 'parcial':
                return 'badge-warning';
            case 'anulada':
            case 'cancelada':
                return 'badge-danger';
            default:
                return 'badge-gray';
        }
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