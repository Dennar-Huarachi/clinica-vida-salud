import React, { useState, useEffect } from 'react';
import api from '../../../compartido/utilidades/api';
import CampoTexto from '../../../compartido/componentes/CampoTexto';
import InsigniaEstado from '../../../compartido/componentes/InsigniaEstado';
import Alerta from '../../../compartido/componentes/Alerta';
import LayoutPrincipal from '../../../compartido/layouts/LayoutPrincipal';
import TablaExpandible from '../../../comun/componentes/TablaExpandible';

/**
 * PaginaEspecialidades (CU-07)
 * Catálogo de Especialidades Médicas con duración de turno en minutos,
 * control de unicidad de nombre normalizado (RF04), switch reservable_en_linea (RN18),
 * advertencia de dependencias al desactivar (CU-07) y patrón de acordeón mobile-first (TablaExpandible).
 */
export default function PaginaEspecialidades() {
  const [especialidades, setEspecialidades] = useState([]);
  const [termino, setTermino] = useState('');
  const [cargando, setCargando] = useState(false);
  const [alerta, setAlerta] = useState(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [espEditando, setEspEditando] = useState(null);
  const [formulario, setFormulario] = useState({
    nombre: '',
    descripcion: '',
    duracion_turno_minutos: 15,
    reservable_en_linea: true,
  });
  const [errores, setErrores] = useState({});

  const cargarEspecialidades = () => {
    setCargando(true);
    api.get(`/catalogos/especialidades-publicas?termino=${encodeURIComponent(termino)}`)
      .then((res) => setEspecialidades(res.data.datos || []))
      .catch((err) => setAlerta({ tipo: 'error', mensaje: err.response?.data?.mensaje || 'Error al cargar especialidades.' }))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargarEspecialidades();
  }, [termino]);

  const abrirModalCrear = () => {
    setEspEditando(null);
    setFormulario({
      nombre: '',
      descripcion: '',
      duracion_turno_minutos: 15,
      reservable_en_linea: true,
    });
    setErrores({});
    setModalAbierto(true);
  };

  const abrirModalEditar = (esp) => {
    setEspEditando(esp);
    setFormulario({
      nombre: esp.nombre,
      descripcion: esp.descripcion || '',
      duracion_turno_minutos: esp.duracion_turno_minutos || 15,
      reservable_en_linea: esp.reservable_en_linea ?? true,
    });
    setErrores({});
    setModalAbierto(true);
  };

  const guardarEspecialidad = async (e) => {
    e.preventDefault();
    setErrores({});

    try {
      if (espEditando) {
        await api.put(`/catalogos/especialidades/${espEditando.id_especialidad}`, formulario);
        setAlerta({ tipo: 'exito', mensaje: 'Especialidad médica actualizada satisfactoriamente.' });
      } else {
        await api.post('/catalogos/especialidades', formulario);
        setAlerta({ tipo: 'exito', mensaje: 'Especialidad creada con éxito.' });
      }
      setModalAbierto(false);
      cargarEspecialidades();
    } catch (err) {
      if (err.response?.status === 422 && err.response.data?.errores) {
        setErrores(err.response.data.errores);
      } else {
        setAlerta({ tipo: 'error', mensaje: err.response?.data?.mensaje || 'Error al guardar especialidad.' });
      }
    }
  };

  const alternarEstado = async (id) => {
    try {
      const res = await api.patch(`/catalogos/especialidades/${id}/alternar-estado`);
      const datos = res.data?.datos || {};
      const advertencia = datos.advertencia;

      if (advertencia) {
        setAlerta({ tipo: 'alerta', mensaje: advertencia });
      } else {
        setAlerta({ tipo: 'exito', mensaje: res.data.mensaje || 'Estado de especialidad actualizado.' });
      }
      cargarEspecialidades();
    } catch (err) {
      setAlerta({ tipo: 'error', mensaje: err.response?.data?.mensaje || 'Error al cambiar estado.' });
    }
  };

  return (
    <LayoutPrincipal titulo="Catálogos · Especialidades Médicas">
      <div className="gestion-especialidades-contenedor">
        {/* Cabecera Principal */}
        <div className="gestion-especialidades-cabecera">
          <div>
            <h2 className="titulo">
              <b>Catálogo</b> <span>de Especialidades Médicas</span>
            </h2>
            <p style={{ color: 'var(--texto-sec)', fontSize: '0.9rem' }}>
              Gestión de ramas médicas, duración estándar de consulta y disponibilidad para reserva en línea.
            </p>
          </div>

          <div className="gestion-especialidades-barra-acciones">
            <div className="gestion-especialidades-buscador">
              <CampoTexto
                etiqueta="Buscar"
                nombre="termino"
                valor={termino}
                alCambiar={(e) => setTermino(e.target.value)}
                placeholder="Buscar especialidad…"
              />
            </div>
            <button
              type="button"
              onClick={abrirModalCrear}
              className="boton-primario gestion-especialidades-btn-nuevo"
              style={{ minHeight: '44px' }}
            >
              + Nueva Especialidad
            </button>
          </div>
        </div>

        <Alerta tipo={alerta?.tipo} mensaje={alerta?.mensaje} />

        {/* Listado con Acordeón Mobile-First (TablaExpandible) */}
        <TablaExpandible
          columnas={['Especialidad Médica', 'Canal de Reserva', 'Duración Consulta', 'Estado', '']}
          datos={especialidades}
          cargando={cargando}
          obtenerClaveFila={(esp) => esp.id_especialidad}
          mensajeVacio="No se encontraron especialidades médicas registradas."
          /* 1. Vista Desktop (> 640px): Tabla tabular limpia */
          renderFilaPrincipal={(esp, isExpanded, toggleExpand) => (
            <>
              <td>
                <strong style={{ color: 'var(--verde-azulado)', fontSize: '0.95rem' }}>{esp.nombre}</strong>
                {esp.descripcion && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--texto-sec)', marginTop: '2px', maxWidth: '360px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {esp.descripcion}
                  </div>
                )}
              </td>
              <td>
                {esp.reservable_en_linea !== false ? (
                  <span style={{
                    backgroundColor: '#E6F9F0',
                    color: '#16A34A',
                    border: '1px solid #B8E8D0',
                    borderRadius: '12px',
                    padding: '3px 10px',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    ✓ En Línea
                  </span>
                ) : (
                  <span style={{
                    backgroundColor: '#F3F4F6',
                    color: '#6B7280',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    padding: '3px 10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    🔒 Ventanilla
                  </span>
                )}
              </td>
              <td>
                <span style={{ fontWeight: 600, color: '#0A6C84' }}>
                  ⏱️ {esp.duracion_turno_minutos} min
                </span>
              </td>
              <td>
                <InsigniaEstado estado={esp.estado} />
              </td>
              <td style={{ width: '44px', textAlign: 'center' }}>
                <button
                  type="button"
                  className={`boton-chevron-expandir ${isExpanded ? 'rotado' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand();
                  }}
                  title={isExpanded ? 'Colapsar detalles' : 'Expandir información'}
                  aria-label="Expandir detalles"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </td>
            </>
          )}
          /* 2. Vista Móvil (<= 640px): 100% vertical, cabecera de 2 líneas */
          renderFilaMovil={(esp, isExpanded, toggleExpand) => (
            <div className="fila-resumen-movil">
              {/* Línea 1 (Arriba): Nombre de la especialidad en negrita */}
              <div className="fila-resumen-movil-linea1">
                <strong className="nombre-paciente-destacado" style={{ fontSize: '1rem', color: 'var(--verde-azulado)' }}>
                  {esp.nombre}
                </strong>
              </div>

              {/* Línea 2 (Abajo): Canal de reserva, Badge de Estado y botón chevron a la derecha */}
              <div className="fila-resumen-movil-linea2">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {esp.reservable_en_linea !== false ? (
                    <span style={{
                      backgroundColor: '#E6F9F0',
                      color: '#16A34A',
                      border: '1px solid #B8E8D0',
                      borderRadius: '12px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}>
                      ✓ En Línea
                    </span>
                  ) : (
                    <span style={{
                      backgroundColor: '#F3F4F6',
                      color: '#6B7280',
                      border: '1px solid #E5E7EB',
                      borderRadius: '12px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}>
                      🔒 Ventanilla
                    </span>
                  )}
                  <InsigniaEstado estado={esp.estado} />
                </div>

                <button
                  type="button"
                  className={`boton-chevron-expandir ${isExpanded ? 'rotado' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand();
                  }}
                  title={isExpanded ? 'Colapsar detalles' : 'Expandir información'}
                  aria-label={isExpanded ? 'Colapsar detalles' : 'Expandir información'}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          /* 3. Subpanel Expandido: Grid 1 columna + Botonera vertical accesible (min-height: 44px) */
          renderDetalle={(esp) => (
            <>
              <div className="panel-detalle-grid">
                <div className="detalle-dato-item">
                  <span className="detalle-etiqueta">Duración Estándar de Consulta</span>
                  <span className="detalle-valor" style={{ color: '#0A6C84', fontWeight: 700 }}>
                    ⏱️ {esp.duracion_turno_minutos} minutos por turno médico
                  </span>
                </div>

                <div className="detalle-dato-item">
                  <span className="detalle-etiqueta">Canal de Reserva Habilitado</span>
                  <span className="detalle-valor">
                    {esp.reservable_en_linea !== false
                      ? '✓ Habilitada para reserva en línea de pacientes y ventanilla de recepción'
                      : '🔒 Exclusiva para gestión por ventanilla/recepción (no visible en portal web)'}
                  </span>
                </div>

                <div className="detalle-dato-item" style={{ gridColumn: '1 / -1' }}>
                  <span className="detalle-etiqueta">Descripción Clínica y Alcance</span>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: '#4A6572', lineHeight: 1.5, wordBreak: 'break-word' }}>
                    {esp.descripcion || 'Sin descripción clínica registrada.'}
                  </p>
                </div>
              </div>

              <div className="panel-detalle-acciones">
                <button
                  type="button"
                  onClick={() => abrirModalEditar(esp)}
                  className="boton-terciario"
                  style={{ minHeight: '44px' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Editar Especialidad
                </button>

                <button
                  type="button"
                  onClick={() => alternarEstado(esp.id_especialidad)}
                  className={esp.estado === 'activo' ? 'boton-peligro' : 'boton-primario'}
                  style={{ minHeight: '44px' }}
                  title="Desactivación lógica (prohibido borrado físico)"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  </svg>
                  {esp.estado === 'activo' ? 'Desactivar Especialidad' : 'Activar Especialidad'}
                </button>
              </div>
            </>
          )}
        />

        {/* Modal Creación / Edición */}
        {modalAbierto && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(18, 52, 59, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem',
            }}
          >
            <div className="tarjeta" style={{ maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
              <h3 className="titulo" style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>
                <b>{espEditando ? 'Editar' : 'Nueva'}</b> <span>Especialidad</span>
              </h3>

              <form onSubmit={guardarEspecialidad}>
                <CampoTexto
                  etiqueta="Nombre de la Especialidad"
                  nombre="nombre"
                  valor={formulario.nombre}
                  alCambiar={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
                  error={errores.nombre?.[0] || errores.nombre || errores.nombre_normalizado?.[0] || errores.nombre_normalizado}
                  placeholder="Ej. Dermatología, Cardiología"
                  requerido
                />

                <CampoTexto
                  etiqueta="Duración Estándar de Consulta (Minutos)"
                  nombre="duracion_turno_minutos"
                  tipo="number"
                  valor={formulario.duracion_turno_minutos}
                  alCambiar={(e) => setFormulario({ ...formulario, duracion_turno_minutos: Number(e.target.value) })}
                  error={errores.duracion_turno_minutos?.[0] || errores.duracion_turno_minutos}
                  placeholder="15"
                  requerido
                />

                <CampoTexto
                  etiqueta="Descripción / Alcance Clínico"
                  nombre="descripcion"
                  valor={formulario.descripcion}
                  alCambiar={(e) => setFormulario({ ...formulario, descripcion: e.target.value })}
                  placeholder="Alcance, indicaciones y tipos de patologías atendidas…"
                  filas={3}
                />

                {/* Switch booleano reservable_en_linea (RN18) */}
                <div style={{
                  backgroundColor: '#F8FAFB',
                  border: '1px solid #DCE9ED',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  margin: '1rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}>
                  <div>
                    <strong style={{ fontSize: '13.5px', color: '#0A6C84', display: 'block' }}>
                      Reserva en Línea (Portal de Pacientes)
                    </strong>
                    <span style={{ fontSize: '12px', color: '#5A7184' }}>
                      Permite que los pacientes agenden citas en esta especialidad desde la web institucional.
                    </span>
                  </div>

                  <label className="switch-reservable">
                    <input
                      type="checkbox"
                      checked={Boolean(formulario.reservable_en_linea)}
                      onChange={(e) => setFormulario({ ...formulario, reservable_en_linea: e.target.checked })}
                    />
                    <span className="slider-reservable round" />
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                  <button type="button" onClick={() => setModalAbierto(false)} className="boton-terciario">
                    Cancelar
                  </button>
                  <button type="submit" className="boton-primario">
                    Guardar Especialidad
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <style>{`
          .gestion-especialidades-contenedor {
            max-width: 1000px;
            margin: 0 auto;
            width: 100%;
            box-sizing: border-box;
            overflow-x: hidden;
          }

          .gestion-especialidades-cabecera {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 1rem;
            margin-bottom: 1.5rem;
            width: 100%;
            box-sizing: border-box;
          }

          .gestion-especialidades-barra-acciones {
            display: flex;
            gap: 0.75rem;
            align-items: flex-end;
            flex-wrap: wrap;
          }

          .gestion-especialidades-buscador {
            width: 220px;
          }

          @media (max-width: 640px) {
            .gestion-especialidades-cabecera {
              flex-direction: column;
              align-items: stretch;
              gap: 1rem;
              margin-bottom: 1.25rem;
            }

            .gestion-especialidades-barra-acciones {
              flex-direction: column;
              align-items: stretch;
              width: 100%;
              gap: 0.75rem;
            }

            .gestion-especialidades-buscador {
              width: 100% !important;
            }

            .gestion-especialidades-btn-nuevo {
              width: 100% !important;
              margin-bottom: 0 !important;
            }
          }

          .switch-reservable {
            position: relative;
            display: inline-block;
            width: 44px;
            height: 24px;
            flex-shrink: 0;
          }

          .switch-reservable input {
            opacity: 0;
            width: 0;
            height: 0;
          }

          .slider-reservable {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #CBD5E1;
            transition: 0.2s;
            border-radius: 24px;
          }

          .slider-reservable:before {
            position: absolute;
            content: "";
            height: 18px;
            width: 18px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            transition: 0.2s;
            border-radius: 50%;
          }

          input:checked + .slider-reservable {
            background-color: #1FA5B8;
          }

          input:checked + .slider-reservable:before {
            transform: translateX(20px);
          }
        `}</style>
      </div>
    </LayoutPrincipal>
  );
}
