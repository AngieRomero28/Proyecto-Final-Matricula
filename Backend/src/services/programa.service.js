const { poolPromise, sql } = require('../config/db');

const obtenerProgramas = async () => {
    const pool = await poolPromise;

    const query = `
        SELECT
            pa.ProgramaAcademicoID,
            pa.CodigoPrograma,
            pa.NombrePrograma,
            COUNT(e.EstudianteID) AS TotalEstudiantes
        FROM Programa_Academico pa
        LEFT JOIN Estudiante e
            ON pa.ProgramaAcademicoID = e.ProgramaAcademicoID
        GROUP BY
            pa.ProgramaAcademicoID,
            pa.CodigoPrograma,
            pa.NombrePrograma
        ORDER BY pa.ProgramaAcademicoID DESC;
    `;

    const result = await pool.request().query(query);
    return result.recordset;
};

const obtenerProgramaPorId = async (id) => {
    const pool = await poolPromise;

    const query = `
        SELECT
            pa.ProgramaAcademicoID,
            pa.CodigoPrograma,
            pa.NombrePrograma,
            COUNT(e.EstudianteID) AS TotalEstudiantes
        FROM Programa_Academico pa
        LEFT JOIN Estudiante e
            ON pa.ProgramaAcademicoID = e.ProgramaAcademicoID
        WHERE pa.ProgramaAcademicoID = @id
        GROUP BY
            pa.ProgramaAcademicoID,
            pa.CodigoPrograma,
            pa.NombrePrograma;
    `;

    const result = await pool
        .request()
        .input('id', sql.Int, id)
        .query(query);

    return result.recordset[0] || null;
};

module.exports = {
    obtenerProgramas,
    obtenerProgramaPorId
};