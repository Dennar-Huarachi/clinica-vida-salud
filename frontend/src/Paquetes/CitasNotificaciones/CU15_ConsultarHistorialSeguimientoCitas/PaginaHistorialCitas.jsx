import React, { useState, useEffect } from 'react';
import api from '../../../compartido/utilidades/api';
import InsigniaEstado from '../../../compartido/componentes/InsigniaEstado';
import Alerta from '../../../compartido/componentes/Alerta';
import LayoutPrincipal from '../../../compartido/layouts/LayoutPrincipal';
import TablaExpandible from '../../../comun/componentes/TablaExpandible';
import InsigniaEstadoPago from '../CU27_GestionarPagosReembolsos/InsigniaEstadoPago';

export default function PaginaHistorialCitas() {
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [alerta, setAlerta] = useState(null);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');

  const usuario = JSON.parse(localStorage.getItem('usuario_clinica') || '{}');
  const rol = (usuario?.rol || '').toLowerCase();
  const esPersonal = ['administrador', 'recepcionista'].includes(rol);

  // Estado para modal accesible de cancelación
  const [citaACancelar, setCitaACancelar] = useState(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [procesandoCancelacion, setProcesandoCancelacion] = useState(false);
  const [errorAnticipacionRN15, setErrorAnticipacionRN15] = useState(null);

  const cargarCitas = () => {
    setCargando(true);
    api.get('/citas/historial')
      .then((res) => {
        setCitas(res.data.datos || []);
      })
      .catch((err) => {
        setAlerta({ tipo: 'error', mensaje: err.response?.data?.mensaje || 'Error al cargar citas.' });
      })
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargarCitas();
  }, []);

  // Confirmar Cita explícitamente (CU-12)
  const confirmarCita = async (idCita) => {
    try {
      await api.put(`/citas/${idCita}/confirmar`);
      setAlerta({ tipo: 'exito', mensaje: 'Cita confirmada correctamente.' });
      cargarCitas();
    } catch (err) {
      setAlerta({ tipo: 'error', mensaje: err.response?.data?.mensaje || 'No se pudo confirmar la cita.' });
    }
  };

  // Cálculo de horas restantes para el turno (RN15: 12 horas mínimas)
  const calcularHorasRestantes = (cita) => {
    if (!cita?.fecha_cita || !cita?.hora_inicio) return 0;
    try {
      const [año, mes, dia] = cita.fecha_cita.split('-').map(Number);
      const [hora, min] = cita.hora_inicio.split(':').map(Number);
      const fechaTurno = new Date(año, mes - 1, dia, hora, min);
      const ahora = new Date();
      return Math.floor((fechaTurno - ahora) / (1000 * 60 * 60));
    } catch {
      return 0;
    }
  };

  // Abrir modal de cancelación
  const abrirModalCancelar = (cita) => {
    setCitaACancelar(cita);
    setMotivoCancelacion('');
    setErrorAnticipacionRN15(null);
  };

  // Ejecutar cancelación
  const ejecutarCancelacion = async (e) => {
    e.preventDefault();
    setProcesandoCancelacion(true);
    setErrorAnticipacionRN15(null);

    try {
      await api.put(`/citas/${citaACancelar.id_cita}/cancelar`, {
        motivo: motivoCancelacion.trim() || 'Cancelado a solicitud del paciente con reembolso',
      });
      setAlerta({ tipo: 'exito', mensaje: `Cita ${citaACancelar.codigo_cita} cancelada exitosamente. Depósito de garantía reembolsado.` });
      setCitaACancelar(null);
      cargarCitas();
    } catch (err) {
      const msg = err.response?.data?.mensaje || 'No se pudo cancelar la cita.';
      if (err.response?.status === 422 && msg.includes('horas de anticipación')) {
        setErrorAnticipacionRN15(msg);
      } else {
        setAlerta({ tipo: 'error', mensaje: msg });
        setCitaACancelar(null);
      }
    } finally {
      setProcesandoCancelacion(false);
    }
  };

  // Filtrado reactivo en tiempo real (CU-15)
  const citasFiltradas = citas.filter((c) => {
    if (!terminoBusqueda.trim()) return true;
    const q = terminoBusqueda.toLowerCase().trim();
    const matchCodigo = (c.codigo_cita || '').toLowerCase().includes(q);
    const matchMotivo = (c.motivo_consulta || '').toLowerCase().includes(q);
    const matchEspecialidad = (c.especialidad_nombre || '').toLowerCase().includes(q);
    const matchMedico = `${c.medico_nombres || ''} ${c.medico_apellidos || ''}`.toLowerCase().includes(q);

    let matchPaciente = false;
    if (esPersonal) {
      const pacNombres = `${c.paciente_nombres || ''} ${c.paciente_apellidos || ''}`.toLowerCase();
      const pacCi = (c.paciente_ci || '').toLowerCase();
      const pacHist = (c.codigo_historia || '').toLowerCase();
      matchPaciente = pacNombres.includes(q) || pacCi.includes(q) || pacHist.includes(q);
    }

    return matchCodigo || matchMotivo || matchEspecialidad || matchMedico || matchPaciente;
  });

  const columnas = [
    'Código',
    'Fecha y Hora',
    'Especialidad / Médico',
    'Estado',
    'Garantía / Pago',
    'Acción',
    '',
  ];

  return (
    <LayoutPrincipal>
      <div style={{ maxWidth: '1050px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {/* Cabecera con Búsqueda Rápida Reactiva (CU-15) */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem'
        }}>
          <div>
            <h2 className="titulo" style={{ marginBottom: '0.25rem' }}>
              <b>Historial</b> <span>y Seguimiento de Citas</span>
            </h2>
            <p style={{ color: 'var(--texto-sec)', fontSize: '0.9rem' }}>
              Consulta el estado de tus citas programadas, registro de garantía de reserva y reembolsos.
            </p>
          </div>

          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '380px',
            boxSizing: 'border-box'
          }}>
            <div style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#64748B',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <input
              type="text"
              value={terminoBusqueda}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
              placeholder="Buscar por código (CIT-...) o motivo..."
              aria-label="Buscar citas"
              style={{
                width: '100%',
                minHeight: '44px',
                padding: '0 2.5rem 0 2.4rem',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
                backgroundColor: '#FFFFFF',
                outline: 'none',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#0A6C84';
                e.target.style.boxShadow = '0 0 0 3px rgba(10, 108, 132, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#CBD5E1';
                e.target.style.boxShadow = 'none';
              }}
            />
            {terminoBusqueda && (
              <button
                type="button"
                onClick={() => setTerminoBusqueda('')}
                aria-label="Limpiar búsqueda"
                style={{
                  position: 'absolute',
                  right: '6px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  width: '36px',
                  height: '36px',
                  minHeight: '36px',
                  minWidth: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  fontSize: '0.9rem',
                  padding: 0
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <Alerta tipo={alerta?.tipo} mensaje={alerta?.mensaje} />

        <div className="tarjeta" style={{ padding: 0, overflow: 'hidden' }}>
          <TablaExpandible
            columnas={columnas}
            datos={citasFiltradas}
            cargando={cargando}
            mensajeVacio={terminoBusqueda.trim() ? `No se encontraron citas que coincidan con "${terminoBusqueda}".` : "No tienes citas médicas registradas en tu historial."}
            obtenerClaveFila={(c) => c.id_cita}
            renderFilaPrincipal={(c, isExpanded, toggleExpand) => (
              <>
                <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                  <span className="badge-codigo-turquesa">{c.codigo_cita}</span>
                </td>
                <td>
                  <strong>{c.fecha_cita}</strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--texto-sec)' }}>
                    {c.hora_inicio} - {c.hora_fin}
                  </div>
                </td>
                <td>
                  <div><b>{c.especialidad_nombre}</b></div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--texto-sec)' }}>
                    Dr. {c.medico_apellidos}, {c.medico_nombres}
                  </div>
                </td>
                <td>
                  <InsigniaEstado estado={c.estado_codigo} texto={c.estado_nombre} />
                </td>
                <td>
                  <InsigniaEstadoPago estado={c.estado_pago} monto={c.pago_monto || '50.00'} />
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {c.estado_codigo === 'pendiente' && (
                      <button
                        type="button"
                        onClick={() => confirmarCita(c.id_cita)}
                        className="boton-secundario"
                        style={{ minHeight: '34px', padding: '0 0.6rem', fontSize: '0.8rem' }}
                      >
                        Confirmar
                      </button>
                    )}

                    {['pendiente', 'confirmada'].includes(c.estado_codigo) && (
                      <button
                        type="button"
                        onClick={() => abrirModalCancelar(c)}
                        className="boton-peligro"
                        style={{ minHeight: '34px', padding: '0 0.6rem', fontSize: '0.8rem' }}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    className={`boton-chevron-expandir ${isExpanded ? 'rotado' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand();
                    }}
                    aria-label="Ver detalles de la cita"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                </td>
              </>
            )}
            renderFilaMovil={(c, isExpanded, toggleExpand) => (
              <div className="fila-resumen-movil">
                <div className="fila-resumen-movil-linea1">
                  <span className="badge-codigo-turquesa">{c.codigo_cita}</span>
                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                    <InsigniaEstadoPago estado={c.estado_pago} monto={c.pago_monto || '50'} compacto={true} />
                    <InsigniaEstado estado={c.estado_codigo} texto={c.estado_nombre} />
                  </div>
                </div>
                <div className="fila-resumen-movil-linea2">
                  <div className="fila-resumen-movil-nombre">
                    <span className="nombre-paciente-destacado">
                      {c.fecha_cita} ({c.hora_inicio} - {c.hora_fin})
                    </span>
                    <span className="ci-paciente-sub">
                      {c.especialidad_nombre} • Dr. {c.medico_apellidos}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={`boton-chevron-expandir ${isExpanded ? 'rotado' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand();
                    }}
                    aria-label="Expandir opciones"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                </div>
              </div>
            )}
            renderDetalle={(c) => (
              <div>
                <div className="panel-detalle-grid">
                  <div className="detalle-dato-item">
                    <span className="detalle-etiqueta">Código de Cita</span>
                    <span className="detalle-valor badge-codigo-turquesa" style={{ display: 'inline-block', width: 'fit-content' }}>
                      {c.codigo_cita}
                    </span>
                  </div>
                  <div className="detalle-dato-item">
                    <span className="detalle-etiqueta">Fecha y Turno</span>
                    <span className="detalle-valor">
                      {c.fecha_cita} ({c.hora_inicio} a {c.hora_fin})
                    </span>
                  </div>
                  <div className="detalle-dato-item">
                    <span className="detalle-etiqueta">Médico y Especialidad</span>
                    <span className="detalle-valor">
                      {c.especialidad_nombre} — Dr. {c.medico_apellidos}, {c.medico_nombres}
                    </span>
                  </div>
                  {esPersonal && c.paciente_nombres && (
                    <div className="detalle-dato-item">
                      <span className="detalle-etiqueta">Paciente</span>
                      <span className="detalle-valor">
                        {c.paciente_apellidos}, {c.paciente_nombres} {c.paciente_ci ? `(CI: ${c.paciente_ci})` : ''} {c.codigo_historia ? `[Hist: ${c.codigo_historia}]` : ''}
                      </span>
                    </div>
                  )}
                  <div className="detalle-dato-item">
                    <span className="detalle-etiqueta">Garantía de Reserva</span>
                    <span className="detalle-valor" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <InsigniaEstadoPago estado={c.estado_pago} monto={c.pago_monto || '50.00'} />
                      {c.nro_transaccion && (
                        <span style={{ fontSize: '0.8rem', color: '#64748B', fontFamily: 'monospace' }}>
                          (Tx: {c.nro_transaccion})
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="detalle-dato-item">
                    <span className="detalle-etiqueta">Motivo de Consulta</span>
                    <span className="detalle-valor">
                      {c.motivo_consulta || 'Consulta general'}
                    </span>
                  </div>
                  <div className="detalle-dato-item">
                    <span className="detalle-etiqueta">Observaciones</span>
                    <span className="detalle-valor">
                      {c.observaciones || 'Sin observaciones adicionales'}
                    </span>
                  </div>
                </div>

                <div className="panel-detalle-acciones">
                  {c.estado_codigo === 'pendiente' && (
                    <button
                      type="button"
                      onClick={() => confirmarCita(c.id_cita)}
                      className="boton-secundario"
                    >
                      ✓ Confirmar Mi Cita
                    </button>
                  )}

                  {['pendiente', 'confirmada'].includes(c.estado_codigo) && (
                    <button
                      type="button"
                      onClick={() => abrirModalCancelar(c)}
                      className="boton-peligro"
                    >
                      🗑️ Cancelar Cita Médica
                    </button>
                  )}
                </div>
              </div>
            )}
          />
        </div>

        {/* Modal Accesible de Cancelación para Paciente con Evaluación de 12 Horas */}
        {citaACancelar && (() => {
          const horasRestantes = calcularHorasRestantes(citaACancelar);
          const permiteCancelacionWeb = horasRestantes >= 12;

          return (
            <div className="modal-backdrop" style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1100,
              padding: '1rem',
            }}>
              <div className="modal-contenido tarjeta" style={{
                maxWidth: '500px',
                width: '100%',
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 25px 30px -5px rgba(0, 0, 0, 0.25)',
                boxSizing: 'border-box',
              }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#1C2D37' }}>
                  Cancelar Cita Médica
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--texto-sec)', marginBottom: '1rem' }}>
                  Cita: <b>{citaACancelar.codigo_cita}</b> ({citaACancelar.fecha_cita} a las {citaACancelar.hora_inicio})
                </p>

                {/* Banner de Evaluación de Política de 12 Horas */}
                {permiteCancelacionWeb ? (
                  <div style={{
                    backgroundColor: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    borderRadius: '8px',
                    padding: '0.9rem',
                    marginBottom: '1.25rem',
                    color: '#166534',
                    fontSize: '0.88rem',
                    lineHeight: '1.45',
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>
                      ✓ Cancelación con Reembolso Automático
                    </div>
                    Faltan <b>{horasRestantes} horas</b> para su turno médico (cumple la anticipación mínima de 12 horas). Si cancela ahora, su cupo será liberado y su depósito de <b>{citaACancelar.pago_monto || '50.00'} Bs</b> se reembolsará íntegramente.
                  </div>
                ) : (
                  <div style={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: '8px',
                    padding: '0.9rem',
                    marginBottom: '1.25rem',
                    color: '#991B1B',
                    fontSize: '0.88rem',
                    lineHeight: '1.45',
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>
                      ⚠️ Plazo Web Vencido para Reembolso
                    </div>
                    Faltan únicamente <b>{horasRestantes > 0 ? horasRestantes : 0} horas</b> para su consulta. La política institucional de la clínica exige al menos <b>12 horas de anticipación</b> para acceder a devolución de garantía. La cancelación web ha sido bloqueada. Para cancelar sin derecho a devolución comuníquese con recepción.
                  </div>
                )}

                {errorAnticipacionRN15 && (
                  <div style={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    marginBottom: '1rem',
                    color: '#991B1B',
                    fontSize: '0.85rem',
                  }}>
                    {errorAnticipacionRN15}
                  </div>
                )}

                <form onSubmit={ejecutarCancelacion}>
                  {permiteCancelacionWeb && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                        Motivo de Cancelación (Opcional)
                      </label>
                      <textarea
                        rows="3"
                        value={motivoCancelacion}
                        onChange={(e) => setMotivoCancelacion(e.target.value)}
                        placeholder="Indique brevemente el motivo de la cancelación..."
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.9rem',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {permiteCancelacionWeb ? (
                      <button
                        type="submit"
                        disabled={procesandoCancelacion}
                        className="boton-peligro"
                        style={{ minHeight: '44px', width: '100%', fontWeight: 700 }}
                      >
                        {procesandoCancelacion ? 'Procesando Reembolso…' : 'Confirmar Cancelación y Reembolsar 50 Bs'}
                      </button>
                    ) : (
                      <a
                        href="tel:800102030"
                        className="boton-secundario"
                        style={{ minHeight: '44px', width: '100%', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}
                      >
                        📞 Contactar a Recepción (800-10-2030)
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setCitaACancelar(null);
                        setErrorAnticipacionRN15(null);
                      }}
                      disabled={procesandoCancelacion}
                      className="boton-terciario"
                      style={{ minHeight: '44px', width: '100%' }}
                    >
                      {permiteCancelacionWeb ? 'Mantener Mi Cita' : 'Cerrar Diálogo'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}
      </div>
    </LayoutPrincipal>
  );
}
