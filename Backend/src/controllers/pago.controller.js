const pagoService = require('../services/pago.service');

const obtenerPagos = async (req, res) => {
    try {
        const pagos = await pagoService.obtenerPagos();

        res.status(200).json({
            mensaje: 'Pagos obtenidos correctamente',
            data: pagos
        });
    } catch (error) {
        console.error('Error en obtenerPagos:', error);
        res.status(error.statusCode || 500).json({
            mensaje: error.message || 'Error al obtener pagos'
        });
    }
};

const obtenerPagoPorId = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || Number.isNaN(Number(id))) {
            return res.status(400).json({
                mensaje: 'El id del pago debe ser numérico'
            });
        }

        const pago = await pagoService.obtenerPagoPorId(Number(id));

        if (!pago) {
            return res.status(404).json({
                mensaje: 'Pago no encontrado'
            });
        }

        res.status(200).json({
            mensaje: 'Pago obtenido correctamente',
            data: pago
        });
    } catch (error) {
        console.error('Error en obtenerPagoPorId:', error);
        res.status(error.statusCode || 500).json({
            mensaje: error.message || 'Error al obtener pago'
        });
    }
};

const registrarPago = async (req, res) => {
    try {
        const data = req.body || {};

        const resultado = await pagoService.registrarPago(data);

        res.status(201).json({
            mensaje: 'Pago registrado correctamente',
            data: resultado
        });
    } catch (error) {
        console.error('Error en registrarPago:', error);
        res.status(error.statusCode || 500).json({
            mensaje: error.message || 'Error al registrar el pago'
        });
    }
};

module.exports = {
    obtenerPagos,
    obtenerPagoPorId,
    registrarPago
};