window.ApiService = {
    async request(endpoint, options = {}) {
        const url = `${window.APP_CONFIG.API_BASE_URL}${endpoint}`;

        const config = {
            method: options.method || 'GET',
            headers: {
                'Accept': 'application/json',
                ...(options.headers || {})
            },
            cache: 'no-store'
        };

        if (options.body) {
            config.headers['Content-Type'] = 'application/json';
            config.body = JSON.stringify(options.body);
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
                data.mensaje ||
                data.error ||
                `Error ${response.status} al consumir ${url}`
            );
        }

        return data;
    },

    async testBackend() {
        const url = `${window.APP_CONFIG.API_BASE_URL.replace('/api', '')}/api/test-db`;

        let response;
        let data = {};

        try {
            response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
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
                data.mensaje ||
                data.error ||
                `No se pudo verificar el backend (${url})`
            );
        }

        return data;
    },

    async obtenerDashboardResumen() {
        return await this.request('/dashboard/resumen');
    },

    async obtenerUsuarios() {
        return await this.request('/usuarios');
    },

    async obtenerUsuarioPorId(id) {
        return await this.request(`/usuarios/${id}`);
    },

    async obtenerProgramas() {
        return await this.request('/programas');
    },

    async obtenerProgramaPorId(id) {
        return await this.request(`/programas/${id}`);
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
            body
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
        return await this.request(`/facturas/${id}`);
    },

    async obtenerEstadosCuenta() {
        return await this.request('/estado-cuenta');
    },

    async obtenerEstadoCuentaPorId(id) {
        return await this.request(`/estado-cuenta/${id}`);
    },

    async obtenerComprobantes() {
        return await this.request('/comprobantes');
    },

    async obtenerComprobantePorMatriculaId(matriculaId) {
        return await this.request(`/comprobantes/${matriculaId}`);
    },

    async obtenerAuditoria() {
        return await this.request('/auditoria');
    }
};