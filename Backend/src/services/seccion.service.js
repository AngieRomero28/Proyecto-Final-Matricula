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
            c.Creditos,

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
        ORDER BY s.SeccionID, h.DiaSemana, h.HoraInicio;
    `;

    const [rows] = await pool.query(query);
    return rows;
};

const obtenerSeccionPorId = async (id) => {
    const pool = await poolPromise;
    const seccionId = Number(id);

    if (Number.isNaN(seccionId) || seccionId <= 0) {
        return [];
    }

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
            c.Creditos,

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
        WHERE s.SeccionID = ?
        ORDER BY s.SeccionID, h.DiaSemana, h.HoraInicio;
    `;

    const [rows] = await pool.query(query, [seccionId]);
    return rows;
};

module.exports = {
    obtenerSecciones,
    obtenerSeccionPorId
};