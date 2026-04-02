const express = require('express');
const router = express.Router();
const seccionController = require('../controllers/seccion.controller');

// Obtener todas las secciones
router.get('/', seccionController.obtenerSecciones);

// Obtener sección por ID
router.get('/:id', seccionController.obtenerSeccionPorId);

module.exports = router;