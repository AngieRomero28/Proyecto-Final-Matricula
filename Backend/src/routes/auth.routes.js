const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// LOGIN
router.post('/login', authController.login);

// CAMBIAR PASSWORD (requiere usuario autenticado)
router.put('/cambiar-password', authMiddleware, authController.cambiarPassword);

module.exports = router;