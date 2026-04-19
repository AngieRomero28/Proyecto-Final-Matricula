// backend/src/services/factura.service.js

const { poolPromise } = require('../config/db');

const obtenerFacturas = async () => {
    const pool = await poolPromise;

    const query = `
        SELECT
            f.FacturaID,
            f.NumeroFactura,
            f.FechaFactura AS FechaEmision,
            IFNULL(f.Total, 0) AS Subtotal,
            0 AS Descuento,
            IFNULL(f.Total, 0) AS Total,
            f.EstadoFactura,

            e.EstudianteID,
            e.Carnet,

            u.UsuarioID,
            CONCAT_WS(' ', u.Nombre, u.Apellido1, u.Apellido2) AS NombreEstudiante,
            u.CorreoInstitucional,

            p.PeriodoID,
            p.NombrePeriodo,
            p.TipoPeriodo,
            p.Anio,

            ec.EstadoCuentaID,
            COALESCE(ec.MontoTotal, f.Total, 0) AS MontoTotal,
            IFNULL(ec.MontoPagado, 0) AS MontoPagado,
            IFNULL(ec.SaldoPendiente, 0) AS SaldoPendiente,
            IFNULL(ec.EstadoCuenta, 'N/D') AS EstadoCuenta,

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
            ON f.MatriculaID = m.MatriculaID
        ORDER BY f.FacturaID DESC;
    `;

    const [rows] = await pool.query(query);
    return rows;
};

const obtenerFacturaPorId = async (id) => {
    const pool = await poolPromise;
    const facturaId = Number(id);

    if (Number.isNaN(facturaId) || facturaId <= 0) {
        return null;
    }

    const query = `
        SELECT
            f.FacturaID,
            f.NumeroFactura,
            f.FechaFactura AS FechaEmision,
            IFNULL(f.Total, 0) AS Subtotal,
            0 AS Descuento,
            IFNULL(f.Total, 0) AS Total,
            f.EstadoFactura,

            e.EstudianteID,
            e.Carnet,

            u.UsuarioID,
            CONCAT_WS(' ', u.Nombre, u.Apellido1, u.Apellido2) AS NombreEstudiante,
            u.CorreoInstitucional,

            p.PeriodoID,
            p.NombrePeriodo,
            p.TipoPeriodo,
            p.Anio,

            ec.EstadoCuentaID,
            COALESCE(ec.MontoTotal, f.Total, 0) AS MontoTotal,
            IFNULL(ec.MontoPagado, 0) AS MontoPagado,
            IFNULL(ec.SaldoPendiente, 0) AS SaldoPendiente,
            IFNULL(ec.EstadoCuenta, 'N/D') AS EstadoCuenta,

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
            ON f.MatriculaID = m.MatriculaID
        WHERE f.FacturaID = ?;
    `;

    const [rows] = await pool.query(query, [facturaId]);
    return rows[0] || null;
};

module.exports = {
    obtenerFacturas,
    obtenerFacturaPorId
};