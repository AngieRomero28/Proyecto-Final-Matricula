const { poolPromise } = require('../config/db');

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
        ORDER BY Anio, PeriodoID;
    `;

    const result = await pool.request().query(query);
    return result.recordset;
};

const obtenerPeriodoPorId = async (id) => {
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
        WHERE PeriodoID = @id;
    `;

    const result = await pool
        .request()
        .input('id', id)
        .query(query);

    return result.recordset[0] || null;
};

module.exports = {
    obtenerPeriodos,
    obtenerPeriodoPorId
};