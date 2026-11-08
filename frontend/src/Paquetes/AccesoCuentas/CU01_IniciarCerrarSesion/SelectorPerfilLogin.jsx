import React from 'react';

/**
 * SelectorPerfilLogin
 * Componente interactivo de selección de perfil para acceso a la clínica.
 * Permite elegir entre "Soy Paciente" y "Personal de la Clínica" mediante tarjetas estilizadas.
 */
export default function SelectorPerfilLogin({ perfilSeleccionado, onSeleccionarPerfil }) {
  return (
    <div className="selector-perfil-contenedor">
      {/* ============================================================
          1. CABECERA DE LA PANTALLA
          ============================================================ */}
      <div className="selector-perfil-cabecera">
        {/* Logotipo centrado */}
        <div className="selector-perfil-logo">
          <div className="icono-logo-clinica">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <span className="texto-logo-clinica">
            Clínica <b>Vida Salud</b>
          </span>
        </div>

        {/* Título en dos pesos visuales */}
        <h1 className="titulo selector-perfil-titulo">
          <b>Bienvenido</b> <span>al Portal Clínico</span>
        </h1>

        {/* Subtítulo sutil */}
        <p className="selector-perfil-subtitulo">
          Seleccione cómo desea ingresar al sistema para continuar
        </p>
      </div>

      {/* ============================================================
          2. LAS 2 TARJETAS DE PERFIL (GRID RESPONSIVE)
          ============================================================ */}
      <div className="grid-tarjetas-perfil">
        {/* ------------------------------------------------------------
            TARJETA A: "Soy Paciente"
            ------------------------------------------------------------ */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSeleccionarPerfil('paciente')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSeleccionarPerfil('paciente');
            }
          }}
          className={`tarjeta-perfil tarjeta-paciente ${
            perfilSeleccionado === 'paciente' ? 'activa' : ''
          }`}
          aria-pressed={perfilSeleccionado === 'paciente'}
        >
          {/* Indicador de activo */}
          {perfilSeleccionado === 'paciente' && (
            <div className="badge-seleccionado badge-paciente">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span>Seleccionado</span>
            </div>
          )}

          {/* Icono: SVG circular estilizado de paciente / pulso de salud en Turquesa */}
          <div className="icono-circulo icono-circulo-paciente">
            <svg
              width="36"
              height="36"
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

          <h2 className="tarjeta-perfil-titulo">Soy Paciente</h2>

          <p className="tarjeta-perfil-descripcion">
            Consulte y reserve sus citas médicas, revise su historial y acceda a sus resultados clínicos.
          </p>

          <button
            type="button"
            className="boton-accion-perfil boton-accion-paciente"
            onClick={(e) => {
              e.stopPropagation();
              onSeleccionarPerfil('paciente');
            }}
          >
            Continuar como Paciente →
          </button>
        </div>

        {/* ------------------------------------------------------------
            TARJETA B: "Personal de la Clínica"
            ------------------------------------------------------------ */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSeleccionarPerfil('personal')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSeleccionarPerfil('personal');
            }
          }}
          className={`tarjeta-perfil tarjeta-personal ${
            perfilSeleccionado === 'personal' ? 'activa' : ''
          }`}
          aria-pressed={perfilSeleccionado === 'personal'}
        >
          {/* Indicador de activo */}
          {perfilSeleccionado === 'personal' && (
            <div className="badge-seleccionado badge-personal">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span>Seleccionado</span>
            </div>
          )}

          {/* Icono: SVG circular estilizado de estetoscopio / personal médico en Verde Azulado */}
          <div className="icono-circulo icono-circulo-personal">
            <svg
              width="36"
              height="36"
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

          <h2 className="tarjeta-perfil-titulo">Personal de la Clínica</h2>

          <p className="tarjeta-perfil-descripcion">
            Acceso exclusivo para médicos, recepcionistas y personal administrativo autorizado.
          </p>

          <button
            type="button"
            className="boton-accion-perfil boton-accion-personal"
            onClick={(e) => {
              e.stopPropagation();
              onSeleccionarPerfil('personal');
            }}
          >
            Acceso Institucional →
          </button>
        </div>
      </div>

      {/* ============================================================
          ESTILOS CSS ESPECÍFICOS DEL SELECTOR DE PERFILES
          ============================================================ */}
      <style>{`
        .selector-perfil-contenedor {
          width: 100%;
          max-width: 820px;
          margin: 0 auto;
        }

        .selector-perfil-cabecera {
          text-align: center;
          margin-bottom: 2rem;
        }

        .selector-perfil-logo {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 0.85rem;
          padding: 0.4rem 0.9rem;
          background: #FFFFFF;
          border-radius: 999px;
          box-shadow: 0 2px 10px rgba(10, 108, 132, 0.08);
          border: 1px solid #E1EFF2;
        }

        .icono-logo-clinica {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--turquesa), var(--verde-azulado));
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .texto-logo-clinica {
          font-size: 1rem;
          color: var(--verde-azulado);
          letter-spacing: -0.2px;
        }

        .selector-perfil-titulo {
          font-size: 1.85rem;
          margin-bottom: 0.4rem;
        }

        .selector-perfil-subtitulo {
          color: var(--texto-sec);
          font-size: 0.975rem;
          max-width: 500px;
          margin: 0 auto;
        }

        /* Grid responsive: 1 col en móvil, 2 cols en tablet/desktop */
        .grid-tarjetas-perfil {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        @media (min-width: 641px) {
          .grid-tarjetas-perfil {
            grid-template-columns: 1fr 1fr;
            gap: 1.5rem;
          }
        }

        /* Tarjeta individual */
        .tarjeta-perfil {
          position: relative;
          background: var(--blanco);
          border-radius: 14px;
          padding: 2rem 1.75rem;
          border: 2px solid #DCE9ED;
          box-shadow: 0 8px 24px rgba(10, 108, 132, 0.08);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
          outline: none;
          box-sizing: border-box;
          transform: none !important;
        }

        .tarjeta-perfil:hover {
          box-shadow: 0 10px 28px rgba(10, 108, 132, 0.12);
        }

        .tarjeta-paciente:hover {
          border-color: var(--turquesa);
          background-color: #FAFEFF;
        }

        .tarjeta-personal:hover {
          border-color: var(--verde-azulado);
          background-color: #F7FCFD;
        }

        /* Estado activo */
        .tarjeta-paciente.activa {
          border: 2px solid var(--turquesa);
          box-shadow: 0 10px 28px rgba(31, 165, 184, 0.14);
          background: #FCFFFF;
        }

        .tarjeta-personal.activa {
          border: 2px solid var(--verde-azulado);
          box-shadow: 0 10px 28px rgba(10, 108, 132, 0.14);
          background: #F8FCFD;
        }

        .tarjeta-perfil:focus-visible {
          outline: 2px solid var(--cian);
          outline-offset: 3px;
        }

        /* Badge seleccionado */
        .badge-seleccionado {
          position: absolute;
          top: 14px;
          right: 14px;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.25rem 0.65rem;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 700;
          color: #FFFFFF;
          transform: none !important;
          animation: none !important;
        }

        .badge-paciente {
          background: var(--turquesa);
        }

        .badge-personal {
          background: var(--verde-azulado);
        }

        /* Iconos circulares */
        .icono-circulo {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
          transform: none !important;
        }

        .icono-circulo-paciente {
          background: #E8F8FA;
          box-shadow: 0 6px 16px rgba(31, 165, 184, 0.18);
        }

        .icono-circulo-personal {
          background: #E6F3F6;
          box-shadow: 0 6px 16px rgba(10, 108, 132, 0.18);
        }

        /* Tipografía de tarjeta */
        .tarjeta-perfil-titulo {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--texto);
          margin-bottom: 0.65rem;
        }

        .tarjeta-perfil-descripcion {
          font-size: 0.9rem;
          color: var(--texto-sec);
          line-height: 1.5;
          margin-bottom: 1.5rem;
          flex-grow: 1;
        }

        /* Botón de acción dentro de la tarjeta */
        .boton-accion-perfil {
          width: 100%;
          min-height: 44px;
          border-radius: 10px;
          font-family: inherit;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          background: var(--blanco);
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
        }

        .boton-accion-paciente {
          border: 1.5px solid var(--turquesa);
          color: var(--turquesa);
        }

        .boton-accion-paciente:hover,
        .tarjeta-paciente.activa .boton-accion-paciente {
          background: var(--turquesa);
          color: #FFFFFF;
        }

        .boton-accion-personal {
          border: 1.5px solid var(--verde-azulado);
          color: var(--verde-azulado);
        }

        .boton-accion-personal:hover,
        .tarjeta-personal.activa .boton-accion-personal {
          background: var(--verde-azulado);
          color: #FFFFFF;
        }
      `}</style>
    </div>
  );
}
