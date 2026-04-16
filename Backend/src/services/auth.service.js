const { poolPromise } = require('../config/db');
const { registrarAuditoria } = require('./auditoria.service');

const crearError = (mensaje, statusCode = 400) => {
    const error = new Error(mensaje);
    error.statusCode = statusCode;
    return error;
};

const validarPasswordSegura = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return regex.test(password);
};

const obtenerRoles = async (executor, usuarioId) => {
    const [rows] = await executor.query(
        `
            SELECT
                r.RolID,
                r.NombreRol
            FROM Usuario_Rol ur
            INNER JOIN Rol r
                ON ur.RolID = r.RolID
            WHERE ur.UsuarioID = ?
            ORDER BY r.NombreRol;
        `,
        [usuarioId]
    );

    return rows;
};

const login = async ({ username, password }) => {
    const pool = await poolPromise;

    if (!username || !password) {
        throw crearError('Debe enviar username y password');
    }

    const usernameTexto = String(username).trim();
    const passwordTexto = String(password);

    if (!usernameTexto) {
        throw crearError('El username es obligatorio');
    }

    const [rows] = await pool.query(
        `
            SELECT
                u.UsuarioID,
                u.Username,
                u.NombreCompleto,
                u.PasswordHash,
                u.EstadoUsuario,
                IFNULL(u.PasswordTemporal, 0) AS PasswordTemporal,
                IFNULL(u.DebeCambiarPassword, 0) AS DebeCambiarPassword
            FROM Usuario u
            WHERE u.Username = ?
            LIMIT 1;
        `,
        [usernameTexto]
    );

    if (rows.length === 0) {
        throw crearError('Usuario o contraseña incorrectos', 401);
    }

    const usuario = rows[0];

    if (usuario.EstadoUsuario !== 'Activo') {
        throw crearError('Usuario inactivo', 403);
    }

    if (String(usuario.PasswordHash) !== passwordTexto) {
        throw crearError('Usuario o contraseña incorrectos', 401);
    }

    const roles = await obtenerRoles(pool, usuario.UsuarioID);

    await pool.query(
        `
            UPDATE Usuario
            SET UltimoAcceso = CURRENT_TIMESTAMP
            WHERE UsuarioID = ?;
        `,
        [usuario.UsuarioID]
    );

    await registrarAuditoria({
        usuario: usuario.Username,
        accion: 'LOGIN',
        descripcion: `Inicio de sesión del usuario ${usuario.Username}`
    });

    return {
        UsuarioID: usuario.UsuarioID,
        Username: usuario.Username,
        NombreCompleto: usuario.NombreCompleto,
        Roles: roles,
        PasswordTemporal: Boolean(usuario.PasswordTemporal),
        DebeCambiarPassword: Boolean(usuario.DebeCambiarPassword)
    };
};

const cambiarPassword = async ({ usuarioId, actual, nueva }) => {
    const pool = await poolPromise;

    if (!usuarioId || !actual || !nueva) {
        throw crearError('Debe enviar usuarioId, actual y nueva');
    }

    const usuarioIdNum = Number(usuarioId);

    if (Number.isNaN(usuarioIdNum)) {
        throw crearError('El usuarioId debe ser numérico');
    }

    if (!validarPasswordSegura(String(nueva))) {
        throw crearError(
            'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un signo especial'
        );
    }

    const [rows] = await pool.query(
        `
            SELECT
                u.UsuarioID,
                u.Username,
                u.PasswordHash,
                u.EstadoUsuario
            FROM Usuario u
            WHERE u.UsuarioID = ?
            LIMIT 1;
        `,
        [usuarioIdNum]
    );

    if (rows.length === 0) {
        throw crearError('Usuario no encontrado', 404);
    }

    const usuario = rows[0];

    if (usuario.EstadoUsuario !== 'Activo') {
        throw crearError('Usuario inactivo', 403);
    }

    const roles = await obtenerRoles(pool, usuarioIdNum);
    const esEstudiante = roles.some(
        (rol) => String(rol.NombreRol).trim().toLowerCase() === 'estudiante'
    );

    if (!esEstudiante) {
        throw crearError('Solo los estudiantes pueden cambiar su contraseña desde esta opción', 403);
    }

    if (String(usuario.PasswordHash) !== String(actual)) {
        throw crearError('Contraseña actual incorrecta', 401);
    }

    if (String(actual) === String(nueva)) {
        throw crearError('La nueva contraseña no puede ser igual a la actual');
    }

    await pool.query(
        `
            UPDATE Usuario
            SET
                PasswordHash = ?,
                PasswordTemporal = 0,
                DebeCambiarPassword = 0
            WHERE UsuarioID = ?;
        `,
        [String(nueva), usuarioIdNum]
    );

    await registrarAuditoria({
        usuario: usuario.Username,
        accion: 'CAMBIO_PASSWORD_ESTUDIANTE',
        descripcion: `El estudiante ${usuario.Username} cambió su contraseña`
    });

    return {
        mensaje: 'Contraseña actualizada correctamente'
    };
};

module.exports = {
    login,
    cambiarPassword
};