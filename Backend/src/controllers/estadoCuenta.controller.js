const estadoCuentaService = require('../services/estadoCuenta.service');

const obtenerEstadosCuenta = async (req, res) => {
    try {
        const estadosCuenta = await estadoCuentaService.obtenerEstadosCuenta();

        res.status(200).json({
            mensaje: 'Estados de cuenta obtenidos correctamente',
            data: estadosCuenta
        });
    } catch (error) {
        console.error('Error en obtenerEstadosCuenta:', error);
        res.status(500).json({
            mensaje: 'Error al obtener los estados de cuenta',
            error: error.message
        });
    }
};

const obtenerEstadoCuentaPorId = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({
                mensaje: 'El id del estado de cuenta debe ser numérico'
            });
        }

        const estadoCuenta = await estadoCuentaService.obtenerEstadoCuentaPorId(Number(id));

        if (!estadoCuenta) {
            return res.status(404).json({
                mensaje: 'Estado de cuenta no encontrado'
            });
        }

        res.status(200).json({
            mensaje: 'Estado de cuenta obtenido correctamente',
            data: estadoCuenta
        });
    } catch (error) {
        console.error('Error en obtenerEstadoCuentaPorId:', error);
        res.status(500).json({
            mensaje: 'Error al obtener el estado de cuenta',
            error: error.message
        });
    }
};

module.exports = {
    obtenerEstadosCuenta,
    obtenerEstadoCuentaPorId
};