const seccionService = require('../services/seccion.service');

const obtenerSecciones = async (req, res) => {
    try {
        const secciones = await seccionService.obtenerSecciones();

        res.status(200).json({
            mensaje: 'Lista de secciones obtenida correctamente',
            data: secciones
        });
    } catch (error) {
        console.error('Error en obtenerSecciones:', error);
        res.status(error.statusCode || 500).json({
            mensaje: error.message || 'Error al obtener las secciones'
        });
    }
};

const obtenerSeccionPorId = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || Number.isNaN(Number(id))) {
            return res.status(400).json({
                mensaje: 'El id de la sección debe ser numérico'
            });
        }

        const seccion = await seccionService.obtenerSeccionPorId(Number(id));

        if (!seccion) {
            return res.status(404).json({
                mensaje: 'Sección no encontrada'
            });
        }

        res.status(200).json({
            mensaje: 'Sección obtenida correctamente',
            data: seccion
        });
    } catch (error) {
        console.error('Error en obtenerSeccionPorId:', error);
        res.status(error.statusCode || 500).json({
            mensaje: error.message || 'Error al obtener la sección'
        });
    }
};

module.exports = {
    obtenerSecciones,
    obtenerSeccionPorId
};