const { poolPromise, sql } = require('../config/db');
const { registrarAuditoria } = require('./auditoria.service');

const crearErrorValidacion = (mensaje, statusCode = 400) => {
    const error = new Error(mensaje);
    error.statusCode = statusCode;
    return error;
};

const hayChoque = (horarioA, horarioB) => {
    if (horarioA.DiaSemana !== horarioB.DiaSemana) {
        return false;
    }

    const inicioA = String(horarioA.HoraInicio);
    const finA = String(horarioA.HoraFin);
    const inicioB = String(horarioB.HoraInicio);
    const finB = String(horarioB.HoraFin);

    return inicioA < finB && inicioB < finA;
};

const obtenerMatriculas = async () => {
    const pool = await poolPromise;

    const query = `
        SELECT
            m.MatriculaID,
            m.FechaMatricula,
            m.CreditosTotales,
            m.CostoTotal,
            m.EstadoMatricula,
            m.ComprobanteMatricula,

            e.EstudianteID,
            e.Carnet,
            e.EstadoAcademico,

            u.UsuarioID,
            u.NombreCompleto AS NombreEstudiante,
            u.Identificacion,
            u.CorreoInstitucional,

            p.PeriodoID,
            p.NombrePeriodo,
            p.TipoPeriodo,
            p.Anio,

            f.FacturaID,
            f.NumeroFactura,
            f.Subtotal,
            f.Descuento,
            f.Total,
            f.EstadoFactura,

            ec.EstadoCuentaID,
            ec.MontoTotal,
            ec.MontoPagado,
            ec.SaldoPendiente,
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
            ON m.EstadoCuentaID = ec.EstadoCuentaID
        ORDER BY m.MatriculaID DESC;
    `;

    const result = await pool.request().query(query);
    return result.recordset;
};

const obtenerMatriculaPorId = async (id) => {
    const pool = await poolPromise;

    const query = `
        SELECT
            m.MatriculaID,
            m.FechaMatricula,
            m.CreditosTotales,
            m.CostoTotal,
            m.EstadoMatricula,
            m.ComprobanteMatricula,

            e.EstudianteID,
            e.Carnet,
            e.EstadoAcademico,

            u.UsuarioID,
            u.NombreCompleto AS NombreEstudiante,
            u.Identificacion,
            u.CorreoInstitucional,

            p.PeriodoID,
            p.NombrePeriodo,
            p.TipoPeriodo,
            p.Anio,

            f.FacturaID,
            f.NumeroFactura,
            f.Subtotal,
            f.Descuento,
            f.Total,
            f.EstadoFactura,

            ec.EstadoCuentaID,
            ec.MontoTotal,
            ec.MontoPagado,
            ec.SaldoPendiente,
            ec.EstadoCuenta,

            s.SeccionID,
            s.NumeroSeccion,
            s.CupoMaximo,
            s.CupoDisponible,
            s.EstadoSeccion,

            c.CursoID,
            c.CodigoCurso,
            c.NombreCurso,
            c.Creditos

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
            ON m.EstadoCuentaID = ec.EstadoCuentaID
        LEFT JOIN Matricula_Seccion ms
            ON m.MatriculaID = ms.MatriculaID
        LEFT JOIN Seccion s
            ON ms.SeccionID = s.SeccionID
        LEFT JOIN Curso c
            ON s.CursoID = c.CursoID
        WHERE m.MatriculaID = @id
        ORDER BY m.MatriculaID, s.SeccionID;
    `;

    const result = await pool
        .request()
        .input('id', sql.Int, id)
        .query(query);

    return result.recordset;
};

const crearMatricula = async (data) => {
    const { estudianteId, periodoId, secciones } = data;

    if (!estudianteId || !periodoId || !Array.isArray(secciones) || secciones.length === 0) {
        throw crearErrorValidacion('Debe enviar estudianteId, periodoId y al menos una sección');
    }

    const estudianteIdNum = Number(estudianteId);
    const periodoIdNum = Number(periodoId);
    const seccionesNormalizadas = secciones.map(Number);
    const seccionesUnicas = [...new Set(seccionesNormalizadas)];

    if (Number.isNaN(estudianteIdNum) || Number.isNaN(periodoIdNum)) {
        throw crearErrorValidacion('estudianteId y periodoId deben ser numéricos');
    }

    if (seccionesNormalizadas.some((sec) => Number.isNaN(sec))) {
        throw crearErrorValidacion('Todas las secciones deben ser numéricas');
    }

    if (seccionesUnicas.length !== secciones.length) {
        throw crearErrorValidacion('No se pueden enviar secciones repetidas');
    }

    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    let transactionIniciada = false;

    try {
        await transaction.begin();
        transactionIniciada = true;

        const estudianteResult = await new sql.Request(transaction)
            .input('id', sql.Int, estudianteIdNum)
            .query(`
                SELECT EstudianteID, EstadoAcademico
                FROM Estudiante
                WHERE EstudianteID = @id
            `);

        if (estudianteResult.recordset.length === 0) {
            throw crearErrorValidacion('El estudiante no existe', 404);
        }

        const periodoResult = await new sql.Request(transaction)
            .input('id', sql.Int, periodoIdNum)
            .query(`
                SELECT
                    PeriodoID,
                    NombrePeriodo,
                    TipoPeriodo,
                    Anio,
                    EstadoPeriodo,
                    FechaInicioMatricula,
                    FechaFinMatricula
                FROM Periodo
                WHERE PeriodoID = @id
            `);

        if (periodoResult.recordset.length === 0) {
            throw crearErrorValidacion('El periodo no existe', 404);
        }

        const periodo = periodoResult.recordset[0];

        if (periodo.FechaInicioMatricula && periodo.FechaFinMatricula) {
            const ahora = new Date();
            const fechaInicioMatricula = new Date(periodo.FechaInicioMatricula);
            const fechaFinMatricula = new Date(periodo.FechaFinMatricula);

            if (ahora < fechaInicioMatricula || ahora > fechaFinMatricula) {
                throw crearErrorValidacion('La matrícula no está habilitada para este periodo');
            }
        }

        const bloqueoResult = await new sql.Request(transaction)
            .input('estudianteId', sql.Int, estudianteIdNum)
            .query(`
                SELECT TOP 1 BloqueoID, TipoBloqueo, Motivo
                FROM Bloqueo
                WHERE EstudianteID = @estudianteId
                  AND EstadoBloqueo = 'Activo'
            `);

        if (bloqueoResult.recordset.length > 0) {
            const bloqueo = bloqueoResult.recordset[0];
            throw crearErrorValidacion(
                `El estudiante tiene un bloqueo ${String(bloqueo.TipoBloqueo).toLowerCase()} activo: ${bloqueo.Motivo}`
            );
        }

        const restriccionResult = await new sql.Request(transaction)
            .input('estudianteId', sql.Int, estudianteIdNum)
            .query(`
                SELECT TOP 1 RestriccionFinancieraID, MontoPendiente
                FROM Restriccion_Financiera
                WHERE EstudianteID = @estudianteId
                  AND EstadoRestriccion = 'Activa'
                  AND MontoPendiente > 0
            `);

        if (restriccionResult.recordset.length > 0) {
            throw crearErrorValidacion('El estudiante tiene una restricción financiera activa');
        }

        let creditosTotalesNuevos = 0;
        const cursosNuevos = [];
        const horariosNuevos = [];

        for (const secId of seccionesUnicas) {
            const seccionResult = await new sql.Request(transaction)
                .input('id', sql.Int, secId)
                .query(`
                    SELECT
                        s.SeccionID,
                        s.PeriodoID,
                        s.CupoDisponible,
                        s.NumeroSeccion,
                        s.EstadoSeccion,
                        c.CursoID,
                        c.CodigoCurso,
                        c.NombreCurso,
                        c.Creditos
                    FROM Seccion s WITH (UPDLOCK, ROWLOCK)
                    INNER JOIN Curso c
                        ON s.CursoID = c.CursoID
                    WHERE s.SeccionID = @id
                `);

            if (seccionResult.recordset.length === 0) {
                throw crearErrorValidacion(`La sección ${secId} no existe`);
            }

            const seccion = seccionResult.recordset[0];

            if (Number(seccion.PeriodoID) !== periodoIdNum) {
                throw crearErrorValidacion(`La sección ${secId} no pertenece al periodo indicado`);
            }

            if (seccion.EstadoSeccion && seccion.EstadoSeccion !== 'Activa') {
                throw crearErrorValidacion(`La sección ${secId} no se encuentra activa`);
            }

            if (Number(seccion.CupoDisponible) <= 0) {
                throw crearErrorValidacion(`La sección ${secId} no tiene cupo disponible`);
            }

            creditosTotalesNuevos += Number(seccion.Creditos || 0);

            cursosNuevos.push({
                SeccionID: seccion.SeccionID,
                CursoID: seccion.CursoID,
                CodigoCurso: seccion.CodigoCurso,
                NombreCurso: seccion.NombreCurso,
                Creditos: Number(seccion.Creditos || 0)
            });

            const horariosResult = await new sql.Request(transaction)
                .input('seccionId', sql.Int, secId)
                .query(`
                    SELECT
                        sh.SeccionID,
                        h.HorarioID,
                        h.DiaSemana,
                        h.HoraInicio,
                        h.HoraFin
                    FROM Seccion_Horario sh
                    INNER JOIN Horario h
                        ON sh.HorarioID = h.HorarioID
                    WHERE sh.SeccionID = @seccionId
                `);

            for (const horario of horariosResult.recordset) {
                horariosNuevos.push(horario);
            }
        }

        for (let i = 0; i < horariosNuevos.length; i++) {
            for (let j = i + 1; j < horariosNuevos.length; j++) {
                const a = horariosNuevos[i];
                const b = horariosNuevos[j];

                if (a.SeccionID !== b.SeccionID && hayChoque(a, b)) {
                    throw crearErrorValidacion(
                        `Existe choque de horario entre las secciones ${a.SeccionID} y ${b.SeccionID}`
                    );
                }
            }
        }

        const seccionesActualesResult = await new sql.Request(transaction)
            .input('estudianteId', sql.Int, estudianteIdNum)
            .input('periodoId', sql.Int, periodoIdNum)
            .query(`
                SELECT
                    s.SeccionID,
                    s.CursoID,
                    c.CodigoCurso,
                    c.NombreCurso
                FROM Matricula m
                INNER JOIN Matricula_Seccion ms
                    ON m.MatriculaID = ms.MatriculaID
                INNER JOIN Seccion s
                    ON ms.SeccionID = s.SeccionID
                INNER JOIN Curso c
                    ON s.CursoID = c.CursoID
                WHERE m.EstudianteID = @estudianteId
                  AND m.PeriodoID = @periodoId
                  AND m.EstadoMatricula <> 'Anulada'
                  AND ms.EstadoDetalle = 'Activa'
            `);

        const cursosActuales = seccionesActualesResult.recordset;

        for (const cursoNuevo of cursosNuevos) {
            const yaMatriculado = cursosActuales.find(
                (cursoActual) => Number(cursoActual.CursoID) === Number(cursoNuevo.CursoID)
            );

            if (yaMatriculado) {
                throw crearErrorValidacion(
                    `El estudiante ya tiene matriculado el curso ${cursoNuevo.NombreCurso} en este periodo`
                );
            }
        }

        const horariosActualesResult = await new sql.Request(transaction)
            .input('estudianteId', sql.Int, estudianteIdNum)
            .input('periodoId', sql.Int, periodoIdNum)
            .query(`
                SELECT
                    s.SeccionID,
                    h.HorarioID,
                    h.DiaSemana,
                    h.HoraInicio,
                    h.HoraFin
                FROM Matricula m
                INNER JOIN Matricula_Seccion ms
                    ON m.MatriculaID = ms.MatriculaID
                INNER JOIN Seccion s
                    ON ms.SeccionID = s.SeccionID
                INNER JOIN Seccion_Horario sh
                    ON s.SeccionID = sh.SeccionID
                INNER JOIN Horario h
                    ON sh.HorarioID = h.HorarioID
                WHERE m.EstudianteID = @estudianteId
                  AND m.PeriodoID = @periodoId
                  AND m.EstadoMatricula <> 'Anulada'
                  AND ms.EstadoDetalle = 'Activa'
            `);

        const horariosActuales = horariosActualesResult.recordset;

        for (const horarioNuevo of horariosNuevos) {
            for (const horarioActual of horariosActuales) {
                if (hayChoque(horarioNuevo, horarioActual)) {
                    throw crearErrorValidacion(
                        `Existe choque de horario entre la nueva sección ${horarioNuevo.SeccionID} y la sección ya matriculada ${horarioActual.SeccionID}`
                    );
                }
            }
        }

        for (const cursoNuevo of cursosNuevos) {
            const prerrequisitosResult = await new sql.Request(transaction)
                .input('cursoId', sql.Int, cursoNuevo.CursoID)
                .input('estudianteId', sql.Int, estudianteIdNum)
                .query(`
                    SELECT
                        pr.CursoPrerrequisitoID,
                        c.NombreCurso AS NombrePrerrequisito,
                        ha.EstadoCurso
                    FROM Prerrequisito pr
                    INNER JOIN Curso c
                        ON pr.CursoPrerrequisitoID = c.CursoID
                    LEFT JOIN Historial_Academico ha
                        ON ha.CursoID = pr.CursoPrerrequisitoID
                       AND ha.EstudianteID = @estudianteId
                       AND ha.EstadoCurso = 'Aprobado'
                    WHERE pr.CursoID = @cursoId
                `);

            for (const prer of prerrequisitosResult.recordset) {
                if (!prer.EstadoCurso) {
                    throw crearErrorValidacion(
                        `El estudiante no cumple el prerrequisito ${prer.NombrePrerrequisito} para el curso ${cursoNuevo.NombreCurso}`
                    );
                }
            }
        }

        const limiteResult = await new sql.Request(transaction)
            .input('periodoId', sql.Int, periodoIdNum)
            .query(`
                SELECT CreditosMinimos, CreditosMaximos
                FROM Limite_Creditos
                WHERE PeriodoID = @periodoId
            `);

        if (limiteResult.recordset.length > 0) {
            const limite = limiteResult.recordset[0];

            const creditosActualesResult = await new sql.Request(transaction)
                .input('estudianteId', sql.Int, estudianteIdNum)
                .input('periodoId', sql.Int, periodoIdNum)
                .query(`
                    SELECT ISNULL(SUM(m.CreditosTotales), 0) AS CreditosActuales
                    FROM Matricula m
                    WHERE m.EstudianteID = @estudianteId
                      AND m.PeriodoID = @periodoId
                      AND m.EstadoMatricula <> 'Anulada'
                `);

            const creditosActuales = Number(creditosActualesResult.recordset[0].CreditosActuales);
            const totalConNuevos = creditosActuales + creditosTotalesNuevos;

            if (
                limite.CreditosMaximos !== null &&
                totalConNuevos > Number(limite.CreditosMaximos)
            ) {
                throw crearErrorValidacion(
                    `El estudiante supera el límite de créditos del periodo. Máximo permitido: ${limite.CreditosMaximos}`
                );
            }
        }

        const costoResult = await new sql.Request(transaction)
            .input('periodoId', sql.Int, periodoIdNum)
            .query(`
                SELECT CostoCredito, CostoMatriculaBase
                FROM Costo_Matricula
                WHERE PeriodoID = @periodoId
            `);

        if (costoResult.recordset.length === 0) {
            throw crearErrorValidacion('No existe configuración de costos para el periodo indicado');
        }

        const costo = costoResult.recordset[0];
        const costoCredito = Number(costo.CostoCredito);
        const costoMatriculaBase = Number(costo.CostoMatriculaBase);
        const costoTotal = (costoCredito * creditosTotalesNuevos) + costoMatriculaBase;

        const insertMatriculaResult = await new sql.Request(transaction)
            .input('estudianteId', sql.Int, estudianteIdNum)
            .input('periodoId', sql.Int, periodoIdNum)
            .input('creditos', sql.Int, creditosTotalesNuevos)
            .input('costoTotal', sql.Decimal(12, 2), costoTotal)
            .query(`
                DECLARE @NuevaMatricula TABLE (MatriculaID INT);

                INSERT INTO Matricula (
                    EstudianteID,
                    PeriodoID,
                    FechaMatricula,
                    CreditosTotales,
                    CostoTotal,
                    EstadoMatricula
                )
                OUTPUT INSERTED.MatriculaID INTO @NuevaMatricula(MatriculaID)
                VALUES (
                    @estudianteId,
                    @periodoId,
                    SYSDATETIME(),
                    @creditos,
                    @costoTotal,
                    'Pendiente'
                );

                SELECT MatriculaID FROM @NuevaMatricula;
            `);

        const matriculaId = insertMatriculaResult.recordset[0]?.MatriculaID;

        if (!matriculaId) {
            throw new Error('No se pudo obtener el ID de la matrícula creada');
        }

        for (const secId of seccionesUnicas) {
            await new sql.Request(transaction)
                .input('matriculaId', sql.Int, matriculaId)
                .input('seccionId', sql.Int, secId)
                .query(`
                    INSERT INTO Matricula_Seccion (MatriculaID, SeccionID, EstadoDetalle)
                    VALUES (@matriculaId, @seccionId, 'Activa')
                `);

            const updateCupoResult = await new sql.Request(transaction)
                .input('seccionId', sql.Int, secId)
                .query(`
                    UPDATE Seccion
                    SET CupoDisponible = CupoDisponible - 1
                    WHERE SeccionID = @seccionId
                      AND CupoDisponible > 0
                `);

            if (updateCupoResult.rowsAffected[0] === 0) {
                throw crearErrorValidacion(`No fue posible reservar cupo en la sección ${secId}`);
            }
        }

        const correlativoResult = await new sql.Request(transaction)
            .input('anio', sql.Int, Number(periodo.Anio))
            .query(`
                SELECT ISNULL(MAX(CAST(RIGHT(NumeroFactura, 4) AS INT)), 0) AS UltimoCorrelativo
                FROM Factura
                WHERE NumeroFactura LIKE 'FAC-' + CAST(@anio AS VARCHAR(4)) + '-%'
            `);

        const ultimoCorrelativo = Number(correlativoResult.recordset[0].UltimoCorrelativo);
        const nuevoCorrelativo = ultimoCorrelativo + 1;
        const numeroFactura = `FAC-${periodo.Anio}-${String(nuevoCorrelativo).padStart(4, '0')}`;

        const insertFacturaResult = await new sql.Request(transaction)
            .input('estudianteId', sql.Int, estudianteIdNum)
            .input('periodoId', sql.Int, periodoIdNum)
            .input('numeroFactura', sql.NVarChar(50), numeroFactura)
            .input('subtotal', sql.Decimal(12, 2), costoTotal)
            .input('descuento', sql.Decimal(12, 2), 0)
            .input('total', sql.Decimal(12, 2), costoTotal)
            .query(`
                DECLARE @NuevaFactura TABLE (FacturaID INT);

                INSERT INTO Factura (
                    EstudianteID,
                    PeriodoID,
                    NumeroFactura,
                    FechaEmision,
                    Subtotal,
                    Descuento,
                    Total,
                    EstadoFactura
                )
                OUTPUT INSERTED.FacturaID INTO @NuevaFactura(FacturaID)
                VALUES (
                    @estudianteId,
                    @periodoId,
                    @numeroFactura,
                    SYSDATETIME(),
                    @subtotal,
                    @descuento,
                    @total,
                    'Pendiente'
                );

                SELECT FacturaID FROM @NuevaFactura;
            `);

        const facturaId = insertFacturaResult.recordset[0]?.FacturaID;

        if (!facturaId) {
            throw new Error('No se pudo obtener el ID de la factura creada');
        }

        const insertEstadoCuentaResult = await new sql.Request(transaction)
            .input('estudianteId', sql.Int, estudianteIdNum)
            .input('periodoId', sql.Int, periodoIdNum)
            .input('facturaId', sql.Int, facturaId)
            .input('montoTotal', sql.Decimal(12, 2), costoTotal)
            .input('montoPagado', sql.Decimal(12, 2), 0)
            .input('saldoPendiente', sql.Decimal(12, 2), costoTotal)
            .query(`
                DECLARE @NuevoEstadoCuenta TABLE (EstadoCuentaID INT);

                INSERT INTO Estado_Cuenta (
                    EstudianteID,
                    PeriodoID,
                    FacturaID,
                    MontoTotal,
                    MontoPagado,
                    SaldoPendiente,
                    EstadoCuenta,
                    FechaGeneracion,
                    FechaActualizacion
                )
                OUTPUT INSERTED.EstadoCuentaID INTO @NuevoEstadoCuenta(EstadoCuentaID)
                VALUES (
                    @estudianteId,
                    @periodoId,
                    @facturaId,
                    @montoTotal,
                    @montoPagado,
                    @saldoPendiente,
                    'Pendiente',
                    SYSDATETIME(),
                    SYSDATETIME()
                );

                SELECT EstadoCuentaID FROM @NuevoEstadoCuenta;
            `);

        const estadoCuentaId = insertEstadoCuentaResult.recordset[0]?.EstadoCuentaID;

        if (!estadoCuentaId) {
            throw new Error('No se pudo obtener el ID del estado de cuenta creado');
        }

        await new sql.Request(transaction)
            .input('matriculaId', sql.Int, matriculaId)
            .input('facturaId', sql.Int, facturaId)
            .input('estadoCuentaId', sql.Int, estadoCuentaId)
            .query(`
                UPDATE Matricula
                SET FacturaID = @facturaId,
                    EstadoCuentaID = @estadoCuentaId
                WHERE MatriculaID = @matriculaId
            `);

        await registrarAuditoria({
            usuario: `Estudiante ${estudianteIdNum}`,
            accion: 'CREAR_MATRICULA',
            descripcion: `Se creó la matrícula ${matriculaId} para el estudiante ${estudianteIdNum} en el periodo ${periodoIdNum} con ${seccionesUnicas.length} sección(es). Factura generada: ${numeroFactura}.`,
            transaction
        });

        await transaction.commit();
        transactionIniciada = false;

        return {
            matriculaId,
            facturaId,
            estadoCuentaId,
            numeroFactura,
            creditosTotales: creditosTotalesNuevos,
            costoTotal,
            estadoMatricula: 'Pendiente',
            estadoFactura: 'Pendiente',
            estadoCuenta: 'Pendiente'
        };
    } catch (error) {
        if (transactionIniciada) {
            await transaction.rollback();
        }
        throw error;
    }
};

module.exports = {
    obtenerMatriculas,
    obtenerMatriculaPorId,
    crearMatricula
};