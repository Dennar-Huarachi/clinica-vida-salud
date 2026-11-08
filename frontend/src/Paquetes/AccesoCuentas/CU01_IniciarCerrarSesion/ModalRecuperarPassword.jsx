import React, { useState } from 'react';

/**
 * ModalRecuperarPassword
 * Ventana modal accesible para la recuperación o restablecimiento de contraseña
 * adaptada al tipo de cuenta (Paciente o Personal Institucional) según CU-02, CU-04 y CU-05.
 */
export default function ModalRecuperarPassword({ abierto, alCerrar, tipo = 'paciente' }) {
  const [identificadorConsulta, setIdentificadorConsulta] = useState('');
  const [mensajeEstado, setMensajeEstado] = useState(null);

  if (!abierto) return null;

  const esPaciente = tipo === 'paciente';

  const manejarConsultar = (e) => {
    e.preventDefault();
    if (!identificadorConsulta.trim()) {
      setMensajeEstado({
        tipo: 'error',
        texto: 'Por favor ingrese su Cédula de Identidad o correo para consultar.',
      });
      return;
    }

    setMensajeEstado({
      tipo: 'info',
      texto: `Hemos verificado el registro de su cuenta (${identificadorConsulta.trim()}). Para generar una nueva clave temporal, por favor comuníquese a la central telefónica o acérquese a recepción con su documento de identidad físico.`,
    });
  };

  return (
    <div className="modal-recuperar-overlay" onClick={alCerrar} role="dialog" aria-modal="true">
      <div
        className="modal-recuperar-contenedor"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado del Modal */}
        <div className="modal-recuperar-cabecera">
          <div className="modal-recuperar-icono">
            {esPaciente ? (
              <div className="icono-circulo-modal icono-paciente">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
            ) : (
              <div className="icono-circulo-modal icono-personal">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
            )}
          </div>

          <div>
            <h3 className="modal-recuperar-titulo">
              {esPaciente
                ? 'Recuperar Contraseña de Acceso'
                : 'Restablecimiento de Credenciales'}
            </h3>
            <span className="modal-recuperar-subtitulo">
              {esPaciente
                ? 'Protocolo de Seguridad para Pacientes'
                : 'Política de Administración de Sistemas'}
            </span>
          </div>

          <button
            type="button"
            onClick={alCerrar}
            className="modal-recuperar-cerrar"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="modal-recuperar-cuerpo">
          {esPaciente ? (
            <div>
              {/* Explicación del protocolo para pacientes */}
              <div className="alerta-protocolo alerta-protocolo-paciente">
                <p>
                  <strong>🔒 Protocolo de Protección de Datos Médicos:</strong>
                </p>
                <p style={{ marginTop: '0.35rem' }}>
                  Por estricta seguridad de su <strong>expediente clínico</strong> y la privacidad de sus diagnósticos, el restablecimiento de contraseña se realiza previa <strong>verificación presencial de identidad en recepción</strong> o comunicándose con el soporte oficial de la clínica.
                </p>
              </div>

              {/* Consulta rápida de cuenta activa */}
              <form onSubmit={manejarConsultar} style={{ marginTop: '1.25rem' }}>
                <label
                  htmlFor="consulta-ci"
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--texto)',
                    marginBottom: '0.4rem',
                  }}
                >
                  Consultar estado de cuenta asistida:
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <input
                    id="consulta-ci"
                    type="text"
                    value={identificadorConsulta}
                    onChange={(e) => setIdentificadorConsulta(e.target.value)}
                    placeholder="Ingrese su CI o Correo Electrónico"
                    className="input-campo"
                    style={{ flex: 1, minHeight: '44px', minWidth: '200px' }}
                  />
                  <button
                    type="submit"
                    className="boton-secundario"
                    style={{ minHeight: '44px', padding: '0 1rem', fontSize: '0.9rem' }}
                  >
                    Verificar
                  </button>
                </div>
              </form>

              {mensajeEstado && (
                <div
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    lineHeight: 1.45,
                    background: mensajeEstado.tipo === 'error' ? '#FEECEB' : '#E8F8FA',
                    color: mensajeEstado.tipo === 'error' ? 'var(--cancelada)' : 'var(--verde-azulado)',
                    border: `1px solid ${mensajeEstado.tipo === 'error' ? '#F5C6CB' : '#BEE5EB'}`,
                  }}
                >
                  {mensajeEstado.texto}
                </div>
              )}

              {/* Canales de Asistencia */}
              <div className="canales-soporte-grid">
                <div className="canal-item">
                  <span className="canal-icono">📞</span>
                  <div>
                    <strong>Central Telefónica:</strong>
                    <p>(591) 2 2441234 — Int. 10</p>
                  </div>
                </div>

                <div className="canal-item">
                  <span className="canal-icono">💬</span>
                  <div>
                    <strong>WhatsApp Recepción:</strong>
                    <p>+591 70001234</p>
                  </div>
                </div>

                <div className="canal-item" style={{ gridColumn: '1 / -1' }}>
                  <span className="canal-icono">🏥</span>
                  <div>
                    <strong>Atención Presencial:</strong>
                    <p>Av. Principal #1234 — Lun a Sáb: 07:00 a 20:00</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Explicación de política de administración institucional */}
              <div className="alerta-protocolo alerta-protocolo-personal">
                <p>
                  <strong>🛡️ Gestión de Acceso Institucional:</strong>
                </p>
                <p style={{ marginTop: '0.35rem' }}>
                  El restablecimiento de claves del personal médico, recepcionistas y administrativo es gestionado directamente por la <strong>Dirección de Sistemas y el Administrador</strong> de la clínica.
                </p>
              </div>

              <div style={{ marginTop: '1.25rem', color: 'var(--texto-sec)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                <p>
                  Si ha olvidado sus credenciales o su cuenta fue bloqueada temporalmente por intentos fallidos, contacte de inmediato al área de tecnología:
                </p>
              </div>

              <div className="canales-soporte-grid">
                <div className="canal-item">
                  <span className="canal-icono">💻</span>
                  <div>
                    <strong>Dirección de TI:</strong>
                    <p>sistemas@vidasalud.bo</p>
                  </div>
                </div>

                <div className="canal-item">
                  <span className="canal-icono">📞</span>
                  <div>
                    <strong>Anexo Interno:</strong>
                    <p>Int. 101 / 102</p>
                  </div>
                </div>

                <div className="canal-item" style={{ gridColumn: '1 / -1' }}>
                  <span className="canal-icono">🏢</span>
                  <div>
                    <strong>Ubicación Física:</strong>
                    <p>Torre Médica — Piso 3, Oficina de Tecnología</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pie del Modal */}
        <div className="modal-recuperar-pie">
          <button
            type="button"
            onClick={alCerrar}
            className={esPaciente ? 'boton-primario' : 'boton-secundario'}
            style={{ width: '100%', minHeight: '44px', fontSize: '0.95rem', fontWeight: 700 }}
          >
            Entendido / Volver al Login
          </button>
        </div>
      </div>

      {/* ============================================================
          ESTILOS CSS RESPONSIVE DEL MODAL
          ============================================================ */}
      <style>{`
        .modal-recuperar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(18, 52, 59, 0.55);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          z-index: 9999;
          box-sizing: border-box;
        }

        .modal-recuperar-contenedor {
          width: 100%;
          max-width: 500px;
          background: var(--blanco);
          border-radius: 16px;
          box-shadow: 0 16px 40px rgba(10, 108, 132, 0.22);
          overflow: hidden;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          transform: none !important;
          animation: none !important;
        }

        .modal-recuperar-cabecera {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 1.25rem 1.5rem;
          background: #F4FAFB;
          border-bottom: 1px solid #DCE9ED;
          position: relative;
        }

        .icono-circulo-modal {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .icono-circulo-modal.icono-paciente {
          background: #E8F8FA;
          color: var(--turquesa);
        }

        .icono-circulo-modal.icono-personal {
          background: #EDF6F8;
          color: var(--verde-azulado);
        }

        .modal-recuperar-titulo {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--texto);
          margin: 0;
        }

        .modal-recuperar-subtitulo {
          font-size: 0.775rem;
          color: var(--texto-sec);
        }

        .modal-recuperar-cerrar {
          margin-left: auto;
          background: none;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 1.15rem;
          color: var(--texto-sec);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }

        .modal-recuperar-cerrar:hover {
          background: #E2ECEF;
          color: var(--texto);
        }

        .modal-recuperar-cuerpo {
          padding: 1.5rem;
          overflow-y: auto;
          flex: 1;
        }

        .alerta-protocolo {
          padding: 0.85rem 1rem;
          border-radius: 10px;
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .alerta-protocolo-paciente {
          background: #FFF8F0;
          border-left: 4px solid var(--naranja);
          color: #7A3E00;
        }

        .alerta-protocolo-personal {
          background: #EDF6F8;
          border-left: 4px solid var(--verde-azulado);
          color: var(--verde-azulado);
        }

        .canales-soporte-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          margin-top: 1.25rem;
        }

        .canal-item {
          display: flex;
          align-items: flex-start;
          gap: 0.6rem;
          padding: 0.75rem;
          background: #F7FCFD;
          border: 1px solid #E1EFF2;
          border-radius: 8px;
          font-size: 0.825rem;
        }

        .canal-item strong {
          color: var(--texto);
          display: block;
        }

        .canal-item p {
          color: var(--texto-sec);
          margin: 0.15rem 0 0 0;
        }

        .canal-icono {
          font-size: 1.25rem;
          line-height: 1;
        }

        .modal-recuperar-pie {
          padding: 1rem 1.5rem;
          background: #FAFDFE;
          border-top: 1px solid #EDF5F7;
        }

        @media (max-width: 640px) {
          .modal-recuperar-overlay {
            padding: 0;
            align-items: flex-end;
          }

          .modal-recuperar-contenedor {
            max-width: 100%;
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
            max-height: 85vh;
          }

          .canales-soporte-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
