window.Modules = window.Modules || {};

window.Modules.cursos = (function () {
    let cursos = [];

    async function init() {
        await cargarCursos();
        configurarEventos();
    }

    function configurarEventos() {
        const btnNuevo = document.getElementById('btn-nuevo-curso');

        if (btnNuevo) {
            btnNuevo.textContent = 'Actualizar listado';
            btnNuevo.onclick = manejarRecargaCursos;
        }
    }

    async function manejarRecargaCursos() {
        UI.clearMessage('cursos-message');

        try {
            await cargarCursos();
            UI.showMessage(
                'cursos-message',
                'success',
                'Listado de cursos actualizado correctamente.'
            );
        } catch (error) {
            UI.showMessage(
                'cursos-message',
                'danger',
                error.message || 'No se pudo actualizar el listado.'
            );
        }
    }

    async function cargarCursos() {
        const tabla = document.getElementById('tabla-cursos');
        if (!tabla) return;

        try {
            tabla.innerHTML = `<tr><td colspan="6">Cargando...</td></tr>`;

            const response = await ApiService.obtenerCursos();
            cursos = Array.isArray(response.data) ? response.data : [];

            renderTabla();
        } catch (error) {
            console.error('Error cargando cursos:', error);
            tabla.innerHTML = `<tr><td colspan="6">Error cargando datos</td></tr>`;
            throw error;
        }
    }

    function renderTabla() {
        const tabla = document.getElementById('tabla-cursos');
        if (!tabla) return;

        if (!cursos.length) {
            tabla.innerHTML = `<tr><td colspan="6">No hay cursos registrados</td></tr>`;
            return;
        }

        tabla.innerHTML = cursos.map((cur) => {
            const estado = cur.EstadoCurso || 'N/D';
            const badgeClass = getBadgeEstado(estado);

            return `
                <tr>
                    <td>${escapeHtml(cur.CursoID)}</td>
                    <td>${escapeHtml(cur.CodigoCurso || 'N/D')}</td>
                    <td>${escapeHtml(cur.NombreCurso || 'N/D')}</td>
                    <td>${escapeHtml(cur.Creditos ?? 0)}</td>
                    <td>
                        <span class="badge ${badgeClass}">
                            ${escapeHtml(estado)}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-outline" onclick="Modules.cursos.ver(${Number(cur.CursoID)})">
                            Ver
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function ver(id) {
        const cur = cursos.find((c) => Number(c.CursoID) === Number(id));
        if (!cur) return;

        UI.openModal({
            title: 'Detalle del curso',
            body: `
                <p><strong>ID:</strong> ${escapeHtml(cur.CursoID)}</p>
                <p><strong>Código:</strong> ${escapeHtml(cur.CodigoCurso || 'N/D')}</p>
                <p><strong>Nombre:</strong> ${escapeHtml(cur.NombreCurso || 'N/D')}</p>
                <p><strong>Créditos:</strong> ${escapeHtml(cur.Creditos ?? 0)}</p>
                <p><strong>Descripción:</strong> ${escapeHtml(cur.Descripcion || 'N/D')}</p>
                <p><strong>Estado:</strong> ${escapeHtml(cur.EstadoCurso || 'N/D')}</p>
            `,
            hideFooter: true
        });
    }

    function getBadgeEstado(estado) {
        switch (String(estado || '').toLowerCase()) {
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
        ver
    };
})();