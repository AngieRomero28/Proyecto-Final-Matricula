const express = require('express');
const router = express.Router();
const comprobanteController = require('../controllers/comprobante.controller');

// Obtener todos los comprobantes
router.get('/', comprobanteController.obtenerComprobantes);

// Obtener comprobante por matrícula
router.get('/:matriculaId', comprobanteController.obtenerComprobantePorMatriculaId);

module.exports = router;