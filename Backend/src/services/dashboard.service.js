const { poolPromise } = require('../config/db');

const obtenerResumenDashboard = async () => {
    const pool = await poolPromise;

    const resumenQuery = `
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
                SELECT IFNULL(SUM(MontoPago), 0)
                FROM Pago
                WHERE EstadoPago IN ('Exitoso', 'Aplicado')
            ) AS MontoRecaudado,

            (
                SELECT COUNT(*)
                FROM Factura
                WHERE EstadoFactura IN ('Pendiente', 'Parcial')
            ) AS FacturasPendientes,

            (
                SELECT IFNULL(SUM(SaldoPendiente), 0)
                FROM Estado_Cuenta
                WHERE SaldoPendiente > 0
            ) AS SaldoPendienteTotal;
    `;

    const matriculasRecientesQuery = `
        SELECT
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
            p.Anio,

            f.FacturaID,
            f.NumeroFactura,
            IFNULL(f.Total, 0) AS Subtotal,
            0 AS Descuento,
            IFNULL(f.Total, 0) AS Total,
            f.EstadoFactura
        FROM Matricula m
        INNER JOIN Estudiante e
            ON m.EstudianteID = e.EstudianteID
        INNER JOIN Usuario u
            ON e.UsuarioID = u.UsuarioID
        INNER JOIN Periodo p
            ON m.PeriodoID = p.PeriodoID
        LEFT JOIN Factura f
            ON m.FacturaID = f.FacturaID
        ORDER BY m.FechaMatricula DESC, m.MatriculaID DESC
        LIMIT 5;
    `;

    const pagosRecientesQuery = `
        SELECT
            pg.PagoID,
            pg.FechaPago,
            pg.MontoPago,
            pg.MetodoPago,
            pg.EstadoPago,

            f.FacturaID,
            f.NumeroFactura,
            IFNULL(f.Total, 0) AS Subtotal,
            0 AS Descuento,
            IFNULL(f.Total, 0) AS TotalFactura,
            f.EstadoFactura,

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
        ORDER BY pg.FechaPago DESC, pg.PagoID DESC
        LIMIT 5;
    `;

    const periodosQuery = `
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

    const [resumenRows] = await pool.query(resumenQuery);
    const [matriculasRecientes] = await pool.query(matriculasRecientesQuery);
    const [pagosRecientes] = await pool.query(pagosRecientesQuery);
    const [periodos] = await pool.query(periodosQuery);

    return {
        resumen: resumenRows[0] || {},
        matriculasRecientes,
        pagosRecientes,
        periodos
    };
};

module.exports = {
    obtenerResumenDashboard
};