const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// LOGIN
router.post('/login', authController.login);

// CAMBIAR PASSWORD (exclusivo para estudiantes)
router.put('/cambiar-password', authController.cambiarPassword);

module.exports = router;