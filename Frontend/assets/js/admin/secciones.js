window.Modules = window.Modules || {};

window.Modules.adminSecciones = (function () {
    let secciones = [];

    async function init() {
        await cargarSecciones();
        configurarEventos();
    }

    function configurarEventos() {
        const btnNueva = document.getElementById('btn-admin-nueva-seccion');

        if (btnNueva && !btnNueva.dataset.bound) {
            btnNueva.dataset.bound = 'true';
            btnNueva.textContent = 'Actualizar listado';
            btnNueva.addEventListener('click', manejarRecargaSecciones);
        }
    }

    async function manejarRecargaSecciones() {
        window.UI.clearMessage('admin-secciones-message');

        try {
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
            tabla.innerHTML = '<tr><td colspan="7">Cargando...</td></tr>';

            const response = await window.ApiService.obtenerSecciones();
            const data = Array.isArray(response.data) ? response.data : [];

            secciones = window.normalizarSecciones
                ? window.normalizarSecciones(data)
                : normalizarSeccionesLocal(data);

            renderTabla();
        } catch (error) {
            console.error('Error cargando secciones:', error);
            tabla.innerHTML = '<tr><td colspan="7">Error cargando datos</td></tr>';
            throw error;
        }
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

    function renderTabla() {
        const tabla = document.getElementById('tabla-admin-secciones');
        if (!tabla) return;

        if (!secciones.length) {
            tabla.innerHTML = '<tr><td colspan="7">No hay secciones registradas</td></tr>';
            return;
        }

        tabla.innerHTML = secciones.map((s) => {
            const estado = s.EstadoSeccion || 'N/D';
            const badgeClass = getBadgeEstado(estado);

            return `
                <tr>
                    <td>${escapeHtml(s.SeccionID)}</td>
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