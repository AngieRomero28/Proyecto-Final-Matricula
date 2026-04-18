window.ApiService = {
    async request(endpoint, options = {}) {
        const url = `${window.APP_CONFIG.API_BASE_URL}${endpoint}`;
        const session = window.Auth?.getSession ? window.Auth.getSession() : null;

        const config = {
            method: options.method || 'GET',
            headers: {
                Accept: 'application/json',
                ...(options.headers || {})
            },
            cache: 'no-store'
        };

        if (options.body !== undefined && options.body !== null) {
            config.headers['Content-Type'] = 'application/json';
            config.body = JSON.stringify(options.body);
        }

        // Backend actual todavía depende de estos headers
        if (session?.userId) {
            config.headers['x-usuario-id'] = String(session.userId);
        }

        if (session?.username) {
            config.headers['x-username'] = String(session.username);
        }

        if (session?.role) {
            config.headers['x-rol'] = String(session.role);
        }

        let response;
        let data = {};

        try {
            response = await fetch(url, config);
            data = await response.json().catch(() => ({}));
        } catch (error) {
            console.error(`Error de red al consumir ${url}:`, error);
            throw new Error(`No se pudo conectar con el backend (${url})`);
        }

        if (!response.ok) {
            throw new Error(
                data?.mensaje ||
                data?.error ||
                `Error ${response.status} al consumir ${url}`
            );
        }

        return data;
    },

    async testBackend() {
        const url = `${window.APP_CONFIG.BACKEND_BASE_URL}/api/test-db`;

        let response;
        let data = {};

        try {
            response = await fetch(url, {
                method: 'GET',
                headers: {
                    Accept: 'application/json'
                },
                cache: 'no-store'
            });

            data = await response.json().catch(() => ({}));
        } catch (error) {
            console.error(`Error verificando backend en ${url}:`, error);
            throw new Error(`No se pudo verificar el backend (${url})`);
        }

        if (!response.ok) {
            throw new Error(
                data?.mensaje ||
                data?.error ||
                `No se pudo verificar el backend (${url})`
            );
        }

        return data;
    },

    /* =========================
       HELPERS PRIVADOS
    ========================= */

    requireId(name, value) {
        if (value === null || value === undefined || value === '') {
            throw new Error(`El parámetro ${name} es obligatorio.`);
        }

        const num = Number(value);
        if (Number.isNaN(num) || num <= 0) {
            throw new Error(`El parámetro ${name} debe ser numérico válido.`);
        }

        return num;
    },

    normalizarCambioPassword(body = {}) {
        const actual =
            body.actual ??
            body.passwordActual ??
            body.currentPassword ??
            '';

        const nueva =
            body.nueva ??
            body.passwordNueva ??
            body.newPassword ??
            '';

        return {
            actual: String(actual).trim(),
            nueva: String(nueva).trim()
        };
    },

    normalizarPayloadMatricula(body = {}) {
        const estudianteId = this.requireId('estudianteId', body.estudianteId);
        const periodoId = this.requireId('periodoId', body.periodoId);

        const seccionesFuente = Array.isArray(body.secciones)
            ? body.secciones
            : Array.isArray(body.seccionIds)
                ? body.seccionIds
                : [];

        const secciones = seccionesFuente
            .map((item) => Number(item))
            .filter((item) => !Number.isNaN(item));

        if (!secciones.length) {
            throw new Error('Debe enviar al menos una sección.');
        }

        return {
            estudianteId,
            periodoId,
            secciones
        };
    },

    /* =========================
       AUTH
    ========================= */

    async login(body) {
        return await this.request('/auth/login', {
            method: 'POST',
            body
        });
    },

    async cambiarPassword(body) {
        return await this.request('/auth/cambiar-password', {
            method: 'PUT',
            body: this.normalizarCambioPassword(body)
        });
    },

    /* =========================
       GENERALES
    ========================= */

    async obtenerDashboardResumen() {
        return await this.request('/dashboard/resumen');
    },

    async obtenerUsuarios() {
        return await this.request('/usuarios');
    },

    async obtenerUsuarioPorId(id) {
        return await this.request(`/usuarios/${this.requireId('id', id)}`);
    },

    async obtenerProgramas() {
        return await this.request('/programas');
    },

    async obtenerProgramaPorId(id) {
        return await this.request(`/programas/${this.requireId('id', id)}`);
    },

    async obtenerResumenReportes() {
        return await this.request('/reportes/resumen');
    },

    async obtenerNotificaciones() {
        return await this.request('/notificaciones');
    },

    async obtenerEstudiantes() {
        return await this.request('/estudiantes');
    },

    async obtenerCursos() {
        return await this.request('/cursos');
    },

    async obtenerPeriodos() {
        return await this.request('/periodos');
    },

    async obtenerSecciones() {
        return await this.request('/secciones');
    },

    async obtenerMatriculas() {
        return await this.request('/matriculas');
    },

    async crearMatricula(body) {
        return await this.request('/matriculas', {
            method: 'POST',
            body: this.normalizarPayloadMatricula(body)
        });
    },

    async obtenerPagos() {
        return await this.request('/pagos');
    },

    async registrarPago(body) {
        return await this.request('/pagos', {
            method: 'POST',
            body
        });
    },

    async obtenerFacturas() {
        return await this.request('/facturas');
    },

    async obtenerFacturaPorId(id) {
        return await this.request(`/facturas/${this.requireId('id', id)}`);
    },

    async obtenerEstadosCuenta() {
        return await this.request('/estado-cuenta');
    },

    async obtenerEstadoCuentaPorId(id) {
        return await this.request(`/estado-cuenta/${this.requireId('id', id)}`);
    },

    async obtenerComprobantes() {
        return await this.request('/comprobantes');
    },

    async obtenerComprobantePorMatriculaId(matriculaId) {
        return await this.request(`/comprobantes/${this.requireId('matriculaId', matriculaId)}`);
    },

    async obtenerAuditoria() {
        return await this.request('/auditoria');
    },

    /* =========================
       PORTAL ESTUDIANTE
    ========================= */

    async obtenerResumenEstudiante(estudianteId) {
        const id = this.requireId('estudianteId', estudianteId);
        return await this.request(`/portal-estudiante/${id}/resumen`);
    },

    async obtenerOfertaMatriculableEstudiante(estudianteId, periodoId) {
        const id = this.requireId('estudianteId', estudianteId);
        const pid = this.requireId('periodoId', periodoId);
        return await this.request(`/portal-estudiante/${id}/oferta/${pid}`);
    },

    async obtenerCursosActualesEstudiante(estudianteId, periodoId) {
        const id = this.requireId('estudianteId', estudianteId);
        const pid = this.requireId('periodoId', periodoId);
        return await this.request(`/portal-estudiante/${id}/matriculados/${pid}`);
    },

    async obtenerHistorialAcademicoEstudiante(estudianteId) {
        const id = this.requireId('estudianteId', estudianteId);
        return await this.request(`/portal-estudiante/${id}/historial-academico`);
    },

    async obtenerHistorialFinancieroEstudiante(estudianteId) {
        const id = this.requireId('estudianteId', estudianteId);
        return await this.request(`/portal-estudiante/${id}/historial-financiero`);
    },

    async obtenerPagosEstudiante(estudianteId) {
        const id = this.requireId('estudianteId', estudianteId);
        return await this.request(`/portal-estudiante/${id}/pagos`);
    }
};