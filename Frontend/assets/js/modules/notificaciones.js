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

        if (btnFiltrar && !btnFiltrar.dataset.bound) {
            btnFiltrar.dataset.bound = 'true';
            btnFiltrar.addEventListener('click', aplicarFiltros);
        }

        if (inputBuscar && !inputBuscar.dataset.bound) {
            inputBuscar.dataset.bound = 'true';
            inputBuscar.addEventListener('input', aplicarFiltros);
        }

        if (selectTipo && !selectTipo.dataset.bound) {
            selectTipo.dataset.bound = 'true';
            selectTipo.addEventListener('change', aplicarFiltros);
        }
    }

    async function cargarNotificaciones() {
        const contenedor = document.getElementById('lista-notificaciones');

        try {
            if (contenedor) {
                contenedor.innerHTML = '<div class="matricula-empty">Cargando notificaciones...</div>';
            }

            const response = await window.ApiService.obtenerNotificaciones();
            const payload = response?.data ?? response ?? {};

            if (Array.isArray(payload)) {
                notificaciones = payload;
                notificacionesFiltradas = [...notificaciones];
                renderResumen(calcularResumen(notificaciones));
                renderLista();
                return;
            }

            notificaciones = Array.isArray(payload.notificaciones)
                ? payload.notificaciones
                : Array.isArray(payload.Notificaciones)
                    ? payload.Notificaciones
                    : [];

            notificacionesFiltradas = [...notificaciones];
            renderResumen(payload.resumen || payload.Resumen || calcularResumen(notificaciones));
            renderLista();
        } catch (error) {
            console.error('Error cargando notificaciones:', error);
            if (contenedor) {
                contenedor.innerHTML = '<div class="matricula-empty">Error cargando notificaciones.</div>';
            }
            window.UI.showMessage(
                'notificaciones-message',
                'danger',
                error.message || 'No se pudieron cargar las notificaciones.'
            );
        }
    }

    function aplicarFiltros() {
        const texto = String(document.getElementById('filtro-notificacion-buscar')?.value || '')
            .trim()
            .toLowerCase();

        const tipo = String(document.getElementById('filtro-notificacion-tipo')?.value || '')
            .trim()
            .toLowerCase();

        notificacionesFiltradas = notificaciones.filter((item) => {
            const titulo = String(item.Titulo || item.titulo || '').toLowerCase();
            const descripcion = String(item.Descripcion || item.descripcion || '').toLowerCase();
            const tipoNotif = String(item.TipoNotificacion || item.tipo || '').toLowerCase();

            const coincideTexto =
                !texto ||
                titulo.includes(texto) ||
                descripcion.includes(texto);

            const coincideTipo =
                !tipo || tipoNotif === tipo;

            return coincideTexto && coincideTipo;
        });

        renderLista();
    }

    function renderResumen(resumen) {
        setText('notif-total', resumen.Total ?? resumen.total ?? 0);
        setText('notif-matriculas', resumen.Matriculas ?? resumen.matriculas ?? 0);
        setText('notif-pagos', resumen.Pagos ?? resumen.pagos ?? 0);
        setText('notif-financieras', resumen.Financieras ?? resumen.financieras ?? 0);
        setText('notif-auditoria', resumen.Auditoria ?? resumen.auditoria ?? 0);
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
                ${notificacionesFiltradas.map((item) => {
                    const tipo = item.TipoNotificacion || item.tipo || '';
                    const fecha = item.FechaEvento || item.Fecha || item.fecha || null;
                    const estadoReferencia = item.EstadoReferencia || item.estadoReferencia || '';

                    return `
                        <div class="notif-item ${esUrgente(item) ? 'unread' : ''}">
                            <div class="notif-icon">${obtenerIcono(tipo)}</div>
                            <div class="notif-text">
                                <strong>${escapeHtml(item.Titulo || item.titulo || '')}</strong>
                                <span>${escapeHtml(item.Descripcion || item.descripcion || '')}</span>
                                <div class="mt-1 text-sm text-muted">
                                    ${escapeHtml(tipo)}
                                    · ${escapeHtml(formatearFecha(fecha))}
                                    ${estadoReferencia ? ` · ${escapeHtml(estadoReferencia)}` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    function calcularResumen(items) {
        const resumen = {
            Total: items.length,
            Matriculas: 0,
            Pagos: 0,
            Financieras: 0,
            Auditoria: 0
        };

        items.forEach((item) => {
            const tipo = String(item.TipoNotificacion || item.tipo || '').trim().toUpperCase();

            if (tipo === 'MATRICULA') resumen.Matriculas += 1;
            else if (tipo === 'PAGO') resumen.Pagos += 1;
            else if (tipo === 'FINANCIERA') resumen.Financieras += 1;
            else if (tipo === 'AUDITORIA') resumen.Auditoria += 1;
        });

        return resumen;
    }

    function esUrgente(item) {
        const estado = String(item.EstadoReferencia || item.estadoReferencia || '').toLowerCase();
        return estado === 'pendiente' || estado === 'vencido';
    }

    function obtenerIcono(tipo) {
        switch (String(tipo || '').toUpperCase()) {
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
        return Number.isNaN(fecha.getTime())
            ? 'N/D'
            : fecha.toLocaleString('es-CR');
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