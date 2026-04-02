const { poolPromise } = require('../config/db');

const obtenerSecciones = async () => {
    const pool = await poolPromise;

    const query = `
        SELECT
            s.SeccionID,
            s.NumeroSeccion,
            s.CupoMaximo,
            s.CupoDisponible,
            s.EstadoSeccion,

            c.CursoID,
            c.CodigoCurso,
            c.NombreCurso,

            p.PeriodoID,
            p.NombrePeriodo,
            p.TipoPeriodo,
            p.Anio,

            d.DocenteID,
            u.NombreCompleto AS Docente,

            h.HorarioID,
            h.DiaSemana,
            h.HoraInicio,
            h.HoraFin,

            a.AulaID,
            a.CodigoAula,
            a.NombreAula,
            a.Ubicacion

        FROM Seccion s
        INNER JOIN Curso c
            ON s.CursoID = c.CursoID
        INNER JOIN Periodo p
            ON s.PeriodoID = p.PeriodoID
        LEFT JOIN Docente d
            ON s.DocenteID = d.DocenteID
        LEFT JOIN Usuario u
            ON d.UsuarioID = u.UsuarioID
        LEFT JOIN Seccion_Horario sh
            ON s.SeccionID = sh.SeccionID
        LEFT JOIN Horario h
            ON sh.HorarioID = h.HorarioID
        LEFT JOIN Aula a
            ON sh.AulaID = a.AulaID
        ORDER BY s.SeccionID;
    `;

    const result = await pool.request().query(query);
    return result.recordset;
};

const obtenerSeccionPorId = async (id) => {
    const pool = await poolPromise;

    const query = `
        SELECT
            s.SeccionID,
            s.NumeroSeccion,
            s.CupoMaximo,
            s.CupoDisponible,
            s.EstadoSeccion,

            c.CursoID,
            c.CodigoCurso,
            c.NombreCurso,

            p.PeriodoID,
            p.NombrePeriodo,
            p.TipoPeriodo,
            p.Anio,

            d.DocenteID,
            u.NombreCompleto AS Docente,

            h.HorarioID,
            h.DiaSemana,
            h.HoraInicio,
            h.HoraFin,

            a.AulaID,
            a.CodigoAula,
            a.NombreAula,
            a.Ubicacion

        FROM Seccion s
        INNER JOIN Curso c
            ON s.CursoID = c.CursoID
        INNER JOIN Periodo p
            ON s.PeriodoID = p.PeriodoID
        LEFT JOIN Docente d
            ON s.DocenteID = d.DocenteID
        LEFT JOIN Usuario u
            ON d.UsuarioID = u.UsuarioID
        LEFT JOIN Seccion_Horario sh
            ON s.SeccionID = sh.SeccionID
        LEFT JOIN Horario h
            ON sh.HorarioID = h.HorarioID
        LEFT JOIN Aula a
            ON sh.AulaID = a.AulaID
        WHERE s.SeccionID = @id
        ORDER BY s.SeccionID;
    `;

    const result = await pool
        .request()
        .input('id', id)
        .query(query);

    return result.recordset;
};

module.exports = {
    obtenerSecciones,
    obtenerSeccionPorId
};