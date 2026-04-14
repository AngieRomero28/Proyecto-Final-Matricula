window.Modules = window.Modules || {};

window.Modules.estudiantes = (function () {
    let estudiantes = [];

    async function init() {
        await cargarEstudiantes();
        configurarEventos();
    }

    function configurarEventos() {
        const btnNuevo = document.getElementById('btn-nuevo-estudiante');

        if (btnNuevo) {
            btnNuevo.textContent = 'Actualizar listado';
            btnNuevo.onclick = manejarRecargaEstudiantes;
        }
    }

    async function manejarRecargaEstudiantes() {
        UI.clearMessage('estudiantes-message');

        try {
            await cargarEstudiantes();
            UI.showMessage(
                'estudiantes-message',
                'success',
                'Listado de estudiantes actualizado correctamente.'
            );
        } catch (error) {
            UI.showMessage(
                'estudiantes-message',
                'danger',
                error.message || 'No se pudo actualizar el listado.'
            );
        }
    }

    async function cargarEstudiantes() {
        const tabla = document.getElementById('tabla-estudiantes');
        if (!tabla) return;

        try {
            tabla.innerHTML = `<tr><td colspan="5">Cargando...</td></tr>`;

            const response = await ApiService.obtenerEstudiantes();
            estudiantes = Array.isArray(response.data) ? response.data : [];

            renderTabla();
        } catch (error) {
            console.error('Error cargando estudiantes:', error);
            tabla.innerHTML = `<tr><td colspan="5">Error cargando datos</td></tr>`;
            throw error;
        }
    }

    function renderTabla() {
        const tabla = document.getElementById('tabla-estudiantes');
        if (!tabla) return;

        if (!estudiantes.length) {
            tabla.innerHTML = `<tr><td colspan="5">No hay estudiantes registrados</td></tr>`;
            return;
        }

        tabla.innerHTML = estudiantes.map((est) => {
            const estado = est.EstadoAcademico || 'N/D';
            const badgeClass = getBadgeEstado(estado);

            return `
                <tr>
                    <td>${escapeHtml(est.EstudianteID)}</td>
                    <td>${escapeHtml(est.NombreCompleto || 'N/D')}</td>
                    <td>${escapeHtml(est.CorreoInstitucional || 'N/D')}</td>
                    <td>
                        <span class="badge ${badgeClass}">
                            ${escapeHtml(estado)}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-outline" onclick="Modules.estudiantes.ver(${Number(est.EstudianteID)})">
                            Ver
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function ver(id) {
        const est = estudiantes.find((e) => Number(e.EstudianteID) === Number(id));
        if (!est) return;

        UI.openModal({
            title: 'Detalle del estudiante',
            body: `
                <p><strong>ID Estudiante:</strong> ${escapeHtml(est.EstudianteID)}</p>
                <p><strong>Carnet:</strong> ${escapeHtml(est.Carnet || 'N/D')}</p>
                <p><strong>Estado académico:</strong> ${escapeHtml(est.EstadoAcademico || 'N/D')}</p>
                <p><strong>Fecha de ingreso:</strong> ${escapeHtml(formatearFecha(est.FechaIngreso))}</p>
                <hr>
                <p><strong>ID Usuario:</strong> ${escapeHtml(est.UsuarioID || 'N/D')}</p>
                <p><strong>Identificación:</strong> ${escapeHtml(est.Identificacion || 'N/D')}</p>
                <p><strong>Nombre completo:</strong> ${escapeHtml(est.NombreCompleto || 'N/D')}</p>
                <p><strong>Correo institucional:</strong> ${escapeHtml(est.CorreoInstitucional || 'N/D')}</p>
                <p><strong>Estado usuario:</strong> ${escapeHtml(est.EstadoUsuario || 'N/D')}</p>
                <hr>
                <p><strong>Programa académico:</strong> ${escapeHtml(est.NombrePrograma || 'N/D')}</p>
                <p><strong>Código programa:</strong> ${escapeHtml(est.CodigoPrograma || 'N/D')}</p>
            `,
            hideFooter: true
        });
    }

    function getBadgeEstado(estado) {
        switch (String(estado || '').toLowerCase()) {
            case 'activo':
                return 'badge-success';
            case 'inactivo':
            case 'suspendido':
                return 'badge-danger';
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