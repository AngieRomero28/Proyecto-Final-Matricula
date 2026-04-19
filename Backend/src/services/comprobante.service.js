const { poolPromise } = require('../config/db');

const obtenerComprobantes = async () => {
    const pool = await poolPromise;

    const query = `
        SELECT
            m.MatriculaID,
            m.FechaMatricula,
            m.CostoTotal,

            -- GENERAMOS EL COMPROBANTE
            CONCAT('CMP-', m.MatriculaID) AS ComprobanteMatricula,

            u.NombreCompleto AS NombreEstudiante,
            u.CorreoInstitucional,

            f.FacturaID,
            f.NumeroFactura,
            IFNULL(f.Total, 0) AS Total,

            ec.MontoTotal,
            ec.MontoPagado,
            ec.SaldoPendiente

        FROM Matricula m
        INNER JOIN Estudiante e
            ON m.EstudianteID = e.EstudianteID
        INNER JOIN Usuario u
            ON e.UsuarioID = u.UsuarioID
        LEFT JOIN Factura f
            ON m.FacturaID = f.FacturaID
        LEFT JOIN Estado_Cuenta ec
            ON f.FacturaID = ec.FacturaID

        --SOLO MATRÍCULAS VÁLIDAS
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
            m.CostoTotal,

            CONCAT('CMP-', m.MatriculaID) AS ComprobanteMatricula,

            u.NombreCompleto AS NombreEstudiante,
            u.CorreoInstitucional,

            f.NumeroFactura,
            IFNULL(f.Total, 0) AS Total

        FROM Matricula m
        INNER JOIN Estudiante e
            ON m.EstudianteID = e.EstudianteID
        INNER JOIN Usuario u
            ON e.UsuarioID = u.UsuarioID
        LEFT JOIN Factura f
            ON m.FacturaID = f.FacturaID

        WHERE m.MatriculaID = ?;
    `;

    const [rows] = await pool.query(query, [matriculaIdNum]);

    if (!rows.length) return null;

    const encabezado = rows[0];

    const detalleQuery = `
        SELECT
            s.SeccionID,
            s.NumeroSeccion,

            c.CodigoCurso,
            c.NombreCurso,
            c.Creditos,

            h.DiaSemana,
            h.HoraInicio,
            h.HoraFin

        FROM Matricula_Seccion ms
        INNER JOIN Seccion s
            ON ms.SeccionID = s.SeccionID
        INNER JOIN Curso c
            ON s.CursoID = c.CursoID
        LEFT JOIN Seccion_Horario sh
            ON s.SeccionID = sh.SeccionID
        LEFT JOIN Horario h
            ON sh.HorarioID = h.HorarioID

        WHERE ms.MatriculaID = ?
        ORDER BY s.SeccionID;
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