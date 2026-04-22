// backend/src/services/usuario.service.js
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

const normalizarTexto = (valor) => String(valor || '').trim();

const construirNombreCompleto = ({ nombre, apellido1, apellido2, nombreCompleto }) => {
    const completo = normalizarTexto(nombreCompleto);
    if (completo) return completo;

    return [nombre, apellido1, apellido2]
        .map((item) => normalizarTexto(item))
        .filter(Boolean)
        .join(' ');
};

const obtenerRolIdPorNombre = async (executor, nombreRol) => {
    const [rows] = await executor.query(
        `
            SELECT RolID, NombreRol
            FROM Rol
            WHERE LOWER(TRIM(NombreRol)) = LOWER(TRIM(?))
            LIMIT 1;
        `,
        [nombreRol]
    );

    return rows[0] || null;
};

const obtenerProgramaPorId = async (executor, programaAcademicoId) => {
    const programaIdNum = Number(programaAcademicoId);

    if (Number.isNaN(programaIdNum) || programaIdNum <= 0) {
        return null;
    }

    const [rows] = await executor.query(
        `
            SELECT ProgramaAcademicoID
            FROM Programa_Academico
            WHERE ProgramaAcademicoID = ?
            LIMIT 1;
        `,
        [programaIdNum]
    );

    return rows[0] || null;
};

const obtenerPlanEstudioPorId = async (executor, planEstudioId) => {
    const planIdNum = Number(planEstudioId);

    if (Number.isNaN(planIdNum) || planIdNum <= 0) {
        return null;
    }

    const [rows] = await executor.query(
        `
            SELECT PlanEstudioID
            FROM Plan_Estudio
            WHERE PlanEstudioID = ?
            LIMIT 1;
        `,
        [planIdNum]
    );

    return rows[0] || null;
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

const crearUsuario = async (data = {}) => {
    const pool = await poolPromise;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const username = normalizarTexto(data.Username ?? data.username);
        const identificacion = normalizarTexto(data.Identificacion ?? data.identificacion);
        const nombre = normalizarTexto(data.Nombre ?? data.nombre);
        const apellido1 = normalizarTexto(data.Apellido1 ?? data.apellido1);
        const apellido2 = normalizarTexto(data.Apellido2 ?? data.apellido2);
        const nombreCompleto = construirNombreCompleto({
            nombre,
            apellido1,
            apellido2,
            nombreCompleto: data.NombreCompleto ?? data.nombreCompleto
        });
        const correoInstitucional = normalizarTexto(data.CorreoInstitucional ?? data.correoInstitucional);
        const telefono = normalizarTexto(data.Telefono ?? data.telefono);
        const password = String(
            data.PasswordHash ??
            data.password ??
            data.Password ??
            ''
        ).trim();
        const tipoUsuario = normalizarTexto(data.TipoUsuario ?? data.tipoUsuario);
        const estadoUsuario = normalizarTexto(data.EstadoUsuario ?? data.estadoUsuario) || 'Activo';

        const programaAcademicoId = data.ProgramaAcademicoID ?? data.programaAcademicoId ?? null;
        const planEstudioId = data.PlanEstudioID ?? data.planEstudioId ?? null;
        const carnet = normalizarTexto(data.Carnet ?? data.carnet);
        const estadoAcademico = normalizarTexto(data.EstadoAcademico ?? data.estadoAcademico) || 'Activo';
        const fechaIngreso = data.FechaIngreso ?? data.fechaIngreso ?? null;

        const especialidad = normalizarTexto(data.Especialidad ?? data.especialidad);
        const fechaContratacion = data.FechaContratacion ?? data.fechaContratacion ?? null;
        const estadoDocente = normalizarTexto(data.EstadoDocente ?? data.estadoDocente) || 'Activo';

        if (!username) {
            throw crearErrorValidacion('Username es obligatorio');
        }

        if (!identificacion) {
            throw crearErrorValidacion('Identificacion es obligatoria');
        }

        if (!nombre) {
            throw crearErrorValidacion('Nombre es obligatorio');
        }

        if (!apellido1) {
            throw crearErrorValidacion('Apellido1 es obligatorio');
        }

        if (!correoInstitucional) {
            throw crearErrorValidacion('CorreoInstitucional es obligatorio');
        }

        if (!password) {
            throw crearErrorValidacion('Password es obligatorio');
        }

        if (!validarPasswordSegura(password)) {
            throw crearErrorValidacion(
                'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un signo especial'
            );
        }

        if (!['docente', 'estudiante'].includes(tipoUsuario.toLowerCase())) {
            throw crearErrorValidacion('TipoUsuario debe ser "docente" o "estudiante"');
        }

        const [usuarioExistentePorUsername] = await connection.query(
            `
                SELECT UsuarioID
                FROM Usuario
                WHERE LOWER(TRIM(Username)) = LOWER(TRIM(?))
                LIMIT 1;
            `,
            [username]
        );

        if (usuarioExistentePorUsername.length > 0) {
            throw crearErrorValidacion('Ya existe un usuario con ese username');
        }

        const [usuarioExistentePorIdentificacion] = await connection.query(
            `
                SELECT UsuarioID
                FROM Usuario
                WHERE TRIM(Identificacion) = TRIM(?)
                LIMIT 1;
            `,
            [identificacion]
        );

        if (usuarioExistentePorIdentificacion.length > 0) {
            throw crearErrorValidacion('Ya existe un usuario con esa identificación');
        }

        const [usuarioExistentePorCorreo] = await connection.query(
            `
                SELECT UsuarioID
                FROM Usuario
                WHERE LOWER(TRIM(CorreoInstitucional)) = LOWER(TRIM(?))
                LIMIT 1;
            `,
            [correoInstitucional]
        );

        if (usuarioExistentePorCorreo.length > 0) {
            throw crearErrorValidacion('Ya existe un usuario con ese correo institucional');
        }

        const rolBuscado = tipoUsuario.toLowerCase() === 'docente' ? 'docente' : 'estudiante';
        const rol = await obtenerRolIdPorNombre(connection, rolBuscado);

        if (!rol) {
            throw crearErrorValidacion(`No existe el rol ${rolBuscado} en la base de datos`, 404);
        }

        const [insertUsuario] = await connection.query(
            `
                INSERT INTO Usuario (
                    Username,
                    Identificacion,
                    Nombre,
                    Apellido1,
                    Apellido2,
                    NombreCompleto,
                    CorreoInstitucional,
                    Telefono,
                    PasswordHash,
                    PasswordTemporal,
                    DebeCambiarPassword,
                    EstadoUsuario,
                    FechaCreacion
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, NOW());
            `,
            [
                username,
                identificacion,
                nombre,
                apellido1,
                apellido2 || null,
                nombreCompleto,
                correoInstitucional,
                telefono || null,
                password,
                estadoUsuario
            ]
        );

        const usuarioId = insertUsuario.insertId;

        if (!usuarioId) {
            throw crearErrorValidacion('No se pudo crear el usuario', 500);
        }

        await connection.query(
            `
                INSERT INTO Usuario_Rol (UsuarioID, RolID)
                VALUES (?, ?);
            `,
            [usuarioId, rol.RolID]
        );

        if (rolBuscado === 'estudiante') {
            if (!carnet) {
                throw crearErrorValidacion('Carnet es obligatorio para estudiantes');
            }

            const programa = await obtenerProgramaPorId(connection, programaAcademicoId);
            if (!programa) {
                throw crearErrorValidacion('ProgramaAcademicoID inválido para estudiante');
            }

            const plan = await obtenerPlanEstudioPorId(connection, planEstudioId);
            if (!plan) {
                throw crearErrorValidacion('PlanEstudioID inválido para estudiante');
            }

            const [carnetExistente] = await connection.query(
                `
                    SELECT EstudianteID
                    FROM Estudiante
                    WHERE TRIM(Carnet) = TRIM(?)
                    LIMIT 1;
                `,
                [carnet]
            );

            if (carnetExistente.length > 0) {
                throw crearErrorValidacion('Ya existe un estudiante con ese carnet');
            }

            if (!fechaIngreso) {
                throw crearErrorValidacion('FechaIngreso es obligatoria para estudiantes');
            }

            await connection.query(
                `
                    INSERT INTO Estudiante (
                        UsuarioID,
                        Carnet,
                        EstadoAcademico,
                        ProgramaAcademicoID,
                        PlanEstudioID,
                        FechaIngreso
                    )
                    VALUES (?, ?, ?, ?, ?, ?);
                `,
                [
                    usuarioId,
                    carnet,
                    estadoAcademico,
                    Number(programaAcademicoId),
                    Number(planEstudioId),
                    fechaIngreso
                ]
            );
        }

        if (rolBuscado === 'docente') {
            if (!fechaContratacion) {
                throw crearErrorValidacion('FechaContratacion es obligatoria para docentes');
            }

            await connection.query(
                `
                    INSERT INTO Docente (
                        UsuarioID,
                        Especialidad,
                        FechaContratacion,
                        EstadoDocente
                    )
                    VALUES (?, ?, ?, ?);
                `,
                [
                    usuarioId,
                    especialidad || null,
                    fechaContratacion,
                    estadoDocente
                ]
            );
        }

        await connection.commit();

        return await obtenerUsuarioPorId(usuarioId);
    } catch (error) {
        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error('Error al hacer rollback en crearUsuario:', rollbackError.message);
        }
        throw error;
    } finally {
        connection.release();
    }
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
    crearUsuario,
    loginUsuario,
    cambiarPassword
};