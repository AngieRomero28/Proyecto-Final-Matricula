const { poolPromise } = require('../config/db');

const obtenerEstadosCuenta = async () => {
    const pool = await poolPromise;

    const query = `
        SELECT
            ec.EstadoCuentaID,
            ec.MontoTotal,
            ec.MontoPagado,
            ec.SaldoPendiente,
            ec.EstadoCuenta,
            ec.FechaActualizacion AS FechaGeneracion,
            ec.FechaActualizacion,

            f.FacturaID,
            f.NumeroFactura,
            f.FechaFactura AS FechaEmision,
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
            ON f.EstudianteID = e.EstudianteID
        INNER JOIN Usuario u
            ON e.UsuarioID = u.UsuarioID
        INNER JOIN Periodo p
            ON f.PeriodoID = p.PeriodoID
        LEFT JOIN Matricula m
            ON f.MatriculaID = m.MatriculaID
        ORDER BY ec.EstadoCuentaID DESC;
    `;

    const [rows] = await pool.query(query);
    return rows;
};

const obtenerEstadoCuentaPorId = async (id) => {
    const pool = await poolPromise;
    const estadoCuentaId = Number(id);

    if (Number.isNaN(estadoCuentaId) || estadoCuentaId <= 0) {
        return null;
    }

    const query = `
        SELECT
            ec.EstadoCuentaID,
            ec.MontoTotal,
            ec.MontoPagado,
            ec.SaldoPendiente,
            ec.EstadoCuenta,
            ec.FechaActualizacion AS FechaGeneracion,
            ec.FechaActualizacion,

            f.FacturaID,
            f.NumeroFactura,
            f.FechaFactura AS FechaEmision,
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
            ON f.EstudianteID = e.EstudianteID
        INNER JOIN Usuario u
            ON e.UsuarioID = u.UsuarioID
        INNER JOIN Periodo p
            ON f.PeriodoID = p.PeriodoID
        LEFT JOIN Matricula m
            ON f.MatriculaID = m.MatriculaID
        WHERE ec.EstadoCuentaID = ?;
    `;

    const [rows] = await pool.query(query, [estadoCuentaId]);
    return rows[0] || null;
};

module.exports = {
    obtenerEstadosCuenta,
    obtenerEstadoCuentaPorId
};