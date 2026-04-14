const comprobanteService = require('../services/comprobante.service');

const obtenerComprobantes = async (req, res) => {
    try {
        const comprobantes = await comprobanteService.obtenerComprobantes();

        res.status(200).json({
            mensaje: 'Comprobantes obtenidos correctamente',
            data: comprobantes
        });
    } catch (error) {
        console.error('Error en obtenerComprobantes:', error);
        res.status(500).json({
            mensaje: 'Error al obtener los comprobantes',
            error: error.message
        });
    }
};

const obtenerComprobantePorMatriculaId = async (req, res) => {
    try {
        const { matriculaId } = req.params;

        if (!matriculaId || isNaN(matriculaId)) {
            return res.status(400).json({
                mensaje: 'El id de la matrícula debe ser numérico'
            });
        }

        const comprobante = await comprobanteService.obtenerComprobantePorMatriculaId(Number(matriculaId));

        if (!comprobante) {
            return res.status(404).json({
                mensaje: 'Comprobante no encontrado'
            });
        }

        res.status(200).json({
            mensaje: 'Comprobante obtenido correctamente',
            data: comprobante
        });
    } catch (error) {
        console.error('Error en obtenerComprobantePorMatriculaId:', error);
        res.status(500).json({
            mensaje: 'Error al obtener el comprobante',
            error: error.message
        });
    }
};

module.exports = {
    obtenerComprobantes,
    obtenerComprobantePorMatriculaId
};