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
        res.status(500).json({
            mensaje: 'Error al obtener el resumen del dashboard',
            error: error.message
        });
    }
};

module.exports = {
    obtenerResumenDashboard
};