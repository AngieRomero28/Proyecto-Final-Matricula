const usuarioService = require('../services/usuario.service');

const obtenerUsuarios = async (req, res) => {
    try {
        const usuarios = await usuarioService.obtenerUsuarios();

        res.status(200).json({
            mensaje: 'Usuarios obtenidos correctamente',
            data: usuarios
        });
    } catch (error) {
        console.error('Error en obtenerUsuarios:', error);
        res.status(error.statusCode || 500).json({
            mensaje: error.message || 'Error al obtener los usuarios'
        });
    }
};

const obtenerUsuarioPorId = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || Number.isNaN(Number(id))) {
            return res.status(400).json({
                mensaje: 'El id del usuario debe ser numérico'
            });
        }

        const usuario = await usuarioService.obtenerUsuarioPorId(Number(id));

        if (!usuario) {
            return res.status(404).json({
                mensaje: 'Usuario no encontrado'
            });
        }

        res.status(200).json({
            mensaje: 'Usuario obtenido correctamente',
            data: usuario
        });
    } catch (error) {
        console.error('Error en obtenerUsuarioPorId:', error);
        res.status(error.statusCode || 500).json({
            mensaje: error.message || 'Error al obtener el usuario'
        });
    }
};

const loginUsuario = async (req, res) => {
    try {
        const username = req.body?.username ?? req.body?.Username ?? '';
        const password = req.body?.password ?? req.body?.Password ?? '';

        const usuario = await usuarioService.loginUsuario({ username, password });

        res.status(200).json({
            mensaje: 'Inicio de sesión correcto',
            data: usuario
        });
    } catch (error) {
        console.error('Error en loginUsuario:', error);
        res.status(error.statusCode || 500).json({
            mensaje: error.message || 'Error al iniciar sesión'
        });
    }
};

const obtenerPerfil = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || Number.isNaN(Number(id))) {
            return res.status(400).json({
                mensaje: 'El id del usuario debe ser numérico'
            });
        }

        const usuario = await usuarioService.obtenerUsuarioPorId(Number(id));

        if (!usuario) {
            return res.status(404).json({
                mensaje: 'Usuario no encontrado'
            });
        }

        res.status(200).json({
            mensaje: 'Perfil obtenido correctamente',
            data: usuario
        });
    } catch (error) {
        console.error('Error en obtenerPerfil:', error);
        res.status(error.statusCode || 500).json({
            mensaje: error.message || 'Error al obtener el perfil'
        });
    }
};

const cambiarPassword = async (req, res) => {
    try {
        const usuarioId =
            req.body?.usuarioId ??
            req.usuario?.UsuarioID ??
            null;

        const passwordActual =
            req.body?.passwordActual ??
            req.body?.actual ??
            '';

        const passwordNueva =
            req.body?.passwordNueva ??
            req.body?.nueva ??
            '';

        const resultado = await usuarioService.cambiarPassword({
            usuarioId,
            passwordActual,
            passwordNueva
        });

        res.status(200).json({
            mensaje: 'Contraseña actualizada correctamente',
            data: resultado
        });
    } catch (error) {
        console.error('Error en cambiarPassword:', error);
        res.status(error.statusCode || 500).json({
            mensaje: error.message || 'Error al cambiar la contraseña'
        });
    }
};

module.exports = {
    obtenerUsuarios,
    obtenerUsuarioPorId,
    loginUsuario,
    obtenerPerfil,
    cambiarPassword
};