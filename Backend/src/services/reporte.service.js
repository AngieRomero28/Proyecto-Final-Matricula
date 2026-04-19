// backend/src/services/reporte.service.js

const { poolPromise } = require('../config/db');

const obtenerResumenReportes = async () => {
    const pool = await poolPromise;

    const resumenQuery = `
        SELECT
            (SELECT COUNT(*) FROM Estudiante) AS TotalEstudiantes,
            (SELECT COUNT(*) FROM Curso) AS TotalCursos,
            (SELECT COUNT(*) FROM Periodo) AS TotalPeriodos,
            (SELECT COUNT(*) FROM Seccion) AS TotalSecciones,
            (SELECT COUNT(*) FROM Matricula) AS TotalMatriculas,
            (SELECT COUNT(*) FROM Pago) AS TotalPagos,
            (SELECT COUNT(*) FROM Factura) AS TotalFacturas,
            (
                SELECT IFNULL(SUM(MontoPago), 0)
                FROM Pago
                WHERE EstadoPago IN ('Aplicado', 'Exitoso')
            ) AS TotalRecaudado,
            (
                SELECT IFNULL(SUM(SaldoPendiente), 0)
                FROM Estado_Cuenta
                WHERE SaldoPendiente > 0
            ) AS SaldoPendienteTotal;
    `;

    const matriculasPorPeriodoQuery = `
        SELECT
            p.PeriodoID,
            p.NombrePeriodo,
            p.TipoPeriodo,
            p.Anio,
            COUNT(m.MatriculaID) AS TotalMatriculas,
            IFNULL(SUM(m.CreditosTotales), 0) AS TotalCreditos,
            IFNULL(SUM(m.CostoTotal), 0) AS TotalCostoMatricula
        FROM Periodo p
        LEFT JOIN Matricula m
            ON p.PeriodoID = m.PeriodoID
        GROUP BY
            p.PeriodoID,
            p.NombrePeriodo,
            p.TipoPeriodo,
            p.Anio
        ORDER BY p.Anio DESC, p.PeriodoID DESC;
    `;

    const pagosPorPeriodoQuery = `
        SELECT
            p.PeriodoID,
            p.NombrePeriodo,
            p.TipoPeriodo,
            p.Anio,
            COUNT(pg.PagoID) AS TotalPagos,
            IFNULL(SUM(pg.MontoPago), 0) AS MontoPagado
        FROM Periodo p
        LEFT JOIN Pago pg
            ON p.PeriodoID = pg.PeriodoID
           AND pg.EstadoPago IN ('Aplicado', 'Exitoso')
        GROUP BY
            p.PeriodoID,
            p.NombrePeriodo,
            p.TipoPeriodo,
            p.Anio
        ORDER BY p.Anio DESC, p.PeriodoID DESC;
    `;

    const cursosMasMatriculadosQuery = `
        SELECT
            c.CursoID,
            c.CodigoCurso,
            c.NombreCurso,
            COUNT(ms.MatriculaID) AS TotalInscripciones
        FROM Curso c
        LEFT JOIN Seccion s
            ON c.CursoID = s.CursoID
        LEFT JOIN Matricula_Seccion ms
            ON s.SeccionID = ms.SeccionID
           AND (
                ms.EstadoDetalle IS NULL
                OR ms.EstadoDetalle IN ('Activa', 'Activo')
           )
        GROUP BY
            c.CursoID,
            c.CodigoCurso,
            c.NombreCurso
        ORDER BY TotalInscripciones DESC, c.NombreCurso ASC
        LIMIT 10;
    `;

    const estadosCuentaResumenQuery = `
        SELECT
            COUNT(*) AS TotalEstadosCuenta,
            SUM(CASE WHEN EstadoCuenta = 'Pendiente' THEN 1 ELSE 0 END) AS Pendientes,
            SUM(CASE WHEN EstadoCuenta = 'Pagado' THEN 1 ELSE 0 END) AS Pagados,
            SUM(CASE WHEN EstadoCuenta = 'Vencido' THEN 1 ELSE 0 END) AS Vencidos
        FROM Estado_Cuenta;
    `;

    const historialCostosQuery = `
        SELECT
            TipoPeriodo,
            Anio,
            CostoCredito,
            CostoMatriculaBase,
            FechaInicioVigencia,
            FechaFinVigencia,
            EstadoCosto
        FROM Costo_Matricula
        ORDER BY Anio DESC, TipoPeriodo ASC, FechaInicioVigencia DESC;
    `;

    const estudiantesMorososQuery = `
        SELECT
            e.EstudianteID,
            e.Carnet,
            CONCAT_WS(' ', u.Nombre, u.Apellido1, u.Apellido2) AS NombreCompleto,
            u.CorreoInstitucional,

            f.FacturaID,
            f.NumeroFactura,
            IFNULL(f.Total, 0) AS Subtotal,
            0 AS Descuento,
            IFNULL(f.Total, 0) AS Total,
            f.EstadoFactura,

            p.PeriodoID,
            p.NombrePeriodo,
            p.TipoPeriodo,
            p.Anio,

            ec.EstadoCuentaID,
            COALESCE(ec.MontoTotal, f.Total, 0) AS MontoTotal,
            IFNULL(ec.MontoPagado, 0) AS MontoPagado,
            IFNULL(ec.SaldoPendiente, 0) AS SaldoPendiente,
            IFNULL(ec.EstadoCuenta, 'N/D') AS EstadoCuenta
        FROM Estado_Cuenta ec
        INNER JOIN Factura f
            ON ec.FacturaID = f.FacturaID
        INNER JOIN Estudiante e
            ON f.EstudianteID = e.EstudianteID
        INNER JOIN Usuario u
            ON e.UsuarioID = u.UsuarioID
        INNER JOIN Periodo p
            ON f.PeriodoID = p.PeriodoID
        WHERE ec.SaldoPendiente > 0
        ORDER BY ec.SaldoPendiente DESC, NombreCompleto ASC;
    `;

    const [resumenRows] = await pool.query(resumenQuery);
    const [matriculasPorPeriodo] = await pool.query(matriculasPorPeriodoQuery);
    const [pagosPorPeriodo] = await pool.query(pagosPorPeriodoQuery);
    const [cursosMasMatriculados] = await pool.query(cursosMasMatriculadosQuery);
    const [estadosCuentaRows] = await pool.query(estadosCuentaResumenQuery);
    const [historialCostos] = await pool.query(historialCostosQuery);
    const [estudiantesMorosos] = await pool.query(estudiantesMorososQuery);

    return {
        resumen: resumenRows[0] || {},
        matriculasPorPeriodo,
        pagosPorPeriodo,
        cursosMasMatriculados,
        estadosCuentaResumen: estadosCuentaRows[0] || {},
        historialCostos,
        estudiantesMorosos
    };
};

module.exports = {
    obtenerResumenReportes
};