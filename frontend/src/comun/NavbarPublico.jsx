import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

/**
 * NavbarPublico
 * Barra de navegación pública optimizada y orientada a los pacientes.
 * Clínica Vida Salud
 */
export default function NavbarPublico() {
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setMenuMovilAbierto(false);
  }, [location.pathname]);

  // Manejo de desplazamiento suave para enlaces con ancla (#especialidades, #servicios)
  const navegarOEscalar = (e, ancla) => {
    if (location.pathname === '/') {
      e.preventDefault();
      const el = document.getElementById(ancla);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
      setMenuMovilAbierto(false);
    } else {
      setMenuMovilAbierto(false);
      navigate(`/#${ancla}`);
    }
  };

  return (
    <>
      <header className="navbar-publico-header">
        <div className="navbar-publico-contenedor">
          {/* 1. Lado Izquierdo: Logotipo Tipográfico con Isotipo Médico */}
          <Link to="/" className="navbar-publico-brand" aria-label="Ir a Inicio - Clínica Vida Salud">
            <div className="navbar-publico-isotipo">
              <svg
                width="22"
                height="22"
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
            <div className="navbar-publico-marca">
              <span className="navbar-marca-clinica">Clínica</span>
              <span className="navbar-marca-vidasalud">Vida Salud</span>
            </div>
          </Link>

          {/* 2. Centro: Enlaces de Navegación Limpios */}
          <nav className="navbar-publico-nav-desktop" aria-label="Navegación principal">
            <Link to="/" className="navbar-link-limpio">
              Inicio
            </Link>
            <a
              href="#especialidades"
              onClick={(e) => navegarOEscalar(e, 'especialidades')}
              className="navbar-link-limpio"
            >
              Especialidades
            </a>
            <a
              href="#servicios"
              onClick={(e) => navegarOEscalar(e, 'servicios')}
              className="navbar-link-limpio"
            >
              Nuestros Servicios
            </a>
          </nav>

          {/* 3. Lado Derecho: Botón Único de Acción Naranja + Botón Hamburguesa */}
          <div className="navbar-publico-acciones">
            <Link to="/login" className="navbar-boton-login-naranja" title="Acceder a su cuenta o panel">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              <span>Iniciar Sesión</span>
            </Link>

            {/* Botón Hamburguesa (Visible en Móviles y Tablets) */}
            <button
              type="button"
              className="navbar-boton-hamburguesa"
              onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
              aria-label="Abrir menú de navegación móvil"
            >
              <svg
                width="24"
                height="24"
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
          </div>
        </div>
      </header>

      {/* Drawer Móvil Deslizante con Capa Oscura */}
      {menuMovilAbierto && (
        <div
          className="navbar-drawer-backdrop"
          onClick={() => setMenuMovilAbierto(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`navbar-drawer-panel ${menuMovilAbierto ? 'drawer-abierto' : ''}`}>
        <div className="navbar-drawer-cabecera">
          <div className="navbar-publico-brand">
            <div className="navbar-publico-isotipo">
              <svg
                width="20"
                height="20"
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
            <div className="navbar-publico-marca">
              <span className="navbar-marca-clinica">Clínica</span>
              <span className="navbar-marca-vidasalud">Vida Salud</span>
            </div>
          </div>

          <button
            type="button"
            className="navbar-drawer-cerrar"
            onClick={() => setMenuMovilAbierto(false)}
            aria-label="Cerrar menú"
          >
            ✕
          </button>
        </div>

        <nav className="navbar-drawer-enlaces">
          <Link
            to="/"
            className="navbar-drawer-link"
            onClick={() => setMenuMovilAbierto(false)}
          >
            Inicio
          </Link>
          <a
            href="#especialidades"
            className="navbar-drawer-link"
            onClick={(e) => navegarOEscalar(e, 'especialidades')}
          >
            Especialidades
          </a>
          <a
            href="#servicios"
            className="navbar-drawer-link"
            onClick={(e) => navegarOEscalar(e, 'servicios')}
          >
            Nuestros Servicios
          </a>
        </nav>

        <div className="navbar-drawer-pie">
          <Link
            to="/login"
            className="navbar-boton-login-naranja"
            style={{ width: '100%', justifyContent: 'center', minHeight: '46px' }}
            onClick={() => setMenuMovilAbierto(false)}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            <span>Iniciar Sesión</span>
          </Link>

          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <Link
              to="/login/personal"
              onClick={() => setMenuMovilAbierto(false)}
              style={{ fontSize: '0.8rem', color: '#8BB2BC', textDecoration: 'none' }}
            >
              Acceso Institucional para Personal →
            </Link>
          </div>
        </div>
      </aside>

      {/* Estilos CSS Encapsulados del Navbar Público */}
      <style>{`
        .navbar-publico-header {
          background-color: #FFFFFF;
          border-bottom: 1px solid #E1ECEE;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 2px 8px rgba(10, 108, 132, 0.05);
        }

        .navbar-publico-contenedor {
          max-width: 1280px;
          margin: 0 auto;
          height: 68px;
          padding: 0 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
        }

        /* 1. Logotipo */
        .navbar-publico-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          flex-shrink: 0;
        }

        .navbar-publico-isotipo {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, #1FA5B8 0%, #0A6C84 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 8px rgba(31, 165, 184, 0.25);
          flex-shrink: 0;
        }

        .navbar-publico-marca {
          display: flex;
          gap: 0.35rem;
          font-size: 1.25rem;
          line-height: 1.2;
        }

        .navbar-marca-clinica {
          color: #0A6C84;
          font-weight: 800;
          letter-spacing: -0.01em;
        }

        .navbar-marca-vidasalud {
          color: #1FA5B8;
          font-weight: 600;
          letter-spacing: -0.01em;
        }

        /* 2. Enlaces Centrales */
        .navbar-publico-nav-desktop {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .navbar-link-limpio {
          color: #12343B;
          font-size: 0.95rem;
          font-weight: 600;
          text-decoration: none;
          padding: 0.5rem 0.25rem;
          border-bottom: 2px solid transparent;
          transition: color 0.15s ease, border-color 0.15s ease;
        }

        .navbar-link-limpio:hover {
          color: #0A6C84;
          border-bottom-color: #1FA5B8;
        }

        /* 3. Acciones Derecha */
        .navbar-publico-acciones {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }

        .navbar-boton-login-naranja {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background-color: #F28C1E;
          color: #FFFFFF;
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 700;
          text-decoration: none;
          box-shadow: 0 3px 10px rgba(242, 140, 30, 0.25);
          transition: background-color 0.15s ease, box-shadow 0.15s ease;
          white-space: nowrap;
        }

        .navbar-boton-login-naranja:hover {
          background-color: #DE780D;
          box-shadow: 0 4px 14px rgba(242, 140, 30, 0.35);
        }

        .navbar-boton-hamburguesa {
          display: none;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          border-radius: 8px;
          background-color: #F4FAFB;
          border: 1px solid #D2E4E8;
          color: #0A6C84;
          cursor: pointer;
          transition: background-color 0.15s ease, border-color 0.15s ease;
        }

        .navbar-boton-hamburguesa:hover {
          background-color: #EAF4F6;
          border-color: #1FA5B8;
        }

        /* Drawer Móvil */
        .navbar-drawer-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(7, 68, 84, 0.45);
          backdrop-filter: blur(2px);
          z-index: 999;
        }

        .navbar-drawer-panel {
          position: fixed;
          top: 0;
          right: 0;
          width: 280px;
          max-width: 85vw;
          height: 100vh;
          background-color: #FFFFFF;
          box-shadow: -4px 0 20px rgba(7, 68, 84, 0.2);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          transform: translateX(100%);
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .navbar-drawer-panel.drawer-abierto {
          transform: translateX(0);
        }

        .navbar-drawer-cabecera {
          height: 68px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.25rem;
          border-bottom: 1px solid #E1ECEE;
        }

        .navbar-drawer-cerrar {
          background: none;
          border: none;
          font-size: 1.25rem;
          color: #5B7078;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
        }

        .navbar-drawer-cerrar:hover {
          color: #12343B;
          background-color: #F4FAFB;
        }

        .navbar-drawer-enlaces {
          display: flex;
          flex-direction: column;
          padding: 1.5rem 1.25rem;
          gap: 0.5rem;
          flex: 1;
        }

        .navbar-drawer-link {
          display: flex;
          align-items: center;
          padding: 12px 14px;
          border-radius: 8px;
          color: #12343B;
          font-size: 1rem;
          font-weight: 600;
          text-decoration: none;
          transition: background-color 0.15s ease, color 0.15s ease;
        }

        .navbar-drawer-link:hover {
          background-color: #EDF6F8;
          color: #0A6C84;
        }

        .navbar-drawer-pie {
          padding: 1.25rem;
          border-top: 1px solid #E1ECEE;
          background-color: #F8FCFD;
        }

        /* Responsividad */
        @media (max-width: 768px) {
          .navbar-publico-nav-desktop {
            display: none;
          }

          .navbar-boton-login-naranja {
            display: none;
          }

          .navbar-boton-hamburguesa {
            display: flex;
          }
        }
      `}</style>
    </>
  );
}
