const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');

// Obtener resumen del dashboard
router.get('/resumen', dashboardController.obtenerResumenDashboard);

module.exports = router;