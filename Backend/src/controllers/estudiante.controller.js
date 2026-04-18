const estudianteService = require('../services/estudiante.service');

const obtenerEstudiantes = async (req, res) => {
    try {
        const estudiantes = await estudianteService.obtenerEstudiantes();

        res.status(200).json({
            mensaje: 'Lista de estudiantes obtenida correctamente',
            data: estudiantes
        });
    } catch (error) {
        console.error('Error en obtenerEstudiantes:', error);
        res.status(error.statusCode || 500).json({
            mensaje: error.message || 'Error al obtener los estudiantes'
        });
    }
};

const obtenerEstudiantePorId = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || Number.isNaN(Number(id))) {
            return res.status(400).json({
                mensaje: 'El id del estudiante debe ser numérico'
            });
        }

        const estudiante = await estudianteService.obtenerEstudiantePorId(Number(id));

        if (!estudiante) {
            return res.status(404).json({
                mensaje: 'Estudiante no encontrado'
            });
        }

        res.status(200).json({
            mensaje: 'Estudiante obtenido correctamente',
            data: estudiante
        });
    } catch (error) {
        console.error('Error en obtenerEstudiantePorId:', error);
        res.status(error.statusCode || 500).json({
            mensaje: error.message || 'Error al obtener el estudiante'
        });
    }
};

module.exports = {
    obtenerEstudiantes,
    obtenerEstudiantePorId
};