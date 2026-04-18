window.Modules = window.Modules || {};

window.Modules.matricula = (function () {
    let estudiantes = [];
    let periodos = [];
    let secciones = [];
    let seleccionadas = [];

    async function init() {
        await cargarDatos();
        renderSelects();
        configurarEventos();
        renderResumen();
    }

    function configurarEventos() {
        const selectPeriodo = document.getElementById('select-periodo');
        const btnConfirmar = document.getElementById('btn-confirmar-matricula');
        const listaSecciones = document.getElementById('lista-secciones');

        if (selectPeriodo && !selectPeriodo.dataset.bound) {
            selectPeriodo.dataset.bound = 'true';
            selectPeriodo.addEventListener('change', () => {
                seleccionadas = [];
                filtrarSecciones();
                renderResumen();
            });
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
                toggle(seccionId);
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

            const seccionesRaw = Array.isArray(secRes.data) ? secRes.data : [];
            secciones = window.normalizarSecciones
                ? window.normalizarSecciones(seccionesRaw).map((s) => ({
                    ...s,
                    Creditos: Number(s.Creditos ?? 0),
                    PeriodoID: Number(s.PeriodoID ?? 0),
                    Horarios: Array.isArray(s.horarios) ? s.horarios : []
                }))
                : normalizarSecciones(seccionesRaw);
        } catch (error) {
            console.error('Error cargando datos de matrícula:', error);
            window.UI.showMessage(
                'matricula-message',
                'danger',
                error.message || 'No se pudieron cargar los datos de matrícula.'
            );
        }
    }

    function normalizarSecciones(data) {
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
            const horarioTexto = construirHorarioTexto(item);

            if (horarioTexto && !seccion.Horarios.includes(horarioTexto)) {
                seccion.Horarios.push(horarioTexto);
            }
        }

        return Array.from(mapa.values());
    }

    function construirHorarioTexto(item) {
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

    function renderSelects() {
        const selectEst = document.getElementById('select-estudiante');
        const selectPer = document.getElementById('select-periodo');

        if (selectEst) {
            if (!estudiantes.length) {
                selectEst.innerHTML = '<option value="">No hay estudiantes disponibles</option>';
            } else {
                selectEst.innerHTML = estudiantes.map((e) => `
                    <option value="${e.EstudianteID}">
                        ${escapeHtml(
                            e.Carnet
                                ? `${e.Carnet} - ${e.NombreCompleto}`
                                : e.NombreCompleto || `Estudiante ${e.EstudianteID}`
                        )}
                    </option>
                `).join('');
            }
        }

        if (selectPer) {
            if (!periodos.length) {
                selectPer.innerHTML = '<option value="">No hay períodos disponibles</option>';
            } else {
                selectPer.innerHTML = periodos.map((p) => `
                    <option value="${p.PeriodoID}">
                        ${escapeHtml(
                            `${p.NombrePeriodo || 'Período'}${p.TipoPeriodo ? ` - ${p.TipoPeriodo}` : ''}${p.Anio ? ` (${p.Anio})` : ''}`
                        )}
                    </option>
                `).join('');
            }
        }

        filtrarSecciones();
    }

    function filtrarSecciones() {
        const lista = document.getElementById('lista-secciones');
        const selectPeriodo = document.getElementById('select-periodo');

        if (!lista || !selectPeriodo) return;

        const periodoId = Number(selectPeriodo.value);

        if (!periodoId) {
            lista.innerHTML = '<div class="matricula-empty">Seleccione un período para ver las secciones disponibles.</div>';
            return;
        }

        const filtradas = secciones
            .filter((s) => Number(s.PeriodoID) === periodoId)
            .sort((a, b) => a.SeccionID - b.SeccionID);

        if (!filtradas.length) {
            lista.innerHTML = '<div class="matricula-empty">No hay secciones disponibles para este período.</div>';
            return;
        }

        lista.innerHTML = filtradas.map((s) => {
            const sinCupo = Number(s.CupoDisponible) <= 0;
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
                        <span><strong>Créditos:</strong> ${s.Creditos}</span>
                        <span><strong>Estado:</strong> ${escapeHtml(s.EstadoSeccion || 'N/D')}</span>
                        ${s.Docente ? `<span><strong>Docente:</strong> ${escapeHtml(s.Docente)}</span>` : ''}
                        ${s.Horarios.length ? `<span><strong>Horario:</strong> ${escapeHtml(s.Horarios.join(' | '))}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    function toggle(seccionId) {
        const seccion = secciones.find((s) => s.SeccionID === seccionId);

        if (!seccion || Number(seccion.CupoDisponible) <= 0) return;

        const index = seleccionadas.indexOf(seccionId);

        if (index >= 0) {
            seleccionadas.splice(index, 1);
        } else {
            seleccionadas.push(seccionId);
        }

        filtrarSecciones();
        renderResumen();
    }

    function renderResumen() {
        const cont = document.getElementById('resumen-matricula');
        if (!cont) return;

        if (!seleccionadas.length) {
            cont.innerHTML = '<div class="matricula-empty">No hay secciones seleccionadas.</div>';
            return;
        }

        const seleccion = secciones.filter((s) => seleccionadas.includes(s.SeccionID));
        const totalCreditos = seleccion.reduce((acc, s) => acc + Number(s.Creditos || 0), 0);

        cont.innerHTML = `
            <div class="resumen-lista">
                ${seleccion.map((s) => `
                    <div class="resumen-item">
                        <div>
                            <strong>${escapeHtml(s.CodigoCurso || '')} - ${escapeHtml(s.NombreCurso || `Sección ${s.SeccionID}`)}</strong>
                            <span>
                                Sección ${escapeHtml(String(s.NumeroSeccion || s.SeccionID))}
                                · Cupo ${s.CupoDisponible}/${s.CupoMaximo}
                                · ${s.Creditos} créditos
                                ${s.Horarios.length ? ` · ${escapeHtml(s.Horarios.join(' | '))}` : ''}
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
        window.UI.clearMessage('matricula-message');

        const selectEstudiante = document.getElementById('select-estudiante');
        const selectPeriodo = document.getElementById('select-periodo');

        const estudianteId = Number(selectEstudiante?.value);
        const periodoId = Number(selectPeriodo?.value);

        if (!estudianteId) {
            window.UI.showMessage('matricula-message', 'danger', 'Debe seleccionar un estudiante.');
            return;
        }

        if (!periodoId) {
            window.UI.showMessage('matricula-message', 'danger', 'Debe seleccionar un período.');
            return;
        }

        if (!seleccionadas.length) {
            window.UI.showMessage('matricula-message', 'danger', 'Debe seleccionar al menos una sección.');
            return;
        }

        try {
            const resultado = await window.ApiService.crearMatricula({
                estudianteId,
                periodoId,
                secciones: seleccionadas
            });

            const data = resultado?.data || resultado || {};
            const numeroFactura =
                data.numeroFactura || data.NumeroFactura
                    ? ` Factura generada: ${data.numeroFactura || data.NumeroFactura}.`
                    : '';

            window.UI.showMessage(
                'matricula-message',
                'success',
                `Matrícula realizada correctamente.${numeroFactura}`
            );

            seleccionadas = [];
            await cargarDatos();
            renderSelects();
            renderResumen();
        } catch (error) {
            console.error('Error confirmando matrícula:', error);
            window.UI.showMessage(
                'matricula-message',
                'danger',
                error.message || 'No se pudo realizar la matrícula.'
            );
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
        toggle
    };
})();