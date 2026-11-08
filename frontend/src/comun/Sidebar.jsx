import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../compartido/utilidades/api';
import { obtenerMenuPorRol } from './rutasPorRol';
import ModalCambiarContrasena from '../Paquetes/AccesoCuentas/CU02_CambiarContrasena/ModalCambiarContrasena';

/**
 * Catálogo de iconos SVG en línea para cada módulo institucional
 */
function IconoMenu({ nombre }) {
  const propsIcono = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    style: { flexShrink: 0 }
  };

  switch (nombre) {
    case 'dashboard':
      return (
        <svg {...propsIcono}>
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      );
    case 'calendario':
    case 'agenda':
      return (
        <svg {...propsIcono}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case 'calendario-plus':
      return (
        <svg {...propsIcono}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <line x1="12" y1="13" x2="12" y2="17" />
          <line x1="10" y1="15" x2="14" y2="15" />
        </svg>
      );
    case 'pacientes':
      return (
        <svg {...propsIcono}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case 'estetoscopio':
    case 'medicos':
      return (
        <svg {...propsIcono}>
          <path d="M4.5 3v5a4.5 4.5 0 0 0 9 0V3" />
          <path d="M9 12.5v3.5a3 3 0 0 0 6 0V14" />
          <circle cx="18" cy="14" r="2" />
          <path d="M3 3h3" />
          <path d="M12 3h3" />
        </svg>
      );
    case 'especialidades':
      return (
        <svg {...propsIcono}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <line x1="12" y1="6" x2="12" y2="12" />
          <line x1="9" y1="9" x2="15" y2="9" />
        </svg>
      );
    case 'horarios':
      return (
        <svg {...propsIcono}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case 'historia':
      return (
        <svg {...propsIcono}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
      );
    case 'laboratorio':
      return (
        <svg {...propsIcono}>
          <path d="M10 2v7.31L4.2 19.26A2 2 0 0 0 6 22h12a2 2 0 0 0 1.8-2.74L14 9.31V2" />
          <line x1="8" y1="2" x2="16" y2="2" />
          <line x1="7" y1="15" x2="17" y2="15" />
        </svg>
      );
    case 'seguridad':
      return (
        <svg {...propsIcono}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case 'auditoria':
      return (
        <svg {...propsIcono}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 14 14" />
          <path d="M12 2a10 10 0 0 0-9.5 7" />
          <polyline points="2 4 2.5 9.5 8 9.5" />
        </svg>
      );
    case 'respaldos':
      return (
        <svg {...propsIcono}>
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      );
    case 'reportes':
      return (
        <svg {...propsIcono}>
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      );
    case 'pausa':
      return (
        <svg {...propsIcono}>
          <circle cx="12" cy="12" r="10" />
          <line x1="10" y1="15" x2="10" y2="9" />
          <line x1="14" y1="15" x2="14" y2="9" />
        </svg>
      );
    case 'candado':
    case 'llave':
      return (
        <svg {...propsIcono}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      );
    case 'usuario':
    default:
      return (
        <svg {...propsIcono}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
  }
}

export default function Sidebar({ onCerrarDrawer }) {
  const navigate = useNavigate();
  const location = useLocation();

  const usuarioStr = localStorage.getItem('usuario_clinica');
  let usuario = null;
  try {
    usuario = usuarioStr ? JSON.parse(usuarioStr) : null;
  } catch {
    usuario = null;
  }
  const rol = (usuario?.rol || 'paciente').toLowerCase();

  // Forzar cambio de contraseña si debe_cambiar_contrasena es true (ej. cuenta generada automáticamente con su CI)
  const debeForzarCambio = Boolean(usuario?.debe_cambiar_contrasena);
  const [modalPasswordAbierto, setModalPasswordAbierto] = useState(debeForzarCambio);

  useEffect(() => {
    if (debeForzarCambio) {
      setModalPasswordAbierto(true);
    }
  }, [debeForzarCambio]);

  const secciones = obtenerMenuPorRol(rol);

  const cerrarSesion = async () => {
    try {
      await api.post('/acceso/logout');
    } catch {
      // Proseguir con limpieza local de forma resiliente
    } finally {
      localStorage.removeItem('token_clinica');
      localStorage.removeItem('usuario_clinica');
      if (onCerrarDrawer) onCerrarDrawer();
      navigate('/login');
    }
  };

  return (
    <>
      <aside className="sidebar-clinica">
        {/* 1. Cabecera del Sidebar */}
        <div className="sidebar-cabecera">
          <Link
            to="/"
            className="sidebar-brand-enlace"
            onClick={() => onCerrarDrawer && onCerrarDrawer()}
          >
            <div className="sidebar-isotipo">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <div className="sidebar-brand-texto">
              <span className="sidebar-titulo-clinica">Clínica</span>
              <span className="sidebar-titulo-vidasalud">Vida Salud</span>
            </div>
          </Link>
        </div>

        {/* 2. Lista de Enlaces Categorizados */}
        <nav className="sidebar-navegacion" aria-label="Menú principal de navegación">
          {secciones.map((sec, idxSec) => (
            <div key={idxSec} className="sidebar-grupo-seccion">
              <div className="sidebar-seccion-titulo">{sec.seccion}</div>
              <ul className="sidebar-lista-items">
                {sec.items.map((item, idxItem) => {
                  const esActivo = location.pathname === item.ruta;
                  return (
                    <li key={idxItem} className="sidebar-item-fila">
                      <NavLink
                        to={item.ruta}
                        className={({ isActive }) =>
                          `sidebar-link ${isActive || esActivo ? 'sidebar-link-activo' : ''}`
                        }
                        onClick={() => onCerrarDrawer && onCerrarDrawer()}
                        title={item.descripcion}
                      >
                        <span className="sidebar-link-icono">
                          <IconoMenu nombre={item.icono} />
                        </span>
                        <span className="sidebar-link-texto">{item.titulo}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* Sección CUENTA Global para TODOS los roles */}
          <div className="sidebar-grupo-seccion">
            <div className="sidebar-seccion-titulo">CUENTA</div>
            <ul className="sidebar-lista-items">
              <li className="sidebar-item-fila">
                <NavLink
                  to={rol === 'paciente' ? '/paciente/perfil' : '/perfil'}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'sidebar-link-activo' : ''}`
                  }
                  onClick={() => onCerrarDrawer && onCerrarDrawer()}
                  title="Configuración de perfil y datos personales"
                >
                  <span className="sidebar-link-icono">
                    <IconoMenu nombre="usuario" />
                  </span>
                  <span className="sidebar-link-texto">Mi Perfil</span>
                </NavLink>
              </li>
              <li className="sidebar-item-fila">
                <button
                  type="button"
                  className="sidebar-link sidebar-boton-cambiar-clave"
                  onClick={() => {
                    if (onCerrarDrawer) onCerrarDrawer();
                    setModalPasswordAbierto(true);
                  }}
                  title="Cambiar contraseña de seguridad de la cuenta"
                >
                  <span className="sidebar-link-icono">
                    <IconoMenu nombre="candado" />
                  </span>
                  <span className="sidebar-link-texto">Cambiar Contraseña</span>
                </button>
              </li>
            </ul>
          </div>
        </nav>

        {/* 3. Pie del Sidebar (Anclado al fondo con Cerrar Sesión) */}
        <div className="sidebar-pie">
          <button
            type="button"
            onClick={cerrarSesion}
            className="sidebar-boton-logout"
            title="Finalizar sesión actual y salir del sistema"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Cerrar sesión</span>
          </button>
        </div>

        {/* Estilos CSS encapsulados para el Sidebar */}
        <style>{`
        .sidebar-clinica {
          width: 260px;
          min-width: 260px;
          max-width: 260px;
          height: 100vh;
          position: sticky;
          top: 0;
          display: flex;
          flex-direction: column;
          background-color: #074454;
          color: #FFFFFF;
          box-shadow: 2px 0 12px rgba(7, 68, 84, 0.15);
          user-select: none;
          z-index: 50;
        }

        .sidebar-cabecera {
          height: 64px;
          min-height: 64px;
          display: flex;
          align-items: center;
          padding: 0 1.25rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          background-color: #063946;
        }

        .sidebar-brand-enlace {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
        }

        .sidebar-isotipo {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: linear-gradient(135deg, #1FA5B8 0%, #0A6C84 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(31, 165, 184, 0.3);
          flex-shrink: 0;
        }

        .sidebar-brand-texto {
          display: flex;
          gap: 0.35rem;
          font-size: 1.125rem;
          line-height: 1.2;
        }

        .sidebar-titulo-clinica {
          color: #FFFFFF;
          font-weight: 700;
          letter-spacing: -0.01em;
        }

        .sidebar-titulo-vidasalud {
          color: #22C3E0;
          font-weight: 600;
          letter-spacing: -0.01em;
        }

        .sidebar-navegacion {
          flex: 1;
          overflow-y: auto;
          padding: 1.25rem 0.85rem;
        }

        /* Scrollbar estilizado para el sidebar */
        .sidebar-navegacion::-webkit-scrollbar {
          width: 5px;
        }
        .sidebar-navegacion::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-navegacion::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        .sidebar-grupo-seccion {
          margin-bottom: 1.5rem;
        }

        .sidebar-seccion-titulo {
          color: #8BB2BC;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0 0.75rem;
          margin-bottom: 0.45rem;
        }

        .sidebar-lista-items {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .sidebar-item-fila {
          margin: 0;
          padding: 0;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 10px 12px;
          border-radius: 8px;
          color: #D5EDF2;
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          border-left: 3px solid transparent;
          transition: background-color 0.15s ease, color 0.15s ease;
        }

        .sidebar-link:hover {
          background-color: rgba(255, 255, 255, 0.08);
          color: #FFFFFF;
        }

        .sidebar-boton-cambiar-clave {
          background: transparent;
          border: none;
          width: 100%;
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          outline: none;
        }

        .sidebar-link-activo {
          background-color: #0D5A6E !important;
          color: #FFFFFF !important;
          font-weight: 600;
          border-left: 3px solid #1FA5B8 !important;
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .sidebar-link-activo .sidebar-link-icono {
          color: #22C3E0;
        }

        .sidebar-link-icono {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8BB2BC;
          transition: color 0.15s ease;
        }

        .sidebar-link:hover .sidebar-link-icono {
          color: #22C3E0;
        }

        .sidebar-link-texto {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sidebar-pie {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding: 16px;
          background-color: #063946;
        }

        .sidebar-boton-logout {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.65rem;
          padding: 10px 14px;
          border-radius: 8px;
          background-color: #084352;
          color: #FFFFFF;
          border: 1px solid rgba(255, 255, 255, 0.2);
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.15s ease, border-color 0.15s ease;
        }

        .sidebar-boton-logout:hover {
          background-color: #0A5366;
          border-color: rgba(255, 255, 255, 0.35);
        }
      `}</style>
      </aside>

      {/* Modal Accesible Global de Cambio de Contraseña */}
      <ModalCambiarContrasena
        abierto={modalPasswordAbierto}
        alCerrar={() => setModalPasswordAbierto(false)}
        forzarCambio={debeForzarCambio}
      />
    </>
  );
}
