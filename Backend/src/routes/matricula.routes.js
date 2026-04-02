const express = require('express');
const router = express.Router();
const matriculaController = require('../controllers/matricula.controller');

// Obtener todas las matrículas
router.get('/', matriculaController.obtenerMatriculas);

// Obtener matrícula por ID
router.get('/:id', matriculaController.obtenerMatriculaPorId);

// Crear matrícula
router.post('/', matriculaController.crearMatricula);

module.exports = router;