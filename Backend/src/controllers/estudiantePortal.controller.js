const estudiantePortalService = require('../services/estudiantePortal.service');

const obtenerResumen = async (req, res) => {
    try {
        const { estudianteId } = req.params;
        const data = await estudiantePortalService.obtenerResumenEstudiante(estudianteId);

        res.status(200).json({
            mensaje: 'Resumen del estudiante obtenido correctamente',
            data
        });
    } catch (error) {
        console.error('Error en obtenerResumen:', error);
        res.status(error.statusCode || 500).json({
            mensaje: error.message || 'Error al obtener el resumen del estudiante'
        });
    }
};

const obtenerOfertaDisponible = async (req, res) => {
    try {
        const { estudianteId, periodoId } = req.params;
        const data = await estudiantePortalService.obtenerOfertaDisponible(estudianteId, periodoId);

        res.status(200).json({
            mensaje: 'Oferta disponible obtenida correctamente',
            data
        });
    } catch (error) {
        console.error('Error en obtenerOfertaDisponible:', error);
        res.status(error.statusCode || 500).json({
            mensaje: error.message || 'Error al obtener la oferta disponible'
        });
    }
};

const obtenerCursosMatriculadosActuales = async (req, res) => {
    try {
        const { estudianteId, periodoId } = req.params;
        const data = await estudiantePortalService.obtenerCursosMatriculadosActuales(estudianteId, periodoId);

        res.status(200).json({
            mensaje: 'Cursos matriculados obtenidos correctamente',
            data
        });
    } catch (error) {
        console.error('Error en obtenerCursosMatriculadosActuales:', error);
        res.status(error.statusCode || 500).json({
            mensaje: error.message || 'Error al obtener los cursos matriculados'
        });
    }
};

const obtenerHistorialAcademico = async (req, res) => {
    try {
        const { estudianteId } = req.params;
        const data = await estudiantePortalService.obtenerHistorialAcademico(estudianteId);

        res.status(200).json({
            mensaje: 'Historial académico obtenido correctamente',
            data
        });
    } catch (error) {
        console.error('Error en obtenerHistorialAcademico:', error);
        res.status(error.statusCode || 500).json({
            mensaje: error.message || 'Error al obtener el historial académico'
        });
    }
};

const obtenerHistorialFinanciero = async (req, res) => {
    try {
        const { estudianteId } = req.params;
        const data = await estudiantePortalService.obtenerHistorialFinanciero(estudianteId);

        res.status(200).json({
            mensaje: 'Historial financiero obtenido correctamente',
            data
        });
    } catch (error) {
        console.error('Error en obtenerHistorialFinanciero:', error);
        res.status(error.statusCode || 500).json({
            mensaje: error.message || 'Error al obtener el historial financiero'
        });
    }
};

const obtenerPagos = async (req, res) => {
    try {
        const { estudianteId } = req.params;
        const data = await estudiantePortalService.obtenerPagosEstudiante(estudianteId);

        res.status(200).json({
            mensaje: 'Pagos del estudiante obtenidos correctamente',
            data
        });
    } catch (error) {
        console.error('Error en obtenerPagos:', error);
        res.status(error.statusCode || 500).json({
            mensaje: error.message || 'Error al obtener los pagos del estudiante'
        });
    }
};

module.exports = {
    obtenerResumen,
    obtenerOfertaDisponible,
    obtenerCursosMatriculadosActuales,
    obtenerHistorialAcademico,
    obtenerHistorialFinanciero,
    obtenerPagos
};