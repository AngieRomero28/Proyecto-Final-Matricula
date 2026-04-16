const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuario.controller');

// Login
router.post('/login', usuarioController.loginUsuario);

// Obtener perfil por ID de usuario
router.get('/perfil/:id', usuarioController.obtenerPerfil);

// Cambiar contraseña
router.put('/cambiar-password', usuarioController.cambiarPassword);

// Obtener todos los usuarios
router.get('/', usuarioController.obtenerUsuarios);

// Obtener usuario por ID
router.get('/:id', usuarioController.obtenerUsuarioPorId);

module.exports = router;