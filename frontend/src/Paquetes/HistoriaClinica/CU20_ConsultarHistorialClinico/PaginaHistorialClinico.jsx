import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../../compartido/utilidades/api';
import LayoutPrincipal from '../../../compartido/layouts/LayoutPrincipal';
import Alerta from '../../../compartido/componentes/Alerta';
import TablaExpandible from '../../../comun/componentes/TablaExpandible';
import ModalResultadosLab from '../CU19_RegistrarResultadosLaboratorio/ModalResultadosLab';

export default function PaginaHistorialClinico() {
  const { idPaciente } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const usuario = JSON.parse(localStorage.getItem('usuario_clinica') || '{}');
  const rol = (usuario.rol || '').toLowerCase();
  const esPersonalClinico = ['medico', 'administrador', 'recepcionista'].includes(rol);
  const esMedicoOAdmin = ['medico', 'administrador'].includes(rol);

  // Si es paciente, la RN19 del backend forzará su propio perfil
  const idTarget = idPaciente || (rol === 'paciente' ? usuario.id_paciente : null);

  const esRutaLab = location?.pathname?.includes('laboratorio');
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [alerta, setAlerta] = useState(null);
  const [pestañaActiva, setPestañaActiva] = useState(esRutaLab ? 'laboratorios' : 'atenciones'); // 'atenciones' | 'laboratorios' | 'citas'
  const [modalLabAbierto, setModalLabAbierto] = useState(false);

  const cargarHistorial = async (id = idTarget) => {
    const idFinal = id || idTarget;
    if (!idFinal || idFinal === '0' || idFinal === 0 || idFinal === 'undefined' || idFinal === 'null') {
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      setAlerta(null);
      const res = await api.get(`/historia-clinica/pacientes/${idFinal}`);
      setDatos(res.data?.datos || null);
    } catch (err) {
      setAlerta({
        tipo: 'error',
        mensaje: err.response?.data?.mensaje || 'No fue posible cargar el expediente clínico electrónico.',
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    // Guarda de seguridad estricta: Si no hay idPaciente o es '0', abortar la carga inmediatamente
    if (!idPaciente || idPaciente === '0' || idPaciente === 'undefined') {
      if (rol === 'paciente' && usuario.id_paciente) {
        cargarHistorial(usuario.id_paciente);
        return;
      }
      setCargando(false);
      setAlerta({
        tipo: 'advertencia',
        mensaje: 'Debe seleccionar un paciente desde el Kardex o la Agenda médica para consultar su expediente clínico.',
      });
      return;
    }

    cargarHistorial(idPaciente);
  }, [idPaciente]);

  const volverAtras = () => {
    if (rol === 'medico') {
      navigate('/medico/pacientes');
    } else if (rol === 'paciente') {
      navigate('/paciente/mis-citas');
    } else {
      navigate('/pacientes');
    }
  };

  if (cargando) {
    return (
      <LayoutPrincipal titulo="Expediente Clínico">
        <div className="historial-cargando">
          <div className="spinner-clinico" />
          <p className="texto-cargando">Cargando expediente clínico electrónico del paciente…</p>
        </div>
        <style>{`
          .historial-cargando {
            text-align: center;
            padding: 4rem 1rem;
            color: var(--texto-sec, #64748b);
          }
          .spinner-clinico {
            width: 42px;
            height: 42px;
            border: 4px solid #e2e8f0;
            border-top: 4px solid var(--verde-azulado, #0f766e);
            border-radius: 50%;
            animation: girar 0.9s linear infinite;
            margin: 0 auto 1rem auto;
          }
          @keyframes girar {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </LayoutPrincipal>
    );
  }

  if (!datos || !datos.paciente) {
    return (
      <LayoutPrincipal titulo="Expediente Clínico">
        <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
          <Alerta
            tipo={alerta?.tipo || 'advertencia'}
            mensaje={alerta?.mensaje || 'No se encontró la información del expediente clínico solicitado.'}
          />
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <button
              type="button"
              className="boton-primario"
              onClick={volverAtras}
              style={{ minHeight: '44px' }}
            >
              ← {rol === 'medico' ? 'Ir al Kardex de Pacientes' : 'Volver al Módulo Principal'}
            </button>
          </div>
        </div>
      </LayoutPrincipal>
    );
  }

  const {
    paciente,
    informacion_medica = {},
    contactos_emergencia = [],
    atenciones = [],
    resultados_laboratorio = [],
    citas = [],
  } = datos;

  const nombreCompleto = paciente.nombre_completo || `${paciente.nombres} ${paciente.apellidos}`;

  // Columnas para el historial de citas usando TablaExpandible
  const columnasCitas = [
    'Código de Cita',
    'Especialidad Médica',
    'Profesional Asignado',
    'Fecha y Horario',
    'Estado',
    '',
  ];

  const badgeEstadoCita = (estado) => {
    const norm = (estado || '').toLowerCase();
    if (norm === 'atendida') return <span className="badge-cita-atendida">Concluida</span>;
    if (norm === 'programada' || norm === 'confirmada') return <span className="badge-cita-programada">Programada</span>;
    if (norm === 'en_espera' || norm === 'en sala') return <span className="badge-cita-espera">En Sala</span>;
    if (norm === 'postergada') return <span className="badge-cita-postergada">Por Reubicar</span>;
    if (norm === 'cancelada') return <span className="badge-cita-cancelada">Cancelada</span>;
    return <span className="badge-cita-default">{estado || 'Registrada'}</span>;
  };

  return (
    <LayoutPrincipal titulo={`Expediente: ${nombreCompleto}`}>
      <div className="expediente-contenedor">
        {alerta && (
          <div className="alerta-contenedor-expediente">
            <Alerta
              tipo={alerta.tipo}
              mensaje={alerta.mensaje}
              onCerrar={() => setAlerta(null)}
            />
          </div>
        )}

        {/* Barra superior de navegación y acciones */}
        <div className="barra-navegacion-expediente">
          <button
            type="button"
            className="boton-volver-expediente"
            onClick={volverAtras}
            aria-label="Volver a la vista anterior"
          >
            ← {rol === 'medico' ? 'Volver al Kardex' : rol === 'paciente' ? 'Volver a Mis Citas' : 'Volver a Pacientes'}
          </button>

          {esMedicoOAdmin && (
            <button
              type="button"
              className="boton-accion-lab"
              onClick={() => setModalLabAbierto(true)}
            >
              🔬 + Registrar Examen de Laboratorio
            </button>
          )}
        </div>

        {/* Ficha demográfica y civil del paciente */}
        <div className="tarjeta-ficha-paciente">
          <div className="cabecera-ficha">
            <div className="info-principal-paciente">
              <span className="etiqueta-codigo-historia">
                EXPEDIENTE: {paciente.codigo_historia || `EXP-${paciente.id_paciente}`}
              </span>
              <h1 className="nombre-paciente-destacado">
                {paciente.apellidos}, <span>{paciente.nombres}</span>
              </h1>
              <div className="chips-resumen-demografico">
                <span className="chip-demo">
                  <strong>CI:</strong> {paciente.ci || '—'}
                </span>
                <span className="chip-demo">
                  <strong>Edad:</strong> {paciente.edad ? `${paciente.edad} años` : '—'}
                </span>
                <span className="chip-demo">
                  <strong>Nacimiento:</strong> {paciente.fecha_nacimiento || '—'}
                </span>
                <span className="chip-demo">
                  <strong>Sexo:</strong> {paciente.sexo === 'M' ? 'Masculino' : paciente.sexo === 'F' ? 'Femenino' : '—'}
                </span>
                <span className="chip-demo chip-sangre">
                  <strong>Grupo Sanguíneo:</strong> {paciente.grupo_sanguineo || 'No declarado'}
                </span>
              </div>
            </div>

            <div className="datos-contacto-paciente">
              <div className="fila-contacto">
                <span className="contacto-icono">📞</span>
                <span className="contacto-texto">{paciente.telefono || 'Sin teléfono registrado'}</span>
              </div>
              <div className="fila-contacto">
                <span className="contacto-icono">✉️</span>
                <span className="contacto-texto">{paciente.correo || 'Sin correo registrado'}</span>
              </div>
              {paciente.direccion && (
                <div className="fila-contacto">
                  <span className="contacto-icono">📍</span>
                  <span className="contacto-texto">{paciente.direccion}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panel de Alertas Médicas y Antecedentes Críticos */}
        <div className="panel-alertas-clinicas">
          {/* Alergias */}
          <div className={`tarjeta-alerta-medica ${informacion_medica?.alergias ? 'alerta-con-riesgo' : 'alerta-neutra'}`}>
            <div className="alerta-cabecera">
              <span className="alerta-icono">{informacion_medica?.alergias ? '⚠️' : '🛡️'}</span>
              <h3 className="alerta-titulo">Alergias y Reacciones Adversas</h3>
            </div>
            <p className="alerta-cuerpo">
              {informacion_medica?.alergias || 'El paciente no registra alergias a medicamentos o alimentos.'}
            </p>
          </div>

          {/* Enfermedades Crónicas y Medicación Habitual */}
          <div className="tarjeta-alerta-medica tarjeta-cronica">
            <div className="alerta-cabecera">
              <span className="alerta-icono">🩺</span>
              <h3 className="alerta-titulo">Condiciones Crónicas y Tratamiento</h3>
            </div>
            <p className="alerta-cuerpo">
              {informacion_medica?.enfermedades_cronicas || 'Sin patologías crónicas registradas.'}
            </p>
            {informacion_medica?.medicamentos_actuales && (
              <div className="alerta-subbloque">
                <strong>Uso continuo:</strong> {informacion_medica.medicamentos_actuales}
              </div>
            )}
          </div>

          {/* Contacto de Emergencia */}
          {contactos_emergencia && contactos_emergencia.length > 0 && (
            <div className="tarjeta-alerta-medica tarjeta-emergencia">
              <div className="alerta-cabecera">
                <span className="alerta-icono">🚨</span>
                <h3 className="alerta-titulo">Contacto de Emergencia</h3>
              </div>
              <p className="alerta-cuerpo">
                <strong>{contactos_emergencia[0].nombre_completo}</strong>
                <span className="relacion-emergencia"> ({contactos_emergencia[0].relacion})</span>
              </p>
              <div className="alerta-subbloque">
                <strong>Teléfono directo:</strong> {contactos_emergencia[0].telefono}
              </div>
            </div>
          )}
        </div>

        {/* Selector de Pestañas Principales */}
        <div className="pestanas-historial-nav" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={pestañaActiva === 'atenciones'}
            className={`boton-pestana ${pestañaActiva === 'atenciones' ? 'pestana-activa' : ''}`}
            onClick={() => setPestañaActiva('atenciones')}
          >
            📋 Atenciones y Consultas Médicas ({atenciones.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={pestañaActiva === 'laboratorios'}
            className={`boton-pestana ${pestañaActiva === 'laboratorios' ? 'pestana-activa' : ''}`}
            onClick={() => setPestañaActiva('laboratorios')}
          >
            🔬 Estudios de Laboratorio ({resultados_laboratorio.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={pestañaActiva === 'citas'}
            className={`boton-pestana ${pestañaActiva === 'citas' ? 'pestana-activa' : ''}`}
            onClick={() => setPestañaActiva('citas')}
          >
            📅 Historial de Citas Médicas ({citas.length})
          </button>
        </div>

        {/* PESTAÑA 1: ATENCIONES CLÍNICAS */}
        {pestañaActiva === 'atenciones' && (
          <section className="seccion-pestana-contenido">
            {atenciones.length === 0 ? (
              <div className="estado-vacio-historial">
                <div className="icono-vacio">🩺</div>
                <h3>Sin consultas concluidas</h3>
                <p>El paciente aún no cuenta con atenciones médicas finalizadas en el sistema.</p>
              </div>
            ) : (
              <div className="linea-tiempo-atenciones">
                {atenciones.map((atencion) => (
                  <article key={atencion.id_atencion} className="tarjeta-atencion-clinica">
                    {/* Encabezado de la atención */}
                    <div className="cabecera-atencion">
                      <div>
                        <div className="fila-especialidad-medico">
                          <span className="badge-especialidad">{atencion.especialidad_nombre}</span>
                          <span className="medico-atencion">{atencion.medico_nombre_completo}</span>
                        </div>
                        <span className="codigo-cita-atencion">
                          Cita: <strong>{atencion.codigo_cita}</strong>
                        </span>
                      </div>
                      <div className="fecha-atencion-badge">
                        📅 {new Date(atencion.fecha_atencion).toLocaleDateString('es-ES', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                    </div>

                    {/* Contenido clínico */}
                    <div className="cuerpo-atencion">
                      <div className="bloque-clinico">
                        <span className="etiqueta-clinica">Motivo de Consulta / Anamnesis:</span>
                        <p className="texto-clinico">{atencion.motivo_atencion}</p>
                      </div>

                      {atencion.examen_fisico && (
                        <div className="bloque-clinico">
                          <span className="etiqueta-clinica">Examen Físico y Hallazgos Clínicos:</span>
                          <p className="texto-clinico">{atencion.examen_fisico}</p>
                        </div>
                      )}

                      <div className="bloque-clinico">
                        <span className="etiqueta-clinica">Diagnóstico Principal (CIE-10 / Juicio Clínico):</span>
                        <div className="diagnostico-destacado">
                          <strong>{atencion.diagnostico}</strong>
                        </div>
                      </div>

                      <div className="bloque-clinico">
                        <span className="etiqueta-clinica">Plan de Tratamiento e Indicaciones:</span>
                        <p className="texto-clinico">{atencion.tratamiento_indicaciones}</p>
                      </div>

                      {atencion.receta_medica && (
                        <div className="bloque-receta-medica">
                          <div className="receta-cabecera">
                            <span>💊 Prescripción y Receta Médica</span>
                          </div>
                          <div className="receta-cuerpo">
                            {atencion.receta_medica}
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* PESTAÑA 2: RESULTADOS DE LABORATORIO */}
        {pestañaActiva === 'laboratorios' && (
          <section className="seccion-pestana-contenido">
            <div className="barra-superior-lab">
              <h2 className="titulo-seccion-lab">
                Exámenes y Estudios Diagnósticos Registrados
              </h2>
              {esMedicoOAdmin && (
                <button
                  type="button"
                  className="boton-primario btn-anadir-lab"
                  onClick={() => setModalLabAbierto(true)}
                >
                  + Cargar Nuevo Estudio
                </button>
              )}
            </div>

            {resultados_laboratorio.length === 0 ? (
              <div className="estado-vacio-historial">
                <div className="icono-vacio">🔬</div>
                <h3>Sin estudios de laboratorio</h3>
                <p>No se han registrado resultados o exámenes de laboratorio para este paciente.</p>
                {esMedicoOAdmin && (
                  <button
                    type="button"
                    className="boton-secundario"
                    onClick={() => setModalLabAbierto(true)}
                    style={{ minHeight: '44px', marginTop: '1rem' }}
                  >
                    Registrar el Primer Estudio
                  </button>
                )}
              </div>
            ) : (
              <div className="grilla-estudios-laboratorio">
                {resultados_laboratorio.map((lab) => (
                  <div key={lab.id_resultado} className="tarjeta-estudio-lab">
                    <div className="lab-card-top">
                      <div className="lab-tipo-contenedor">
                        <span className="lab-icono">🧪</span>
                        <h3 className="lab-tipo-titulo">{lab.tipo_estudio}</h3>
                      </div>
                      <span className="lab-fecha">
                        Fecha: <strong>{lab.fecha_estudio}</strong>
                      </span>
                    </div>

                    <div className="lab-card-cuerpo">
                      <span className="lab-descripcion-etiqueta">Hallazgos y Métricas Reportadas:</span>
                      <p className="lab-descripcion-texto">{lab.descripcion}</p>
                    </div>

                    {lab.archivo_adjunto && (
                      <div className="lab-card-adjunto">
                        <span className="adjunto-icono">📎</span>
                        <span className="adjunto-nombre">
                          Referencia / Documento: <strong>{lab.archivo_adjunto}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* PESTAÑA 3: HISTORIAL DE CITAS MÉDICAS */}
        {pestañaActiva === 'citas' && (
          <section className="seccion-pestana-contenido">
            <h2 className="titulo-seccion-citas">
              Historial Cronológico de Turnos y Citas
            </h2>

            <TablaExpandible
              columnas={columnasCitas}
              datos={citas}
              obtenerClaveFila={(c) => c.id_cita}
              mensajeVacio="El paciente no registra turnos o citas médicas agendadas en la clínica."
              renderFilaPrincipal={(item, isExpanded) => (
                <>
                  <td>
                    <span className="codigo-cita-tabla">{item.codigo_cita}</span>
                  </td>
                  <td>
                    <strong className="especialidad-tabla">{item.especialidad_nombre}</strong>
                  </td>
                  <td>
                    <span className="medico-tabla">{item.medico_nombre_completo}</span>
                  </td>
                  <td>
                    <div className="fecha-hora-tabla">
                      <span>{item.fecha_cita}</span>
                      <small>{item.hora_inicio} - {item.hora_fin}</small>
                    </div>
                  </td>
                  <td>
                    {badgeEstadoCita(item.estado_nombre || item.estado_codigo)}
                  </td>
                  <td className="col-flecha">
                    <span className={`flecha-desplegar ${isExpanded ? 'rotada' : ''}`}>▼</span>
                  </td>
                </>
              )}
              renderFilaMovil={(item, isExpanded) => (
                <div className="tarjeta-cita-movil">
                  <div className="cita-movil-top">
                    <span className="codigo-cita-tabla">{item.codigo_cita}</span>
                    {badgeEstadoCita(item.estado_nombre || item.estado_codigo)}
                    <span className={`flecha-desplegar ${isExpanded ? 'rotada' : ''}`}>▼</span>
                  </div>
                  <div className="cita-movil-mid">
                    <strong className="especialidad-tabla">{item.especialidad_nombre}</strong>
                    <span className="medico-tabla">{item.medico_nombre_completo}</span>
                  </div>
                  <div className="cita-movil-bot">
                    <span>📅 {item.fecha_cita} ({item.hora_inicio} - {item.hora_fin})</span>
                  </div>
                </div>
              )}
              renderDetalle={(item) => (
                <div className="subpanel-detalle-cita">
                  <div className="grid-detalle-cita">
                    <div>
                      <span className="etiqueta-subdetalle">Motivo declarado en la reserva:</span>
                      <p className="valor-subdetalle">{item.motivo_consulta || 'Sin motivo especificado al agendar.'}</p>
                    </div>
                    <div>
                      <span className="etiqueta-subdetalle">Identificador de Turno:</span>
                      <span className="valor-subdetalle">Turno Nro. #{item.id_cita}</span>
                    </div>
                  </div>
                </div>
              )}
            />
          </section>
        )}

        {/* Modal de Carga de Laboratorios */}
        <ModalResultadosLab
          abierto={modalLabAbierto}
          onCerrar={() => setModalLabAbierto(false)}
          idPaciente={paciente.id_paciente}
          nombrePaciente={nombreCompleto}
          alRegistrarExitoso={() => {
            setAlerta({
              tipo: 'exito',
              mensaje: 'Estudio de laboratorio incorporado exitosamente al expediente.',
            });
            cargarHistorial();
          }}
        />
      </div>

      <style>{`
        .expediente-contenedor {
          max-width: 1040px;
          margin: 0 auto;
          padding: 0.5rem 0.5rem 3rem 0.5rem;
        }

        .alerta-contenedor-expediente {
          margin-bottom: 1.25rem;
        }

        .barra-navegacion-expediente {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }

        .boton-volver-expediente {
          background: #ffffff;
          border: 1px solid var(--borde, #cbd5e1);
          color: var(--verde-azulado, #0f766e);
          padding: 0.6rem 1.25rem;
          border-radius: 8px;
          font-size: 0.925rem;
          font-weight: 600;
          cursor: pointer;
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          transition: all 0.15s ease;
        }

        .boton-volver-expediente:hover {
          background: #f8fafc;
          border-color: var(--verde-azulado, #0f766e);
        }

        .boton-accion-lab {
          background: var(--verde-azulado, #0f766e);
          color: #ffffff;
          border: none;
          padding: 0.6rem 1.25rem;
          border-radius: 8px;
          font-size: 0.925rem;
          font-weight: 600;
          cursor: pointer;
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          transition: background-color 0.15s ease, transform 0.1s ease;
        }

        .boton-accion-lab:hover {
          background: var(--verde-azulado-hover, #115e59);
        }

        /* Ficha del Paciente */
        .tarjeta-ficha-paciente {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid var(--borde, #e2e8f0);
          border-left: 6px solid var(--verde-azulado, #0f766e);
          padding: 1.5rem;
          margin-bottom: 1.25rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        .cabecera-ficha {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 1.5rem;
        }

        .etiqueta-codigo-historia {
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.75px;
          color: var(--turquesa, #0d9488);
          display: inline-block;
          margin-bottom: 0.25rem;
        }

        .nombre-paciente-destacado {
          font-size: 1.65rem;
          color: #1e293b;
          margin: 0 0 0.75rem 0;
          line-height: 1.2;
        }

        .nombre-paciente-destacado span {
          font-weight: 400;
        }

        .chips-resumen-demografico {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .chip-demo {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 0.35rem 0.65rem;
          font-size: 0.85rem;
          color: #334155;
        }

        .chip-sangre {
          background: #fff7ed;
          border-color: #ffedd5;
          color: #9a3412;
        }

        .datos-contacto-paciente {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          background: #f8fafc;
          padding: 1rem 1.25rem;
          border-radius: 8px;
          border: 1px solid #f1f5f9;
          min-width: 260px;
        }

        .fila-contacto {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #475569;
        }

        .contacto-icono {
          font-size: 1rem;
        }

        /* Panel de Alertas Clínicas */
        .panel-alertas-clinicas {
          display: grid;
          grid-templateColumns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .tarjeta-alerta-medica {
          background: #ffffff;
          border-radius: 10px;
          padding: 1.15rem 1.25rem;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }

        .alerta-con-riesgo {
          background: #fffbeb;
          border-color: #fde68a;
          border-left: 5px solid #d97706;
        }

        .alerta-neutra {
          background: #f8fafc;
          border-left: 5px solid #94a3b8;
        }

        .tarjeta-cronica {
          background: #f0fdfa;
          border-color: #ccfbf1;
          border-left: 5px solid var(--verde-azulado, #0f766e);
        }

        .tarjeta-emergencia {
          background: #fdf4ff;
          border-color: #f5d0fe;
          border-left: 5px solid #a855f7;
        }

        .alerta-cabecera {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .alerta-titulo {
          font-size: 0.95rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .alerta-cuerpo {
          font-size: 0.885rem;
          color: #334155;
          margin: 0;
          line-height: 1.45;
        }

        .alerta-subbloque {
          margin-top: 0.5rem;
          font-size: 0.825rem;
          color: #475569;
        }

        .relacion-emergencia {
          color: #64748b;
          font-weight: 400;
        }

        /* Pestañas */
        .pestanas-historial-nav {
          display: flex;
          gap: 0.5rem;
          border-bottom: 2px solid #e2e8f0;
          margin-bottom: 1.5rem;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .pestanas-historial-nav::-webkit-scrollbar {
          display: none;
        }

        .boton-pestana {
          background: none;
          border: none;
          padding: 0.85rem 1.25rem;
          font-size: 0.95rem;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          margin-bottom: -2px;
          white-space: nowrap;
          transition: all 0.15s ease;
          min-height: 44px;
        }

        .boton-pestana:hover {
          color: var(--verde-azulado, #0f766e);
        }

        .pestana-activa {
          color: var(--verde-azulado, #0f766e);
          border-bottom-color: var(--verde-azulado, #0f766e);
        }

        /* Contenido de Atenciones */
        .linea-tiempo-atenciones {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .tarjeta-atencion-clinica {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          border-left: 5px solid var(--turquesa, #0d9488);
          padding: 1.35rem 1.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        .cabecera-atencion {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 0.75rem;
          padding-bottom: 0.85rem;
          border-bottom: 1px solid #f1f5f9;
          margin-bottom: 1rem;
        }

        .fila-especialidad-medico {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .badge-especialidad {
          background: #f0fdfa;
          color: var(--verde-azulado, #0f766e);
          border: 1px solid #ccfbf1;
          font-weight: 700;
          font-size: 0.85rem;
          padding: 0.2rem 0.6rem;
          border-radius: 6px;
        }

        .medico-atencion {
          font-size: 0.95rem;
          font-weight: 600;
          color: #1e293b;
        }

        .codigo-cita-atencion {
          display: block;
          font-size: 0.8rem;
          color: #64748b;
          margin-top: 0.25rem;
        }

        .fecha-atencion-badge {
          font-size: 0.85rem;
          font-weight: 600;
          color: #475569;
          background: #f8fafc;
          padding: 0.35rem 0.75rem;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }

        .cuerpo-atencion {
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
        }

        .bloque-clinico {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .etiqueta-clinica {
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          color: #64748b;
        }

        .texto-clinico {
          font-size: 0.925rem;
          color: #1e293b;
          margin: 0;
          line-height: 1.5;
        }

        .diagnostico-destacado {
          background: #f8fafc;
          border-left: 4px solid var(--verde-azulado, #0f766e);
          padding: 0.5rem 0.75rem;
          border-radius: 4px;
          font-size: 0.95rem;
          color: #0f172a;
        }

        .bloque-receta-medica {
          background: #fafaf9;
          border: 1px dashed #d6d3d1;
          border-radius: 8px;
          padding: 1rem;
          margin-top: 0.5rem;
        }

        .receta-cabecera {
          font-size: 0.85rem;
          font-weight: 700;
          color: #44403c;
          margin-bottom: 0.5rem;
        }

        .receta-cuerpo {
          font-size: 0.9rem;
          color: #292524;
          white-space: pre-wrap;
          line-height: 1.5;
          font-family: inherit;
        }

        /* Contenido de Laboratorios */
        .barra-superior-lab {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }

        .titulo-seccion-lab, .titulo-seccion-citas {
          font-size: 1.15rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .btn-anadir-lab {
          min-height: 44px;
          padding: 0.6rem 1.25rem;
          font-size: 0.9rem;
        }

        .grilla-estudios-laboratorio {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .tarjeta-estudio-lab {
          background: #ffffff;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          padding: 1.25rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }

        .lab-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
          padding-bottom: 0.65rem;
          border-bottom: 1px solid #f1f5f9;
          margin-bottom: 0.75rem;
        }

        .lab-tipo-contenedor {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .lab-icono {
          font-size: 1.15rem;
        }

        .lab-tipo-titulo {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--verde-azulado, #0f766e);
          margin: 0;
        }

        .lab-fecha {
          font-size: 0.85rem;
          color: #64748b;
        }

        .lab-descripcion-etiqueta {
          display: block;
          font-size: 0.785rem;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
          margin-bottom: 0.25rem;
        }

        .lab-descripcion-texto {
          font-size: 0.925rem;
          color: #1e293b;
          margin: 0;
          white-space: pre-wrap;
          line-height: 1.5;
        }

        .lab-card-adjunto {
          margin-top: 0.75rem;
          padding-top: 0.65rem;
          border-top: 1px dashed #e2e8f0;
          font-size: 0.85rem;
          color: #475569;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        /* Tabla de Citas */
        .codigo-cita-tabla {
          font-family: monospace;
          font-weight: 700;
          color: var(--verde-azulado, #0f766e);
          font-size: 0.9rem;
        }

        .especialidad-tabla {
          color: #1e293b;
        }

        .medico-tabla {
          color: #475569;
          font-size: 0.9rem;
        }

        .fecha-hora-tabla {
          display: flex;
          flex-direction: column;
          font-size: 0.875rem;
        }

        .fecha-hora-tabla small {
          color: #64748b;
        }

        /* Badges de Citas */
        .badge-cita-atendida {
          background: #dcfce7;
          color: #166534;
          font-weight: 700;
          font-size: 0.8rem;
          padding: 0.25rem 0.6rem;
          border-radius: 9999px;
        }

        .badge-cita-programada {
          background: #e0f2fe;
          color: #0369a1;
          font-weight: 700;
          font-size: 0.8rem;
          padding: 0.25rem 0.6rem;
          border-radius: 9999px;
        }

        .badge-cita-espera {
          background: #fef9c3;
          color: #854d0e;
          font-weight: 700;
          font-size: 0.8rem;
          padding: 0.25rem 0.6rem;
          border-radius: 9999px;
        }

        .badge-cita-postergada {
          background: #ffedd5;
          color: #c2410c;
          font-weight: 700;
          font-size: 0.8rem;
          padding: 0.25rem 0.6rem;
          border-radius: 9999px;
        }

        .badge-cita-cancelada {
          background: #fee2e2;
          color: #991b1b;
          font-weight: 700;
          font-size: 0.8rem;
          padding: 0.25rem 0.6rem;
          border-radius: 9999px;
        }

        .badge-cita-default {
          background: #f1f5f9;
          color: #475569;
          font-weight: 700;
          font-size: 0.8rem;
          padding: 0.25rem 0.6rem;
          border-radius: 9999px;
        }

        /* Fila Móvil Citas */
        .tarjeta-cita-movil {
          padding: 0.85rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .cita-movil-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .cita-movil-mid {
          display: flex;
          flex-direction: column;
        }

        .cita-movil-bot {
          font-size: 0.825rem;
          color: #64748b;
        }

        /* Subpanel Detalle Cita */
        .subpanel-detalle-cita {
          padding: 1rem 1.25rem;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
        }

        .grid-detalle-cita {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1rem;
        }

        .etiqueta-subdetalle {
          display: block;
          font-size: 0.775rem;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
          margin-bottom: 0.25rem;
        }

        .valor-subdetalle {
          font-size: 0.9rem;
          color: #1e293b;
          margin: 0;
        }

        /* Estados Vacíos */
        .estado-vacio-historial {
          text-align: center;
          padding: 3rem 1.5rem;
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          color: #64748b;
        }

        .icono-vacio {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }

        .estado-vacio-historial h3 {
          font-size: 1.15rem;
          color: #1e293b;
          margin: 0 0 0.5rem 0;
        }

        .estado-vacio-historial p {
          font-size: 0.925rem;
          margin: 0;
        }

        @media (max-width: 640px) {
          .cabecera-ficha {
            flex-direction: column;
          }
          .datos-contacto-paciente {
            width: 100%;
          }
          .barra-navegacion-expediente {
            flex-direction: column;
            align-items: stretch;
          }
          .boton-volver-expediente, .boton-accion-lab {
            width: 100%;
            justify-content: center;
          }
          .cabecera-atencion {
            flex-direction: column;
          }
          .fecha-atencion-badge {
            align-self: flex-start;
          }
          .barra-superior-lab {
            flex-direction: column;
            align-items: stretch;
          }
          .btn-anadir-lab {
            width: 100%;
          }
        }
      `}</style>
    </LayoutPrincipal>
  );
}
