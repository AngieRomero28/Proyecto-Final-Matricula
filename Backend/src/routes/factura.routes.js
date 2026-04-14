const express = require('express');
const router = express.Router();
const facturaController = require('../controllers/factura.controller');

// Obtener todas las facturas
router.get('/', facturaController.obtenerFacturas);

// Obtener factura por ID
router.get('/:id', facturaController.obtenerFacturaPorId);

module.exports = router;