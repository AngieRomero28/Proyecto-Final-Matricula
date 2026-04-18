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

        if (btnFiltrar && !btnFiltrar.dataset.bound) {
            btnFiltrar.dataset.bound = 'true';
            btnFiltrar.addEventListener('click', aplicarFiltros);
        }

        if (inputBuscar && !inputBuscar.dataset.bound) {
            inputBuscar.dataset.bound = 'true';
            inputBuscar.addEventListener('input', aplicarFiltros);
        }

        if (selectRol && !selectRol.dataset.bound) {
            selectRol.dataset.bound = 'true';
            selectRol.addEventListener('change', aplicarFiltros);
        }

        if (selectEstado && !selectEstado.dataset.bound) {
            selectEstado.dataset.bound = 'true';
            selectEstado.addEventListener('change', aplicarFiltros);
        }

        if (btnNuevo && !btnNuevo.dataset.bound) {
            btnNuevo.dataset.bound = 'true';
            btnNuevo.addEventListener('click', mostrarAvisoNuevoUsuario);
        }
    }

    async function cargarUsuarios() {
        const tabla = document.getElementById('tabla-usuarios');

        try {
            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="6">Cargando usuarios...</td></tr>';
            }

            const response = await window.ApiService.obtenerUsuarios();
            usuarios = Array.isArray(response.data) ? response.data : [];
            usuariosFiltrados = [...usuarios];

            renderResumen();
            renderTabla();
        } catch (error) {
            console.error('Error cargando usuarios:', error);
            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="6">Error cargando usuarios</td></tr>';
            }
            window.UI.showMessage(
                'usuarios-message',
                'danger',
                error.message || 'No se pudieron cargar los usuarios.'
            );
        }
    }

    function aplicarFiltros() {
        const texto = String(document.getElementById('filtro-usuario-buscar')?.value || '')
            .trim()
            .toLowerCase();

        const rol = String(document.getElementById('filtro-usuario-rol')?.value || '')
            .trim()
            .toLowerCase();

        const estado = String(document.getElementById('filtro-usuario-estado')?.value || '')
            .trim()
            .toLowerCase();

        usuariosFiltrados = usuarios.filter((usuario) => {
            const rolPrincipal = obtenerRolPrincipal(usuario).toLowerCase();
            const estadoUsuario = String(usuario.EstadoUsuario || '').trim().toLowerCase();

            const coincideTexto =
                !texto ||
                String(usuario.NombreCompleto || '').toLowerCase().includes(texto) ||
                String(usuario.CorreoInstitucional || '').toLowerCase().includes(texto) ||
                String(usuario.Identificacion || '').toLowerCase().includes(texto) ||
                String(usuario.Username || '').toLowerCase().includes(texto);

            const coincideRol = !rol || rolPrincipal === rol;
            const coincideEstado = !estado || estadoUsuario === estado;

            return coincideTexto && coincideRol && coincideEstado;
        });

        renderResumen();
        renderTabla();
    }

    function renderResumen() {
        const total = usuariosFiltrados.length;
        const activos = usuariosFiltrados.filter(
            (u) => String(u.EstadoUsuario || '').toLowerCase() === 'activo'
        ).length;

        const estudiantes = usuariosFiltrados.filter(
            (u) => obtenerRolPrincipal(u).toLowerCase() === 'estudiante'
        ).length;

        const docentes = usuariosFiltrados.filter(
            (u) => obtenerRolPrincipal(u).toLowerCase() === 'docente'
        ).length;

        setText('usuarios-total', total);
        setText('usuarios-activos', activos);
        setText('usuarios-estudiantes', estudiantes);
        setText('usuarios-docentes', docentes);
    }

    function renderTabla() {
        const tabla = document.getElementById('tabla-usuarios');
        if (!tabla) return;

        if (!usuariosFiltrados.length) {
            tabla.innerHTML = '<tr><td colspan="6">No hay usuarios para mostrar</td></tr>';
            return;
        }

        tabla.innerHTML = usuariosFiltrados.map((usuario) => {
            const rolPrincipal = obtenerRolPrincipal(usuario);

            return `
                <tr>
                    <td>${escapeHtml(usuario.UsuarioID)}</td>
                    <td>${escapeHtml(usuario.NombreCompleto || '')}</td>
                    <td>${escapeHtml(usuario.CorreoInstitucional || '')}</td>
                    <td>
                        <span class="badge ${getBadgeRol(rolPrincipal)}">
                            ${escapeHtml(rolPrincipal || 'Usuario')}
                        </span>
                    </td>
                    <td>
                        <span class="badge ${getBadgeEstado(usuario.EstadoUsuario)}">
                            ${escapeHtml(usuario.EstadoUsuario || 'N/D')}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-outline" onclick="window.Modules.usuarios.verDetalle(${usuario.UsuarioID})">
                            Ver
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    async function verDetalle(id) {
        try {
            const response = await window.ApiService.obtenerUsuarioPorId(id);
            const usuario = response.data || {};
            const rolPrincipal = obtenerRolPrincipal(usuario);

            window.UI.openModal({
                title: `Usuario #${usuario.UsuarioID || ''}`,
                body: `
                    <div class="resumen-financiero">
                        <div class="mini-card">
                            <div class="mini-card-label">ID</div>
                            <div class="mini-card-value">${usuario.UsuarioID || 'N/D'}</div>
                        </div>
                        <div class="mini-card">
                            <div class="mini-card-label">Rol</div>
                            <div class="mini-card-value">${escapeHtml(rolPrincipal || 'Usuario')}</div>
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
                        <p><strong>Username:</strong> ${escapeHtml(usuario.Username || '')}</p>
                        <p><strong>Rol principal:</strong> ${escapeHtml(rolPrincipal || 'Usuario')}</p>
                        <p><strong>Estado del usuario:</strong> ${escapeHtml(usuario.EstadoUsuario || '')}</p>
                    </div>
                `,
                hideFooter: true
            });
        } catch (error) {
            console.error('Error obteniendo detalle del usuario:', error);
            window.UI.showMessage(
                'usuarios-message',
                'danger',
                error.message || 'No se pudo obtener el detalle del usuario.'
            );
        }
    }

    function mostrarAvisoNuevoUsuario() {
        window.UI.openModal({
            title: 'Gestión de usuarios',
            body: `
                <div class="alert alert-info">
                    Este módulo ya muestra usuarios reales del sistema.
                    <br><br>
                    La creación y edición de usuarios todavía no está habilitada en el backend actual.
                </div>
            `,
            hideFooter: true
        });
    }

    function obtenerRolPrincipal(usuario) {
        if (usuario?.RolPrincipal) {
            return String(usuario.RolPrincipal).trim();
        }

        if (Array.isArray(usuario?.Roles) && usuario.Roles.length) {
            const rol = usuario.Roles[0];
            if (typeof rol === 'string') {
                return rol;
            }

            return String(
                rol?.NombreRol ||
                rol?.rol ||
                'Usuario'
            ).trim();
        }

        return String(usuario?.RolSistema || 'Usuario').trim();
    }

    function getBadgeRol(rol) {
        return window.getBadgeRol ? window.getBadgeRol(rol) : 'badge-gray';
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

    return {
        init,
        verDetalle
    };
})();