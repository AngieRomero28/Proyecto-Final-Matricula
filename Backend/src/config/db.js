require('dotenv').config();
const sql = require('mssql');

const dbConfig = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '1234',
    server: process.env.DB_SERVER || 'ANGIE',
    database: process.env.DB_DATABASE || 'Sistema_Matricula_Universitaria',
    options: {
        instanceName: process.env.DB_INSTANCE || 'ANGIE',
        encrypt: String(process.env.DB_ENCRYPT).toLowerCase() === 'true',
        trustServerCertificate: String(process.env.DB_TRUST_SERVER_CERTIFICATE).toLowerCase() === 'true'
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log('Conexión exitosa a SQL Server');
        return pool;
    })
    .catch(error => {
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