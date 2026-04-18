const express = require('express');
const router = express.Router();

const programaController = require('../controllers/programa.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { permitirRoles } = require('../middlewares/role.middleware');

// Obtener todos los programas
router.get(
    '/',
    authMiddleware,
    permitirRoles('admin', 'registro', 'docente', 'auditor'),
    programaController.obtenerProgramas
);

// Obtener programa por ID
router.get(
    '/:id',
    authMiddleware,
    permitirRoles('admin', 'registro', 'docente', 'auditor'),
    programaController.obtenerProgramaPorId
);

module.exports = router;