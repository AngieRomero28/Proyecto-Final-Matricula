window.Auth = {
    async login({ username, password }) {
        if (!username || !password) {
            throw new Error('Debe ingresar usuario y contraseña.');
        }

        const response = await window.ApiService.login({
            username: String(username).trim(),
            password: String(password)
        });

        const data = response?.data || response || {};
        const session = this.buildSession(data);

        if (!session || !session.username) {
            throw new Error('La respuesta del servidor no contiene una sesión válida.');
        }

        if (!session.role || session.role === 'usuario') {
            throw new Error('El usuario autenticado no tiene un rol válido para ingresar.');
        }

        window.StorageManager.set(window.APP_CONFIG.STORAGE_KEYS.SESSION, session);
        return session;
    },

    buildSession(data = {}) {
        const roles = this.extractRoleNames(data);
        const primaryRoleName =
            data.RolPrincipal ||
            data.rolPrincipal ||
            data.role ||
            data.rol ||
            roles[0] ||
            '';

        const role = this.normalizeRole(primaryRoleName);

        const fullName =
            data.NombreCompleto ||
            data.nombreCompleto ||
            data.Nombre ||
            data.nombre ||
            data.Username ||
            data.username ||
            'Usuario';

        return {
            userId: data.UsuarioID || data.usuarioId || null,
            estudianteId: data.EstudianteID || data.estudianteId || null,
            docenteId: data.DocenteID || data.docenteId || null,
            username: data.Username || data.username || '',
            fullName,
            role,
            roleLabel: this.getDisplayName(role),
            initials: window.Helpers.getInitials(fullName),
            roles: Array.isArray(data.Roles) ? data.Roles : [],
            roleNames: roles,
            passwordTemporal: Boolean(data.PasswordTemporal || data.passwordTemporal),
            debeCambiarPassword: Boolean(data.DebeCambiarPassword || data.debeCambiarPassword),
            raw: data
        };
    },

    extractRoleNames(data = {}) {
        const roles = Array.isArray(data.Roles) ? data.Roles : [];

        return roles
            .map((rol) => {
                if (typeof rol === 'string') {
                    return rol;
                }

                return (
                    rol?.NombreRol ||
                    rol?.nombreRol ||
                    rol?.Rol ||
                    rol?.rol ||
                    ''
                );
            })
            .map((name) => String(name).trim())
            .filter(Boolean);
    },

    logout() {
        window.StorageManager.clearSession();

        if (window.SessionUser && typeof window.SessionUser.clear === 'function') {
            window.SessionUser.clear();
        }

        window.location.href = './index.html';
    },

    getSession() {
        return window.StorageManager.get(window.APP_CONFIG.STORAGE_KEYS.SESSION);
    },

    isAuthenticated() {
        return !!this.getSession();
    },

    getUserId() {
        return this.getSession()?.userId || null;
    },

    getRole() {
        return this.getSession()?.role || null;
    },

    requiresPasswordChange() {
        return !!this.getSession()?.debeCambiarPassword;
    },

    normalizeRole(role) {
        const value = String(role || '').trim().toLowerCase();

        const map = {
            'administrador ti': 'admin',
            administrador: 'admin',
            admin: 'admin',

            'registro académico': 'registro',
            'registro academico': 'registro',
            registro: 'registro',

            'tesorería': 'tesoreria',
            tesoreria: 'tesoreria',

            docente: 'docente',
            estudiante: 'estudiante',

            'auditor institucional': 'auditor',
            auditor: 'auditor'
        };

        return map[value] || 'usuario';
    },

    getDisplayName(role) {
        const roles = {
            admin: 'Administrador TI',
            registro: 'Registro Académico',
            tesoreria: 'Tesorería',
            estudiante: 'Estudiante',
            docente: 'Docente',
            auditor: 'Auditor Institucional',
            usuario: 'Usuario'
        };

        return roles[role] || 'Usuario';
    }
};