const notificacionService = require('../services/notificacion.service');

const obtenerNotificaciones = async (req, res) => {
    try {
        const data = await notificacionService.obtenerNotificaciones();

        res.status(200).json({
            mensaje: 'Notificaciones obtenidas correctamente',
            data
        });
    } catch (error) {
        console.error('Error en obtenerNotificaciones:', error);
        res.status(error.statusCode || 500).json({
            mensaje: error.message || 'Error al obtener las notificaciones'
        });
    }
};

module.exports = {
    obtenerNotificaciones
};