require('dotenv').config();
const sql = require('mssql');

const parseBoolean = (value, defaultValue = false) => {
    if (value === undefined || value === null || value === '') {
        return defaultValue;
    }

    return String(value).trim().toLowerCase() === 'true';
};

const server = process.env.DB_SERVER || 'ANGIE';
const database = process.env.DB_DATABASE || 'Sistema_Matricula_Universitaria';
const user = process.env.DB_USER || 'sa';
const password = process.env.DB_PASSWORD || '1234';
const instanceName = process.env.DB_INSTANCE || 'ANGIE';

const dbConfig = {
    user,
    password,
    server,
    database,
    options: {
        encrypt: parseBoolean(process.env.DB_ENCRYPT, false),
        trustServerCertificate: parseBoolean(process.env.DB_TRUST_SERVER_CERTIFICATE, true)
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

if (instanceName) {
    dbConfig.options.instanceName = instanceName;
}

const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then((pool) => {
        console.log('Conexión exitosa a SQL Server');
        return pool;
    })
    .catch((error) => {
        console.error('Error al conectar a SQL Server:', error.message);
        throw error;
    });

const connectDB = async () => {
    try {
        await poolPromise;
    } catch (error) {
        console.error('No se pudo establecer la conexión con la base de datos:', error.message);
    }
};

module.exports = {
    sql,
    poolPromise,
    connectDB
};