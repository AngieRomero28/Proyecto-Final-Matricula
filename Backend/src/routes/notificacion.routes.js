const express = require('express');
const router = express.Router();

const notificacionController = require('../controllers/notificacion.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { permitirRoles } = require('../middlewares/role.middleware');

// Obtener notificaciones del sistema
router.get(
    '/',
    authMiddleware,
    permitirRoles('admin', 'registro', 'tesoreria', 'auditor'),
    notificacionController.obtenerNotificaciones
);

module.exports = router;