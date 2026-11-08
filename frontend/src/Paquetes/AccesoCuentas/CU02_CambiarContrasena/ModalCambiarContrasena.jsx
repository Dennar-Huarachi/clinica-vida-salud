import React, { useState, useEffect } from 'react';
import api from '../../../compartido/utilidades/api';
import Alerta from '../../../compartido/componentes/Alerta';
import ChecklistContrasena, { esContrasenaSegura } from '../../../comun/componentes/ChecklistContrasena';

/**
 * ModalCambiarContrasena (CU-02 — Cambiar y recuperar contraseña)
 * Modal accesible de cambio de contraseña para todos los usuarios autenticados.
 * Valida que la nueva contraseña cumpla los 5 requisitos de seguridad
 * y que no sea idéntica a la actual.
 */
export default function ModalCambiarContrasena({ abierto, alCerrar, forzarCambio = false }) {
  const [contrasenaActual, setContrasenaActual] = useState('');
  const [contrasenaNueva, setContrasenaNueva] = useState('');
  const [confirmacionContrasena, setConfirmacionContrasena] = useState('');

  const [mostrarActual, setMostrarActual] = useState(false);
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  const [errores, setErrores] = useState({});
  const [alerta, setAlerta] = useState(null);
  const [cargando, setCargando] = useState(false);

  // Limpiar campos al abrir/cerrar
  useEffect(() => {
    if (abierto) {
      setContrasenaActual('');
      setContrasenaNueva('');
      setConfirmacionContrasena('');
      setErrores({});
      setAlerta(null);
      setMostrarActual(false);
      setMostrarNueva(false);
      setMostrarConfirmacion(false);
    }
  }, [abierto]);

  // Manejar tecla ESC para accesibilidad (deshabilitado en modo forzado)
  useEffect(() => {
    const manejarTecla = (e) => {
      if (e.key === 'Escape' && abierto && !cargando && !forzarCambio) {
        alCerrar();
      }
    };
    window.addEventListener('keydown', manejarTecla);
    return () => window.removeEventListener('keydown', manejarTecla);
  }, [abierto, cargando, alCerrar, forzarCambio]);

  if (!abierto) return null;

  const validarFormulario = () => {
    const err = {};
    if (!contrasenaActual) {
      err.contrasena_actual = 'Ingrese su contraseña actual.';
    }
    if (!contrasenaNueva) {
      err.contrasena_nueva = 'Ingrese la nueva contraseña.';
    } else if (!esContrasenaSegura(contrasenaNueva)) {
      err.contrasena_nueva = 'La nueva contraseña no cumple con todos los requisitos de seguridad.';
    } else if (contrasenaActual && contrasenaNueva === contrasenaActual) {
      err.contrasena_nueva = 'La nueva contraseña no puede ser idéntica a la contraseña actual.';
    }

    if (!confirmacionContrasena) {
      err.confirmacion_contrasena = 'Confirme la nueva contraseña.';
    } else if (contrasenaNueva !== confirmacionContrasena) {
      err.confirmacion_contrasena = 'Las contraseñas no coinciden.';
    }

    setErrores(err);
    return Object.keys(err).length === 0;
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setAlerta(null);

    if (!validarFormulario()) {
      return;
    }

    setCargando(true);

    try {
      const payload = {
        contrasena_actual: contrasenaActual,
        contrasena_nueva: contrasenaNueva,
        confirmacion_contrasena: confirmacionContrasena,
      };

      const respuesta = await api.post('/acceso/cambiar-contrasena', payload);

      setAlerta({
        tipo: 'exito',
        mensaje: respuesta.data?.mensaje || 'Contraseña actualizada exitosamente.',
      });

      // Actualizar en localStorage el estado debe_cambiar_contrasena
      const usuarioStr = localStorage.getItem('usuario_clinica');
      if (usuarioStr) {
        try {
          const u = JSON.parse(usuarioStr);
          u.debe_cambiar_contrasena = false;
          localStorage.setItem('usuario_clinica', JSON.stringify(u));
        } catch {
          // ignore
        }
      }

      setTimeout(() => {
        alCerrar();
      }, 1500);
    } catch (err) {
      if (err.response?.status === 422 && err.response.data?.errores) {
        setErrores(err.response.data.errores);
      } else {
        setAlerta({
          tipo: 'error',
          mensaje: err.response?.data?.mensaje || 'Error al actualizar la contraseña.',
        });
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="modal-contrasena-backdrop" onClick={() => !cargando && !forzarCambio && alCerrar()}>
      <div
        className="modal-contrasena-tarjeta"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-contrasena"
      >
        {/* Cabecera del Modal */}
        <div className="modal-contrasena-cabecera">
          <div className="modal-contrasena-icono-badge">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div>
            <h2 id="titulo-modal-contrasena" className="modal-contrasena-titulo">
              {forzarCambio ? 'Cambio Obligatorio de Contraseña' : 'Cambiar Contraseña'}
            </h2>
            <p className="modal-contrasena-subtitulo">
              {forzarCambio
                ? 'Primer inicio de sesión detectado. Por seguridad debe sustituir su contraseña temporal (CI) por una clave personal segura para continuar.'
                : 'Actualiza periódicamente tu clave para proteger la confidencialidad de tu cuenta.'}
            </p>
          </div>
          {!forzarCambio && (
            <button
              type="button"
              className="modal-contrasena-boton-cerrar"
              onClick={alCerrar}
              disabled={cargando}
              aria-label="Cerrar modal"
            >
              ✕
            </button>
          )}
        </div>

        {forzarCambio && (
          <div
            style={{
              backgroundColor: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              fontSize: '0.875rem',
              color: '#92400E',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'flex-start',
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>🛡️</span>
            <div>
              <strong>Requisito de Seguridad Inicial:</strong> Ingrese su número de carnet (CI) como <em>Contraseña Actual</em> y elija una nueva contraseña segura que cumpla con los requisitos mostrados abajo.
            </div>
          </div>
        )}

        <Alerta tipo={alerta?.tipo} mensaje={alerta?.mensaje} />

        <form onSubmit={manejarEnvio} noValidate>
          {/* Campo: Contraseña Actual */}
          <div className="campo-grupo-contrasena">
            <label className="campo-label-contrasena" htmlFor="contrasena-actual-modal">
              <span>Contraseña Actual</span>
              <span className="asterisco">*</span>
            </label>
            <div className="input-relativo-ojo">
              <input
                id="contrasena-actual-modal"
                type={mostrarActual ? 'text' : 'password'}
                value={contrasenaActual}
                onChange={(e) => {
                  setContrasenaActual(e.target.value);
                  if (errores.contrasena_actual) setErrores((prev) => ({ ...prev, contrasena_actual: null }));
                }}
                className={`input-modal-clave ${errores.contrasena_actual ? 'error' : ''}`}
                placeholder="Ingresa tu clave actual"
                autoComplete="current-password"
                disabled={cargando}
                autoFocus
              />
              <button
                type="button"
                className="boton-ojo-modal"
                onClick={() => setMostrarActual(!mostrarActual)}
                tabIndex={-1}
                aria-label={mostrarActual ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {mostrarActual ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {errores.contrasena_actual && (
              <span className="error-texto-modal">{Array.isArray(errores.contrasena_actual) ? errores.contrasena_actual[0] : errores.contrasena_actual}</span>
            )}
          </div>

          {/* Campo: Nueva Contraseña */}
          <div className="campo-grupo-contrasena">
            <label className="campo-label-contrasena" htmlFor="contrasena-nueva-modal">
              <span>Nueva Contraseña</span>
              <span className="asterisco">*</span>
            </label>
            <div className="input-relativo-ojo">
              <input
                id="contrasena-nueva-modal"
                type={mostrarNueva ? 'text' : 'password'}
                value={contrasenaNueva}
                onChange={(e) => {
                  setContrasenaNueva(e.target.value);
                  if (errores.contrasena_nueva) setErrores((prev) => ({ ...prev, contrasena_nueva: null }));
                }}
                className={`input-modal-clave ${errores.contrasena_nueva ? 'error' : ''}`}
                placeholder="Mínimo 8 car., mayús., minus., núm. y símbolo"
                autoComplete="new-password"
                disabled={cargando}
              />
              <button
                type="button"
                className="boton-ojo-modal"
                onClick={() => setMostrarNueva(!mostrarNueva)}
                tabIndex={-1}
                aria-label={mostrarNueva ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {mostrarNueva ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {errores.contrasena_nueva && (
              <span className="error-texto-modal">{Array.isArray(errores.contrasena_nueva) ? errores.contrasena_nueva[0] : errores.contrasena_nueva}</span>
            )}

            {/* Checklist Dinámico de Requisitos */}
            <ChecklistContrasena contrasena={contrasenaNueva} />
          </div>

          {/* Campo: Confirmar Nueva Contraseña */}
          <div className="campo-grupo-contrasena">
            <label className="campo-label-contrasena" htmlFor="confirmar-contrasena-modal">
              <span>Confirmar Nueva Contraseña</span>
              <span className="asterisco">*</span>
            </label>
            <div className="input-relativo-ojo">
              <input
                id="confirmar-contrasena-modal"
                type={mostrarConfirmacion ? 'text' : 'password'}
                value={confirmacionContrasena}
                onChange={(e) => {
                  setConfirmacionContrasena(e.target.value);
                  if (errores.confirmacion_contrasena) setErrores((prev) => ({ ...prev, confirmacion_contrasena: null }));
                }}
                className={`input-modal-clave ${errores.confirmacion_contrasena ? 'error' : ''}`}
                placeholder="Repite la nueva contraseña"
                autoComplete="new-password"
                disabled={cargando}
              />
              <button
                type="button"
                className="boton-ojo-modal"
                onClick={() => setMostrarConfirmacion(!mostrarConfirmacion)}
                tabIndex={-1}
                aria-label={mostrarConfirmacion ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {mostrarConfirmacion ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {errores.confirmacion_contrasena && (
              <span className="error-texto-modal">{Array.isArray(errores.confirmacion_contrasena) ? errores.confirmacion_contrasena[0] : errores.confirmacion_contrasena}</span>
            )}
          </div>

          {/* Botones de Acción */}
          <div className="modal-contrasena-acciones" style={{ justifyContent: forzarCambio ? 'flex-end' : 'flex-end' }}>
            {!forzarCambio && (
              <button
                type="button"
                className="boton-cancelar-modal"
                onClick={alCerrar}
                disabled={cargando}
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              className="boton-guardar-modal"
              disabled={cargando}
              style={{ width: forzarCambio ? '100%' : 'auto' }}
            >
              {cargando ? 'Actualizando contraseña…' : 'Guardar Nueva Contraseña'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .modal-contrasena-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(7, 68, 84, 0.45);
          backdrop-filter: blur(3px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          box-sizing: border-box;
          z-index: 2000;
        }

        .modal-contrasena-tarjeta {
          width: 100%;
          max-width: 520px;
          background: #FFFFFF;
          border-radius: 14px;
          box-shadow: 0 16px 40px rgba(7, 68, 84, 0.2);
          border: 1px solid #DCE9ED;
          border-top: 4px solid #1FA5B8;
          padding: 24px 28px;
          box-sizing: border-box;
          animation: animEntradaModal 0.2s ease-out;
        }

        @keyframes animEntradaModal {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(-8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .modal-contrasena-cabecera {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 16px;
          position: relative;
        }

        .modal-contrasena-icono-badge {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background-color: #EAF7F9;
          color: #1FA5B8;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .modal-contrasena-titulo {
          font-size: 1.25rem;
          color: #0A6C84;
          font-weight: 700;
          margin: 0 0 2px 0;
          line-height: 1.2;
        }

        .modal-contrasena-subtitulo {
          font-size: 13px;
          color: #5A7184;
          margin: 0;
          line-height: 1.35;
        }

        .modal-contrasena-boton-cerrar {
          position: absolute;
          top: -4px;
          right: -4px;
          background: transparent;
          border: none;
          color: #8BB2BC;
          font-size: 18px;
          cursor: pointer;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: background-color 0.15s ease, color 0.15s ease;
        }

        .modal-contrasena-boton-cerrar:hover:not(:disabled) {
          background-color: #F1F5F7;
          color: #0A6C84;
        }

        .campo-grupo-contrasena {
          margin-bottom: 14px;
        }

        .campo-label-contrasena {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #1C2D37;
          margin-bottom: 4px;
        }

        .asterisco {
          color: #DC2626;
          margin-left: 2px;
        }

        .input-relativo-ojo {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .input-modal-clave {
          width: 100%;
          min-height: 40px;
          background: #FFFFFF;
          border: 2px solid #DCE9ED;
          border-radius: 8px;
          padding: 0 40px 0 12px;
          font-family: inherit;
          font-size: 14px;
          color: #1C2D37;
          box-sizing: border-box;
          outline: none;
          transition: border-color 0.15s ease;
        }

        .input-modal-clave:focus {
          border-color: #1FA5B8;
        }

        .input-modal-clave.error {
          border-color: #DC2626;
          background-color: #FFFDFD;
        }

        .boton-ojo-modal {
          position: absolute;
          right: 2px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          cursor: pointer;
          color: #8BB2BC;
          border-radius: 6px;
          transition: color 0.15s ease;
        }

        .boton-ojo-modal:hover {
          color: #0A6C84;
        }

        .error-texto-modal {
          display: block;
          color: #DC2626;
          font-size: 11.5px;
          font-weight: 600;
          margin-top: 3px;
        }

        .modal-contrasena-acciones {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
          padding-top: 14px;
          border-top: 1px solid #EDF4F6;
        }

        .boton-cancelar-modal {
          background-color: #F1F6F8;
          color: #4A6572;
          border: 1px solid #D2E4E8;
          border-radius: 8px;
          padding: 9px 18px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }

        .boton-cancelar-modal:hover:not(:disabled) {
          background-color: #E2ECF0;
        }

        .boton-guardar-modal {
          background-color: #FF7A00;
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          padding: 9px 20px;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(255, 122, 0, 0.25);
          transition: background-color 0.15s ease;
        }

        .boton-guardar-modal:hover:not(:disabled) {
          background-color: #E06500;
        }

        .boton-guardar-modal:disabled, .boton-cancelar-modal:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 640px) {
          .modal-contrasena-tarjeta {
            padding: 20px 16px;
          }
          .modal-contrasena-acciones {
            flex-direction: column-reverse;
          }
          .modal-contrasena-acciones button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
