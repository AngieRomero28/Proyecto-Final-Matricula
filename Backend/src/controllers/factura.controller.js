const facturaService = require('../services/factura.service');

const obtenerFacturas = async (req, res) => {
    try {
        const facturas = await facturaService.obtenerFacturas();

        res.status(200).json({
            mensaje: 'Facturas obtenidas correctamente',
            data: facturas
        });
    } catch (error) {
        console.error('Error en obtenerFacturas:', error);
        res.status(500).json({
            mensaje: 'Error al obtener las facturas',
            error: error.message
        });
    }
};

const obtenerFacturaPorId = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({
                mensaje: 'El id de la factura debe ser numérico'
            });
        }

        const factura = await facturaService.obtenerFacturaPorId(Number(id));

        if (!factura) {
            return res.status(404).json({
                mensaje: 'Factura no encontrada'
            });
        }

        res.status(200).json({
            mensaje: 'Factura obtenida correctamente',
            data: factura
        });
    } catch (error) {
        console.error('Error en obtenerFacturaPorId:', error);
        res.status(500).json({
            mensaje: 'Error al obtener la factura',
            error: error.message
        });
    }
};

module.exports = {
    obtenerFacturas,
    obtenerFacturaPorId
};