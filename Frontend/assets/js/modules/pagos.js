window.Modules = window.Modules || {};

window.Modules.pagos = (function () {
    let estudiantes = [];
    let facturas = [];
    let facturaSeleccionada = null;

    async function init() {
        await cargarEstudiantes();
        configurarEventos();
        renderDetalle();
    }

    function configurarEventos() {
        const selectEstudiante = document.getElementById('select-estudiante-pago');
        const btnPagar = document.getElementById('btn-pagar');
        const listaFacturas = document.getElementById('lista-facturas');

        if (selectEstudiante) {
            selectEstudiante.addEventListener('change', cargarFacturas);
        }

        if (btnPagar) {
            btnPagar.addEventListener('click', realizarPago);
        }

        if (listaFacturas) {
            listaFacturas.addEventListener('click', (event) => {
                const item = event.target.closest('[data-factura-id]');
                if (!item) return;

                const facturaId = Number(item.dataset.facturaId);
                seleccionar(facturaId);
            });
        }
    }

    async function cargarEstudiantes() {
        try {
            const res = await ApiService.obtenerEstudiantes();
            estudiantes = Array.isArray(res.data) ? res.data : [];

            const select = document.getElementById('select-estudiante-pago');
            if (!select) return;

            if (!estudiantes.length) {
                select.innerHTML = '<option value="">No hay estudiantes disponibles</option>';
                facturas = [];
                renderFacturas();
                return;
            }

            select.innerHTML = estudiantes.map((e) => `
                <option value="${e.EstudianteID}">
                    ${escapeHtml(
                        e.Carnet
                            ? `${e.Carnet} - ${e.NombreCompleto}`
                            : e.NombreCompleto || `Estudiante ${e.EstudianteID}`
                    )}
                </option>
            `).join('');

            await cargarFacturas();
        } catch (error) {
            console.error('Error cargando estudiantes para pagos:', error);
            UI.showMessage(
                'pagos-message',
                'danger',
                error.message || 'No se pudieron cargar los estudiantes.'
            );
        }
    }

    async function cargarFacturas() {
        const estudianteId = Number(document.getElementById('select-estudiante-pago')?.value);
        const lista = document.getElementById('lista-facturas');

        facturaSeleccionada = null;
        renderDetalle();

        if (!lista) return;

        if (!estudianteId) {
            facturas = [];
            renderFacturas();
            return;
        }

        try {
            lista.innerHTML = '<div class="matricula-empty">Cargando facturas...</div>';

            const res = await ApiService.obtenerMatriculas();
            const matriculas = Array.isArray(res.data) ? res.data : [];
            const mapa = new Map();

            for (const item of matriculas) {
                if (Number(item.EstudianteID) !== estudianteId) continue;
                if (!item.FacturaID) continue;

                const saldoPendiente = Number(item.SaldoPendiente ?? 0);
                if (saldoPendiente <= 0) continue;

                if (!mapa.has(item.FacturaID)) {
                    mapa.set(item.FacturaID, {
                        FacturaID: Number(item.FacturaID),
                        NumeroFactura: item.NumeroFactura ?? '',
                        EstudianteID: Number(item.EstudianteID),
                        PeriodoID: Number(item.PeriodoID),
                        NombrePeriodo: item.NombrePeriodo ?? '',
                        TipoPeriodo: item.TipoPeriodo ?? '',
                        Anio: item.Anio ?? '',
                        MontoTotal: Number(item.MontoTotal ?? item.Total ?? 0),
                        MontoPagado: Number(item.MontoPagado ?? 0),
                        SaldoPendiente: saldoPendiente,
                        EstadoCuenta: item.EstadoCuenta ?? '',
                        EstadoFactura: item.EstadoFactura ?? '',
                        MatriculaID: item.MatriculaID ?? null
                    });
                }
            }

            facturas = Array.from(mapa.values()).sort((a, b) => b.FacturaID - a.FacturaID);
            renderFacturas();
        } catch (error) {
            console.error('Error cargando facturas:', error);
            lista.innerHTML = '<div class="matricula-empty">Error cargando facturas pendientes.</div>';
        }
    }

    function renderFacturas() {
        const lista = document.getElementById('lista-facturas');
        if (!lista) return;

        if (!facturas.length) {
            lista.innerHTML = '<div class="matricula-empty">No hay facturas pendientes para este estudiante.</div>';
            return;
        }

        lista.innerHTML = facturas.map((f) => {
            const seleccionada = facturaSeleccionada && facturaSeleccionada.FacturaID === f.FacturaID;

            return `
                <div class="curso-card ${seleccionada ? 'selected' : ''}" data-factura-id="${f.FacturaID}">
                    <div class="curso-header">
                        <div>
                            <div class="curso-code">${escapeHtml(f.NumeroFactura || `FACTURA ${f.FacturaID}`)}</div>
                            <div class="curso-name">Factura #${f.FacturaID}</div>
                        </div>
                        <span class="badge badge-warning">Pendiente</span>
                    </div>

                    <div class="curso-meta">
                        <span><strong>Período:</strong> ${escapeHtml(construirNombrePeriodo(f))}</span>
                        <span><strong>Total:</strong> ${Helpers.formatCurrency(f.MontoTotal)}</span>
                        <span><strong>Pagado:</strong> ${Helpers.formatCurrency(f.MontoPagado)}</span>
                        <span><strong>Saldo:</strong> ${Helpers.formatCurrency(f.SaldoPendiente)}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    function seleccionar(id) {
        facturaSeleccionada = facturas.find((f) => Number(f.FacturaID) === Number(id)) || null;
        renderFacturas();
        renderDetalle();
    }

    function renderDetalle() {
        const cont = document.getElementById('detalle-pago');
        const inputMonto = document.getElementById('monto-pago');

        if (!cont) return;

        if (!facturaSeleccionada) {
            cont.innerHTML = '<div class="matricula-empty">Seleccione una factura pendiente.</div>';
            if (inputMonto) inputMonto.value = '';
            return;
        }

        cont.innerHTML = `
            <div class="resumen-financiero">
                <div class="mini-card">
                    <div class="mini-card-label">Factura</div>
                    <div class="mini-card-value">${escapeHtml(facturaSeleccionada.NumeroFactura || String(facturaSeleccionada.FacturaID))}</div>
                </div>

                <div class="mini-card">
                    <div class="mini-card-label">Total</div>
                    <div class="mini-card-value">${Helpers.formatCurrency(facturaSeleccionada.MontoTotal)}</div>
                </div>

                <div class="mini-card">
                    <div class="mini-card-label">Saldo pendiente</div>
                    <div class="mini-card-value">${Helpers.formatCurrency(facturaSeleccionada.SaldoPendiente)}</div>
                </div>
            </div>

            <div class="mt-2">
                <p><strong>Período:</strong> ${escapeHtml(construirNombrePeriodo(facturaSeleccionada))}</p>
                <p><strong>Estado de cuenta:</strong> ${escapeHtml(facturaSeleccionada.EstadoCuenta || 'Pendiente')}</p>
                <p><strong>Estado factura:</strong> ${escapeHtml(facturaSeleccionada.EstadoFactura || 'Pendiente')}</p>
            </div>
        `;

        if (inputMonto) {
            inputMonto.value = facturaSeleccionada.SaldoPendiente;
        }
    }

    async function realizarPago() {
        UI.clearMessage('pagos-message');

        if (!facturaSeleccionada) {
            UI.showMessage('pagos-message', 'danger', 'Seleccione una factura.');
            return;
        }

        const monto = Number(document.getElementById('monto-pago')?.value);
        const metodo = String(document.getElementById('metodo-pago')?.value || '').trim();

        if (Number.isNaN(monto) || monto <= 0) {
            UI.showMessage('pagos-message', 'danger', 'Debe ingresar un monto válido.');
            return;
        }

        if (!metodo) {
            UI.showMessage('pagos-message', 'danger', 'Debe seleccionar un método de pago.');
            return;
        }

        try {
            await ApiService.registrarPago({
                facturaId: facturaSeleccionada.FacturaID,
                estudianteId: facturaSeleccionada.EstudianteID,
                periodoId: facturaSeleccionada.PeriodoID,
                montoPago: monto,
                metodoPago: metodo,
                referenciaPago: `PAGO-WEB-${Date.now()}`
            });

            UI.showMessage('pagos-message', 'success', 'Pago realizado correctamente.');

            facturaSeleccionada = null;
            await cargarFacturas();
            renderDetalle();
        } catch (error) {
            console.error('Error registrando pago:', error);
            UI.showMessage(
                'pagos-message',
                'danger',
                error.message || 'No se pudo registrar el pago.'
            );
        }
    }

    function construirNombrePeriodo(factura) {
        const partes = [
            factura.NombrePeriodo,
            factura.TipoPeriodo,
            factura.Anio ? `(${factura.Anio})` : ''
        ].filter(Boolean);

        return partes.join(' ');
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
        seleccionar
    };
})();