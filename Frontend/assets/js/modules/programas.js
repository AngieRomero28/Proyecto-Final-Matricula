window.Modules = window.Modules || {};

window.Modules.programas = (function () {
    let programas = [];
    let programasFiltrados = [];

    async function init() {
        await cargarProgramas();
        configurarEventos();
    }

    function configurarEventos() {
        const btnFiltrar = document.getElementById('btn-filtrar-programas');
        const inputBuscar = document.getElementById('filtro-programa-buscar');
        const btnNuevo = document.getElementById('btn-nuevo-programa');

        if (btnFiltrar) {
            btnFiltrar.addEventListener('click', aplicarFiltros);
        }

        if (inputBuscar) {
            inputBuscar.addEventListener('input', aplicarFiltros);
        }

        if (btnNuevo) {
            btnNuevo.addEventListener('click', mostrarAvisoNuevoPrograma);
        }
    }

    async function cargarProgramas() {
        const tabla = document.getElementById('tabla-programas');

        try {
            if (tabla) {
                tabla.innerHTML = `<tr><td colspan="5">Cargando programas...</td></tr>`;
            }

            const response = await ApiService.obtenerProgramas();
            programas = Array.isArray(response.data) ? response.data : [];
            programasFiltrados = [...programas];

            renderResumen();
            renderTabla();
        } catch (error) {
            console.error('Error cargando programas:', error);
            if (tabla) {
                tabla.innerHTML = `<tr><td colspan="5">Error cargando programas</td></tr>`;
            }
            UI.showMessage('programas-message', 'danger', error.message || 'No se pudieron cargar los programas.');
        }
    }

    function aplicarFiltros() {
        const texto = String(document.getElementById('filtro-programa-buscar')?.value || '').trim().toLowerCase();

        programasFiltrados = programas.filter((programa) => {
            return (
                !texto ||
                String(programa.CodigoPrograma || '').toLowerCase().includes(texto) ||
                String(programa.NombrePrograma || '').toLowerCase().includes(texto)
            );
        });

        renderResumen();
        renderTabla();
    }

    function renderResumen() {
        const total = programasFiltrados.length;
        const totalEstudiantes = programasFiltrados.reduce((acc, item) => acc + Number(item.TotalEstudiantes || 0), 0);
        const promedio = total > 0 ? Math.round(totalEstudiantes / total) : 0;

        setText('programas-total', total);
        setText('programas-estudiantes', totalEstudiantes);
        setText('programas-promedio', promedio);
    }

    function renderTabla() {
        const tabla = document.getElementById('tabla-programas');
        if (!tabla) return;

        if (!programasFiltrados.length) {
            tabla.innerHTML = `<tr><td colspan="5">No hay programas para mostrar</td></tr>`;
            return;
        }

        tabla.innerHTML = programasFiltrados.map((programa) => `
            <tr>
                <td>${programa.ProgramaAcademicoID}</td>
                <td class="font-mono">${escapeHtml(programa.CodigoPrograma || '')}</td>
                <td>${escapeHtml(programa.NombrePrograma || '')}</td>
                <td>${programa.TotalEstudiantes ?? 0}</td>
                <td>
                    <button class="btn btn-outline" onclick="Modules.programas.verDetalle(${programa.ProgramaAcademicoID})">
                        Ver
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async function verDetalle(id) {
        try {
            const response = await ApiService.obtenerProgramaPorId(id);
            const programa = response.data || {};

            UI.openModal({
                title: `Programa #${programa.ProgramaAcademicoID || ''}`,
                body: `
                    <div class="resumen-financiero">
                        <div class="mini-card">
                            <div class="mini-card-label">ID</div>
                            <div class="mini-card-value">${programa.ProgramaAcademicoID || 'N/D'}</div>
                        </div>
                        <div class="mini-card">
                            <div class="mini-card-label">Código</div>
                            <div class="mini-card-value">${escapeHtml(programa.CodigoPrograma || '')}</div>
                        </div>
                        <div class="mini-card">
                            <div class="mini-card-label">Estudiantes</div>
                            <div class="mini-card-value">${programa.TotalEstudiantes || 0}</div>
                        </div>
                    </div>

                    <div class="mt-2">
                        <p><strong>Nombre del programa:</strong> ${escapeHtml(programa.NombrePrograma || '')}</p>
                        <p><strong>Código:</strong> ${escapeHtml(programa.CodigoPrograma || '')}</p>
                        <p><strong>Total de estudiantes:</strong> ${programa.TotalEstudiantes || 0}</p>
                    </div>
                `,
                hideFooter: true
            });
        } catch (error) {
            console.error('Error obteniendo detalle del programa:', error);
            UI.showMessage('programas-message', 'danger', error.message || 'No se pudo obtener el detalle del programa.');
        }
    }

    function mostrarAvisoNuevoPrograma() {
        UI.openModal({
            title: 'Gestión de programas',
            body: `
                <div class="alert alert-info">
                    Este módulo ya consulta programas reales desde la base de datos.
                    <br><br>
                    La creación y edición de programas todavía no está habilitada en el backend actual.
                    Cuando quieras, seguimos con esa parte y te doy endpoints y formularios completos.
                </div>
            `,
            hideFooter: true
        });
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
        init,
        verDetalle
    };
})();