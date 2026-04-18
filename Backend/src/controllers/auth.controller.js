const authService = require('../services/auth.service');

const login = async (req, res) => {
    try {
        const username = req.body?.username ?? req.body?.Username ?? '';
        const password = req.body?.password ?? req.body?.Password ?? '';

        const data = await authService.login({ username, password });

        res.status(200).json({
            mensaje: 'Login exitoso',
            data
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(error.statusCode || 500).json({
            mensaje: error.message || 'Error al iniciar sesión'
        });
    }
};

const cambiarPassword = async (req, res) => {
    try {
        if (!req.usuario || !req.usuario.UsuarioID) {
            return res.status(401).json({
                mensaje: 'No autorizado. Debe iniciar sesión.'
            });
        }

        const actual =
            req.body?.actual ??
            req.body?.passwordActual ??
            '';

        const nueva =
            req.body?.nueva ??
            req.body?.passwordNueva ??
            '';

        const result = await authService.cambiarPassword({
            usuarioId: req.usuario.UsuarioID,
            actual,
            nueva
        });

        res.status(200).json({
            mensaje: 'Contraseña actualizada correctamente',
            data: result
        });
    } catch (error) {
        console.error('Error en cambiarPassword:', error);
        res.status(error.statusCode || 500).json({
            mensaje: error.message || 'Error al cambiar la contraseña'
        });
    }
};

module.exports = {
    login,
    cambiarPassword
};