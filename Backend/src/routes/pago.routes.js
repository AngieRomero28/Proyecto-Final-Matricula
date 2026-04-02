const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pago.controller');

// GET pagos
router.get('/', pagoController.obtenerPagos);

// GET pago por ID
router.get('/:id', pagoController.obtenerPagoPorId);

// POST registrar pago
router.post('/', pagoController.registrarPago);

module.exports = router;