import React, { useState } from 'react';
import qrImagen from '../../../assets/qr_pago_reserva.svg';

/**
 * Modal interactivo para pasarela de pago simulado de garantía de reserva (CU-27 / D17).
 * Soporta selección de Simple QR interoperable y Tarjeta Débito/Crédito simulada con diseño mobile-first y botones >= 44px.
 */
export default function ModalPasarelaPagoSimulada({
  abierto,
  alCerrar,
  alConfirmarPago,
  procesando = false,
  monto = 50.00,
  detalleTurno = null,
  metodoPago: propMetodoPago,
  setMetodoPago: propSetMetodoPago,
}) {
  const [metodoPagoInterno, setMetodoPagoInterno] = useState('tarjeta_debito_credito'); // 'tarjeta_debito_credito' | 'qr_transferencia'
  const metodoPago = propMetodoPago !== undefined ? propMetodoPago : metodoPagoInterno;
  const setMetodoPago = propSetMetodoPago || setMetodoPagoInterno;
  const [tarjetaNumero, setTarjetaNumero] = useState('4500 1234 5678 9010');
  const [tarjetaVence, setTarjetaVence] = useState('12/28');
  const [tarjetaCvv, setTarjetaCvv] = useState('789');

  if (!abierto) return null;

  const esQr = metodoPago === 'qr_transferencia' || metodoPago === 'qr';

  const manejarConfirmacion = (e) => {
    e.preventDefault();
    const metodoNormalizado = esQr ? 'qr_transferencia' : 'tarjeta_debito_credito';
    const datos = {
      metodo_pago: metodoNormalizado,
      referencia_simulada: esQr ? 'QR-BCP-PAGO' : `CARD-****-${tarjetaNumero.replace(/\s/g, '').slice(-4)}`,
      monto: Number(monto),
      detalles_pasarela: {
        origen: 'pasarela_web',
        metodo: metodoNormalizado,
        banco: esQr ? 'Simple QR Interoperable' : 'Visa / MasterCard',
        monto_bs: Number(monto),
      },
    };
    alConfirmarPago(datos);
  };

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
        zIndex: 1100,
        padding: '1rem',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="modal-contenido tarjeta"
        style={{
          maxWidth: '480px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 25px 30px -5px rgba(0, 0, 0, 0.25)',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 style={{ margin: 0, color: '#1C2D37', fontSize: '1.25rem' }}>
            Garantía de Reserva
          </h3>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0A6C84', backgroundColor: '#E0F2FE', padding: '4px 8px', borderRadius: '6px' }}>
            {Number(monto).toFixed(2)} Bs
          </span>
        </div>

        <p style={{ fontSize: '0.86rem', color: '#64748B', lineHeight: '1.45', marginBottom: '1rem' }}>
          Este monto asegura su turno médico. Es 100% reembolsable si cancela con al menos 12 horas de anticipación.
        </p>

        {detalleTurno && (
          <div
            style={{
              backgroundColor: '#F1F5F9',
              borderRadius: '8px',
              padding: '0.75rem',
              marginBottom: '1rem',
              fontSize: '0.84rem',
              color: '#334155',
            }}
          >
            {detalleTurno.fecha && (
              <div><b>Turno:</b> {detalleTurno.fecha} ({detalleTurno.hora_inicio || detalleTurno.hora})</div>
            )}
            {detalleTurno.especialidad && (
              <div><b>Especialidad:</b> {detalleTurno.especialidad}</div>
            )}
            {detalleTurno.medico && (
              <div><b>Médico:</b> Dr. {detalleTurno.medico}</div>
            )}
          </div>
        )}

        <form onSubmit={manejarConfirmacion}>
          {/* Selector de Método de Pago */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
              Seleccione Medio de Pago:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setMetodoPago('tarjeta_debito_credito')}
                style={{
                  minHeight: '44px',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  border: !esQr ? '2px solid #0A6C84' : '1px solid #CBD5E1',
                  backgroundColor: !esQr ? '#F0FDFA' : '#FFFFFF',
                  color: !esQr ? '#0A6C84' : '#64748B',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  boxSizing: 'border-box',
                }}
              >
                💳 Tarjeta Débito/Crédito
              </button>
              <button
                type="button"
                onClick={() => setMetodoPago('qr_transferencia')}
                style={{
                  minHeight: '44px',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  border: esQr ? '2px solid #0A6C84' : '1px solid #CBD5E1',
                  backgroundColor: esQr ? '#F0FDFA' : '#FFFFFF',
                  color: esQr ? '#0A6C84' : '#64748B',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  boxSizing: 'border-box',
                }}
              >
                📱 Simple QR
              </button>
            </div>
          </div>

          {/* Visualización del Método de Pago */}
          {esQr ? (
            <div
              style={{
                textAlign: 'center',
                padding: '1.25rem 1rem',
                border: '1px dashed #CBD5E1',
                borderRadius: '8px',
                marginBottom: '1.25rem',
                backgroundColor: '#FAFAFA',
              }}
            >
              <div
                style={{
                  display: 'inline-block',
                  padding: '8px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 12px rgba(10, 108, 132, 0.08)',
                  margin: '0 auto',
                }}
              >
                <img
                  src={qrImagen}
                  alt="Simple QR - Clínica Vida Salud"
                  style={{
                    width: '160px',
                    height: '160px',
                    display: 'block',
                    margin: '0 auto',
                    borderRadius: '4px',
                  }}
                />
              </div>
              <p style={{ fontSize: '0.84rem', color: '#475569', fontWeight: 500, marginTop: '0.75rem', marginBottom: 0, lineHeight: 1.45 }}>
                Escanee este código desde su aplicación bancaria para autorizar la transacción.
              </p>
            </div>
          ) : (
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginBottom: '0.2rem' }}>
                  Número de Tarjeta
                </label>
                <input
                  type="text"
                  value={tarjetaNumero}
                  onChange={(e) => setTarjetaNumero(e.target.value)}
                  style={{ width: '100%', minHeight: '40px', padding: '0.6rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginBottom: '0.2rem' }}>
                    Vencimiento
                  </label>
                  <input
                    type="text"
                    value={tarjetaVence}
                    onChange={(e) => setTarjetaVence(e.target.value)}
                    style={{ width: '100%', minHeight: '40px', padding: '0.6rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginBottom: '0.2rem' }}>
                    CVV / CVC
                  </label>
                  <input
                    type="text"
                    value={tarjetaCvv}
                    onChange={(e) => setTarjetaCvv(e.target.value)}
                    style={{ width: '100%', minHeight: '40px', padding: '0.6rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Botones táctiles >= 44px */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <button
              type="submit"
              disabled={procesando}
              className="boton-primario"
              style={{ minHeight: '46px', width: '100%', fontSize: '0.95rem', fontWeight: 700 }}
            >
              {procesando ? 'Procesando Pago…' : `✓ Confirmar Pago Exitoso (${Number(monto).toFixed(2)} Bs)`}
            </button>
            <button
              type="button"
              onClick={alCerrar}
              disabled={procesando}
              className="boton-terciario"
              style={{ minHeight: '44px', width: '100%' }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
