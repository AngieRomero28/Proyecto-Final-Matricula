const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboard.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { permitirRoles } = require('../middlewares/role.middleware');

// Obtener resumen del dashboard
router.get(
    '/resumen',
    authMiddleware,
    permitirRoles('admin', 'registro', 'tesoreria', 'auditor'),
    dashboardController.obtenerResumenDashboard
);

module.exports = router;