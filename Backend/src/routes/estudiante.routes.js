const express = require('express');
const router = express.Router();

const estudianteController = require('../controllers/estudiante.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { permitirRoles } = require('../middlewares/role.middleware');

// Obtener todos los estudiantes
router.get(
    '/',
    authMiddleware,
    permitirRoles('admin', 'registro', 'tesoreria', 'auditor'),
    estudianteController.obtenerEstudiantes
);

// Obtener un estudiante por ID
router.get(
    '/:id',
    authMiddleware,
    permitirRoles('admin', 'registro', 'tesoreria', 'auditor'),
    estudianteController.obtenerEstudiantePorId
);

module.exports = router;