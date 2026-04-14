const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuario.controller');

// Obtener todos los usuarios
router.get('/', usuarioController.obtenerUsuarios);

// Obtener usuario por ID
router.get('/:id', usuarioController.obtenerUsuarioPorId);

module.exports = router;