window.Modules = window.Modules || {};

window.Modules.usuarios = (function () {
    let usuarios = [];
    let usuariosFiltrados = [];

    async function init() {
        await cargarUsuarios();
        configurarEventos();
    }

    function configurarEventos() {
        const btnFiltrar = document.getElementById('btn-filtrar-usuarios');
        const inputBuscar = document.getElementById('filtro-usuario-buscar');
        const selectRol = document.getElementById('filtro-usuario-rol');
        const selectEstado = document.getElementById('filtro-usuario-estado');
        const btnNuevo = document.getElementById('btn-nuevo-usuario');

        if (btnFiltrar) {
            btnFiltrar.addEventListener('click', aplicarFiltros);
        }

        if (inputBuscar) {
            inputBuscar.addEventListener('input', aplicarFiltros);
        }

        if (selectRol) {
            selectRol.addEventListener('change', aplicarFiltros);
        }

        if (selectEstado) {
            selectEstado.addEventListener('change', aplicarFiltros);
        }

        if (btnNuevo) {
            btnNuevo.addEventListener('click', mostrarAvisoNuevoUsuario);
        }
    }

    async function cargarUsuarios() {
        const tabla = document.getElementById('tabla-usuarios');

        try {
            if (tabla) {
                tabla.innerHTML = `<tr><td colspan="6">Cargando usuarios...</td></tr>`;
            }

            const response = await ApiService.obtenerUsuarios();
            usuarios = Array.isArray(response.data) ? response.data : [];
            usuariosFiltrados = [...usuarios];

            renderResumen();
            renderTabla();
        } catch (error) {
            console.error('Error cargando usuarios:', error);
            if (tabla) {
                tabla.innerHTML = `<tr><td colspan="6">Error cargando usuarios</td></tr>`;
            }
            UI.showMessage('usuarios-message', 'danger', error.message || 'No se pudieron cargar los usuarios.');
        }
    }

    function aplicarFiltros() {
        const texto = String(document.getElementById('filtro-usuario-buscar')?.value || '').trim().toLowerCase();
        const rol = String(document.getElementById('filtro-usuario-rol')?.value || '').trim();
        const estado = String(document.getElementById('filtro-usuario-estado')?.value || '').trim();

        usuariosFiltrados = usuarios.filter((usuario) => {
            const coincideTexto =
                !texto ||
                String(usuario.NombreCompleto || '').toLowerCase().includes(texto) ||
                String(usuario.CorreoInstitucional || '').toLowerCase().includes(texto) ||
                String(usuario.Identificacion || '').toLowerCase().includes(texto);

            const coincideRol =
                !rol || String(usuario.RolSistema || '') === rol;

            const coincideEstado =
                !estado || String(usuario.EstadoUsuario || '') === estado;

            return coincideTexto && coincideRol && coincideEstado;
        });

        renderResumen();
        renderTabla();
    }

    function renderResumen() {
        const total = usuariosFiltrados.length;
        const activos = usuariosFiltrados.filter((u) => String(u.EstadoUsuario || '').toLowerCase() === 'activo').length;
        const estudiantes = usuariosFiltrados.filter((u) => String(u.RolSistema || '') === 'Estudiante').length;
        const docentes = usuariosFiltrados.filter((u) => String(u.RolSistema || '') === 'Docente').length;

        setText('usuarios-total', total);
        setText('usuarios-activos', activos);
        setText('usuarios-estudiantes', estudiantes);
        setText('usuarios-docentes', docentes);
    }

    function renderTabla() {
        const tabla = document.getElementById('tabla-usuarios');
        if (!tabla) return;

        if (!usuariosFiltrados.length) {
            tabla.innerHTML = `<tr><td colspan="6">No hay usuarios para mostrar</td></tr>`;
            return;
        }

        tabla.innerHTML = usuariosFiltrados.map((usuario) => `
            <tr>
                <td>${usuario.UsuarioID}</td>
                <td>${escapeHtml(usuario.NombreCompleto || '')}</td>
                <td>${escapeHtml(usuario.CorreoInstitucional || '')}</td>
                <td>
                    <span class="badge ${getBadgeRol(usuario.RolSistema)}">
                        ${escapeHtml(usuario.RolSistema || 'Usuario')}
                    </span>
                </td>
                <td>
                    <span class="badge ${getBadgeEstado(usuario.EstadoUsuario)}">
                        ${escapeHtml(usuario.EstadoUsuario || 'N/D')}
                    </span>
                </td>
                <td>
                    <button class="btn btn-outline" onclick="Modules.usuarios.verDetalle(${usuario.UsuarioID})">
                        Ver
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async function verDetalle(id) {
        try {
            const response = await ApiService.obtenerUsuarioPorId(id);
            const usuario = response.data || {};

            UI.openModal({
                title: `Usuario #${usuario.UsuarioID || ''}`,
                body: `
                    <div class="resumen-financiero">
                        <div class="mini-card">
                            <div class="mini-card-label">ID</div>
                            <div class="mini-card-value">${usuario.UsuarioID || 'N/D'}</div>
                        </div>
                        <div class="mini-card">
                            <div class="mini-card-label">Rol</div>
                            <div class="mini-card-value">${escapeHtml(usuario.RolSistema || 'Usuario')}</div>
                        </div>
                        <div class="mini-card">
                            <div class="mini-card-label">Estado</div>
                            <div class="mini-card-value">${escapeHtml(usuario.EstadoUsuario || 'N/D')}</div>
                        </div>
                    </div>

                    <div class="mt-2">
                        <p><strong>Nombre completo:</strong> ${escapeHtml(usuario.NombreCompleto || '')}</p>
                        <p><strong>Identificación:</strong> ${escapeHtml(usuario.Identificacion || '')}</p>
                        <p><strong>Correo institucional:</strong> ${escapeHtml(usuario.CorreoInstitucional || '')}</p>
                        <p><strong>Rol del sistema:</strong> ${escapeHtml(usuario.RolSistema || 'Usuario')}</p>
                        <p><strong>Estado del usuario:</strong> ${escapeHtml(usuario.EstadoUsuario || '')}</p>
                    </div>
                `,
                hideFooter: true
            });
        } catch (error) {
            console.error('Error obteniendo detalle del usuario:', error);
            UI.showMessage('usuarios-message', 'danger', error.message || 'No se pudo obtener el detalle del usuario.');
        }
    }

    function mostrarAvisoNuevoUsuario() {
        UI.openModal({
            title: 'Gestión de usuarios',
            body: `
                <div class="alert alert-info">
                    Este módulo ya muestra usuarios reales del sistema.
                    <br><br>
                    La creación y edición de usuarios todavía no está habilitada en el backend actual.
                    Cuando quieras, seguimos con esa parte y te doy los endpoints y formularios completos.
                </div>
            `,
            hideFooter: true
        });
    }

    function getBadgeRol(rol) {
        switch (rol) {
            case 'Estudiante':
                return 'badge-success';
            case 'Docente':
                return 'badge-warning';
            case 'Usuario':
                return 'badge-info';
            default:
                return 'badge-gray';
        }
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

    function setText(id, value) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = value;
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