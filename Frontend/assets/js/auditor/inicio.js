window.Modules = window.Modules || {};

window.Modules.auditorInicio = (function () {
    async function init() {
        await cargarInicioAuditor();
    }

    async function cargarInicioAuditor() {
        const tabla = document.getElementById('tabla-auditor-inicio');

        try {
            const response = await window.ApiService.obtenerAuditoria();
            const eventos = Array.isArray(response.data) ? response.data : [];

            const usuariosUnicos = new Set(
                eventos
                    .map((item) => String(item.Usuario || item.username || '').trim())
                    .filter(Boolean)
            ).size;

            const consultas = eventos.filter((item) =>
                String(item.Accion || item.accion || '').toLowerCase().includes('consulta')
            ).length;

            const criticos = eventos.filter((item) => {
                const accion = String(item.Accion || item.accion || '').toLowerCase();
                return (
                    accion.includes('elimin') ||
                    accion.includes('anulad') ||
                    accion.includes('bloque') ||
                    accion.includes('cambio') ||
                    accion.includes('actualiz')
                );
            }).length;

            setText('auditor-total-eventos', eventos.length);
            setText('auditor-total-usuarios', usuariosUnicos);
            setText('auditor-total-consultas', consultas);
            setText('auditor-total-criticos', criticos);

            renderTabla(eventos);
        } catch (error) {
            console.error('Error cargando inicio del auditor:', error);
            window.UI.showMessage(
                'auditor-inicio-message',
                'danger',
                error.message || 'No se pudo cargar la actividad reciente.'
            );

            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="4">Error cargando actividad.</td></tr>';
            }
        }
    }

    function renderTabla(eventos) {
        const tabla = document.getElementById('tabla-auditor-inicio');
        if (!tabla) return;

        const recientes = [...eventos]
            .sort((a, b) => {
                const fechaA = new Date(a.Fecha || a.fecha || 0).getTime();
                const fechaB = new Date(b.Fecha || b.fecha || 0).getTime();
                return fechaB - fechaA;
            })
            .slice(0, 12);

        if (!recientes.length) {
            tabla.innerHTML = '<tr><td colspan="4">No hay actividad registrada.</td></tr>';
            return;
        }

        tabla.innerHTML = recientes.map((item) => `
            <tr>
                <td>${escapeHtml(formatearFecha(item.Fecha || item.fecha))}</td>
                <td>${escapeHtml(item.Usuario || item.username || 'N/D')}</td>
                <td>${escapeHtml(item.Accion || item.accion || 'N/D')}</td>
                <td>${escapeHtml(item.Descripcion || item.descripcion || 'Sin descripción')}</td>
            </tr>
        `).join('');
    }

    return {
        init
    };
})();