const express = require('express');
const router = express.Router();

const seccionController = require('../controllers/seccion.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { permitirRoles } = require('../middlewares/role.middleware');

// Obtener todas las secciones
router.get(
    '/',
    authMiddleware,
    permitirRoles('admin', 'registro', 'docente', 'auditor', 'estudiante'),
    seccionController.obtenerSecciones
);

// Obtener sección por ID
router.get(
    '/:id',
    authMiddleware,
    permitirRoles('admin', 'registro', 'docente', 'auditor', 'estudiante'),
    seccionController.obtenerSeccionPorId
);

module.exports = router;