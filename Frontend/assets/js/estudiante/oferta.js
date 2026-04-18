window.Modules = window.Modules || {};

window.Modules.estudianteOferta = (function () {
    let oferta = [];
    let ofertaFiltrada = [];
    let periodoActualId = null;

    async function init() {
        await cargarOferta();
        configurarEventos();
    }

    function configurarEventos() {
        const btnFiltrar = document.getElementById('btn-filtrar-oferta');
        const inputFiltro = document.getElementById('filtro-oferta');

        if (btnFiltrar && !btnFiltrar.dataset.bound) {
            btnFiltrar.dataset.bound = 'true';
            btnFiltrar.addEventListener('click', aplicarFiltros);
        }

        if (inputFiltro && !inputFiltro.dataset.bound) {
            inputFiltro.dataset.bound = 'true';
            inputFiltro.addEventListener('input', aplicarFiltros);
        }
    }

    async function cargarOferta() {
        const session = window.Auth.getSession();
        const tabla = document.getElementById('tabla-oferta');

        if (!session?.estudianteId) {
            window.UI.showMessage('oferta-message', 'danger', 'No se encontró la sesión del estudiante.');
            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="6">No se encontró la sesión del estudiante.</td></tr>';
            }
            return;
        }

        try {
            periodoActualId = await resolverPeriodoParaOferta(session.estudianteId);

            if (!periodoActualId) {
                oferta = [];
                ofertaFiltrada = [];
                renderTabla();
                return;
            }

            const response = await window.ApiService.obtenerOfertaMatriculableEstudiante(
                session.estudianteId,
                periodoActualId
            );

            oferta = Array.isArray(response?.data) ? normalizarOferta(response.data) : [];
            ofertaFiltrada = [...oferta];
            renderTabla();
        } catch (error) {
            console.error('Error cargando oferta del estudiante:', error);
            window.UI.showMessage(
                'oferta-message',
                'danger',
                error.message || 'No se pudo cargar la oferta.'
            );

            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="6">Error cargando oferta.</td></tr>';
            }
        }
    }

    async function resolverPeriodoParaOferta(estudianteId) {
        const session = window.Auth.getSession();

        const candidatosSesion = [
            session?.periodoId,
            session?.PeriodoID,
            session?.raw?.PeriodoID,
            session?.raw?.periodoId
        ];

        for (const candidato of candidatosSesion) {
            const periodoId = Number(candidato);
            if (!Number.isNaN(periodoId) && periodoId > 0) {
                return periodoId;
            }
        }

        const response = await window.ApiService.obtenerPeriodos();
        const periodos = Array.isArray(response?.data) ? response.data : [];

        const ordenados = [...periodos].sort((a, b) => {
            const anioA = Number(a?.Anio || 0);
            const anioB = Number(b?.Anio || 0);
            if (anioA !== anioB) return anioB - anioA;

            const idA = Number(a?.PeriodoID || a?.periodoId || 0);
            const idB = Number(b?.PeriodoID || b?.periodoId || 0);
            return idB - idA;
        });

        const activos = ordenados.filter((item) => {
            const estado = String(item.EstadoPeriodo || item.estado || '').trim().toLowerCase();
            return ['activo', 'activa', 'vigente', 'abierto', 'abierta'].includes(estado);
        });

        const primerActivo = activos[0];
        if (primerActivo) {
            return Number(primerActivo?.PeriodoID ?? primerActivo?.periodoId ?? 0) || null;
        }

        const primero = ordenados[0];
        return Number(primero?.PeriodoID ?? primero?.periodoId ?? 0) || null;
    }

    function normalizarOferta(rows) {
        const mapa = new Map();

        for (const item of rows) {
            const key = `${item.SeccionID || ''}-${item.CursoID || ''}`;

            if (!mapa.has(key)) {
                mapa.set(key, {
                    ...item,
                    Docente: item.Docente || item.NombreDocente || '',
                    Horarios: Array.isArray(item.Horarios) ? [...item.Horarios] : [],
                    HorarioTexto: item.HorarioTexto || '',
                    AulaTexto: item.AulaTexto || ''
                });
            }

            const curso = mapa.get(key);

            const horarioTextoPlano = construirHorarioTexto(item);
            const aulaTextoPlano = construirAulaTexto(item);

            if (horarioTextoPlano) {
                const existe = curso.Horarios.some((h) => h.HorarioTexto === horarioTextoPlano && h.AulaTexto === aulaTextoPlano);
                if (!existe) {
                    curso.Horarios.push({
                        DiaSemana: item.DiaSemana || '',
                        HoraInicio: item.HoraInicio || '',
                        HoraFin: item.HoraFin || '',
                        HorarioTexto: horarioTextoPlano,
                        AulaTexto: aulaTextoPlano
                    });
                }
            }
        }

        return Array.from(mapa.values()).map((curso) => {
            if (!curso.HorarioTexto && curso.Horarios.length) {
                curso.HorarioTexto = curso.Horarios.map((h) => h.HorarioTexto).filter(Boolean).join(' | ');
            }

            if (!curso.AulaTexto && curso.Horarios.length) {
                curso.AulaTexto = curso.Horarios.map((h) => h.AulaTexto).filter(Boolean).join(' | ');
            }

            return curso;
        });
    }

    function aplicarFiltros() {
        const texto = String(document.getElementById('filtro-oferta')?.value || '')
            .trim()
            .toLowerCase();

        ofertaFiltrada = oferta.filter((item) => {
            const docente =
                item.Docente ||
                item.NombreDocente ||
                item.docente ||
                '';

            const horario =
                item.HorarioTexto ||
                '';

            return (
                !texto ||
                String(item.CodigoCurso || '').toLowerCase().includes(texto) ||
                String(item.NombreCurso || '').toLowerCase().includes(texto) ||
                String(docente).toLowerCase().includes(texto) ||
                String(horario).toLowerCase().includes(texto)
            );
        });

        renderTabla();
    }

    function renderTabla() {
        const tabla = document.getElementById('tabla-oferta');
        if (!tabla) return;

        if (!ofertaFiltrada.length) {
            tabla.innerHTML = '<tr><td colspan="6">No hay cursos disponibles para matrícula.</td></tr>';
            return;
        }

        tabla.innerHTML = ofertaFiltrada.map((item) => {
            const cupos = Number(item.CupoDisponible || 0);
            const sinCupo = cupos <= 0;
            const docente =
                item.Docente ||
                item.NombreDocente ||
                'Por definir';

            const seccionId = Number(item.SeccionID || 0);

            const horario =
                item.HorarioTexto ||
                construirHorarioTexto(item) ||
                'No definido';

            return `
                <tr>
                    <td>
                        <strong>${escapeHtmlSafe(item.CodigoCurso || '')}</strong><br>
                        ${escapeHtmlSafe(item.NombreCurso || '')}
                    </td>
                    <td>${escapeHtmlSafe(item.Creditos || 0)}</td>
                    <td>${escapeHtmlSafe(docente)}</td>
                    <td>${escapeHtmlSafe(horario)}</td>
                    <td>${escapeHtmlSafe(cupos)}</td>
                    <td>
                        <button
                            class="btn ${sinCupo ? 'btn-outline' : 'btn-primary'}"
                            ${sinCupo || !seccionId ? 'disabled' : ''}
                            onclick="window.Modules.estudianteOferta.agregar(${seccionId})"
                        >
                            ${sinCupo ? 'Sin cupo' : 'Agregar'}
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    async function agregar(seccionId) {
        const session = window.Auth.getSession();

        if (!session?.estudianteId) {
            window.UI.showMessage('oferta-message', 'danger', 'No se encontró la sesión del estudiante.');
            return;
        }

        try {
            if (!periodoActualId) {
                periodoActualId = await resolverPeriodoParaOferta(session.estudianteId);
            }

            if (!periodoActualId) {
                throw new Error('No se encontró un período válido para registrar la matrícula.');
            }

            await window.ApiService.crearMatricula({
                estudianteId: Number(session.estudianteId),
                periodoId: Number(periodoActualId),
                secciones: [Number(seccionId)]
            });

            window.UI.showMessage(
                'oferta-message',
                'success',
                'Curso agregado correctamente a la matrícula.'
            );

            await cargarOferta();
        } catch (error) {
            console.error('Error agregando curso a matrícula:', error);
            window.UI.showMessage(
                'oferta-message',
                'danger',
                error.message || 'No se pudo agregar el curso.'
            );
        }
    }

    function construirHorarioTexto(item) {
        if (Array.isArray(item.Horarios) && item.Horarios.length) {
            const textos = item.Horarios
                .map((h) => h.HorarioTexto || construirHorarioPlano(h))
                .filter(Boolean);

            if (textos.length) {
                return textos.join(' | ');
            }
        }

        return construirHorarioPlano(item);
    }

    function construirHorarioPlano(item) {
        const dia = item.DiaSemana || '';
        const inicio = item.HoraInicio ? formatHourSafe(item.HoraInicio) : '';
        const fin = item.HoraFin ? formatHourSafe(item.HoraFin) : '';

        if (!dia && !inicio && !fin) return '';
        if (dia && inicio && fin) return `${dia} ${inicio} - ${fin}`;
        return [dia, inicio, fin].filter(Boolean).join(' ');
    }

    function construirAulaTexto(item) {
        return [
            item.CodigoAula || '',
            item.NombreAula || '',
            item.Ubicacion || ''
        ].filter(Boolean).join(' - ');
    }

    function formatHourSafe(value) {
        if (typeof window.formatearHora === 'function') {
            return window.formatearHora(value);
        }
        return String(value || '');
    }

    function escapeHtmlSafe(value) {
        if (typeof window.escapeHtml === 'function') {
            return window.escapeHtml(value);
        }
        return String(value ?? '');
    }

    return {
        init,
        agregar
    };
})();