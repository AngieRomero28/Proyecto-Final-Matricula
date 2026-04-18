const express = require('express');
const router = express.Router();

const facturaController = require('../controllers/factura.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { permitirRoles } = require('../middlewares/role.middleware');

// Obtener todas las facturas
router.get(
    '/',
    authMiddleware,
    permitirRoles('admin', 'tesoreria', 'auditor'),
    facturaController.obtenerFacturas
);

// Obtener factura por ID
router.get(
    '/:id',
    authMiddleware,
    permitirRoles('admin', 'tesoreria', 'auditor'),
    facturaController.obtenerFacturaPorId
);

module.exports = router;