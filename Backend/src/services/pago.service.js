const { poolPromise, sql } = require('../config/db');

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
            f.Subtotal,
            f.Descuento,
            f.Total AS TotalFactura,
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
            ON f.FacturaID = m.FacturaID
        ORDER BY p.PagoID;
    `;

    const result = await pool.request().query(query);
    return result.recordset;
};

const obtenerPagoPorId = async (id) => {
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
            f.Subtotal,
            f.Descuento,
            f.Total AS TotalFactura,
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
            ON f.FacturaID = m.FacturaID
        WHERE p.PagoID = @id
        ORDER BY p.PagoID;
    `;

    const result = await pool
        .request()
        .input('id', sql.Int, id)
        .query(query);

    return result.recordset[0] || null;
};

const registrarPago = async (data) => {
    const {
        facturaId,
        estudianteId,
        periodoId,
        montoPago,
        metodoPago,
        referenciaPago
    } = data;

    if (!facturaId || !estudianteId || !periodoId || montoPago === undefined || montoPago === null || !metodoPago) {
        throw crearErrorValidacion(
            'Debe enviar facturaId, estudianteId, periodoId, montoPago y metodoPago'
        );
    }

    if (
        isNaN(Number(facturaId)) ||
        isNaN(Number(estudianteId)) ||
        isNaN(Number(periodoId))
    ) {
        throw crearErrorValidacion('facturaId, estudianteId y periodoId deben ser numéricos');
    }

    const facturaIdNum = Number(facturaId);
    const estudianteIdNum = Number(estudianteId);
    const periodoIdNum = Number(periodoId);
    const monto = Number(montoPago);
    const metodoPagoTexto = String(metodoPago).trim();
    const referenciaPagoTexto = referenciaPago ? String(referenciaPago).trim() : null;

    if (isNaN(monto) || monto <= 0) {
        throw crearErrorValidacion('El montoPago debe ser un número mayor que 0');
    }

    if (metodoPagoTexto === '') {
        throw crearErrorValidacion('El metodoPago es obligatorio');
    }

    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // Validar estudiante
        const estudianteResult = await new sql.Request(transaction)
            .input('estudianteId', sql.Int, estudianteIdNum)
            .query(`
                SELECT EstudianteID
                FROM Estudiante
                WHERE EstudianteID = @estudianteId
            `);

        if (estudianteResult.recordset.length === 0) {
            throw crearErrorValidacion('El estudiante no existe', 404);
        }

        // Validar periodo
        const periodoResult = await new sql.Request(transaction)
            .input('periodoId', sql.Int, periodoIdNum)
            .query(`
                SELECT PeriodoID, EstadoPeriodo
                FROM Periodo
                WHERE PeriodoID = @periodoId
            `);

        if (periodoResult.recordset.length === 0) {
            throw crearErrorValidacion('El periodo no existe', 404);
        }

        // Validar factura y que pertenezca al estudiante/periodo correcto
        const facturaResult = await new sql.Request(transaction)
            .input('facturaId', sql.Int, facturaIdNum)
            .input('estudianteId', sql.Int, estudianteIdNum)
            .input('periodoId', sql.Int, periodoIdNum)
            .query(`
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
                    m.EstadoMatricula,
                    m.ComprobanteMatricula
                FROM Factura f
                LEFT JOIN Estado_Cuenta ec
                    ON f.FacturaID = ec.FacturaID
                LEFT JOIN Matricula m
                    ON f.FacturaID = m.FacturaID
                WHERE f.FacturaID = @facturaId
                  AND EXISTS (
                      SELECT 1
                      FROM Matricula mx
                      WHERE mx.FacturaID = f.FacturaID
                        AND mx.EstudianteID = @estudianteId
                        AND mx.PeriodoID = @periodoId
                  )
            `);

        if (facturaResult.recordset.length === 0) {
            throw crearErrorValidacion(
                'La factura no existe o no pertenece al estudiante y periodo indicado',
                404
            );
        }

        const factura = facturaResult.recordset[0];

        if (factura.EstadoFactura === 'Pagada') {
            throw crearErrorValidacion('La factura ya se encuentra pagada');
        }

        if (factura.SaldoPendiente !== null && Number(factura.SaldoPendiente) <= 0) {
            throw crearErrorValidacion('La factura no tiene saldo pendiente');
        }

        if (factura.SaldoPendiente !== null && monto > Number(factura.SaldoPendiente)) {
            throw crearErrorValidacion(
                `El monto del pago excede el saldo pendiente actual (${Number(factura.SaldoPendiente).toFixed(2)})`
            );
        }

        // Insertar pago
        const insertPagoResult = await new sql.Request(transaction)
            .input('facturaId', sql.Int, facturaIdNum)
            .input('estudianteId', sql.Int, estudianteIdNum)
            .input('periodoId', sql.Int, periodoIdNum)
            .input('montoPago', sql.Decimal(12, 2), monto)
            .input('metodoPago', sql.NVarChar(50), metodoPagoTexto)
            .input('referenciaPago', sql.NVarChar(100), referenciaPagoTexto)
            .query(`
                DECLARE @NuevoPago TABLE (PagoID INT);

                INSERT INTO Pago (
                    FacturaID,
                    EstudianteID,
                    PeriodoID,
                    FechaPago,
                    MontoPago,
                    MetodoPago,
                    ReferenciaPago,
                    EstadoPago
                )
                OUTPUT INSERTED.PagoID INTO @NuevoPago(PagoID)
                VALUES (
                    @facturaId,
                    @estudianteId,
                    @periodoId,
                    SYSDATETIME(),
                    @montoPago,
                    @metodoPago,
                    @referenciaPago,
                    'Exitoso'
                );

                SELECT PagoID FROM @NuevoPago;
            `);

        const pagoId = insertPagoResult.recordset[0]?.PagoID;

        if (!pagoId) {
            throw new Error('No se pudo obtener el ID del pago registrado');
        }

        // Releer estado actualizado por trigger
        const estadoActualizadoResult = await new sql.Request(transaction)
            .input('facturaId', sql.Int, facturaIdNum)
            .query(`
                SELECT
                    f.FacturaID,
                    f.NumeroFactura,
                    f.EstadoFactura,
                    ec.EstadoCuentaID,
                    ec.MontoPagado,
                    ec.SaldoPendiente,
                    ec.EstadoCuenta,
                    m.MatriculaID,
                    m.EstadoMatricula,
                    m.ComprobanteMatricula,
                    p.Anio
                FROM Factura f
                LEFT JOIN Estado_Cuenta ec
                    ON f.FacturaID = ec.FacturaID
                LEFT JOIN Matricula m
                    ON f.FacturaID = m.FacturaID
                LEFT JOIN Periodo p
                    ON m.PeriodoID = p.PeriodoID
                WHERE f.FacturaID = @facturaId
            `);

        const estadoActualizado = estadoActualizadoResult.recordset[0];

        // Si quedó totalmente pagada, confirmar matrícula
        if (
            estadoActualizado &&
            estadoActualizado.MatriculaID &&
            Number(estadoActualizado.SaldoPendiente) === 0 &&
            estadoActualizado.EstadoFactura === 'Pagada'
        ) {
            const comprobanteMatricula =
                estadoActualizado.ComprobanteMatricula ||
                `COMP-${estadoActualizado.MatriculaID}-${estadoActualizado.Anio || new Date().getFullYear()}`;

            await new sql.Request(transaction)
                .input('matriculaId', sql.Int, estadoActualizado.MatriculaID)
                .input('comprobanteMatricula', sql.NVarChar(255), comprobanteMatricula)
                .query(`
                    UPDATE Matricula
                    SET EstadoMatricula = 'Confirmada',
                        ComprobanteMatricula = @comprobanteMatricula
                    WHERE MatriculaID = @matriculaId
                `);
        }

        await transaction.commit();

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
        if (transaction._aborted !== true) {
            await transaction.rollback();
        }
        throw error;
    }
};

module.exports = {
    obtenerPagos,
    obtenerPagoPorId,
    registrarPago
};