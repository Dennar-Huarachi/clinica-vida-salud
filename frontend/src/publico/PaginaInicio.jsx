import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../compartido/utilidades/api';
import LayoutPrincipal from '../compartido/layouts/LayoutPrincipal';

export default function PaginaInicio() {
  const [conexion, setConexion] = useState('probando');
  const [especialidades, setEspecialidades] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState(null);

  const carruselRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Verificación de salud del backend
    api.get('/salud')
      .then(() => setConexion('correcta'))
      .catch(() => setConexion('sin respuesta'));

    // 2. Cargar especialidades y médicos reales desde PostgreSQL
    api.get('/catalogos/especialidades-publicas')
      .then((res) => setEspecialidades(res.data.datos || []))
      .catch(() => {});

    api.get('/catalogos/medicos-publicos')
      .then((res) => setMedicos(res.data.datos || []))
      .catch(() => {});
  }, []);

  // Función de búsqueda de especialistas
  const manejarBusqueda = (e) => {
    e.preventDefault();
    const q = busqueda.trim().toLowerCase();

    if (!q) {
      setResultadosBusqueda(null);
      return;
    }

    const medicosFiltrados = medicos.filter((m) => {
      const nombreCompleto = `${m.nombres} ${m.apellidos}`.toLowerCase();
      const matricula = (m.nro_matricula || '').toLowerCase();
      const coincideEspecialidad = (m.especialidades || []).some((esp) =>
        esp.nombre.toLowerCase().includes(q)
      );
      return nombreCompleto.includes(q) || matricula.includes(q) || coincideEspecialidad;
    });

    const especialidadesFiltradas = especialidades.filter((esp) =>
      esp.nombre.toLowerCase().includes(q) || (esp.descripcion || '').toLowerCase().includes(q)
    );

    setResultadosBusqueda({
      medicos: medicosFiltrados,
      especialidades: especialidadesFiltradas,
    });
  };

  // Navegación con flechas del carrusel en Desktop/Tablet
  const deslizarCarrusel = (direccion) => {
    if (carruselRef.current) {
      const desplazamiento = direccion === 'izq' ? -320 : 320;
      carruselRef.current.scrollBy({ left: desplazamiento, behavior: 'smooth' });
    }
  };

  return (
    <LayoutPrincipal>
      {/* ============================================================
          BANNER PRINCIPAL / HERO INSTITUCIONAL
          ============================================================ */}
      <section
        style={{
          background: 'linear-gradient(135deg, #0A6C84 0%, #1FA5B8 60%, #22C3E0 100%)',
          color: '#FFFFFF',
          padding: '3rem 1.5rem',
          borderRadius: 'var(--radio)',
          textAlign: 'center',
          boxShadow: 'var(--sombra)',
          marginBottom: '2rem',
        }}
        aria-label="Bienvenida"
      >
        <span
          style={{
            display: 'inline-block',
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '0.35rem 1rem',
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: 700,
            letterSpacing: '0.5px',
            marginBottom: '1rem',
          }}
        >
          COMPROMISO CON TU BIENESTAR INTEGRAL
        </span>

        <h1
          style={{
            fontSize: 'clamp(1.85rem, 5vw, 2.75rem)',
            fontWeight: 800,
            lineHeight: 1.2,
            marginBottom: '1rem',
          }}
        >
          Atención Médica de Calidad, <br />
          <span style={{ color: '#FFE0B2' }}>Sin Esperas ni Filas Innecesarias</span>
        </h1>

        <p
          style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.15rem)',
            maxWidth: '680px',
            margin: '0 auto 2rem',
            lineHeight: 1.6,
            opacity: 0.95,
          }}
        >
          Gestiona tus consultas médicas, agenda turnos en línea y accede a tu expediente clínico electrónico con total seguridad y confidencialidad.
        </p>

        <div className="hero-botones-contenedor" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {/* Botón 1: Soy Paciente (Naranja) */}
          <Link
            to="/login/paciente"
            className="hero-btn hero-btn-paciente"
            title="Acceso al portal de pacientes"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>Soy Paciente</span>
          </Link>

          {/* Botón 2: Registrarse como Paciente (Blanco con borde verde azulado) */}
          <Link
            to="/registro-paciente"
            className="hero-btn hero-btn-registro"
            title="Crear cuenta nueva en el sistema"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
            <span>Registrarse como Paciente</span>
          </Link>

          {/* Botón 3: Reservar Turno Médico (Turquesa / Borde blanco) */}
          <Link
            to="/paciente/reservar"
            className="hero-btn hero-btn-reservar"
            title="Agendar una cita médica en línea"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Reservar Turno Médico</span>
          </Link>
        </div>
      </section>

      {/* ============================================================
          ESTADO DEL SISTEMA (PostgreSQL + API Conexión)
          ============================================================ */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#EDF6F8',
          borderLeft: '4px solid var(--turquesa)',
          padding: '0.75rem 1.25rem',
          borderRadius: '10px',
          marginBottom: '2rem',
          fontSize: '0.875rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <span>
          🏥 <strong>Clínica Vida Salud Online:</strong>{' '}
          {conexion === 'probando'
            ? 'Verificando servicios…'
            : conexion === 'correcta'
            ? 'Sistema conectado y turnos en tiempo real ✓'
            : 'Sin conexión con el servidor ✗'}
        </span>
        <span style={{ color: 'var(--texto-sec)' }}>
          Atención de Consultas: Lun a Sáb 07:00 a 20:00
        </span>
      </div>

      {/* ============================================================
          SECCIÓN C: BUSCADOR DE ESPECIALISTAS ("Busque a su especialista")
          Mobile: Campo y botón apilados verticalmente (100% width)
          Desktop: 1 sola fila horizontal compacta y centrada
          ============================================================ */}
      <section id="buscador" className="buscador-seccion" aria-label="Buscador de especialistas">
        <h2 className="titulo" style={{ fontSize: '1.4rem', textAlign: 'center', marginBottom: '0.35rem' }}>
          <b>Busque a su</b> <span>especialista o consulta</span>
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--texto-sec)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          Encuentra médicos calificados por especialidad, nombre o número de matrícula.
        </p>

        <form onSubmit={manejarBusqueda} className="buscador-formulario">
          <input
            type="text"
            className="input-campo"
            placeholder="Ej: Pediatría, Cardiología, Dr. Pérez…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ fontSize: '1rem', minHeight: '48px' }}
            aria-label="Término de búsqueda de especialista o especialidad"
          />

          <button
            type="submit"
            className="boton-primario"
            style={{ minHeight: '48px', fontSize: '1rem', fontWeight: 700 }}
          >
            BUSCAR →
          </button>
        </form>

        {/* Resultados de Búsqueda Interactivos */}
        {resultadosBusqueda && (
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid #EDF4F6', paddingTop: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--verde-azulado)', marginBottom: '0.75rem' }}>
              Resultados para: "{busqueda}"
            </h3>

            {resultadosBusqueda.medicos.length === 0 && resultadosBusqueda.especialidades.length === 0 ? (
              <p style={{ color: 'var(--texto-sec)', fontStyle: 'italic' }}>
                No se encontraron médicos ni especialidades que coincidan con la búsqueda.
              </p>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '1rem',
                }}
              >
                {resultadosBusqueda.medicos.map((m) => (
                  <div
                    key={m.id_medico}
                    className="tarjeta"
                    style={{ border: '1px solid #CFE9EF', padding: '1rem' }}
                  >
                    <strong style={{ color: 'var(--verde-azulado)', display: 'block' }}>
                      Dr. {m.apellidos}, {m.nombres}
                    </strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--texto-sec)', display: 'block', margin: '0.2rem 0' }}>
                      Matrícula: {m.nro_matricula}
                    </span>
                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', margin: '0.5rem 0' }}>
                      {(m.especialidades || []).map((esp) => (
                        <span
                          key={esp.id_especialidad}
                          style={{
                            background: '#EDF6F8',
                            color: 'var(--verde-azulado)',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}
                        >
                          {esp.nombre}
                        </span>
                      ))}
                    </div>
                    <Link
                      to={`/citas/reserva?medico=${m.id_medico}`}
                      className="boton-primario"
                      style={{ minHeight: '36px', fontSize: '0.85rem', width: '100%', marginTop: '0.5rem' }}
                    >
                      Reservar con este Médico
                    </Link>
                  </div>
                ))}

                {resultadosBusqueda.especialidades.map((esp) => (
                  <div
                    key={esp.id_especialidad}
                    className="tarjeta"
                    style={{ border: '1px solid #FFE0B2', padding: '1rem', background: '#FFFDF9' }}
                  >
                    <strong style={{ color: 'var(--naranja-oscuro)', display: 'block' }}>
                      {esp.nombre}
                    </strong>
                    <p style={{ fontSize: '0.85rem', color: 'var(--texto-sec)', margin: '0.35rem 0' }}>
                      {esp.descripcion || 'Consulta especializada de primer nivel.'}
                    </p>
                    <Link
                      to={`/citas/reserva?especialidad=${esp.id_especialidad}`}
                      className="boton-secundario"
                      style={{ minHeight: '36px', fontSize: '0.85rem', width: '100%', marginTop: '0.5rem' }}
                    >
                      Ver Turnos de {esp.nombre}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ============================================================
          SECCIÓN D: ACCESOS RÁPIDOS RESPONSIVE
          Mobile: 2 columnas | Tablet: 3 columnas | Desktop: 6 columnas
          ============================================================ */}
      <section id="servicios" aria-label="Accesos rápidos a servicios">
        <h2 className="titulo" style={{ fontSize: '1.4rem', textAlign: 'center', marginBottom: '0.25rem' }}>
          <b>Accesos</b> <span>Rápidos y Servicios</span>
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--texto-sec)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          Todo lo que necesitas para tu salud en un solo lugar.
        </p>

        <div className="accesos-rapidos-grid">
          {/* 1. Reservar Cita */}
          <Link to="/citas/reserva" className="tarjeta-acceso-rapido">
            <span className="icono-acceso">📅</span>
            <span className="titulo-acceso">Reservar Cita</span>
          </Link>

          {/* 2. Resultados Lab */}
          <Link to="/historia-clinica" className="tarjeta-acceso-rapido">
            <span className="icono-acceso">🔬</span>
            <span className="titulo-acceso">Laboratorio</span>
          </Link>

          {/* 3. Urgencias 24h */}
          <a href="tel:70001234" className="tarjeta-acceso-rapido" style={{ borderLeft: '3px solid var(--cancelada)' }}>
            <span className="icono-acceso">🚨</span>
            <span className="titulo-acceso">Urgencias 24h</span>
          </a>

          {/* 4. Especialidades */}
          <Link to="/especialidades" className="tarjeta-acceso-rapido">
            <span className="icono-acceso">🩺</span>
            <span className="titulo-acceso">Especialidades</span>
          </Link>

          {/* 5. Cuerpo Médico */}
          <Link to="/medicos" className="tarjeta-acceso-rapido">
            <span className="icono-acceso">👨‍⚕️</span>
            <span className="titulo-acceso">Cuerpo Médico</span>
          </Link>

          {/* 6. Portal Paciente */}
          <Link to="/login/paciente" className="tarjeta-acceso-rapido">
            <span className="icono-acceso">👤</span>
            <span className="titulo-acceso">Portal Paciente</span>
          </Link>
        </div>
      </section>

      {/* ============================================================
          SECCIÓN D2: CARRUSEL DE ESPECIALIDADES Y SERVICIOS
          Mobile: Desplazamiento táctil suave dejando ver borde siguiente tarjeta
          Tablet / Desktop: Flechas circulares ‹ › a los lados
          ============================================================ */}
      <section id="especialidades" aria-label="Carrusel de especialidades médicas">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 className="titulo" style={{ fontSize: '1.4rem' }}>
              <b>Especialidades</b> <span>Clínicas</span>
            </h2>
            <p style={{ color: 'var(--texto-sec)', fontSize: '0.85rem' }}>
              Desliza para explorar nuestros servicios y profesionales disponibles.
            </p>
          </div>
          <Link to="/citas/reserva" style={{ fontSize: '0.875rem', fontWeight: 700 }}>
            Ver todos los turnos →
          </Link>
        </div>

        <div className="carrusel-contenedor">
          {/* Flecha Izquierda (Tablet / Desktop) */}
          <button
            type="button"
            onClick={() => deslizarCarrusel('izq')}
            className="carrusel-flecha izq"
            aria-label="Ver especialidades anteriores"
          >
            ‹
          </button>

          {/* Track del carrusel con scroll horizontal táctil */}
          <div className="carrusel-track" ref={carruselRef}>
            {especialidades.map((esp) => (
              <div
                key={esp.id_especialidad}
                className="carrusel-item tarjeta"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: '4px solid var(--turquesa)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.15rem', color: 'var(--verde-azulado)', margin: 0, fontWeight: 700 }}>
                      {esp.nombre}
                    </h3>
                    <span
                      style={{
                        background: '#EDF6F8',
                        color: 'var(--turquesa)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {esp.duracion_turno_minutos} min
                    </span>
                  </div>

                  <p
                    style={{
                      color: 'var(--texto-sec)',
                      fontSize: '0.875rem',
                      lineHeight: 1.5,
                      marginBottom: '1rem',
                    }}
                  >
                    {esp.descripcion || 'Atención personalizada y diagnóstico oportuno con equipamiento de avanzada.'}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid #EDF4F6', paddingTop: '0.75rem', marginTop: 'auto' }}>
                  <Link
                    to="/citas/reserva"
                    className="boton-primario"
                    style={{ width: '100%', minHeight: '40px', fontSize: '0.875rem' }}
                  >
                    Reservar Consulta →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Flecha Derecha (Tablet / Desktop) */}
          <button
            type="button"
            onClick={() => deslizarCarrusel('der')}
            className="carrusel-flecha der"
            aria-label="Ver especialidades siguientes"
          >
            ›
          </button>
        </div>
      </section>

      {/* ============================================================
          SECCIÓN DE CONFIANZA Y GARANTÍAS CLÍNICAS
          ============================================================ */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 className="titulo" style={{ fontSize: '1.4rem', textAlign: 'center', marginBottom: '0.25rem' }}>
          <b>¿Por qué elegir</b> <span>Clínica Vida Salud?</span>
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--texto-sec)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Seguridad médica, rapidez y tecnología al servicio de tu bienestar.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.25rem',
          }}
        >
          <div className="tarjeta" style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>⏱️</span>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--verde-azulado)', marginBottom: '0.5rem' }}>
              Cero Filas de Espera
            </h3>
            <p style={{ color: 'var(--texto-sec)', fontSize: '0.875rem', lineHeight: 1.5 }}>
              Reserva de turnos con intervalos garantizados y confirmación inmediata en tu teléfono móvil.
            </p>
          </div>

          <div className="tarjeta" style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>🛡️</span>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--verde-azulado)', marginBottom: '0.5rem' }}>
              Historial Digital Seguro
            </h3>
            <p style={{ color: 'var(--texto-sec)', fontSize: '0.875rem', lineHeight: 1.5 }}>
              Tus atenciones médicas, diagnósticos y estudios de laboratorio registrados de manera inmutable y confidencial.
            </p>
          </div>

          <div className="tarjeta" style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>👨‍⚕️</span>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--verde-azulado)', marginBottom: '0.5rem' }}>
              Profesionales Colegiados
            </h3>
            <p style={{ color: 'var(--texto-sec)', fontSize: '0.875rem', lineHeight: 1.5 }}>
              Cuerpo médico con matrícula profesional activa y permanente capacitación científica.
            </p>
          </div>
        </div>
      </section>

      {/* Estilos específicos para los botones del banner principal */}
      <style>{`
        .hero-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.65rem;
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 700;
          text-decoration: none;
          min-height: 48px;
          box-sizing: border-box;
          transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, color 0.15s ease;
        }

        .hero-btn-paciente {
          background-color: #F28C1E;
          color: #FFFFFF;
          border: 2px solid #F28C1E;
          box-shadow: 0 4px 14px rgba(242, 140, 30, 0.35);
        }
        .hero-btn-paciente:hover {
          background-color: #DE780D;
          border-color: #DE780D;
          box-shadow: 0 6px 18px rgba(242, 140, 30, 0.45);
        }

        .hero-btn-registro {
          background-color: #FFFFFF;
          color: #0A6C84;
          border: 2px solid #0A6C84;
          box-shadow: 0 4px 12px rgba(10, 108, 132, 0.1);
        }
        .hero-btn-registro:hover {
          background-color: #EAF4F6;
          border-color: #0A6C84;
          box-shadow: 0 6px 16px rgba(10, 108, 132, 0.18);
        }

        .hero-btn-reservar {
          background-color: #1FA5B8;
          color: #FFFFFF;
          border: 2px solid rgba(255, 255, 255, 0.85);
          box-shadow: 0 4px 12px rgba(31, 165, 184, 0.3);
        }
        .hero-btn-reservar:hover {
          background-color: #188F9F;
          border-color: #FFFFFF;
          box-shadow: 0 6px 16px rgba(31, 165, 184, 0.4);
        }

        @media (max-width: 640px) {
          .hero-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </LayoutPrincipal>
  );
}
