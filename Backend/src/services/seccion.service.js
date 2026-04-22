const { poolPromise } = require('../config/db');

const crearErrorValidacion = (mensaje, statusCode = 400) => {
    const error = new Error(mensaje);
    error.statusCode = statusCode;
    return error;
};

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
            c.Creditos AS Creditos,
            c.Creditos AS creditos,

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
            c.Creditos AS Creditos,
            c.Creditos AS creditos,

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

const crearSeccion = async (data = {}) => {
    const pool = await poolPromise;

    const cursoId = Number(data.CursoID || data.cursoId || 0);
    const periodoId = Number(data.PeriodoID || data.periodoId || 0);
    const numeroSeccion = String(data.NumeroSeccion || data.numeroSeccion || '').trim();
    const docenteUsuarioId = data.DocenteID ? Number(data.DocenteID) : null;
    const cupoMaximo = Number(data.CupoMaximo || data.cupoMaximo || 0);
    const estadoSeccion = String(data.EstadoSeccion || data.estadoSeccion || 'Activa').trim();

    if (!cursoId || Number.isNaN(cursoId)) {
        throw crearErrorValidacion('CursoID es obligatorio y debe ser numérico');
    }

    if (!periodoId || Number.isNaN(periodoId)) {
        throw crearErrorValidacion('PeriodoID es obligatorio y debe ser numérico');
    }

    if (!numeroSeccion) {
        throw crearErrorValidacion('NumeroSeccion es obligatorio');
    }

    if (!cupoMaximo || Number.isNaN(cupoMaximo) || cupoMaximo <= 0) {
        throw crearErrorValidacion('CupoMaximo debe ser mayor que 0');
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [cursoRows] = await connection.query(
            `SELECT CursoID FROM Curso WHERE CursoID = ? LIMIT 1`,
            [cursoId]
        );

        if (!cursoRows.length) {
            throw crearErrorValidacion('El curso no existe', 404);
        }

        const [periodoRows] = await connection.query(
            `SELECT PeriodoID FROM Periodo WHERE PeriodoID = ? LIMIT 1`,
            [periodoId]
        );

        if (!periodoRows.length) {
            throw crearErrorValidacion('El período no existe', 404);
        }

        let docenteIdReal = null;

        if (docenteUsuarioId && !Number.isNaN(docenteUsuarioId)) {
            const [docenteRows] = await connection.query(
                `
                    SELECT DocenteID
                    FROM Docente
                    WHERE UsuarioID = ?
                    LIMIT 1
                `,
                [docenteUsuarioId]
            );

            if (!docenteRows.length) {
                throw crearErrorValidacion('El docente seleccionado no existe', 404);
            }

            docenteIdReal = Number(docenteRows[0].DocenteID);
        }

        const [duplicadoRows] = await connection.query(
            `
                SELECT SeccionID
                FROM Seccion
                WHERE CursoID = ?
                  AND PeriodoID = ?
                  AND LOWER(TRIM(NumeroSeccion)) = LOWER(TRIM(?))
                LIMIT 1
            `,
            [cursoId, periodoId, numeroSeccion]
        );

        if (duplicadoRows.length > 0) {
            throw crearErrorValidacion(
                'Ya existe una sección con ese número para el mismo curso y período'
            );
        }

        const [insertResult] = await connection.query(
            `
                INSERT INTO Seccion
                (
                    CursoID,
                    PeriodoID,
                    DocenteID,
                    NumeroSeccion,
                    CupoMaximo,
                    CupoDisponible,
                    EstadoSeccion
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
            [
                cursoId,
                periodoId,
                docenteIdReal,
                numeroSeccion,
                cupoMaximo,
                cupoMaximo,
                estadoSeccion
            ]
        );

        const seccionId = insertResult.insertId;

        await connection.commit();

        return {
            SeccionID: seccionId,
            CursoID: cursoId,
            PeriodoID: periodoId,
            DocenteID: docenteIdReal,
            NumeroSeccion: numeroSeccion,
            CupoMaximo: cupoMaximo,
            CupoDisponible: cupoMaximo,
            EstadoSeccion: estadoSeccion
        };
    } catch (error) {
        try {
            await connection.rollback();
        } catch (_) {}

        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    obtenerSecciones,
    obtenerSeccionPorId,
    crearSeccion
};