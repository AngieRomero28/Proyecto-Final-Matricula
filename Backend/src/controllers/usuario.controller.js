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
        res.status(500).json({
            mensaje: 'Error al obtener los usuarios',
            error: error.message
        });
    }
};

const obtenerUsuarioPorId = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
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
        res.status(500).json({
            mensaje: 'Error al obtener el usuario',
            error: error.message
        });
    }
};

module.exports = {
    obtenerUsuarios,
    obtenerUsuarioPorId
};