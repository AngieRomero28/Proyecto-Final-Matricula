const crearError = (mensaje, statusCode = 403) => {
    const error = new Error(mensaje);
    error.statusCode = statusCode;
    return error;
};

const normalizarRol = (rol) => {
    const value = String(rol || '').trim().toLowerCase();

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

    return map[value] || value || 'usuario';
};

const obtenerRolUsuario = (req) => {
    return normalizarRol(
        req.usuario?.Rol ??
        req.usuario?.rol ??
        ''
    );
};

const permitirRoles = (...rolesPermitidos) => {
    return (req, res, next) => {
        try {
            if (!req.usuario) {
                throw crearError('No autorizado. Debe autenticarse primero', 401);
            }

            const rolUsuario = obtenerRolUsuario(req);
            const rolesNormalizados = rolesPermitidos.map((rol) => normalizarRol(rol));

            if (!rolesNormalizados.includes(rolUsuario)) {
                throw crearError('No tiene permisos para realizar esta acción', 403);
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

const soloEstudiante = (req, res, next) => {
    try {
        if (!req.usuario) {
            throw crearError('No autorizado. Debe autenticarse primero', 401);
        }

        const rolUsuario = obtenerRolUsuario(req);

        if (rolUsuario !== 'estudiante') {
            throw crearError('Esta acción es exclusiva para estudiantes', 403);
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    permitirRoles,
    soloEstudiante,
    normalizarRol,
    obtenerRolUsuario
};