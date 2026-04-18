const express = require('express');
const router = express.Router();

const estadoCuentaController = require('../controllers/estadoCuenta.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { permitirRoles } = require('../middlewares/role.middleware');

// Obtener todos los estados de cuenta
router.get(
    '/',
    authMiddleware,
    permitirRoles('admin', 'tesoreria', 'auditor'),
    estadoCuentaController.obtenerEstadosCuenta
);

// Obtener estado de cuenta por ID
router.get(
    '/:id',
    authMiddleware,
    permitirRoles('admin', 'tesoreria', 'auditor'),
    estadoCuentaController.obtenerEstadoCuentaPorId
);

module.exports = router;