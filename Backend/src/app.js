const express = require('express');
const cors = require('cors');
const { connectDB, poolPromise } = require('./config/db');

const dashboardRoutes = require('./routes/dashboard.routes');
const usuarioRoutes = require('./routes/usuario.routes');
const programaRoutes = require('./routes/programa.routes');
const reporteRoutes = require('./routes/reporte.routes');
const notificacionRoutes = require('./routes/notificacion.routes');
const estudianteRoutes = require('./routes/estudiante.routes');
const cursoRoutes = require('./routes/curso.routes');
const periodoRoutes = require('./routes/periodo.routes');
const seccionRoutes = require('./routes/seccion.routes');
const matriculaRoutes = require('./routes/matricula.routes');
const pagoRoutes = require('./routes/pago.routes');
const facturaRoutes = require('./routes/factura.routes');
const estadoCuentaRoutes = require('./routes/estadoCuenta.routes');
const comprobanteRoutes = require('./routes/comprobante.routes');
const auditoriaRoutes = require('./routes/auditoria.routes');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

// Conexión a la base de datos
connectDB();

// Middlewares globales
app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ruta base
app.get('/', (req, res) => {
    res.status(200).json({
        mensaje: 'Backend Sistema Matrícula funcionando',
        estado: 'OK'
    });
});

// Ruta de prueba de conexión a BD
app.get('/api/test-db', async (req, res, next) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT DB_NAME() AS DB');

        res.status(200).json({
            mensaje: 'Conexión OK',
            db: result.recordset[0].DB
        });
    } catch (error) {
        next(error);
    }
});

// Rutas API
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/programas', programaRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/estudiantes', estudianteRoutes);
app.use('/api/cursos', cursoRoutes);
app.use('/api/periodos', periodoRoutes);
app.use('/api/secciones', seccionRoutes);
app.use('/api/matriculas', matriculaRoutes);
app.use('/api/pagos', pagoRoutes);
app.use('/api/facturas', facturaRoutes);
app.use('/api/estado-cuenta', estadoCuentaRoutes);
app.use('/api/comprobantes', comprobanteRoutes);
app.use('/api/auditoria', auditoriaRoutes);

// Ruta no encontrada
app.use((req, res) => {
    res.status(404).json({
        mensaje: 'Ruta no encontrada',
        ruta: req.originalUrl
    });
});

// Middleware global de errores
app.use(errorMiddleware);

module.exports = app;