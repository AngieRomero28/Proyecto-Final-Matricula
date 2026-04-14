const { poolPromise } = require('../config/db');

const obtenerResumenReportes = async () => {
    const pool = await poolPromise;

    const query = `
        SET NOCOUNT ON;

        -- 1. Resumen general
        SELECT
            (SELECT COUNT(*) FROM Estudiante) AS TotalEstudiantes,
            (SELECT COUNT(*) FROM Curso) AS TotalCursos,
            (SELECT COUNT(*) FROM Periodo) AS TotalPeriodos,
            (SELECT COUNT(*) FROM Seccion) AS TotalSecciones,
            (SELECT COUNT(*) FROM Matricula) AS TotalMatriculas,
            (SELECT COUNT(*) FROM Pago) AS TotalPagos,
            (SELECT COUNT(*) FROM Factura) AS TotalFacturas,
            (SELECT ISNULL(SUM(MontoPago), 0) FROM Pago WHERE EstadoPago = 'Aplicado') AS TotalRecaudado,
            (SELECT ISNULL(SUM(SaldoPendiente), 0) FROM Estado_Cuenta) AS SaldoPendienteTotal;

        -- 2. Matrículas por período
        SELECT
            p.PeriodoID,
            p.NombrePeriodo,
            p.TipoPeriodo,
            p.Anio,
            COUNT(m.MatriculaID) AS TotalMatriculas,
            ISNULL(SUM(m.CreditosTotales), 0) AS TotalCreditos,
            ISNULL(SUM(m.CostoTotal), 0) AS TotalCostoMatricula
        FROM Periodo p
        LEFT JOIN Matricula m
            ON p.PeriodoID = m.PeriodoID
        GROUP BY
            p.PeriodoID,
            p.NombrePeriodo,
            p.TipoPeriodo,
            p.Anio
        ORDER BY p.Anio DESC, p.PeriodoID DESC;

        -- 3. Pagos por período
        SELECT
            p.PeriodoID,
            p.NombrePeriodo,
            p.TipoPeriodo,
            p.Anio,
            COUNT(pg.PagoID) AS TotalPagos,
            ISNULL(SUM(pg.MontoPago), 0) AS MontoPagado
        FROM Periodo p
        LEFT JOIN Pago pg
            ON p.PeriodoID = pg.PeriodoID
           AND pg.EstadoPago = 'Aplicado'
        GROUP BY
            p.PeriodoID,
            p.NombrePeriodo,
            p.TipoPeriodo,
            p.Anio
        ORDER BY p.Anio DESC, p.PeriodoID DESC;

        -- 4. Cursos con más matrícula
        SELECT TOP 10
            c.CursoID,
            c.CodigoCurso,
            c.NombreCurso,
            COUNT(ms.MatriculaID) AS TotalInscripciones
        FROM Curso c
        LEFT JOIN Seccion s
            ON c.CursoID = s.CursoID
        LEFT JOIN Matricula_Seccion ms
            ON s.SeccionID = ms.SeccionID
           AND ms.EstadoDetalle = 'Activa'
        GROUP BY
            c.CursoID,
            c.CodigoCurso,
            c.NombreCurso
        ORDER BY TotalInscripciones DESC, c.NombreCurso ASC;

        -- 5. Estados de cuenta
        SELECT
            COUNT(*) AS TotalEstadosCuenta,
            SUM(CASE WHEN EstadoCuenta = 'Pendiente' THEN 1 ELSE 0 END) AS Pendientes,
            SUM(CASE WHEN EstadoCuenta = 'Pagado' THEN 1 ELSE 0 END) AS Pagados,
            SUM(CASE WHEN EstadoCuenta = 'Vencido' THEN 1 ELSE 0 END) AS Vencidos
        FROM Estado_Cuenta;
    `;

    const result = await pool.request().query(query);

    return {
        resumen: result.recordsets?.[0]?.[0] || {},
        matriculasPorPeriodo: result.recordsets?.[1] || [],
        pagosPorPeriodo: result.recordsets?.[2] || [],
        cursosMasMatriculados: result.recordsets?.[3] || [],
        estadosCuentaResumen: result.recordsets?.[4]?.[0] || {}
    };
};

module.exports = {
    obtenerResumenReportes
};