const { poolPromise, sql } = require('../config/db');

const obtenerAuditoria = async () => {
    const pool = await poolPromise;

    const result = await pool.request().query(`
        SELECT
            AuditoriaID,
            Usuario,
            Accion,
            Descripcion,
            Fecha
        FROM Auditoria
        ORDER BY Fecha DESC;
    `);

    return result.recordset;
};

const registrarAuditoria = async ({ usuario, accion, descripcion, transaction = null }) => {
    if (!usuario || !accion || !descripcion) {
        throw new Error('usuario, accion y descripcion son obligatorios para registrar auditoría');
    }

    const request = transaction
        ? new sql.Request(transaction)
        : (await poolPromise).request();

    await request
        .input('usuario', sql.NVarChar(100), usuario)
        .input('accion', sql.NVarChar(50), accion)
        .input('descripcion', sql.NVarChar(255), descripcion)
        .query(`
            INSERT INTO Auditoria (Usuario, Accion, Descripcion)
            VALUES (@usuario, @accion, @descripcion);
        `);
};

module.exports = {
    obtenerAuditoria,
    registrarAuditoria
};