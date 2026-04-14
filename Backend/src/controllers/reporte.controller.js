const reporteService = require('../services/reporte.service');

const obtenerResumenReportes = async (req, res) => {
    try {
        const data = await reporteService.obtenerResumenReportes();

        res.status(200).json({
            mensaje: 'Reportes obtenidos correctamente',
            data
        });
    } catch (error) {
        console.error('Error en obtenerResumenReportes:', error);
        res.status(500).json({
            mensaje: 'Error al obtener los reportes',
            error: error.message
        });
    }
};

module.exports = {
    obtenerResumenReportes
};