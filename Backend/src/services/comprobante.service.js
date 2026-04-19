// backend/src/services/comprobante.service.js

const { poolPromise } = require('../config/db');

const obtenerComprobantes = async () => {
    const pool = await poolPromise;

    const query = `
        SELECT
            m.MatriculaID,
            m.FechaMatricula,
            m.CreditosTotales,
            m.CostoTotal,
            m.EstadoMatricula,
            CONCAT('CMP-', m.MatriculaID) AS ComprobanteMatricula,

            e.EstudianteID,
            e.Carnet,
            e.EstadoAcademico,

            u.UsuarioID,
            CONCAT_WS(' ', u.Nombre, u.Apellido1, u.Apellido2) AS NombreEstudiante,
            u.CorreoInstitucional,

            p.PeriodoID,
            p.NombrePeriodo,
            p.TipoPeriodo,
            p.Anio,

            f.FacturaID,
            f.NumeroFactura,
            IFNULL(f.Total, 0) AS Subtotal,
            0 AS Descuento,
            IFNULL(f.Total, 0) AS Total,
            f.EstadoFactura,

            ec.EstadoCuentaID,
            IFNULL(ec.MontoTotal, IFNULL(f.Total, 0)) AS MontoTotal,
            IFNULL(ec.MontoPagado, 0) AS MontoPagado,
            IFNULL(ec.SaldoPendiente, 0) AS SaldoPendiente,
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
            ON f.FacturaID = ec.FacturaID
        WHERE m.EstadoMatricula NOT IN ('Cancelada', 'Anulada')
        ORDER BY m.MatriculaID DESC;
    `;

    const [rows] = await pool.query(query);
    return rows;
};

const obtenerComprobantePorMatriculaId = async (matriculaId) => {
    const pool = await poolPromise;
    const matriculaIdNum = Number(matriculaId);

    if (Number.isNaN(matriculaIdNum) || matriculaIdNum <= 0) {
        return null;
    }

    const query = `
        SELECT
            m.MatriculaID,
            m.FechaMatricula,
            m.CreditosTotales,
            m.CostoTotal,
            m.EstadoMatricula,
            CONCAT('CMP-', m.MatriculaID) AS ComprobanteMatricula,

            e.EstudianteID,
            e.Carnet,
            e.EstadoAcademico,

            u.UsuarioID,
            CONCAT_WS(' ', u.Nombre, u.Apellido1, u.Apellido2) AS NombreEstudiante,
            u.CorreoInstitucional,

            p.PeriodoID,
            p.NombrePeriodo,
            p.TipoPeriodo,
            p.Anio,

            f.FacturaID,
            f.NumeroFactura,
            IFNULL(f.Total, 0) AS Subtotal,
            0 AS Descuento,
            IFNULL(f.Total, 0) AS Total,
            f.EstadoFactura,

            ec.EstadoCuentaID,
            IFNULL(ec.MontoTotal, IFNULL(f.Total, 0)) AS MontoTotal,
            IFNULL(ec.MontoPagado, 0) AS MontoPagado,
            IFNULL(ec.SaldoPendiente, 0) AS SaldoPendiente,
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
            ON f.FacturaID = ec.FacturaID
        WHERE m.MatriculaID = ?;
    `;

    const [rows] = await pool.query(query, [matriculaIdNum]);

    if (!rows.length) {
        return null;
    }

    const encabezado = rows[0];

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
        WHERE ms.MatriculaID = ?
        ORDER BY s.SeccionID, h.DiaSemana, h.HoraInicio;
    `;

    const [detalle] = await pool.query(detalleQuery, [matriculaIdNum]);

    return {
        encabezado,
        detalle
    };
};

module.exports = {
    obtenerComprobantes,
    obtenerComprobantePorMatriculaId
};