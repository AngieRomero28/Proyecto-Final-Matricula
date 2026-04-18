const matriculaService = require('../services/matricula.service');

const obtenerMatriculas = async (req, res) => {
    try {
        const matriculas = await matriculaService.obtenerMatriculas();

        res.status(200).json({
            mensaje: 'Lista de matrículas obtenida correctamente',
            data: matriculas
        });
    } catch (error) {
        console.error('Error en obtenerMatriculas:', error);
        res.status(error.statusCode || 500).json({
            mensaje: error.message || 'Error al obtener las matrículas'
        });
    }
};

const obtenerMatriculaPorId = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || Number.isNaN(Number(id))) {
            return res.status(400).json({
                mensaje: 'El id de la matrícula debe ser numérico'
            });
        }

        const matricula = await matriculaService.obtenerMatriculaPorId(Number(id));

        if (!matricula || (Array.isArray(matricula) && matricula.length === 0)) {
            return res.status(404).json({
                mensaje: 'Matrícula no encontrada'
            });
        }

        res.status(200).json({
            mensaje: 'Matrícula obtenida correctamente',
            data: matricula
        });
    } catch (error) {
        console.error('Error en obtenerMatriculaPorId:', error);
        res.status(error.statusCode || 500).json({
            mensaje: error.message || 'Error al obtener la matrícula'
        });
    }
};

const crearMatricula = async (req, res) => {
    try {
        const data = req.body || {};

        const resultado = await matriculaService.crearMatricula(data);

        res.status(201).json({
            mensaje: 'Matrícula creada correctamente',
            data: resultado
        });
    } catch (error) {
        console.error('Error en crearMatricula:', error);
        res.status(error.statusCode || 500).json({
            mensaje: error.message || 'Error al crear la matrícula'
        });
    }
};

module.exports = {
    obtenerMatriculas,
    obtenerMatriculaPorId,
    crearMatricula
};