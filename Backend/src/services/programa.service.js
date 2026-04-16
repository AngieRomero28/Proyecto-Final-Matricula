const { poolPromise } = require('../config/db');

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

    const [rows] = await pool.query(query);
    return rows;
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
        WHERE pa.ProgramaAcademicoID = ?
        GROUP BY
            pa.ProgramaAcademicoID,
            pa.CodigoPrograma,
            pa.NombrePrograma;
    `;

    const [rows] = await pool.query(query, [id]);
    return rows[0] || null;
};

module.exports = {
    obtenerProgramas,
    obtenerProgramaPorId
};