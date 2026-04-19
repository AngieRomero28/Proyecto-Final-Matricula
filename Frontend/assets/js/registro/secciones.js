// frontend/js/registro/secciones.js

window.Modules = window.Modules || {};

window.Modules.registroSecciones = (function () {
    let secciones = [];
    let seccionesFiltradas = [];

    async function init() {
        await cargarSecciones();
        configurarEventos();
    }

    function configurarEventos() {
        const btnFiltrar = document.getElementById('btn-filtrar-registro-secciones');
        const inputBuscar = document.getElementById('filtro-registro-secciones');
        const selectEstado = document.getElementById('filtro-registro-estado-seccion');

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

    async function cargarSecciones() {
        const tabla = document.getElementById('tabla-registro-secciones');

        try {
            window.UI.clearMessage('registro-secciones-message');

            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="8">Cargando secciones...</td></tr>';
            }

            const response = await window.ApiService.obtenerSecciones();
            const data = Array.isArray(response.data) ? response.data : [];

            secciones = window.normalizarSecciones
                ? window.normalizarSecciones(data)
                : normalizarSeccionesLocal(data);

            seccionesFiltradas = [...secciones];

            renderResumen();
            renderTabla();
        } catch (error) {
            console.error('Error cargando secciones:', error);
            window.UI.showMessage(
                'registro-secciones-message',
                'danger',
                error.message || 'No se pudieron cargar las secciones.'
            );

            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="8">Error cargando secciones.</td></tr>';
            }
        }
    }

    function normalizarSeccionesLocal(data) {
        const mapa = new Map();

        for (const item of data) {
            const id = Number(item.SeccionID);
            if (!id) continue;

            if (!mapa.has(id)) {
                mapa.set(id, {
                    SeccionID: id,
                    NumeroSeccion: item.NumeroSeccion ?? '',
                    CupoMaximo: Number(item.CupoMaximo ?? 0),
                    CupoDisponible: Number(item.CupoDisponible ?? 0),
                    EstadoSeccion: item.EstadoSeccion ?? '',
                    CursoID: item.CursoID ?? null,
                    CodigoCurso: item.CodigoCurso ?? '',
                    NombreCurso: item.NombreCurso ?? '',
                    Creditos: Number(item.Creditos ?? 0),
                    PeriodoID: item.PeriodoID ?? null,
                    NombrePeriodo: item.NombrePeriodo ?? '',
                    TipoPeriodo: item.TipoPeriodo ?? '',
                    Anio: item.Anio ?? '',
                    DocenteID: item.DocenteID ?? null,
                    Docente: item.Docente || item.NombreDocente || '',
                    horarios: [],
                    aulas: []
                });
            }

            const seccion = mapa.get(id);

            const horario = construirHorarioDesdeFila(item);
            if (horario && !seccion.horarios.includes(horario)) {
                seccion.horarios.push(horario);
            }

            const aula = construirAulaDesdeFila(item);
            if (aula && !seccion.aulas.includes(aula)) {
                seccion.aulas.push(aula);
            }
        }

        return Array.from(mapa.values()).map((item) => ({
            ...item,
            HorarioTexto: item.horarios.length ? item.horarios.join(' | ') : 'N/D',
            AulaTexto: item.aulas.length ? item.aulas.join(' | ') : 'N/D'
        }));
    }

    function aplicarFiltros() {
        const texto = String(document.getElementById('filtro-registro-secciones')?.value || '')
            .trim()
            .toLowerCase();

        const estado = String(document.getElementById('filtro-registro-estado-seccion')?.value || '')
            .trim()
            .toLowerCase();

        seccionesFiltradas = secciones.filter((item) => {
            const coincideTexto =
                !texto ||
                String(item.SeccionID || '').toLowerCase().includes(texto) ||
                String(item.NumeroSeccion || '').toLowerCase().includes(texto) ||
                String(item.NombreCurso || '').toLowerCase().includes(texto) ||
                String(item.CodigoCurso || '').toLowerCase().includes(texto) ||
                String(item.NombrePeriodo || '').toLowerCase().includes(texto) ||
                String(item.Docente || '').toLowerCase().includes(texto);

            const estadoSeccion = String(item.EstadoSeccion || item.Estado || '')
                .trim()
                .toLowerCase();

            const coincideEstado = !estado || estadoSeccion === estado;

            return coincideTexto && coincideEstado;
        });

        renderResumen();
        renderTabla();
    }

    function renderResumen() {
        const total = seccionesFiltradas.length;

        const activas = seccionesFiltradas.filter((item) =>
            ['activa', 'activo'].includes(String(item.EstadoSeccion || '').trim().toLowerCase())
        ).length;

        const cuposDisponibles = seccionesFiltradas.reduce(
            (acc, item) => acc + Number(item.CupoDisponible || 0),
            0
        );

        setText('registro-secciones-total', total);
        setText('registro-secciones-activas', activas);
        setText('registro-secciones-cupos', cuposDisponibles);
    }

    function renderTabla() {
        const tabla = document.getElementById('tabla-registro-secciones');
        if (!tabla) return;

        if (!seccionesFiltradas.length) {
            tabla.innerHTML = '<tr><td colspan="8">No hay secciones para mostrar.</td></tr>';
            return;
        }

        tabla.innerHTML = seccionesFiltradas.map((item) => `
            <tr>
                <td>${escapeHtml(item.SeccionID)}</td>
                <td>${escapeHtml(item.NumeroSeccion || 'N/D')}</td>
                <td>${escapeHtml(item.NombreCurso || 'N/D')}</td>
                <td>${escapeHtml(item.Docente || 'N/D')}</td>
                <td>${escapeHtml(construirPeriodoTexto(item))}</td>
                <td>${escapeHtml(item.CupoDisponible ?? 0)} / ${escapeHtml(item.CupoMaximo ?? 0)}</td>
                <td>
                    <span class="badge ${getBadgeEstado(item.EstadoSeccion || 'N/D')}">
                        ${escapeHtml(item.EstadoSeccion || 'N/D')}
                    </span>
                </td>
                <td>
                    <button
                        class="btn btn-outline"
                        onclick="window.Modules.registroSecciones.ver(${Number(item.SeccionID)})"
                    >
                        Ver
                    </button>
                </td>
            </tr>
        `).join('');
    }

    function ver(id) {
        const item = secciones.find((x) => Number(x.SeccionID) === Number(id));
        if (!item) return;

        window.UI.openModal({
            title: 'Detalle de la sección',
            body: `
                <p><strong>ID:</strong> ${escapeHtml(item.SeccionID)}</p>
                <p><strong>Número de sección:</strong> ${escapeHtml(item.NumeroSeccion || 'N/D')}</p>
                <p><strong>Curso:</strong> ${escapeHtml(item.NombreCurso || 'N/D')} (${escapeHtml(item.CodigoCurso || 'N/D')})</p>
                <p><strong>Créditos:</strong> ${escapeHtml(item.Creditos ?? 0)}</p>
                <p><strong>Período:</strong> ${escapeHtml(construirPeriodoTexto(item))}</p>
                <p><strong>Docente:</strong> ${escapeHtml(item.Docente || 'N/D')}</p>
                <p><strong>Cupo máximo:</strong> ${escapeHtml(item.CupoMaximo ?? 0)}</p>
                <p><strong>Cupo disponible:</strong> ${escapeHtml(item.CupoDisponible ?? 0)}</p>
                <p><strong>Horario:</strong> ${escapeHtml(item.HorarioTexto || 'N/D')}</p>
                <p><strong>Aula:</strong> ${escapeHtml(item.AulaTexto || 'N/D')}</p>
                <p><strong>Estado:</strong> ${escapeHtml(item.EstadoSeccion || 'N/D')}</p>
            `,
            hideFooter: true
        });
    }

    function construirPeriodoTexto(item) {
        if (window.construirPeriodoTexto) {
            return window.construirPeriodoTexto(item);
        }

        const partes = [
            item.NombrePeriodo,
            item.TipoPeriodo,
            item.Anio ? `(${item.Anio})` : ''
        ].filter(Boolean);

        return partes.length ? partes.join(' ') : 'N/D';
    }

    function construirHorarioDesdeFila(item) {
        if (!item.DiaSemana && !item.HoraInicio && !item.HoraFin) {
            return '';
        }

        const inicio = item.HoraInicio ? String(item.HoraInicio).slice(0, 5) : '--';
        const fin = item.HoraFin ? String(item.HoraFin).slice(0, 5) : '--';

        return `${item.DiaSemana || 'N/D'} ${inicio} - ${fin}`;
    }

    function construirAulaDesdeFila(item) {
        const partes = [
            item.CodigoAula,
            item.NombreAula,
            item.Ubicacion
        ].filter(Boolean);

        return partes.length ? partes.join(' | ') : '';
    }

    function getBadgeEstado(estado) {
        switch (String(estado || '').toLowerCase()) {
            case 'activa':
            case 'activo':
                return 'badge-success';
            case 'inactiva':
            case 'cerrada':
            case 'inactivo':
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