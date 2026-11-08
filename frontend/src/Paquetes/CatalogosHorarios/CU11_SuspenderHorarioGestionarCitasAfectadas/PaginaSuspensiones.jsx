import React, { useState, useEffect } from 'react';
import api from '../../../compartido/utilidades/api';
import LayoutPrincipal from '../../../compartido/layouts/LayoutPrincipal';
import TablaExpandible from '../../../comun/componentes/TablaExpandible';
import Alerta from '../../../compartido/componentes/Alerta';
import ModalNuevaSuspension from './ModalNuevaSuspension';
import ModalReubicarCita from './ModalReubicarCita';

export default function PaginaSuspensiones() {
  const [pestañaActiva, setPestañaActiva] = useState('postergadas'); // 'postergadas' | 'suspensiones'
  const [citasPostergadas, setCitasPostergadas] = useState([]);
  const [suspensiones, setSuspensiones] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [alerta, setAlerta] = useState(null);

  // Estados de modales
  const [modalSuspensionAbierto, setModalSuspensionAbierto] = useState(false);
  const [guardandoSuspension, setGuardandoSuspension] = useState(false);

  const [modalReubicarAbierto, setModalReubicarAbierto] = useState(false);
  const [citaParaReubicar, setCitaParaReubicar] = useState(null);
  const [guardandoReubicacion, setGuardandoReubicacion] = useState(false);

  const cargarDatos = () => {
    setCargando(true);
    Promise.all([
      api.get('/catalogos/suspensiones/citas-postergadas'),
      api.get('/catalogos/suspensiones'),
      api.get('/catalogos/medicos-publicos'),
    ])
      .then(([resPost, resSusp, resMed]) => {
        setCitasPostergadas(resPost.data?.datos || []);
        setSuspensiones(resSusp.data?.datos || []);
        setMedicos(resMed.data?.datos || []);
      })
      .catch((err) => {
        setAlerta({
          tipo: 'error',
          mensaje: err.response?.data?.mensaje || 'Error al cargar los registros de suspensiones y citas.',
        });
      })
      .finally(() => {
        setCargando(false);
      });
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Registrar nueva suspensión de horario
  const handleGuardarSuspension = async (payload, setErrores) => {
    setGuardandoSuspension(true);
    setAlerta(null);
    try {
      const res = await api.post('/catalogos/suspensiones', payload);
      setAlerta({
        tipo: 'exito',
        mensaje: res.data?.mensaje || 'Suspensión registrada y pacientes notificados con éxito.',
      });
      setModalSuspensionAbierto(false);
      cargarDatos();
      setPestañaActiva('postergadas');
    } catch (err) {
      if (err.response?.status === 422 && err.response.data?.errores) {
        setErrores(err.response.data.errores);
      } else {
        setErrores({ general: err.response?.data?.mensaje || 'Error al procesar la suspensión médica.' });
      }
    } finally {
      setGuardandoSuspension(false);
    }
  };

  // Abrir modal de reubicación
  const abrirModalReubicar = (cita) => {
    setCitaParaReubicar(cita);
    setModalReubicarAbierto(true);
  };

  // Confirmar reubicación de cita postergada
  const handleConfirmarReubicacion = async (payload, setErrorLocal) => {
    setGuardandoReubicacion(true);
    setAlerta(null);
    try {
      const res = await api.post('/catalogos/suspensiones/reubicar-cita', payload);
      setAlerta({
        tipo: 'exito',
        mensaje: res.data?.mensaje || 'Cita reubicada con éxito y notificación emitida al paciente.',
      });
      setModalReubicarAbierto(false);
      setCitaParaReubicar(null);
      cargarDatos();
    } catch (err) {
      setErrorLocal(err.response?.data?.mensaje || 'Error al reubicar la cita médica.');
    } finally {
      setGuardandoReubicacion(false);
    }
  };

  // Levantar / Anular una suspensión médica
  const handleLevantarSuspension = async (idSuspension) => {
    if (!window.confirm('¿Está seguro de levantar esta suspensión médica? Los horarios del profesional volverán a estar habilitados para agendamiento.')) {
      return;
    }
    try {
      const res = await api.delete(`/catalogos/suspensiones/${idSuspension}`);
      setAlerta({
        tipo: 'exito',
        mensaje: res.data?.mensaje || 'Suspensión levantada exitosamente.',
      });
      cargarDatos();
    } catch (err) {
      setAlerta({
        tipo: 'error',
        mensaje: err.response?.data?.mensaje || 'Error al levantar la suspensión.',
      });
    }
  };

  // Columnas para TablaExpandible de Citas Postergadas
  const columnasCitas = [
    'Código Cita',
    'Paciente',
    'Médico / Especialidad',
    'Turno Original',
    'Prioridad',
    'Acción',
    '',
  ];

  // Columnas para TablaExpandible de Suspensiones
  const columnasSuspensiones = [
    'Médico',
    'Desde',
    'Hasta',
    'Motivo',
    'Acción',
    '',
  ];

  return (
    <LayoutPrincipal titulo="Gestión de Suspensiones y Reubicación de Citas">
      <div className="pagina-suspensiones-contenedor">
        {alerta && (
          <div className="mb-4">
            <Alerta
              tipo={alerta.tipo}
              mensaje={alerta.mensaje}
              onCerrar={() => setAlerta(null)}
            />
          </div>
        )}

        {/* Encabezado Superior con Acciones */}
        <div className="seccion-cabecera-suspensiones">
          <div className="cabecera-info">
            <h1 className="cabecera-titulo">Contingencias y Reubicación de Agenda</h1>
            <p className="cabecera-subtitulo">
              Administración de suspensiones médicas por emergencias o cirugías y reubicación prioritaria de turnos afectados.
            </p>
          </div>

          <button
            type="button"
            className="btn-nueva-suspension"
            onClick={() => setModalSuspensionAbierto(true)}
          >
            <span>➕</span> Registrar Suspensión de Horario
          </button>
        </div>

        {/* Pestañas de Navegación Segmentada */}
        <div className="navegacion-pestanas-suspensiones">
          <button
            type="button"
            className={`pestana-btn ${pestañaActiva === 'postergadas' ? 'pestana-activa' : ''}`}
            onClick={() => setPestañaActiva('postergadas')}
          >
            <span className="pestana-icono">🔄</span>
            Citas Postergadas Pendientes
            {citasPostergadas.length > 0 && (
              <span className="badge-conteo-pestana">{citasPostergadas.length}</span>
            )}
          </button>

          <button
            type="button"
            className={`pestana-btn ${pestañaActiva === 'suspensiones' ? 'pestana-activa' : ''}`}
            onClick={() => setPestañaActiva('suspensiones')}
          >
            <span className="pestana-icono">📋</span>
            Suspensiones Registradas
            {suspensiones.length > 0 && (
              <span className="badge-conteo-gris">{suspensiones.length}</span>
            )}
          </button>
        </div>

        {/* CONTENIDO PESTAÑA 1: CITAS POSTERGADAS */}
        {pestañaActiva === 'postergadas' && (
          <div className="panel-citas-postergadas">
            <div className="panel-info-banner">
              <span className="info-icono">ℹ️</span>
              <div className="info-texto">
                <strong>Ventana de Reubicación Prioritaria (48h):</strong> Las citas en esta lista corresponden a pacientes cuyos turnos fueron afectados por contingencias médicas. Al reubicar, el sistema preserva el código único de cita y notifica de inmediato al paciente.
              </div>
            </div>

            <TablaExpandible
              columnas={columnasCitas}
              datos={citasPostergadas}
              cargando={cargando}
              mensajeVacio="No existen citas postergadas pendientes de reubicación."
              obtenerClaveFila={(item) => item.id_cita}
              renderFilaPrincipal={(item, isExpanded, toggleExpand) => (
                <>
                  <td>
                    <strong className="badge-codigo-cita">{item.codigo_cita}</strong>
                  </td>
                  <td>
                    <div className="celda-paciente">
                      <span className="nombre-paciente">{item.paciente_nombre_completo}</span>
                      <span className="doc-paciente">CI: {item.paciente_ci}</span>
                    </div>
                  </td>
                  <td>
                    <div className="celda-medico">
                      <span className="nombre-medico">{item.medico_nombre_completo}</span>
                      <span className="nombre-especialidad">{item.especialidad_nombre}</span>
                    </div>
                  </td>
                  <td>
                    <div className="celda-fecha">
                      <span>{item.fecha_cita}</span>
                      <small>{item.hora_inicio} hrs</small>
                    </div>
                  </td>
                  <td>
                    <span className="badge-prioridad-alta">Prioridad 48h</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-accion-reubicar"
                      onClick={(e) => {
                        e.stopPropagation();
                        abrirModalReubicar(item);
                      }}
                    >
                      Reubicar
                    </button>
                  </td>
                  <td className="col-flecha">
                    <span className={`flecha-desplegar ${isExpanded ? 'rotada' : ''}`}>▼</span>
                  </td>
                </>
              )}
              renderFilaMovil={(item, isExpanded, toggleExpand) => (
                <div className="tarjeta-movil-cita">
                  <div className="tarjeta-movil-cabecera">
                    <strong className="badge-codigo-cita">{item.codigo_cita}</strong>
                    <span className="badge-prioridad-alta">Prioridad 48h</span>
                    <span className={`flecha-desplegar ${isExpanded ? 'rotada' : ''}`}>▼</span>
                  </div>
                  <div className="tarjeta-movil-cuerpo">
                    <div className="movil-linea-principal">
                      <strong>{item.paciente_nombre_completo}</strong>
                    </div>
                    <div className="movil-linea-secundaria">
                      <span>{item.especialidad_nombre} · {item.medico_nombre_completo}</span>
                    </div>
                    <div className="movil-linea-fecha">
                      Turno original: {item.fecha_cita} a las {item.hora_inicio}
                    </div>
                  </div>
                </div>
              )}
              renderDetalle={(item) => (
                <div className="subpanel-detalle-postergada">
                  <div className="grid-detalle-postergada">
                    <div>
                      <span className="detalle-etiqueta">Teléfono del Paciente:</span>
                      <strong className="detalle-valor">{item.paciente_telefono || 'No registrado'}</strong>
                    </div>
                    <div>
                      <span className="detalle-etiqueta">Canal de Notificación:</span>
                      <strong className="detalle-valor">
                        {item.tiene_cuenta ? '✅ Cuenta web activa (notificado)' : '📞 Sin cuenta web (requiere llamada)'}
                      </strong>
                    </div>
                    <div className="detalle-ancho-completo">
                      <span className="detalle-etiqueta">Observaciones y Causa:</span>
                      <p className="detalle-parrafo">{item.observaciones || 'Afectada por contingencia horaria.'}</p>
                    </div>
                  </div>

                  <div className="acciones-detalle-postergada">
                    <button
                      type="button"
                      className="btn-detalle-reubicar"
                      onClick={() => abrirModalReubicar(item)}
                    >
                      🔄 Reubicar Turno de Consulta Ahora
                    </button>
                  </div>
                </div>
              )}
            />
          </div>
        )}

        {/* CONTENIDO PESTAÑA 2: SUSPENSIONES REGISTRADAS */}
        {pestañaActiva === 'suspensiones' && (
          <div className="panel-suspensiones-activas">
            <TablaExpandible
              columnas={columnasSuspensiones}
              datos={suspensiones}
              cargando={cargando}
              mensajeVacio="No se han registrado suspensiones médicas."
              obtenerClaveFila={(item) => item.id_suspension}
              renderFilaPrincipal={(item, isExpanded, toggleExpand) => (
                <>
                  <td>
                    <div className="celda-medico">
                      <strong className="nombre-medico">{item.medico_nombre_completo}</strong>
                      <span className="doc-paciente">CI: {item.medico_ci}</span>
                    </div>
                  </td>
                  <td>
                    <span className="fecha-susp-texto">
                      {new Date(item.fecha_inicio).toLocaleDateString('es-BO', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </td>
                  <td>
                    <span className="fecha-susp-texto">
                      {new Date(item.fecha_fin).toLocaleDateString('es-BO', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </td>
                  <td>
                    <span className="motivo-susp-texto" title={item.motivo}>
                      {item.motivo}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-accion-levantar"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLevantarSuspension(item.id_suspension);
                      }}
                    >
                      Levantar
                    </button>
                  </td>
                  <td className="col-flecha">
                    <span className={`flecha-desplegar ${isExpanded ? 'rotada' : ''}`}>▼</span>
                  </td>
                </>
              )}
              renderFilaMovil={(item, isExpanded, toggleExpand) => (
                <div className="tarjeta-movil-susp">
                  <div className="tarjeta-movil-cabecera">
                    <strong>{item.medico_nombre_completo}</strong>
                    <span className={`flecha-desplegar ${isExpanded ? 'rotada' : ''}`}>▼</span>
                  </div>
                  <div className="tarjeta-movil-cuerpo">
                    <div className="movil-motivo">{item.motivo}</div>
                    <div className="movil-rango-fechas">
                      {new Date(item.fecha_inicio).toLocaleDateString('es-BO')} al{' '}
                      {new Date(item.fecha_fin).toLocaleDateString('es-BO')}
                    </div>
                  </div>
                </div>
              )}
              renderDetalle={(item) => (
                <div className="subpanel-detalle-suspension">
                  <p><strong>Motivo detallado:</strong> {item.motivo}</p>
                  <p><strong>Acción aplicada:</strong> Reprogramación y reubicación prioritaria de turnos</p>
                  <div className="mt-2">
                    <button
                      type="button"
                      className="btn-accion-levantar"
                      onClick={() => handleLevantarSuspension(item.id_suspension)}
                    >
                      Levantar Suspensión Médica
                    </button>
                  </div>
                </div>
              )}
            />
          </div>
        )}

        {/* Modales */}
        <ModalNuevaSuspension
          abierto={modalSuspensionAbierto}
          onCerrar={() => setModalSuspensionAbierto(false)}
          medicos={medicos}
          onGuardar={handleGuardarSuspension}
          guardando={guardandoSuspension}
        />

        <ModalReubicarCita
          abierto={modalReubicarAbierto}
          onCerrar={() => {
            setModalReubicarAbierto(false);
            setCitaParaReubicar(null);
          }}
          cita={citaParaReubicar}
          medicos={medicos}
          onConfirmar={handleConfirmarReubicacion}
          guardando={guardandoReubicacion}
        />
      </div>

      <style>{`
        .pagina-suspensiones-contenedor {
          padding: 1.5rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .seccion-cabecera-suspensiones {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .cabecera-titulo {
          margin: 0;
          font-size: 1.4rem;
          font-weight: 800;
          color: #12343B;
          letter-spacing: -0.01em;
        }

        .cabecera-subtitulo {
          margin: 0.35rem 0 0 0;
          font-size: 0.85rem;
          color: #5B7078;
        }

        .btn-nueva-suspension {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #0A6C84;
          color: #FFFFFF;
          font-size: 0.875rem;
          font-weight: 700;
          padding: 0.65rem 1.25rem;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-nueva-suspension:hover {
          background: #074F61;
        }

        .navegacion-pestanas-suspensiones {
          display: flex;
          gap: 0.5rem;
          border-bottom: 2px solid #E1ECEE;
          margin-bottom: 1.25rem;
        }

        .pestana-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          font-size: 0.875rem;
          font-weight: 600;
          color: #5B7078;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: -2px;
        }

        .pestana-btn:hover {
          color: #0A6C84;
        }

        .pestana-activa {
          color: #0A6C84;
          border-bottom-color: #0A6C84;
          font-weight: 700;
        }

        .badge-conteo-pestana {
          background: #E0A100;
          color: #FFFFFF;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 10px;
        }

        .badge-conteo-gris {
          background: #CAD8DC;
          color: #12343B;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 10px;
        }

        .panel-info-banner {
          display: flex;
          gap: 0.75rem;
          background: #FEF9E7;
          border: 1px solid #FAD7A0;
          border-radius: 10px;
          padding: 0.85rem 1.15rem;
          margin-bottom: 1.25rem;
          font-size: 0.82rem;
          color: #7D6608;
          line-height: 1.4;
        }

        .info-icono {
          font-size: 1.25rem;
        }

        .badge-codigo-cita {
          font-family: monospace;
          background: #EAF5F7;
          color: #0A6C84;
          padding: 3px 6px;
          border-radius: 6px;
          border: 1px solid #C4DCE0;
          font-size: 0.82rem;
        }

        .celda-paciente, .celda-medico, .celda-fecha {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .nombre-paciente, .nombre-medico {
          font-weight: 600;
          color: #12343B;
          font-size: 0.875rem;
        }

        .doc-paciente, .nombre-especialidad {
          font-size: 0.75rem;
          color: #5B7078;
        }

        .badge-prioridad-alta {
          display: inline-block;
          background: #E0A100;
          color: #FFFFFF;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 10px;
          white-space: nowrap;
        }

        .btn-accion-reubicar {
          background: #F28C1E;
          color: #FFFFFF;
          border: none;
          font-size: 0.8rem;
          font-weight: 700;
          padding: 0.4rem 0.85rem;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-accion-reubicar:hover {
          background: #C75F00;
        }

        .btn-accion-levantar {
          background: #FFFFFF;
          color: #D9534F;
          border: 1px solid #D9534F;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 0.35rem 0.75rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-accion-levantar:hover {
          background: #D9534F;
          color: #FFFFFF;
        }

        .subpanel-detalle-postergada, .subpanel-detalle-suspension {
          background: #F4FAFB;
          border-radius: 8px;
          padding: 1rem 1.25rem;
          margin: 0.5rem 0;
          border: 1px solid #E1ECEE;
        }

        .grid-detalle-postergada {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.85rem;
          margin-bottom: 0.85rem;
        }

        @media (max-width: 580px) {
          .grid-detalle-postergada {
            grid-template-columns: 1fr;
          }
        }

        .detalle-ancho-completo {
          grid-column: 1 / -1;
        }

        .detalle-etiqueta {
          display: block;
          font-size: 0.72rem;
          text-transform: uppercase;
          color: #5B7078;
          font-weight: 700;
          margin-bottom: 2px;
        }

        .detalle-valor {
          font-size: 0.875rem;
          color: #12343B;
        }

        .detalle-parrafo {
          margin: 0;
          font-size: 0.82rem;
          color: #12343B;
          background: #FFFFFF;
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          border: 1px solid #E1ECEE;
        }

        .acciones-detalle-postergada {
          display: flex;
          justify-content: flex-end;
          padding-top: 0.75rem;
          border-top: 1px dashed #C4DCE0;
        }

        .btn-detalle-reubicar {
          min-height: 44px;
          background: #F28C1E;
          color: #FFFFFF;
          font-weight: 700;
          font-size: 0.875rem;
          border: none;
          border-radius: 8px;
          padding: 0.5rem 1.25rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-detalle-reubicar:hover {
          background: #C75F00;
        }

        .fecha-susp-texto {
          font-size: 0.82rem;
          color: #12343B;
        }

        .motivo-susp-texto {
          font-size: 0.82rem;
          color: #5B7078;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .tarjeta-movil-cita, .tarjeta-movil-susp {
          padding: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .tarjeta-movil-cabecera {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .movil-linea-principal {
          font-size: 0.9rem;
          color: #12343B;
        }

        .movil-linea-secundaria, .movil-linea-fecha {
          font-size: 0.78rem;
          color: #5B7078;
        }
      `}</style>
    </LayoutPrincipal>
  );
}

