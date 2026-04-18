window.Modules = window.Modules || {};

window.Modules.auditorTrazabilidad = (function () {
    async function init() {
        await cargarTrazabilidad();
    }

    async function cargarTrazabilidad() {
        const tabla = document.getElementById('tabla-auditor-trazabilidad');

        try {
            const [auditoriaRes, facturasRes, pagosRes] = await Promise.all([
                window.ApiService.obtenerAuditoria(),
                window.ApiService.obtenerFacturas(),
                window.ApiService.obtenerPagos()
            ]);

            const auditoria = Array.isArray(auditoriaRes.data) ? auditoriaRes.data : [];
            const facturas = Array.isArray(facturasRes.data) ? facturasRes.data : [];
            const pagos = Array.isArray(pagosRes.data) ? pagosRes.data : [];

            const criticos = auditoria.filter((item) => {
                const accion = String(item.Accion || item.accion || '').toLowerCase();
                return (
                    accion.includes('anulad') ||
                    accion.includes('elimin') ||
                    accion.includes('bloque') ||
                    accion.includes('actualiz') ||
                    accion.includes('cambio')
                );
            });

            setText('auditor-traza-total', auditoria.length);
            setText('auditor-traza-facturas', facturas.length);
            setText('auditor-traza-pagos', pagos.length);
            setText('auditor-traza-criticos', criticos.length);

            renderTabla(auditoria, facturas, pagos);
        } catch (error) {
            console.error('Error cargando trazabilidad:', error);
            window.UI.showMessage(
                'auditor-trazabilidad-message',
                'danger',
                error.message || 'No se pudo cargar la trazabilidad.'
            );

            if (tabla) {
                tabla.innerHTML = '<tr><td colspan="5">Error cargando trazabilidad.</td></tr>';
            }
        }
    }

    function renderTabla(auditoria, facturas, pagos) {
        const tabla = document.getElementById('tabla-auditor-trazabilidad');
        if (!tabla) return;

        const filasAuditoria = auditoria.map((item) => ({
            tipo: 'Auditoría',
            referencia: item.AuditoriaID || item.id || 'N/D',
            usuario: item.Usuario || item.username || 'N/D',
            fecha: item.Fecha || item.fecha || null,
            detalle: item.Descripcion || item.descripcion || 'Sin descripción'
        }));

        const filasFacturas = facturas.map((item) => ({
            tipo: 'Factura',
            referencia: item.NumeroFactura || item.FacturaID || 'N/D',
            usuario: item.NombreEstudiante || item.Estudiante || 'N/D',
            fecha: item.FechaFactura || item.Fecha || null,
            detalle: `Estado: ${item.EstadoFactura || item.Estado || 'N/D'} - Total: ${window.Helpers.formatCurrency(item.Total || item.MontoTotal || 0)}`
        }));

        const filasPagos = pagos.map((item) => ({
            tipo: 'Pago',
            referencia: item.ReferenciaPago || item.Referencia || item.PagoID || 'N/D',
            usuario: item.NombreEstudiante || item.Estudiante || 'N/D',
            fecha: item.FechaPago || item.Fecha || null,
            detalle: `Factura: ${item.NumeroFactura || item.FacturaID || 'N/D'} - Monto: ${window.Helpers.formatCurrency(item.MontoPago || item.Monto || 0)}`
        }));

        const filas = [...filasAuditoria, ...filasFacturas, ...filasPagos]
            .sort((a, b) => {
                const fechaA = new Date(a.fecha || 0).getTime();
                const fechaB = new Date(b.fecha || 0).getTime();
                return fechaB - fechaA;
            })
            .slice(0, 30);

        if (!filas.length) {
            tabla.innerHTML = '<tr><td colspan="5">No hay movimientos trazables.</td></tr>';
            return;
        }

        tabla.innerHTML = filas.map((item) => `
            <tr>
                <td>${escapeHtml(item.tipo)}</td>
                <td>${escapeHtml(item.referencia)}</td>
                <td>${escapeHtml(item.usuario)}</td>
                <td>${escapeHtml(formatearFecha(item.fecha))}</td>
                <td>${escapeHtml(item.detalle)}</td>
            </tr>
        `).join('');
    }

    return {
        init
    };
})();