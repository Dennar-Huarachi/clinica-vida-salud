import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Alerta from '../../../compartido/componentes/Alerta';

/**
 * IniciarSesion (/login)
 * Selector de perfiles compacto y centrado en el viewport sin scroll vertical innecesario.
 */
export default function IniciarSesion() {
  const [alerta, setAlerta] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Detectar notificación flash de expiración de sesión por inactividad o revocación
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const motivo = params.get('motivo');
    const expirada = params.get('expirada');

    if (motivo === 'sesion_expirada' || expirada === '1') {
      setAlerta({
        tipo: 'advertencia',
        mensaje: 'Su sesión ha finalizado o ha expirado. Por favor, ingrese sus credenciales nuevamente.'
      });
    } else {
      const flash = sessionStorage.getItem('flash_inactividad') || location.state?.mensajeInactividad;
      if (flash) {
        setAlerta({ tipo: 'advertencia', mensaje: flash });
        sessionStorage.removeItem('flash_inactividad');
      }
    }
  }, [location.search, location.state]);

  return (
    <div className="login-viewport-centrado">
      <div className="selector-bloque-central">
        {/* Cabecera institucional compacta */}
        <div className="cabecera-selector-compacta">
          <div className="badge-logo-selector">
            <div className="icono-cruz-selector">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <span className="texto-marca-selector">
              Clínica <b>Vida Salud</b>
            </span>
          </div>

          <h1 className="titulo-selector-compacto">
            <b>Bienvenido</b> <span>al Portal Clínico</span>
          </h1>

          <p className="subtitulo-selector-compacto">
            Seleccione cómo desea ingresar al sistema para continuar a su espacio de trabajo.
          </p>
        </div>

        {/* Alerta de Inactividad o Sistema */}
        {alerta && (
          <div style={{ marginBottom: '16px' }}>
            <Alerta tipo={alerta.tipo} mensaje={alerta.mensaje} />
          </div>
        )}

        {/* Las 2 Tarjetas de Perfil con Dimensiones Compactas y Uniformes */}
        <div className="grid-tarjetas-acceso-compactas">
          {/* Tarjeta 1: Soy Paciente */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate('/login/paciente')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/login/paciente');
              }
            }}
            className="tarjeta-acceso-firme tarjeta-acceso-paciente"
          >
            <div className="contenido-card-arriba">
              <div className="icono-circulo-selector circulo-paciente">
                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--turquesa)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  <path d="M8.5 12h2l1.5-3 2 6 1.5-3h2" stroke="var(--cian)" strokeWidth="2" />
                </svg>
              </div>

              <h2 className="titulo-card-selector">Soy Paciente</h2>

              <p className="descripcion-card-selector">
                Consulte y reserve sus citas médicas, revise su historial y acceda a sus resultados clínicos en línea.
              </p>
            </div>

            <button
              type="button"
              className="boton-ir-portal-compacto boton-ir-paciente"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/login/paciente');
              }}
            >
              Continuar como Paciente →
            </button>
          </div>

          {/* Tarjeta 2: Personal de la Clínica */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate('/login/personal')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/login/personal');
              }
            }}
            className="tarjeta-acceso-firme tarjeta-acceso-personal"
          >
            <div className="contenido-card-arriba">
              <div className="icono-circulo-selector circulo-personal">
                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--verde-azulado)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4.8 2.5v6.5a6 6 0 0 0 12 0v-6.5" />
                  <path d="M3 2.5h3.6M15 2.5h3.6" />
                  <path d="M10.8 15a4.8 4.8 0 0 0 9.6 0v-2.5" />
                  <circle cx="20.4" cy="12.5" r="2" />
                </svg>
              </div>

              <h2 className="titulo-card-selector">Personal de la Clínica</h2>

              <p className="descripcion-card-selector">
                Acceso exclusivo para médicos, recepcionistas y personal administrativo debidamente acreditado.
              </p>
            </div>

            <button
              type="button"
              className="boton-ir-portal-compacto boton-ir-personal"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/login/personal');
              }}
            >
              Acceso Institucional →
            </button>
          </div>
        </div>

        {/* Pie de página con enlace a registro */}
        <div className="pie-selector-compacto">
          <span>¿Primera vez en la clínica?</span>{' '}
          <Link to="/registro-paciente" className="enlace-registro-naranja">
            Registrar cuenta de paciente
          </Link>
        </div>

        {/* Contenedor inferior de navegación secundaria (pastillas idénticas a LoginPaciente) */}
        <div className="contenedor-retorno-inferior">
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
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Volver a la Página Principal</span>
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

      {/* ============================================================
          ESTILOS CSS ESTÁTICOS, COMPACTOS Y RESPONSIVE
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

        .selector-bloque-central {
          width: 100%;
          max-width: 730px;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-sizing: border-box;
          margin: auto 0;
        }

        .contenedor-retorno-inferior {
          margin-top: 18px;
          display: flex;
          justify-content: center;
          gap: 14px;
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

        .cabecera-selector-compacta {
          text-align: center;
          margin-bottom: 16px;
          box-sizing: border-box;
        }

        .badge-logo-selector {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.35rem 0.85rem;
          background: #FFFFFF;
          border-radius: 999px;
          border: 1px solid #DCE9ED;
          box-shadow: 0 2px 8px rgba(10, 108, 132, 0.06);
          margin-bottom: 8px;
        }

        .icono-cruz-selector {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--turquesa), var(--verde-azulado));
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .texto-marca-selector {
          font-size: 0.9rem;
          color: var(--verde-azulado);
        }

        .titulo-selector-compacto {
          font-size: 1.75rem;
          color: var(--verde-azulado);
          margin-bottom: 2px;
          line-height: 1.2;
        }

        .titulo-selector-compacto b {
          font-weight: 700;
        }

        .titulo-selector-compacto span {
          font-weight: 300;
          color: var(--turquesa);
        }

        .subtitulo-selector-compacto {
          font-size: 0.875rem;
          color: var(--texto-sec);
          max-width: 480px;
          margin: 0 auto;
          line-height: 1.4;
        }

        .grid-tarjetas-acceso-compactas {
          width: 100%;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 350px));
          justify-content: center;
          gap: 20px;
          box-sizing: border-box;
        }

        .tarjeta-acceso-firme {
          width: 100%;
          max-width: 350px;
          background: var(--blanco);
          border-radius: 14px;
          padding: 22px 20px;
          border: 2px solid #DCE9ED;
          box-shadow: 0 8px 24px rgba(10, 108, 132, 0.08);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          text-align: center;
          cursor: pointer;
          box-sizing: border-box;
          outline: none;
          transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
          transform: none !important;
        }

        .contenido-card-arriba {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }

        .tarjeta-acceso-paciente:hover {
          border-color: var(--turquesa);
          background-color: #FAFEFF;
          box-shadow: 0 10px 28px rgba(31, 165, 184, 0.12);
        }

        .tarjeta-acceso-personal:hover {
          border-color: var(--verde-azulado);
          background-color: #F7FCFD;
          box-shadow: 0 10px 28px rgba(10, 108, 132, 0.12);
        }

        .tarjeta-acceso-firme:focus-visible {
          outline: 2px solid var(--cian);
          outline-offset: 3px;
        }

        .icono-circulo-selector {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 10px;
          transform: none !important;
        }

        .circulo-paciente {
          background: #E8F8FA;
          box-shadow: 0 3px 10px rgba(31, 165, 184, 0.16);
        }

        .circulo-personal {
          background: #E6F3F6;
          box-shadow: 0 3px 10px rgba(10, 108, 132, 0.16);
        }

        .titulo-card-selector {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--texto);
          margin-bottom: 4px;
        }

        .descripcion-card-selector {
          font-size: 0.85rem;
          color: var(--texto-sec);
          line-height: 1.45;
          margin: 0;
          padding: 0 0.25rem;
        }

        .boton-ir-portal-compacto {
          width: 100%;
          min-height: 42px;
          border-radius: 10px;
          font-family: inherit;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          margin-top: 14px;
          transform: none !important;
        }

        .boton-ir-paciente {
          background: var(--blanco);
          border: 2px solid var(--turquesa);
          color: var(--turquesa);
        }

        .boton-ir-paciente:hover,
        .tarjeta-acceso-paciente:hover .boton-ir-paciente {
          background: var(--turquesa);
          color: #FFFFFF;
        }

        .boton-ir-personal {
          background: var(--blanco);
          border: 2px solid var(--verde-azulado);
          color: var(--verde-azulado);
        }

        .boton-ir-personal:hover,
        .tarjeta-acceso-personal:hover .boton-ir-personal {
          background: var(--verde-azulado);
          color: #FFFFFF;
        }

        .pie-selector-compacto {
          margin-top: 14px;
          font-size: 0.85rem;
          color: var(--texto-sec);
          text-align: center;
        }

        .enlace-registro-naranja {
          color: var(--naranja-oscuro);
          font-weight: 700;
          text-decoration: none;
        }

        .enlace-registro-naranja:hover {
          text-decoration: underline;
        }

        /* Responsive Móvil: Centrado exacto sin desbordamiento */
        @media (max-width: 640px) {
          .login-viewport-centrado {
            padding: 12px;
            justify-content: center;
          }

          .selector-bloque-central {
            width: 100%;
            max-width: calc(100% - 12px);
            margin: auto 0;
          }

          .titulo-selector-compacto {
            font-size: 1.45rem;
          }

          .grid-tarjetas-acceso-compactas {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .tarjeta-acceso-firme {
            max-width: 100%;
            padding: 16px 14px;
          }

          .boton-ir-portal-compacto {
            margin-top: 10px;
          }
        }
      `}</style>
    </div>
  );
}
