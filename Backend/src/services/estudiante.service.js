const { poolPromise } = require('../config/db');

const obtenerEstudiantes = async () => {
    const pool = await poolPromise;

    const query = `
        SELECT
            e.EstudianteID,
            e.Carnet,
            e.EstadoAcademico,
            e.FechaIngreso,

            u.UsuarioID,
            u.Identificacion,
            u.NombreCompleto,
            u.CorreoInstitucional,
            u.EstadoUsuario,

            pa.ProgramaAcademicoID,
            pa.CodigoPrograma,
            pa.NombrePrograma
        FROM Estudiante e
        INNER JOIN Usuario u
            ON e.UsuarioID = u.UsuarioID
        LEFT JOIN Programa_Academico pa
            ON e.ProgramaAcademicoID = pa.ProgramaAcademicoID
        ORDER BY e.EstudianteID;
    `;

    const [rows] = await pool.query(query);
    return rows;
};

const obtenerEstudiantePorId = async (id) => {
    const pool = await poolPromise;
    const estudianteId = Number(id);

    if (Number.isNaN(estudianteId) || estudianteId <= 0) {
        return null;
    }

    const query = `
        SELECT
            e.EstudianteID,
            e.Carnet,
            e.EstadoAcademico,
            e.FechaIngreso,

            u.UsuarioID,
            u.Identificacion,
            u.NombreCompleto,
            u.CorreoInstitucional,
            u.EstadoUsuario,

            pa.ProgramaAcademicoID,
            pa.CodigoPrograma,
            pa.NombrePrograma
        FROM Estudiante e
        INNER JOIN Usuario u
            ON e.UsuarioID = u.UsuarioID
        LEFT JOIN Programa_Academico pa
            ON e.ProgramaAcademicoID = pa.ProgramaAcademicoID
        WHERE e.EstudianteID = ?;
    `;

    const [rows] = await pool.query(query, [estudianteId]);
    return rows[0] || null;
};

module.exports = {
    obtenerEstudiantes,
    obtenerEstudiantePorId
};