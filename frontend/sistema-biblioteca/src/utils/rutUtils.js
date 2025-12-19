export function formatRut(rut) {
    if (!rut) return '';

    // Limpiar el RUT de caracteres no válidos (dejar solo números y k/K)
    let value = rut.replace(/[^0-9kK]/g, '');

    // Limitar el largo máximo (generalmente 9 caracteres: 8 dígitos + 1 verificador)
    if (value.length > 9) {
        value = value.slice(0, 9);
    }

    // Si tiene menos de 2 caracteres, devolver tal cual
    if (value.length < 2) return value;

    // Separar cuerpo y dígito verificador
    const cuerpo = value.slice(0, -1);
    const dv = value.slice(-1).toUpperCase();

    // Formatear el cuerpo con puntos
    let cuerpoFormateado = '';
    for (let i = cuerpo.length - 1, j = 0; i >= 0; i--, j++) {
        cuerpoFormateado = cuerpo.charAt(i) + cuerpoFormateado;
        if (j % 3 === 2 && i !== 0) {
            cuerpoFormateado = '.' + cuerpoFormateado;
        }
    }

    return `${cuerpoFormateado}-${dv}`;
}

export function validateRut(rut) {
    if (!rut) return false;

    // Limpiar el RUT
    const value = rut.replace(/[^0-9kK]/g, '');

    // Validar largo mínimo (al menos 7 dígitos + dígito verificador = 8 caracteres)
    if (value.length < 8) return false;

    // Separar cuerpo y dígito verificador
    const cuerpo = value.slice(0, -1);
    const dv = value.slice(-1).toUpperCase();

    // Validar que el cuerpo sea numérico
    if (!/^\d+$/.test(cuerpo)) return false;

    // Calcular dígito verificador esperado
    let suma = 0;
    let multiplicador = 2;

    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += parseInt(cuerpo.charAt(i)) * multiplicador;
        multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }

    const resto = 11 - (suma % 11);
    let dvEsperado = '0';

    if (resto === 11) dvEsperado = '0';
    else if (resto === 10) dvEsperado = 'K';
    else dvEsperado = resto.toString();

    return dv === dvEsperado;
}
