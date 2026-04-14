window.Auth = {
    login({ username, role }) {
        const session = {
            username,
            role,
            displayName: this.getDisplayName(role),
            initials: Helpers.getInitials(this.getDisplayName(role))
        };

        StorageManager.set('smu_session', session);
        return session;
    },

    logout() {
        StorageManager.clearSession();
        window.location.href = '/index.html';
    },

    getSession() {
        return StorageManager.get('smu_session');
    },

    isAuthenticated() {
        return !!this.getSession();
    },

    getDisplayName(role) {
        const roles = {
            admin: 'Administrador TI',
            registro: 'Registro Académico',
            tesoreria: 'Tesorería',
            estudiante: 'Estudiante',
            docente: 'Docente',
            auditor: 'Auditor Institucional'
        };

        return roles[role] || 'Usuario';
    }
};