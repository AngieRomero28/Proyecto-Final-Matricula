window.StorageManager = {
    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },

    get(key) {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    },

    remove(key) {
        localStorage.removeItem(key);
    },

    has(key) {
        return localStorage.getItem(key) !== null;
    },

    clearSession() {
        localStorage.removeItem(window.APP_CONFIG?.STORAGE_KEYS?.SESSION || 'smu_session');
    },

    clearAll() {
        localStorage.clear();
    }
};