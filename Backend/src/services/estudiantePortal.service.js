const { poolPromise } = require('../config/db');
const matriculaService = require('./matricula.service');

const crearError = (mensaje, statusCode = 400) => {
    const error = new Error(mensaje);
    error.statusCode = statusCode;
    return error;
};

const validarEstudiante = async (executor, estudianteId) => {
    const estudianteIdNum = Number(estudianteId);

    if (Number.isNaN(estudianteIdNum) || estudianteIdNum <= 0) {
        throw crearError('El estudianteId debe ser numérico');
    }

    const [rows] = await executor.query(
        `
            SELECT
                e.EstudianteID,
                e.UsuarioID,
                e.Carnet,
                e.EstadoAcademico,
                e.ProgramaAcademicoID,
                u.NombreCompleto,
                u.CorreoInstitucional
            FROM Estudiante e
            INNER JOIN Usuario u
                ON e.UsuarioID = u.UsuarioID
            WHERE e.EstudianteID = ?
            LIMIT 1;
        `,
        [estudianteIdNum]
    );

    if (!rows.length) {
        throw crearError('Estudiante no encontrado', 404);
    }

    return rows[0];
};

const obtenerResumenEstudiante = async (estudianteId) => {
    const pool = await poolPromise;

    const estudiante = await validarEstudiante(pool, estudianteId);

    const [matriculasRows] = await pool.query(
        `
            SELECT COUNT(*) AS TotalMatriculas
            FROM Matricula
            WHERE EstudianteID = ?;
        `,
        [estudiante.EstudianteID]
    );

    const [cursosAprobadosRows] = await pool.query(
        `
            SELECT COUNT(DISTINCT CursoID) AS CursosAprobados
            FROM Historial_Academico
            WHERE EstudianteID = ?
              AND EstadoCurso = 'Aprobado';
        `,
        [estudiante.EstudianteID]
    );

    const [facturasPendientesRows] = await pool.query(
        `
            SELECT COUNT(*) AS FacturasPendientes
            FROM Estado_Cuenta ec
            INNER JOIN Factura f
                ON ec.FacturaID = f.FacturaID
            WHERE f.EstudianteID = ?
              AND ec.SaldoPendiente > 0;
        `,
        [estudiante.EstudianteID]
    );

    const [saldoPendienteRows] = await pool.query(
        `
            SELECT IFNULL(SUM(ec.SaldoPendiente), 0) AS SaldoPendiente
            FROM Estado_Cuenta ec
            INNER JOIN Factura f
                ON ec.FacturaID = f.FacturaID
            WHERE f.EstudianteID = ?;
        `,
        [estudiante.EstudianteID]
    );

    return {
        estudiante,
        resumen: {
            TotalMatriculas: Number(matriculasRows[0]?.TotalMatriculas || 0),
            CursosAprobados: Number(cursosAprobadosRows[0]?.CursosAprobados || 0),
            FacturasPendientes: Number(facturasPendientesRows[0]?.FacturasPendientes || 0),
            SaldoPendiente: Number(saldoPendienteRows[0]?.SaldoPendiente || 0)
        }
    };
};

const obtenerOfertaDisponible = async (estudianteId, periodoId) => {
    const pool = await poolPromise;
    await validarEstudiante(pool, estudianteId);

    const periodoIdNum = Number(periodoId);

    if (Number.isNaN(periodoIdNum) || periodoIdNum <= 0) {
        throw crearError('El periodoId debe ser numérico');
    }

    return matriculaService.obtenerOfertaMatriculablePorEstudiante(
        Number(estudianteId),
        periodoIdNum
    );
};

const obtenerCursosMatriculadosActuales = async (estudianteId, periodoId) => {
    const pool = await poolPromise;
    const estudiante = await validarEstudiante(pool, estudianteId);

    const periodoIdNum = Number(periodoId);

    if (Number.isNaN(periodoIdNum) || periodoIdNum <= 0) {
        throw crearError('El periodoId debe ser numérico');
    }

    const [rows] = await pool.query(
        `
            SELECT
                m.MatriculaID,
                m.FechaMatricula,
                m.EstadoMatricula,
                m.CreditosTotales,
                m.CostoTotal,

                s.SeccionID,
                s.NumeroSeccion,

                c.CursoID,
                c.CodigoCurso,
                c.NombreCurso,
                c.Creditos,

                h.DiaSemana,
                h.HoraInicio,
                h.HoraFin,

                a.CodigoAula,
                a.NombreAula,
                a.Ubicacion,

                p.PeriodoID,
                p.NombrePeriodo,
                p.TipoPeriodo,
                p.Anio,

                d.DocenteID,
                udoc.NombreCompleto AS NombreDocente
            FROM Matricula m
            INNER JOIN Periodo p
                ON m.PeriodoID = p.PeriodoID
            INNER JOIN Matricula_Seccion ms
                ON m.MatriculaID = ms.MatriculaID
            INNER JOIN Seccion s
                ON ms.SeccionID = s.SeccionID
            INNER JOIN Curso c
                ON s.CursoID = c.CursoID
            LEFT JOIN Docente d
                ON s.DocenteID = d.DocenteID
            LEFT JOIN Usuario udoc
                ON d.UsuarioID = udoc.UsuarioID
            LEFT JOIN Seccion_Horario sh
                ON s.SeccionID = sh.SeccionID
            LEFT JOIN Horario h
                ON sh.HorarioID = h.HorarioID
            LEFT JOIN Aula a
                ON sh.AulaID = a.AulaID
            WHERE m.EstudianteID = ?
              AND m.PeriodoID = ?
              AND m.EstadoMatricula NOT IN ('Cancelada', 'Anulada')
              AND (
                    ms.EstadoDetalle IS NULL
                    OR ms.EstadoDetalle IN ('Activa', 'Activo')
                  )
            ORDER BY c.NombreCurso, h.DiaSemana, h.HoraInicio;
        `,
        [estudiante.EstudianteID, periodoIdNum]
    );

    return rows;
};

const obtenerHistorialAcademico = async (estudianteId) => {
    const pool = await poolPromise;
    const estudiante = await validarEstudiante(pool, estudianteId);

    const [rows] = await pool.query(
        `
            SELECT
                ha.HistorialAcademicoID,
                ha.Anio,
                ha.PeriodoCursado,
                ha.Calificacion,
                ha.EstadoCurso,

                c.CursoID,
                c.CodigoCurso,
                c.NombreCurso,
                c.Creditos
            FROM Historial_Academico ha
            INNER JOIN Curso c
                ON ha.CursoID = c.CursoID
            WHERE ha.EstudianteID = ?
            ORDER BY ha.Anio DESC, ha.HistorialAcademicoID DESC;
        `,
        [estudiante.EstudianteID]
    );

    return rows;
};

const obtenerHistorialFinanciero = async (estudianteId) => {
    const pool = await poolPromise;
    const estudiante = await validarEstudiante(pool, estudianteId);

    const [rows] = await pool.query(
        `
            SELECT
                f.FacturaID,
                f.NumeroFactura,
                f.FechaFactura,

                IFNULL(f.Total, 0) AS Subtotal,
                0 AS Descuento,
                IFNULL(f.Total, 0) AS Total,
                IFNULL(f.EstadoFactura, 'N/D') AS EstadoFactura,

                p.PeriodoID,
                p.NombrePeriodo,
                p.TipoPeriodo,
                p.Anio,

                ec.EstadoCuentaID,
                COALESCE(ec.MontoTotal, f.Total, 0) AS MontoTotal,
                IFNULL(ec.MontoPagado, 0) AS MontoPagado,
                IFNULL(ec.SaldoPendiente, 0) AS SaldoPendiente,
                IFNULL(ec.EstadoCuenta, 'N/D') AS EstadoCuenta,
                ec.FechaActualizacion
            FROM Factura f
            INNER JOIN Periodo p
                ON f.PeriodoID = p.PeriodoID
            LEFT JOIN Estado_Cuenta ec
                ON f.FacturaID = ec.FacturaID
            WHERE f.EstudianteID = ?
            ORDER BY p.Anio DESC, f.FacturaID DESC;
        `,
        [estudiante.EstudianteID]
    );

    return rows;
};

const obtenerPagosEstudiante = async (estudianteId) => {
    const pool = await poolPromise;
    const estudiante = await validarEstudiante(pool, estudianteId);

    const [rows] = await pool.query(
        `
            SELECT
                pg.PagoID,
                pg.FechaPago,
                pg.MontoPago,
                pg.MetodoPago,
                pg.ReferenciaPago,
                pg.EstadoPago,

                f.FacturaID,
                f.NumeroFactura,
                IFNULL(f.Total, 0) AS Total,

                p.PeriodoID,
                p.NombrePeriodo,
                p.TipoPeriodo,
                p.Anio
            FROM Pago pg
            INNER JOIN Factura f
                ON pg.FacturaID = f.FacturaID
            INNER JOIN Periodo p
                ON pg.PeriodoID = p.PeriodoID
            WHERE pg.EstudianteID = ?
            ORDER BY pg.FechaPago DESC, pg.PagoID DESC;
        `,
        [estudiante.EstudianteID]
    );

    return rows;
};

module.exports = {
    obtenerResumenEstudiante,
    obtenerOfertaDisponible,
    obtenerCursosMatriculadosActuales,
    obtenerHistorialAcademico,
    obtenerHistorialFinanciero,
    obtenerPagosEstudiante
};