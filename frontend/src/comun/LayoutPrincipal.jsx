import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import HeaderSuperior from './HeaderSuperior';
import useInactividad from './hooks/useInactividad';

export default function LayoutPrincipal({ children, titulo }) {
  // Manejador transversal de auto-cierre de sesión por inactividad (15 min)
  useInactividad();

  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const location = useLocation();

  // Cerrar el drawer automáticamente al cambiar de ruta
  useEffect(() => {
    setDrawerAbierto(false);
  }, [location.pathname]);

  // Manejar bloqueo de scroll cuando el drawer está activo en móvil
  useEffect(() => {
    if (drawerAbierto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerAbierto]);

  const [alertaSeguridad, setAlertaSeguridad] = useState(null);

  // Detectar y consumir alertas de seguridad emitidas por RutaProtegidaPorRol
  useEffect(() => {
    const alertaRaw = sessionStorage.getItem('alerta_seguridad_clinica');
    if (alertaRaw) {
      try {
        const parsed = JSON.parse(alertaRaw);
        if (Date.now() - parsed.timestamp < 10000) {
          setAlertaSeguridad(parsed.mensaje);
        }
      } catch (e) {
        setAlertaSeguridad(alertaRaw);
      }
      sessionStorage.removeItem('alerta_seguridad_clinica');
    }
  }, [location.pathname]);

  return (
    <div className="layout-panel-contenedor">
      {/* 1. Backdrop / Fondo oscurecido para drawer en móvil y tablet */}
      {drawerAbierto && (
        <div
          className="layout-drawer-backdrop"
          onClick={() => setDrawerAbierto(false)}
          aria-hidden="true"
        />
      )}

      {/* 2. Columna 1: Sidebar Fijo (Desktop) / Drawer Deslizante (Móvil y Tablet) */}
      <div className={`layout-sidebar-columna ${drawerAbierto ? 'drawer-activo' : ''}`}>
        <Sidebar onCerrarDrawer={() => setDrawerAbierto(false)} />
      </div>

      {/* 3. Columna 2: Header Superior + Área de Contenido Principal */}
      <div className="layout-contenido-columna">
        <HeaderSuperior
          onToggleDrawer={() => setDrawerAbierto(!drawerAbierto)}
          tituloPersonalizado={titulo}
        />

        {alertaSeguridad && (
          <div className="layout-alerta-seguridad" role="alert">
            <div className="layout-alerta-seguridad-contenido">
              <span className="layout-alerta-icono" aria-hidden="true">🛡️</span>
              <span className="layout-alerta-texto">{alertaSeguridad}</span>
            </div>
            <button
              type="button"
              onClick={() => setAlertaSeguridad(null)}
              className="layout-alerta-cerrar"
              aria-label="Cerrar notificación"
            >
              ✕
            </button>
          </div>
        )}

        <main className="layout-main-contenido">
          {children}
        </main>
      </div>

      {/* Estilos CSS del Layout Principal con Sidebar */}
      <style>{`
        .layout-panel-contenedor {
          display: flex;
          min-height: 100vh;
          width: 100%;
          background-color: var(--fondo, #F4FAFB);
          box-sizing: border-box;
          position: relative;
        }

        /* Columna 1: Sidebar */
        .layout-sidebar-columna {
          width: 260px;
          min-width: 260px;
          max-width: 260px;
          flex-shrink: 0;
          position: sticky;
          top: 0;
          height: 100vh;
          z-index: 50;
        }

        /* Columna 2: Header + Main */
        .layout-contenido-columna {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          background-color: var(--fondo, #F4FAFB);
        }

        /* Alerta sutil de seguridad */
        .layout-alerta-seguridad {
          margin: 12px 24px 0 24px;
          padding: 10px 16px;
          background-color: #FEF3C7;
          border-left: 4px solid #D97706;
          border-radius: 6px;
          color: #92400E;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13px;
          font-weight: 500;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          animation: slideDownAlerta 0.3s ease-out;
        }

        .layout-alerta-seguridad-contenido {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .layout-alerta-icono {
          font-size: 16px;
        }

        .layout-alerta-cerrar {
          background: transparent;
          border: none;
          color: #92400E;
          font-size: 16px;
          cursor: pointer;
          padding: 0 4px;
          line-height: 1;
        }

        @keyframes slideDownAlerta {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .layout-main-contenido {
          background-color: var(--fondo, #F4FAFB);
          min-height: calc(100vh - 64px);
          padding: 24px;
          box-sizing: border-box;
          flex: 1;
        }

        /* Responsividad: Móviles (<= 640px) y Tablets (<= 1024px) */
        @media (max-width: 1024px) {
          .layout-sidebar-columna {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            z-index: 1000;
            transform: translateX(-100%);
            transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: none;
          }

          .layout-sidebar-columna.drawer-activo {
            transform: translateX(0);
            box-shadow: 4px 0 20px rgba(7, 68, 84, 0.3);
          }

          .layout-drawer-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background-color: rgba(7, 68, 84, 0.45);
            z-index: 999;
            backdrop-filter: blur(2px);
          }

          .layout-main-contenido {
            padding: 20px 16px;
          }
        }

        @media (max-width: 640px) {
          .layout-panel-contenedor,
          .layout-contenido-columna {
            overflow-x: hidden !important;
            max-width: 100vw !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }

          .layout-main-contenido {
            padding: 16px 12px;
            overflow-x: hidden !important;
            max-width: 100% !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>
    </div>
  );
}
