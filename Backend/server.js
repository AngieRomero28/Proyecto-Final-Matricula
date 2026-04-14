require('dotenv').config();

const app = require('./src/app');

const PORT = process.env.PORT || 3000;

// Manejo de errores no controlados (MUY importante en Node)
process.on('uncaughtException', (error) => {
    console.error('❌ Error no controlado (uncaughtException):', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    console.error('❌ Promesa rechazada no manejada (unhandledRejection):', reason);
    process.exit(1);
});

// Iniciar servidor
const server = app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});

// Cierre limpio del servidor (importante para Render / producción)
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM recibido. Cerrando servidor...');
    server.close(() => {
        console.log('🔒 Servidor cerrado correctamente');
        process.exit(0);
    });
});