window.UI = {
    modalConfirmHandler: null,

    showLoader() {
        const loader = document.getElementById('app-loader');
        if (loader) loader.classList.remove('hidden');
    },

    hideLoader() {
        const loader = document.getElementById('app-loader');
        if (loader) loader.classList.add('hidden');
    },

    showMessage(containerId, type, message) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    },

    clearMessage(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
    },

    async loadComponent(containerId, path) {
        const container = document.getElementById(containerId);
        if (!container) return;

        try {
            const response = await fetch(path, {
                cache: 'no-store',
                headers: {
                    'Accept': 'text/html'
                }
            });

            if (!response.ok) {
                throw new Error(`No se pudo cargar el componente: ${path}`);
            }

            const html = await response.text();
            container.innerHTML = html;
        } catch (error) {
            console.error(`Error cargando componente ${path}:`, error);
            container.innerHTML = '';
            throw error;
        }
    },

    setPageHeader(title, subtitle = '') {
        const pageTitle = document.getElementById('page-title');
        const pageSubtitle = document.getElementById('page-subtitle');

        if (pageTitle) pageTitle.textContent = title;
        if (pageSubtitle) pageSubtitle.textContent = subtitle;
    },

    openModal({
        title = 'Modal',
        body = '',
        showFooter = true,
        hideFooter = false,
        onConfirm = null
    } = {}) {
        const overlay = document.getElementById('global-modal-overlay');
        const titleEl = document.getElementById('global-modal-title');
        const bodyEl = document.getElementById('global-modal-body');
        const footerEl = document.getElementById('global-modal-footer');

        if (!overlay || !titleEl || !bodyEl || !footerEl) return;

        this.modalConfirmHandler = typeof onConfirm === 'function' ? onConfirm : null;

        titleEl.textContent = title;
        bodyEl.innerHTML = body;

        const visibleFooter = hideFooter ? false : showFooter;
        footerEl.style.display = visibleFooter ? 'flex' : 'none';

        overlay.classList.add('open');
    },

    async confirmModal() {
        if (typeof this.modalConfirmHandler !== 'function') {
            this.closeModal();
            return;
        }

        try {
            await this.modalConfirmHandler();
        } catch (error) {
            console.error('Error en confirmModal:', error);
        }
    },

    closeModal() {
        const overlay = document.getElementById('global-modal-overlay');
        if (!overlay) return;

        overlay.classList.remove('open');
        this.modalConfirmHandler = null;
    },

    showPageLoader() {
        const loader = document.getElementById('page-loader');
        if (loader) loader.classList.remove('hidden');
    },

    hidePageLoader() {
        const loader = document.getElementById('page-loader');
        if (loader) loader.classList.add('hidden');
    }
};