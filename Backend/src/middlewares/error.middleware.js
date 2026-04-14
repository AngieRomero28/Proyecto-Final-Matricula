const errorMiddleware = (err, req, res, next) => {
    console.error('Error capturado por middleware:', {
        mensaje: err.message,
        stack: err.stack,
        ruta: req.originalUrl,
        metodo: req.method,
        fecha: new Date().toISOString()
    });

    const statusCode =
        Number.isInteger(err.statusCode) && err.statusCode >= 400 && err.statusCode < 600
            ? err.statusCode
            : 500;

    const respuesta = {
        mensaje: err.message || 'Error interno del servidor'
    };

    if (process.env.NODE_ENV === 'development') {
        respuesta.error = err.stack;
    }

    res.status(statusCode).json(respuesta);
};

module.exports = errorMiddleware;