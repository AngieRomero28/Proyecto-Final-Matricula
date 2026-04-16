const { poolPromise } = require('../config/db');

const obtenerNotificaciones = async () => {
    const pool = await poolPromise;

    const matriculasQuery = `
        SELECT
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
        ORDER BY m.FechaMatricula DESC, m.MatriculaID DESC
        LIMIT 10;
    `;

    const pagosQuery = `
        SELECT
            'PAGO' AS TipoNotificacion,
            CONCAT('Pago #', pg.PagoID, ' registrado para ', u.NombreCompleto) AS Titulo,
            CONCAT(
                'Monto: ₡', FORMAT(pg.MontoPago, 2),
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
        ORDER BY pg.FechaPago DESC, pg.PagoID DESC
        LIMIT 10;
    `;

    const financierasQuery = `
        SELECT
            'FINANCIERA' AS TipoNotificacion,
            CONCAT('Estado de cuenta ', ec.EstadoCuenta, ' - ', u.NombreCompleto) AS Titulo,
            CONCAT(
                'Factura: ', IFNULL(f.NumeroFactura, 'N/D'),
                ' | Saldo pendiente: ₡', FORMAT(ec.SaldoPendiente, 2)
            ) AS Descripcion,
            ec.FechaActualizacion AS FechaEvento,
            ec.EstadoCuenta AS EstadoReferencia,
            ec.EstadoCuentaID AS ReferenciaID
        FROM Estado_Cuenta ec
        INNER JOIN Factura f
            ON ec.FacturaID = f.FacturaID
        INNER JOIN Estudiante e
            ON f.EstudianteID = e.EstudianteID
        INNER JOIN Usuario u
            ON e.UsuarioID = u.UsuarioID
        WHERE ec.EstadoCuenta IN ('Pendiente', 'Vencido')
        ORDER BY ec.FechaActualizacion DESC, ec.EstadoCuentaID DESC
        LIMIT 10;
    `;

    const auditoriaQuery = `
        SELECT
            'AUDITORIA' AS TipoNotificacion,
            CONCAT('Auditoría: ', a.Accion) AS Titulo,
            a.Descripcion AS Descripcion,
            a.Fecha AS FechaEvento,
            a.Accion AS EstadoReferencia,
            a.AuditoriaID AS ReferenciaID
        FROM Auditoria a
        ORDER BY a.Fecha DESC, a.AuditoriaID DESC
        LIMIT 10;
    `;

    const [matriculas] = await pool.query(matriculasQuery);
    const [pagos] = await pool.query(pagosQuery);
    const [financieras] = await pool.query(financierasQuery);
    const [auditoria] = await pool.query(auditoriaQuery);

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