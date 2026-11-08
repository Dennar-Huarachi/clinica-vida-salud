import React, { useState } from 'react';
import LayoutPrincipal from '../../../compartido/layouts/LayoutPrincipal';
import ModalCambiarContrasena from './ModalCambiarContrasena';
import ChecklistContrasena, { esContrasenaSegura } from '../../../comun/componentes/ChecklistContrasena';
import api from '../../../compartido/utilidades/api';
import Alerta from '../../../compartido/componentes/Alerta';

/**
 * PaginaCambiarContrasena (/cuenta/cambiar-contrasena)
 * Vista dedicada para el cambio de credenciales de seguridad
 */
export default function PaginaCambiarContrasena() {
  const [contrasenaActual, setContrasenaActual] = useState('');
  const [contrasenaNueva, setContrasenaNueva] = useState('');
  const [confirmacionContrasena, setConfirmacionContrasena] = useState('');

  const [mostrarActual, setMostrarActual] = useState(false);
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  const [errores, setErrores] = useState({});
  const [alerta, setAlerta] = useState(null);
  const [cargando, setCargando] = useState(false);

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

      setContrasenaActual('');
      setContrasenaNueva('');
      setConfirmacionContrasena('');
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
    <LayoutPrincipal titulo="Seguridad de la Cuenta · Cambiar Contraseña">
      <div style={{ maxWidth: '580px', margin: '0 auto' }}>
        <div className="tarjeta">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#EAF7F9',
              color: '#1FA5B8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div>
              <h2 className="titulo" style={{ fontSize: '1.35rem', margin: 0 }}>
                <b>Cambiar</b> <span>Contraseña</span>
              </h2>
              <p style={{ margin: 0, color: 'var(--texto-sec)', fontSize: '0.875rem' }}>
                Establece una nueva clave segura para tu cuenta institucional.
              </p>
            </div>
          </div>

          <Alerta tipo={alerta?.tipo} mensaje={alerta?.mensaje} />

          <form onSubmit={manejarEnvio} noValidate>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                Contraseña Actual <span style={{ color: 'var(--cancelada)' }}>*</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={mostrarActual ? 'text' : 'password'}
                  value={contrasenaActual}
                  onChange={(e) => setContrasenaActual(e.target.value)}
                  className="input-firme"
                  placeholder="Tu contraseña actual"
                  style={{ paddingRight: '40px' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarActual(!mostrarActual)}
                  style={{
                    position: 'absolute',
                    right: '6px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--texto-sec)'
                  }}
                >
                  {mostrarActual ? '🙈' : '👁️'}
                </button>
              </div>
              {errores.contrasena_actual && (
                <span style={{ color: 'var(--cancelada)', fontSize: '12px', fontWeight: 600 }}>
                  {errores.contrasena_actual}
                </span>
              )}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                Nueva Contraseña <span style={{ color: 'var(--cancelada)' }}>*</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={mostrarNueva ? 'text' : 'password'}
                  value={contrasenaNueva}
                  onChange={(e) => setContrasenaNueva(e.target.value)}
                  className="input-firme"
                  placeholder="Mínimo 8 caracteres, mayús., minus., núm. y símbolo"
                  style={{ paddingRight: '40px' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarNueva(!mostrarNueva)}
                  style={{
                    position: 'absolute',
                    right: '6px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--texto-sec)'
                  }}
                >
                  {mostrarNueva ? '🙈' : '👁️'}
                </button>
              </div>
              {errores.contrasena_nueva && (
                <span style={{ color: 'var(--cancelada)', fontSize: '12px', fontWeight: 600 }}>
                  {errores.contrasena_nueva}
                </span>
              )}

              <ChecklistContrasena contrasena={contrasenaNueva} />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                Confirmar Nueva Contraseña <span style={{ color: 'var(--cancelada)' }}>*</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={mostrarConfirmacion ? 'text' : 'password'}
                  value={confirmacionContrasena}
                  onChange={(e) => setConfirmacionContrasena(e.target.value)}
                  className="input-firme"
                  placeholder="Repite la nueva contraseña"
                  style={{ paddingRight: '40px' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarConfirmacion(!mostrarConfirmacion)}
                  style={{
                    position: 'absolute',
                    right: '6px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--texto-sec)'
                  }}
                >
                  {mostrarConfirmacion ? '🙈' : '👁️'}
                </button>
              </div>
              {errores.confirmacion_contrasena && (
                <span style={{ color: 'var(--cancelada)', fontSize: '12px', fontWeight: 600 }}>
                  {errores.confirmacion_contrasena}
                </span>
              )}
            </div>

            <button
              type="submit"
              className="boton-primario"
              style={{ width: '100%', minHeight: '44px' }}
              disabled={cargando}
            >
              {cargando ? 'Actualizando contraseña…' : 'Actualizar Contraseña'}
            </button>
          </form>
        </div>
      </div>
    </LayoutPrincipal>
  );
}
