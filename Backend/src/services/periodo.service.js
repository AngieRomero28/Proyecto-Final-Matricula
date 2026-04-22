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
            EstadoPeriodo
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
            EstadoPeriodo
        FROM Periodo
        WHERE PeriodoID = ?;
    `;

    const [rows] = await pool.query(query, [periodoId]);
    return rows[0] || null;
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

    if (periodo.FechaInicio && new Date(`${fechaInicioMatricula}T00:00:00`) > new Date(`${normalizarFecha(periodo.FechaFin)}T23:59:59`)) {
        throw crearErrorValidacion('La matrícula no puede iniciar después de la fecha fin del período');
    }

    if (periodo.FechaFin && new Date(`${fechaFinMatricula}T23:59:59`) < new Date(`${normalizarFecha(periodo.FechaInicio)}T00:00:00`)) {
        throw crearErrorValidacion('La matrícula no puede finalizar antes de la fecha inicio del período');
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

    const actualizado = await obtenerPeriodoPorId(periodoId);

    return actualizado;
};

module.exports = {
    obtenerPeriodos,
    obtenerPeriodoPorId,
    abrirMatriculaPeriodo
};