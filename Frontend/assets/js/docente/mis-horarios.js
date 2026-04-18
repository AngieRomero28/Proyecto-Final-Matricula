window.Modules = window.Modules || {};

window.Modules.docenteMisHorarios = (function () {
    async function init() {
        await cargarHorarios();
    }

    async function cargarHorarios() {
        const session = window.Auth.getSession();
        const tabla = document.getElementById('tabla-docente-horarios');

        if (!session?.userId) {
            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="6">Sesión no válida.</td></tr>';
            }
            return;
        }

        try {
            const response = await window.ApiService.obtenerSecciones();
            const data = Array.isArray(response.data) ? response.data : [];

            const mis = obtenerSeccionesDocente(data, session);
            const filas = expandirHorarios(mis);

            if (!filas.length) {
                tabla.innerHTML = '<tr><td colspan="6">No hay horarios.</td></tr>';
                return;
            }

            tabla.innerHTML = filas.map((s) => `
                <tr>
                    <td>${escapeHtml(s.NombreCurso || '')}</td>
                    <td>${escapeHtml(s.NumeroSeccion || '')}</td>
                    <td>${escapeHtml(s.DiaSemana || 'N/D')}</td>
                    <td>${escapeHtml(formatearHora(s.HoraInicio || ''))}</td>
                    <td>${escapeHtml(formatearHora(s.HoraFin || ''))}</td>
                    <td>${escapeHtml(s.Aula || 'N/D')}</td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error cargando horarios docente:', error);
            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="6">Error cargando horarios.</td></tr>';
            }
        }
    }

    function obtenerSeccionesDocente(data, session) {
        const normalizadas = window.normalizarSecciones
            ? window.normalizarSecciones(data)
            : data;

        const docenteIdSesion = Number(
            session.docenteId ??
            session.userId ??
            0
        );

        return normalizadas.filter((s) => {
            const docenteIdFila = Number(
                s.DocenteID ??
                s.docenteId ??
                s.UsuarioDocenteID ??
                0
            );

            return docenteIdSesion > 0 && docenteIdFila === docenteIdSesion;
        });
    }

    function expandirHorarios(secciones) {
        const filas = [];

        for (const item of secciones) {
            if (Array.isArray(item.horarios) && item.horarios.length) {
                item.horarios.forEach((horarioTexto) => {
                    const parseado = parsearHorarioTexto(horarioTexto);

                    filas.push({
                        NombreCurso: item.NombreCurso,
                        NumeroSeccion: item.NumeroSeccion,
                        DiaSemana: parseado.dia,
                        HoraInicio: parseado.inicio,
                        HoraFin: parseado.fin,
                        Aula: item.AulaTexto || 'N/D'
                    });
                });
            } else {
                filas.push({
                    NombreCurso: item.NombreCurso,
                    NumeroSeccion: item.NumeroSeccion,
                    DiaSemana: item.DiaSemana || 'N/D',
                    HoraInicio: item.HoraInicio || '',
                    HoraFin: item.HoraFin || '',
                    Aula: item.AulaTexto || item.NombreAula || 'N/D'
                });
            }
        }

        return filas;
    }

    function parsearHorarioTexto(texto) {
        const valor = String(texto || '').trim();
        const match = valor.match(/^(.+?)\s+(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/);

        if (!match) {
            return {
                dia: valor || 'N/D',
                inicio: '',
                fin: ''
            };
        }

        return {
            dia: match[1],
            inicio: match[2],
            fin: match[3]
        };
    }

    return { init };
})();