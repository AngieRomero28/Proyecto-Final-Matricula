const { poolPromise } = require('../config/db');

const obtenerAuditoria = async (filtros = {}) => {
    const pool = await poolPromise;

    const condiciones = [];
    const params = [];

    if (filtros.usuario) {
        condiciones.push('a.Usuario LIKE ?');
        params.push(`%${String(filtros.usuario).trim()}%`);
    }

    if (filtros.accion) {
        condiciones.push('a.Accion = ?');
        params.push(String(filtros.accion).trim());
    }

    if (filtros.fechaInicio) {
        condiciones.push('DATE(a.Fecha) >= ?');
        params.push(filtros.fechaInicio);
    }

    if (filtros.fechaFin) {
        condiciones.push('DATE(a.Fecha) <= ?');
        params.push(filtros.fechaFin);
    }

    const whereClause = condiciones.length
        ? `WHERE ${condiciones.join(' AND ')}`
        : '';

    const query = `
        SELECT
            a.AuditoriaID,
            a.Usuario,
            a.Accion,
            a.Descripcion,
            a.Fecha
        FROM Auditoria a
        ${whereClause}
        ORDER BY a.Fecha DESC, a.AuditoriaID DESC;
    `;

    const [rows] = await pool.query(query, params);
    return rows;
};

const obtenerResumenAuditoria = async () => {
    const pool = await poolPromise;

    const query = `
        SELECT
            COUNT(*) AS TotalRegistros,
            COUNT(DISTINCT Usuario) AS TotalUsuarios,
            COUNT(DISTINCT Accion) AS TotalAcciones,
            MAX(Fecha) AS UltimoRegistro
        FROM Auditoria;
    `;

    const [rows] = await pool.query(query);
    return rows[0] || {};
};

const registrarAuditoria = async ({ usuario, accion, descripcion, transaction = null }) => {
    if (!usuario || !accion || !descripcion) {
        const error = new Error('usuario, accion y descripcion son obligatorios para registrar auditoría');
        error.statusCode = 400;
        throw error;
    }

    const executor = transaction || (await poolPromise);

    const query = `
        INSERT INTO Auditoria (Usuario, Accion, Descripcion)
        VALUES (?, ?, ?);
    `;

    await executor.query(query, [usuario, accion, descripcion]);
};

module.exports = {
    obtenerAuditoria,
    obtenerResumenAuditoria,
    registrarAuditoria
};