window.Modules = window.Modules || {};

window.Modules.misFacturas = (function () {
    let facturasCache = [];

    async function init() {
        configurarEventos();
        await cargarMisFacturas();
    }

    function configurarEventos() {
        const tabla = document.getElementById('tabla-mis-facturas');
        if (tabla && !tabla.dataset.bound) {
            tabla.dataset.bound = 'true';
            tabla.addEventListener('click', manejarClickTabla);
        }
    }

    function manejarClickTabla(event) {
        const btnPagar = event.target.closest('[data-action="pagar-factura"]');
        if (!btnPagar) return;

        const facturaId = Number(btnPagar.dataset.facturaId);
        if (!facturaId) return;

        const factura = facturasCache.find((f) => Number(f.FacturaID) === facturaId);
        if (!factura) {
            UI.showMessage('facturas-message', 'danger', 'No se encontró la factura seleccionada.');
            return;
        }

        abrirModalPago(factura);
    }

    async function cargarMisFacturas() {
        const session = Auth.getSession();
        const tabla = document.getElementById('tabla-mis-facturas');

        if (!session?.estudianteId) {
            UI.showMessage('facturas-message', 'danger', 'No se encontró la sesión del estudiante.');
            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="7">No se encontró la sesión del estudiante.</td></tr>';
            }
            return;
        }

        try {
            const response = await ApiService.obtenerHistorialFinancieroEstudiante(session.estudianteId);
            const facturas = Array.isArray(response.data) ? response.data : [];

            facturasCache = facturas;

            const total = facturas.length;
            const monto = facturas.reduce((acc, item) => acc + Number(item.MontoTotal || 0), 0);
            const pendiente = facturas.reduce((acc, item) => acc + Number(item.SaldoPendiente || 0), 0);

            setText('mis-facturas-total', total);
            setText('mis-facturas-monto', Helpers.formatCurrency(monto));
            setText('mis-facturas-pendiente', Helpers.formatCurrency(pendiente));

            renderTabla(facturas);
        } catch (error) {
            console.error('Error cargando facturas del estudiante:', error);
            UI.showMessage('facturas-message', 'danger', error.message || 'No se pudieron cargar las facturas.');

            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="7">Error cargando facturas.</td></tr>';
            }
        }
    }

    function renderTabla(facturas) {
        const tabla = document.getElementById('tabla-mis-facturas');
        if (!tabla) return;

        if (!facturas.length) {
            tabla.innerHTML = '<tr><td colspan="7">No hay facturas registradas.</td></tr>';
            return;
        }

        tabla.innerHTML = facturas.map((item) => {
            const saldoPendiente = Number(item.SaldoPendiente || 0);
            const puedePagar = saldoPendiente > 0;

            return `
                <tr>
                    <td>${escapeHtml(item.NumeroFactura || 'N/D')}</td>
                    <td>${escapeHtml(item.NombrePeriodo || 'N/D')}</td>
                    <td>${Helpers.formatCurrency(item.MontoTotal || 0)}</td>
                    <td>${Helpers.formatCurrency(item.MontoPagado || 0)}</td>
                    <td>${Helpers.formatCurrency(saldoPendiente)}</td>
                    <td>
                        ${
                            puedePagar
                                ? `<button
                                        type="button"
                                        class="btn btn-primary"
                                        data-action="pagar-factura"
                                        data-factura-id="${Number(item.FacturaID)}"
                                   >
                                        Pagar
                                   </button>`
                                : `<span class="text-muted">Pagada</span>`
                        }
                    </td>
                    <td>
                        <span class="badge ${getBadgeEstadoFactura(item.EstadoFactura || item.EstadoCuenta)}">
                            ${escapeHtml(item.EstadoFactura || item.EstadoCuenta || 'N/D')}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function abrirModalPago(factura) {
        const session = Auth.getSession();
        const nombreSugerido =
            session?.fullName ||
            session?.nombreCompleto ||
            session?.username ||
            '';

        const saldoPendiente = Number(factura.SaldoPendiente || 0);

        UI.openModal({
            title: 'Pago con tarjeta',
            body: `
                <div class="form-group">
                    <label class="form-label">Factura</label>
                    <input class="form-control" type="text" value="${escapeHtml(factura.NumeroFactura || 'N/D')}" disabled>
                </div>

                <div class="form-group">
                    <label class="form-label">Período</label>
                    <input class="form-control" type="text" value="${escapeHtml(factura.NombrePeriodo || 'N/D')}" disabled>
                </div>

                <div class="form-group">
                    <label class="form-label">Monto a pagar</label>
                    <input class="form-control" type="text" value="${escapeHtml(Helpers.formatCurrency(saldoPendiente))}" disabled>
                </div>

                <div class="form-group">
                    <label class="form-label" for="pago-nombre">Nombre del tarjetahabiente</label>
                    <input class="form-control" id="pago-nombre" type="text" placeholder="Nombre completo" value="${escapeHtml(nombreSugerido)}">
                </div>

                <div class="form-group">
                    <label class="form-label" for="pago-tarjeta">Número de tarjeta</label>
                    <input class="form-control" id="pago-tarjeta" type="text" placeholder="1234 5678 9012 3456" maxlength="19">
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label" for="pago-vencimiento">Vencimiento</label>
                        <input class="form-control" id="pago-vencimiento" type="text" placeholder="MM/AA" maxlength="5">
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="pago-cvv">CVV</label>
                        <input class="form-control" id="pago-cvv" type="password" placeholder="123" maxlength="4">
                    </div>
                </div>

                <div id="pago-modal-message"></div>
            `,
            confirmText: 'Confirmar pago',
            cancelText: 'Cancelar',
            onConfirm: async () => {
                await procesarPagoFactura(factura);
            }
        });
    }

    async function procesarPagoFactura(factura) {
        const session = Auth.getSession();

        const nombre = String(document.getElementById('pago-nombre')?.value || '').trim();
        const tarjetaRaw = String(document.getElementById('pago-tarjeta')?.value || '').trim();
        const vencimiento = String(document.getElementById('pago-vencimiento')?.value || '').trim();
        const cvv = String(document.getElementById('pago-cvv')?.value || '').trim();

        const numeroTarjeta = tarjetaRaw.replace(/\s+/g, '');
        const saldoPendiente = Number(factura.SaldoPendiente || 0);

        if (!nombre) {
            UI.showMessage('pago-modal-message', 'danger', 'Debe ingresar el nombre del tarjetahabiente.');
            throw new Error('Validación de nombre');
        }

        if (!/^\d{16}$/.test(numeroTarjeta)) {
            UI.showMessage('pago-modal-message', 'danger', 'El número de tarjeta debe tener 16 dígitos.');
            throw new Error('Validación de tarjeta');
        }

        if (!/^\d{2}\/\d{2}$/.test(vencimiento)) {
            UI.showMessage('pago-modal-message', 'danger', 'El vencimiento debe tener formato MM/AA.');
            throw new Error('Validación de vencimiento');
        }

        if (!/^\d{3,4}$/.test(cvv)) {
            UI.showMessage('pago-modal-message', 'danger', 'El CVV debe tener 3 o 4 dígitos.');
            throw new Error('Validación de CVV');
        }

        if (!session?.estudianteId) {
            UI.showMessage('pago-modal-message', 'danger', 'No se encontró la sesión del estudiante.');
            throw new Error('Sesión inválida');
        }

        if (!factura?.FacturaID || !factura?.PeriodoID) {
            UI.showMessage('pago-modal-message', 'danger', 'La factura no tiene datos suficientes para registrar el pago.');
            throw new Error('Factura inválida');
        }

        const ultimos4 = numeroTarjeta.slice(-4);
        const referenciaPago = `TARJETA ****${ultimos4} | ${nombre} | ${vencimiento}`;

        try {
            await ApiService.registrarPago({
                facturaId: Number(factura.FacturaID),
                estudianteId: Number(session.estudianteId),
                periodoId: Number(factura.PeriodoID),
                montoPago: saldoPendiente,
                metodoPago: 'Tarjeta',
                referenciaPago
            });

            UI.closeModal();
            UI.showMessage('facturas-message', 'success', 'Pago registrado correctamente.');
            await cargarMisFacturas();
        } catch (error) {
            console.error('Error registrando pago:', error);
            UI.showMessage(
                'pago-modal-message',
                'danger',
                error.message || 'No se pudo registrar el pago.'
            );
            throw error;
        }
    }

    return {
        init
    };
})();