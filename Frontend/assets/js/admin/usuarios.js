// frontend/js/admin/usuarios.js
window.Modules = window.Modules || {};

window.Modules.adminUsuarios = (function () {
    let usuarios = [];
    let usuariosFiltrados = [];

    async function init() {
        await cargarUsuarios();
        configurarEventos();
    }

    function configurarEventos() {
        const btnFiltrar = document.getElementById('btn-filtrar-admin-usuarios');
        const inputBuscar = document.getElementById('filtro-admin-usuario-buscar');
        const selectRol = document.getElementById('filtro-admin-usuario-rol');
        const selectEstado = document.getElementById('filtro-admin-usuario-estado');
        const btnNuevo = document.getElementById('btn-admin-nuevo-usuario');

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
            btnNuevo.addEventListener('click', abrirModalNuevoUsuario);
        }
    }

    async function cargarUsuarios() {
        const tabla = document.getElementById('tabla-admin-usuarios');

        try {
            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="6">Cargando usuarios...</td></tr>';
            }

            window.UI?.clearMessage?.('admin-usuarios-message');

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
                'admin-usuarios-message',
                'danger',
                error.message || 'No se pudieron cargar los usuarios.'
            );
        }
    }

    function aplicarFiltros() {
        const texto = String(document.getElementById('filtro-admin-usuario-buscar')?.value || '')
            .trim()
            .toLowerCase();

        const rol = String(document.getElementById('filtro-admin-usuario-rol')?.value || '')
            .trim()
            .toLowerCase();

        const estado = String(document.getElementById('filtro-admin-usuario-estado')?.value || '')
            .trim()
            .toLowerCase();

        usuariosFiltrados = usuarios.filter((usuario) => {
            const rolesUsuario = obtenerRolesTexto(usuario).toLowerCase();
            const estadoUsuario = String(usuario.EstadoUsuario || '').trim().toLowerCase();

            const coincideTexto =
                !texto ||
                String(usuario.NombreCompleto || '').toLowerCase().includes(texto) ||
                String(usuario.CorreoInstitucional || '').toLowerCase().includes(texto) ||
                String(usuario.Identificacion || '').toLowerCase().includes(texto) ||
                String(usuario.Username || '').toLowerCase().includes(texto);

            const coincideRol = !rol || rolesUsuario.includes(rol);
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
            (u) => obtenerRolesArray(u).some((rol) => rol.toLowerCase() === 'estudiante')
        ).length;

        const docentes = usuariosFiltrados.filter(
            (u) => obtenerRolesArray(u).some((rol) => rol.toLowerCase() === 'docente')
        ).length;

        setText('admin-usuarios-total', total);
        setText('admin-usuarios-activos', activos);
        setText('admin-usuarios-estudiantes', estudiantes);
        setText('admin-usuarios-docentes', docentes);
    }

    function renderTabla() {
        const tabla = document.getElementById('tabla-admin-usuarios');
        if (!tabla) return;

        if (!usuariosFiltrados.length) {
            tabla.innerHTML = '<tr><td colspan="6">No hay usuarios para mostrar</td></tr>';
            return;
        }

        tabla.innerHTML = usuariosFiltrados.map((usuario) => {
            const rolesTexto = obtenerRolesTexto(usuario);

            return `
                <tr>
                    <td>${escapeHtml(usuario.UsuarioID)}</td>
                    <td>${escapeHtml(usuario.NombreCompleto || '')}</td>
                    <td>${escapeHtml(usuario.CorreoInstitucional || '')}</td>
                    <td>
                        <span class="badge badge-info">
                            ${escapeHtml(rolesTexto || 'Usuario')}
                        </span>
                    </td>
                    <td>
                        <span class="badge ${getBadgeEstado(usuario.EstadoUsuario)}">
                            ${escapeHtml(usuario.EstadoUsuario || 'N/D')}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-outline" onclick="window.Modules.adminUsuarios.verDetalle(${usuario.UsuarioID})">
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
            const rolesTexto = obtenerRolesTexto(usuario);

            window.UI.openModal({
                title: `Usuario #${usuario.UsuarioID || ''}`,
                body: `
                    <div class="resumen-financiero">
                        <div class="mini-card">
                            <div class="mini-card-label">ID</div>
                            <div class="mini-card-value">${usuario.UsuarioID || 'N/D'}</div>
                        </div>
                        <div class="mini-card">
                            <div class="mini-card-label">Roles</div>
                            <div class="mini-card-value">${escapeHtml(rolesTexto || 'Usuario')}</div>
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
                        <p><strong>Roles del usuario:</strong> ${escapeHtml(rolesTexto || 'Usuario')}</p>
                        <p><strong>Estado del usuario:</strong> ${escapeHtml(usuario.EstadoUsuario || '')}</p>
                    </div>
                `,
                hideFooter: true
            });
        } catch (error) {
            console.error('Error obteniendo detalle del usuario:', error);
            window.UI.showMessage(
                'admin-usuarios-message',
                'danger',
                error.message || 'No se pudo obtener el detalle del usuario.'
            );
        }
    }

    function abrirModalNuevoUsuario() {
        window.UI.openModal({
            title: 'Crear nuevo usuario',
            body: `
                <div class="form-grid">
                    <div>
                        <label for="admin-usuario-tipo">Tipo de usuario</label>
                        <select id="admin-usuario-tipo">
                            <option value="">Seleccione</option>
                            <option value="estudiante">Estudiante</option>
                            <option value="docente">Docente</option>
                        </select>
                    </div>

                    <div>
                        <label for="admin-usuario-estado">Estado</label>
                        <select id="admin-usuario-estado">
                            <option value="Activo">Activo</option>
                            <option value="Inactivo">Inactivo</option>
                        </select>
                    </div>

                    <div>
                        <label for="admin-usuario-username">Username</label>
                        <input type="text" id="admin-usuario-username" placeholder="usuario123">
                    </div>

                    <div>
                        <label for="admin-usuario-identificacion">Identificación</label>
                        <input type="text" id="admin-usuario-identificacion" placeholder="Ej: 123456789">
                    </div>

                    <div>
                        <label for="admin-usuario-nombre">Nombre</label>
                        <input type="text" id="admin-usuario-nombre" placeholder="Nombre">
                    </div>

                    <div>
                        <label for="admin-usuario-apellido1">Primer apellido</label>
                        <input type="text" id="admin-usuario-apellido1" placeholder="Primer apellido">
                    </div>

                    <div>
                        <label for="admin-usuario-apellido2">Segundo apellido</label>
                        <input type="text" id="admin-usuario-apellido2" placeholder="Segundo apellido">
                    </div>

                    <div>
                        <label for="admin-usuario-correo">Correo institucional</label>
                        <input type="email" id="admin-usuario-correo" placeholder="correo@dominio.com">
                    </div>

                    <div>
                        <label for="admin-usuario-telefono">Teléfono</label>
                        <input type="text" id="admin-usuario-telefono" placeholder="88888888">
                    </div>

                    <div>
                        <label for="admin-usuario-password">Contraseña temporal</label>
                        <input type="password" id="admin-usuario-password" placeholder="Temporal123!">
                    </div>
                </div>

                <div id="bloque-admin-usuario-estudiante" style="display:none; margin-top:16px;">
                    <h4>Datos del estudiante</h4>
                    <div class="form-grid">
                        <div>
                            <label for="admin-usuario-carnet">Carnet</label>
                            <input type="text" id="admin-usuario-carnet" placeholder="Carnet">
                        </div>

                        <div>
                            <label for="admin-usuario-programa">Programa académico ID</label>
                            <input type="number" id="admin-usuario-programa" placeholder="1">
                        </div>

                        <div>
                            <label for="admin-usuario-plan">Plan de estudio ID</label>
                            <input type="number" id="admin-usuario-plan" placeholder="1">
                        </div>

                        <div>
                            <label for="admin-usuario-fecha-ingreso">Fecha de ingreso</label>
                            <input type="date" id="admin-usuario-fecha-ingreso">
                        </div>

                        <div>
                            <label for="admin-usuario-estado-academico">Estado académico</label>
                            <select id="admin-usuario-estado-academico">
                                <option value="Activo">Activo</option>
                                <option value="Inactivo">Inactivo</option>
                                <option value="Suspendido">Suspendido</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div id="bloque-admin-usuario-docente" style="display:none; margin-top:16px;">
                    <h4>Datos del docente</h4>
                    <div class="form-grid">
                        <div>
                            <label for="admin-usuario-especialidad">Especialidad</label>
                            <input type="text" id="admin-usuario-especialidad" placeholder="Especialidad">
                        </div>

                        <div>
                            <label for="admin-usuario-fecha-contratacion">Fecha de contratación</label>
                            <input type="date" id="admin-usuario-fecha-contratacion">
                        </div>

                        <div>
                            <label for="admin-usuario-estado-docente">Estado docente</label>
                            <select id="admin-usuario-estado-docente">
                                <option value="Activo">Activo</option>
                                <option value="Inactivo">Inactivo</option>
                            </select>
                        </div>
                    </div>
                </div>
            `,
            confirmText: 'Crear usuario',
            cancelText: 'Cancelar',
            onOpen: () => {
                const selectTipo = document.getElementById('admin-usuario-tipo');
                if (selectTipo && !selectTipo.dataset.bound) {
                    selectTipo.dataset.bound = 'true';
                    selectTipo.addEventListener('change', toggleBloquesTipoUsuario);
                }
            },
            onConfirm: async () => {
                const nombre = String(document.getElementById('admin-usuario-nombre')?.value || '').trim();
                const apellido1 = String(document.getElementById('admin-usuario-apellido1')?.value || '').trim();
                const apellido2 = String(document.getElementById('admin-usuario-apellido2')?.value || '').trim();

                const nombreCompletoNuevo = construirNombreCompleto(nombre, apellido1, apellido2);

                const existeNombreCompleto = usuarios.some((u) => {
                    const actual = construirNombreCompletoDesdeUsuario(u);
                    return actual && actual.toLowerCase() === nombreCompletoNuevo.toLowerCase();
                });

                if (existeNombreCompleto) {
                    throw new Error('Ya existe un usuario con el mismo nombre completo.');
                }

                const body = {
                    TipoUsuario: String(document.getElementById('admin-usuario-tipo')?.value || '').trim(),
                    EstadoUsuario: String(document.getElementById('admin-usuario-estado')?.value || 'Activo').trim(),
                    Username: String(document.getElementById('admin-usuario-username')?.value || '').trim(),
                    Identificacion: String(document.getElementById('admin-usuario-identificacion')?.value || '').trim(),
                    Nombre: nombre,
                    Apellido1: apellido1,
                    Apellido2: apellido2,
                    CorreoInstitucional: String(document.getElementById('admin-usuario-correo')?.value || '').trim(),
                    Telefono: String(document.getElementById('admin-usuario-telefono')?.value || '').trim(),
                    password: String(document.getElementById('admin-usuario-password')?.value || '').trim()
                };

                if (!body.TipoUsuario) {
                    throw new Error('Debe seleccionar el tipo de usuario.');
                }

                if (body.TipoUsuario === 'estudiante') {
                    body.Carnet = String(document.getElementById('admin-usuario-carnet')?.value || '').trim();
                    body.ProgramaAcademicoID = Number(document.getElementById('admin-usuario-programa')?.value || 0);
                    body.PlanEstudioID = Number(document.getElementById('admin-usuario-plan')?.value || 0);
                    body.FechaIngreso = String(document.getElementById('admin-usuario-fecha-ingreso')?.value || '').trim();
                    body.EstadoAcademico = String(document.getElementById('admin-usuario-estado-academico')?.value || 'Activo').trim();
                }

                if (body.TipoUsuario === 'docente') {
                    body.Especialidad = String(document.getElementById('admin-usuario-especialidad')?.value || '').trim();
                    body.FechaContratacion = String(document.getElementById('admin-usuario-fecha-contratacion')?.value || '').trim();
                    body.EstadoDocente = String(document.getElementById('admin-usuario-estado-docente')?.value || 'Activo').trim();
                }

                if (!window.ApiService?.crearUsuario) {
                    throw new Error('ApiService.crearUsuario no está disponible.');
                }

                await window.ApiService.crearUsuario(body);
                await cargarUsuarios();

                window.UI.showMessage(
                    'admin-usuarios-message',
                    'success',
                    'Usuario creado correctamente.'
                );
            }
        });

        setTimeout(toggleBloquesTipoUsuario, 0);
    }

    function toggleBloquesTipoUsuario() {
        const tipo = String(document.getElementById('admin-usuario-tipo')?.value || '').trim().toLowerCase();
        const bloqueEstudiante = document.getElementById('bloque-admin-usuario-estudiante');
        const bloqueDocente = document.getElementById('bloque-admin-usuario-docente');

        if (bloqueEstudiante) {
            bloqueEstudiante.style.display = tipo === 'estudiante' ? 'block' : 'none';
        }

        if (bloqueDocente) {
            bloqueDocente.style.display = tipo === 'docente' ? 'block' : 'none';
        }
    }

    function obtenerRolesArray(usuario) {
        if (Array.isArray(usuario?.Roles) && usuario.Roles.length) {
            return usuario.Roles.map((rol) => {
                if (typeof rol === 'string') return String(rol).trim();

                return String(
                    rol?.NombreRol ||
                    rol?.rol ||
                    rol?.Rol ||
                    ''
                ).trim();
            }).filter(Boolean);
        }

        if (usuario?.RolPrincipal) {
            return [String(usuario.RolPrincipal).trim()];
        }

        if (usuario?.RolSistema) {
            return [String(usuario.RolSistema).trim()];
        }

        return ['Usuario'];
    }

    function obtenerRolesTexto(usuario) {
        const roles = [...new Set(obtenerRolesArray(usuario))];
        return roles.join(', ');
    }

    function construirNombreCompleto(nombre, apellido1, apellido2) {
        return [nombre, apellido1, apellido2]
            .map((item) => String(item || '').trim())
            .filter(Boolean)
            .join(' ');
    }

    function construirNombreCompletoDesdeUsuario(usuario) {
        return construirNombreCompleto(
            usuario?.Nombre || extraerNombre(usuario?.NombreCompleto),
            usuario?.Apellido1 || '',
            usuario?.Apellido2 || ''
        ) || String(usuario?.NombreCompleto || '').trim();
    }

    function extraerNombre(nombreCompleto) {
        const texto = String(nombreCompleto || '').trim();
        if (!texto) return '';
        return texto.split(' ')[0] || '';
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
        verDetalle
    };
})();