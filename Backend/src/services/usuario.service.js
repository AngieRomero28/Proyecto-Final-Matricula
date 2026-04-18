const { poolPromise } = require('../config/db');
const authService = require('./auth.service');

const crearErrorValidacion = (mensaje, statusCode = 400) => {
    const error = new Error(mensaje);
    error.statusCode = statusCode;
    return error;
};

const validarPasswordSegura = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return regex.test(password);
};

const obtenerRolesUsuario = async (executor, usuarioId) => {
    const query = `
        SELECT
            r.RolID,
            r.NombreRol,
            r.DescripcionRol
        FROM Usuario_Rol ur
        INNER JOIN Rol r
            ON ur.RolID = r.RolID
        WHERE ur.UsuarioID = ?
        ORDER BY r.NombreRol;
    `;

    const [rows] = await executor.query(query, [usuarioId]);
    return rows;
};

const mapearUsuario = (usuario, roles = []) => {
    const nombresRoles = roles.map((rol) => rol.NombreRol);

    return {
        UsuarioID: usuario.UsuarioID,
        Username: usuario.Username,
        Identificacion: usuario.Identificacion,
        Nombre: usuario.Nombre,
        Apellido1: usuario.Apellido1,
        Apellido2: usuario.Apellido2,
        NombreCompleto: usuario.NombreCompleto,
        CorreoInstitucional: usuario.CorreoInstitucional,
        Telefono: usuario.Telefono,
        EstadoUsuario: usuario.EstadoUsuario,
        FechaCreacion: usuario.FechaCreacion,
        UltimoAcceso: usuario.UltimoAcceso,
        Roles: roles,
        RolPrincipal: nombresRoles[0] || null
    };
};

const obtenerUsuarios = async () => {
    const pool = await poolPromise;

    const query = `
        SELECT
            u.UsuarioID,
            u.Username,
            u.Identificacion,
            u.Nombre,
            u.Apellido1,
            u.Apellido2,
            u.NombreCompleto,
            u.CorreoInstitucional,
            u.Telefono,
            u.EstadoUsuario,
            u.FechaCreacion,
            u.UltimoAcceso
        FROM Usuario u
        ORDER BY u.UsuarioID DESC;
    `;

    const [usuarios] = await pool.query(query);

    const resultado = [];
    for (const usuario of usuarios) {
        const roles = await obtenerRolesUsuario(pool, usuario.UsuarioID);
        resultado.push(mapearUsuario(usuario, roles));
    }

    return resultado;
};

const obtenerUsuarioPorId = async (id) => {
    const pool = await poolPromise;
    const usuarioId = Number(id);

    if (Number.isNaN(usuarioId) || usuarioId <= 0) {
        return null;
    }

    const query = `
        SELECT
            u.UsuarioID,
            u.Username,
            u.Identificacion,
            u.Nombre,
            u.Apellido1,
            u.Apellido2,
            u.NombreCompleto,
            u.CorreoInstitucional,
            u.Telefono,
            u.EstadoUsuario,
            u.FechaCreacion,
            u.UltimoAcceso
        FROM Usuario u
        WHERE u.UsuarioID = ?;
    `;

    const [rows] = await pool.query(query, [usuarioId]);

    if (!rows.length) {
        return null;
    }

    const usuario = rows[0];
    const roles = await obtenerRolesUsuario(pool, usuario.UsuarioID);

    return mapearUsuario(usuario, roles);
};

const loginUsuario = async ({ username, password }) => {
    return authService.login({ username, password });
};

const cambiarPassword = async ({ usuarioId, passwordActual, passwordNueva }) => {
    const pool = await poolPromise;

    const actual = passwordActual;
    const nueva = passwordNueva;

    if (!usuarioId || !actual || !nueva) {
        throw crearErrorValidacion('Debe enviar usuarioId, passwordActual y passwordNueva');
    }

    const usuarioIdNum = Number(usuarioId);

    if (Number.isNaN(usuarioIdNum) || usuarioIdNum <= 0) {
        throw crearErrorValidacion('El usuarioId debe ser numérico');
    }

    if (!validarPasswordSegura(String(nueva))) {
        throw crearErrorValidacion(
            'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un signo especial'
        );
    }

    const [rows] = await pool.query(
        `
            SELECT
                UsuarioID,
                Username,
                PasswordHash,
                EstadoUsuario
            FROM Usuario
            WHERE UsuarioID = ?
            LIMIT 1;
        `,
        [usuarioIdNum]
    );

    if (!rows.length) {
        throw crearErrorValidacion('Usuario no encontrado', 404);
    }

    const usuario = rows[0];

    if (usuario.EstadoUsuario !== 'Activo') {
        throw crearErrorValidacion('El usuario no se encuentra activo', 403);
    }

    if (String(usuario.PasswordHash) !== String(actual)) {
        throw crearErrorValidacion('La contraseña actual es incorrecta', 401);
    }

    if (String(actual) === String(nueva)) {
        throw crearErrorValidacion('La nueva contraseña no puede ser igual a la actual');
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

    return {
        UsuarioID: usuarioIdNum,
        mensaje: 'Contraseña actualizada correctamente'
    };
};

module.exports = {
    obtenerUsuarios,
    obtenerUsuarioPorId,
    loginUsuario,
    cambiarPassword
};