const express = require('express');
const router = express.Router();

const comprobanteController = require('../controllers/comprobante.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { permitirRoles } = require('../middlewares/role.middleware');

// Obtener todos los comprobantes
router.get(
    '/',
    authMiddleware,
    permitirRoles('admin', 'registro', 'tesoreria', 'auditor'),
    comprobanteController.obtenerComprobantes
);

// Obtener comprobante por matrícula
router.get(
    '/:matriculaId',
    authMiddleware,
    permitirRoles('admin', 'registro', 'tesoreria', 'auditor'),
    comprobanteController.obtenerComprobantePorMatriculaId
);

module.exports = router;