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

        if (btnFiltrar && !btnFiltrar.dataset.bound) {
            btnFiltrar.dataset.bound = 'true';
            btnFiltrar.addEventListener('click', aplicarFiltros);
        }

        if (inputBuscar && !inputBuscar.dataset.bound) {
            inputBuscar.dataset.bound = 'true';
            inputBuscar.addEventListener('input', aplicarFiltros);
        }

        if (btnNuevo && !btnNuevo.dataset.bound) {
            btnNuevo.dataset.bound = 'true';
            btnNuevo.addEventListener('click', mostrarAvisoNuevoPrograma);
        }
    }

    async function cargarProgramas() {
        const tabla = document.getElementById('tabla-programas');

        try {
            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="5">Cargando programas...</td></tr>';
            }

            const response = await window.ApiService.obtenerProgramas();
            programas = Array.isArray(response.data) ? response.data : [];
            programasFiltrados = [...programas];

            renderResumen();
            renderTabla();
        } catch (error) {
            console.error('Error cargando programas:', error);
            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="5">Error cargando programas</td></tr>';
            }
            window.UI.showMessage(
                'programas-message',
                'danger',
                error.message || 'No se pudieron cargar los programas.'
            );
        }
    }

    function aplicarFiltros() {
        const texto = String(document.getElementById('filtro-programa-buscar')?.value || '')
            .trim()
            .toLowerCase();

        programasFiltrados = programas.filter((programa) => {
            return (
                !texto ||
                String(programa.CodigoPrograma || programa.Codigo || '').toLowerCase().includes(texto) ||
                String(programa.NombrePrograma || programa.Nombre || '').toLowerCase().includes(texto)
            );
        });

        renderResumen();
        renderTabla();
    }

    function renderResumen() {
        const total = programasFiltrados.length;
        const totalEstudiantes = programasFiltrados.reduce(
            (acc, item) => acc + Number(item.TotalEstudiantes || 0),
            0
        );
        const promedio = total > 0 ? Math.round(totalEstudiantes / total) : 0;

        setText('programas-total', total);
        setText('programas-estudiantes', totalEstudiantes);
        setText('programas-promedio', promedio);
    }

    function renderTabla() {
        const tabla = document.getElementById('tabla-programas');
        if (!tabla) return;

        if (!programasFiltrados.length) {
            tabla.innerHTML = '<tr><td colspan="5">No hay programas para mostrar</td></tr>';
            return;
        }

        tabla.innerHTML = programasFiltrados.map((programa) => `
            <tr>
                <td>${escapeHtml(programa.ProgramaAcademicoID || programa.ProgramaID || '')}</td>
                <td class="font-mono">${escapeHtml(programa.CodigoPrograma || programa.Codigo || '')}</td>
                <td>${escapeHtml(programa.NombrePrograma || programa.Nombre || '')}</td>
                <td>${escapeHtml(programa.TotalEstudiantes ?? 0)}</td>
                <td>
                    <button class="btn btn-outline" onclick="window.Modules.programas.verDetalle(${programa.ProgramaAcademicoID || programa.ProgramaID})">
                        Ver
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async function verDetalle(id) {
        try {
            const response = await window.ApiService.obtenerProgramaPorId(id);
            const programa = response.data || {};

            window.UI.openModal({
                title: `Programa #${programa.ProgramaAcademicoID || programa.ProgramaID || ''}`,
                body: `
                    <div class="resumen-financiero">
                        <div class="mini-card">
                            <div class="mini-card-label">ID</div>
                            <div class="mini-card-value">${programa.ProgramaAcademicoID || programa.ProgramaID || 'N/D'}</div>
                        </div>
                        <div class="mini-card">
                            <div class="mini-card-label">Código</div>
                            <div class="mini-card-value">${escapeHtml(programa.CodigoPrograma || programa.Codigo || '')}</div>
                        </div>
                        <div class="mini-card">
                            <div class="mini-card-label">Estudiantes</div>
                            <div class="mini-card-value">${programa.TotalEstudiantes || 0}</div>
                        </div>
                    </div>

                    <div class="mt-2">
                        <p><strong>Nombre del programa:</strong> ${escapeHtml(programa.NombrePrograma || programa.Nombre || '')}</p>
                        <p><strong>Código:</strong> ${escapeHtml(programa.CodigoPrograma || programa.Codigo || '')}</p>
                        <p><strong>Total de estudiantes:</strong> ${programa.TotalEstudiantes || 0}</p>
                    </div>
                `,
                hideFooter: true
            });
        } catch (error) {
            console.error('Error obteniendo detalle del programa:', error);
            window.UI.showMessage(
                'programas-message',
                'danger',
                error.message || 'No se pudo obtener el detalle del programa.'
            );
        }
    }

    function mostrarAvisoNuevoPrograma() {
        window.UI.openModal({
            title: 'Gestión de programas',
            body: `
                <div class="alert alert-info">
                    Este módulo ya consulta programas reales desde la base de datos.
                    <br><br>
                    La creación y edición de programas todavía no está habilitada en el backend actual.
                </div>
            `,
            hideFooter: true
        });
    }

    return {
        init,
        verDetalle
    };
})();