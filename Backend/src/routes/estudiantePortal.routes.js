const express = require('express');
const router = express.Router();
const estudiantePortalController = require('../controllers/estudiantePortal.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { soloEstudiante } = require('../middlewares/role.middleware');
const validarEstudiantePropietario = require('../middlewares/validarEstudiantePropietario.middleware');

// Todas estas rutas son exclusivas del estudiante
router.get(
    '/:estudianteId/resumen',
    authMiddleware,
    soloEstudiante,
    validarEstudiantePropietario,
    estudiantePortalController.obtenerResumen
);

router.get(
    '/:estudianteId/oferta/:periodoId',
    authMiddleware,
    soloEstudiante,
    validarEstudiantePropietario,
    estudiantePortalController.obtenerOfertaDisponible
);

router.get(
    '/:estudianteId/matriculados/:periodoId',
    authMiddleware,
    soloEstudiante,
    validarEstudiantePropietario,
    estudiantePortalController.obtenerCursosMatriculadosActuales
);

router.get(
    '/:estudianteId/historial-academico',
    authMiddleware,
    soloEstudiante,
    validarEstudiantePropietario,
    estudiantePortalController.obtenerHistorialAcademico
);

router.get(
    '/:estudianteId/historial-financiero',
    authMiddleware,
    soloEstudiante,
    validarEstudiantePropietario,
    estudiantePortalController.obtenerHistorialFinanciero
);

router.get(
    '/:estudianteId/pagos',
    authMiddleware,
    soloEstudiante,
    validarEstudiantePropietario,
    estudiantePortalController.obtenerPagos
);

module.exports = router;