// backend/src/routes/usuario.routes.js
const express = require('express');
const router = express.Router();

const usuarioController = require('../controllers/usuario.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { permitirRoles } = require('../middlewares/role.middleware');

// Login legacy / alternativo
router.post('/login', usuarioController.loginUsuario);

// Crear usuario (solo admin)
router.post(
    '/',
    authMiddleware,
    permitirRoles('admin'),
    usuarioController.crearUsuario
);

// Obtener perfil por ID de usuario
router.get('/perfil/:id', authMiddleware, usuarioController.obtenerPerfil);

// Cambiar contraseña
router.put('/cambiar-password', authMiddleware, usuarioController.cambiarPassword);

// Obtener todos los usuarios
router.get('/', authMiddleware, usuarioController.obtenerUsuarios);

// Obtener usuario por ID
router.get('/:id', authMiddleware, usuarioController.obtenerUsuarioPorId);

module.exports = router;