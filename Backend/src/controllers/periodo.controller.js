const periodoService = require('../services/periodo.service');

const obtenerPeriodos = async (req, res) => {
    try {
        const periodos = await periodoService.obtenerPeriodos();

        res.status(200).json({
            mensaje: 'Lista de periodos obtenida correctamente',
            data: periodos
        });
    } catch (error) {
        console.error('Error en obtenerPeriodos:', error);
        res.status(error.statusCode || 500).json({
            mensaje: error.message || 'Error al obtener los periodos'
        });
    }
};

const obtenerPeriodoPorId = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || Number.isNaN(Number(id))) {
            return res.status(400).json({
                mensaje: 'El id del periodo debe ser numérico'
            });
        }

        const periodo = await periodoService.obtenerPeriodoPorId(Number(id));

        if (!periodo) {
            return res.status(404).json({
                mensaje: 'Periodo no encontrado'
            });
        }

        res.status(200).json({
            mensaje: 'Periodo obtenido correctamente',
            data: periodo
        });
    } catch (error) {
        console.error('Error en obtenerPeriodoPorId:', error);
        res.status(error.statusCode || 500).json({
            mensaje: error.message || 'Error al obtener el periodo'
        });
    }
};

module.exports = {
    obtenerPeriodos,
    obtenerPeriodoPorId
};