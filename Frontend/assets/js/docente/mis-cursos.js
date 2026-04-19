window.Modules = window.Modules || {};

window.Modules.docenteMisCursos = (function () {
    let cursos = [];
    let cursosFiltrados = [];

    async function init() {
        await cargarCursos();
        configurarEventos();
    }

    function configurarEventos() {
        const btnFiltrar = document.getElementById('btn-filtrar-docente-cursos');
        const inputFiltro = document.getElementById('filtro-docente-cursos');

        if (btnFiltrar && !btnFiltrar.dataset.bound) {
            btnFiltrar.dataset.bound = 'true';
            btnFiltrar.addEventListener('click', aplicarFiltros);
        }

        if (inputFiltro && !inputFiltro.dataset.bound) {
            inputFiltro.dataset.bound = 'true';
            inputFiltro.addEventListener('input', aplicarFiltros);
        }
    }

    async function cargarCursos() {
        const session = window.Auth.getSession();
        const tabla = document.getElementById('tabla-docente-cursos');

        if (!session?.userId) {
            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="5">Sesión no válida.</td></tr>';
            }
            return;
        }

        try {
            const response = await window.ApiService.obtenerSecciones();
            const data = Array.isArray(response.data) ? response.data : [];

            // 🔥 usamos normalizadas SOLO para filtrar docente
            const normalizadas = window.normalizarSecciones
                ? window.normalizarSecciones(data)
                : data;

            const misSecciones = obtenerSeccionesDocente(normalizadas, session);

            // 🔥 función para obtener créditos reales desde data original
            function obtenerCreditosReales(cursoId) {
                const original = data.find(s => Number(s.CursoID) === Number(cursoId));
                return Number(
                    original?.Creditos ??
                    original?.creditos ??
                    0
                );
            }

            const mapa = new Map();

            misSecciones.forEach((s) => {
                const cursoId = Number(s.CursoID || s.cursoId || 0);
                if (!cursoId) return;

                if (!mapa.has(cursoId)) {
                    mapa.set(cursoId, {
                        CursoID: cursoId,
                        CodigoCurso: s.CodigoCurso || s.codigoCurso || '',
                        NombreCurso: s.NombreCurso || s.nombreCurso || '',

                        // 🔥 FIX DEFINITIVO
                        Creditos: obtenerCreditosReales(cursoId),

                        totalSecciones: 0
                    });
                }

                mapa.get(cursoId).totalSecciones += 1;
            });

            cursos = Array.from(mapa.values());
            cursosFiltrados = [...cursos];
            renderTabla(cursosFiltrados);

        } catch (error) {
            console.error('Error cargando cursos docente:', error);
            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="5">Error cargando cursos.</td></tr>';
            }
        }
    }

    function obtenerSeccionesDocente(data, session) {
        const docenteIdSesion = Number(
            session.docenteId ??
            session.userId ??
            0
        );

        return data.filter((s) => {
            const docenteIdFila = Number(
                s.DocenteID ??
                s.docenteId ??
                s.UsuarioDocenteID ??
                0
            );

            return docenteIdSesion > 0 && docenteIdFila === docenteIdSesion;
        });
    }

    function aplicarFiltros() {
        const texto = String(document.getElementById('filtro-docente-cursos')?.value || '')
            .trim()
            .toLowerCase();

        cursosFiltrados = cursos.filter((c) => {
            return (
                !texto ||
                String(c.CodigoCurso).toLowerCase().includes(texto) ||
                String(c.NombreCurso).toLowerCase().includes(texto)
            );
        });

        renderTabla(cursosFiltrados);
    }

    function renderTabla(data) {
        const tabla = document.getElementById('tabla-docente-cursos');
        if (!tabla) return;

        if (!data.length) {
            tabla.innerHTML = '<tr><td colspan="5">No tienes cursos asignados.</td></tr>';
            return;
        }

        tabla.innerHTML = data.map((c) => `
            <tr>
                <td>${escapeHtml(c.CodigoCurso)}</td>
                <td>${escapeHtml(c.NombreCurso)}</td>
                <td>${escapeHtml(c.Creditos)}</td>
                <td>${escapeHtml(c.totalSecciones)}</td>
                <td>
                    <button
                        type="button"
                        class="btn btn-outline"
                        onclick="window.UI?.openModal?.({
                            title: 'Detalle del curso',
                            body: '<p><strong>Código:</strong> ${escapeHtml(c.CodigoCurso)}</p><p><strong>Curso:</strong> ${escapeHtml(c.NombreCurso)}</p><p><strong>Créditos:</strong> ${escapeHtml(c.Creditos)}</p><p><strong>Secciones:</strong> ${escapeHtml(c.totalSecciones)}</p>',
                            showFooter: false
                        })"
                    >
                        Ver
                    </button>
                </td>
            </tr>
        `).join('');
    }

    return { init };
})();