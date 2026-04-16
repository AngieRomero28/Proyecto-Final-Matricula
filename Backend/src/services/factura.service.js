const { poolPromise } = require('../config/db');

const obtenerFacturas = async () => {
    const pool = await poolPromise;

    const query = `
        SELECT
            f.FacturaID,
            f.NumeroFactura,
            f.FechaFactura AS FechaEmision,
            0.00 AS Subtotal,
            0.00 AS Descuento,
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
            NULL AS ComprobanteMatricula
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
            ON f.MatriculaID = m.MatriculaID
        ORDER BY f.FacturaID DESC;
    `;

    const [rows] = await pool.query(query);
    return rows;
};

const obtenerFacturaPorId = async (id) => {
    const pool = await poolPromise;

    const query = `
        SELECT
            f.FacturaID,
            f.NumeroFactura,
            f.FechaFactura AS FechaEmision,
            0.00 AS Subtotal,
            0.00 AS Descuento,
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
            NULL AS ComprobanteMatricula
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
            ON f.MatriculaID = m.MatriculaID
        WHERE f.FacturaID = ?;
    `;

    const [rows] = await pool.query(query, [id]);
    return rows[0] || null;
};

module.exports = {
    obtenerFacturas,
    obtenerFacturaPorId
};