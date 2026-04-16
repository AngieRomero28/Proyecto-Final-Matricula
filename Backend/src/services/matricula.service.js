const { poolPromise } = require('../config/db');
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
            NULL AS ComprobanteMatricula,

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
            0.00 AS Subtotal,
            0.00 AS Descuento,
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
            ON f.FacturaID = ec.FacturaID
        ORDER BY m.MatriculaID DESC;
    `;

    const [rows] = await pool.query(query);
    return rows;
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
            NULL AS ComprobanteMatricula,

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
            0.00 AS Subtotal,
            0.00 AS Descuento,
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
            ON f.FacturaID = ec.FacturaID
        LEFT JOIN Matricula_Seccion ms
            ON m.MatriculaID = ms.MatriculaID
        LEFT JOIN Seccion s
            ON ms.SeccionID = s.SeccionID
        LEFT JOIN Curso c
            ON s.CursoID = c.CursoID
        WHERE m.MatriculaID = ?
        ORDER BY m.MatriculaID, s.SeccionID;
    `;

    const [rows] = await pool.query(query, [id]);
    return rows;
};

const obtenerMatriculasPorEstudiante = async (estudianteId) => {
    const pool = await poolPromise;

    const query = `
        SELECT
            m.MatriculaID,
            m.FechaMatricula,
            m.CreditosTotales,
            m.CostoTotal,
            m.EstadoMatricula,

            p.PeriodoID,
            p.NombrePeriodo,
            p.TipoPeriodo,
            p.Anio,

            f.FacturaID,
            f.NumeroFactura,
            f.Total,
            f.EstadoFactura,

            ec.EstadoCuentaID,
            ec.MontoPagado,
            ec.SaldoPendiente,
            ec.EstadoCuenta
        FROM Matricula m
        INNER JOIN Periodo p
            ON m.PeriodoID = p.PeriodoID
        LEFT JOIN Factura f
            ON m.FacturaID = f.FacturaID
        LEFT JOIN Estado_Cuenta ec
            ON f.FacturaID = ec.FacturaID
        WHERE m.EstudianteID = ?
        ORDER BY p.Anio DESC, m.MatriculaID DESC;
    `;

    const [rows] = await pool.query(query, [estudianteId]);
    return rows;
};

const obtenerOfertaMatriculablePorEstudiante = async (estudianteId, periodoId) => {
    const estudianteIdNum = Number(estudianteId);
    const periodoIdNum = Number(periodoId);

    if (Number.isNaN(estudianteIdNum) || Number.isNaN(periodoIdNum)) {
        throw crearErrorValidacion('estudianteId y periodoId deben ser numéricos');
    }

    const pool = await poolPromise;

    const [estudianteRows] = await pool.query(
        `
            SELECT
                e.EstudianteID,
                e.EstadoAcademico,
                e.ProgramaAcademicoID
            FROM Estudiante e
            WHERE e.EstudianteID = ?
        `,
        [estudianteIdNum]
    );

    if (!estudianteRows.length) {
        throw crearErrorValidacion('El estudiante no existe', 404);
    }

    const [periodoRows] = await pool.query(
        `
            SELECT
                PeriodoID,
                NombrePeriodo,
                TipoPeriodo,
                Anio,
                EstadoPeriodo,
                FechaInicioMatricula,
                FechaFinMatricula
            FROM Periodo
            WHERE PeriodoID = ?
        `,
        [periodoIdNum]
    );

    if (!periodoRows.length) {
        throw crearErrorValidacion('El periodo no existe', 404);
    }

    const [aprobadosRows] = await pool.query(
        `
            SELECT DISTINCT ha.CursoID
            FROM Historial_Academico ha
            WHERE ha.EstudianteID = ?
              AND ha.EstadoCurso = 'Aprobado'
        `,
        [estudianteIdNum]
    );

    const cursosAprobados = new Set(aprobadosRows.map((row) => Number(row.CursoID)));

    const [matriculadosRows] = await pool.query(
        `
            SELECT DISTINCT s.CursoID
            FROM Matricula m
            INNER JOIN Matricula_Seccion ms
                ON m.MatriculaID = ms.MatriculaID
            INNER JOIN Seccion s
                ON ms.SeccionID = s.SeccionID
            WHERE m.EstudianteID = ?
              AND m.PeriodoID = ?
              AND m.EstadoMatricula NOT IN ('Cancelada', 'Anulada')
              AND ms.EstadoDetalle = 'Activa'
        `,
        [estudianteIdNum, periodoIdNum]
    );

    const cursosMatriculados = new Set(matriculadosRows.map((row) => Number(row.CursoID)));

    const [ofertaRows] = await pool.query(
        `
            SELECT
                s.SeccionID,
                s.NumeroSeccion,
                s.CupoMaximo,
                s.CupoDisponible,
                s.EstadoSeccion,

                c.CursoID,
                c.CodigoCurso,
                c.NombreCurso,
                c.Creditos,
                c.Descripcion,
                c.EstadoCurso,

                p.PeriodoID,
                p.NombrePeriodo,
                p.TipoPeriodo,
                p.Anio,

                d.DocenteID,
                u.NombreCompleto AS NombreDocente,

                h.HorarioID,
                h.DiaSemana,
                h.HoraInicio,
                h.HoraFin,

                a.AulaID,
                a.CodigoAula,
                a.NombreAula,
                a.Ubicacion
            FROM Seccion s
            INNER JOIN Curso c
                ON s.CursoID = c.CursoID
            INNER JOIN Periodo p
                ON s.PeriodoID = p.PeriodoID
            LEFT JOIN Docente d
                ON s.DocenteID = d.DocenteID
            LEFT JOIN Usuario u
                ON d.UsuarioID = u.UsuarioID
            LEFT JOIN Seccion_Horario sh
                ON s.SeccionID = sh.SeccionID
            LEFT JOIN Horario h
                ON sh.HorarioID = h.HorarioID
            LEFT JOIN Aula a
                ON sh.AulaID = a.AulaID
            WHERE s.PeriodoID = ?
              AND s.EstadoSeccion = 'Activa'
              AND c.EstadoCurso = 'Activo'
              AND s.CupoDisponible > 0
            ORDER BY c.NombreCurso, s.SeccionID, h.DiaSemana, h.HoraInicio
        `,
        [periodoIdNum]
    );

    const seccionesMap = new Map();

    for (const row of ofertaRows) {
        if (cursosAprobados.has(Number(row.CursoID))) {
            continue;
        }

        if (cursosMatriculados.has(Number(row.CursoID))) {
            continue;
        }

        if (!seccionesMap.has(row.SeccionID)) {
            seccionesMap.set(row.SeccionID, {
                SeccionID: row.SeccionID,
                NumeroSeccion: row.NumeroSeccion,
                CupoMaximo: row.CupoMaximo,
                CupoDisponible: row.CupoDisponible,
                EstadoSeccion: row.EstadoSeccion,
                CursoID: row.CursoID,
                CodigoCurso: row.CodigoCurso,
                NombreCurso: row.NombreCurso,
                Creditos: row.Creditos,
                Descripcion: row.Descripcion,
                EstadoCurso: row.EstadoCurso,
                PeriodoID: row.PeriodoID,
                NombrePeriodo: row.NombrePeriodo,
                TipoPeriodo: row.TipoPeriodo,
                Anio: row.Anio,
                DocenteID: row.DocenteID,
                NombreDocente: row.NombreDocente,
                Horarios: []
            });
        }

        if (row.HorarioID) {
            seccionesMap.get(row.SeccionID).Horarios.push({
                HorarioID: row.HorarioID,
                DiaSemana: row.DiaSemana,
                HoraInicio: row.HoraInicio,
                HoraFin: row.HoraFin,
                AulaID: row.AulaID,
                CodigoAula: row.CodigoAula,
                NombreAula: row.NombreAula,
                Ubicacion: row.Ubicacion
            });
        }
    }

    const secciones = Array.from(seccionesMap.values());
    const elegibles = [];

    for (const seccion of secciones) {
        const [prerrequisitosRows] = await pool.query(
            `
                SELECT
                    pr.CursoPrerrequisitoID,
                    c.NombreCurso AS NombrePrerrequisito
                FROM Prerrequisito pr
                INNER JOIN Curso c
                    ON pr.CursoPrerrequisitoID = c.CursoID
                WHERE pr.CursoID = ?
            `,
            [seccion.CursoID]
        );

        const faltantes = prerrequisitosRows.filter(
            (pr) => !cursosAprobados.has(Number(pr.CursoPrerrequisitoID))
        );

        if (faltantes.length > 0) {
            continue;
        }

        elegibles.push(seccion);
    }

    return elegibles;
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
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [estudianteRows] = await connection.query(
            `
                SELECT EstudianteID, EstadoAcademico
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
                SELECT
                    PeriodoID,
                    NombrePeriodo,
                    TipoPeriodo,
                    Anio,
                    EstadoPeriodo,
                    FechaInicioMatricula,
                    FechaFinMatricula
                FROM Periodo
                WHERE PeriodoID = ?
            `,
            [periodoIdNum]
        );

        if (periodoRows.length === 0) {
            throw crearErrorValidacion('El periodo no existe', 404);
        }

        const periodo = periodoRows[0];

        if (periodo.FechaInicioMatricula && periodo.FechaFinMatricula) {
            const hoy = new Date();
            const fechaInicioMatricula = new Date(periodo.FechaInicioMatricula);
            const fechaFinMatricula = new Date(periodo.FechaFinMatricula);

            fechaInicioMatricula.setHours(0, 0, 0, 0);
            fechaFinMatricula.setHours(23, 59, 59, 999);

            if (hoy < fechaInicioMatricula || hoy > fechaFinMatricula) {
                throw crearErrorValidacion('La matrícula no está habilitada para este periodo');
            }
        }

        const [bloqueoRows] = await connection.query(
            `
                SELECT BloqueoID, TipoBloqueo, Motivo
                FROM Bloqueo
                WHERE EstudianteID = ?
                  AND EstadoBloqueo = 'Activo'
                LIMIT 1
            `,
            [estudianteIdNum]
        );

        if (bloqueoRows.length > 0) {
            const bloqueo = bloqueoRows[0];
            throw crearErrorValidacion(
                `El estudiante tiene un bloqueo ${String(bloqueo.TipoBloqueo).toLowerCase()} activo: ${bloqueo.Motivo}`
            );
        }

        const [restriccionRows] = await connection.query(
            `
                SELECT RestriccionFinancieraID, MontoPendiente
                FROM Restriccion_Financiera
                WHERE EstudianteID = ?
                  AND EstadoRestriccion = 'Activa'
                  AND MontoPendiente > 0
                LIMIT 1
            `,
            [estudianteIdNum]
        );

        if (restriccionRows.length > 0) {
            throw crearErrorValidacion('El estudiante tiene una restricción financiera activa');
        }

        let creditosTotalesNuevos = 0;
        const cursosNuevos = [];
        const horariosNuevos = [];

        for (const secId of seccionesUnicas) {
            const [seccionRows] = await connection.query(
                `
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
                    FROM Seccion s
                    INNER JOIN Curso c
                        ON s.CursoID = c.CursoID
                    WHERE s.SeccionID = ?
                    FOR UPDATE
                `,
                [secId]
            );

            if (seccionRows.length === 0) {
                throw crearErrorValidacion(`La sección ${secId} no existe`);
            }

            const seccion = seccionRows[0];

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

            const [horarioRows] = await connection.query(
                `
                    SELECT
                        sh.SeccionID,
                        h.HorarioID,
                        h.DiaSemana,
                        h.HoraInicio,
                        h.HoraFin
                    FROM Seccion_Horario sh
                    INNER JOIN Horario h
                        ON sh.HorarioID = h.HorarioID
                    WHERE sh.SeccionID = ?
                `,
                [secId]
            );

            for (const horario of horarioRows) {
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

        const [cursosActuales] = await connection.query(
            `
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
                WHERE m.EstudianteID = ?
                  AND m.PeriodoID = ?
                  AND m.EstadoMatricula NOT IN ('Cancelada', 'Anulada')
                  AND ms.EstadoDetalle = 'Activa'
            `,
            [estudianteIdNum, periodoIdNum]
        );

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

        const [horariosActuales] = await connection.query(
            `
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
                WHERE m.EstudianteID = ?
                  AND m.PeriodoID = ?
                  AND m.EstadoMatricula NOT IN ('Cancelada', 'Anulada')
                  AND ms.EstadoDetalle = 'Activa'
            `,
            [estudianteIdNum, periodoIdNum]
        );

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
            const [prerrequisitosRows] = await connection.query(
                `
                    SELECT
                        pr.CursoPrerrequisitoID,
                        c.NombreCurso AS NombrePrerrequisito,
                        ha.EstadoCurso
                    FROM Prerrequisito pr
                    INNER JOIN Curso c
                        ON pr.CursoPrerrequisitoID = c.CursoID
                    LEFT JOIN Historial_Academico ha
                        ON ha.CursoID = pr.CursoPrerrequisitoID
                       AND ha.EstudianteID = ?
                       AND ha.EstadoCurso = 'Aprobado'
                    WHERE pr.CursoID = ?
                `,
                [estudianteIdNum, cursoNuevo.CursoID]
            );

            for (const prer of prerrequisitosRows) {
                if (!prer.EstadoCurso) {
                    throw crearErrorValidacion(
                        `El estudiante no cumple el prerrequisito ${prer.NombrePrerrequisito} para el curso ${cursoNuevo.NombreCurso}`
                    );
                }
            }
        }

        const [limiteRows] = await connection.query(
            `
                SELECT CreditosMinimos, CreditosMaximos
                FROM Limite_Creditos
                WHERE PeriodoID = ?
            `,
            [periodoIdNum]
        );

        if (limiteRows.length > 0) {
            const limite = limiteRows[0];

            const [creditosRows] = await connection.query(
                `
                    SELECT IFNULL(SUM(m.CreditosTotales), 0) AS CreditosActuales
                    FROM Matricula m
                    WHERE m.EstudianteID = ?
                      AND m.PeriodoID = ?
                      AND m.EstadoMatricula NOT IN ('Cancelada', 'Anulada')
                `,
                [estudianteIdNum, periodoIdNum]
            );

            const creditosActuales = Number(creditosRows[0].CreditosActuales || 0);
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

        const [costoRows] = await connection.query(
            `
                SELECT
                    cm.CostoCredito,
                    cm.CostoMatriculaBase
                FROM Costo_Matricula cm
                WHERE cm.TipoPeriodo = ?
                  AND cm.Anio = ?
                  AND cm.EstadoCosto = 'Activo'
                ORDER BY cm.FechaInicioVigencia DESC
                LIMIT 1
            `,
            [periodo.TipoPeriodo, periodo.Anio]
        );

        if (costoRows.length === 0) {
            throw crearErrorValidacion('No existe configuración de costos para el periodo indicado');
        }

        const costo = costoRows[0];
        const costoCredito = Number(costo.CostoCredito);
        const costoMatriculaBase = Number(costo.CostoMatriculaBase);
        const costoTotal = (costoCredito * creditosTotalesNuevos) + costoMatriculaBase;

        const [insertMatriculaResult] = await connection.query(
            `
                INSERT INTO Matricula (
                    EstudianteID,
                    PeriodoID,
                    CreditosTotales,
                    CostoTotal,
                    EstadoMatricula
                )
                VALUES (?, ?, ?, ?, 'Pendiente')
            `,
            [estudianteIdNum, periodoIdNum, creditosTotalesNuevos, costoTotal]
        );

        const matriculaId = insertMatriculaResult.insertId;

        if (!matriculaId) {
            throw new Error('No se pudo obtener el ID de la matrícula creada');
        }

        for (const secId of seccionesUnicas) {
            await connection.query(
                `
                    INSERT INTO Matricula_Seccion (MatriculaID, SeccionID, EstadoDetalle)
                    VALUES (?, ?, 'Activa')
                `,
                [matriculaId, secId]
            );

            const [updateResult] = await connection.query(
                `
                    UPDATE Seccion
                    SET CupoDisponible = CupoDisponible - 1
                    WHERE SeccionID = ?
                      AND CupoDisponible > 0
                `,
                [secId]
            );

            if (updateResult.affectedRows === 0) {
                throw crearErrorValidacion(`No fue posible reservar cupo en la sección ${secId}`);
            }
        }

        const [ultimaFacturaRows] = await connection.query(
            `
                SELECT NumeroFactura
                FROM Factura
                WHERE NumeroFactura LIKE ?
                ORDER BY FacturaID DESC
                LIMIT 1
            `,
            [`FAC-${periodo.Anio}-%`]
        );

        let ultimoCorrelativo = 0;

        if (ultimaFacturaRows.length > 0) {
            const numeroAnterior = String(ultimaFacturaRows[0].NumeroFactura);
            const match = numeroAnterior.match(/(\d{4})$/);
            if (match) {
                ultimoCorrelativo = Number(match[1]);
            }
        }

        const nuevoCorrelativo = ultimoCorrelativo + 1;
        const numeroFactura = `FAC-${periodo.Anio}-${String(nuevoCorrelativo).padStart(4, '0')}`;

        const [insertFacturaResult] = await connection.query(
            `
                INSERT INTO Factura (
                    NumeroFactura,
                    MatriculaID,
                    EstudianteID,
                    PeriodoID,
                    Total,
                    EstadoFactura
                )
                VALUES (?, ?, ?, ?, ?, 'Pendiente')
            `,
            [numeroFactura, matriculaId, estudianteIdNum, periodoIdNum, costoTotal]
        );

        const facturaId = insertFacturaResult.insertId;

        if (!facturaId) {
            throw new Error('No se pudo obtener el ID de la factura creada');
        }

        const [insertEstadoCuentaResult] = await connection.query(
            `
                INSERT INTO Estado_Cuenta (
                    FacturaID,
                    MontoTotal,
                    MontoPagado,
                    SaldoPendiente,
                    EstadoCuenta
                )
                VALUES (?, ?, 0, ?, 'Pendiente')
            `,
            [facturaId, costoTotal, costoTotal]
        );

        const estadoCuentaId = insertEstadoCuentaResult.insertId;

        if (!estadoCuentaId) {
            throw new Error('No se pudo obtener el ID del estado de cuenta creado');
        }

        await connection.query(
            `
                UPDATE Matricula
                SET FacturaID = ?
                WHERE MatriculaID = ?
            `,
            [facturaId, matriculaId]
        );

        try {
            await registrarAuditoria({
                usuario: `Estudiante ${estudianteIdNum}`,
                accion: 'CREAR_MATRICULA',
                descripcion: `Se creó la matrícula ${matriculaId} para el estudiante ${estudianteIdNum} en el periodo ${periodoIdNum} con ${seccionesUnicas.length} sección(es). Factura generada: ${numeroFactura}.`,
                transaction: connection
            });
        } catch (auditError) {
            console.warn('No se pudo registrar auditoría:', auditError.message);
        }

        await connection.commit();

        return {
            matriculaId,
            facturaId,
            estadoCuentaId,
            numeroFactura,
            creditosTotales: creditosTotalesNuevos,
            costoTotal,
            estadoMatricula: 'Pendiente',
            estadoFactura: 'Pendiente',
            estadoCuenta: 'Pendiente',
            comprobanteMatricula: null
        };
    } catch (error) {
        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error('Error al hacer rollback en crearMatricula:', rollbackError.message);
        }
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    obtenerMatriculas,
    obtenerMatriculaPorId,
    obtenerMatriculasPorEstudiante,
    obtenerOfertaMatriculablePorEstudiante,
    crearMatricula
};