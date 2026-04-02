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
        INNER JOIN Programa_Academico pa
            ON e.ProgramaAcademicoID = pa.ProgramaAcademicoID
        ORDER BY e.EstudianteID;
    `;

    const result = await pool.request().query(query);
    return result.recordset;
};

const obtenerEstudiantePorId = async (id) => {
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
        INNER JOIN Programa_Academico pa
            ON e.ProgramaAcademicoID = pa.ProgramaAcademicoID
        WHERE e.EstudianteID = @id;
    `;

    const result = await pool
        .request()
        .input('id', id)
        .query(query);

    return result.recordset[0] || null;
};

module.exports = {
    obtenerEstudiantes,
    obtenerEstudiantePorId
};