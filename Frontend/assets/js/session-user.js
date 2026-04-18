window.SessionUser = {
    set(session) {
        this.current = session || null;
    },

    get() {
        return this.current || Auth.getSession() || null;
    },

    clear() {
        this.current = null;
    },

    getId() {
        return this.get()?.userId || null;
    },

    getUsername() {
        return this.get()?.username || null;
    },

    getRole() {
        return this.get()?.role || null;
    },

    getRoleLabel() {
        return this.get()?.roleLabel || null;
    },

    getFullName() {
        return this.get()?.fullName || this.get()?.username || 'Usuario';
    },

    isStudent() {
        return this.getRole() === 'estudiante';
    },

    isTeacher() {
        return this.getRole() === 'docente';
    },

    isTreasury() {
        return this.getRole() === 'tesoreria';
    },

    isAdmin() {
        return this.getRole() === 'admin';
    },

    isAuditor() {
        return this.getRole() === 'auditor';
    },

    isRegistro() {
        return this.getRole() === 'registro';
    }
};