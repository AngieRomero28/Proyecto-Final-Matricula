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
        res.status(500).json({
            mensaje: 'Error al obtener los estudiantes',
            error: error.message
        });
    }
};

const obtenerEstudiantePorId = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({
                mensaje: 'El id del estudiante debe ser numérico'
            });
        }

        const estudiante = await estudianteService.obtenerEstudiantePorId(id);

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
        res.status(500).json({
            mensaje: 'Error al obtener el estudiante',
            error: error.message
        });
    }
};

module.exports = {
    obtenerEstudiantes,
    obtenerEstudiantePorId
};