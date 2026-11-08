import React from 'react';

/**
 * Comprobante digital accesible e inmutable de transacción de pago de garantía (CU-27 / D17).
 */
export default function ComprobanteDigitalTransaccion({ comprobante, alCerrar, alIrAHistorial }) {
  if (!comprobante) return null;

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1200,
        padding: '1rem',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="modal-contenido tarjeta"
        style={{
          maxWidth: '500px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '1.75rem',
          textAlign: 'center',
          boxShadow: '0 25px 30px -5px rgba(0, 0, 0, 0.25)',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#DEF7EC',
            color: '#03543F',
            fontSize: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
          }}
        >
          ✓
        </div>

        <h3 style={{ margin: '0 0 0.25rem 0', color: '#0A6C84', fontSize: '1.35rem' }}>
          ¡Cita y Depósito Confirmados!
        </h3>
        <p style={{ color: '#64748B', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
          Su turno médico ha sido garantizado con el pago del depósito oficial.
        </p>

        <div
          style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '1rem',
            textAlign: 'left',
            marginBottom: '1.5rem',
            fontSize: '0.88rem',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.25rem' }}>
            <span style={{ color: '#64748B' }}>Código de Cita:</span>
            <span style={{ fontWeight: 800, color: '#0A6C84', fontFamily: 'monospace' }}>
              {comprobante.codigo_cita}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.25rem' }}>
            <span style={{ color: '#64748B' }}>Nro. de Transacción:</span>
            <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#334155' }}>
              {comprobante.nro_transaccion}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.25rem' }}>
            <span style={{ color: '#64748B' }}>Monto Pagado:</span>
            <span style={{ fontWeight: 800, color: '#03543F' }}>
              {comprobante.monto || '50.00'} Bs (Depósito Garantía)
            </span>
          </div>
          {comprobante.fecha && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.25rem' }}>
              <span style={{ color: '#64748B' }}>Fecha y Turno:</span>
              <span style={{ fontWeight: 600 }}>{comprobante.fecha} a las {comprobante.hora}</span>
            </div>
          )}
          {comprobante.especialidad && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.25rem' }}>
              <span style={{ color: '#64748B' }}>Especialidad / Médico:</span>
              <span style={{ fontWeight: 600 }}>{comprobante.especialidad} {comprobante.medico ? `(Dr. ${comprobante.medico})` : ''}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.25rem' }}>
            <span style={{ color: '#64748B' }}>Método de Pago:</span>
            <span style={{ fontWeight: 600 }}>{comprobante.metodo_pago || 'Simple QR'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {alIrAHistorial && (
            <button
              type="button"
              onClick={alIrAHistorial}
              className="boton-primario"
              style={{ minHeight: '44px', width: '100%', fontWeight: 700 }}
            >
              Ir a Mis Citas y Seguimiento
            </button>
          )}
          <button
            type="button"
            onClick={alCerrar}
            className="boton-terciario"
            style={{ minHeight: '44px', width: '100%' }}
          >
            Aceptar y Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
