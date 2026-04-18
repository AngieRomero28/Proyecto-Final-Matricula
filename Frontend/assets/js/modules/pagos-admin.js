window.Modules = window.Modules || {};

window.Modules.pagosAdmin = (function () {
    let estudiantes = [];
    let facturas = [];
    let facturasFiltradas = [];
    let facturaSeleccionada = null;

    async function init() {
        await cargarDatosBase();
        configurarEventos();
        renderFacturas();
        renderDetalle();
    }

    function configurarEventos() {
        const selectEstudiante = document.getElementById('select-admin-estudiante-pago');
        const inputBuscar = document.getElementById('filtro-admin-factura-pago');
        const btnPagar = document.getElementById('btn-registrar-pago-admin');
        const listaFacturas = document.getElementById('lista-facturas-admin');

        if (selectEstudiante && !selectEstudiante.dataset.bound) {
            selectEstudiante.dataset.bound = 'true';
            selectEstudiante.addEventListener('change', aplicarFiltros);
        }

        if (inputBuscar && !inputBuscar.dataset.bound) {
            inputBuscar.dataset.bound = 'true';
            inputBuscar.addEventListener('input', aplicarFiltros);
        }

        if (btnPagar && !btnPagar.dataset.bound) {
            btnPagar.dataset.bound = 'true';
            btnPagar.addEventListener('click', registrarPagoAdmin);
        }

        if (listaFacturas && !listaFacturas.dataset.bound) {
            listaFacturas.dataset.bound = 'true';
            listaFacturas.addEventListener('click', (event) => {
                const item = event.target.closest('[data-factura-id]');
                if (!item) return;

                seleccionarFactura(Number(item.dataset.facturaId));
            });
        }
    }

    async function cargarDatosBase() {
        try {
            const [estRes, factRes] = await Promise.all([
                window.ApiService.obtenerEstudiantes(),
                window.ApiService.obtenerFacturas()
            ]);

            estudiantes = Array.isArray(estRes.data) ? estRes.data : [];
            facturas = Array.isArray(factRes.data) ? factRes.data : [];
            facturasFiltradas = [...facturas];

            renderSelectEstudiantes();
            aplicarFiltros();
        } catch (error) {
            console.error('Error cargando datos para pagos administrativos:', error);
            window.UI.showMessage(
                'pagos-admin-message',
                'danger',
                error.message || 'No se pudieron cargar los datos de pagos administrativos.'
            );
        }
    }

    function renderSelectEstudiantes() {
        const select = document.getElementById('select-admin-estudiante-pago');
        if (!select) return;

        if (!estudiantes.length) {
            select.innerHTML = '<option value="">No hay estudiantes disponibles</option>';
            return;
        }

        select.innerHTML = `
            <option value="">Todos los estudiantes</option>
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

    function aplicarFiltros() {
        const estudianteId = Number(document.getElementById('select-admin-estudiante-pago')?.value || 0);
        const texto = String(document.getElementById('filtro-admin-factura-pago')?.value || '')
            .trim()
            .toLowerCase();

        facturaSeleccionada = null;

        facturasFiltradas = facturas
            .filter((f) => Number(f.SaldoPendiente || 0) > 0)
            .filter((f) => !estudianteId || Number(f.EstudianteID || 0) === estudianteId)
            .filter((f) => {
                return (
                    !texto ||
                    String(f.NumeroFactura || '').toLowerCase().includes(texto) ||
                    String(f.NombreEstudiante || f.Estudiante || '').toLowerCase().includes(texto) ||
                    String(f.Carnet || '').toLowerCase().includes(texto) ||
                    String(f.NombrePeriodo || '').toLowerCase().includes(texto)
                );
            })
            .sort((a, b) => Number(b.FacturaID || 0) - Number(a.FacturaID || 0));

        renderFacturas();
        renderDetalle();
    }

    function renderFacturas() {
        const lista = document.getElementById('lista-facturas-admin');
        if (!lista) return;

        if (!facturasFiltradas.length) {
            lista.innerHTML = '<div class="matricula-empty">No hay facturas pendientes para este filtro.</div>';
            return;
        }

        lista.innerHTML = facturasFiltradas.map((f) => {
            const seleccionada = facturaSeleccionada && Number(facturaSeleccionada.FacturaID) === Number(f.FacturaID);

            return `
                <div class="curso-card ${seleccionada ? 'selected' : ''}" data-factura-id="${f.FacturaID}">
                    <div class="curso-header">
                        <div>
                            <div class="curso-code">${escapeHtml(f.NumeroFactura || `FACTURA ${f.FacturaID}`)}</div>
                            <div class="curso-name">${escapeHtml(f.NombreEstudiante || f.Estudiante || 'N/D')}</div>
                        </div>
                        <span class="badge badge-warning">Pendiente</span>
                    </div>

                    <div class="curso-meta">
                        ${f.Carnet ? `<span><strong>Carnet:</strong> ${escapeHtml(f.Carnet)}</span>` : ''}
                        <span><strong>Período:</strong> ${escapeHtml(construirNombrePeriodo(f))}</span>
                        <span><strong>Total:</strong> ${window.Helpers.formatCurrency(f.Total || f.MontoTotal || 0)}</span>
                        <span><strong>Pagado:</strong> ${window.Helpers.formatCurrency(f.MontoPagado || 0)}</span>
                        <span><strong>Saldo:</strong> ${window.Helpers.formatCurrency(f.SaldoPendiente || 0)}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    function seleccionarFactura(facturaId) {
        facturaSeleccionada = facturasFiltradas.find((f) => Number(f.FacturaID) === Number(facturaId)) || null;
        renderFacturas();
        renderDetalle();
    }

    function renderDetalle() {
        const cont = document.getElementById('detalle-pago-admin');
        const inputMonto = document.getElementById('monto-pago-admin');

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
                    <div class="mini-card-value">${window.Helpers.formatCurrency(facturaSeleccionada.Total || facturaSeleccionada.MontoTotal || 0)}</div>
                </div>

                <div class="mini-card">
                    <div class="mini-card-label">Saldo</div>
                    <div class="mini-card-value">${window.Helpers.formatCurrency(facturaSeleccionada.SaldoPendiente || 0)}</div>
                </div>
            </div>

            <div class="mt-2">
                <p><strong>Estudiante:</strong> ${escapeHtml(facturaSeleccionada.NombreEstudiante || facturaSeleccionada.Estudiante || 'N/D')}</p>
                <p><strong>Carnet:</strong> ${escapeHtml(facturaSeleccionada.Carnet || 'N/D')}</p>
                <p><strong>Período:</strong> ${escapeHtml(construirNombrePeriodo(facturaSeleccionada))}</p>
                <p><strong>Estado factura:</strong> ${escapeHtml(facturaSeleccionada.EstadoFactura || 'Pendiente')}</p>
                <p><strong>Estado cuenta:</strong> ${escapeHtml(facturaSeleccionada.EstadoCuenta || 'Pendiente')}</p>
            </div>
        `;

        if (inputMonto) {
            inputMonto.value = Number(facturaSeleccionada.SaldoPendiente || 0);
        }
    }

    async function registrarPagoAdmin() {
        window.UI.clearMessage('pagos-admin-message');

        if (!facturaSeleccionada) {
            window.UI.showMessage('pagos-admin-message', 'danger', 'Seleccione una factura.');
            return;
        }

        const monto = Number(document.getElementById('monto-pago-admin')?.value || 0);
        const metodo = String(document.getElementById('metodo-pago-admin')?.value || '').trim();
        const referencia = String(document.getElementById('referencia-pago-admin')?.value || '').trim();

        if (Number.isNaN(monto) || monto <= 0) {
            window.UI.showMessage('pagos-admin-message', 'danger', 'Debe ingresar un monto válido.');
            return;
        }

        if (!metodo) {
            window.UI.showMessage('pagos-admin-message', 'danger', 'Debe seleccionar un método de pago.');
            return;
        }

        try {
            await window.ApiService.registrarPago({
                facturaId: facturaSeleccionada.FacturaID,
                estudianteId: facturaSeleccionada.EstudianteID,
                periodoId: facturaSeleccionada.PeriodoID,
                montoPago: monto,
                metodoPago: metodo,
                referenciaPago: referencia || `PAGO-ADMIN-${Date.now()}`
            });

            window.UI.showMessage(
                'pagos-admin-message',
                'success',
                'Pago administrativo registrado correctamente.'
            );

            await cargarDatosBase();

            const inputRef = document.getElementById('referencia-pago-admin');
            if (inputRef) inputRef.value = '';
        } catch (error) {
            console.error('Error registrando pago administrativo:', error);
            window.UI.showMessage(
                'pagos-admin-message',
                'danger',
                error.message || 'No se pudo registrar el pago administrativo.'
            );
        }
    }

    function construirNombrePeriodo(item) {
        const partes = [
            item.NombrePeriodo,
            item.TipoPeriodo,
            item.Anio ? `(${item.Anio})` : ''
        ].filter(Boolean);

        return partes.join(' ') || 'N/D';
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
        seleccionarFactura
    };
})();