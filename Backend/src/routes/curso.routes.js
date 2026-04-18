const express = require('express');
const router = express.Router();

const cursoController = require('../controllers/curso.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { permitirRoles } = require('../middlewares/role.middleware');

// Obtener todos los cursos
router.get(
    '/',
    authMiddleware,
    permitirRoles('admin', 'registro', 'docente', 'auditor'),
    cursoController.obtenerCursos
);

// Obtener curso por ID
router.get(
    '/:id',
    authMiddleware,
    permitirRoles('admin', 'registro', 'docente', 'auditor'),
    cursoController.obtenerCursoPorId
);

module.exports = router;