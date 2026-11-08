import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../compartido/utilidades/api';
import CampoTexto from '../../../compartido/componentes/CampoTexto';
import InsigniaEstado from '../../../compartido/componentes/InsigniaEstado';
import Alerta from '../../../compartido/componentes/Alerta';
import LayoutPrincipal from '../../../compartido/layouts/LayoutPrincipal';
import TablaExpandible from '../../../comun/componentes/TablaExpandible';

export default function PaginaMedicos() {
  const [medicos, setMedicos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [termino, setTermino] = useState('');
  const [cargando, setCargando] = useState(false);
  const [alerta, setAlerta] = useState(null);
  const [advertenciaDesactivacion, setAdvertenciaDesactivacion] = useState(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [medicoEditando, setMedicoEditando] = useState(null);
  const [formulario, setFormulario] = useState({
    ci: '',
    nombres: '',
    apellidos: '',
    correo: '',
    telefono: '',
    nro_matricula: '',
    biografia: '',
    especialidades: [],
  });
  const [errores, setErrores] = useState({});

  const cargarDatos = () => {
    setCargando(true);
    Promise.all([
      api.get(`/catalogos/medicos-publicos?termino=${encodeURIComponent(termino)}`),
      api.get('/catalogos/especialidades-publicas'),
    ])
      .then(([resMed, resEsp]) => {
        setMedicos(resMed.data.datos || []);
        setEspecialidades(resEsp.data.datos || []);
      })
      .catch((err) => setAlerta({ tipo: 'error', mensaje: err.response?.data?.mensaje || 'Error al cargar médicos.' }))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargarDatos();
  }, [termino]);

  const abrirModalCrear = () => {
    setMedicoEditando(null);
    setFormulario({
      ci: '',
      nombres: '',
      apellidos: '',
      correo: '',
      telefono: '',
      nro_matricula: '',
      biografia: '',
      especialidades: [],
    });
    setErrores({});
    setModalAbierto(true);
  };

  const abrirModalEditar = (m) => {
    setMedicoEditando(m);
    setFormulario({
      ci: m.ci || '',
      nombres: m.nombres || '',
      apellidos: m.apellidos || '',
      correo: m.correo || '',
      telefono: m.telefono || '',
      nro_matricula: m.nro_matricula || '',
      biografia: m.biografia || '',
      especialidades: (m.especialidades || []).map((e) => e.id_especialidad),
    });
    setErrores({});
    setModalAbierto(true);
  };

  const manejarCheckboxEspecialidad = (idEspecialidad) => {
    setFormulario((prev) => {
      const existe = prev.especialidades.includes(idEspecialidad);
      if (existe) {
        return { ...prev, especialidades: prev.especialidades.filter((id) => id !== idEspecialidad) };
      } else {
        return { ...prev, especialidades: [...prev.especialidades, idEspecialidad] };
      }
    });
  };

  const guardarMedico = async (e) => {
    e.preventDefault();
    setErrores({});

    if (formulario.especialidades.length === 0) {
      setErrores({ especialidades: 'Debe seleccionar al menos una especialidad médica.' });
      return;
    }

    try {
      if (medicoEditando) {
        await api.put(`/catalogos/medicos/${medicoEditando.id_medico}`, formulario);
        setAlerta({ tipo: 'exito', mensaje: 'Médico actualizado exitosamente.' });
      } else {
        await api.post('/catalogos/medicos', formulario);
        setAlerta({ tipo: 'exito', mensaje: 'Médico registrado exitosamente.' });
      }
      setModalAbierto(false);
      cargarDatos();
    } catch (err) {
      if (err.response?.status === 422 && err.response.data?.errores) {
        setErrores(err.response.data.errores);
      } else {
        setAlerta({ tipo: 'error', mensaje: err.response?.data?.mensaje || 'Error al guardar médico.' });
      }
    }
  };

  const manejarAlternarEstado = async (idMedico) => {
    try {
      const res = await api.patch(`/catalogos/medicos/${idMedico}/alternar-estado`);
      const alertaMsg = res.data.alerta || res.data.datos?.alerta;
      if (alertaMsg) {
        setAdvertenciaDesactivacion({
          mensaje: alertaMsg,
          citasAfectadas: res.data.citas_afectadas ?? res.data.datos?.citas_afectadas ?? 0,
          sugerirSuspension: res.data.sugerir_suspension ?? res.data.datos?.sugerir_suspension ?? true,
        });
      } else {
        setAdvertenciaDesactivacion(null);
      }
      setAlerta({ tipo: 'exito', mensaje: res.data.mensaje || 'Estado del médico actualizado correctamente.' });
      cargarDatos();
    } catch (err) {
      setAdvertenciaDesactivacion(null);
      const msg = err.response?.data?.mensaje || err.response?.data?.error || 'Error al cambiar estado del médico.';
      setAlerta({ tipo: 'error', mensaje: msg });
    }
  };

  const alternarEstado = manejarAlternarEstado;

  return (
    <LayoutPrincipal>
      <div className="gestion-medicos-contenedor">
        <div className="gestion-medicos-cabecera">
          <div>
            <h2 className="titulo">
              <b>Cuerpo</b> <span>Médico de la Clínica</span>
            </h2>
            <p style={{ color: 'var(--texto-sec)', fontSize: '0.9rem' }}>
              Gestión de profesionales de salud, matrículas colegiadas y asignación de especialidades.
            </p>
          </div>

          <div className="gestion-medicos-barra-acciones">
            <div className="gestion-medicos-buscador">
              <CampoTexto
                etiqueta="Buscar"
                nombre="termino"
                valor={termino}
                alCambiar={(e) => setTermino(e.target.value)}
                marcador="Buscar médico…"
              />
            </div>
            <button
              type="button"
              onClick={abrirModalCrear}
              className="boton-primario gestion-medicos-btn-nuevo"
              style={{ minHeight: '44px' }}
            >
              + Nuevo Médico
            </button>
          </div>
        </div>

        <Alerta tipo={alerta?.tipo} mensaje={alerta?.mensaje} />

        {/* Banner de Advertencia Informativa (RN11) al Desactivar Médico con Citas u Horarios */}
        {advertenciaDesactivacion && (
          <div className="banner-advertencia-rn11" role="alert">
            <div className="banner-advertencia-cabecera">
              <div className="banner-advertencia-icono-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="banner-advertencia-textos">
                <strong className="banner-advertencia-titulo">
                  Atención: Médico con Citas u Horarios Vigentes
                </strong>
                <p className="banner-advertencia-descripcion">
                  {advertenciaDesactivacion.mensaje}
                </p>
              </div>
            </div>

            <div className="banner-advertencia-acciones">
              <Link
                to="/recepcion/suspensiones"
                className="boton-primario banner-btn-accion"
                style={{ minHeight: '44px', textDecoration: 'none' }}
              >
                Gestionar Suspensión de Horarios →
              </Link>
              <button
                type="button"
                onClick={() => setAdvertenciaDesactivacion(null)}
                className="boton-terciario banner-btn-cerrar"
                style={{ minHeight: '44px' }}
              >
                Cerrar Notificación
              </button>
            </div>
          </div>
        )}

        {/* Cuerpo Médico con TablaExpandible (Tarea 4) */}
        <TablaExpandible
          columnas={['Nombre del Profesional', 'Matrícula Profesional', 'Estado', '']}
          datos={medicos}
          cargando={cargando}
          obtenerClaveFila={(m) => m.id_medico}
          mensajeVacio="No se encontraron profesionales médicos registrados."
          renderFilaPrincipal={(m, isExpanded, toggleExpand) => (
            <>
              <td>
                <strong style={{ color: 'var(--verde-azulado)', fontSize: '0.95rem' }}>
                  Dr. {m.apellidos}, {m.nombres}
                </strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--texto-sec)' }}>
                  CI: {m.ci || '—'} · {(m.especialidades || []).map((e) => e.nombre).join(', ') || 'Sin especialidad'}
                </div>
              </td>
              <td>
                <span className="badge-codigo-turquesa">
                  {m.nro_matricula}
                </span>
              </td>
              <td>
                <InsigniaEstado estado={m.estado} />
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
          renderFilaMovil={(m, isExpanded, toggleExpand) => (
            <div className="fila-resumen-movil">
              {/* Línea 1 (Arriba): Matrícula Profesional y a la derecha el Estado */}
              <div className="fila-resumen-movil-linea1">
                <span className="badge-codigo-turquesa">
                  Mat: {m.nro_matricula}
                </span>
                <InsigniaEstado estado={m.estado} />
              </div>

              {/* Línea 2 (Abajo): Nombre del Médico en negrita y flecha/chevron a la derecha */}
              <div className="fila-resumen-movil-linea2">
                <div className="fila-resumen-movil-nombre">
                  <strong className="nombre-paciente-destacado">Dr. {m.apellidos}, {m.nombres}</strong>
                  <span className="ci-paciente-sub">
                    {(m.especialidades || []).map((e) => e.nombre).join(', ') || 'Sin especialidad'}
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
          renderDetalle={(m) => (
            <>
              <div className="panel-detalle-grid">
                <div className="detalle-dato-item" style={{ gridColumn: '1 / -1' }}>
                  <span className="detalle-etiqueta">Especialidades Médicas Asignadas</span>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '4px' }}>
                    {(m.especialidades || []).length > 0 ? (
                      (m.especialidades || []).map((e) => (
                        <span
                          key={e.id_especialidad}
                          style={{
                            background: '#E2F5F8',
                            color: '#0A6C84',
                            border: '1px solid #BDE5ED',
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                          }}
                        >
                          🩺 {e.nombre}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: 'var(--texto-sec)', fontSize: '0.85rem' }}>Sin especialidades asignadas</span>
                    )}
                  </div>
                </div>

                <div className="detalle-dato-item">
                  <span className="detalle-etiqueta">Cédula de Identidad (CI)</span>
                  <span className="detalle-valor">{m.ci || 'Sin registrar'}</span>
                </div>

                <div className="detalle-dato-item">
                  <span className="detalle-etiqueta">Teléfono Directo</span>
                  <span className="detalle-valor">{m.telefono || 'Sin teléfono'}</span>
                </div>

                <div className="detalle-dato-item">
                  <span className="detalle-etiqueta">Correo Electrónico</span>
                  <span className="detalle-valor">{m.correo || 'Sin correo electrónico'}</span>
                </div>

                <div className="detalle-dato-item" style={{ gridColumn: '1 / -1' }}>
                  <span className="detalle-etiqueta">Biografía / Resumen Profesional</span>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: '#4A6572', lineHeight: 1.45 }}>
                    {m.biografia || 'Sin reseña profesional registrada.'}
                  </p>
                </div>
              </div>

              <div className="panel-detalle-acciones">
                <Link
                  to="/recepcion/suspensiones"
                  className="boton-secundario"
                  style={{ minHeight: '44px' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                  Suspender Horario
                </Link>

                <button
                  type="button"
                  onClick={() => abrirModalEditar(m)}
                  className="boton-terciario"
                  style={{ minHeight: '44px' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Editar Datos
                </button>

                <button
                  type="button"
                  onClick={() => alternarEstado(m.id_medico)}
                  className={m.estado === 'activo' ? 'boton-peligro' : 'boton-primario'}
                  style={{ minHeight: '44px' }}
                  title="Desactivación lógica (prohibido borrado físico)"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  </svg>
                  {m.estado === 'activo' ? 'Inactivar Médico' : 'Activar Médico'}
                </button>
              </div>
            </>
          )}
        />

        {/* Modal Formulario Médico */}
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
            <div className="tarjeta" style={{ maxWidth: '620px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
              <h3 className="titulo" style={{ fontSize: '1.35rem', marginBottom: '1rem' }}>
                <b>{medicoEditando ? 'Editar' : 'Registrar'}</b> <span>Médico</span>
              </h3>

              <form onSubmit={guardarMedico}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0 1rem' }}>
                  <CampoTexto
                    etiqueta="Cédula de Identidad"
                    nombre="ci"
                    valor={formulario.ci}
                    alCambiar={(e) => setFormulario({ ...formulario, ci: e.target.value })}
                    error={errores.ci?.[0] || errores.ci}
                    requerido
                  />
                  <CampoTexto
                    etiqueta="Nro. Matrícula Profesional"
                    nombre="nro_matricula"
                    valor={formulario.nro_matricula}
                    alCambiar={(e) => setFormulario({ ...formulario, nro_matricula: e.target.value })}
                    error={errores.nro_matricula?.[0] || errores.nro_matricula}
                    requerido
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0 1rem' }}>
                  <CampoTexto
                    etiqueta="Nombres"
                    nombre="nombres"
                    valor={formulario.nombres}
                    alCambiar={(e) => setFormulario({ ...formulario, nombres: e.target.value })}
                    error={errores.nombres?.[0] || errores.nombres}
                    requerido
                  />
                  <CampoTexto
                    etiqueta="Apellidos"
                    nombre="apellidos"
                    valor={formulario.apellidos}
                    alCambiar={(e) => setFormulario({ ...formulario, apellidos: e.target.value })}
                    error={errores.apellidos?.[0] || errores.apellidos}
                    requerido
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0 1rem' }}>
                  <CampoTexto
                    etiqueta="Correo Electrónico"
                    nombre="correo"
                    tipo="email"
                    valor={formulario.correo}
                    alCambiar={(e) => setFormulario({ ...formulario, correo: e.target.value })}
                    error={errores.correo?.[0] || errores.correo}
                    requerido
                  />
                  <CampoTexto
                    etiqueta="Teléfono"
                    nombre="telefono"
                    valor={formulario.telefono}
                    alCambiar={(e) => setFormulario({ ...formulario, telefono: e.target.value })}
                  />
                </div>

                {/* Especialidades */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="etiqueta-campo" style={{ display: 'block', marginBottom: '0.4rem' }}>
                    Especialidades Médicas Asignadas <span style={{ color: 'var(--cancelada)' }}>*</span>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem', background: '#F8FCFD', padding: '0.75rem', borderRadius: '8px', border: '1px solid #CFE2E8' }}>
                    {especialidades.map((esp) => (
                      <label key={esp.id_especialidad} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formulario.especialidades.includes(esp.id_especialidad)}
                          onChange={() => manejarCheckboxEspecialidad(esp.id_especialidad)}
                        />
                        {esp.nombre}
                      </label>
                    ))}
                  </div>
                  {errores.especialidades && (
                    <span className="mensaje-error-campo">{errores.especialidades}</span>
                  )}
                </div>

                <div className="modal-botones-acciones" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                  <button type="button" onClick={() => setModalAbierto(false)} className="boton-terciario" style={{ minHeight: '44px' }}>
                    Cancelar
                  </button>
                  <button type="submit" className="boton-primario" style={{ minHeight: '44px' }}>
                    Guardar Médico
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <style>{`
          .gestion-medicos-contenedor {
            max-width: 1050px;
            margin: 0 auto;
            width: 100%;
            box-sizing: border-box;
            overflow-x: hidden;
          }

          .gestion-medicos-cabecera {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 1rem;
            margin-bottom: 1.5rem;
            width: 100%;
            box-sizing: border-box;
          }

          .gestion-medicos-barra-acciones {
            display: flex;
            gap: 0.75rem;
            align-items: flex-end;
            flex-wrap: wrap;
          }

          .gestion-medicos-buscador {
            width: 220px;
          }

          /* Banner de advertencia RN11 */
          .banner-advertencia-rn11 {
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

          .banner-advertencia-cabecera {
            display: flex;
            align-items: flex-start;
            gap: 0.85rem;
          }

          .banner-advertencia-icono-box {
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

          .banner-advertencia-titulo {
            display: block;
            font-size: 0.95rem;
            color: #92400E;
            margin-bottom: 4px;
            font-weight: 700;
          }

          .banner-advertencia-descripcion {
            margin: 0;
            font-size: 0.875rem;
            color: #78350F;
            line-height: 1.45;
          }

          .banner-advertencia-acciones {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            justify-content: flex-end;
            flex-wrap: wrap;
          }

          .banner-btn-accion {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0 1.25rem;
            background: #0A6C84 !important;
            color: #FFFFFF !important;
            font-weight: 600;
            border-radius: 6px;
          }

          .banner-btn-cerrar {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0 1rem;
          }

          @media (max-width: 640px) {
            .gestion-medicos-cabecera {
              flex-direction: column;
              align-items: stretch;
              gap: 1rem;
              margin-bottom: 1.25rem;
            }

            .gestion-medicos-barra-acciones {
              flex-direction: column;
              align-items: stretch;
              width: 100%;
              gap: 0.75rem;
            }

            .gestion-medicos-buscador {
              width: 100% !important;
            }

            .gestion-medicos-btn-nuevo {
              width: 100% !important;
              margin-bottom: 0 !important;
            }

            .banner-advertencia-rn11 {
              padding: 0.875rem;
              gap: 0.875rem;
            }

            .banner-advertencia-acciones {
              flex-direction: column;
              align-items: stretch;
              width: 100%;
              gap: 0.5rem;
            }

            .banner-btn-accion,
            .banner-btn-cerrar {
              width: 100% !important;
              box-sizing: border-box;
            }

            .modal-botones-acciones {
              flex-direction: column !important;
              width: 100%;
              gap: 0.5rem !important;
            }

            .modal-botones-acciones button {
              width: 100% !important;
              min-height: 44px !important;
            }
          }
        `}</style>
      </div>
    </LayoutPrincipal>
  );
}
