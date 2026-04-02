const errorMiddleware = (err, req, res, next) => {
    console.error('Error capturado por middleware:', {
        mensaje: err.message,
        stack: err.stack,
        ruta: req.originalUrl,
        metodo: req.method,
        fecha: new Date().toISOString()
    });

    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        mensaje: err.message || 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = errorMiddleware;