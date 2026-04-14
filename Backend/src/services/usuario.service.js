const { poolPromise, sql } = require('../config/db');

const obtenerUsuarios = async () => {
    const pool = await poolPromise;

    const query = `
        SELECT
            u.UsuarioID,
            u.Identificacion,
            u.NombreCompleto,
            u.CorreoInstitucional,
            u.EstadoUsuario,

            CASE
                WHEN EXISTS (
                    SELECT 1
                    FROM Estudiante e
                    WHERE e.UsuarioID = u.UsuarioID
                ) THEN 'Estudiante'
                WHEN EXISTS (
                    SELECT 1
                    FROM Docente d
                    WHERE d.UsuarioID = u.UsuarioID
                ) THEN 'Docente'
                ELSE 'Usuario'
            END AS RolSistema

        FROM Usuario u
        ORDER BY u.UsuarioID DESC;
    `;

    const result = await pool.request().query(query);
    return result.recordset;
};

const obtenerUsuarioPorId = async (id) => {
    const pool = await poolPromise;

    const query = `
        SELECT
            u.UsuarioID,
            u.Identificacion,
            u.NombreCompleto,
            u.CorreoInstitucional,
            u.EstadoUsuario,

            CASE
                WHEN EXISTS (
                    SELECT 1
                    FROM Estudiante e
                    WHERE e.UsuarioID = u.UsuarioID
                ) THEN 'Estudiante'
                WHEN EXISTS (
                    SELECT 1
                    FROM Docente d
                    WHERE d.UsuarioID = u.UsuarioID
                ) THEN 'Docente'
                ELSE 'Usuario'
            END AS RolSistema

        FROM Usuario u
        WHERE u.UsuarioID = @id;
    `;

    const result = await pool
        .request()
        .input('id', sql.Int, id)
        .query(query);

    return result.recordset[0] || null;
};

module.exports = {
    obtenerUsuarios,
    obtenerUsuarioPorId
};