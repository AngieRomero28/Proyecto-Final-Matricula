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
        window.UI.setPageHeader(title, subtitle);

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
        const meta = this.getModuleMeta(pagePath);

        try {
            const hasScript = await this.ensureModuleLoaded(meta);

            if (!hasScript) {
                return;
            }

            const moduleInstance = this.resolveModule(meta.keys);

            if (moduleInstance && typeof moduleInstance.init === 'function') {
                await moduleInstance.init();
                return;
            }

            throw new Error(
                `No existe o no está listo el módulo JS para la página "${meta.fileName}".`
            );
        } catch (error) {
            console.error('No se pudo inicializar módulo:', error);
            throw error;
        }
    },

    async ensureModuleLoaded(meta) {
        window.Modules = window.Modules || {};

        const existingModule = this.resolveModule(meta.keys);
        if (existingModule && typeof existingModule.init === 'function') {
            return true;
        }

        const existingScript = document.querySelector(
            `script[data-module-path="${meta.scriptPath}"]`
        );

        if (existingScript) {
            await this.waitForModule(meta.keys, 2500);
            return true;
        }

        const scriptExists = await this.scriptExists(meta.scriptPath);
        if (!scriptExists) {
            console.warn(`No existe script para la página ${meta.pagePath}: ${meta.scriptPath}`);
            return false;
        }

        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = meta.scriptPath;
            script.async = false;
            script.defer = false;
            script.dataset.module = meta.fileName;
            script.dataset.modulePath = meta.scriptPath;

            script.onload = () => resolve();
            script.onerror = () =>
                reject(new Error(`No se pudo cargar el script del módulo: ${meta.scriptPath}`));

            document.body.appendChild(script);
        });

        await this.waitForModule(meta.keys, 2500);
        return true;
    },

    async scriptExists(scriptPath) {
        try {
            const response = await fetch(scriptPath, {
                method: 'HEAD',
                cache: 'no-store'
            });

            return response.ok;
        } catch (error) {
            console.warn(`No se pudo verificar existencia del script ${scriptPath}:`, error.message);
            return false;
        }
    },

    resolveModule(keys = []) {
        if (!window.Modules) return null;

        for (const key of keys) {
            const mod = window.Modules[key];
            if (mod && typeof mod.init === 'function') {
                return mod;
            }
        }

        return null;
    },

    getModuleMeta(pagePath) {
        const normalized = String(pagePath || '').replace(/\\/g, '/');
        const fileName = this.getFileName(normalized);
        const folder = this.getFolderName(normalized);

        const scriptPath = this.resolveScriptPath(normalized, fileName, folder);
        const keys = this.buildModuleKeys(folder, fileName);

        return {
            pagePath: normalized,
            fileName,
            folder,
            scriptPath,
            keys
        };
    },

    resolveScriptPath(normalizedPagePath, fileName, folder) {
        const folderMap = {
            estudiante: 'estudiante',
            docente: 'docente',
            tesoreria: 'tesoreria',
            auditor: 'auditor',
            admin: 'admin',
            registro: 'registro',
            common: 'common',
            modules: 'modules'
        };

        const targetFolder = folderMap[folder] || folder || 'common';
        return `./assets/js/${targetFolder}/${fileName}.js`;
    },

    buildModuleKeys(folder, fileName) {
        const camelFile = this.toCamelCase(fileName);
        const camelFolder = this.toCamelCase(folder || '');

        const keys = [];

        if (camelFolder) {
            keys.push(`${camelFolder}${this.capitalize(camelFile)}`);
        }

        keys.push(camelFile);

        return [...new Set(keys)];
    },

    async waitForModule(keys, timeout = 2500) {
        const start = Date.now();

        while (Date.now() - start < timeout) {
            const moduleInstance = this.resolveModule(keys);

            if (moduleInstance && typeof moduleInstance.init === 'function') {
                return;
            }

            await new Promise((resolve) => setTimeout(resolve, 50));
        }

        throw new Error(
            `El módulo no quedó registrado. Se esperaba alguna de estas claves: ${keys.join(', ')}`
        );
    },

    getFileName(pagePath) {
        return String(pagePath || '')
            .split('/')
            .pop()
            .replace('.html', '');
    },

    getFolderName(pagePath) {
        const parts = String(pagePath || '')
            .split('/')
            .filter(Boolean);

        const pagesIndex = parts.indexOf('pages');
        if (pagesIndex === -1) {
            return 'common';
        }

        return parts[pagesIndex + 1] || 'common';
    },

    toCamelCase(text) {
        return String(text || '')
            .split('-')
            .filter(Boolean)
            .map((word, index) =>
                index === 0
                    ? word
                    : word.charAt(0).toUpperCase() + word.slice(1)
            )
            .join('');
    },

    capitalize(text) {
        const value = String(text || '');
        return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
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

        window.UI.setPageHeader('Dashboard', 'Resumen general del sistema');
    }
};