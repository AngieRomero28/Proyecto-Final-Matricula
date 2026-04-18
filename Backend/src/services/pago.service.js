const { poolPromise } = require('../config/db');
const { registrarAuditoria } = require('./auditoria.service');

const crearErrorValidacion = (mensaje, statusCode = 400) => {
    const error = new Error(mensaje);
    error.statusCode = statusCode;
    return error;
};

const obtenerPagos = async () => {
    const pool = await poolPromise;

    const query = `
        SELECT
            p.PagoID,
            p.FechaPago,
            p.MontoPago,
            p.MetodoPago,
            p.ReferenciaPago,
            p.EstadoPago,

            f.FacturaID,
            f.NumeroFactura,
            IFNULL(f.Total, 0) AS Subtotal,
            0 AS Descuento,
            IFNULL(f.Total, 0) AS TotalFactura,
            f.EstadoFactura,

            ec.EstadoCuentaID,
            ec.MontoTotal,
            ec.MontoPagado,
            ec.SaldoPendiente,
            ec.EstadoCuenta,

            m.MatriculaID,
            m.EstadoMatricula,
            m.ComprobanteMatricula,

            e.EstudianteID,
            e.Carnet,

            u.UsuarioID,
            u.NombreCompleto AS NombreEstudiante,
            u.Identificacion,
            u.CorreoInstitucional,

            pe.PeriodoID,
            pe.NombrePeriodo,
            pe.TipoPeriodo,
            pe.Anio
        FROM Pago p
        INNER JOIN Factura f
            ON p.FacturaID = f.FacturaID
        INNER JOIN Estudiante e
            ON p.EstudianteID = e.EstudianteID
        INNER JOIN Usuario u
            ON e.UsuarioID = u.UsuarioID
        INNER JOIN Periodo pe
            ON p.PeriodoID = pe.PeriodoID
        LEFT JOIN Estado_Cuenta ec
            ON f.FacturaID = ec.FacturaID
        LEFT JOIN Matricula m
            ON f.MatriculaID = m.MatriculaID
        ORDER BY p.PagoID DESC;
    `;

    const [rows] = await pool.query(query);
    return rows;
};

const obtenerPagoPorId = async (id) => {
    const pool = await poolPromise;
    const pagoId = Number(id);

    if (Number.isNaN(pagoId) || pagoId <= 0) {
        return null;
    }

    const query = `
        SELECT
            p.PagoID,
            p.FechaPago,
            p.MontoPago,
            p.MetodoPago,
            p.ReferenciaPago,
            p.EstadoPago,

            f.FacturaID,
            f.NumeroFactura,
            IFNULL(f.Total, 0) AS Subtotal,
            0 AS Descuento,
            IFNULL(f.Total, 0) AS TotalFactura,
            f.EstadoFactura,

            ec.EstadoCuentaID,
            ec.MontoTotal,
            ec.MontoPagado,
            ec.SaldoPendiente,
            ec.EstadoCuenta,

            m.MatriculaID,
            m.EstadoMatricula,
            m.ComprobanteMatricula,

            e.EstudianteID,
            e.Carnet,

            u.UsuarioID,
            u.NombreCompleto AS NombreEstudiante,
            u.Identificacion,
            u.CorreoInstitucional,

            pe.PeriodoID,
            pe.NombrePeriodo,
            pe.TipoPeriodo,
            pe.Anio
        FROM Pago p
        INNER JOIN Factura f
            ON p.FacturaID = f.FacturaID
        INNER JOIN Estudiante e
            ON p.EstudianteID = e.EstudianteID
        INNER JOIN Usuario u
            ON e.UsuarioID = u.UsuarioID
        INNER JOIN Periodo pe
            ON p.PeriodoID = pe.PeriodoID
        LEFT JOIN Estado_Cuenta ec
            ON f.FacturaID = ec.FacturaID
        LEFT JOIN Matricula m
            ON f.MatriculaID = m.MatriculaID
        WHERE p.PagoID = ?;
    `;

    const [rows] = await pool.query(query, [pagoId]);
    return rows[0] || null;
};

const registrarPago = async (data) => {
    const {
        facturaId,
        estudianteId,
        periodoId,
        montoPago,
        metodoPago,
        referenciaPago
    } = data || {};

    if (
        !facturaId ||
        !estudianteId ||
        !periodoId ||
        montoPago === undefined ||
        montoPago === null ||
        !metodoPago
    ) {
        throw crearErrorValidacion(
            'Debe enviar facturaId, estudianteId, periodoId, montoPago y metodoPago'
        );
    }

    const facturaIdNum = Number(facturaId);
    const estudianteIdNum = Number(estudianteId);
    const periodoIdNum = Number(periodoId);
    const monto = Number(montoPago);
    const metodoPagoTexto = String(metodoPago || '').trim();
    const referenciaPagoTexto = referenciaPago ? String(referenciaPago).trim() : null;

    if (
        Number.isNaN(facturaIdNum) || facturaIdNum <= 0 ||
        Number.isNaN(estudianteIdNum) || estudianteIdNum <= 0 ||
        Number.isNaN(periodoIdNum) || periodoIdNum <= 0
    ) {
        throw crearErrorValidacion('facturaId, estudianteId y periodoId deben ser numéricos');
    }

    if (Number.isNaN(monto) || monto <= 0) {
        throw crearErrorValidacion('El montoPago debe ser un número mayor que 0');
    }

    if (!metodoPagoTexto) {
        throw crearErrorValidacion('El metodoPago es obligatorio');
    }

    const pool = await poolPromise;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [estudianteRows] = await connection.query(
            `
                SELECT EstudianteID
                FROM Estudiante
                WHERE EstudianteID = ?
            `,
            [estudianteIdNum]
        );

        if (estudianteRows.length === 0) {
            throw crearErrorValidacion('El estudiante no existe', 404);
        }

        const [periodoRows] = await connection.query(
            `
                SELECT PeriodoID, EstadoPeriodo
                FROM Periodo
                WHERE PeriodoID = ?
            `,
            [periodoIdNum]
        );

        if (periodoRows.length === 0) {
            throw crearErrorValidacion('El periodo no existe', 404);
        }

        const [facturaRows] = await connection.query(
            `
                SELECT
                    f.FacturaID,
                    f.NumeroFactura,
                    f.Total,
                    f.EstadoFactura,
                    ec.EstadoCuentaID,
                    ec.MontoTotal,
                    ec.MontoPagado,
                    ec.SaldoPendiente,
                    ec.EstadoCuenta,
                    m.MatriculaID,
                    m.EstudianteID,
                    m.PeriodoID,
                    m.EstadoMatricula
                FROM Factura f
                LEFT JOIN Estado_Cuenta ec
                    ON f.FacturaID = ec.FacturaID
                LEFT JOIN Matricula m
                    ON f.MatriculaID = m.MatriculaID
                WHERE f.FacturaID = ?
                FOR UPDATE
            `,
            [facturaIdNum]
        );

        if (facturaRows.length === 0) {
            throw crearErrorValidacion('La factura no existe', 404);
        }

        const factura = facturaRows[0];

        if (
            !factura.MatriculaID ||
            Number(factura.EstudianteID) !== estudianteIdNum ||
            Number(factura.PeriodoID) !== periodoIdNum
        ) {
            throw crearErrorValidacion(
                'La factura no existe o no pertenece al estudiante y periodo indicado',
                404
            );
        }

        if (!factura.EstadoCuentaID) {
            throw crearErrorValidacion('La factura no tiene un estado de cuenta asociado');
        }

        if (factura.EstadoFactura === 'Pagada') {
            throw crearErrorValidacion('La factura ya se encuentra pagada');
        }

        if (factura.SaldoPendiente === null || factura.SaldoPendiente === undefined) {
            throw crearErrorValidacion('No se pudo determinar el saldo pendiente de la factura');
        }

        if (Number(factura.SaldoPendiente) <= 0) {
            throw crearErrorValidacion('La factura no tiene saldo pendiente');
        }

        if (monto > Number(factura.SaldoPendiente)) {
            throw crearErrorValidacion(
                `El monto del pago excede el saldo pendiente actual (${Number(factura.SaldoPendiente).toFixed(2)})`
            );
        }

        const [insertPagoResult] = await connection.query(
            `
                INSERT INTO Pago (
                    FacturaID,
                    EstudianteID,
                    PeriodoID,
                    MontoPago,
                    MetodoPago,
                    ReferenciaPago,
                    EstadoPago
                )
                VALUES (?, ?, ?, ?, ?, ?, 'Exitoso')
            `,
            [
                facturaIdNum,
                estudianteIdNum,
                periodoIdNum,
                monto,
                metodoPagoTexto,
                referenciaPagoTexto
            ]
        );

        const pagoId = insertPagoResult.insertId;

        if (!pagoId) {
            throw new Error('No se pudo obtener el ID del pago registrado');
        }

        const nuevoMontoPagado = Number(factura.MontoPagado || 0) + monto;
        const nuevoSaldoPendiente = Number(factura.SaldoPendiente || 0) - monto;

        let nuevoEstadoCuenta = 'Pendiente';
        let nuevoEstadoFactura = 'Pendiente';
        let nuevoEstadoMatricula = factura.EstadoMatricula || 'Pendiente';

        if (nuevoSaldoPendiente <= 0) {
            nuevoEstadoCuenta = 'Pagado';
            nuevoEstadoFactura = 'Pagada';
            nuevoEstadoMatricula = 'Confirmada';
        } else if (nuevoMontoPagado > 0) {
            nuevoEstadoCuenta = 'Pendiente';
            nuevoEstadoFactura = 'Parcial';
            nuevoEstadoMatricula = factura.EstadoMatricula || 'Pendiente';
        }

        await connection.query(
            `
                UPDATE Estado_Cuenta
                SET
                    MontoPagado = ?,
                    SaldoPendiente = ?,
                    EstadoCuenta = ?,
                    FechaActualizacion = CURRENT_TIMESTAMP
                WHERE EstadoCuentaID = ?
            `,
            [
                nuevoMontoPagado,
                nuevoSaldoPendiente < 0 ? 0 : nuevoSaldoPendiente,
                nuevoEstadoCuenta,
                factura.EstadoCuentaID
            ]
        );

        await connection.query(
            `
                UPDATE Factura
                SET EstadoFactura = ?
                WHERE FacturaID = ?
            `,
            [nuevoEstadoFactura, facturaIdNum]
        );

        if (factura.MatriculaID) {
            await connection.query(
                `
                    UPDATE Matricula
                    SET EstadoMatricula = ?
                    WHERE MatriculaID = ?
                `,
                [nuevoEstadoMatricula, factura.MatriculaID]
            );
        }

        try {
            await registrarAuditoria({
                usuario: `Estudiante ${estudianteIdNum}`,
                accion: 'REGISTRAR_PAGO',
                descripcion: `Se registró el pago ${pagoId} para la factura ${facturaIdNum} del periodo ${periodoIdNum} por un monto de ${monto.toFixed(2)} mediante ${metodoPagoTexto}.`,
                transaction: connection
            });
        } catch (auditError) {
            console.warn('No se pudo registrar auditoría:', auditError.message);
        }

        await connection.commit();

        const pagoRegistrado = await obtenerPagoPorId(pagoId);

        return pagoRegistrado || {
            pagoId,
            facturaId: facturaIdNum,
            estudianteId: estudianteIdNum,
            periodoId: periodoIdNum,
            montoPago: monto,
            metodoPago: metodoPagoTexto,
            referenciaPago: referenciaPagoTexto,
            estadoPago: 'Exitoso'
        };
    } catch (error) {
        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error('Error al hacer rollback en registrarPago:', rollbackError.message);
        }
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    obtenerPagos,
    obtenerPagoPorId,
    registrarPago
};