window.Router = {
    async loadPage(pagePath, title, subtitle) {
        const dashboard = document.getElementById('dashboard-home');
        const dynamicContainer = document.getElementById('dynamic-page-container');

        if (!dynamicContainer) {
            throw new Error('No se encontró el contenedor dinámico de páginas.');
        }

        if (dashboard) {
            dashboard.classList.add('hidden');
            dashboard.innerHTML = '';
        }

        dynamicContainer.classList.remove('hidden');
        UI.setPageHeader(title, subtitle);

        const response = await fetch(pagePath, {
            cache: 'no-store',
            headers: {
                Accept: 'text/html'
            }
        });

        if (!response.ok) {
            throw new Error(`No se pudo cargar la página: ${pagePath}`);
        }

        const html = await response.text();
        dynamicContainer.innerHTML = html;

        await this.initModule(pagePath);
    },

    async initModule(pagePath) {
        const fileName = pagePath.split('/').pop().replace('.html', '');
        const moduleName = this.toCamelCase(fileName);

        try {
            await this.ensureModuleLoaded(fileName, moduleName);

            if (
                window.Modules &&
                window.Modules[moduleName] &&
                typeof window.Modules[moduleName].init === 'function'
            ) {
                await window.Modules[moduleName].init();
            } else {
                throw new Error(`No existe o no está listo el módulo JS para la página "${moduleName}".`);
            }
        } catch (error) {
            console.error('No se pudo inicializar módulo:', error);
            throw error;
        }
    },

    async ensureModuleLoaded(fileName, moduleName) {
        window.Modules = window.Modules || {};

        if (
            window.Modules[moduleName] &&
            typeof window.Modules[moduleName].init === 'function'
        ) {
            return;
        }

        const scriptPath = `./assets/js/${fileName}.js`;

        const existingScript = document.querySelector(`script[data-module="${fileName}"]`);
        if (existingScript) {
            await this.waitForModule(moduleName, 1500);
            return;
        }

        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = scriptPath;
            script.async = false;
            script.defer = false;
            script.dataset.module = fileName;

            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`No se pudo cargar el script del módulo: ${scriptPath}`));

            document.body.appendChild(script);
        });

        await this.waitForModule(moduleName, 1500);
    },

    async waitForModule(moduleName, timeout = 1500) {
        const start = Date.now();

        while (Date.now() - start < timeout) {
            if (
                window.Modules &&
                window.Modules[moduleName] &&
                typeof window.Modules[moduleName].init === 'function'
            ) {
                return;
            }

            await new Promise((resolve) => setTimeout(resolve, 50));
        }

        throw new Error(`El módulo "${moduleName}" no quedó registrado en window.Modules.`);
    },

    toCamelCase(text) {
        return text
            .split('-')
            .map((word, index) =>
                index === 0
                    ? word
                    : word.charAt(0).toUpperCase() + word.slice(1)
            )
            .join('');
    },

    showDashboard() {
        const dashboard = document.getElementById('dashboard-home');
        const dynamicContainer = document.getElementById('dynamic-page-container');

        if (dynamicContainer) {
            dynamicContainer.innerHTML = '';
            dynamicContainer.classList.add('hidden');
        }

        if (dashboard) {
            dashboard.classList.remove('hidden');
        }

        UI.setPageHeader('Dashboard', 'Resumen general del sistema');
    }
};