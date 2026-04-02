const cursoService = require('../services/curso.service');

const obtenerCursos = async (req, res) => {
    try {
        const cursos = await cursoService.obtenerCursos();

        res.status(200).json({
            mensaje: 'Lista de cursos obtenida correctamente',
            data: cursos
        });
    } catch (error) {
        console.error('Error en obtenerCursos:', error);
        res.status(500).json({
            mensaje: 'Error al obtener los cursos',
            error: error.message
        });
    }
};

const obtenerCursoPorId = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({
                mensaje: 'El id del curso debe ser numérico'
            });
        }

        const curso = await cursoService.obtenerCursoPorId(id);

        if (!curso) {
            return res.status(404).json({
                mensaje: 'Curso no encontrado'
            });
        }

        res.status(200).json({
            mensaje: 'Curso obtenido correctamente',
            data: curso
        });
    } catch (error) {
        console.error('Error en obtenerCursoPorId:', error);
        res.status(500).json({
            mensaje: 'Error al obtener el curso',
            error: error.message
        });
    }
};

module.exports = {
    obtenerCursos,
    obtenerCursoPorId
};