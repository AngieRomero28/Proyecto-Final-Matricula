const crearError = (mensaje, statusCode = 401) => {
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

const authMiddleware = (req, res, next) => {
    try {
        const usuarioIdHeader =
            req.headers['x-usuario-id'] ??
            req.headers['x-user-id'] ??
            req.headers['usuarioid'];

        const usernameHeader =
            req.headers['x-username'] ??
            req.headers['x-user-name'] ??
            req.headers['username'];

        const rolHeader =
            req.headers['x-rol'] ??
            req.headers['x-role'] ??
            req.headers['rol'];

        if (!usuarioIdHeader || !usernameHeader || !rolHeader) {
            throw crearError(
                'No autorizado. Faltan datos de autenticación en los headers',
                401
            );
        }

        const usuarioIdNum = Number(usuarioIdHeader);

        if (Number.isNaN(usuarioIdNum) || usuarioIdNum <= 0) {
            throw crearError('No autorizado. El usuarioId no es válido', 401);
        }

        const username = String(usernameHeader).trim();
        const rolOriginal = String(rolHeader).trim();
        const rolNormalizado = normalizarRol(rolOriginal);

        if (!username) {
            throw crearError('No autorizado. El username no es válido', 401);
        }

        req.usuario = {
            UsuarioID: usuarioIdNum,
            usuarioId: usuarioIdNum,
            Username: username,
            username,
            Rol: rolNormalizado,
            rol: rolNormalizado,
            RolOriginal: rolOriginal
        };

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = authMiddleware;