const express = require('express');
const router = express.Router();

const reporteController = require('../controllers/reporte.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { permitirRoles } = require('../middlewares/role.middleware');

// Obtener resumen de reportes
router.get(
    '/resumen',
    authMiddleware,
    permitirRoles('admin', 'registro', 'tesoreria', 'auditor'),
    reporteController.obtenerResumenReportes
);

module.exports = router;