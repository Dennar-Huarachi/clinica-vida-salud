import React, { useState, useEffect } from 'react';
import api from '../../../compartido/utilidades/api';
import LayoutPrincipal from '../../../compartido/layouts/LayoutPrincipal';
import Alerta from '../../../compartido/componentes/Alerta';
import TablaExpandible from '../../../comun/componentes/TablaExpandible';

export default function PaginaReportes() {
  const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const hoy = new Date().toISOString().split('T')[0];

  const [fechaInicio, setFechaInicio] = useState(primerDiaMes);
  const [fechaFin, setFechaFin] = useState(hoy);
  const [idEspecialidad, setIdEspecialidad] = useState('');
  const [idMedico, setIdMedico] = useState('');
  const [idEstadoCita, setIdEstadoCita] = useState('');

  const [especialidades, setEspecialidades] = useState([]);
  const [medicos, setMedicos] = useState([]);

  const [tabActiva, setTabActiva] = useState('citas'); // 'citas' | 'asistencia'
  const [reporteCitas, setReporteCitas] = useState(null);
  const [reporteAsistencia, setReporteAsistencia] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [alerta, setAlerta] = useState(null);
  const [filtrosPlegados, setFiltrosPlegados] = useState(false);

  // Cargar catálogos para filtros
  useEffect(() => {
    api.get('/catalogos/especialidades')
      .then((res) => setEspecialidades(res.data?.datos || []))
      .catch(() => {});

    api.get('/catalogos/medicos')
      .then((res) => setMedicos(res.data?.datos || []))
      .catch(() => {});
  }, []);

  const consultarReportes = async () => {
    setCargando(true);
    setAlerta(null);

    const params = new URLSearchParams();
    if (fechaInicio) params.append('fecha_inicio', fechaInicio);
    if (fechaFin) params.append('fecha_fin', fechaFin);
    if (idEspecialidad) params.append('id_especialidad', idEspecialidad);
    if (idMedico) params.append('id_medico', idMedico);
    if (idEstadoCita) params.append('id_estado_cita', idEstadoCita);

    try {
      const [resCitas, resAsist] = await Promise.all([
        api.get(`/reportes/citas?${params.toString()}`),
        api.get(`/reportes/asistencia?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`),
      ]);

      setReporteCitas(resCitas.data?.datos || null);
      setReporteAsistencia(resAsist.data?.datos || null);
    } catch (err) {
      setAlerta({
        tipo: 'error',
        mensaje: err.response?.data?.mensaje || 'Error al obtener las estadísticas del período seleccionado.',
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    consultarReportes();
  }, []);

  const ejecutarExportacionCSV = async (tipo = 'citas') => {
    try {
      setExportando(true);
      setAlerta(null);

      const params = new URLSearchParams();
      params.append('tipo', tipo);
      if (fechaInicio) params.append('fecha_inicio', fechaInicio);
      if (fechaFin) params.append('fecha_fin', fechaFin);
      if (idEspecialidad) params.append('id_especialidad', idEspecialidad);
      if (idMedico) params.append('id_medico', idMedico);
      if (idEstadoCita) params.append('id_estado_cita', idEstadoCita);

      const response = await api.get(`/reportes/exportar?${params.toString()}`, {
        responseType: 'blob',
      });

      // Extraer nombre del archivo de cabeceras o generar nombre por defecto
      let filename = `reporte_${tipo}_${fechaInicio}_${fechaFin}.csv`;
      const disposition = response.headers['content-disposition'];
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setAlerta({
        tipo: 'exito',
        mensaje: `Archivo descargado exitosamente: ${filename}`,
      });
    } catch (err) {
      setAlerta({
        tipo: 'error',
        mensaje: 'Error al solicitar la exportación CSV al servidor.',
      });
    } finally {
      setExportando(false);
    }
  };

  const columnasCitas = [
    'Código Turno',
    'Paciente y CI',
    'Especialidad y Médico',
    'Fecha y Horario',
    'Estado Operativo',
    'Garantía (Bs)',
    '',
  ];

  const badgeEstado = (codigo, nombre) => {
    const c = (codigo || '').toLowerCase();
    if (c === 'atendida') return <span className="rep-badge badge-verde">Atendida</span>;
    if (c === 'programada' || c === 'confirmada') return <span className="rep-badge badge-azul">Programada</span>;
    if (c === 'en_espera' || c === 'en sala') return <span className="rep-badge badge-amarillo">En Sala</span>;
    if (c === 'inasistencia') return <span className="rep-badge badge-rojo">Inasistencia</span>;
    if (c === 'postergada') return <span className="rep-badge badge-naranja">Por Reubicar</span>;
    if (c === 'cancelada') return <span className="rep-badge badge-gris">Cancelada</span>;
    return <span className="rep-badge badge-azul">{nombre || codigo}</span>;
  };

  return (
    <LayoutPrincipal titulo="Reportes y Estadísticas">
      <div className="rep-contenedor">
        {alerta && (
          <div className="rep-alerta-box">
            <Alerta
              tipo={alerta.tipo}
              mensaje={alerta.mensaje}
              onCerrar={() => setAlerta(null)}
            />
          </div>
        )}

        {/* Encabezado y Botonera Superior */}
        <div className="rep-cabecera">
          <div>
            <span className="rep-subtitulo">Inteligencia Operativa y Cumplimiento</span>
            <h1 className="rep-titulo">Reportes y Estadísticas Clínicas</h1>
            <p className="rep-descripcion">
              Consolidación periódica de atenciones médicas, tasa de asistencia, ausentismo y exportación documental.
            </p>
          </div>

          <div className="rep-acciones-exportar">
            <button
              type="button"
              className="boton-primario rep-btn-exportar"
              onClick={() => ejecutarExportacionCSV('citas')}
              disabled={exportando || cargando}
            >
              {exportando ? 'Generando Archivo…' : '📥 Exportar Citas a CSV'}
            </button>
            <button
              type="button"
              className="boton-secundario rep-btn-exportar"
              onClick={() => ejecutarExportacionCSV('asistencia')}
              disabled={exportando || cargando}
            >
              📊 Exportar Cumplimiento a CSV
            </button>
          </div>
        </div>

        {/* Panel de Filtros Plegables */}
        <div className="tarjeta rep-tarjeta-filtros">
          <div className="filtros-cabecera" onClick={() => setFiltrosPlegados(!filtrosPlegados)}>
            <div className="filtros-titulo-wrapper">
              <span className="filtros-icono">🔍</span>
              <h2 className="filtros-titulo">Filtros de Período y Criterios Operacionales</h2>
            </div>
            <button
              type="button"
              className="filtros-toggle-btn"
              aria-label="Plegar o desplegar filtros"
            >
              {filtrosPlegados ? '▼ Desplegar Filtros' : '▲ Plegar Filtros'}
            </button>
          </div>

          {!filtrosPlegados && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                consultarReportes();
              }}
              className="filtros-formulario"
            >
              <div className="filtros-grilla">
                {/* Rango de fechas */}
                <div className="filtro-campo">
                  <label htmlFor="fecha_inicio" className="filtro-label">
                    Fecha Inicial <span className="requerido">*</span>
                  </label>
                  <input
                    type="date"
                    id="fecha_inicio"
                    className="filtro-control"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    required
                  />
                </div>

                <div className="filtro-campo">
                  <label htmlFor="fecha_fin" className="filtro-label">
                    Fecha Final <span className="requerido">*</span>
                  </label>
                  <input
                    type="date"
                    id="fecha_fin"
                    className="filtro-control"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    required
                  />
                </div>

                {/* Especialidad */}
                <div className="filtro-campo">
                  <label htmlFor="id_especialidad" className="filtro-label">
                    Especialidad Médica
                  </label>
                  <select
                    id="id_especialidad"
                    className="filtro-control"
                    value={idEspecialidad}
                    onChange={(e) => setIdEspecialidad(e.target.value)}
                  >
                    <option value="">Todas las especialidades</option>
                    {especialidades.map((esp) => (
                      <option key={esp.id_especialidad} value={esp.id_especialidad}>
                        {esp.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Médico */}
                <div className="filtro-campo">
                  <label htmlFor="id_medico" className="filtro-label">
                    Profesional Médico
                  </label>
                  <select
                    id="id_medico"
                    className="filtro-control"
                    value={idMedico}
                    onChange={(e) => setIdMedico(e.target.value)}
                  >
                    <option value="">Todos los profesionales</option>
                    {medicos.map((m) => (
                      <option key={m.id_medico} value={m.id_medico}>
                        Dr(a). {m.apellidos}, {m.nombres}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Estado de Cita */}
                <div className="filtro-campo">
                  <label htmlFor="id_estado_cita" className="filtro-label">
                    Estado de la Cita
                  </label>
                  <select
                    id="id_estado_cita"
                    className="filtro-control"
                    value={idEstadoCita}
                    onChange={(e) => setIdEstadoCita(e.target.value)}
                  >
                    <option value="">Todos los estados</option>
                    <option value="1">Pendiente</option>
                    <option value="2">Confirmada</option>
                    <option value="3">En Sala de Espera</option>
                    <option value="4">Atendida / Concluida</option>
                    <option value="5">Inasistencia</option>
                    <option value="6">Postergada por Contingencia</option>
                    <option value="7">Cancelada</option>
                  </select>
                </div>
              </div>

              <div className="filtros-acciones">
                <button
                  type="button"
                  className="boton-secundario filtro-btn"
                  onClick={() => {
                    setFechaInicio(primerDiaMes);
                    setFechaFin(hoy);
                    setIdEspecialidad('');
                    setIdMedico('');
                    setIdEstadoCita('');
                  }}
                >
                  Restablecer
                </button>
                <button
                  type="submit"
                  className="boton-primario filtro-btn"
                  disabled={cargando}
                >
                  {cargando ? 'Consultando…' : '🔍 Aplicar Filtros'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Pestañas de Navegación del Módulo */}
        <div className="rep-tabs-nav" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tabActiva === 'citas'}
            className={`rep-tab-btn ${tabActiva === 'citas' ? 'rep-tab-activa' : ''}`}
            onClick={() => setTabActiva('citas')}
          >
            📋 Reporte Operacional de Citas ({reporteCitas?.total_citas || 0})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tabActiva === 'asistencia'}
            className={`rep-tab-btn ${tabActiva === 'asistencia' ? 'rep-tab-activa' : ''}`}
            onClick={() => setTabActiva('asistencia')}
          >
            🎯 Asistencia y Efectividad Clínica ({reporteAsistencia?.porcentajes?.tasa_efectividad || 0}%)
          </button>
        </div>

        {/* PESTAÑA 1: REPORTE DE CITAS DETALLADO */}
        {tabActiva === 'citas' && (
          <div className="rep-seccion-contenido">
            {/* Tarjetas Cuantitativas de Citas */}
            <div className="rep-resumen-cards">
              <div className="rep-card-resumen">
                <span className="card-resumen-label">Total Citas en Período</span>
                <span className="card-resumen-valor color-verde">
                  {reporteCitas?.total_citas || 0}
                </span>
                <span className="card-resumen-sub">
                  Del {reporteCitas?.periodo?.inicio} al {reporteCitas?.periodo?.fin}
                </span>
              </div>

              <div className="rep-card-resumen">
                <span className="card-resumen-label">Desglose por Estado</span>
                <div className="mini-chips-estados">
                  {(reporteCitas?.por_estado || []).map((est) => (
                    <span key={est.estado_codigo} className="mini-chip">
                      <strong>{est.estado_nombre}:</strong> {est.total}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rep-card-resumen">
                <span className="card-resumen-label">Especialidades con Demanda</span>
                <span className="card-resumen-valor color-turquesa">
                  {reporteCitas?.por_especialidad?.length || 0}
                </span>
                <span className="card-resumen-sub">Especialidades activas en el período</span>
              </div>
            </div>

            {/* Listado Operacional de Citas mediante TablaExpandible */}
            <div className="rep-tabla-contenedor">
              <h2 className="rep-tabla-titulo">Listado Cronológico Detallado de Citas</h2>
              <TablaExpandible
                columnas={columnasCitas}
                datos={reporteCitas?.citas || []}
                cargando={cargando}
                obtenerClaveFila={(c) => c.id_cita}
                mensajeVacio="No se encontraron citas médicas en el rango cronológico y filtros seleccionados."
                renderFilaPrincipal={(c, isExpanded) => (
                  <>
                    <td>
                      <span className="rep-codigo-cita">{c.codigo_cita}</span>
                    </td>
                    <td>
                      <strong className="rep-paciente-nombre">{c.paciente_nombre}</strong>
                      <div className="rep-paciente-sub">CI: {c.paciente_ci || '—'} · Exp: {c.codigo_historia || '—'}</div>
                    </td>
                    <td>
                      <span className="rep-especialidad">{c.especialidad_nombre}</span>
                      <div className="rep-medico-sub">Dr(a). {c.medico_nombre}</div>
                    </td>
                    <td>
                      <span className="rep-fecha">{c.fecha_cita}</span>
                      <div className="rep-hora-sub">{c.hora_inicio} - {c.hora_fin}</div>
                    </td>
                    <td>
                      {badgeEstado(c.estado_codigo, c.estado_nombre)}
                    </td>
                    <td>
                      <strong className="rep-monto">
                        {c.monto_garantia ? `Bs. ${Number(c.monto_garantia).toFixed(2)}` : '—'}
                      </strong>
                      {c.estado_pago && (
                        <div className="rep-pago-sub">{c.estado_pago}</div>
                      )}
                    </td>
                    <td className="col-flecha">
                      <span className={`flecha-desplegar ${isExpanded ? 'rotada' : ''}`}>▼</span>
                    </td>
                  </>
                )}
                renderFilaMovil={(c, isExpanded) => (
                  <div className="tarjeta-cita-movil-rep">
                    <div className="cita-movil-rep-top">
                      <span className="rep-codigo-cita">{c.codigo_cita}</span>
                      {badgeEstado(c.estado_codigo, c.estado_nombre)}
                      <span className={`flecha-desplegar ${isExpanded ? 'rotada' : ''}`}>▼</span>
                    </div>
                    <div className="cita-movil-rep-mid">
                      <strong>{c.paciente_nombre}</strong>
                      <span>{c.especialidad_nombre} · Dr(a). {c.medico_nombre}</span>
                    </div>
                    <div className="cita-movil-rep-bot">
                      <span>📅 {c.fecha_cita} ({c.hora_inicio} - {c.hora_fin})</span>
                      {c.monto_garantia && <span>Garantía: Bs. {Number(c.monto_garantia).toFixed(2)}</span>}
                    </div>
                  </div>
                )}
                renderDetalle={(c) => (
                  <div className="subpanel-detalle-rep">
                    <div className="grid-subdetalle-rep">
                      <div>
                        <span className="subdetalle-etiqueta">Expediente Clínico:</span>
                        <strong className="subdetalle-valor">{c.codigo_historia || 'No asignado'}</strong>
                      </div>
                      <div>
                        <span className="subdetalle-etiqueta">Cédula del Paciente:</span>
                        <span className="subdetalle-valor">{c.paciente_ci || 'No registrada'}</span>
                      </div>
                      <div>
                        <span className="subdetalle-etiqueta">Estado Financiero de la Reserva:</span>
                        <span className="subdetalle-valor">
                          {c.estado_pago ? `Depósito ${c.estado_pago.toUpperCase()}` : 'Sin pago asociado'}
                        </span>
                      </div>
                      <div>
                        <span className="subdetalle-etiqueta">Identificador Interno de Cita:</span>
                        <span className="subdetalle-valor">Turno Nro. #{c.id_cita}</span>
                      </div>
                    </div>
                  </div>
                )}
              />
            </div>
          </div>
        )}

        {/* PESTAÑA 2: REPORTE DE ASISTENCIA Y EFECTIVIDAD */}
        {tabActiva === 'asistencia' && (
          <div className="rep-seccion-contenido">
            {/* Tarjetas KPI de Asistencia */}
            <div className="rep-resumen-cards">
              <div className="rep-card-resumen">
                <span className="card-resumen-label">Tasa de Cumplimiento / Efectividad</span>
                <span className="card-resumen-valor color-verde">
                  {reporteAsistencia?.porcentajes?.tasa_efectividad || 0}%
                </span>
                <span className="card-resumen-sub">
                  Fórmula: Atendidas / (Atendidas + Inasistencias)
                </span>
              </div>

              <div className="rep-card-resumen">
                <span className="card-resumen-label">Tasa de Ausentismo</span>
                <span className="card-resumen-valor color-rojo">
                  {reporteAsistencia?.porcentajes?.tasa_ausentismo || 0}%
                </span>
                <span className="card-resumen-sub">
                  {reporteAsistencia?.inasistencias || 0} inasistencia(s) no justificada(s)
                </span>
              </div>

              <div className="rep-card-resumen">
                <span className="card-resumen-label">Padrón de Pacientes</span>
                <span className="card-resumen-valor color-azul">
                  {reporteAsistencia?.pacientes?.total_empadronados || 0}
                </span>
                <span className="card-resumen-sub">
                  +{reporteAsistencia?.pacientes?.nuevos_periodo || 0} registrados en este período
                </span>
              </div>
            </div>

            {/* Desglose por Especialidad */}
            <div className="rep-bloque-desglose">
              <h2 className="rep-tabla-titulo">Cumplimiento y Ausentismo por Especialidad Médica</h2>
              <div className="rep-tabla-simple-wrapper">
                <table className="rep-tabla-simple">
                  <thead>
                    <tr>
                      <th>Especialidad</th>
                      <th>Total Citas</th>
                      <th>Atendidas</th>
                      <th>Inasistencias</th>
                      <th>Canceladas</th>
                      <th>Tasa Efectividad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reporteAsistencia?.desglose_por_especialidad || []).length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>
                          Sin registros de asistencia en el período.
                        </td>
                      </tr>
                    ) : (
                      reporteAsistencia.desglose_por_especialidad.map((esp) => (
                        <tr key={esp.id_especialidad}>
                          <td><strong>{esp.especialidad}</strong></td>
                          <td>{esp.total}</td>
                          <td style={{ color: '#166534', fontWeight: 600 }}>{esp.atendidas}</td>
                          <td style={{ color: '#991b1b', fontWeight: 600 }}>{esp.inasistencias}</td>
                          <td style={{ color: '#64748b' }}>{esp.canceladas}</td>
                          <td>
                            <strong style={{ color: esp.tasa_efectividad >= 80 ? '#166534' : '#d97706' }}>
                              {esp.tasa_efectividad}%
                            </strong>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Desglose por Médico */}
            <div className="rep-bloque-desglose">
              <h2 className="rep-tabla-titulo">Cumplimiento por Profesional Médico</h2>
              <div className="rep-tabla-simple-wrapper">
                <table className="rep-tabla-simple">
                  <thead>
                    <tr>
                      <th>Profesional Médico</th>
                      <th>Total Asignadas</th>
                      <th>Atendidas Concluidas</th>
                      <th>Inasistencias</th>
                      <th>Tasa Efectividad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reporteAsistencia?.desglose_por_medico || []).length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>
                          Sin atenciones concluidas para el filtro activo.
                        </td>
                      </tr>
                    ) : (
                      reporteAsistencia.desglose_por_medico.map((m) => (
                        <tr key={m.id_medico}>
                          <td><strong>Dr(a). {m.medico}</strong></td>
                          <td>{m.total}</td>
                          <td style={{ color: '#166534', fontWeight: 600 }}>{m.atendidas}</td>
                          <td style={{ color: '#991b1b', fontWeight: 600 }}>{m.inasistencias}</td>
                          <td>
                            <strong style={{ color: m.tasa_efectividad >= 80 ? '#166534' : '#d97706' }}>
                              {m.tasa_efectividad}%
                            </strong>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .rep-contenedor {
          max-width: 1140px;
          margin: 0 auto;
          padding: 0.5rem 0.5rem 3rem 0.5rem;
        }

        .rep-alerta-box {
          margin-bottom: 1.25rem;
        }

        .rep-cabecera {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .rep-subtitulo {
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--turquesa, #0d9488);
          display: block;
          margin-bottom: 0.2rem;
        }

        .rep-titulo {
          font-size: 1.65rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 0.25rem 0;
        }

        .rep-descripcion {
          font-size: 0.875rem;
          color: var(--texto-sec, #64748b);
          margin: 0;
          max-width: 650px;
        }

        .rep-acciones-exportar {
          display: flex;
          gap: 0.6rem;
          flex-wrap: wrap;
        }

        .rep-btn-exportar {
          min-height: 44px;
          padding: 0.6rem 1.2rem;
          font-size: 0.9rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        /* Tarjeta de Filtros */
        .rep-tarjeta-filtros {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid var(--borde, #e2e8f0);
          padding: 1.25rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        .filtros-cabecera {
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          user-select: none;
        }

        .filtros-titulo-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .filtros-icono { font-size: 1.2rem; }

        .filtros-titulo {
          font-size: 1rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .filtros-toggle-btn {
          background: none;
          border: none;
          color: var(--verde-azulado, #0f766e);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          min-height: 36px;
        }

        .filtros-formulario {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #f1f5f9;
        }

        .filtros-grilla {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1.25rem;
        }

        .filtro-campo {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .filtro-label {
          font-size: 0.825rem;
          font-weight: 600;
          color: #334155;
        }

        .requerido { color: #ef4444; }

        .filtro-control {
          width: 100%;
          min-height: 44px;
          padding: 0.6rem 0.8rem;
          border: 1px solid var(--borde, #cbd5e1);
          border-radius: 8px;
          font-size: 0.9rem;
          color: #1e293b;
          background: #ffffff;
          box-sizing: border-box;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .filtro-control:focus {
          outline: none;
          border-color: var(--turquesa, #0d9488);
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.15);
        }

        .filtros-acciones {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
        }

        .filtro-btn {
          min-height: 44px;
          padding: 0.6rem 1.4rem;
          font-size: 0.9rem;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
        }

        /* Pestañas */
        .rep-tabs-nav {
          display: flex;
          gap: 0.5rem;
          border-bottom: 2px solid #e2e8f0;
          margin-bottom: 1.5rem;
          overflow-x: auto;
        }

        .rep-tab-btn {
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

        .rep-tab-btn:hover { color: var(--verde-azulado, #0f766e); }
        .rep-tab-activa {
          color: var(--verde-azulado, #0f766e);
          border-bottom-color: var(--verde-azulado, #0f766e);
        }

        /* Tarjetas de Resumen */
        .rep-resumen-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .rep-card-resumen {
          background: #ffffff;
          border-radius: 10px;
          border: 1px solid var(--borde, #e2e8f0);
          padding: 1.25rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .card-resumen-label {
          font-size: 0.825rem;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
          letter-spacing: 0.4px;
        }

        .card-resumen-valor {
          font-size: 2rem;
          font-weight: 700;
          line-height: 1.1;
        }

        .color-verde { color: var(--verde-azulado, #0f766e); }
        .color-turquesa { color: var(--turquesa, #0d9488); }
        .color-rojo { color: #dc2626; }
        .color-azul { color: #0284c7; }

        .card-resumen-sub {
          font-size: 0.8rem;
          color: #64748b;
        }

        .mini-chips-estados {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          margin-top: 0.35rem;
        }

        .mini-chip {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 0.2rem 0.5rem;
          font-size: 0.775rem;
          color: #334155;
        }

        /* Tabla Contenedor */
        .rep-tabla-contenedor, .rep-bloque-desglose {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid var(--borde, #e2e8f0);
          padding: 1.35rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        .rep-tabla-titulo {
          font-size: 1.1rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 1rem 0;
        }

        .rep-codigo-cita {
          font-family: monospace;
          font-weight: 700;
          color: var(--verde-azulado, #0f766e);
          font-size: 0.885rem;
        }

        .rep-paciente-nombre { color: #1e293b; font-size: 0.9rem; }
        .rep-paciente-sub, .rep-medico-sub, .rep-hora-sub {
          font-size: 0.785rem;
          color: #64748b;
        }

        .rep-especialidad, .rep-fecha, .rep-monto {
          font-size: 0.885rem;
          color: #1e293b;
        }

        .rep-pago-sub {
          font-size: 0.75rem;
          color: #059669;
          font-weight: 600;
          text-transform: capitalize;
        }

        /* Fila Móvil de Citas */
        .tarjeta-cita-movil-rep {
          padding: 0.85rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .cita-movil-rep-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .cita-movil-rep-mid {
          display: flex;
          flex-direction: column;
          font-size: 0.885rem;
        }

        .cita-movil-rep-mid span {
          color: #64748b;
          font-size: 0.8rem;
        }

        .cita-movil-rep-bot {
          font-size: 0.8rem;
          color: #64748b;
          display: flex;
          justify-content: space-between;
        }

        /* Subpanel Detalle */
        .subpanel-detalle-rep {
          padding: 1rem 1.25rem;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
        }

        .grid-subdetalle-rep {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 0.85rem;
        }

        .subdetalle-etiqueta {
          display: block;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
          margin-bottom: 0.2rem;
        }

        .subdetalle-valor {
          font-size: 0.885rem;
          color: #1e293b;
        }

        /* Tabla Simple de Desglose */
        .rep-tabla-simple-wrapper {
          overflow-x: auto;
        }

        .rep-tabla-simple {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.885rem;
        }

        .rep-tabla-simple th {
          background: #f8fafc;
          padding: 0.75rem 1rem;
          text-align: left;
          font-weight: 700;
          color: #475569;
          border-bottom: 2px solid #e2e8f0;
        }

        .rep-tabla-simple td {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .rep-tabla-simple tr:hover td {
          background: #fafaf9;
        }

        /* Badges */
        .rep-badge {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.2rem 0.55rem;
          border-radius: 9999px;
          display: inline-block;
        }

        .badge-verde { background: #dcfce7; color: #166534; }
        .badge-azul { background: #e0f2fe; color: #0369a1; }
        .badge-amarillo { background: #fef9c3; color: #854d0e; }
        .badge-rojo { background: #fee2e2; color: #991b1b; }
        .badge-naranja { background: #ffedd5; color: #c2410c; }
        .badge-gris { background: #f1f5f9; color: #475569; }

        @media (max-width: 640px) {
          .rep-cabecera {
            flex-direction: column;
          }
          .rep-acciones-exportar {
            width: 100%;
          }
          .rep-btn-exportar {
            width: 100%;
          }
          .filtros-acciones {
            flex-direction: column-reverse;
          }
          .filtro-btn {
            width: 100%;
          }
        }
      `}</style>
    </LayoutPrincipal>
  );
}
