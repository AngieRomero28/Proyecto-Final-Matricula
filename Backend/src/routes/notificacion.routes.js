const express = require('express');
const router = express.Router();
const notificacionController = require('../controllers/notificacion.controller');

// Obtener notificaciones del sistema
router.get('/', notificacionController.obtenerNotificaciones);

module.exports = router;