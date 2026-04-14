const { poolPromise } = require('../config/db');

const obtenerNotificaciones = async () => {
    const pool = await poolPromise;

    const query = `
        SET NOCOUNT ON;

        -- 1. Matrículas recientes como notificaciones
        SELECT TOP 10
            'MATRICULA' AS TipoNotificacion,
            CONCAT('Matrícula #', m.MatriculaID, ' registrada para ', u.NombreCompleto) AS Titulo,
            CONCAT(
                'Período: ', p.NombrePeriodo,
                CASE WHEN p.TipoPeriodo IS NOT NULL THEN CONCAT(' - ', p.TipoPeriodo) ELSE '' END,
                CASE WHEN p.Anio IS NOT NULL THEN CONCAT(' (', p.Anio, ')') ELSE '' END
            ) AS Descripcion,
            m.FechaMatricula AS FechaEvento,
            m.EstadoMatricula AS EstadoReferencia,
            m.MatriculaID AS ReferenciaID
        FROM Matricula m
        INNER JOIN Estudiante e
            ON m.EstudianteID = e.EstudianteID
        INNER JOIN Usuario u
            ON e.UsuarioID = u.UsuarioID
        INNER JOIN Periodo p
            ON m.PeriodoID = p.PeriodoID
        ORDER BY m.FechaMatricula DESC, m.MatriculaID DESC;

        -- 2. Pagos recientes como notificaciones
        SELECT TOP 10
            'PAGO' AS TipoNotificacion,
            CONCAT('Pago #', pg.PagoID, ' registrado para ', u.NombreCompleto) AS Titulo,
            CONCAT(
                'Monto: ₡', CONVERT(VARCHAR(50), CAST(pg.MontoPago AS DECIMAL(18,2))),
                ' | Método: ', pg.MetodoPago
            ) AS Descripcion,
            pg.FechaPago AS FechaEvento,
            pg.EstadoPago AS EstadoReferencia,
            pg.PagoID AS ReferenciaID
        FROM Pago pg
        INNER JOIN Estudiante e
            ON pg.EstudianteID = e.EstudianteID
        INNER JOIN Usuario u
            ON e.UsuarioID = u.UsuarioID
        ORDER BY pg.FechaPago DESC, pg.PagoID DESC;

        -- 3. Estados de cuenta pendientes/vencidos
        SELECT TOP 10
            'FINANCIERA' AS TipoNotificacion,
            CONCAT('Estado de cuenta ', ec.EstadoCuenta, ' - ', u.NombreCompleto) AS Titulo,
            CONCAT(
                'Factura: ', ISNULL(f.NumeroFactura, 'N/D'),
                ' | Saldo pendiente: ₡', CONVERT(VARCHAR(50), CAST(ec.SaldoPendiente AS DECIMAL(18,2)))
            ) AS Descripcion,
            ISNULL(ec.FechaActualizacion, ec.FechaGeneracion) AS FechaEvento,
            ec.EstadoCuenta AS EstadoReferencia,
            ec.EstadoCuentaID AS ReferenciaID
        FROM Estado_Cuenta ec
        INNER JOIN Estudiante e
            ON ec.EstudianteID = e.EstudianteID
        INNER JOIN Usuario u
            ON e.UsuarioID = u.UsuarioID
        LEFT JOIN Factura f
            ON ec.FacturaID = f.FacturaID
        WHERE ec.EstadoCuenta IN ('Pendiente', 'Vencido')
        ORDER BY ISNULL(ec.FechaActualizacion, ec.FechaGeneracion) DESC, ec.EstadoCuentaID DESC;

        -- 4. Auditoría reciente
        SELECT TOP 10
            'AUDITORIA' AS TipoNotificacion,
            CONCAT('Auditoría: ', a.Accion) AS Titulo,
            a.Descripcion AS Descripcion,
            a.Fecha AS FechaEvento,
            a.Accion AS EstadoReferencia,
            a.AuditoriaID AS ReferenciaID
        FROM Auditoria a
        ORDER BY a.Fecha DESC, a.AuditoriaID DESC;
    `;

    const result = await pool.request().query(query);

    const matriculas = result.recordsets?.[0] || [];
    const pagos = result.recordsets?.[1] || [];
    const financieras = result.recordsets?.[2] || [];
    const auditoria = result.recordsets?.[3] || [];

    const todas = [...matriculas, ...pagos, ...financieras, ...auditoria]
        .map((item) => ({
            ...item,
            FechaEvento: item.FechaEvento ? new Date(item.FechaEvento) : null
        }))
        .sort((a, b) => {
            const fechaA = a.FechaEvento ? a.FechaEvento.getTime() : 0;
            const fechaB = b.FechaEvento ? b.FechaEvento.getTime() : 0;
            return fechaB - fechaA;
        })
        .slice(0, 30);

    const resumen = {
        Total: todas.length,
        Matriculas: todas.filter((x) => x.TipoNotificacion === 'MATRICULA').length,
        Pagos: todas.filter((x) => x.TipoNotificacion === 'PAGO').length,
        Financieras: todas.filter((x) => x.TipoNotificacion === 'FINANCIERA').length,
        Auditoria: todas.filter((x) => x.TipoNotificacion === 'AUDITORIA').length
    };

    return {
        resumen,
        notificaciones: todas
    };
};

module.exports = {
    obtenerNotificaciones
};