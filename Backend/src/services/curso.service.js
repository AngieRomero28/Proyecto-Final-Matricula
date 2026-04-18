const { poolPromise } = require('../config/db');

const obtenerCursos = async () => {
    const pool = await poolPromise;

    const query = `
        SELECT
            c.CursoID,
            c.CodigoCurso,
            c.NombreCurso,
            c.Creditos,
            c.Descripcion,
            c.EstadoCurso,
            (
                SELECT COUNT(*)
                FROM Prerrequisito pr
                WHERE pr.CursoID = c.CursoID
            ) AS TotalPrerrequisitos,
            (
                SELECT COUNT(*)
                FROM Correquisito cr
                WHERE cr.CursoID = c.CursoID
            ) AS TotalCorrequisitos
        FROM Curso c
        ORDER BY c.CursoID;
    `;

    const [rows] = await pool.query(query);
    return rows;
};

const obtenerCursoPorId = async (id) => {
    const pool = await poolPromise;
    const cursoId = Number(id);

    if (Number.isNaN(cursoId) || cursoId <= 0) {
        return null;
    }

    const query = `
        SELECT
            c.CursoID,
            c.CodigoCurso,
            c.NombreCurso,
            c.Creditos,
            c.Descripcion,
            c.EstadoCurso
        FROM Curso c
        WHERE c.CursoID = ?;
    `;

    const [rows] = await pool.query(query, [cursoId]);

    if (!rows.length) {
        return null;
    }

    const curso = rows[0];

    const [prerrequisitos] = await pool.query(
        `
            SELECT
                pr.CursoPrerrequisitoID,
                c.CodigoCurso,
                c.NombreCurso
            FROM Prerrequisito pr
            INNER JOIN Curso c
                ON pr.CursoPrerrequisitoID = c.CursoID
            WHERE pr.CursoID = ?
            ORDER BY c.NombreCurso;
        `,
        [cursoId]
    );

    const [correquisitos] = await pool.query(
        `
            SELECT
                cr.CursoCorrequisitoID,
                c.CodigoCurso,
                c.NombreCurso
            FROM Correquisito cr
            INNER JOIN Curso c
                ON cr.CursoCorrequisitoID = c.CursoID
            WHERE cr.CursoID = ?
            ORDER BY c.NombreCurso;
        `,
        [cursoId]
    );

    return {
        ...curso,
        Prerrequisitos: prerrequisitos,
        Correquisitos: correquisitos
    };
};

const obtenerCursosPorPrograma = async (programaAcademicoId) => {
    const pool = await poolPromise;
    const programaId = Number(programaAcademicoId);

    if (Number.isNaN(programaId) || programaId <= 0) {
        return [];
    }

    const query = `
        SELECT DISTINCT
            c.CursoID,
            c.CodigoCurso,
            c.NombreCurso,
            c.Creditos,
            c.Descripcion,
            c.EstadoCurso
        FROM Plan_Estudio pe
        INNER JOIN Plan_Estudio_Detalle ped
            ON pe.PlanEstudioID = ped.PlanEstudioID
        INNER JOIN Curso c
            ON ped.CursoID = c.CursoID
        WHERE pe.ProgramaAcademicoID = ?
        ORDER BY c.NombreCurso;
    `;

    const [rows] = await pool.query(query, [programaId]);
    return rows;
};

module.exports = {
    obtenerCursos,
    obtenerCursoPorId,
    obtenerCursosPorPrograma
};