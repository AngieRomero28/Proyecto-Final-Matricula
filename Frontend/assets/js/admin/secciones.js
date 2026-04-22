// frontend/js/admin/secciones.js

window.Modules = window.Modules || {};

window.Modules.adminSecciones = (function () {
    let secciones = [];
    let seccionesFiltradas = [];
    let cursos = [];
    let periodos = [];
    let docentes = [];

    async function init() {
        await cargarCatalogos();
        await cargarSecciones();
        configurarEventos();
    }

    function configurarEventos() {
        const btnNueva = document.getElementById('btn-admin-nueva-seccion');
        const btnFiltrar = document.getElementById('btn-filtrar-admin-secciones');
        const inputBuscar = document.getElementById('filtro-admin-secciones');
        const selectEstado = document.getElementById('filtro-admin-estado-seccion');

        if (btnNueva && !btnNueva.dataset.bound) {
            btnNueva.dataset.bound = 'true';
            btnNueva.addEventListener('click', mostrarModalNuevaSeccion);
        }

        if (btnFiltrar && !btnFiltrar.dataset.bound) {
            btnFiltrar.dataset.bound = 'true';
            btnFiltrar.addEventListener('click', aplicarFiltros);
        }

        if (inputBuscar && !inputBuscar.dataset.bound) {
            inputBuscar.dataset.bound = 'true';
            inputBuscar.addEventListener('input', aplicarFiltros);
        }

        if (selectEstado && !selectEstado.dataset.bound) {
            selectEstado.dataset.bound = 'true';
            selectEstado.addEventListener('change', aplicarFiltros);
        }
    }

    async function cargarCatalogos() {
        try {
            const [cursosRes, periodosRes, usuariosRes] = await Promise.all([
                window.ApiService.obtenerCursos(),
                window.ApiService.obtenerPeriodos(),
                window.ApiService.obtenerUsuarios()
            ]);

            cursos = Array.isArray(cursosRes.data) ? cursosRes.data : [];
            periodos = Array.isArray(periodosRes.data) ? periodosRes.data : [];

            const usuarios = Array.isArray(usuariosRes.data) ? usuariosRes.data : [];
            docentes = usuarios.filter((u) => {
                const rol = obtenerRolPrincipal(u).toLowerCase();
                return rol === 'docente';
            });
        } catch (error) {
            console.error('Error cargando catálogos para secciones:', error);
        }
    }

    async function manejarRecargaSecciones() {
        window.UI.clearMessage('admin-secciones-message');

        try {
            await cargarCatalogos();
            await cargarSecciones();
            window.UI.showMessage(
                'admin-secciones-message',
                'success',
                'Listado de secciones actualizado correctamente.'
            );
        } catch (error) {
            window.UI.showMessage(
                'admin-secciones-message',
                'danger',
                error.message || 'No se pudo actualizar el listado.'
            );
        }
    }

    async function cargarSecciones() {
        const tabla = document.getElementById('tabla-admin-secciones');
        if (!tabla) return;

        try {
            tabla.innerHTML = '<tr><td colspan="8">Cargando...</td></tr>';

            const response = await window.ApiService.obtenerSecciones();
            const data = Array.isArray(response.data) ? response.data : [];

            secciones = window.normalizarSecciones
                ? window.normalizarSecciones(data)
                : normalizarSeccionesLocal(data);

            seccionesFiltradas = [...secciones];

            renderResumen(seccionesFiltradas);
            renderTabla();
        } catch (error) {
            console.error('Error cargando secciones:', error);
            tabla.innerHTML = '<tr><td colspan="8">Error cargando datos</td></tr>';
            throw error;
        }
    }

    function aplicarFiltros() {
        const texto = String(document.getElementById('filtro-admin-secciones')?.value || '')
            .trim()
            .toLowerCase();

        const estado = String(document.getElementById('filtro-admin-estado-seccion')?.value || '')
            .trim()
            .toLowerCase();

        seccionesFiltradas = secciones.filter((s) => {
            const coincideTexto =
                !texto ||
                String(s.SeccionID || '').toLowerCase().includes(texto) ||
                String(s.NumeroSeccion || '').toLowerCase().includes(texto) ||
                String(s.NombreCurso || '').toLowerCase().includes(texto) ||
                String(s.CodigoCurso || '').toLowerCase().includes(texto) ||
                String(s.Docente || '').toLowerCase().includes(texto) ||
                String(s.NombrePeriodo || '').toLowerCase().includes(texto);

            const estadoSeccion = String(s.EstadoSeccion || '').trim().toLowerCase();
            const coincideEstado = !estado || estadoSeccion === estado;

            return coincideTexto && coincideEstado;
        });

        renderResumen(seccionesFiltradas);
        renderTabla();
    }

    function normalizarSeccionesLocal(data) {
        const mapa = new Map();

        for (const item of data) {
            const id = Number(item.SeccionID);
            if (!id) continue;

            if (!mapa.has(id)) {
                mapa.set(id, {
                    SeccionID: id,
                    NumeroSeccion: item.NumeroSeccion ?? '',
                    CupoMaximo: Number(item.CupoMaximo ?? 0),
                    CupoDisponible: Number(item.CupoDisponible ?? 0),
                    EstadoSeccion: item.EstadoSeccion ?? '',
                    CursoID: item.CursoID ?? null,
                    CodigoCurso: item.CodigoCurso ?? '',
                    NombreCurso: item.NombreCurso ?? '',
                    PeriodoID: item.PeriodoID ?? null,
                    NombrePeriodo: item.NombrePeriodo ?? '',
                    TipoPeriodo: item.TipoPeriodo ?? '',
                    Anio: item.Anio ?? '',
                    DocenteID: item.DocenteID ?? null,
                    Docente: item.Docente || item.NombreDocente || '',
                    horarios: [],
                    aulas: []
                });
            }

            const seccion = mapa.get(id);

            const horario = construirHorarioDesdeFila(item);
            if (horario && !seccion.horarios.includes(horario)) {
                seccion.horarios.push(horario);
            }

            const aula = construirAulaDesdeFila(item);
            if (aula && !seccion.aulas.includes(aula)) {
                seccion.aulas.push(aula);
            }
        }

        return Array.from(mapa.values()).map((item) => ({
            ...item,
            HorarioTexto: item.horarios.length ? item.horarios.join(' | ') : 'N/D',
            AulaTexto: item.aulas.length ? item.aulas.join(' | ') : 'N/D'
        }));
    }

    function renderResumen(data) {
        const total = data.length;
        const activas = data.filter((s) =>
            ['activa', 'activo'].includes(String(s.EstadoSeccion || '').toLowerCase())
        ).length;
        const cupos = data.reduce((acc, s) => acc + Number(s.CupoDisponible ?? 0), 0);

        setText('admin-secciones-total', total);
        setText('admin-secciones-activas', activas);
        setText('admin-secciones-cupos', cupos);
    }

    function renderTabla() {
        const tabla = document.getElementById('tabla-admin-secciones');
        if (!tabla) return;

        if (!seccionesFiltradas.length) {
            tabla.innerHTML = '<tr><td colspan="8">No hay secciones registradas</td></tr>';
            return;
        }

        tabla.innerHTML = seccionesFiltradas.map((s) => {
            const estado = s.EstadoSeccion || 'N/D';
            const badgeClass = getBadgeEstado(estado);

            return `
                <tr>
                    <td>${escapeHtml(s.SeccionID)}</td>
                    <td>${escapeHtml(s.NumeroSeccion || 'N/D')}</td>
                    <td>${escapeHtml(s.NombreCurso || '—')}</td>
                    <td>${escapeHtml(construirPeriodoTexto(s))}</td>
                    <td>${escapeHtml(s.CupoMaximo ?? 0)}</td>
                    <td>${escapeHtml(s.CupoDisponible ?? 0)}</td>
                    <td>
                        <span class="badge ${badgeClass}">
                            ${escapeHtml(estado)}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-outline" onclick="window.Modules.adminSecciones.ver(${Number(s.SeccionID)})">
                            Ver
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function mostrarModalNuevaSeccion() {
        const opcionesCursos = cursos.map((c) => `
            <option value="${escapeHtml(c.CursoID)}">
                ${escapeHtml(c.CodigoCurso || 'N/D')} - ${escapeHtml(c.NombreCurso || 'N/D')}
            </option>
        `).join('');

        const opcionesPeriodos = periodos.map((p) => `
            <option value="${escapeHtml(p.PeriodoID)}">
                ${escapeHtml(p.NombrePeriodo || 'N/D')} - ${escapeHtml(p.TipoPeriodo || 'N/D')} (${escapeHtml(p.Anio || '')})
            </option>
        `).join('');

        const opcionesDocentes = docentes.map((d) => `
            <option value="${escapeHtml(d.UsuarioID)}">
                ${escapeHtml(d.NombreCompleto || 'N/D')}
            </option>
        `).join('');

        window.UI.openModal({
            title: 'Nueva sección',
            body: `
                <div class="form-grid">
                    <div>
                        <label>Curso</label>
                        <select id="admin-seccion-curso">
                            <option value="">Seleccione</option>
                            ${opcionesCursos}
                        </select>
                    </div>

                    <div>
                        <label>Período</label>
                        <select id="admin-seccion-periodo">
                            <option value="">Seleccione</option>
                            ${opcionesPeriodos}
                        </select>
                    </div>

                    <div>
                        <label>Número de sección</label>
                        <input type="text" id="admin-seccion-numero" placeholder="Ej: 1, 2, A, B...">
                    </div>

                    <div>
                        <label>Docente</label>
                        <select id="admin-seccion-docente">
                            <option value="">Seleccione</option>
                            ${opcionesDocentes}
                        </select>
                    </div>

                    <div>
                        <label>Cupo máximo</label>
                        <input type="number" id="admin-seccion-cupo" min="1" placeholder="Ej: 25">
                    </div>

                    <div>
                        <label>Estado</label>
                        <select id="admin-seccion-estado">
                            <option value="Activa">Activa</option>
                            <option value="Inactiva">Inactiva</option>
                        </select>
                    </div>
                </div>
            `,
            confirmText: 'Guardar',
            cancelText: 'Cancelar',
            onConfirm: async () => {
                const CursoID = Number(document.getElementById('admin-seccion-curso')?.value || 0);
                const PeriodoID = Number(document.getElementById('admin-seccion-periodo')?.value || 0);
                const NumeroSeccion = String(document.getElementById('admin-seccion-numero')?.value || '').trim();
                const DocenteID = Number(document.getElementById('admin-seccion-docente')?.value || 0) || null;
                const CupoMaximo = Number(document.getElementById('admin-seccion-cupo')?.value || 0);
                const EstadoSeccion = String(document.getElementById('admin-seccion-estado')?.value || 'Activa').trim();

                if (!CursoID) {
                    throw new Error('Debe seleccionar un curso.');
                }

                if (!PeriodoID) {
                    throw new Error('Debe seleccionar un período.');
                }

                if (!NumeroSeccion) {
                    throw new Error('Debe indicar el número de sección.');
                }

                if (!CupoMaximo || CupoMaximo <= 0) {
                    throw new Error('El cupo máximo debe ser mayor que 0.');
                }

                const yaExiste = secciones.some((s) =>
                    Number(s.CursoID) === CursoID &&
                    Number(s.PeriodoID) === PeriodoID &&
                    String(s.NumeroSeccion || '').trim().toLowerCase() === NumeroSeccion.toLowerCase()
                );

                if (yaExiste) {
                    throw new Error('Ya existe una sección con ese número para el mismo curso y período.');
                }

                await window.ApiService.request('/secciones', {
                    method: 'POST',
                    body: {
                        CursoID,
                        PeriodoID,
                        NumeroSeccion,
                        DocenteID,
                        CupoMaximo,
                        EstadoSeccion
                    }
                });

                await cargarSecciones();

                window.UI.showMessage(
                    'admin-secciones-message',
                    'success',
                    'Sección creada correctamente.'
                );
            }
        });
    }

    function ver(id) {
        const s = secciones.find((x) => Number(x.SeccionID) === Number(id));
        if (!s) return;

        window.UI.openModal({
            title: 'Detalle de la sección',
            body: `
                <p><strong>ID:</strong> ${escapeHtml(s.SeccionID)}</p>
                <p><strong>Número de sección:</strong> ${escapeHtml(s.NumeroSeccion || 'N/D')}</p>
                <p><strong>Curso:</strong> ${escapeHtml(s.NombreCurso || 'N/D')} (${escapeHtml(s.CodigoCurso || 'N/D')})</p>
                <p><strong>Período:</strong> ${escapeHtml(construirPeriodoTexto(s))}</p>
                <p><strong>Docente:</strong> ${escapeHtml(s.Docente || 'N/D')}</p>
                <p><strong>Cupo máximo:</strong> ${escapeHtml(s.CupoMaximo ?? 0)}</p>
                <p><strong>Cupo disponible:</strong> ${escapeHtml(s.CupoDisponible ?? 0)}</p>
                <p><strong>Horario:</strong> ${escapeHtml(s.HorarioTexto || 'N/D')}</p>
                <p><strong>Aula:</strong> ${escapeHtml(s.AulaTexto || 'N/D')}</p>
                <p><strong>Estado:</strong> ${escapeHtml(s.EstadoSeccion || 'N/D')}</p>
            `,
            hideFooter: true
        });
    }

    function construirPeriodoTexto(seccion) {
        if (window.construirPeriodoTexto) {
            return window.construirPeriodoTexto(seccion);
        }

        const partes = [
            seccion.NombrePeriodo,
            seccion.TipoPeriodo,
            seccion.Anio ? `(${seccion.Anio})` : ''
        ].filter(Boolean);

        return partes.length ? partes.join(' ') : 'N/D';
    }

    function construirHorarioDesdeFila(item) {
        if (!item.DiaSemana && !item.HoraInicio && !item.HoraFin) {
            return '';
        }

        const inicio = item.HoraInicio ? String(item.HoraInicio).slice(0, 5) : '--';
        const fin = item.HoraFin ? String(item.HoraFin).slice(0, 5) : '--';

        return `${item.DiaSemana || 'N/D'} ${inicio} - ${fin}`;
    }

    function construirAulaDesdeFila(item) {
        const partes = [
            item.CodigoAula,
            item.NombreAula,
            item.Ubicacion
        ].filter(Boolean);

        return partes.length ? partes.join(' | ') : '';
    }

    function obtenerRolPrincipal(usuario) {
        if (usuario?.RolPrincipal) {
            return String(usuario.RolPrincipal).trim();
        }

        if (Array.isArray(usuario?.Roles) && usuario.Roles.length) {
            const rol = usuario.Roles[0];
            if (typeof rol === 'string') {
                return rol;
            }

            return String(
                rol?.NombreRol ||
                rol?.rol ||
                'Usuario'
            ).trim();
        }

        return String(usuario?.RolSistema || 'Usuario').trim();
    }

    function getBadgeEstado(estado) {
        switch (String(estado || '').toLowerCase()) {
            case 'activa':
            case 'activo':
                return 'badge-success';
            case 'inactiva':
            case 'cerrada':
            case 'inactivo':
                return 'badge-danger';
            default:
                return 'badge-gray';
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
        ver
    };
})();