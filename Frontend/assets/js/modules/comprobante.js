window.Modules = window.Modules || {};

window.Modules.comprobante = (function () {
    let comprobantes = [];
    let comprobantesFiltrados = [];

    async function init() {
        await cargarComprobantes();
        configurarEventos();
    }

    function configurarEventos() {
        const btnFiltrar = document.getElementById('btn-filtrar-comprobantes');
        const inputBuscar = document.getElementById('filtro-comprobante-buscar');
        const selectEstado = document.getElementById('filtro-comprobante-estado');

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

    async function cargarComprobantes() {
        const tabla = document.getElementById('tabla-comprobantes');

        try {
            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="8">Cargando comprobantes...</td></tr>';
            }

            const response = await window.ApiService.obtenerComprobantes();
            comprobantes = Array.isArray(response.data) ? response.data : [];
            comprobantesFiltrados = [...comprobantes];

            renderResumen();
            renderTabla();
        } catch (error) {
            console.error('Error cargando comprobantes:', error);
            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="8">Error cargando comprobantes</td></tr>';
            }
            window.UI.showMessage(
                'comprobante-message',
                'danger',
                error.message || 'No se pudieron cargar los comprobantes.'
            );
        }
    }

    function aplicarFiltros() {
        const texto = String(document.getElementById('filtro-comprobante-buscar')?.value || '')
            .trim()
            .toLowerCase();

        const estado = String(document.getElementById('filtro-comprobante-estado')?.value || '')
            .trim()
            .toLowerCase();

        comprobantesFiltrados = comprobantes.filter((item) => {
            const estadoMatricula = String(item.EstadoMatricula || item.Estado || '').trim().toLowerCase();

            const coincideTexto =
                !texto ||
                String(item.ComprobanteMatricula || item.Comprobante || '').toLowerCase().includes(texto) ||
                String(item.NombreEstudiante || item.Estudiante || '').toLowerCase().includes(texto) ||
                String(item.Carnet || '').toLowerCase().includes(texto) ||
                String(item.NombrePeriodo || '').toLowerCase().includes(texto);

            const coincideEstado = !estado || estadoMatricula === estado;

            return coincideTexto && coincideEstado;
        });

        renderResumen();
        renderTabla();
    }

    function renderResumen() {
        const total = comprobantesFiltrados.length;
        const totalCreditos = comprobantesFiltrados.reduce(
            (acc, item) => acc + Number(item.CreditosTotales || item.Creditos || 0),
            0
        );
        const totalMonto = comprobantesFiltrados.reduce(
            (acc, item) => acc + Number(item.CostoTotal || item.MontoTotal || 0),
            0
        );

        setText('comprobante-total', total);
        setText('comprobante-creditos', totalCreditos);
        setText('comprobante-monto-total', window.Helpers.formatCurrency(totalMonto));
    }

    function renderTabla() {
        const tabla = document.getElementById('tabla-comprobantes');
        if (!tabla) return;

        if (!comprobantesFiltrados.length) {
            tabla.innerHTML = '<tr><td colspan="8">No hay comprobantes para mostrar</td></tr>';
            return;
        }

        tabla.innerHTML = comprobantesFiltrados.map((item) => `
            <tr>
                <td>${escapeHtml(item.MatriculaID)}</td>
                <td>${escapeHtml(item.ComprobanteMatricula || item.Comprobante || '')}</td>
                <td>${escapeHtml(item.NombreEstudiante || item.Estudiante || '')}</td>
                <td>${escapeHtml(item.NombrePeriodo || '')}</td>
                <td>${escapeHtml(item.CreditosTotales ?? item.Creditos ?? 0)}</td>
                <td>${escapeHtml(window.Helpers.formatCurrency(item.CostoTotal || item.MontoTotal || 0))}</td>
                <td>
                    <span class="badge ${getBadgeEstado(item.EstadoMatricula || item.Estado)}">
                        ${escapeHtml(item.EstadoMatricula || item.Estado || 'N/D')}
                    </span>
                </td>
                <td>
                    <button class="btn btn-outline" onclick="window.Modules.comprobante.verDetalle(${item.MatriculaID})">
                        Ver
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async function verDetalle(matriculaId) {
        try {
            const response = await window.ApiService.obtenerComprobantePorMatriculaId(matriculaId);
            const data = response.data || {};

            const encabezado = data.encabezado || {};
            const detalle = Array.isArray(data.detalle) ? normalizarDetalle(data.detalle) : [];

            window.UI.openModal({
                title: `Comprobante ${escapeHtml(encabezado.ComprobanteMatricula || encabezado.Comprobante || '')}`,
                body: `
                    <div class="resumen-financiero">
                        <div class="mini-card">
                            <div class="mini-card-label">Matrícula</div>
                            <div class="mini-card-value">${encabezado.MatriculaID || 'N/D'}</div>
                        </div>
                        <div class="mini-card">
                            <div class="mini-card-label">Créditos</div>
                            <div class="mini-card-value">${encabezado.CreditosTotales || encabezado.Creditos || 0}</div>
                        </div>
                        <div class="mini-card">
                            <div class="mini-card-label">Costo total</div>
                            <div class="mini-card-value">${window.Helpers.formatCurrency(encabezado.CostoTotal || encabezado.MontoTotal || 0)}</div>
                        </div>
                    </div>

                    <div class="mt-2">
                        <p><strong>Estudiante:</strong> ${escapeHtml(encabezado.NombreEstudiante || encabezado.Estudiante || '')}</p>
                        <p><strong>Carnet:</strong> ${escapeHtml(encabezado.Carnet || '')}</p>
                        <p><strong>Correo:</strong> ${escapeHtml(encabezado.CorreoInstitucional || '')}</p>
                        <p><strong>Período:</strong> ${escapeHtml(encabezado.NombrePeriodo || '')} ${escapeHtml(encabezado.TipoPeriodo || '')} ${encabezado.Anio ? `(${encabezado.Anio})` : ''}</p>
                        <p><strong>Fecha matrícula:</strong> ${formatearFecha(encabezado.FechaMatricula)}</p>
                        <p><strong>Estado matrícula:</strong> ${escapeHtml(encabezado.EstadoMatricula || encabezado.Estado || '')}</p>
                        <p><strong>Factura:</strong> ${escapeHtml(encabezado.NumeroFactura || 'N/D')}</p>
                        <p><strong>Estado factura:</strong> ${escapeHtml(encabezado.EstadoFactura || 'N/D')}</p>
                        <p><strong>Estado cuenta:</strong> ${escapeHtml(encabezado.EstadoCuenta || 'N/D')}</p>
                    </div>

                    <div class="divider"></div>

                    <div>
                        <h3 style="font-family: var(--font-title); font-size: 18px; color: var(--navy); margin-bottom: 12px;">
                            Detalle de cursos
                        </h3>

                        ${
                            detalle.length
                                ? `
                                    <div class="table-wrap">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Sección</th>
                                                    <th>Curso</th>
                                                    <th>Créditos</th>
                                                    <th>Horario</th>
                                                    <th>Aula</th>
                                                    <th>Estado</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${detalle.map((item) => `
                                                    <tr>
                                                        <td>${escapeHtml(String(item.NumeroSeccion || item.SeccionID || ''))}</td>
                                                        <td>${escapeHtml(item.CodigoCurso || '')} - ${escapeHtml(item.NombreCurso || '')}</td>
                                                        <td>${escapeHtml(item.Creditos || 0)}</td>
                                                        <td>${escapeHtml(item.HorariosTexto || 'N/D')}</td>
                                                        <td>${escapeHtml(item.AulasTexto || 'N/D')}</td>
                                                        <td>${escapeHtml(item.EstadoDetalle || 'N/D')}</td>
                                                    </tr>
                                                `).join('')}
                                            </tbody>
                                        </table>
                                    </div>
                                `
                                : '<p class="text-sm text-muted">No hay detalle de cursos disponible.</p>'
                        }
                    </div>
                `,
                hideFooter: true
            });
        } catch (error) {
            console.error('Error obteniendo detalle de comprobante:', error);
            window.UI.showMessage(
                'comprobante-message',
                'danger',
                error.message || 'No se pudo obtener el detalle del comprobante.'
            );
        }
    }

    function normalizarDetalle(data) {
        const mapa = new Map();

        for (const item of data) {
            const id = Number(item.SeccionID);
            if (!id) continue;

            if (!mapa.has(id)) {
                mapa.set(id, {
                    SeccionID: id,
                    NumeroSeccion: item.NumeroSeccion ?? '',
                    EstadoDetalle: item.EstadoDetalle ?? item.Estado ?? '',
                    CodigoCurso: item.CodigoCurso ?? '',
                    NombreCurso: item.NombreCurso ?? '',
                    Creditos: Number(item.Creditos ?? 0),
                    horarios: [],
                    aulas: []
                });
            }

            const registro = mapa.get(id);

            const horario = construirHorarioTexto(item);
            if (horario && !registro.horarios.includes(horario)) {
                registro.horarios.push(horario);
            }

            const aula = construirAulaTexto(item);
            if (aula && !registro.aulas.includes(aula)) {
                registro.aulas.push(aula);
            }
        }

        return Array.from(mapa.values()).map((item) => ({
            ...item,
            HorariosTexto: item.horarios.join(' | ') || 'N/D',
            AulasTexto: item.aulas.join(' | ') || 'N/D'
        }));
    }

    function construirHorarioTexto(item) {
        const dia = item.DiaSemana ? String(item.DiaSemana).trim() : '';
        const inicio = item.HoraInicio ? formatearHora(item.HoraInicio) : '';
        const fin = item.HoraFin ? formatearHora(item.HoraFin) : '';

        if (!dia && !inicio && !fin) return '';
        if (dia && inicio && fin) return `${dia} ${inicio} - ${fin}`;
        return [dia, inicio, fin].filter(Boolean).join(' ');
    }

    function construirAulaTexto(item) {
        const codigo = item.CodigoAula ? String(item.CodigoAula).trim() : '';
        const nombre = item.NombreAula ? String(item.NombreAula).trim() : '';

        if (codigo && nombre) return `${codigo} - ${nombre}`;
        return codigo || nombre || '';
    }

    function formatearHora(valor) {
        const texto = String(valor || '');
        return texto.length >= 5 ? texto.slice(0, 5) : texto;
    }

    function getBadgeEstado(estado) {
        switch (String(estado || '').trim().toLowerCase()) {
            case 'confirmada':
                return 'badge-success';
            case 'pendiente':
                return 'badge-warning';
            case 'anulada':
            case 'cancelada':
                return 'badge-danger';
            default:
                return 'badge-gray';
        }
    }

    function setText(id, value) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = value;
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
        init,
        verDetalle
    };
})();