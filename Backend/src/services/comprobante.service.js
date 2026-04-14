const { poolPromise, sql } = require('../config/db');

const obtenerComprobantes = async () => {
    const pool = await poolPromise;

    const query = `
        SELECT
            m.MatriculaID,
            m.FechaMatricula,
            m.CreditosTotales,
            m.CostoTotal,
            m.EstadoMatricula,
            m.ComprobanteMatricula,

            e.EstudianteID,
            e.Carnet,
            e.EstadoAcademico,

            u.UsuarioID,
            u.NombreCompleto AS NombreEstudiante,
            u.CorreoInstitucional,

            p.PeriodoID,
            p.NombrePeriodo,
            p.TipoPeriodo,
            p.Anio,

            f.FacturaID,
            f.NumeroFactura,
            f.Subtotal,
            f.Descuento,
            f.Total,
            f.EstadoFactura,

            ec.EstadoCuentaID,
            ec.MontoTotal,
            ec.MontoPagado,
            ec.SaldoPendiente,
            ec.EstadoCuenta
        FROM Matricula m
        INNER JOIN Estudiante e
            ON m.EstudianteID = e.EstudianteID
        INNER JOIN Usuario u
            ON e.UsuarioID = u.UsuarioID
        INNER JOIN Periodo p
            ON m.PeriodoID = p.PeriodoID
        LEFT JOIN Factura f
            ON m.FacturaID = f.FacturaID
        LEFT JOIN Estado_Cuenta ec
            ON m.EstadoCuentaID = ec.EstadoCuentaID
        WHERE m.ComprobanteMatricula IS NOT NULL
          AND LTRIM(RTRIM(m.ComprobanteMatricula)) <> ''
        ORDER BY m.MatriculaID DESC;
    `;

    const result = await pool.request().query(query);
    return result.recordset;
};

const obtenerComprobantePorMatriculaId = async (matriculaId) => {
    const pool = await poolPromise;

    const query = `
        SELECT
            m.MatriculaID,
            m.FechaMatricula,
            m.CreditosTotales,
            m.CostoTotal,
            m.EstadoMatricula,
            m.ComprobanteMatricula,

            e.EstudianteID,
            e.Carnet,
            e.EstadoAcademico,

            u.UsuarioID,
            u.NombreCompleto AS NombreEstudiante,
            u.CorreoInstitucional,

            p.PeriodoID,
            p.NombrePeriodo,
            p.TipoPeriodo,
            p.Anio,

            f.FacturaID,
            f.NumeroFactura,
            f.Subtotal,
            f.Descuento,
            f.Total,
            f.EstadoFactura,

            ec.EstadoCuentaID,
            ec.MontoTotal,
            ec.MontoPagado,
            ec.SaldoPendiente,
            ec.EstadoCuenta
        FROM Matricula m
        INNER JOIN Estudiante e
            ON m.EstudianteID = e.EstudianteID
        INNER JOIN Usuario u
            ON e.UsuarioID = u.UsuarioID
        INNER JOIN Periodo p
            ON m.PeriodoID = p.PeriodoID
        LEFT JOIN Factura f
            ON m.FacturaID = f.FacturaID
        LEFT JOIN Estado_Cuenta ec
            ON m.EstadoCuentaID = ec.EstadoCuentaID
        WHERE m.MatriculaID = @matriculaId;
    `;

    const result = await pool
        .request()
        .input('matriculaId', sql.Int, matriculaId)
        .query(query);

    if (!result.recordset.length) {
        return null;
    }

    const encabezado = result.recordset[0];

    const detalleQuery = `
        SELECT
            ms.MatriculaID,
            ms.EstadoDetalle,

            s.SeccionID,
            s.NumeroSeccion,
            s.CupoMaximo,
            s.CupoDisponible,
            s.EstadoSeccion,

            c.CursoID,
            c.CodigoCurso,
            c.NombreCurso,
            c.Creditos,

            h.DiaSemana,
            h.HoraInicio,
            h.HoraFin,

            a.CodigoAula,
            a.NombreAula,
            a.Ubicacion
        FROM Matricula_Seccion ms
        INNER JOIN Seccion s
            ON ms.SeccionID = s.SeccionID
        INNER JOIN Curso c
            ON s.CursoID = c.CursoID
        LEFT JOIN Seccion_Horario sh
            ON s.SeccionID = sh.SeccionID
        LEFT JOIN Horario h
            ON sh.HorarioID = h.HorarioID
        LEFT JOIN Aula a
            ON sh.AulaID = a.AulaID
        WHERE ms.MatriculaID = @matriculaId
        ORDER BY s.SeccionID;
    `;

    const detalleResult = await pool
        .request()
        .input('matriculaId', sql.Int, matriculaId)
        .query(detalleQuery);

    return {
        encabezado,
        detalle: detalleResult.recordset
    };
};

module.exports = {
    obtenerComprobantes,
    obtenerComprobantePorMatriculaId
};