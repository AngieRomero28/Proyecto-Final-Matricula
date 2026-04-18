window.Modules = window.Modules || {};

window.Modules.matriculaAdmin = (function () {
    let estudiantes = [];
    let periodos = [];
    let secciones = [];
    let seccionesFiltradas = [];
    let seleccionadas = [];

    async function init() {
        await cargarDatos();
        renderSelects();
        configurarEventos();
        filtrarSecciones();
        renderResumen();
    }

    function configurarEventos() {
        const selectEstudiante = document.getElementById('select-admin-estudiante');
        const selectPeriodo = document.getElementById('select-admin-periodo');
        const inputBuscar = document.getElementById('filtro-admin-seccion-buscar');
        const btnConfirmar = document.getElementById('btn-confirmar-matricula-admin');
        const listaSecciones = document.getElementById('lista-secciones-admin');

        if (selectEstudiante && !selectEstudiante.dataset.bound) {
            selectEstudiante.dataset.bound = 'true';
            selectEstudiante.addEventListener('change', () => {
                renderResumen();
            });
        }

        if (selectPeriodo && !selectPeriodo.dataset.bound) {
            selectPeriodo.dataset.bound = 'true';
            selectPeriodo.addEventListener('change', () => {
                seleccionadas = [];
                filtrarSecciones();
                renderResumen();
            });
        }

        if (inputBuscar && !inputBuscar.dataset.bound) {
            inputBuscar.dataset.bound = 'true';
            inputBuscar.addEventListener('input', filtrarSecciones);
        }

        if (btnConfirmar && !btnConfirmar.dataset.bound) {
            btnConfirmar.dataset.bound = 'true';
            btnConfirmar.addEventListener('click', confirmarMatricula);
        }

        if (listaSecciones && !listaSecciones.dataset.bound) {
            listaSecciones.dataset.bound = 'true';
            listaSecciones.addEventListener('click', (event) => {
                const item = event.target.closest('[data-seccion-id]');
                if (!item) return;

                const seccionId = Number(item.dataset.seccionId);
                toggleSeccion(seccionId);
            });
        }
    }

    async function cargarDatos() {
        try {
            const [estRes, perRes, secRes] = await Promise.all([
                window.ApiService.obtenerEstudiantes(),
                window.ApiService.obtenerPeriodos(),
                window.ApiService.obtenerSecciones()
            ]);

            estudiantes = Array.isArray(estRes.data) ? estRes.data : [];
            periodos = Array.isArray(perRes.data) ? perRes.data : [];

            const rawSecciones = Array.isArray(secRes.data) ? secRes.data : [];
            secciones = normalizarSeccionesParaMatricula(rawSecciones);
            seccionesFiltradas = [...secciones];
        } catch (error) {
            console.error('Error cargando datos de matrícula administrativa:', error);
            window.UI.showMessage(
                'matricula-admin-message',
                'danger',
                error.message || 'No se pudieron cargar los datos necesarios.'
            );
        }
    }

    function normalizarSeccionesParaMatricula(data) {
        const base = window.normalizarSecciones
            ? window.normalizarSecciones(data)
            : [];

        if (base.length) {
            return base.map((item) => ({
                ...item,
                Creditos: Number(item.Creditos ?? item.creditos ?? 0),
                PeriodoID: Number(item.PeriodoID ?? 0),
                Horarios: Array.isArray(item.horarios) ? item.horarios : []
            }));
        }

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
                    Creditos: Number(item.Creditos ?? 0),
                    PeriodoID: Number(item.PeriodoID ?? 0),
                    NombrePeriodo: item.NombrePeriodo ?? '',
                    TipoPeriodo: item.TipoPeriodo ?? '',
                    Anio: item.Anio ?? '',
                    Docente: item.Docente || item.NombreDocente || '',
                    Horarios: []
                });
            }

            const seccion = mapa.get(id);
            const horario = construirHorario(item);

            if (horario && !seccion.Horarios.includes(horario)) {
                seccion.Horarios.push(horario);
            }
        }

        return Array.from(mapa.values());
    }

    function renderSelects() {
        renderSelectEstudiantes();
        renderSelectPeriodos();
    }

    function renderSelectEstudiantes() {
        const select = document.getElementById('select-admin-estudiante');
        if (!select) return;

        if (!estudiantes.length) {
            select.innerHTML = '<option value="">No hay estudiantes disponibles</option>';
            return;
        }

        select.innerHTML = `
            <option value="">Seleccione un estudiante</option>
            ${estudiantes.map((e) => `
                <option value="${e.EstudianteID}">
                    ${escapeHtml(
                        e.Carnet
                            ? `${e.Carnet} - ${e.NombreCompleto || `Estudiante ${e.EstudianteID}`}`
                            : e.NombreCompleto || `Estudiante ${e.EstudianteID}`
                    )}
                </option>
            `).join('')}
        `;
    }

    function renderSelectPeriodos() {
        const select = document.getElementById('select-admin-periodo');
        if (!select) return;

        if (!periodos.length) {
            select.innerHTML = '<option value="">No hay períodos disponibles</option>';
            return;
        }

        select.innerHTML = `
            <option value="">Seleccione un período</option>
            ${periodos.map((p) => `
                <option value="${p.PeriodoID}">
                    ${escapeHtml(
                        `${p.NombrePeriodo || 'Período'}${p.TipoPeriodo ? ` - ${p.TipoPeriodo}` : ''}${p.Anio ? ` (${p.Anio})` : ''}`
                    )}
                </option>
            `).join('')}
        `;
    }

    function filtrarSecciones() {
        const lista = document.getElementById('lista-secciones-admin');
        const periodoId = Number(document.getElementById('select-admin-periodo')?.value || 0);
        const texto = String(document.getElementById('filtro-admin-seccion-buscar')?.value || '')
            .trim()
            .toLowerCase();

        if (!lista) return;

        if (!periodoId) {
            lista.innerHTML = '<div class="matricula-empty">Seleccione un período para ver las secciones disponibles.</div>';
            seccionesFiltradas = [];
            return;
        }

        seccionesFiltradas = secciones
            .filter((s) => Number(s.PeriodoID) === periodoId)
            .filter((s) => {
                return (
                    !texto ||
                    String(s.CodigoCurso || '').toLowerCase().includes(texto) ||
                    String(s.NombreCurso || '').toLowerCase().includes(texto) ||
                    String(s.Docente || '').toLowerCase().includes(texto) ||
                    String(s.NumeroSeccion || '').toLowerCase().includes(texto)
                );
            })
            .sort((a, b) => Number(a.SeccionID) - Number(b.SeccionID));

        renderSecciones();
    }

    function renderSecciones() {
        const lista = document.getElementById('lista-secciones-admin');
        if (!lista) return;

        if (!seccionesFiltradas.length) {
            lista.innerHTML = '<div class="matricula-empty">No hay secciones disponibles para este filtro.</div>';
            return;
        }

        lista.innerHTML = seccionesFiltradas.map((s) => {
            const sinCupo = Number(s.CupoDisponible || 0) <= 0;
            const seleccionada = seleccionadas.includes(s.SeccionID);

            return `
                <div
                    class="curso-card ${sinCupo ? 'disabled' : ''} ${seleccionada ? 'selected' : ''}"
                    data-seccion-id="${s.SeccionID}"
                >
                    <div class="curso-header">
                        <div>
                            <div class="curso-code">${escapeHtml(s.CodigoCurso || `SECCIÓN ${s.SeccionID}`)}</div>
                            <div class="curso-name">${escapeHtml(s.NombreCurso || `Sección ${s.SeccionID}`)}</div>
                        </div>
                        <span class="badge ${sinCupo ? 'badge-danger' : 'badge-success'}">
                            ${sinCupo ? 'Sin cupo' : 'Disponible'}
                        </span>
                    </div>

                    <div class="curso-meta">
                        <span><strong>Sección:</strong> ${escapeHtml(String(s.NumeroSeccion || s.SeccionID))}</span>
                        <span><strong>Cupos:</strong> ${s.CupoDisponible}/${s.CupoMaximo}</span>
                        <span><strong>Créditos:</strong> ${s.Creditos || 0}</span>
                        <span><strong>Estado:</strong> ${escapeHtml(s.EstadoSeccion || 'N/D')}</span>
                        ${s.Docente ? `<span><strong>Docente:</strong> ${escapeHtml(s.Docente)}</span>` : ''}
                        ${Array.isArray(s.Horarios) && s.Horarios.length ? `<span><strong>Horario:</strong> ${escapeHtml(s.Horarios.join(' | '))}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    function toggleSeccion(seccionId) {
        const seccion = secciones.find((s) => Number(s.SeccionID) === Number(seccionId));
        if (!seccion || Number(seccion.CupoDisponible || 0) <= 0) return;

        const index = seleccionadas.indexOf(seccionId);

        if (index >= 0) {
            seleccionadas.splice(index, 1);
        } else {
            seleccionadas.push(seccionId);
        }

        renderSecciones();
        renderResumen();
    }

    function renderResumen() {
        const cont = document.getElementById('resumen-matricula-admin');
        if (!cont) return;

        const estudianteId = Number(document.getElementById('select-admin-estudiante')?.value || 0);
        const estudiante = estudiantes.find((e) => Number(e.EstudianteID) === estudianteId) || null;

        if (!seleccionadas.length) {
            cont.innerHTML = `
                <div class="matricula-empty">
                    ${estudiante
                        ? `No hay secciones seleccionadas para ${escapeHtml(estudiante.NombreCompleto || `estudiante ${estudiante.EstudianteID}`)}.`
                        : 'No hay secciones seleccionadas.'}
                </div>
            `;
            return;
        }

        const seleccion = secciones.filter((s) => seleccionadas.includes(s.SeccionID));
        const totalCreditos = seleccion.reduce((acc, s) => acc + Number(s.Creditos || 0), 0);

        cont.innerHTML = `
            ${estudiante ? `
                <div class="creditos-box mb-2">
                    <strong>Estudiante</strong>
                    <span>${escapeHtml(estudiante.Carnet ? `${estudiante.Carnet} - ${estudiante.NombreCompleto || ''}` : estudiante.NombreCompleto || '')}</span>
                </div>
            ` : ''}

            <div class="resumen-lista">
                ${seleccion.map((s) => `
                    <div class="resumen-item">
                        <div>
                            <strong>${escapeHtml(s.CodigoCurso || '')} - ${escapeHtml(s.NombreCurso || `Sección ${s.SeccionID}`)}</strong>
                            <span>
                                Sección ${escapeHtml(String(s.NumeroSeccion || s.SeccionID))}
                                · Cupo ${s.CupoDisponible}/${s.CupoMaximo}
                                · ${s.Creditos || 0} créditos
                                ${Array.isArray(s.Horarios) && s.Horarios.length ? ` · ${escapeHtml(s.Horarios.join(' | '))}` : ''}
                            </span>
                        </div>
                        <div>
                            <span>${Number(s.Creditos || 0)} créditos</span>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="progress">
                <div class="progress-bar ${totalCreditos >= 18 ? 'warning' : 'ok'}" style="width: ${Math.min((totalCreditos / 24) * 100, 100)}%;"></div>
            </div>

            <div class="creditos-box mt-2">
                <strong>Total de créditos</strong>
                <span>${totalCreditos}</span>
            </div>
        `;
    }

    async function confirmarMatricula() {
        window.UI.clearMessage('matricula-admin-message');

        const estudianteId = Number(document.getElementById('select-admin-estudiante')?.value || 0);
        const periodoId = Number(document.getElementById('select-admin-periodo')?.value || 0);

        if (!estudianteId) {
            window.UI.showMessage('matricula-admin-message', 'danger', 'Debe seleccionar un estudiante.');
            return;
        }

        if (!periodoId) {
            window.UI.showMessage('matricula-admin-message', 'danger', 'Debe seleccionar un período.');
            return;
        }

        if (!seleccionadas.length) {
            window.UI.showMessage('matricula-admin-message', 'danger', 'Debe seleccionar al menos una sección.');
            return;
        }

        try {
            const resultado = await window.ApiService.crearMatricula({
                estudianteId,
                periodoId,
                secciones: seleccionadas
            });

            const data = resultado?.data || resultado || {};
            const numeroFactura = data.numeroFactura || data.NumeroFactura;
            const extra = numeroFactura ? ` Factura generada: ${numeroFactura}.` : '';

            window.UI.showMessage(
                'matricula-admin-message',
                'success',
                `Matrícula administrativa realizada correctamente.${extra}`
            );

            seleccionadas = [];
            await cargarDatos();
            renderSelects();
            filtrarSecciones();
            renderResumen();
        } catch (error) {
            console.error('Error confirmando matrícula administrativa:', error);
            window.UI.showMessage(
                'matricula-admin-message',
                'danger',
                error.message || 'No se pudo realizar la matrícula administrativa.'
            );
        }
    }

    function construirHorario(item) {
        const dia = item.DiaSemana ? String(item.DiaSemana).trim() : '';
        const inicio = item.HoraInicio ? formatearHora(item.HoraInicio) : '';
        const fin = item.HoraFin ? formatearHora(item.HoraFin) : '';

        if (!dia && !inicio && !fin) return '';
        if (dia && inicio && fin) return `${dia} ${inicio} - ${fin}`;
        return [dia, inicio, fin].filter(Boolean).join(' ');
    }

    function formatearHora(valor) {
        const texto = String(valor || '');
        return texto.length >= 5 ? texto.slice(0, 5) : texto;
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
        toggleSeccion
    };
})();