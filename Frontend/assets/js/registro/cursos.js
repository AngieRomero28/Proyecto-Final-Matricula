// frontend/js/registro/cursos.js

window.Modules = window.Modules || {};

window.Modules.registroCursos = (function () {
    let cursos = [];
    let cursosFiltrados = [];

    async function init() {
        await cargarCursos();
        configurarEventos();
    }

    function configurarEventos() {
        const btnFiltrar = document.getElementById('btn-filtrar-registro-cursos');
        const inputBuscar = document.getElementById('filtro-registro-cursos');

        if (btnFiltrar && !btnFiltrar.dataset.bound) {
            btnFiltrar.dataset.bound = 'true';
            btnFiltrar.addEventListener('click', aplicarFiltros);
        }

        if (inputBuscar && !inputBuscar.dataset.bound) {
            inputBuscar.dataset.bound = 'true';
            inputBuscar.addEventListener('input', aplicarFiltros);
        }
    }

    async function cargarCursos() {
        const tabla = document.getElementById('tabla-registro-cursos');

        try {
            window.UI.clearMessage('registro-cursos-message');

            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="6">Cargando cursos...</td></tr>';
            }

            const response = await window.ApiService.obtenerCursos();
            cursos = Array.isArray(response.data) ? response.data : [];
            cursosFiltrados = [...cursos];

            renderResumen();
            renderTabla();
        } catch (error) {
            console.error('Error cargando cursos:', error);
            window.UI.showMessage(
                'registro-cursos-message',
                'danger',
                error.message || 'No se pudieron cargar los cursos.'
            );

            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="6">Error cargando cursos.</td></tr>';
            }
        }
    }

    function aplicarFiltros() {
        const texto = String(document.getElementById('filtro-registro-cursos')?.value || '')
            .trim()
            .toLowerCase();

        cursosFiltrados = cursos.filter((item) => {
            return (
                !texto ||
                String(item.CodigoCurso || '').toLowerCase().includes(texto) ||
                String(item.NombreCurso || '').toLowerCase().includes(texto) ||
                String(item.Descripcion || '').toLowerCase().includes(texto)
            );
        });

        renderResumen();
        renderTabla();
    }

    function renderResumen() {
        setText('registro-cursos-total', cursosFiltrados.length);

        const activos = cursosFiltrados.filter((item) =>
            String(item.EstadoCurso || item.Estado || '').trim().toLowerCase() === 'activo'
        ).length;

        const creditos = cursosFiltrados.reduce(
            (acc, item) => acc + Number(item.Creditos || 0),
            0
        );

        setText('registro-cursos-activos', activos);
        setText('registro-cursos-creditos', creditos);
    }

    function renderTabla() {
        const tabla = document.getElementById('tabla-registro-cursos');
        if (!tabla) return;

        if (!cursosFiltrados.length) {
            tabla.innerHTML = '<tr><td colspan="6">No hay cursos para mostrar.</td></tr>';
            return;
        }

        tabla.innerHTML = cursosFiltrados.map((item) => `
            <tr>
                <td>${escapeHtml(item.CursoID || 'N/D')}</td>
                <td>${escapeHtml(item.CodigoCurso || 'N/D')}</td>
                <td>${escapeHtml(item.NombreCurso || 'N/D')}</td>
                <td>${escapeHtml(item.Creditos ?? 0)}</td>
                <td>
                    <span class="badge ${getBadgeEstado(item.EstadoCurso || item.Estado || 'N/D')}">
                        ${escapeHtml(item.EstadoCurso || item.Estado || 'N/D')}
                    </span>
                </td>
                <td>
                    <button
                        class="btn btn-outline"
                        onclick="window.Modules.registroCursos.verDetalle(${Number(item.CursoID)})"
                    >
                        Ver
                    </button>
                </td>
            </tr>
        `).join('');
    }

    function verDetalle(id) {
        const curso = cursos.find((item) => Number(item.CursoID) === Number(id));
        if (!curso) return;

        window.UI.openModal({
            title: `Curso ${escapeHtml(curso.CodigoCurso || '')}`,
            body: `
                <p><strong>ID:</strong> ${escapeHtml(curso.CursoID || 'N/D')}</p>
                <p><strong>Código:</strong> ${escapeHtml(curso.CodigoCurso || 'N/D')}</p>
                <p><strong>Nombre:</strong> ${escapeHtml(curso.NombreCurso || 'N/D')}</p>
                <p><strong>Créditos:</strong> ${escapeHtml(curso.Creditos ?? 0)}</p>
                <p><strong>Descripción:</strong> ${escapeHtml(curso.Descripcion || 'N/D')}</p>
                <p><strong>Estado:</strong> ${escapeHtml(curso.EstadoCurso || curso.Estado || 'N/D')}</p>
            `,
            hideFooter: true
        });
    }

    function getBadgeEstado(estado) {
        switch (String(estado || '').trim().toLowerCase()) {
            case 'activo':
                return 'badge-success';
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
        verDetalle
    };
})();