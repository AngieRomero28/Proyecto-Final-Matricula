const express = require('express');
const router = express.Router();
const estadoCuentaController = require('../controllers/estadoCuenta.controller');

// Obtener todos los estados de cuenta
router.get('/', estadoCuentaController.obtenerEstadosCuenta);

// Obtener estado de cuenta por ID
router.get('/:id', estadoCuentaController.obtenerEstadoCuentaPorId);

module.exports = router;