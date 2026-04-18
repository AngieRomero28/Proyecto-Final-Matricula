const { poolPromise } = require('../config/db');

const crearError = (mensaje, statusCode = 403) => {
    const error = new Error(mensaje);
    error.statusCode = statusCode;
    return error;
};

const validarEstudiantePropietario = async (req, res, next) => {
    try {
        if (!req.usuario || !req.usuario.UsuarioID) {
            throw crearError('No autorizado. Debe autenticarse primero', 401);
        }

        const estudianteId = Number(req.params.estudianteId);

        if (Number.isNaN(estudianteId) || estudianteId <= 0) {
            throw crearError('El estudianteId debe ser numérico', 400);
        }

        const pool = await poolPromise;

        const [rows] = await pool.query(
            `
                SELECT
                    e.EstudianteID,
                    e.UsuarioID
                FROM Estudiante e
                WHERE e.EstudianteID = ?
                LIMIT 1;
            `,
            [estudianteId]
        );

        if (!rows.length) {
            throw crearError('Estudiante no encontrado', 404);
        }

        const estudiante = rows[0];

        if (Number(estudiante.UsuarioID) !== Number(req.usuario.UsuarioID)) {
            throw crearError(
                'No tiene permiso para acceder a la información de otro estudiante',
                403
            );
        }

        req.estudiante = estudiante;
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = validarEstudiantePropietario;