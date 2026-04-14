const auditoriaService = require('../services/auditoria.service');

const obtenerAuditoria = async (req, res) => {
    try {
        const data = await auditoriaService.obtenerAuditoria();

        res.status(200).json({
            mensaje: 'Registros de auditoría obtenidos correctamente',
            data
        });
    } catch (error) {
        console.error('Error en obtenerAuditoria:', error);
        res.status(500).json({
            mensaje: 'Error al obtener la auditoría',
            error: error.message
        });
    }
};

module.exports = {
    obtenerAuditoria
};