const express = require('express');
const router = express.Router();

const auditoriaController = require('../controllers/auditoria.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { permitirRoles } = require('../middlewares/role.middleware');

// Obtener auditoría
router.get(
    '/',
    authMiddleware,
    permitirRoles('admin', 'auditor'),
    auditoriaController.obtenerAuditoria
);

module.exports = router;