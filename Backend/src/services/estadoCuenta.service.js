const { poolPromise, sql } = require('../config/db');

const obtenerEstadosCuenta = async () => {
    const pool = await poolPromise;

    const query = `
        SELECT
            ec.EstadoCuentaID,
            ec.MontoTotal,
            ec.MontoPagado,
            ec.SaldoPendiente,
            ec.EstadoCuenta,
            ec.FechaGeneracion,
            ec.FechaActualizacion,

            f.FacturaID,
            f.NumeroFactura,
            f.FechaEmision,
            f.Subtotal,
            f.Descuento,
            f.Total,
            f.EstadoFactura,

            e.EstudianteID,
            e.Carnet,

            u.UsuarioID,
            u.NombreCompleto AS NombreEstudiante,
            u.CorreoInstitucional,

            p.PeriodoID,
            p.NombrePeriodo,
            p.TipoPeriodo,
            p.Anio,

            m.MatriculaID,
            m.EstadoMatricula,
            m.ComprobanteMatricula
        FROM Estado_Cuenta ec
        INNER JOIN Factura f
            ON ec.FacturaID = f.FacturaID
        INNER JOIN Estudiante e
            ON ec.EstudianteID = e.EstudianteID
        INNER JOIN Usuario u
            ON e.UsuarioID = u.UsuarioID
        INNER JOIN Periodo p
            ON ec.PeriodoID = p.PeriodoID
        LEFT JOIN Matricula m
            ON ec.FacturaID = m.FacturaID
        ORDER BY ec.EstadoCuentaID DESC;
    `;

    const result = await pool.request().query(query);
    return result.recordset;
};

const obtenerEstadoCuentaPorId = async (id) => {
    const pool = await poolPromise;

    const query = `
        SELECT
            ec.EstadoCuentaID,
            ec.MontoTotal,
            ec.MontoPagado,
            ec.SaldoPendiente,
            ec.EstadoCuenta,
            ec.FechaGeneracion,
            ec.FechaActualizacion,

            f.FacturaID,
            f.NumeroFactura,
            f.FechaEmision,
            f.Subtotal,
            f.Descuento,
            f.Total,
            f.EstadoFactura,

            e.EstudianteID,
            e.Carnet,

            u.UsuarioID,
            u.NombreCompleto AS NombreEstudiante,
            u.CorreoInstitucional,

            p.PeriodoID,
            p.NombrePeriodo,
            p.TipoPeriodo,
            p.Anio,

            m.MatriculaID,
            m.EstadoMatricula,
            m.ComprobanteMatricula
        FROM Estado_Cuenta ec
        INNER JOIN Factura f
            ON ec.FacturaID = f.FacturaID
        INNER JOIN Estudiante e
            ON ec.EstudianteID = e.EstudianteID
        INNER JOIN Usuario u
            ON e.UsuarioID = u.UsuarioID
        INNER JOIN Periodo p
            ON ec.PeriodoID = p.PeriodoID
        LEFT JOIN Matricula m
            ON ec.FacturaID = m.FacturaID
        WHERE ec.EstadoCuentaID = @id;
    `;

    const result = await pool
        .request()
        .input('id', sql.Int, id)
        .query(query);

    return result.recordset[0] || null;
};

module.exports = {
    obtenerEstadosCuenta,
    obtenerEstadoCuentaPorId
};