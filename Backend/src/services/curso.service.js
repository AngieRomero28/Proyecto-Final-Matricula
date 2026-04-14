const { poolPromise, sql } = require('../config/db');

const obtenerCursos = async () => {
    const pool = await poolPromise;

    const query = `
        SELECT
            CursoID,
            CodigoCurso,
            NombreCurso,
            Creditos,
            Descripcion,
            EstadoCurso
        FROM Curso
        ORDER BY CursoID;
    `;

    const result = await pool.request().query(query);
    return result.recordset;
};

const obtenerCursoPorId = async (id) => {
    const pool = await poolPromise;

    const query = `
        SELECT
            CursoID,
            CodigoCurso,
            NombreCurso,
            Creditos,
            Descripcion,
            EstadoCurso
        FROM Curso
        WHERE CursoID = @id;
    `;

    const result = await pool
        .request()
        .input('id', sql.Int, id)
        .query(query);

    return result.recordset[0] || null;
};

module.exports = {
    obtenerCursos,
    obtenerCursoPorId
};