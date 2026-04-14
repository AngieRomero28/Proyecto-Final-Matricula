const { poolPromise, sql } = require('../config/db');

const obtenerFacturas = async () => {
    const pool = await poolPromise;

    const query = `
        SELECT
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

            ec.EstadoCuentaID,
            ec.MontoTotal,
            ec.MontoPagado,
            ec.SaldoPendiente,
            ec.EstadoCuenta,

            m.MatriculaID,
            m.EstadoMatricula,
            m.ComprobanteMatricula

        FROM Factura f
        INNER JOIN Estudiante e
            ON f.EstudianteID = e.EstudianteID
        INNER JOIN Usuario u
            ON e.UsuarioID = u.UsuarioID
        INNER JOIN Periodo p
            ON f.PeriodoID = p.PeriodoID
        LEFT JOIN Estado_Cuenta ec
            ON f.FacturaID = ec.FacturaID
        LEFT JOIN Matricula m
            ON f.FacturaID = m.FacturaID
        ORDER BY f.FacturaID DESC;
    `;

    const result = await pool.request().query(query);
    return result.recordset;
};

const obtenerFacturaPorId = async (id) => {
    const pool = await poolPromise;

    const query = `
        SELECT
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

            ec.EstadoCuentaID,
            ec.MontoTotal,
            ec.MontoPagado,
            ec.SaldoPendiente,
            ec.EstadoCuenta,

            m.MatriculaID,
            m.EstadoMatricula,
            m.ComprobanteMatricula

        FROM Factura f
        INNER JOIN Estudiante e
            ON f.EstudianteID = e.EstudianteID
        INNER JOIN Usuario u
            ON e.UsuarioID = u.UsuarioID
        INNER JOIN Periodo p
            ON f.PeriodoID = p.PeriodoID
        LEFT JOIN Estado_Cuenta ec
            ON f.FacturaID = ec.FacturaID
        LEFT JOIN Matricula m
            ON f.FacturaID = m.FacturaID
        WHERE f.FacturaID = @id;
    `;

    const result = await pool
        .request()
        .input('id', sql.Int, id)
        .query(query);

    return result.recordset[0] || null;
};

module.exports = {
    obtenerFacturas,
    obtenerFacturaPorId
};