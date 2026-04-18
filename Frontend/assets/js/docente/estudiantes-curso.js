window.Modules = window.Modules || {};

window.Modules.docenteEstudiantesCurso = (function () {
    let seccionesDocente = [];

    async function init() {
        await cargarSecciones();
        configurarEvento();
    }

    async function cargarSecciones() {
        const session = window.Auth.getSession();
        const select = document.getElementById('select-docente-seccion');
        const tabla = document.getElementById('tabla-docente-estudiantes');

        if (!session?.userId) {
            if (select) {
                select.innerHTML = '<option value="">Sesión no válida</option>';
            }
            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="4">Sesión no válida.</td></tr>';
            }
            return;
        }

        try {
            const response = await window.ApiService.obtenerSecciones();
            const data = Array.isArray(response.data) ? response.data : [];

            seccionesDocente = obtenerSeccionesDocente(data, session);

            if (!select) return;

            if (!seccionesDocente.length) {
                select.innerHTML = '<option value="">No tienes secciones asignadas</option>';
                return;
            }

            select.innerHTML =
                '<option value="">Seleccione una sección</option>' +
                seccionesDocente.map((s) => `
                    <option value="${s.SeccionID}">
                        ${escapeHtml(s.NombreCurso || '')} - Sección ${escapeHtml(s.NumeroSeccion || '')}
                    </option>
                `).join('');
        } catch (error) {
            console.error('Error cargando secciones del docente:', error);

            if (select) {
                select.innerHTML = '<option value="">Error cargando secciones</option>';
            }

            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="4">Error cargando secciones.</td></tr>';
            }
        }
    }

    function configurarEvento() {
        const btn = document.getElementById('btn-cargar-estudiantes-curso');

        if (btn && !btn.dataset.bound) {
            btn.dataset.bound = 'true';
            btn.addEventListener('click', cargarEstudiantes);
        }
    }

    async function cargarEstudiantes() {
        const seccionId = Number(document.getElementById('select-docente-seccion')?.value || 0);
        const tabla = document.getElementById('tabla-docente-estudiantes');

        if (!seccionId) {
            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="4">Seleccione una sección.</td></tr>';
            }
            return;
        }

        try {
            const response = await window.ApiService.obtenerMatriculas();
            const data = Array.isArray(response.data) ? response.data : [];

            const estudiantes = data.filter((m) => {
                const idFila = Number(
                    m.SeccionID ??
                    m.seccionId ??
                    0
                );

                return idFila === seccionId;
            });

            if (!estudiantes.length) {
                tabla.innerHTML = '<tr><td colspan="4">No hay estudiantes.</td></tr>';
                return;
            }

            tabla.innerHTML = estudiantes.map((e) => `
                <tr>
                    <td>${escapeHtml(e.Carnet || e.CarnetEstudiante || 'N/D')}</td>
                    <td>${escapeHtml(e.NombreEstudiante || e.Estudiante || 'N/D')}</td>
                    <td>${escapeHtml(e.CorreoInstitucional || e.Correo || 'N/D')}</td>
                    <td>${escapeHtml(e.EstadoAcademico || 'N/D')}</td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error cargando estudiantes por sección:', error);
            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="4">Error cargando estudiantes.</td></tr>';
            }
        }
    }

    function obtenerSeccionesDocente(data, session) {
        const normalizadas = window.normalizarSecciones
            ? window.normalizarSecciones(data)
            : data;

        const docenteIdSesion = Number(
            session.docenteId ??
            session.userId ??
            0
        );

        return normalizadas.filter((s) => {
            const docenteIdFila = Number(
                s.DocenteID ??
                s.docenteId ??
                s.UsuarioDocenteID ??
                0
            );

            return docenteIdSesion > 0 && docenteIdFila === docenteIdSesion;
        });
    }

    return { init };
})();