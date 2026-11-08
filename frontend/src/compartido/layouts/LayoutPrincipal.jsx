import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../utilidades/api';
import LayoutSidebarPrincipal from '../../comun/LayoutPrincipal';
import NavbarPublico from '../../comun/NavbarPublico';

export default function LayoutPrincipal({ children, titulo }) {
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [modalAyudaAbierto, setModalAyudaAbierto] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const usuarioStr = localStorage.getItem('usuario_clinica');
  const usuario = usuarioStr ? JSON.parse(usuarioStr) : null;
  const rol = (usuario?.rol || '').toLowerCase();

  // Si el usuario está autenticado O si está en cualquier ruta interna del sistema,
  // mostrar el Layout con Sidebar y Header Superior dinámico
  if (usuario || location.pathname !== '/') {
    return (
      <LayoutSidebarPrincipal titulo={titulo}>
        {children}
      </LayoutSidebarPrincipal>
    );
  }

  // En caso de visitante no autenticado en la portada pública ('/'),
  // renderizar la cabecera limpia NavbarPublico y el pie institucional
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Barra de Navegación Pública Optimizada para Pacientes */}
      <NavbarPublico />



      {/* ============================================================
          CONTENIDO PRINCIPAL
          ============================================================ */}
      <main className="contenedor-principal" style={{ flex: 1 }}>
        {children}
      </main>

      {/* ============================================================
          BARRA FIJA INFERIOR (Mobile <= 640px)
          Dividida al 50%: Agendar Cita (Naranja) + ¿Necesita Ayuda? (Verde Azulado)
          ============================================================ */}
      <aside className="barra-fija-inferior" aria-label="Acciones rápidas inferiores">
        <Link to="/citas/reserva" className="barra-inferior-btn agendar">
          📅 Agendar Cita
        </Link>
        <button
          type="button"
          onClick={() => setModalAyudaAbierto(true)}
          className="barra-inferior-btn ayuda"
        >
          💬 ¿Necesita Ayuda?
        </button>
      </aside>

      {/* ============================================================
          BOTONES FLOTANTES (Tablet y Desktop > 640px)
          ============================================================ */}
      <aside className="botones-flotantes-desktop" aria-label="Acciones flotantes">
        <Link to="/citas/reserva" className="btn-flotante agendar">
          <span>📅</span> Agendar Cita
        </Link>
        <button
          type="button"
          onClick={() => setModalAyudaAbierto(true)}
          className="btn-flotante ayuda"
        >
          <span>💬</span> ¿Necesita Ayuda?
        </button>
      </aside>

      {/* ============================================================
          MODAL DE AYUDA / URGENCIAS RESPONSIVE
          ============================================================ */}
      {modalAyudaAbierto && (
        <div className="modal-overlay" onClick={() => setModalAyudaAbierto(false)}>
          <div className="modal-contenedor" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 className="titulo" style={{ fontSize: '1.35rem', margin: 0 }}>
                <b>Centro de Ayuda</b> <span>y Soporte</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalAyudaAbierto(false)}
                className="boton-tactil-cuadrado"
                style={{ background: '#EDF6F8', color: 'var(--texto)', border: '1px solid #CFE2E8' }}
                aria-label="Cerrar Ventana"
              >
                ✕
              </button>
            </div>

            <p style={{ color: 'var(--texto-sec)', fontSize: '0.925rem', marginBottom: '1.25rem' }}>
              Estamos disponibles para orientarte con la reserva de tus citas, dudas sobre estudios o emergencias.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="tarjeta" style={{ background: '#FFF8F2', border: '1px solid #FCDBC0', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.75rem' }}>🚨</span>
                  <div>
                    <h4 style={{ color: 'var(--naranja-oscuro)', margin: 0, fontSize: '1rem' }}>
                      Línea de Urgencias 24 Horas
                    </h4>
                    <a
                      href="tel:70001234"
                      style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--naranja-oscuro)' }}
                    >
                      (591) 7000-1234
                    </a>
                  </div>
                </div>
              </div>

              <div className="tarjeta" style={{ background: '#F5FBFC', border: '1px solid #CFE9EF', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.75rem' }}>💬</span>
                  <div>
                    <h4 style={{ color: 'var(--verde-azulado)', margin: 0, fontSize: '1rem' }}>
                      Recepción y WhatsApp
                    </h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--texto)', margin: '0.2rem 0 0 0' }}>
                      Consultas sobre disponibilidad, médicos de turno y turnos de ecografía/laboratorio.
                    </p>
                  </div>
                </div>
              </div>

              <div className="tarjeta" style={{ padding: '1rem', background: '#FFFFFF', border: '1px solid #E8F1F3' }}>
                <h4 style={{ color: 'var(--texto)', fontSize: '0.95rem', marginBottom: '0.4rem' }}>
                  📍 Ubicación y Horarios de Atención
                </h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--texto-sec)', margin: 0 }}>
                  Av. Principal #100, Zona Central.<br />
                  Consultas externas: Lunes a Sábado de 07:00 a 20:00.<br />
                  Servicio de Emergencias: Atención permanente 24/7.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto' }}>
              <button
                type="button"
                onClick={() => setModalAyudaAbierto(false)}
                className="boton-terciario"
                style={{ flex: 1, minHeight: '44px' }}
              >
                Cerrar
              </button>
              <Link
                to="/citas/reserva"
                onClick={() => setModalAyudaAbierto(false)}
                className="boton-primario"
                style={{ flex: 1, minHeight: '44px' }}
              >
                Ir a Reservas
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          FOOTER RESPONSIVE
          ============================================================ */}
      <footer
        style={{
          background: 'var(--verde-azulado)',
          color: 'var(--blanco)',
          padding: '2rem 1.25rem',
          marginTop: 'auto',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.5rem',
            textAlign: 'left',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 700 }}>
              Clínica Vida Salud
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#D5EDF2', lineHeight: 1.5 }}>
              Comprometidos con el bienestar y la atención médica integral con tecnología de vanguardia y calidez humana.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', fontWeight: 700 }}>
              Servicios Destacados
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.875rem', color: '#D5EDF2', lineHeight: 1.8 }}>
              <li>• Consulta Externa y Especialidades</li>
              <li>• Laboratorio Clínico Automatizado</li>
              <li>• Emergencias Médicas 24/7</li>
              <li>• Historia Clínica Electrónica Segura</li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', fontWeight: 700 }}>
              Contacto Directo
            </h4>
            <p style={{ fontSize: '0.875rem', color: '#D5EDF2', lineHeight: 1.6 }}>
              Teléfono: 7000-1234<br />
              Email: contacto@vidasalud.com<br />
              Av. Principal #100, Zona Central
            </p>
          </div>
        </div>

        <div style={{ maxWidth: '1280px', margin: '1.5rem auto 0 auto', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8rem', color: '#D5EDF2' }}>
          <span>© 2026 Clínica Vida Salud. Todos los derechos reservados.</span>
          <Link
            to="/login/personal"
            style={{ color: '#A8D7E0', textDecoration: 'none', transition: 'color 0.15s ease' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#A8D7E0')}
          >
            Acceso para Colaboradores y Personal Médico →
          </Link>
        </div>
      </footer>

      {/* Estilos específicos de navegación desktop vs móvil para Layout */}
      <style>{`
        @media (max-width: 640px) {
          .acciones-mobile-header {
            display: flex !important;
          }
          .menu-desktop-header {
            display: none !important;
          }
        }
        @media (min-width: 641px) {
          .acciones-mobile-header {
            display: none !important;
          }
          .menu-desktop-header {
            display: flex !important;
            align-items: center;
            gap: 0.5rem;
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
}
