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

    const [rows] = await pool.query(query);
    return rows;
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
        WHERE PeriodoID = ?;
    `;

    const [rows] = await pool.query(query, [id]);
    return rows[0] || null;
};

module.exports = {
    obtenerPeriodos,
    obtenerPeriodoPorId
};