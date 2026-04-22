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

        const candidates = this.getComponentPathCandidates(path);

        for (const candidate of candidates) {
            try {
                const response = await fetch(candidate, {
                    cache: 'no-store',
                    headers: {
                        Accept: 'text/html'
                    }
                });

                if (!response.ok) {
                    continue;
                }

                const html = await response.text();
                container.innerHTML = html;
                return;
            } catch (error) {
                console.warn(`Intento fallido cargando componente desde ${candidate}:`, error);
            }
        }

        const fallback = this.getInlineComponentFallback(path);
        if (fallback) {
            container.innerHTML = fallback;
            console.warn(`Se usó fallback inline para el componente: ${path}`);
            return;
        }

        container.innerHTML = '';
        throw new Error(`No se pudo cargar el componente: ${path}`);
    },

    getComponentPathCandidates(path) {
        const cleanPath = String(path || '').trim();
        if (!cleanPath) return [];

        const withoutDot = cleanPath.replace(/^\.\//, '');
        const fileName = withoutDot.split('/').pop();

        const candidates = [
            cleanPath,
            `/${withoutDot}`,
            `./${withoutDot}`,
            withoutDot,
            `./assets/components/${fileName}`,
            `/assets/components/${fileName}`,
            `assets/components/${fileName}`,
            `./components/${fileName}`,
            `/components/${fileName}`,
            `components/${fileName}`,
            `./${fileName}`,
            `/${fileName}`,
            fileName
        ];

        return [...new Set(candidates)];
    },

    getInlineComponentFallback(path) {
        const fileName = String(path || '').split('/').pop()?.toLowerCase();

        const fallbacks = {
            'footer.html': `
                <footer class="app-footer">
                    <div class="app-footer-left">
                        <strong>Sistema de Matrícula Universitaria</strong>
                        <span>Versión 1.0.0</span>
                    </div>

                    <div class="app-footer-right">
                        <span>Frontend HTML · CSS · JavaScript</span>
                    </div>
                </footer>
            `,
            'loaders.html': `
                <div id="page-loader" class="page-loader hidden">
                    <div class="page-loader-box">
                        <div class="page-loader-spinner"></div>
                        <p>Cargando información...</p>
                    </div>
                </div>
            `,
            'modals.html': `
                <div id="global-modal-overlay" class="modal-overlay">
                    <div class="modal">
                        <div class="modal-header">
                            <h3 id="global-modal-title">Modal</h3>
                            <button type="button" class="btn btn-outline" id="global-modal-close-btn">Cerrar</button>
                        </div>

                        <div class="modal-body" id="global-modal-body">
                            Contenido del modal.
                        </div>

                        <div class="modal-footer" id="global-modal-footer">
                            <button type="button" class="btn btn-outline" id="global-modal-cancel-btn">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="global-modal-confirm-btn">Aceptar</button>
                        </div>
                    </div>
                </div>
            `,
            'topbar-base.html': `
                <div class="topbar">
                    <div class="topbar-title">
                        <h1 id="topbar-title">Dashboard</h1>
                        <p id="topbar-subtitle">Resumen general del sistema</p>
                    </div>

                    <div class="topbar-right">
                        <button class="btn btn-outline" id="btn-notificaciones">
                            🔔
                        </button>

                        <button class="btn btn-outline" id="btn-logout">
                            Cerrar sesión
                        </button>
                    </div>
                </div>
            `,
            'topbar.html': `
                <div class="topbar">
                    <div class="topbar-title">
                        <h1 id="topbar-title">Dashboard</h1>
                        <p id="topbar-subtitle">Resumen general del sistema</p>
                    </div>

                    <div class="topbar-right">
                        <button class="btn btn-outline" id="btn-notificaciones">
                            🔔
                        </button>

                        <button class="btn btn-outline" id="btn-logout">
                            Cerrar sesión
                        </button>
                    </div>
                </div>
            `,
            'sidebar.html': `
                <div class="sidebar">
                    <div class="sidebar-brand">
                        <h2>🎓 Sistema de Matrícula</h2>
                        <span>Universidad</span>
                    </div>

                    <div class="sidebar-user">
                        <div class="user-avatar" id="sidebar-user-avatar">U</div>
                        <div class="user-info">
                            <strong id="sidebar-user-name">Usuario</strong>
                            <span id="sidebar-user-role">Rol</span>
                        </div>
                    </div>

                    <div class="nav-section">
                        <div class="nav-section-label">General</div>

                        <button class="nav-item active" data-action="dashboard">
                            <span>🏠</span>
                            <span>Inicio</span>
                        </button>
                    </div>

                    <div class="nav-section">
                        <div class="nav-section-label">Navegación</div>

                        <div class="nav-item" style="cursor: default; opacity: 0.8;">
                            <span>ℹ️</span>
                            <span>El menú se cargará según el rol</span>
                        </div>
                    </div>

                    <div class="sidebar-footer">
                        <button class="nav-item" data-action="logout">
                            <span>↩️</span>
                            <span>Cerrar sesión</span>
                        </button>
                    </div>
                </div>
            `
        };

        return fallbacks[fileName] || '';
    },

    setPageHeader(title, subtitle = '') {
        const pageTitle = document.getElementById('page-title');
        const pageSubtitle = document.getElementById('page-subtitle');

        if (pageTitle) pageTitle.textContent = title;
        if (pageSubtitle) pageSubtitle.textContent = subtitle;

        const topbarTitle = document.getElementById('topbar-title');
        const topbarSubtitle = document.getElementById('topbar-subtitle');

        if (topbarTitle) topbarTitle.textContent = title;
        if (topbarSubtitle) topbarSubtitle.textContent = subtitle;
    },

    openModal({
        title = 'Modal',
        body = '',
        showFooter = true,
        hideFooter = false,
        onConfirm = null,
        onOpen = null,
        confirmText = 'Aceptar',
        cancelText = 'Cancelar'
    } = {}) {
        const overlay = document.getElementById('global-modal-overlay');
        const titleEl = document.getElementById('global-modal-title');
        const bodyEl = document.getElementById('global-modal-body');
        const footerEl = document.getElementById('global-modal-footer');
        const confirmBtn = document.getElementById('global-modal-confirm-btn');
        const cancelBtn = document.getElementById('global-modal-cancel-btn');
        const closeBtn = document.getElementById('global-modal-close-btn');

        if (!overlay || !titleEl || !bodyEl || !footerEl) return;

        this.modalConfirmHandler = typeof onConfirm === 'function' ? onConfirm : null;

        titleEl.textContent = title;
        bodyEl.innerHTML = body;

        const visibleFooter = hideFooter ? false : showFooter;
        footerEl.style.display = visibleFooter ? 'flex' : 'none';

        if (confirmBtn) {
            confirmBtn.textContent = confirmText;
            confirmBtn.disabled = false;
        }

        if (cancelBtn) {
            cancelBtn.textContent = cancelText;
            cancelBtn.disabled = false;
            cancelBtn.onclick = () => this.closeModal();
        }

        if (closeBtn) {
            closeBtn.disabled = false;
            closeBtn.onclick = () => this.closeModal();
        }

        if (confirmBtn) {
            confirmBtn.onclick = () => this.confirmModal();
        }

        overlay.classList.add('open');

        if (typeof onOpen === 'function') {
            try {
                onOpen();
            } catch (error) {
                console.error('Error en onOpen del modal:', error);
            }
        }
    },

    async confirmModal() {
        const confirmBtn = document.getElementById('global-modal-confirm-btn');
        const cancelBtn = document.getElementById('global-modal-cancel-btn');
        const closeBtn = document.getElementById('global-modal-close-btn');

        if (typeof this.modalConfirmHandler !== 'function') {
            this.closeModal();
            return;
        }

        try {
            if (confirmBtn) confirmBtn.disabled = true;
            if (cancelBtn) cancelBtn.disabled = true;
            if (closeBtn) closeBtn.disabled = true;

            const result = await this.modalConfirmHandler();

            if (result !== false) {
                this.closeModal();
                return;
            }
        } catch (error) {
            console.error('Error en confirmModal:', error);
        } finally {
            if (confirmBtn) confirmBtn.disabled = false;
            if (cancelBtn) cancelBtn.disabled = false;
            if (closeBtn) closeBtn.disabled = false;
        }
    },

    closeModal() {
        const overlay = document.getElementById('global-modal-overlay');
        const bodyEl = document.getElementById('global-modal-body');
        const titleEl = document.getElementById('global-modal-title');
        const footerEl = document.getElementById('global-modal-footer');
        const confirmBtn = document.getElementById('global-modal-confirm-btn');
        const cancelBtn = document.getElementById('global-modal-cancel-btn');
        const closeBtn = document.getElementById('global-modal-close-btn');

        if (!overlay) return;

        overlay.classList.remove('open');

        this.modalConfirmHandler = null;

        if (titleEl) titleEl.textContent = 'Modal';
        if (bodyEl) bodyEl.innerHTML = '';
        if (footerEl) footerEl.style.display = 'flex';

        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Aceptar';
            confirmBtn.onclick = null;
        }

        if (cancelBtn) {
            cancelBtn.disabled = false;
            cancelBtn.textContent = 'Cancelar';
            cancelBtn.onclick = null;
        }

        if (closeBtn) {
            closeBtn.disabled = false;
            closeBtn.onclick = null;
        }
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