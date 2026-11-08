import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../../compartido/utilidades/api';
import Alerta from '../../../compartido/componentes/Alerta';
import ModalRecuperarPassword from './ModalRecuperarPassword';

/**
 * LoginPersonal (/login/personal)
 * Formulario institucional compacto y perfectamente centrado sin scroll vertical innecesario.
 */
export default function LoginPersonal() {
  const [identificador, setIdentificador] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [modalRecuperarAbierto, setModalRecuperarAbierto] = useState(false);

  const [errores, setErrores] = useState({});
  const [alerta, setAlerta] = useState(null);
  const [cargando, setCargando] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Detectar mensaje flash de expiración de sesión por inactividad
  useEffect(() => {
    const flash = sessionStorage.getItem('flash_inactividad') || location.state?.mensajeInactividad;
    if (flash) {
      setAlerta({ tipo: 'advertencia', mensaje: flash });
      sessionStorage.removeItem('flash_inactividad');
    }
  }, [location.state]);

  const validarCampos = () => {
    const err = {};
    if (!identificador.trim()) {
      err.identificador = 'Ingrese su usuario o correo corporativo.';
    }
    if (!contrasena) {
      err.contrasena = 'La contraseña es obligatoria.';
    } else if (contrasena.length < 4) {
      err.contrasena = 'Mínimo 4 caracteres.';
    }
    setErrores(err);
    return Object.keys(err).length === 0;
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setAlerta(null);

    if (!validarCampos()) {
      return;
    }

    setCargando(true);

    try {
      const payload = {
        tipo_acceso: 'personal',
        identificador: identificador.trim(),
        contrasena: contrasena,
      };

      const respuesta = await api.post('/acceso/login', payload);
      const { token, usuario } = respuesta.data.datos;

      localStorage.setItem('token_clinica', token);
      localStorage.setItem('usuario_clinica', JSON.stringify(usuario));

      const rol = (usuario.rol || '').toLowerCase();
      if (rol === 'medico') {
        navigate('/medico/agenda');
      } else if (rol === 'recepcionista') {
        navigate('/recepcion/citas');
      } else if (rol === 'administrador') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      if (err.response?.status === 422 && err.response.data?.errores) {
        setErrores(err.response.data.errores);
      } else {
        setAlerta({
          tipo: 'error',
          mensaje:
            err.response?.data?.mensaje ||
            'Credenciales no válidas o acceso restringido. Verifique su cuenta institucional.',
        });
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-viewport-centrado">
      <div className="login-bloque-central">
        {/* Tarjeta Central Compacta Institucional */}
        <div className="login-card-compacta tarjeta-personal-acento">
          {/* Logotipo Institucional Compacto */}
          <div className="cabecera-logo-compacta">
            <div className="isotipo-medico-personal">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4.8 2.5v6.5a6 6 0 0 0 12 0v-6.5" />
                <path d="M3 2.5h3.6M15 2.5h3.6" />
                <path d="M10.8 15a4.8 4.8 0 0 0 9.6 0v-2.5" />
                <circle cx="20.4" cy="12.5" r="2" />
              </svg>
            </div>
            <span className="nombre-marca-compacta">
              Clínica <strong>Vida Salud</strong>
            </span>
          </div>

          {/* Título y Subtítulo */}
          <div className="titulos-login-compactos">
            <h1 className="titulo-bicolor-compacto">
              <b>Acceso</b> <span>Institucional</span>
            </h1>
            <p className="subtitulo-compacto">
              Portal interno para médicos, recepción y administración.
            </p>
          </div>

          {/* Alerta de Error o Inactividad */}
          <Alerta tipo={alerta?.tipo} mensaje={alerta?.mensaje} />

          {/* Formulario */}
          <form onSubmit={manejarEnvio} noValidate>
            {/* Campo: Identificador */}
            <div className="grupo-input-compacto">
              <label htmlFor="identificador" className="label-campo-compacto">
                <span>Usuario Institucional o Correo</span>
                <span className="asterisco-rojo"> *</span>
              </label>

              <div className="input-contenedor-icono">
                <span className="icono-posicion-izq">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <input
                  id="identificador"
                  type="text"
                  value={identificador}
                  onChange={(e) => {
                    setIdentificador(e.target.value);
                    if (errores.identificador) {
                      setErrores((prev) => ({ ...prev, identificador: null }));
                    }
                  }}
                  placeholder="usuario@vidasalud.bo o usuario"
                  className={`input-firme con-icono ${errores.identificador ? 'error' : ''}`}
                  autoComplete="username"
                  disabled={cargando}
                  autoFocus
                />
              </div>

              {/* Espacio reservado para error */}
              <div className="slot-error-reservado">
                {errores.identificador && (
                  <span className="texto-error-compacto">
                    {Array.isArray(errores.identificador)
                      ? errores.identificador[0]
                      : errores.identificador}
                  </span>
                )}
              </div>
            </div>

            {/* Campo: Contraseña con Toggle */}
            <div className="grupo-input-compacto">
              <label htmlFor="contrasena" className="label-campo-compacto">
                <span>Contraseña</span>
                <span className="asterisco-rojo"> *</span>
              </label>

              <div className="input-contenedor-icono">
                <span className="icono-posicion-izq">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="contrasena"
                  type={mostrarContrasena ? 'text' : 'password'}
                  value={contrasena}
                  onChange={(e) => {
                    setContrasena(e.target.value);
                    if (errores.contrasena) {
                      setErrores((prev) => ({ ...prev, contrasena: null }));
                    }
                  }}
                  placeholder="••••••••"
                  className={`input-firme con-icono ${errores.contrasena ? 'error' : ''}`}
                  style={{ paddingRight: '40px' }}
                  autoComplete="current-password"
                  disabled={cargando}
                />

                <button
                  type="button"
                  onClick={() => setMostrarContrasena(!mostrarContrasena)}
                  className="boton-toggle-ojo"
                  title={mostrarContrasena ? 'Ocultar contraseña' : 'Ver contraseña'}
                  aria-label={mostrarContrasena ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {mostrarContrasena ? (
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

              {/* Espacio reservado para error */}
              <div className="slot-error-reservado">
                {errores.contrasena && (
                  <span className="texto-error-compacto">
                    {Array.isArray(errores.contrasena)
                      ? errores.contrasena[0]
                      : errores.contrasena}
                  </span>
                )}
              </div>

              {/* Enlace "¿Olvidaste tu contraseña?" ubicado inmediatamente debajo del input de contraseña */}
              <div className="contenedor-olvido-debajo">
                <button
                  type="button"
                  onClick={() => setModalRecuperarAbierto(true)}
                  className="enlace-olvido-debajo"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>

            {/* Botón Verde Azulado */}
            <button
              type="submit"
              className="boton-submit-personal"
              disabled={cargando}
            >
              {cargando ? (
                <span className="spinner-centrado">
                  <span className="spinner-circulo" />
                  Validando credenciales…
                </span>
              ) : (
                'Acceder al Sistema Clínico'
              )}
            </button>
          </form>

          {/* Mensaje de Seguridad y Enlace Inferior */}
          <div className="pie-card-compacto">
            <div className="nota-candado-compacta">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Acceso institucional exclusivo para personal acreditado.</span>
            </div>

            <div className="fila-cambio-acceso">
              <span>¿Es paciente y busca sus citas?</span>
              <Link to="/login/paciente" className="enlace-cambio-paciente">
                Portal Pacientes →
              </Link>
            </div>
          </div>
        </div>

        {/* Contenedor inferior de enlaces tipo pastilla (chips) debajo de la tarjeta blanca */}
        <div className="contenedor-retorno-inferior">
          <Link to="/login" className="chip-retorno">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Volver a la selección</span>
          </Link>

          <Link to="/" className="chip-retorno">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>Inicio</span>
          </Link>
        </div>
      </div>


      {/* Modal Interactivo de Recuperación de Contraseña */}
      <ModalRecuperarPassword
        abierto={modalRecuperarAbierto}
        alCerrar={() => setModalRecuperarAbierto(false)}
        tipo="personal"
      />

      {/* ============================================================
          ESTILOS CSS COMPACTOS (SIN SCROLL INNECESARIO)
          ============================================================ */}
      <style>{`
        .login-viewport-centrado {
          min-height: 100vh;
          min-height: 100dvh;
          width: 100%;
          background: var(--fondo);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 16px;
          box-sizing: border-box;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .login-bloque-central {
          width: 100%;
          max-width: 440px;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          margin: auto 0;
        }

        .login-card-compacta {
          width: 100%;
          background: var(--blanco);
          border-radius: 14px;
          box-shadow: 0 8px 24px rgba(10, 108, 132, 0.08);
          border: 2px solid #DCE9ED;
          padding: 24px 28px;
          box-sizing: border-box;
          margin: 0 auto;
          transform: none !important;
          animation: none !important;
        }

        .tarjeta-personal-acento {
          border-top: 4px solid var(--verde-azulado);
        }

        .cabecera-logo-compacta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 8px;
        }

        .isotipo-medico-personal {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, var(--verde-azulado), #064E5F);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .nombre-marca-compacta {
          font-size: 1rem;
          color: var(--verde-azulado);
        }

        .titulos-login-compactos {
          text-align: center;
          margin-bottom: 12px;
        }

        .titulo-bicolor-compacto {
          font-size: 1.45rem;
          color: var(--verde-azulado);
          margin-bottom: 2px;
          line-height: 1.2;
        }

        .titulo-bicolor-compacto b {
          font-weight: 700;
        }

        .titulo-bicolor-compacto span {
          font-weight: 300;
          color: var(--turquesa);
        }

        .subtitulo-compacto {
          font-size: 13px;
          color: var(--texto-sec);
          line-height: 1.35;
          margin: 0;
        }

        .grupo-input-compacto {
          margin-bottom: 4px;
        }

        .label-campo-compacto {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--texto);
          margin-bottom: 4px;
        }

        .asterisco-rojo {
          color: var(--cancelada);
        }

        .input-contenedor-icono {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .icono-posicion-izq {
          position: absolute;
          left: 12px;
          color: var(--texto-sec);
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .input-firme {
          width: 100%;
          min-height: 42px;
          background: #FFFFFF;
          border: 2px solid #DCE9ED;
          border-radius: 10px;
          padding: 0 0.85rem;
          font-family: inherit;
          font-size: 0.9rem;
          color: var(--texto);
          box-sizing: border-box;
          outline: none;
          transition: border-color 0.15s ease, background-color 0.15s ease;
        }

        .input-firme.con-icono {
          padding-left: 36px;
        }

        .input-firme:focus {
          border-color: var(--verde-azulado);
        }

        .input-firme.error {
          border-color: var(--cancelada);
          background-color: #FFFDFD;
        }

        .slot-error-reservado {
          min-height: 16px;
          display: flex;
          align-items: center;
          padding-top: 1px;
        }

        .texto-error-compacto {
          color: var(--cancelada);
          font-size: 11.5px;
          font-weight: 600;
          line-height: 1.1;
        }

        .contenedor-olvido-debajo {
          text-align: right;
          margin-top: 6px;
          margin-bottom: 16px;
        }

        .enlace-olvido-debajo {
          background: none;
          border: none;
          color: #1FA5B8;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          padding: 0;
          text-decoration: none;
          font-family: inherit;
          transition: color 0.15s ease, text-decoration 0.15s ease;
        }

        .enlace-olvido-debajo:hover {
          color: #0A6C84;
          text-decoration: underline;
        }

        .contenedor-retorno-inferior {
          margin-top: 20px;
          display: flex;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .chip-retorno {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background-color: #FFFFFF;
          border: 1px solid #D2E4E8;
          border-radius: 20px;
          padding: 6px 16px;
          font-size: 13px;
          font-weight: 500;
          color: #0A6C84;
          text-decoration: none;
          box-shadow: 0 2px 6px rgba(10, 108, 132, 0.04);
          transition: border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease;
        }

        .chip-retorno:hover {
          border-color: #1FA5B8;
          background-color: #EAF4F6;
          color: #074454;
        }

        .boton-toggle-ojo {
          position: absolute;
          right: 2px;
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          cursor: pointer;
          color: var(--texto-sec);
          border-radius: 8px;
          transition: color 0.15s ease;
        }

        .boton-toggle-ojo:hover {
          color: var(--verde-azulado);
        }

        .boton-submit-personal {
          width: 100%;
          min-height: 44px;
          background: var(--verde-azulado);
          color: #FFFFFF;
          border: none;
          border-radius: 10px;
          font-family: inherit;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          transition: background-color 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 10px;
          margin-bottom: 10px;
          box-sizing: border-box;
          transform: none !important;
        }

        .boton-submit-personal:hover:not(:disabled) {
          background: var(--turquesa);
        }

        .spinner-centrado {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .spinner-circulo {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.35);
          border-top-color: #FFFFFF;
          border-radius: 50%;
          animation: spin 0.75s infinite linear;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .pie-card-compacto {
          margin-top: 8px;
          padding-top: 10px;
          border-top: 1px solid #EDF4F6;
          text-align: center;
          font-size: 13px;
          color: var(--texto-sec);
        }

        .nota-candado-compacta {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: #EDF6F8;
          border-left: 3px solid var(--verde-azulado);
          padding: 5px 8px;
          border-radius: 6px;
          font-size: 11.5px;
          color: var(--verde-azulado);
          line-height: 1.3;
          margin-bottom: 6px;
          text-align: left;
        }

        .fila-cambio-acceso {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          font-size: 12px;
          color: var(--texto-sec);
          margin-top: 4px;
        }

        .enlace-cambio-paciente {
          color: var(--naranja-oscuro);
          font-weight: 700;
          text-decoration: none;
        }

        .enlace-cambio-paciente:hover {
          text-decoration: underline;
        }

        /* Responsive Móvil: Centrado exacto sin desbordamiento */
        @media (max-width: 640px) {
          .login-viewport-centrado {
            padding: 12px;
            justify-content: center;
          }

          .login-bloque-central {
            width: 100%;
            max-width: calc(100% - 12px);
            margin: auto 0;
          }

          .login-card-compacta {
            padding: 20px 18px;
          }

          .titulo-bicolor-compacto {
            font-size: 1.35rem;
          }
        }
      `}</style>
    </div>
  );
}
