import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../compartido/utilidades/api';
import LayoutPrincipal from '../../../compartido/layouts/LayoutPrincipal';
import TablaExpandible from '../../../comun/componentes/TablaExpandible';
import InsigniaEstado from '../../../compartido/componentes/InsigniaEstado';
import Alerta from '../../../compartido/componentes/Alerta';
import ModalHorario from './ModalHorario';

const DIAS_SEMANA_MAP = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  7: 'Domingo',
};

export default function PaginaHorarios() {
  const [horarios, setHorarios] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [filtroMedico, setFiltroMedico] = useState('');
  const [cargando, setCargando] = useState(false);
  const [alerta, setAlerta] = useState(null);
  const [advertenciaCitas, setAdvertenciaCitas] = useState(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [horarioEditando, setHorarioEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // Cargar lista de horarios y médicos disponibles
  const cargarDatos = () => {
    setCargando(true);
    const urlHorarios = filtroMedico
      ? `/catalogos/horarios?id_medico=${filtroMedico}`
      : '/catalogos/horarios';

    Promise.all([
      api.get(urlHorarios),
      api.get('/catalogos/medicos-publicos'),
    ])
      .then(([resHor, resMed]) => {
        setHorarios(resHor.data.datos || []);
        setMedicos(resMed.data.datos || []);
      })
      .catch((err) => {
        setAlerta({
          tipo: 'error',
          mensaje: err.response?.data?.mensaje || 'Error al cargar la programación de horarios.',
        });
      })
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargarDatos();
  }, [filtroMedico]);

  const abrirModalCrear = () => {
    setHorarioEditando(null);
    setModalAbierto(true);
  };

  const abrirModalEditar = (h) => {
    setHorarioEditando(h);
    setModalAbierto(true);
  };

  const guardarHorario = async (payload, setErrores) => {
    setGuardando(true);
    setAlerta(null);
    try {
      if (horarioEditando) {
        await api.put(`/catalogos/horarios/${horarioEditando.id_horario}`, payload);
        setAlerta({ tipo: 'exito', mensaje: 'Horario de atención actualizado exitosamente.' });
      } else {
        const res = await api.post('/catalogos/horarios', payload);
        const total = res.data?.datos?.total_creados;
        const msj = total && total > 1
          ? `¡Se registraron exitosamente ${total} franjas de horario para los días seleccionados!`
          : (res.data?.mensaje || 'Nuevo horario de atención registrado exitosamente.');
        setAlerta({ tipo: 'exito', mensaje: msj });
      }
      setModalAbierto(false);
      cargarDatos();
    } catch (err) {
      if (err.response?.status === 422 && err.response.data?.errores) {
        setErrores(err.response.data.errores);
      } else {
        const errorMsg = err.response?.data?.mensaje || 'Error al guardar la franja horaria.';
        setErrores({ general: errorMsg });
      }
    } finally {
      setGuardando(false);
    }
  };

  const alternarEstado = async (idHorario) => {
    setAlerta(null);
    setAdvertenciaCitas(null);
    try {
      const res = await api.patch(`/catalogos/horarios/${idHorario}/alternar-estado`);
      const alertaMsg = res.data.alerta || res.data.datos?.alerta;

      if (alertaMsg) {
        setAdvertenciaCitas({
          mensaje: alertaMsg,
          citasAfectadas: res.data.citas_afectadas ?? res.data.datos?.citas_afectadas ?? 0,
        });
      }

      setAlerta({
        tipo: 'exito',
        mensaje: res.data.mensaje || 'Estado del horario actualizado correctamente.',
      });
      cargarDatos();
    } catch (err) {
      setAlerta({
        tipo: 'error',
        mensaje: err.response?.data?.mensaje || 'Error al alternar estado del horario.',
      });
    }
  };

  // Calcular cantidad estimada de turnos por franja
  const calcularTurnosFranja = (horaInicio, horaFin, duracionMin) => {
    if (!horaInicio || !horaFin || !duracionMin) return 0;
    const [h1, m1] = horaInicio.split(':').map(Number);
    const [h2, m2] = horaFin.split(':').map(Number);
    const minTotales = (h2 * 60 + m2) - (h1 * 60 + m1);
    return minTotales > 0 ? Math.floor(minTotales / duracionMin) : 0;
  };

  return (
    <LayoutPrincipal>
      <div className="gestion-horarios-contenedor">
        {/* Cabecera Principal */}
        <div className="gestion-horarios-cabecera">
          <div>
            <h2 className="titulo">
              <b>Horarios</b> <span>de Atención</span>
            </h2>
            <p style={{ color: 'var(--texto-sec)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
              Programación semanal de jornadas de consulta, franjas horarias e intervalos por especialista.
            </p>
          </div>

          <div className="gestion-horarios-barra-acciones">
            {/* Filtro rápido por médico */}
            <div className="gestion-horarios-filtro-medico">
              <select
                id="filtro-medico-horarios"
                aria-label="Filtrar por médico especialista"
                value={filtroMedico}
                onChange={(e) => setFiltroMedico(e.target.value)}
                className="campo-control"
                style={{
                  padding: '0.6rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--borde-campo)',
                  background: '#FFFFFF',
                  fontSize: '0.9rem',
                  minHeight: '44px',
                  width: '100%',
                }}
              >
                <option value="">Todos los Médicos Especialistas</option>
                {medicos.map((m) => (
                  <option key={m.id_medico} value={m.id_medico}>
                    Dr. {m.apellidos}, {m.nombres}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={abrirModalCrear}
              className="boton-primario gestion-horarios-btn-nuevo"
              style={{ minHeight: '44px' }}
            >
              + Nuevo Horario
            </button>
          </div>
        </div>

        {/* Mensaje de alerta general */}
        <Alerta tipo={alerta?.tipo} mensaje={alerta?.mensaje} />

        {/* Banner de Advertencia Informativa al Desactivar Franja con Citas */}
        {advertenciaCitas && (
          <div className="banner-advertencia-horario" role="alert">
            <div className="banner-advertencia-contenido">
              <div className="banner-advertencia-icono">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="banner-advertencia-textos">
                <strong style={{ display: 'block', fontSize: '0.95rem', color: '#92400E', marginBottom: '4px' }}>
                  Atención: Franja Inactivada con Citas Futuras Asociadas
                </strong>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#78350F', lineHeight: 1.45 }}>
                  {advertenciaCitas.mensaje}
                </p>
              </div>
            </div>

            <div className="banner-advertencia-acciones">
              <Link
                to="/recepcion/suspensiones"
                className="boton-primario"
                style={{ minHeight: '44px', textDecoration: 'none', background: '#0A6C84' }}
              >
                Gestionar Suspensión de Horarios →
              </Link>
              <button
                type="button"
                onClick={() => setAdvertenciaCitas(null)}
                className="boton-terciario"
                style={{ minHeight: '44px' }}
              >
                Entendido / Cerrar
              </button>
            </div>
          </div>
        )}

        {/* Tabla Expandible de Horarios (Mobile-First) */}
        <TablaExpandible
          columnas={['Día de Atención', 'Médico Especialista', 'Franja Horaria', 'Duración / Turnos', 'Estado', '']}
          datos={horarios}
          cargando={cargando}
          obtenerClaveFila={(h) => h.id_horario}
          mensajeVacio="No se encontraron horarios de consulta configurados para el criterio seleccionado."
          renderFilaPrincipal={(h, isExpanded, toggleExpand) => {
            const turnosEstimados = calcularTurnosFranja(
              h.hora_inicio?.substring(0, 5),
              h.hora_fin?.substring(0, 5),
              h.duracion_intervalo_minutos
            );

            return (
              <>
                <td>
                  <span className="badge-dia-semana">
                    📅 {DIAS_SEMANA_MAP[h.dia_semana] || `Día ${h.dia_semana}`}
                  </span>
                </td>
                <td>
                  <strong style={{ color: 'var(--verde-azulado)', fontSize: '0.95rem' }}>
                    Dr. {h.medico_apellidos}, {h.medico_nombres}
                  </strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--texto-sec)' }}>
                    🩺 {h.especialidad_nombre}
                  </div>
                </td>
                <td>
                  <span style={{ fontWeight: 700, color: 'var(--texto-encabezados)', fontSize: '0.95rem' }}>
                    {h.hora_inicio?.substring(0, 5)} - {h.hora_fin?.substring(0, 5)}
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: '0.875rem', color: 'var(--texto-sec)' }}>
                    {h.duracion_intervalo_minutos} min / <b>{turnosEstimados} cupos</b>
                  </span>
                </td>
                <td>
                  <InsigniaEstado estado={h.estado} />
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
            );
          }}
          renderFilaMovil={(h, isExpanded, toggleExpand) => (
            <div className="fila-resumen-movil">
              {/* Línea 1 (Arriba): Día de la semana y Estado */}
              <div className="fila-resumen-movil-linea1">
                <span className="badge-dia-semana">
                  📅 {DIAS_SEMANA_MAP[h.dia_semana] || `Día ${h.dia_semana}`}
                </span>
                <InsigniaEstado estado={h.estado} />
              </div>

              {/* Línea 2 (Abajo): Médico, Franja Horaria y Chevron */}
              <div className="fila-resumen-movil-linea2">
                <div className="fila-resumen-movil-nombre">
                  <strong className="nombre-paciente-destacado">
                    Dr. {h.medico_apellidos}, {h.medico_nombres}
                  </strong>
                  <span className="ci-paciente-sub">
                    ⏰ {h.hora_inicio?.substring(0, 5)} - {h.hora_fin?.substring(0, 5)} ({h.especialidad_nombre})
                  </span>
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
          renderDetalle={(h) => {
            const turnosEstimados = calcularTurnosFranja(
              h.hora_inicio?.substring(0, 5),
              h.hora_fin?.substring(0, 5),
              h.duracion_intervalo_minutos
            );

            return (
              <>
                <div className="panel-detalle-grid">
                  <div className="detalle-dato-item">
                    <span className="detalle-etiqueta">Especialidad Médica Vinculada</span>
                    <span className="detalle-valor" style={{ color: 'var(--verde-azulado)', fontWeight: 600 }}>
                      🩺 {h.especialidad_nombre}
                    </span>
                  </div>

                  <div className="detalle-dato-item">
                    <span className="detalle-etiqueta">Duración Configurada por Consulta</span>
                    <span className="detalle-valor">{h.duracion_intervalo_minutos} minutos por turno</span>
                  </div>

                  <div className="detalle-dato-item" style={{ gridColumn: '1 / -1' }}>
                    <span className="detalle-etiqueta">Capacidad Estimada por Jornada</span>
                    <div style={{ marginTop: '4px', fontSize: '0.9rem', color: '#0A6C84', fontWeight: 600 }}>
                      ⚡ {turnosEstimados} turnos disponibles en el bloque de {h.hora_inicio?.substring(0, 5)} a {h.hora_fin?.substring(0, 5)}
                    </div>
                  </div>
                </div>

                <div className="panel-detalle-acciones">
                  <button
                    type="button"
                    onClick={() => abrirModalEditar(h)}
                    className="boton-secundario"
                    style={{ minHeight: '44px' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Editar Franja
                  </button>

                  <button
                    type="button"
                    onClick={() => alternarEstado(h.id_horario)}
                    className={h.estado === 'activo' ? 'boton-peligro' : 'boton-primario'}
                    style={{ minHeight: '44px' }}
                    title="Desactivación lógica del bloque horario"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                    </svg>
                    {h.estado === 'activo' ? 'Inactivar Horario' : 'Activar Horario'}
                  </button>
                </div>
              </>
            );
          }}
        />

        {/* Modal de Creación / Edición */}
        <ModalHorario
          abierto={modalAbierto}
          alCerrar={() => setModalAbierto(false)}
          alGuardar={guardarHorario}
          horarioEditando={horarioEditando}
          medicos={medicos}
          cargando={guardando}
        />

        {/* Estilos Scoped y Mobile-First */}
        <style>{`
          .gestion-horarios-contenedor {
            max-width: 1050px;
            margin: 0 auto;
            width: 100%;
            box-sizing: border-box;
            overflow-x: hidden;
          }

          .gestion-horarios-cabecera {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 1rem;
            margin-bottom: 1.5rem;
            width: 100%;
            box-sizing: border-box;
          }

          .gestion-horarios-barra-acciones {
            display: flex;
            gap: 0.75rem;
            align-items: center;
            flex-wrap: wrap;
          }

          .gestion-horarios-filtro-medico {
            width: 260px;
          }

          .badge-dia-semana {
            display: inline-flex;
            align-items: center;
            background: #E2F5F8;
            color: #0A6C84;
            border: 1px solid #BDE5ED;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 0.85rem;
            font-weight: 700;
          }

          /* Banner de Advertencia Informativa RN11 */
          .banner-advertencia-horario {
            background: #FFFBEB;
            border: 1.5px solid #0EA5E9;
            border-left: 6px solid #0A6C84;
            border-radius: 8px;
            padding: 1rem 1.25rem;
            margin-bottom: 1.25rem;
            width: 100%;
            box-sizing: border-box;
            overflow-x: hidden;
            display: flex;
            flex-direction: column;
            gap: 1rem;
            box-shadow: 0 2px 8px rgba(10, 108, 132, 0.08);
          }

          .banner-advertencia-contenido {
            display: flex;
            align-items: flex-start;
            gap: 0.85rem;
          }

          .banner-advertencia-icono {
            flex-shrink: 0;
            background: #FEF3C7;
            padding: 6px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .banner-advertencia-textos {
            flex: 1;
            min-width: 0;
            word-break: break-word;
          }

          .banner-advertencia-acciones {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            justify-content: flex-end;
            flex-wrap: wrap;
          }

          @media (max-width: 640px) {
            .gestion-horarios-cabecera {
              flex-direction: column;
              align-items: stretch;
              gap: 1rem;
              margin-bottom: 1.25rem;
            }

            .gestion-horarios-barra-acciones {
              flex-direction: column;
              align-items: stretch;
              width: 100%;
              gap: 0.75rem;
            }

            .gestion-horarios-filtro-medico {
              width: 100% !important;
            }

            .gestion-horarios-btn-nuevo {
              width: 100% !important;
              margin-bottom: 0 !important;
            }

            .banner-advertencia-horario {
              padding: 0.875rem;
              gap: 0.875rem;
            }

            .banner-advertencia-acciones {
              flex-direction: column;
              align-items: stretch;
              width: 100%;
              gap: 0.5rem;
            }

            .banner-advertencia-acciones a,
            .banner-advertencia-acciones button {
              width: 100% !important;
              box-sizing: border-box;
              text-align: center;
              justify-content: center;
              display: flex;
              align-items: center;
            }
          }
        `}</style>
      </div>
    </LayoutPrincipal>
  );
}
