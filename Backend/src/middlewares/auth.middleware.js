const crearError = (mensaje, statusCode = 401) => {
    const error = new Error(mensaje);
    error.statusCode = statusCode;
    return error;
};

const authMiddleware = (req, res, next) => {
    try {
        const usuarioId = req.headers['x-usuario-id'];
        const username = req.headers['x-username'];
        const rol = req.headers['x-rol'];

        if (!usuarioId || !username || !rol) {
            throw crearError('No autorizado. Faltan datos de autenticación en los headers', 401);
        }

        const usuarioIdNum = Number(usuarioId);

        if (Number.isNaN(usuarioIdNum)) {
            throw crearError('No autorizado. El usuarioId no es válido', 401);
        }

        req.usuario = {
            UsuarioID: usuarioIdNum,
            Username: String(username).trim(),
            Rol: String(rol).trim()
        };

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = authMiddleware;