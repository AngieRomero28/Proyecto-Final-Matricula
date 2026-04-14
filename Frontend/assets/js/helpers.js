window.Helpers = {
    getInitials(name = '') {
        return name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map(part => part.charAt(0).toUpperCase())
            .join('');
    },

    formatCurrency(value) {
        const number = Number(value || 0);
        return new Intl.NumberFormat('es-CR', {
            style: 'currency',
            currency: 'CRC',
            minimumFractionDigits: 2
        }).format(number);
    },

    safeText(value, fallback = 'N/D') {
        if (value === null || value === undefined || value === '') {
            return fallback;
        }
        return String(value);
    }
};