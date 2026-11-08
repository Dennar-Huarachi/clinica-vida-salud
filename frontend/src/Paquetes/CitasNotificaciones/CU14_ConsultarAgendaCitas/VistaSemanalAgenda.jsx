import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import InsigniaEstado from '../../../compartido/componentes/InsigniaEstado';
import InsigniaEstadoPago from '../CU27_GestionarPagosReembolsos/InsigniaEstadoPago';

/**
 * Retorna la configuración de color y etiqueta institucional según el estado de la cita.
 */
function obtenerEstiloEstado(codigoEstado) {
  switch (codigoEstado) {
    case 'confirmada':
      return {
        fondo: '#E6FFFA',
        borde: '#1FA5B8',
        texto: '#0A6C84',
        etiqueta: 'Confirmada',
      };
    case 'en_espera':
      return {
        fondo: '#FFF7ED',
        borde: '#F28C1E',
        texto: '#C75F00',
        etiqueta: 'En Sala',
      };
    case 'atendida':
      return {
        fondo: '#F0FDF4',
        borde: '#22C55E',
        texto: '#15803D',
        etiqueta: 'Atendida',
      };
    case 'cancelada':
      return {
        fondo: '#FEF2F2',
        borde: '#EF4444',
        texto: '#B91C1C',
        etiqueta: 'Cancelada',
      };
    case 'inasistencia':
      return {
        fondo: '#F8FAFC',
        borde: '#94A3B8',
        texto: '#475569',
        etiqueta: 'Inasistencia',
      };
    case 'postergada':
      return {
        fondo: '#FAF5FF',
        borde: '#A855F7',
        texto: '#7E22CE',
        etiqueta: 'Postergada',
      };
    case 'pendiente':
    default:
      return {
        fondo: '#F0F9FF',
        borde: '#38BDF8',
        texto: '#0369A1',
        etiqueta: 'Programada',
      };
  }
}

/**
 * Calcula los 7 días de la semana (Lunes a Domingo) para la fecha de referencia.
 */
export function obtenerDiasSemana(fechaReferenciaStr) {
  if (!fechaReferenciaStr) {
    fechaReferenciaStr = new Date().toISOString().split('T')[0];
  }
  const [y, m, d] = fechaReferenciaStr.split('-').map(Number);
  const ref = new Date(y, m - 1, d);

  // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  const diaSem = ref.getDay();
  const diffLunes = diaSem === 0 ? -6 : 1 - diaSem;

  const lunes = new Date(ref);
  lunes.setDate(ref.getDate() + diffLunes);

  const dias = [];
  const nombresDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const nombresCortos = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

  const hoyStr = new Date().toISOString().split('T')[0];

  for (let i = 0; i < 7; i++) {
    const diaActual = new Date(lunes);
    diaActual.setDate(lunes.getDate() + i);

    const anio = diaActual.getFullYear();
    const mes = String(diaActual.getMonth() + 1).padStart(2, '0');
    const dia = String(diaActual.getDate()).padStart(2, '0');
    const fechaISO = `${anio}-${mes}-${dia}`;

    dias.push({
      indice: i,
      nombre: nombresDias[i],
      nombreCorto: nombresCortos[i],
      fecha: fechaISO,
      diaNumero: diaActual.getDate(),
      mesNumero: diaActual.getMonth() + 1,
      esHoy: fechaISO === hoyStr,
      esSeleccionada: fechaISO === fechaReferenciaStr,
    });
  }

  return dias;
}

/**
 * Componente VistaSemanalAgenda (CU-14)
 * Renderiza la agenda médica semanal:
 * - Desktop (>640px): Cuadrícula CSS Grid Lunes a Domingo por franjas horarias.
 * - Mobile (<=640px): Lista vertical agrupada por días sin scroll horizontal.
 */
export default function VistaSemanalAgenda({
  citas = [],
  fechaReferencia,
  cargando = false,
  esMedico = false,
  esAdmin = false,
  alConfirmarCita,
  alMarcarAsistencia,
  alAbrirModalCancelar,
  alAbrirModalCorreccionRN16,
}) {
  const [citaDetalle, setCitaDetalle] = useState(null);

  const diasSemana = obtenerDiasSemana(fechaReferencia);

  // Generar franjas horarias dinámicas según citas existentes o defecto (08:00 a 19:00)
  let horaMin = 8;
  let horaMax = 19;
  citas.forEach((c) => {
    if (c.hora_inicio) {
      const h = parseInt(c.hora_inicio.split(':')[0], 10);
      if (!isNaN(h)) {
        if (h < horaMin) horaMin = Math.max(6, h);
        if (h > horaMax) horaMax = Math.min(22, h);
      }
    }
  });

  const franjas = [];
  for (let h = horaMin; h <= horaMax; h++) {
    franjas.push(String(h).padStart(2, '0') + ':00');
  }

  // Agrupar citas por fecha y hora (clave: "YYYY-MM-DD_HH")
  const citasPorCelda = {};
  const citasPorDia = {};

  diasSemana.forEach((d) => {
    citasPorDia[d.fecha] = [];
  });

  citas.forEach((c) => {
    if (!citasPorDia[c.fecha_cita]) {
      citasPorDia[c.fecha_cita] = [];
    }
    citasPorDia[c.fecha_cita].push(c);

    const horaStr = c.hora_inicio ? c.hora_inicio.substring(0, 2) : '08';
    const claveCelda = `${c.fecha_cita}_${horaStr}:00`;
    if (!citasPorCelda[claveCelda]) {
      citasPorCelda[claveCelda] = [];
    }
    citasPorCelda[claveCelda].push(c);
  });

  return (
    <div className="vista-semanal-contenedor">
      {cargando && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#0A6C84', fontWeight: 600 }}>
          Cargando agenda semanal…
        </div>
      )}

      {/* ---------------- 1. VISTA DESKTOP: CUADRÍCULA CSS GRID TIPO CALENDARIO ---------------- */}
      <div className="vista-semanal-desktop">
        <div className="calendario-grid-marco">
          {/* Fila de Encabezados de Días */}
          <div className="calendario-grid-cabecera">
            <div className="columna-hora-header">Hora</div>
            {diasSemana.map((dia) => (
              <div
                key={dia.fecha}
                className={`dia-columna-header ${dia.esHoy ? 'dia-hoy' : ''} ${dia.esSeleccionada ? 'dia-seleccionado' : ''}`}
              >
                <span className="dia-nombre-corto">{dia.nombreCorto}</span>
                <span className="dia-numero-circulo">{dia.diaNumero}</span>
                <span className="dia-mes-sub">{dia.nombre}</span>
              </div>
            ))}
          </div>

          {/* Filas de Franjas Horarias */}
          <div className="calendario-grid-cuerpo">
            {franjas.map((hora) => (
              <div key={hora} className="calendario-fila-hora">
                <div className="columna-hora-etiqueta">
                  <span>{hora}</span>
                </div>
                {diasSemana.map((dia) => {
                  const horaPrefijo = hora.substring(0, 2) + ':00';
                  const citasCelda = citasPorCelda[`${dia.fecha}_${horaPrefijo}`] || [];

                  return (
                    <div
                      key={`${dia.fecha}_${hora}`}
                      className={`calendario-celda ${dia.esHoy ? 'celda-hoy' : ''}`}
                    >
                      {citasCelda.map((c) => {
                        const estilo = obtenerEstiloEstado(c.estado_codigo);
                        return (
                          <button
                            key={c.id_cita}
                            type="button"
                            className="bloque-cita-grid"
                            style={{
                              backgroundColor: estilo.fondo,
                              borderLeftColor: estilo.borde,
                              color: estilo.texto,
                            }}
                            onClick={() => setCitaDetalle(c)}
                            title={`Cita ${c.codigo_cita} - ${c.paciente_apellidos}, ${c.paciente_nombres} (${c.estado_nombre})`}
                          >
                            <div className="bloque-cita-tiempo">
                              <span>
                                {c.hora_inicio ? c.hora_inicio.substring(0, 5) : ''} - {c.hora_fin ? c.hora_fin.substring(0, 5) : ''}
                              </span>
                              <span
                                className="bloque-cita-badge"
                                style={{ backgroundColor: `${estilo.borde}25` }}
                              >
                                {c.estado_nombre || estilo.etiqueta}
                              </span>
                            </div>
                            <div className="bloque-cita-paciente">
                              {c.paciente_apellidos}, {c.paciente_nombres}
                            </div>
                            <div className="bloque-cita-especialidad">
                              {c.especialidad_nombre}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------------- 2. VISTA MÓVIL (<= 640px): LISTA VERTICAL AGRUPADA POR DÍAS ---------------- */}
      <div className="vista-semanal-movil">
        {diasSemana.map((dia) => {
          const citasDia = citasPorDia[dia.fecha] || [];

          return (
            <div key={dia.fecha} className="dia-movil-tarjeta">
              <div className={`dia-movil-cabecera ${dia.esHoy ? 'es-hoy' : ''}`}>
                <div className="dia-movil-info">
                  <span className="dia-movil-nombre">{dia.nombre}</span>
                  <span className="dia-movil-fecha">
                    {dia.diaNumero}/{dia.mesNumero}
                  </span>
                  {dia.esHoy && <span className="badge-dia-hoy">HOY</span>}
                </div>
                <span className="dia-movil-contador">
                  {citasDia.length} {citasDia.length === 1 ? 'cita' : 'citas'}
                </span>
              </div>

              <div className="dia-movil-cuerpo">
                {citasDia.length === 0 ? (
                  <div className="dia-movil-vacio">
                    No hay citas programadas para este día.
                  </div>
                ) : (
                  citasDia.map((c) => {
                    const estilo = obtenerEstiloEstado(c.estado_codigo);
                    return (
                      <div
                        key={c.id_cita}
                        className="tarjeta-cita-movil"
                        style={{ borderLeftColor: estilo.borde }}
                        onClick={() => setCitaDetalle(c)}
                      >
                        <div className="cita-movil-fila1">
                          <span className="cita-movil-horario">
                            🕒 {c.hora_inicio ? c.hora_inicio.substring(0, 5) : ''} - {c.hora_fin ? c.hora_fin.substring(0, 5) : ''}
                          </span>
                          <InsigniaEstado estado={c.estado_codigo} texto={c.estado_nombre} />
                        </div>

                        <div className="cita-movil-fila2">
                          <div className="cita-movil-paciente">
                            <strong>{c.paciente_apellidos}, {c.paciente_nombres}</strong>
                            <div className="cita-movil-subinfo">
                              {c.especialidad_nombre} • Dr. {c.medico_apellidos}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="boton-ver-detalle-movil"
                            aria-label="Ver detalles de la cita"
                          >
                            Ver →
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ---------------- 3. MODAL DE DETALLES Y ACCIONES DE CITA ---------------- */}
      {citaDetalle && (
        <div
          className="modal-detalle-backdrop"
          onClick={() => setCitaDetalle(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal-detalle-card tarjeta"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-detalle-header">
              <div>
                <span className="badge-codigo-turquesa" style={{ display: 'inline-block', marginBottom: '0.35rem' }}>
                  {citaDetalle.codigo_cita}
                </span>
                <h3 style={{ margin: 0, color: '#1C2D37', fontSize: '1.25rem' }}>
                  Detalles de la Cita Médica
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCitaDetalle(null)}
                className="boton-cerrar-modal"
                aria-label="Cerrar modal"
              >
                ✕
              </button>
            </div>

            <div className="modal-detalle-grid">
              <div className="detalle-dato-item">
                <span className="detalle-etiqueta">Fecha y Horario</span>
                <span className="detalle-valor" style={{ fontWeight: 700, color: '#0A6C84' }}>
                  📅 {citaDetalle.fecha_cita} | 🕒 {citaDetalle.hora_inicio ? citaDetalle.hora_inicio.substring(0, 5) : ''} - {citaDetalle.hora_fin ? citaDetalle.hora_fin.substring(0, 5) : ''}
                </span>
              </div>

              <div className="detalle-dato-item">
                <span className="detalle-etiqueta">Estado de la Cita</span>
                <span className="detalle-valor">
                  <InsigniaEstado estado={citaDetalle.estado_codigo} texto={citaDetalle.estado_nombre} />
                </span>
              </div>

              <div className="detalle-dato-item">
                <span className="detalle-etiqueta">Paciente</span>
                <span className="detalle-valor">
                  <strong>{citaDetalle.paciente_apellidos}, {citaDetalle.paciente_nombres}</strong>
                  <div style={{ fontSize: '0.85rem', color: '#5A7177' }}>
                    CI: {citaDetalle.paciente_ci || 'S/N'} | Hist: {citaDetalle.codigo_historia || 'S/N'} | Tel: {citaDetalle.paciente_telefono || 'No registrado'}
                  </div>
                </span>
              </div>

              <div className="detalle-dato-item">
                <span className="detalle-etiqueta">Médico / Especialidad</span>
                <span className="detalle-valor">
                  Dr. {citaDetalle.medico_apellidos}, {citaDetalle.medico_nombres}
                  <div style={{ fontSize: '0.85rem', color: '#5A7177' }}>
                    Especialidad: {citaDetalle.especialidad_nombre}
                  </div>
                </span>
              </div>

              <div className="detalle-dato-item">
                <span className="detalle-etiqueta">Motivo de Consulta</span>
                <span className="detalle-valor">
                  {citaDetalle.motivo_consulta || 'Consulta general'}
                </span>
              </div>

              <div className="detalle-dato-item">
                <span className="detalle-etiqueta">Garantía / Pago</span>
                <span className="detalle-valor" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <InsigniaEstadoPago estado={citaDetalle.estado_pago} monto={citaDetalle.pago_monto || '50.00'} />
                  {citaDetalle.nro_transaccion && (
                    <span style={{ fontSize: '0.8rem', color: '#64748B', fontFamily: 'monospace' }}>
                      (Tx: {citaDetalle.nro_transaccion})
                    </span>
                  )}
                </span>
              </div>

              <div className="detalle-dato-item" style={{ gridColumn: '1 / -1' }}>
                <span className="detalle-etiqueta">Observaciones</span>
                <span className="detalle-valor">
                  {citaDetalle.observaciones || 'Sin observaciones registradas'}
                </span>
              </div>
            </div>

            {/* Acciones Rápidas */}
            <div className="modal-detalle-acciones">
              {citaDetalle.estado_codigo === 'pendiente' && alConfirmarCita && (
                <button
                  type="button"
                  onClick={() => {
                    const id = citaDetalle.id_cita;
                    setCitaDetalle(null);
                    alConfirmarCita(id);
                  }}
                  className="boton-secundario"
                >
                  ✓ Confirmar Cita
                </button>
              )}

              {['pendiente', 'confirmada'].includes(citaDetalle.estado_codigo) && alMarcarAsistencia && (
                <button
                  type="button"
                  onClick={() => {
                    const id = citaDetalle.id_cita;
                    setCitaDetalle(null);
                    alMarcarAsistencia(id, 'en_espera');
                  }}
                  className="boton-primario"
                >
                  📍 Marcar Presente / En Sala
                </button>
              )}

              {esMedico && ['en_espera', 'confirmada', 'pendiente'].includes(citaDetalle.estado_codigo) && (
                <Link
                  to={`/historia-clinica/atencion/${citaDetalle.id_cita}`}
                  className="boton-primario btn-accion-destacado"
                  style={{ backgroundColor: '#F28C1E' }}
                >
                  🩺 Iniciar Atención Médica
                </Link>
              )}

              {citaDetalle.id_paciente ? (
                <Link
                  to={`/medico/atenciones/${citaDetalle.id_paciente}`}
                  className="boton-terciario"
                >
                  📋 Ver Historial Clínico
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="boton-terciario"
                  style={{ opacity: 0.5, cursor: 'not-allowed' }}
                  title="ID de paciente no disponible"
                >
                  📋 Ver Historial Clínico
                </button>
              )}

              {['pendiente', 'confirmada', 'en_espera'].includes(citaDetalle.estado_codigo) && alMarcarAsistencia && (
                <button
                  type="button"
                  onClick={() => {
                    const id = citaDetalle.id_cita;
                    setCitaDetalle(null);
                    alMarcarAsistencia(id, 'inasistencia');
                  }}
                  className="boton-terciario"
                  style={{ borderColor: '#E53E3E', color: '#E53E3E' }}
                >
                  ✕ Marcar Inasistencia
                </button>
              )}

              {['pendiente', 'confirmada', 'en_espera'].includes(citaDetalle.estado_codigo) && alAbrirModalCancelar && (
                <button
                  type="button"
                  onClick={() => {
                    const c = citaDetalle;
                    setCitaDetalle(null);
                    alAbrirModalCancelar(c);
                  }}
                  className="boton-peligro"
                >
                  🗑️ Cancelar Cita
                </button>
              )}

              {esAdmin && ['atendida', 'inasistencia'].includes(citaDetalle.estado_codigo) && alAbrirModalCorreccionRN16 && (
                <button
                  type="button"
                  onClick={() => {
                    const c = citaDetalle;
                    setCitaDetalle(null);
                    alAbrirModalCorreccionRN16(c);
                  }}
                  className="boton-secundario"
                  style={{ border: '2px solid #0A6C84', fontWeight: 700 }}
                >
                  ⚙️ Corrección Administrativa
                </button>
              )}

              <button
                type="button"
                onClick={() => setCitaDetalle(null)}
                className="boton-terciario"
                style={{ marginLeft: 'auto' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 4. ESTILOS DE LA VISTA SEMANAL ---------------- */}
      <style>{`
        .vista-semanal-contenedor {
          width: 100%;
          box-sizing: border-box;
        }

        /* Desktop: Cuadrícula Calendario */
        .vista-semanal-desktop {
          display: block;
          width: 100%;
          overflow-x: auto;
          background-color: #FFFFFF;
          border-radius: 12px;
          border: 1px solid #DCE9ED;
          box-shadow: 0 4px 12px rgba(10, 108, 132, 0.05);
        }

        .calendario-grid-marco {
          min-width: 860px;
          display: flex;
          flex-direction: column;
        }

        .calendario-grid-cabecera {
          display: grid;
          grid-template-columns: 70px repeat(7, 1fr);
          background-color: #F8FCFD;
          border-bottom: 2px solid #DCE9ED;
          position: sticky;
          top: 0;
          z-index: 5;
        }

        .columna-hora-header {
          padding: 0.85rem 0.5rem;
          font-weight: 700;
          font-size: 0.75rem;
          color: #5A7177;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-right: 1px solid #E2ECEF;
          display: flex;
          align-items: center;
          justifyContent: center;
        }

        .dia-columna-header {
          padding: 0.75rem 0.5rem;
          text-align: center;
          border-right: 1px solid #E2ECEF;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.2rem;
        }

        .dia-columna-header:last-child {
          border-right: none;
        }

        .dia-nombre-corto {
          font-size: 0.75rem;
          font-weight: 700;
          color: #5A7177;
          text-transform: uppercase;
        }

        .dia-numero-circulo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          font-size: 0.95rem;
          font-weight: 700;
          color: #1C2D37;
        }

        .dia-columna-header.dia-hoy .dia-numero-circulo {
          background-color: #0A6C84;
          color: #FFFFFF;
        }

        .dia-columna-header.dia-hoy .dia-nombre-corto {
          color: #0A6C84;
          font-weight: 800;
        }

        .dia-mes-sub {
          font-size: 0.72rem;
          color: #889DA2;
        }

        .calendario-grid-cuerpo {
          display: flex;
          flex-direction: column;
        }

        .calendario-fila-hora {
          display: grid;
          grid-template-columns: 70px repeat(7, 1fr);
          min-height: 85px;
          border-bottom: 1px solid #EBF2F4;
        }

        .calendario-fila-hora:last-child {
          border-bottom: none;
        }

        .columna-hora-etiqueta {
          padding: 0.5rem 0.35rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: #71878D;
          text-align: center;
          border-right: 1px solid #E2ECEF;
          background-color: #FAFCFD;
        }

        .calendario-celda {
          padding: 0.35rem;
          border-right: 1px solid #EBF2F4;
          background-color: #FFFFFF;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          overflow: hidden;
        }

        .calendario-celda:last-child {
          border-right: none;
        }

        .calendario-celda.celda-hoy {
          background-color: #F9FDFE;
        }

        .bloque-cita-grid {
          display: block;
          width: 100%;
          text-align: left;
          padding: 0.45rem 0.55rem;
          border-radius: 6px;
          border-top: 1px solid rgba(0,0,0,0.06);
          border-right: 1px solid rgba(0,0,0,0.06);
          border-bottom: 1px solid rgba(0,0,0,0.06);
          border-left-width: 4px;
          border-left-style: solid;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          transition: transform 0.12s ease, box-shadow 0.12s ease;
          font-family: inherit;
        }

        .bloque-cita-grid:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.08);
        }

        .bloque-cita-tiempo {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.72rem;
          font-weight: 700;
          margin-bottom: 0.2rem;
          gap: 0.25rem;
        }

        .bloque-cita-badge {
          font-size: 0.65rem;
          padding: 1px 4px;
          border-radius: 3px;
          font-weight: 600;
          white-space: nowrap;
        }

        .bloque-cita-paciente {
          font-size: 0.8rem;
          font-weight: 700;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .bloque-cita-especialidad {
          font-size: 0.72rem;
          opacity: 0.85;
          margin-top: 0.15rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ---------------- Vista Móvil (<= 640px) ---------------- */
        .vista-semanal-movil {
          display: none;
          flex-direction: column;
          gap: 1rem;
          width: 100%;
        }

        @media (max-width: 640px) {
          .vista-semanal-desktop {
            display: none !important;
          }

          .vista-semanal-movil {
            display: flex !important;
          }
        }

        .dia-movil-tarjeta {
          background-color: #FFFFFF;
          border-radius: 10px;
          border: 1px solid #DCE9ED;
          overflow: hidden;
          box-shadow: 0 2px 6px rgba(0,0,0,0.03);
        }

        .dia-movil-cabecera {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background-color: #F8FCFD;
          border-bottom: 1px solid #E2ECEF;
        }

        .dia-movil-cabecera.es-hoy {
          background-color: #EBF7FA;
          border-left: 4px solid #0A6C84;
        }

        .dia-movil-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .dia-movil-nombre {
          font-weight: 700;
          color: #1C2D37;
          font-size: 0.95rem;
        }

        .dia-movil-fecha {
          font-size: 0.85rem;
          color: #5A7177;
        }

        .badge-dia-hoy {
          background-color: #0A6C84;
          color: #FFFFFF;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .dia-movil-contador {
          font-size: 0.8rem;
          font-weight: 600;
          color: #0A6C84;
          background-color: #E2ECEF;
          padding: 2px 8px;
          border-radius: 12px;
        }

        .dia-movil-cuerpo {
          padding: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }

        .dia-movil-vacio {
          padding: 0.75rem;
          text-align: center;
          font-size: 0.85rem;
          color: #889DA2;
          font-style: italic;
        }

        .tarjeta-cita-movil {
          background-color: #FAFCFD;
          border: 1px solid #E2ECEF;
          border-left-width: 4px;
          border-left-style: solid;
          border-radius: 8px;
          padding: 0.75rem;
          cursor: pointer;
          min-height: 44px;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          transition: background-color 0.15s ease;
        }

        .tarjeta-cita-movil:active {
          background-color: #F1F7F9;
        }

        .cita-movil-fila1 {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .cita-movil-horario {
          font-size: 0.88rem;
          font-weight: 700;
          color: #0A6C84;
        }

        .cita-movil-fila2 {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.5rem;
        }

        .cita-movil-paciente strong {
          display: block;
          font-size: 0.92rem;
          color: #1C2D37;
        }

        .cita-movil-subinfo {
          font-size: 0.8rem;
          color: #5A7177;
          margin-top: 0.15rem;
        }

        .boton-ver-detalle-movil {
          background: none;
          border: none;
          color: #0A6C84;
          font-weight: 700;
          font-size: 0.85rem;
          padding: 0.4rem;
          cursor: pointer;
          min-height: 44px;
          min-width: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ---------------- Modal Detalle de Cita ---------------- */
        .modal-detalle-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .modal-detalle-card {
          max-width: 580px;
          width: 100%;
          background-color: #FFFFFF;
          border-radius: 14px;
          padding: 1.5rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-detalle-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.25rem;
          border-bottom: 1px solid #E2ECEF;
          padding-bottom: 0.85rem;
        }

        .boton-cerrar-modal {
          background: none;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          color: #5A7177;
          padding: 0.25rem;
          min-width: 36px;
          min-height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
        }

        .boton-cerrar-modal:hover {
          background-color: #F1F5F9;
        }

        .modal-detalle-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .modal-detalle-acciones {
          display: flex;
          gap: 0.65rem;
          flex-wrap: wrap;
          border-top: 1px solid #E2ECEF;
          padding-top: 1.25rem;
          align-items: center;
        }

        @media (max-width: 640px) {
          .modal-detalle-acciones {
            flex-direction: column;
            align-items: stretch;
          }

          .modal-detalle-acciones > * {
            width: 100% !important;
            min-height: 44px;
            justify-content: center;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}

