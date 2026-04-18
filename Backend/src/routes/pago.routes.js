const express = require('express');
const router = express.Router();

const pagoController = require('../controllers/pago.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { permitirRoles } = require('../middlewares/role.middleware');

// GET pagos
router.get(
    '/',
    authMiddleware,
    permitirRoles('admin', 'tesoreria', 'auditor'),
    pagoController.obtenerPagos
);

// GET pago por ID
router.get(
    '/:id',
    authMiddleware,
    permitirRoles('admin', 'tesoreria', 'auditor'),
    pagoController.obtenerPagoPorId
);

// POST registrar pago
router.post(
    '/',
    authMiddleware,
    permitirRoles('admin', 'tesoreria', 'estudiante'),
    pagoController.registrarPago
);

module.exports = router;