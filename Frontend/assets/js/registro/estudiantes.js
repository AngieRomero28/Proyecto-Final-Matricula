// frontend/js/registro/estudiantes.js

window.Modules = window.Modules || {};

window.Modules.registroEstudiantes = (function () {
    let estudiantes = [];
    let estudiantesFiltrados = [];

    async function init() {
        await cargarEstudiantes();
        configurarEventos();
    }

    function configurarEventos() {
        const btnFiltrar = document.getElementById('btn-filtrar-registro-estudiantes');
        const inputBuscar = document.getElementById('filtro-registro-estudiantes');
        const selectEstado = document.getElementById('filtro-registro-estado-estudiante');

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

    async function cargarEstudiantes() {
        const tabla = document.getElementById('tabla-registro-estudiantes');

        try {
            window.UI.clearMessage('registro-estudiantes-message');

            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="7">Cargando estudiantes...</td></tr>';
            }

            const response = await window.ApiService.obtenerEstudiantes();
            estudiantes = Array.isArray(response.data) ? response.data : [];
            estudiantesFiltrados = [...estudiantes];

            renderResumen();
            renderTabla();
        } catch (error) {
            console.error('Error cargando estudiantes:', error);
            window.UI.showMessage(
                'registro-estudiantes-message',
                'danger',
                error.message || 'No se pudieron cargar los estudiantes.'
            );

            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="7">Error cargando estudiantes.</td></tr>';
            }
        }
    }

    function aplicarFiltros() {
        const texto = String(document.getElementById('filtro-registro-estudiantes')?.value || '')
            .trim()
            .toLowerCase();

        const estado = String(document.getElementById('filtro-registro-estado-estudiante')?.value || '')
            .trim()
            .toLowerCase();

        estudiantesFiltrados = estudiantes.filter((item) => {
            const coincideTexto =
                !texto ||
                String(item.Carnet || '').toLowerCase().includes(texto) ||
                String(item.NombreCompleto || item.NombreEstudiante || '').toLowerCase().includes(texto) ||
                String(item.CorreoInstitucional || '').toLowerCase().includes(texto) ||
                String(item.Identificacion || '').toLowerCase().includes(texto);

            const estadoAcademico = String(item.EstadoAcademico || item.Estado || '')
                .trim()
                .toLowerCase();

            const coincideEstado = !estado || estadoAcademico === estado;

            return coincideTexto && coincideEstado;
        });

        renderResumen();
        renderTabla();
    }

    function renderResumen() {
        setText('registro-estudiantes-total', estudiantesFiltrados.length);

        const activos = estudiantesFiltrados.filter((item) =>
            String(item.EstadoAcademico || item.Estado || '').trim().toLowerCase() === 'activo'
        ).length;

        setText('registro-estudiantes-activos', activos);
    }

    function renderTabla() {
        const tabla = document.getElementById('tabla-registro-estudiantes');
        if (!tabla) return;

        if (!estudiantesFiltrados.length) {
            tabla.innerHTML = '<tr><td colspan="7">No hay estudiantes para mostrar.</td></tr>';
            return;
        }

        tabla.innerHTML = estudiantesFiltrados.map((item) => `
            <tr>
                <td>${escapeHtml(item.EstudianteID || 'N/D')}</td>
                <td>${escapeHtml(item.Carnet || 'N/D')}</td>
                <td>${escapeHtml(item.NombreCompleto || item.NombreEstudiante || 'N/D')}</td>
                <td>${escapeHtml(item.CorreoInstitucional || 'N/D')}</td>
                <td>${escapeHtml(item.ProgramaAcademico || item.NombrePrograma || item.CodigoPrograma || 'N/D')}</td>
                <td>
                    <span class="badge ${getBadgeEstado(item.EstadoAcademico || item.Estado || 'N/D')}">
                        ${escapeHtml(item.EstadoAcademico || item.Estado || 'N/D')}
                    </span>
                </td>
                <td>
                    <button
                        class="btn btn-outline"
                        onclick="window.Modules.registroEstudiantes.verDetalle(${Number(item.EstudianteID)})"
                    >
                        Ver
                    </button>
                </td>
            </tr>
        `).join('');
    }

    function verDetalle(id) {
        const estudiante = estudiantes.find((item) => Number(item.EstudianteID) === Number(id));
        if (!estudiante) return;

        window.UI.openModal({
            title: `Estudiante ${escapeHtml(estudiante.Carnet || '')}`,
            body: `
                <p><strong>ID:</strong> ${escapeHtml(estudiante.EstudianteID || 'N/D')}</p>
                <p><strong>Carnet:</strong> ${escapeHtml(estudiante.Carnet || 'N/D')}</p>
                <p><strong>Nombre:</strong> ${escapeHtml(estudiante.NombreCompleto || estudiante.NombreEstudiante || 'N/D')}</p>
                <p><strong>Identificación:</strong> ${escapeHtml(estudiante.Identificacion || 'N/D')}</p>
                <p><strong>Correo:</strong> ${escapeHtml(estudiante.CorreoInstitucional || 'N/D')}</p>
                <p><strong>Teléfono:</strong> ${escapeHtml(estudiante.Telefono || 'N/D')}</p>
                <p><strong>Programa:</strong> ${escapeHtml(estudiante.ProgramaAcademico || estudiante.NombrePrograma || estudiante.CodigoPrograma || 'N/D')}</p>
                <p><strong>Estado:</strong> ${escapeHtml(estudiante.EstadoAcademico || estudiante.Estado || 'N/D')}</p>
            `,
            hideFooter: true
        });
    }

    function getBadgeEstado(estado) {
        switch (String(estado || '').trim().toLowerCase()) {
            case 'activo':
                return 'badge-success';
            case 'inactivo':
            case 'suspendido':
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