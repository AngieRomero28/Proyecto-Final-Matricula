const crearError = (mensaje, statusCode = 403) => {
    const error = new Error(mensaje);
    error.statusCode = statusCode;
    return error;
};

const permitirRoles = (...rolesPermitidos) => {
    return (req, res, next) => {
        try {
            if (!req.usuario) {
                throw crearError('No autorizado. Debe autenticarse primero', 401);
            }

            const rolUsuario = String(req.usuario.Rol || '').trim().toLowerCase();
            const rolesNormalizados = rolesPermitidos.map((rol) =>
                String(rol).trim().toLowerCase()
            );

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

        const rolUsuario = String(req.usuario.Rol || '').trim().toLowerCase();

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
    soloEstudiante
};