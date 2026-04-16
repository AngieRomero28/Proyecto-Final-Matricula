require('dotenv').config();
const mysql = require('mysql2/promise');

const host = process.env.DB_HOST || '127.0.0.1';
const port = Number(process.env.DB_PORT || 3306);
const database = process.env.DB_NAME || 'Sistema_Matricula_Universitaria';
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '1234';

const pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
});

const connectDB = async () => {
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.ping();
        console.log('Conexión exitosa a MySQL');
    } catch (error) {
        console.error('Error al conectar a MySQL:', error.message);
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

module.exports = {
    pool,
    poolPromise: pool,
    connectDB
};