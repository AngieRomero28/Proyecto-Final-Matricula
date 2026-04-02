const express = require('express');
const router = express.Router();
const estudianteController = require('../controllers/estudiante.controller');

// Obtener todos los estudiantes
router.get('/', estudianteController.obtenerEstudiantes);

// Obtener un estudiante por ID
router.get('/:id', estudianteController.obtenerEstudiantePorId);

module.exports = router;