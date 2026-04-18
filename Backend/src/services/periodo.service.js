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

module.exports = {
    obtenerPeriodos,
    obtenerPeriodoPorId
};