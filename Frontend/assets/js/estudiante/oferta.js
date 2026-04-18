window.Modules = window.Modules || {};

window.Modules.estudianteOferta = (function () {
    let oferta = [];
    let ofertaFiltrada = [];
    let periodoActualId = null;

    async function init() {
        await cargarOferta();
        configurarEventos();
    }

    function configurarEventos() {
        const btnFiltrar = document.getElementById('btn-filtrar-oferta');
        const inputFiltro = document.getElementById('filtro-oferta');

        if (btnFiltrar && !btnFiltrar.dataset.bound) {
            btnFiltrar.dataset.bound = 'true';
            btnFiltrar.addEventListener('click', aplicarFiltros);
        }

        if (inputFiltro && !inputFiltro.dataset.bound) {
            inputFiltro.dataset.bound = 'true';
            inputFiltro.addEventListener('input', aplicarFiltros);
        }
    }

    async function cargarOferta() {
        const session = window.Auth.getSession();
        const tabla = document.getElementById('tabla-oferta');

        if (!session?.estudianteId) {
            window.UI.showMessage('oferta-message', 'danger', 'No se encontró la sesión del estudiante.');
            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="6">No se encontró la sesión del estudiante.</td></tr>';
            }
            return;
        }

        try {
            periodoActualId = await obtenerPeriodoActualId();

            const response = await window.ApiService.obtenerOfertaMatriculableEstudiante(
                session.estudianteId,
                periodoActualId
            );

            oferta = Array.isArray(response.data) ? response.data : [];
            ofertaFiltrada = [...oferta];
            renderTabla();
        } catch (error) {
            console.error('Error cargando oferta del estudiante:', error);
            window.UI.showMessage(
                'oferta-message',
                'danger',
                error.message || 'No se pudo cargar la oferta.'
            );

            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="6">Error cargando oferta.</td></tr>';
            }
        }
    }

    async function obtenerPeriodoActualId() {
        const session = window.Auth.getSession();

        const candidatos = [
            session?.periodoId,
            session?.PeriodoID,
            session?.raw?.PeriodoID,
            session?.raw?.periodoId
        ];

        for (const candidato of candidatos) {
            const num = Number(candidato);
            if (!Number.isNaN(num) && num > 0) {
                return num;
            }
        }

        const response = await window.ApiService.obtenerPeriodos();
        const periodos = Array.isArray(response.data) ? response.data : [];

        const activo = periodos.find((item) => {
            const estado = String(item.EstadoPeriodo || item.estado || '').trim().toLowerCase();
            return ['activo', 'activa', 'vigente', 'abierto', 'abierta'].includes(estado);
        });

        const periodoId = Number(
            activo?.PeriodoID ??
            activo?.periodoId ??
            0
        );

        if (!periodoId) {
            throw new Error('No se encontró un período académico activo para consultar la oferta.');
        }

        return periodoId;
    }

    function aplicarFiltros() {
        const texto = String(document.getElementById('filtro-oferta')?.value || '')
            .trim()
            .toLowerCase();

        ofertaFiltrada = oferta.filter((item) => {
            const docente =
                item.Docente ||
                item.NombreDocente ||
                item.docente ||
                '';

            return (
                !texto ||
                String(item.CodigoCurso || '').toLowerCase().includes(texto) ||
                String(item.NombreCurso || '').toLowerCase().includes(texto) ||
                String(docente).toLowerCase().includes(texto)
            );
        });

        renderTabla();
    }

    function renderTabla() {
        const tabla = document.getElementById('tabla-oferta');
        if (!tabla) return;

        if (!ofertaFiltrada.length) {
            tabla.innerHTML = '<tr><td colspan="6">No hay cursos disponibles para matrícula.</td></tr>';
            return;
        }

        tabla.innerHTML = ofertaFiltrada.map((item) => {
            const cupos = Number(item.CupoDisponible || 0);
            const sinCupo = cupos <= 0;
            const docente =
                item.Docente ||
                item.NombreDocente ||
                'Por definir';

            const seccionId = Number(item.SeccionID || 0);

            return `
                <tr>
                    <td>
                        <strong>${escapeHtml(item.CodigoCurso || '')}</strong><br>
                        ${escapeHtml(item.NombreCurso || '')}
                    </td>
                    <td>${escapeHtml(item.Creditos || 0)}</td>
                    <td>${escapeHtml(docente)}</td>
                    <td>${escapeHtml(item.HorarioTexto || construirHorarioSimple(item) || 'No definido')}</td>
                    <td>${escapeHtml(cupos)}</td>
                    <td>
                        <button
                            class="btn ${sinCupo ? 'btn-outline' : 'btn-primary'}"
                            ${sinCupo || !seccionId ? 'disabled' : ''}
                            onclick="window.Modules.estudianteOferta.agregar(${seccionId})"
                        >
                            ${sinCupo ? 'Sin cupo' : 'Agregar'}
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    async function agregar(seccionId) {
        const session = window.Auth.getSession();

        if (!session?.estudianteId) {
            window.UI.showMessage('oferta-message', 'danger', 'No se encontró la sesión del estudiante.');
            return;
        }

        try {
            if (!periodoActualId) {
                periodoActualId = await obtenerPeriodoActualId();
            }

            await window.ApiService.crearMatricula({
                estudianteId: Number(session.estudianteId),
                periodoId: Number(periodoActualId),
                secciones: [Number(seccionId)]
            });

            window.UI.showMessage(
                'oferta-message',
                'success',
                'Curso agregado correctamente a la matrícula.'
            );

            await cargarOferta();
        } catch (error) {
            console.error('Error agregando curso a matrícula:', error);
            window.UI.showMessage(
                'oferta-message',
                'danger',
                error.message || 'No se pudo agregar el curso.'
            );
        }
    }

    function construirHorarioSimple(item) {
        return [
            item.DiaSemana || null,
            item.HoraInicio ? formatearHora(item.HoraInicio) : null,
            item.HoraFin ? formatearHora(item.HoraFin) : null
        ].filter(Boolean).join(' ');
    }

    return {
        init,
        agregar
    };
})();