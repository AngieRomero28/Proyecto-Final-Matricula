const dashboardService = require('../services/dashboard.service');

const obtenerResumenDashboard = async (req, res) => {
    try {
        const data = await dashboardService.obtenerResumenDashboard();

        res.status(200).json({
            mensaje: 'Resumen del dashboard obtenido correctamente',
            data
        });
    } catch (error) {
        console.error('Error en obtenerResumenDashboard:', error);
        res.status(error.statusCode || 500).json({
            mensaje: error.message || 'Error al obtener el resumen del dashboard'
        });
    }
};

module.exports = {
    obtenerResumenDashboard
};