const express = require('express');
const router = express.Router();

const matriculaController = require('../controllers/matricula.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { permitirRoles } = require('../middlewares/role.middleware');

// Obtener todas las matrículas
router.get(
    '/',
    authMiddleware,
    permitirRoles('admin', 'registro', 'tesoreria', 'auditor', 'docente'),
    matriculaController.obtenerMatriculas
);

// Obtener estudiantes matriculados por sección (docente)
router.get(
    '/seccion/:seccionId/estudiantes',
    authMiddleware,
    permitirRoles('admin', 'registro', 'docente', 'auditor'),
    matriculaController.obtenerEstudiantesPorSeccion
);

// Obtener matrícula por ID
router.get(
    '/:id',
    authMiddleware,
    permitirRoles('admin', 'registro', 'tesoreria', 'auditor', 'docente'),
    matriculaController.obtenerMatriculaPorId
);

// Crear matrícula
router.post(
    '/',
    authMiddleware,
    permitirRoles('admin', 'registro', 'estudiante'),
    matriculaController.crearMatricula
);

module.exports = router;