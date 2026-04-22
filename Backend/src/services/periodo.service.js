// backend/src/services/periodo.service.js
const { poolPromise } = require('../config/db');

const crearErrorValidacion = (mensaje, statusCode = 400) => {
    const error = new Error(mensaje);
    error.statusCode = statusCode;
    return error;
};

const esFechaValida = (valor) => {
    if (!valor) return false;
    const fecha = new Date(valor);
    return !Number.isNaN(fecha.getTime());
};

const normalizarFecha = (valor) => {
    if (!esFechaValida(valor)) return null;

    const fecha = new Date(valor);
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
};

const TIPOS_PERIODO_VALIDOS = ['Trimestral', 'Cuatrimestral', 'Semestral'];
const ESTADOS_PERIODO_VALIDOS = ['Planeado', 'Activo', 'Finalizado', 'Cerrado', 'Inactivo'];

const obtenerPeriodos = async () => {
    const pool = await poolPromise;

    const query = `
        SELECT
            PeriodoID,
            NombrePeriodo,
            TipoPeriodo,
            Anio,
            FechaInicio,
            FechaFin,
            FechaInicioMatricula,
            FechaFinMatricula,
            EstadoPeriodo,
            IFNULL(CostoPeriodo, 0) AS CostoPeriodo
        FROM Periodo
        ORDER BY Anio DESC, PeriodoID DESC;
    `;

    const [rows] = await pool.query(query);
    return rows;
};

const obtenerPeriodoPorId = async (id) => {
    const pool = await poolPromise;
    const periodoId = Number(id);

    if (Number.isNaN(periodoId) || periodoId <= 0) {
        return null;
    }

    const query = `
        SELECT
            PeriodoID,
            NombrePeriodo,
            TipoPeriodo,
            Anio,
            FechaInicio,
            FechaFin,
            FechaInicioMatricula,
            FechaFinMatricula,
            EstadoPeriodo,
            IFNULL(CostoPeriodo, 0) AS CostoPeriodo
        FROM Periodo
        WHERE PeriodoID = ?;
    `;

    const [rows] = await pool.query(query, [periodoId]);
    return rows[0] || null;
};

const crearPeriodo = async (data = {}) => {
    const pool = await poolPromise;

    const nombrePeriodo = String(data.NombrePeriodo || '').trim();
    const tipoPeriodo = String(data.TipoPeriodo || '').trim();
    const anio = Number(data.Anio);
    const fechaInicio = normalizarFecha(data.FechaInicio);
    const fechaFin = normalizarFecha(data.FechaFin);
    const fechaInicioMatricula = data.FechaInicioMatricula
        ? normalizarFecha(data.FechaInicioMatricula)
        : null;
    const fechaFinMatricula = data.FechaFinMatricula
        ? normalizarFecha(data.FechaFinMatricula)
        : null;
    const estadoPeriodo = String(data.EstadoPeriodo || 'Planeado').trim();
    const costoPeriodo = Number(data.CostoPeriodo);

    if (!nombrePeriodo) {
        throw crearErrorValidacion('NombrePeriodo es obligatorio');
    }

    if (!TIPOS_PERIODO_VALIDOS.includes(tipoPeriodo)) {
        throw crearErrorValidacion('TipoPeriodo inválido');
    }

    if (Number.isNaN(anio) || anio <= 0) {
        throw crearErrorValidacion('Anio debe ser numérico');
    }

    const anioActual = new Date().getFullYear();

    if (anio < anioActual) {
        throw crearErrorValidacion('No se puede crear un período en un año ya pasado');
    }

    if (anio > anioActual + 1) {
        throw crearErrorValidacion('No se puede crear un período demasiado adelantado');
    }

    if (!fechaInicio || !fechaFin) {
        throw crearErrorValidacion('FechaInicio y FechaFin son obligatorias y válidas');
    }

    if (new Date(`${fechaFin}T23:59:59`) < new Date(`${fechaInicio}T00:00:00`)) {
        throw crearErrorValidacion('La FechaFin no puede ser menor que la FechaInicio');
    }

    if (fechaInicioMatricula && fechaFinMatricula) {
        if (new Date(`${fechaFinMatricula}T23:59:59`) < new Date(`${fechaInicioMatricula}T00:00:00`)) {
            throw crearErrorValidacion('La FechaFinMatricula no puede ser menor que la FechaInicioMatricula');
        }
    }

    if (
        fechaInicioMatricula &&
        new Date(`${fechaInicioMatricula}T00:00:00`) > new Date(`${fechaFin}T23:59:59`)
    ) {
        throw crearErrorValidacion('La matrícula no puede iniciar después de la fecha fin del período');
    }

    if (
        fechaFinMatricula &&
        new Date(`${fechaFinMatricula}T23:59:59`) < new Date(`${fechaInicio}T00:00:00`)
    ) {
        throw crearErrorValidacion('La matrícula no puede finalizar antes de la fecha inicio del período');
    }

    if (!ESTADOS_PERIODO_VALIDOS.includes(estadoPeriodo)) {
        throw crearErrorValidacion('EstadoPeriodo inválido');
    }

    if (Number.isNaN(costoPeriodo) || costoPeriodo < 0) {
        throw crearErrorValidacion('CostoPeriodo debe ser numérico y mayor o igual a 0');
    }

    const [duplicados] = await pool.query(
        `
            SELECT PeriodoID
            FROM Periodo
            WHERE LOWER(TRIM(NombrePeriodo)) = LOWER(TRIM(?))
              AND Anio = ?
            LIMIT 1;
        `,
        [nombrePeriodo, anio]
    );

    if (duplicados.length > 0) {
        throw crearErrorValidacion('Ya existe un período con ese nombre en el mismo año');
    }

    const insertQuery = `
        INSERT INTO Periodo (
            NombrePeriodo,
            TipoPeriodo,
            Anio,
            FechaInicio,
            FechaFin,
            FechaInicioMatricula,
            FechaFinMatricula,
            EstadoPeriodo,
            CostoPeriodo
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    const [result] = await pool.query(insertQuery, [
        nombrePeriodo,
        tipoPeriodo,
        anio,
        fechaInicio,
        fechaFin,
        fechaInicioMatricula,
        fechaFinMatricula,
        estadoPeriodo,
        costoPeriodo
    ]);

    if (!result.insertId) {
        throw crearErrorValidacion('No se pudo crear el período', 500);
    }

    return obtenerPeriodoPorId(result.insertId);
};

const abrirMatriculaPeriodo = async (id, data = {}) => {
    const pool = await poolPromise;
    const periodoId = Number(id);

    if (Number.isNaN(periodoId) || periodoId <= 0) {
        throw crearErrorValidacion('El id del periodo debe ser numérico');
    }

    const fechaInicioMatricula = normalizarFecha(data.FechaInicioMatricula);
    const fechaFinMatricula = normalizarFecha(data.FechaFinMatricula);
    const estadoPeriodo = String(data.EstadoPeriodo || 'Activo').trim();

    if (!fechaInicioMatricula || !fechaFinMatricula) {
        throw crearErrorValidacion('Debe enviar FechaInicioMatricula y FechaFinMatricula válidas');
    }

    if (new Date(`${fechaFinMatricula}T23:59:59`) < new Date(`${fechaInicioMatricula}T00:00:00`)) {
        throw crearErrorValidacion('La FechaFinMatricula no puede ser menor que la FechaInicioMatricula');
    }

    const periodo = await obtenerPeriodoPorId(periodoId);

    if (!periodo) {
        throw crearErrorValidacion('Periodo no encontrado', 404);
    }

    const anioActual = new Date().getFullYear();
    const anioPeriodo = Number(periodo.Anio || 0);

    if (anioPeriodo < anioActual) {
        throw crearErrorValidacion('No se puede abrir matrícula para un período de un año ya pasado');
    }

    if (anioPeriodo > anioActual + 1) {
        throw crearErrorValidacion('No se puede abrir matrícula para un período demasiado adelantado');
    }

    if (
        periodo.FechaFin &&
        new Date(`${fechaInicioMatricula}T00:00:00`) > new Date(`${normalizarFecha(periodo.FechaFin)}T23:59:59`)
    ) {
        throw crearErrorValidacion('La matrícula no puede iniciar después de la fecha fin del período');
    }

    if (
        periodo.FechaInicio &&
        new Date(`${fechaFinMatricula}T23:59:59`) < new Date(`${normalizarFecha(periodo.FechaInicio)}T00:00:00`)
    ) {
        throw crearErrorValidacion('La matrícula no puede finalizar antes de la fecha inicio del período');
    }

    if (!ESTADOS_PERIODO_VALIDOS.includes(estadoPeriodo)) {
        throw crearErrorValidacion('EstadoPeriodo inválido');
    }

    const updateQuery = `
        UPDATE Periodo
        SET
            FechaInicioMatricula = ?,
            FechaFinMatricula = ?,
            EstadoPeriodo = ?
        WHERE PeriodoID = ?;
    `;

    const [result] = await pool.query(updateQuery, [
        fechaInicioMatricula,
        fechaFinMatricula,
        estadoPeriodo,
        periodoId
    ]);

    if (!result.affectedRows) {
        throw crearErrorValidacion('No se pudo actualizar el período', 500);
    }

    return obtenerPeriodoPorId(periodoId);
};

module.exports = {
    obtenerPeriodos,
    obtenerPeriodoPorId,
    crearPeriodo,
    abrirMatriculaPeriodo
};