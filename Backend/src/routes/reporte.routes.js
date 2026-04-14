const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporte.controller');

// Obtener resumen de reportes
router.get('/resumen', reporteController.obtenerResumenReportes);

module.exports = router;