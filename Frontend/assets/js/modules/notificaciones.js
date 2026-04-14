window.Modules = window.Modules || {};

window.Modules.notificaciones = (function () {
    let notificaciones = [];
    let notificacionesFiltradas = [];

    async function init() {
        await cargarNotificaciones();
        configurarEventos();
    }

    function configurarEventos() {
        const btnFiltrar = document.getElementById('btn-filtrar-notificaciones');
        const inputBuscar = document.getElementById('filtro-notificacion-buscar');
        const selectTipo = document.getElementById('filtro-notificacion-tipo');

        if (btnFiltrar) {
            btnFiltrar.addEventListener('click', aplicarFiltros);
        }

        if (inputBuscar) {
            inputBuscar.addEventListener('input', aplicarFiltros);
        }

        if (selectTipo) {
            selectTipo.addEventListener('change', aplicarFiltros);
        }
    }

    async function cargarNotificaciones() {
        const contenedor = document.getElementById('lista-notificaciones');

        try {
            if (contenedor) {
                contenedor.innerHTML = '<div class="matricula-empty">Cargando notificaciones...</div>';
            }

            const response = await ApiService.obtenerNotificaciones();
            const data = response.data || {};

            notificaciones = Array.isArray(data.notificaciones) ? data.notificaciones : [];
            notificacionesFiltradas = [...notificaciones];

            renderResumen(data.resumen || {});
            renderLista();
        } catch (error) {
            console.error('Error cargando notificaciones:', error);
            if (contenedor) {
                contenedor.innerHTML = '<div class="matricula-empty">Error cargando notificaciones.</div>';
            }
            UI.showMessage('notificaciones-message', 'danger', error.message || 'No se pudieron cargar las notificaciones.');
        }
    }

    function aplicarFiltros() {
        const texto = String(document.getElementById('filtro-notificacion-buscar')?.value || '').trim().toLowerCase();
        const tipo = String(document.getElementById('filtro-notificacion-tipo')?.value || '').trim();

        notificacionesFiltradas = notificaciones.filter((item) => {
            const coincideTexto =
                !texto ||
                String(item.Titulo || '').toLowerCase().includes(texto) ||
                String(item.Descripcion || '').toLowerCase().includes(texto);

            const coincideTipo =
                !tipo || String(item.TipoNotificacion || '') === tipo;

            return coincideTexto && coincideTipo;
        });

        renderLista();
    }

    function renderResumen(resumen) {
        setText('notif-total', resumen.Total ?? 0);
        setText('notif-matriculas', resumen.Matriculas ?? 0);
        setText('notif-pagos', resumen.Pagos ?? 0);
        setText('notif-financieras', resumen.Financieras ?? 0);
        setText('notif-auditoria', resumen.Auditoria ?? 0);
    }

    function renderLista() {
        const contenedor = document.getElementById('lista-notificaciones');
        if (!contenedor) return;

        if (!notificacionesFiltradas.length) {
            contenedor.innerHTML = '<div class="matricula-empty">No hay notificaciones para mostrar.</div>';
            return;
        }

        contenedor.innerHTML = `
            <div class="notif-list">
                ${notificacionesFiltradas.map((item) => `
                    <div class="notif-item ${esUrgente(item) ? 'unread' : ''}">
                        <div class="notif-icon">${obtenerIcono(item.TipoNotificacion)}</div>
                        <div class="notif-text">
                            <strong>${escapeHtml(item.Titulo || '')}</strong>
                            <span>${escapeHtml(item.Descripcion || '')}</span>
                            <div class="mt-1 text-sm text-muted">
                                ${escapeHtml(item.TipoNotificacion || '')}
                                · ${formatearFecha(item.FechaEvento)}
                                ${item.EstadoReferencia ? ` · ${escapeHtml(item.EstadoReferencia)}` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function esUrgente(item) {
        const estado = String(item.EstadoReferencia || '').toLowerCase();
        return estado === 'pendiente' || estado === 'vencido';
    }

    function obtenerIcono(tipo) {
        switch (tipo) {
            case 'MATRICULA':
                return '📝';
            case 'PAGO':
                return '💰';
            case 'FINANCIERA':
                return '⚠️';
            case 'AUDITORIA':
                return '🛡️';
            default:
                return '🔔';
        }
    }

    function formatearFecha(valor) {
        if (!valor) return 'N/D';
        const fecha = new Date(valor);
        return Number.isNaN(fecha.getTime()) ? 'N/D' : fecha.toLocaleString();
    }

    function setText(id, value) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = value;
        }
    }

    function escapeHtml(texto) {
        return String(texto ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    return {
        init
    };
})();