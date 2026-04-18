window.Modules = window.Modules || {};

window.Modules.historialAcademico = (function () {
    let historial = [];
    let historialFiltrado = [];

    async function init() {
        await cargarHistorial();
        configurarEventos();
    }

    function configurarEventos() {
        const btnFiltrar = document.getElementById('btn-filtrar-historial');
        const inputFiltro = document.getElementById('filtro-historial');

        if (btnFiltrar && !btnFiltrar.dataset.bound) {
            btnFiltrar.dataset.bound = 'true';
            btnFiltrar.addEventListener('click', aplicarFiltros);
        }

        if (inputFiltro && !inputFiltro.dataset.bound) {
            inputFiltro.dataset.bound = 'true';
            inputFiltro.addEventListener('input', aplicarFiltros);
        }
    }

    async function cargarHistorial() {
        const session = Auth.getSession();
        const tabla = document.getElementById('tabla-historial');

        if (!session?.estudianteId) {
            UI.showMessage('historial-message', 'danger', 'No se encontró la sesión del estudiante.');
            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="4">No se encontró la sesión del estudiante.</td></tr>';
            }
            return;
        }

        try {
            const response = await ApiService.obtenerHistorialAcademicoEstudiante(session.estudianteId);
            historial = Array.isArray(response.data) ? response.data : [];
            historialFiltrado = [...historial];
            renderTabla();
        } catch (error) {
            console.error('Error cargando historial académico:', error);
            UI.showMessage('historial-message', 'danger', error.message || 'No se pudo cargar el historial.');

            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="4">Error cargando historial académico.</td></tr>';
            }
        }
    }

    function aplicarFiltros() {
        const texto = String(document.getElementById('filtro-historial')?.value || '').trim().toLowerCase();

        historialFiltrado = historial.filter((item) => {
            return (
                !texto ||
                String(item.CodigoCurso || '').toLowerCase().includes(texto) ||
                String(item.NombreCurso || '').toLowerCase().includes(texto) ||
                String(item.PeriodoCursado || '').toLowerCase().includes(texto)
            );
        });

        renderTabla();
    }

    function renderTabla() {
        const tabla = document.getElementById('tabla-historial');
        if (!tabla) return;

        if (!historialFiltrado.length) {
            tabla.innerHTML = '<tr><td colspan="4">No hay registros en el historial.</td></tr>';
            return;
        }

        tabla.innerHTML = historialFiltrado.map((item) => `
            <tr>
                <td>
                    <strong>${escapeHtml(item.CodigoCurso || '')}</strong><br>
                    ${escapeHtml(item.NombreCurso || '')}
                </td>
                <td>${escapeHtml(item.PeriodoCursado || construirPeriodoTexto(item))}</td>
                <td>${escapeHtml(item.Calificacion ?? '—')}</td>
                <td>
                    <span class="badge ${getBadgeEstado(item.EstadoCurso)}">
                        ${escapeHtml(item.EstadoCurso || 'N/D')}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    return {
        init
    };
})();