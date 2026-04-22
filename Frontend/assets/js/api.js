// frontend/js/api.js
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

    normalizarPayloadPeriodo(body = {}) {
        const nombrePeriodo = String(body.NombrePeriodo ?? body.nombrePeriodo ?? '').trim();
        const tipoPeriodo = String(body.TipoPeriodo ?? body.tipoPeriodo ?? '').trim();
        const anio = Number(body.Anio ?? body.anio ?? 0);
        const fechaInicio = String(body.FechaInicio ?? body.fechaInicio ?? '').trim();
        const fechaFin = String(body.FechaFin ?? body.fechaFin ?? '').trim();
        const fechaInicioMatricula = body.FechaInicioMatricula ?? body.fechaInicioMatricula ?? null;
        const fechaFinMatricula = body.FechaFinMatricula ?? body.fechaFinMatricula ?? null;
        const estadoPeriodo = String(body.EstadoPeriodo ?? body.estadoPeriodo ?? 'Planeado').trim();
        const costoPeriodo = Number(body.CostoPeriodo ?? body.costoPeriodo ?? 0);

        if (!nombrePeriodo) {
            throw new Error('NombrePeriodo es obligatorio.');
        }

        if (!tipoPeriodo) {
            throw new Error('TipoPeriodo es obligatorio.');
        }

        if (Number.isNaN(anio) || anio <= 0) {
            throw new Error('Anio debe ser numérico válido.');
        }

        if (!fechaInicio || !fechaFin) {
            throw new Error('FechaInicio y FechaFin son obligatorias.');
        }

        if (Number.isNaN(costoPeriodo) || costoPeriodo < 0) {
            throw new Error('CostoPeriodo debe ser numérico válido.');
        }

        return {
            NombrePeriodo: nombrePeriodo,
            TipoPeriodo: tipoPeriodo,
            Anio: anio,
            FechaInicio: fechaInicio,
            FechaFin: fechaFin,
            FechaInicioMatricula: fechaInicioMatricula || null,
            FechaFinMatricula: fechaFinMatricula || null,
            EstadoPeriodo: estadoPeriodo,
            CostoPeriodo: costoPeriodo
        };
    },

    normalizarPayloadUsuario(body = {}) {
        const tipoUsuario = String(body.TipoUsuario ?? body.tipoUsuario ?? '').trim().toLowerCase();
        const username = String(body.Username ?? body.username ?? '').trim();
        const identificacion = String(body.Identificacion ?? body.identificacion ?? '').trim();
        const nombre = String(body.Nombre ?? body.nombre ?? '').trim();
        const apellido1 = String(body.Apellido1 ?? body.apellido1 ?? '').trim();
        const apellido2 = String(body.Apellido2 ?? body.apellido2 ?? '').trim();
        const correoInstitucional = String(body.CorreoInstitucional ?? body.correoInstitucional ?? '').trim();
        const telefono = String(body.Telefono ?? body.telefono ?? '').trim();
        const password = String(body.password ?? body.Password ?? body.PasswordHash ?? '').trim();
        const estadoUsuario = String(body.EstadoUsuario ?? body.estadoUsuario ?? 'Activo').trim();

        if (!['docente', 'estudiante'].includes(tipoUsuario)) {
            throw new Error('TipoUsuario debe ser "docente" o "estudiante".');
        }

        if (!username) {
            throw new Error('Username es obligatorio.');
        }

        if (!identificacion) {
            throw new Error('Identificacion es obligatoria.');
        }

        if (!nombre) {
            throw new Error('Nombre es obligatorio.');
        }

        if (!apellido1) {
            throw new Error('Apellido1 es obligatorio.');
        }

        if (!correoInstitucional) {
            throw new Error('CorreoInstitucional es obligatorio.');
        }

        if (!password) {
            throw new Error('La contraseña es obligatoria.');
        }

        const payload = {
            TipoUsuario: tipoUsuario,
            Username: username,
            Identificacion: identificacion,
            Nombre: nombre,
            Apellido1: apellido1,
            Apellido2: apellido2,
            CorreoInstitucional: correoInstitucional,
            Telefono: telefono,
            password,
            EstadoUsuario: estadoUsuario
        };

        if (tipoUsuario === 'estudiante') {
            payload.Carnet = String(body.Carnet ?? body.carnet ?? '').trim();
            payload.ProgramaAcademicoID = Number(body.ProgramaAcademicoID ?? body.programaAcademicoId ?? 0);
            payload.PlanEstudioID = Number(body.PlanEstudioID ?? body.planEstudioId ?? 0);
            payload.FechaIngreso = String(body.FechaIngreso ?? body.fechaIngreso ?? '').trim();
            payload.EstadoAcademico = String(body.EstadoAcademico ?? body.estadoAcademico ?? 'Activo').trim();

            if (!payload.Carnet) {
                throw new Error('Carnet es obligatorio para estudiante.');
            }

            if (Number.isNaN(payload.ProgramaAcademicoID) || payload.ProgramaAcademicoID <= 0) {
                throw new Error('ProgramaAcademicoID es obligatorio para estudiante.');
            }

            if (Number.isNaN(payload.PlanEstudioID) || payload.PlanEstudioID <= 0) {
                throw new Error('PlanEstudioID es obligatorio para estudiante.');
            }

            if (!payload.FechaIngreso) {
                throw new Error('FechaIngreso es obligatoria para estudiante.');
            }
        }

        if (tipoUsuario === 'docente') {
            payload.Especialidad = String(body.Especialidad ?? body.especialidad ?? '').trim();
            payload.FechaContratacion = String(body.FechaContratacion ?? body.fechaContratacion ?? '').trim();
            payload.EstadoDocente = String(body.EstadoDocente ?? body.estadoDocente ?? 'Activo').trim();

            if (!payload.FechaContratacion) {
                throw new Error('FechaContratacion es obligatoria para docente.');
            }
        }

        return payload;
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

    async crearUsuario(body) {
        return await this.request('/usuarios', {
            method: 'POST',
            body: this.normalizarPayloadUsuario(body)
        });
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

    async obtenerPeriodoPorId(id) {
        return await this.request(`/periodos/${this.requireId('id', id)}`);
    },

    async crearPeriodo(body) {
        return await this.request('/periodos', {
            method: 'POST',
            body: this.normalizarPayloadPeriodo(body)
        });
    },

    async abrirMatriculaPeriodo(id, body) {
        return await this.request(`/periodos/${this.requireId('id', id)}/abrir-matricula`, {
            method: 'PUT',
            body
        });
    },

    async obtenerSecciones() {
        return await this.request('/secciones');
    },

    async obtenerMatriculas() {
        return await this.request('/matriculas');
    },

    async obtenerMatriculaPorId(id) {
        return await this.request(`/matriculas/${this.requireId('id', id)}`);
    },

    async obtenerEstudiantesPorSeccionDocente(seccionId) {
        return await this.request(
            `/matriculas/seccion/${this.requireId('seccionId', seccionId)}/estudiantes`
        );
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