const { poolPromise } = require('../config/db');

const obtenerResumenDashboard = async () => {
    const pool = await poolPromise;

    const query = `
        SET NOCOUNT ON;

        -- 1. Resumen general
        SELECT
            (SELECT COUNT(*) FROM Estudiante) AS TotalEstudiantes,
            (SELECT COUNT(*) FROM Estudiante WHERE EstadoAcademico = 'Activo') AS EstudiantesActivos,

            (SELECT COUNT(*) FROM Curso) AS TotalCursos,
            (SELECT COUNT(*) FROM Curso WHERE EstadoCurso = 'Activo') AS CursosActivos,

            (SELECT COUNT(*) FROM Periodo) AS TotalPeriodos,
            (SELECT COUNT(*) FROM Periodo WHERE EstadoPeriodo = 'Activo') AS PeriodosActivos,

            (SELECT COUNT(*) FROM Seccion) AS TotalSecciones,
            (SELECT COUNT(*) FROM Seccion WHERE EstadoSeccion = 'Activa') AS SeccionesActivas,

            (SELECT COUNT(*) FROM Matricula) AS TotalMatriculas,
            (SELECT COUNT(*) FROM Matricula WHERE EstadoMatricula = 'Pendiente') AS MatriculasPendientes,
            (SELECT COUNT(*) FROM Matricula WHERE EstadoMatricula = 'Confirmada') AS MatriculasConfirmadas,

            (SELECT COUNT(*) FROM Pago) AS TotalPagos,
            (
                SELECT ISNULL(SUM(MontoPago), 0)
                FROM Pago
                WHERE EstadoPago IN ('Exitoso', 'Aplicado')
            ) AS MontoRecaudado,

            (
                SELECT COUNT(*)
                FROM Factura
                WHERE EstadoFactura = 'Pendiente'
            ) AS FacturasPendientes,

            (
                SELECT ISNULL(SUM(SaldoPendiente), 0)
                FROM Estado_Cuenta
                WHERE SaldoPendiente > 0
            ) AS SaldoPendienteTotal;

        -- 2. Matrículas recientes
        SELECT TOP 5
            m.MatriculaID,
            m.FechaMatricula,
            m.CreditosTotales,
            m.CostoTotal,
            m.EstadoMatricula,

            e.EstudianteID,
            e.Carnet,

            u.NombreCompleto AS NombreEstudiante,

            p.PeriodoID,
            p.NombrePeriodo,
            p.TipoPeriodo,
            p.Anio
        FROM Matricula m
        INNER JOIN Estudiante e
            ON m.EstudianteID = e.EstudianteID
        INNER JOIN Usuario u
            ON e.UsuarioID = u.UsuarioID
        INNER JOIN Periodo p
            ON m.PeriodoID = p.PeriodoID
        ORDER BY m.FechaMatricula DESC, m.MatriculaID DESC;

        -- 3. Pagos recientes
        SELECT TOP 5
            pg.PagoID,
            pg.FechaPago,
            pg.MontoPago,
            pg.MetodoPago,
            pg.EstadoPago,

            f.FacturaID,
            f.NumeroFactura,

            e.EstudianteID,
            e.Carnet,

            u.NombreCompleto AS NombreEstudiante,

            p.PeriodoID,
            p.NombrePeriodo,
            p.TipoPeriodo,
            p.Anio
        FROM Pago pg
        INNER JOIN Factura f
            ON pg.FacturaID = f.FacturaID
        INNER JOIN Estudiante e
            ON pg.EstudianteID = e.EstudianteID
        INNER JOIN Usuario u
            ON e.UsuarioID = u.UsuarioID
        INNER JOIN Periodo p
            ON pg.PeriodoID = p.PeriodoID
        ORDER BY pg.FechaPago DESC, pg.PagoID DESC;

        -- 4. Períodos
        SELECT
            PeriodoID,
            NombrePeriodo,
            TipoPeriodo,
            Anio,
            FechaInicio,
            FechaFin,
            FechaInicioMatricula,
            FechaFinMatricula,
            EstadoPeriodo
        FROM Periodo
        ORDER BY Anio DESC, PeriodoID DESC;
    `;

    const result = await pool.request().query(query);

    return {
        resumen: result.recordsets?.[0]?.[0] || {},
        matriculasRecientes: result.recordsets?.[1] || [],
        pagosRecientes: result.recordsets?.[2] || [],
        periodos: result.recordsets?.[3] || []
    };
};

module.exports = {
    obtenerResumenDashboard
};