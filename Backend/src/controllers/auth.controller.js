const authService = require('../services/auth.service');

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

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
        const { actual, nueva } = req.body;

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