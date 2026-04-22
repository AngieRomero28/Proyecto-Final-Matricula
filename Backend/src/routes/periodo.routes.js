// backend/src/routes/periodos.routes.js
const express = require('express');
const router = express.Router();

const periodoController = require('../controllers/periodo.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { permitirRoles } = require('../middlewares/role.middleware');

// Obtener todos los periodos
router.get(
    '/',
    authMiddleware,
    permitirRoles('admin', 'registro', 'tesoreria', 'auditor', 'docente', 'estudiante'),
    periodoController.obtenerPeriodos
);

// Obtener un periodo por ID
router.get(
    '/:id',
    authMiddleware,
    permitirRoles('admin', 'registro', 'tesoreria', 'auditor', 'docente', 'estudiante'),
    periodoController.obtenerPeriodoPorId
);

// Abrir matrícula de un período
router.put(
    '/:id/abrir-matricula',
    authMiddleware,
    permitirRoles('admin'),
    periodoController.abrirMatriculaPeriodo
);

module.exports = router;