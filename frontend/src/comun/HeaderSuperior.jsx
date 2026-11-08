import React from 'react';
import { useLocation } from 'react-router-dom';
import { resolverTituloRuta } from './rutasPorRol';
import CampanaNotificaciones from '../Paquetes/CitasNotificaciones/CU16_EnviarNotificacionesRecordatorios/CampanaNotificaciones';

export default function HeaderSuperior({ onToggleDrawer, tituloPersonalizado }) {
  const location = useLocation();

  const usuarioStr = localStorage.getItem('usuario_clinica');
  const usuario = usuarioStr ? JSON.parse(usuarioStr) : null;

  // 1. Obtener nombre completo o nombre de usuario
  const nombreCompleto = usuario
    ? `${usuario.nombres || ''} ${usuario.apellidos || ''}`.trim() || usuario.nombre_usuario || 'Usuario'
    : 'Invitado';

  // 2. Obtener rol legible
  const formatearRol = (r) => {
    if (!r) return 'Usuario';
    const min = r.toLowerCase();
    if (min === 'administrador') return 'Administrador';
    if (min === 'medico') return 'Médico Especialista';
    if (min === 'recepcionista') return 'Recepcionista';
    if (min === 'paciente') return 'Paciente';
    return r.charAt(0).toUpperCase() + r.slice(1);
  };

  const rolLegible = usuario ? formatearRol(usuario.rol) : 'Sin Sesión';

  // 3. Iniciales para el avatar circular
  const iniciales = usuario
    ? `${(usuario.nombres?.[0] || usuario.nombre_usuario?.[0] || 'U')}${(usuario.apellidos?.[0] || '')}`.toUpperCase()
    : 'U';

  // 4. Título dinámico
  const tituloModulo = tituloPersonalizado || resolverTituloRuta(location.pathname);

  return (
    <header className="header-superior-clinica">
      {/* Lado Izquierdo: Botón Hamburguesa + Título Dinámico */}
      <div className="header-lado-izquierdo">
        <button
          type="button"
          onClick={onToggleDrawer}
          className="header-boton-hamburguesa"
          aria-label="Abrir o cerrar menú de navegación"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="header-titulo-modulo">
          <h2 className="header-texto-titulo">{tituloModulo}</h2>
        </div>
      </div>

      {/* Lado Derecho: Campana de Notificaciones y Perfil de Usuario */}
      <div className="header-lado-derecho">
        <CampanaNotificaciones />
        <div className="header-perfil-contenedor">
          {/* Avatar circular */}
          <div className="header-avatar-circulo" title={`Sesión activa: ${nombreCompleto}`}>
            <span>{iniciales}</span>
          </div>

          {/* Columna de Texto */}
          <div className="header-usuario-info">
            <span className="header-usuario-nombre" title={nombreCompleto}>
              {nombreCompleto}
            </span>
            <span className="header-usuario-rol">
              {rolLegible}
            </span>
          </div>
        </div>
      </div>

      {/* Estilos CSS encapsulados para HeaderSuperior */}
      <style>{`
        .header-superior-clinica {
          height: 64px;
          min-height: 64px;
          background-color: #FFFFFF;
          border-bottom: 1px solid #E1ECEE;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.5rem;
          position: sticky;
          top: 0;
          z-index: 40;
          box-shadow: 0 1px 4px rgba(10, 108, 132, 0.04);
        }

        .header-lado-izquierdo {
          display: flex;
          align-items: center;
          gap: 1rem;
          min-width: 0;
        }

        .header-boton-hamburguesa {
          display: none;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 8px;
          border: 1px solid #E1ECEE;
          background-color: #F8FCFD;
          color: #0A6C84;
          cursor: pointer;
          transition: background-color 0.15s ease, border-color 0.15s ease;
          flex-shrink: 0;
        }

        .header-boton-hamburguesa:hover {
          background-color: #EBF7F9;
          border-color: #1FA5B8;
        }

        .header-titulo-modulo {
          min-width: 0;
        }

        .header-texto-titulo {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 700;
          color: #12343B;
          letter-spacing: -0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .header-lado-derecho {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          flex-shrink: 0;
        }

        .header-perfil-contenedor {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .header-avatar-circulo {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1FA5B8 0%, #0A6C84 100%);
          color: #FFFFFF;
          font-weight: 700;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(10, 108, 132, 0.2);
          flex-shrink: 0;
        }

        .header-usuario-info {
          display: flex;
          flex-direction: column;
          line-height: 1.25;
        }

        .header-usuario-nombre {
          font-size: 14px;
          font-weight: 700;
          color: #12343B;
          max-width: 180px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .header-usuario-rol {
          font-size: 12px;
          color: #5B7078;
          font-weight: 500;
        }

        @media (max-width: 1024px) {
          .header-superior-clinica {
            padding: 0 1rem;
          }

          .header-boton-hamburguesa {
            display: flex;
          }

          .header-texto-titulo {
            font-size: 1rem;
          }

          .header-usuario-info {
            display: none;
          }
        }

        @media (max-width: 640px) {
          .header-texto-titulo {
            max-width: 170px;
            font-size: 0.925rem;
          }

          .header-avatar-circulo {
            width: 36px;
            height: 36px;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </header>
  );
}
