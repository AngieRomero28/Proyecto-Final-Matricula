const programaService = require('../services/programa.service');

const obtenerProgramas = async (req, res) => {
    try {
        const programas = await programaService.obtenerProgramas();

        res.status(200).json({
            mensaje: 'Programas obtenidos correctamente',
            data: programas
        });
    } catch (error) {
        console.error('Error en obtenerProgramas:', error);
        res.status(500).json({
            mensaje: 'Error al obtener los programas',
            error: error.message
        });
    }
};

const obtenerProgramaPorId = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({
                mensaje: 'El id del programa debe ser numérico'
            });
        }

        const programa = await programaService.obtenerProgramaPorId(Number(id));

        if (!programa) {
            return res.status(404).json({
                mensaje: 'Programa no encontrado'
            });
        }

        res.status(200).json({
            mensaje: 'Programa obtenido correctamente',
            data: programa
        });
    } catch (error) {
        console.error('Error en obtenerProgramaPorId:', error);
        res.status(500).json({
            mensaje: 'Error al obtener el programa',
            error: error.message
        });
    }
};

module.exports = {
    obtenerProgramas,
    obtenerProgramaPorId
};