const express = require('express');
const router = express.Router();
const periodoController = require('../controllers/periodo.controller');

// Obtener todos los periodos
router.get('/', periodoController.obtenerPeriodos);

// Obtener un periodo por ID
router.get('/:id', periodoController.obtenerPeriodoPorId);

module.exports = router;