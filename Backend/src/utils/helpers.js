const crearRespuestaExitosa = (mensaje, data = null) => {
    return {
        mensaje,
        data
    };
};

const crearRespuestaError = (mensaje, error = null) => {
    return {
        mensaje,
        error
    };
};

const esNumeroValido = (valor) => {
    return valor !== null && valor !== undefined && valor !== '' && !isNaN(Number(valor));
};

const convertirANumero = (valor) => {
    return Number(valor);
};

const textoTieneValor = (texto) => {
    return typeof texto === 'string' && texto.trim() !== '';
};

const generarComprobanteMatricula = (matriculaId) => {
    const fecha = new Date();
    const anio = fecha.getFullYear();
    const correlativo = String(matriculaId).padStart(6, '0');
    return `COMP-${anio}-${correlativo}`;
};

module.exports = {
    crearRespuestaExitosa,
    crearRespuestaError,
    esNumeroValido,
    convertirANumero,
    textoTieneValor,
    generarComprobanteMatricula
};