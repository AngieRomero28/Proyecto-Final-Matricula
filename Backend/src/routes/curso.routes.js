const express = require('express');
const router = express.Router();
const cursoController = require('../controllers/curso.controller');

// Obtener todos los cursos
router.get('/', cursoController.obtenerCursos);

// Obtener curso por ID
router.get('/:id', cursoController.obtenerCursoPorId);

module.exports = router;