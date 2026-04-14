const express = require('express');
const router = express.Router();
const auditoriaController = require('../controllers/auditoria.controller');

// Obtener auditoría
router.get('/', auditoriaController.obtenerAuditoria);

module.exports = router;