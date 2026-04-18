window.Modules = window.Modules || {};

window.Modules.estudianteCambiarPassword = (function () {
    async function init() {
        configurarEventos();
    }

    function configurarEventos() {
        const btn = document.getElementById('btn-cambiar-password');

        if (btn && !btn.dataset.bound) {
            btn.dataset.bound = 'true';
            btn.addEventListener('click', manejarCambioPassword);
        }
    }

    async function manejarCambioPassword() {
        const session = window.Auth.getSession();

        if (!session?.estudianteId || session?.role !== 'estudiante') {
            window.UI.showMessage(
                'password-message',
                'danger',
                'Solo el estudiante puede cambiar su contraseña.'
            );
            return;
        }

        const actual = String(document.getElementById('pass-actual')?.value || '').trim();
        const nueva = String(document.getElementById('pass-nueva')?.value || '').trim();
        const confirmar = String(document.getElementById('pass-confirmar')?.value || '').trim();

        window.UI.clearMessage('password-message');

        if (!actual || !nueva || !confirmar) {
            window.UI.showMessage('password-message', 'danger', 'Debe completar todos los campos.');
            return;
        }

        if (nueva !== confirmar) {
            window.UI.showMessage(
                'password-message',
                'danger',
                'La confirmación no coincide con la nueva contraseña.'
            );
            return;
        }

        if (nueva.length < 8) {
            window.UI.showMessage(
                'password-message',
                'danger',
                'La nueva contraseña debe tener al menos 8 caracteres.'
            );
            return;
        }

        try {
            await window.ApiService.cambiarPassword({
                actual,
                nueva
            });

            window.UI.showMessage(
                'password-message',
                'success',
                'La contraseña se actualizó correctamente.'
            );

            document.getElementById('pass-actual').value = '';
            document.getElementById('pass-nueva').value = '';
            document.getElementById('pass-confirmar').value = '';

            const sesionActual = window.Auth.getSession();
            if (sesionActual?.debeCambiarPassword) {
                sesionActual.debeCambiarPassword = false;
                sesionActual.passwordTemporal = false;
                window.StorageManager.set(window.APP_CONFIG.STORAGE_KEYS.SESSION, sesionActual);

                if (window.SessionUser?.set) {
                    window.SessionUser.set(sesionActual);
                }
            }
        } catch (error) {
            console.error('Error cambiando contraseña:', error);
            window.UI.showMessage(
                'password-message',
                'danger',
                error.message || 'No se pudo actualizar la contraseña.'
            );
        }
    }

    return {
        init
    };
})();