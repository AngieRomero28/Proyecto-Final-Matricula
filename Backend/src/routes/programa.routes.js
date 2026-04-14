const express = require('express');
const router = express.Router();
const programaController = require('../controllers/programa.controller');

// Obtener todos los programas
router.get('/', programaController.obtenerProgramas);

// Obtener programa por ID
router.get('/:id', programaController.obtenerProgramaPorId);

module.exports = router;