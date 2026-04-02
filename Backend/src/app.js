const express = require('express');
const cors = require('cors');
const { connectDB, poolPromise } = require('./config/db');

const estudianteRoutes = require('./routes/estudiante.routes');
const cursoRoutes = require('./routes/curso.routes');
const periodoRoutes = require('./routes/periodo.routes');
const seccionRoutes = require('./routes/seccion.routes');
const matriculaRoutes = require('./routes/matricula.routes');
const pagoRoutes = require('./routes/pago.routes');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

// Conexión DB
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta base
app.get('/', (req, res) => {
    res.json({
        mensaje: 'Backend Sistema Matrícula funcionando'
    });
});

// Test DB
app.get('/api/test-db', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT DB_NAME() AS DB');

        res.json({
            mensaje: 'Conexión OK',
            db: result.recordset[0].DB
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

// Rutas
app.use('/api/estudiantes', estudianteRoutes);
app.use('/api/cursos', cursoRoutes);
app.use('/api/periodos', periodoRoutes);
app.use('/api/secciones', seccionRoutes);
app.use('/api/matriculas', matriculaRoutes);
app.use('/api/pagos', pagoRoutes);

// Middleware global de manejo de errores
app.use(errorMiddleware);

module.exports = app;