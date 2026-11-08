import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../compartido/utilidades/api';
import LayoutPrincipal from '../../../compartido/layouts/LayoutPrincipal';
import Alerta from '../../../compartido/componentes/Alerta';

export default function PaginaDashboard() {
  const [metricas, setMetricas] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [alerta, setAlerta] = useState(null);

  const cargarMetricas = async () => {
    try {
      setCargando(true);
      setAlerta(null);
      // Endpoint consolidado oficial CU-25 con fallback a /dashboard/metricas
      const res = await api.get('/reportes/dashboard').catch(() => api.get('/dashboard/metricas'));
      setMetricas(res.data?.datos || null);
    } catch (err) {
      setAlerta({
        tipo: 'error',
        mensaje: err.response?.data?.mensaje || 'Error al conectar con el servidor para consolidar indicadores ejecutivos.',
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarMetricas();
  }, []);

  const formatearMonto = (monto) => {
    return Number(monto || 0).toLocaleString('es-BO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const badgeEstadoCita = (codigo, nombre) => {
    const c = (codigo || '').toLowerCase();
    if (c === 'atendida') return <span className="dash-badge badge-verde">Atendida</span>;
    if (c === 'programada' || c === 'confirmada') return <span className="dash-badge badge-azul">Programada</span>;
    if (c === 'en_espera' || c === 'en sala') return <span className="dash-badge badge-amarillo">En Sala</span>;
    if (c === 'inasistencia') return <span className="dash-badge badge-rojo">Inasistencia</span>;
    if (c === 'postergada') return <span className="dash-badge badge-naranja">Por Reubicar</span>;
    if (c === 'cancelada') return <span className="dash-badge badge-gris">Cancelada</span>;
    return <span className="dash-badge badge-azul">{nombre || codigo}</span>;
  };

  if (cargando) {
    return (
      <LayoutPrincipal titulo="Panel de Control General">
        <div className="dash-cargando">
          <div className="dash-spinner" />
          <p>Consolidando métricas operacionales e indicadores de gestión en tiempo real…</p>
        </div>
        <style>{`
          .dash-cargando {
            text-align: center;
            padding: 4rem 1rem;
            color: var(--texto-sec, #64748b);
          }
          .dash-spinner {
            width: 44px;
            height: 44px;
            border: 4px solid #e2e8f0;
            border-top: 4px solid var(--verde-azulado, #0f766e);
            border-radius: 50%;
            animation: dashGirar 0.85s linear infinite;
            margin: 0 auto 1.25rem auto;
          }
          @keyframes dashGirar {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </LayoutPrincipal>
    );
  }

  const kpis = metricas?.kpis || {};
  const estadosMes = metricas?.estados_mes || [];
  const porEspecialidad = metricas?.por_especialidad || [];
  const ultimasCitas = metricas?.ultimas_citas || [];
  const ultimosEventos = metricas?.ultimos_eventos_auditoria || [];

  return (
    <LayoutPrincipal titulo="Panel de Control General">
      <div className="dash-contenedor">
        {alerta && (
          <div className="mb-4">
            <Alerta
              tipo={alerta.tipo}
              mensaje={alerta.mensaje}
              onCerrar={() => setAlerta(null)}
            />
          </div>
        )}

        {/* Barra superior ejecutiva */}
        <div className="dash-cabecera">
          <div>
            <span className="dash-subtitulo">
              Clínica Vida Salud · Monitoreo y Dirección Estratégica
            </span>
            <h1 className="dash-titulo">Tablero de Gestión y Analítica</h1>
            <p className="dash-fecha-actual">
              📅 Actualizado al {metricas?.fecha_actual || new Date().toISOString().split('T')[0]}
            </p>
          </div>

          <div className="dash-acciones-rapidas">
            <Link to="/citas/reserva" className="boton-primario dash-btn">
              + Nueva Cita Médica
            </Link>
            <Link to="/reportes" className="boton-secundario dash-btn">
              📊 Explorar Reportes
            </Link>
            <Link to="/auditoria" className="boton-terciario dash-btn">
              🛡️ Bitácora Forense
            </Link>
          </div>
        </div>

        {/* 1. Grilla de Tarjetas KPI Primarias */}
        <div className="dash-kpis-grilla">
          {/* Citas de Hoy */}
          <div className="dash-kpi-tarjeta borde-verde">
            <div className="kpi-top">
              <span className="kpi-icono">📅</span>
              <span className="kpi-label">Citas del Día de Hoy</span>
            </div>
            <div className="kpi-valor color-verde">{kpis.citas_hoy || 0}</div>
            <div className="kpi-subdetalle">
              <span className="sub-atendidas">{kpis.citas_atendidas_hoy || 0} atendidas</span>
              <span className="separador">·</span>
              <span className="sub-pendientes">{kpis.citas_pendientes_hoy || 0} pendientes</span>
            </div>
          </div>

          {/* Tasa de Efectividad */}
          <div className="dash-kpi-tarjeta borde-turquesa">
            <div className="kpi-top">
              <span className="kpi-icono">🎯</span>
              <span className="kpi-label">Tasa de Cumplimiento (Mes)</span>
            </div>
            <div className="kpi-valor color-turquesa">
              {kpis.tasa_efectividad_asistencia || 0}%
            </div>
            <div className="kpi-subdetalle">
              <span className="sub-formula">Efectividad = Atendidas / (Atendidas + Inasistencias)</span>
            </div>
          </div>

          {/* Tasa de Ausentismo */}
          <div className="dash-kpi-tarjeta borde-naranja">
            <div className="kpi-top">
              <span className="kpi-icono">⚠️</span>
              <span className="kpi-label">Tasa de Ausentismo (Mes)</span>
            </div>
            <div className="kpi-valor color-naranja">
              {kpis.tasa_ausentismo || 0}%
            </div>
            <div className="kpi-subdetalle">
              <span>{kpis.citas_canceladas_hoy || 0} cancelada(s) hoy</span>
            </div>
          </div>

          {/* Padrón de Pacientes */}
          <div className="dash-kpi-tarjeta borde-azul">
            <div className="kpi-top">
              <span className="kpi-icono">👥</span>
              <span className="kpi-label">Pacientes Empadronados</span>
            </div>
            <div className="kpi-valor color-azul">{kpis.total_pacientes || 0}</div>
            <div className="kpi-subdetalle">
              <span className="badge-nuevos">+{kpis.pacientes_nuevos_mes || 0} nuevos este mes</span>
            </div>
          </div>

          {/* Demanda Semanal y Mensual */}
          <div className="dash-kpi-tarjeta borde-indigo">
            <div className="kpi-top">
              <span className="kpi-icono">📈</span>
              <span className="kpi-label">Volumen Agendado Activo</span>
            </div>
            <div className="kpi-valor color-indigo">{kpis.citas_semana || 0}</div>
            <div className="kpi-subdetalle">
              <span>{kpis.citas_mes || 0} citas en el mes en curso</span>
            </div>
          </div>

          {/* Garantías y Finanzas */}
          <div className="dash-kpi-tarjeta borde-esmeralda">
            <div className="kpi-top">
              <span className="kpi-icono">💳</span>
              <span className="kpi-label">Depósitos de Garantía</span>
            </div>
            <div className="kpi-valor color-esmeralda">
              Bs. {formatearMonto(kpis.ingresos_garantia)}
            </div>
            <div className="kpi-subdetalle">
              <span>Retenciones por penalidad: Bs. {formatearMonto(kpis.penalizacionesRetenidas)}</span>
            </div>
          </div>
        </div>

        {/* 2. Sección Gráfica y Distribuciones */}
        <div className="dash-seccion-graficos">
          {/* Distribución por Estado en el Mes */}
          <div className="dash-panel-grafico">
            <div className="panel-grafico-cabecera">
              <h2 className="panel-grafico-titulo">Desglose de Estados de Citas en el Mes</h2>
              <span className="panel-grafico-sub">Total: {kpis.citas_mes || 0} registradas</span>
            </div>
            <div className="lista-barras-progreso">
              {estadosMes.length === 0 ? (
                <p className="texto-vacio-grafico">Sin citas en el período actual.</p>
              ) : (
                estadosMes.map((est) => {
                  const totalMes = kpis.citas_mes || 1;
                  const pct = Math.round(((est.total || 0) / totalMes) * 100);
                  return (
                    <div key={est.codigo} className="fila-barra-distribucion">
                      <div className="barra-info-top">
                        <span className="barra-label">{est.nombre}</span>
                        <span className="barra-conteo">
                          <strong>{est.total}</strong> ({pct}%)
                        </span>
                      </div>
                      <div className="barra-track">
                        <div
                          className={`barra-fill fill-${est.codigo.toLowerCase()}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Top Especialidades con Mayor Demanda */}
          <div className="dash-panel-grafico">
            <div className="panel-grafico-cabecera">
              <h2 className="panel-grafico-titulo">Top Especialidades con Mayor Demanda</h2>
              <span className="panel-grafico-sub">{kpis.total_especialidades || 0} especialidades activas</span>
            </div>
            <div className="lista-barras-progreso">
              {porEspecialidad.length === 0 ? (
                <p className="texto-vacio-grafico">No hay registros de citas por especialidad este mes.</p>
              ) : (
                porEspecialidad.map((esp, idx) => (
                  <div key={esp.especialidad} className="fila-barra-distribucion">
                    <div className="barra-info-top">
                      <span className="barra-label">
                        #{idx + 1} {esp.especialidad}
                      </span>
                      <span className="barra-conteo">
                        <strong>{esp.total}</strong> citas ({esp.porcentaje || 0}%)
                      </span>
                    </div>
                    <div className="barra-track">
                      <div
                        className="barra-fill fill-turquesa"
                        style={{ width: `${Math.min(esp.porcentaje || 0, 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 3. Sección de Actividad Operativa y Auditoría Reciente */}
        <div className="dash-seccion-tablas">
          {/* Últimas Citas Agendadas */}
          <div className="dash-tarjeta-feed">
            <div className="feed-cabecera">
              <h2 className="feed-titulo">Turnos y Citas Médicas Recientes</h2>
              <Link to="/admin/citas" className="feed-enlace">
                Ver Todas →
              </Link>
            </div>
            {ultimasCitas.length === 0 ? (
              <div className="feed-vacio">No hay citas médicas agendadas recientemente.</div>
            ) : (
              <div className="feed-lista-citas">
                {ultimasCitas.map((c) => (
                  <div key={c.id_cita} className="feed-item-cita">
                    <div className="cita-item-left">
                      <span className="cita-item-codigo">{c.codigo_cita}</span>
                      <strong className="cita-item-paciente">{c.paciente}</strong>
                      <span className="cita-item-sub">
                        {c.especialidad} · {c.medico}
                      </span>
                    </div>
                    <div className="cita-item-right">
                      <span className="cita-item-hora">
                        📅 {c.fecha_cita} ({c.hora_inicio ? c.hora_inicio.slice(0, 5) : '—'})
                      </span>
                      {badgeEstadoCita(c.estado_codigo, c.estado_nombre)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actividad Reciente de Auditoría Forense (RN21) */}
          <div className="dash-tarjeta-feed">
            <div className="feed-cabecera">
              <h2 className="feed-titulo">Actividad y Auditoría Reciente</h2>
              <Link to="/auditoria" className="feed-enlace">
                Explorar Bitácora →
              </Link>
            </div>
            {ultimosEventos.length === 0 ? (
              <div className="feed-vacio">No hay eventos recientes registrados en la bitácora.</div>
            ) : (
              <div className="feed-lista-eventos">
                {ultimosEventos.map((ev) => (
                  <div key={ev.id_bitacora} className="feed-item-evento">
                    <div className="evento-top">
                      <span className="evento-accion-badge">{ev.accion}</span>
                      <span className="evento-fecha">
                        {ev.fecha_hora ? new Date(ev.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                      </span>
                    </div>
                    <div className="evento-cuerpo">
                      <span className="evento-usuario">
                        👤 <strong>{ev.nombre_usuario ? `@${ev.nombre_usuario}` : 'Sistema Automático'}</strong>
                      </span>
                      {ev.tabla_afectada && (
                        <span className="evento-tabla">en tabla <code>{ev.tabla_afectada}</code></span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .dash-contenedor {
          max-width: 1140px;
          margin: 0 auto;
          padding: 0.5rem 0.5rem 3rem 0.5rem;
        }

        .dash-cabecera {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .dash-subtitulo {
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--turquesa, #0d9488);
          display: block;
          margin-bottom: 0.2rem;
        }

        .dash-titulo {
          font-size: 1.65rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 0.25rem 0;
        }

        .dash-fecha-actual {
          font-size: 0.875rem;
          color: var(--texto-sec, #64748b);
          margin: 0;
        }

        .dash-acciones-rapidas {
          display: flex;
          gap: 0.6rem;
          flex-wrap: wrap;
        }

        .dash-btn {
          min-height: 44px;
          padding: 0.6rem 1.15rem;
          font-size: 0.9rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          text-decoration: none;
          transition: all 0.15s ease;
        }

        /* Grilla KPIs */
        .dash-kpis-grilla {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1rem;
          margin-bottom: 1.75rem;
        }

        .dash-kpi-tarjeta {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid var(--borde, #e2e8f0);
          padding: 1.25rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .dash-kpi-tarjeta:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0,0,0,0.05);
        }

        .borde-verde { border-top: 4px solid var(--verde-azulado, #0f766e); }
        .borde-turquesa { border-top: 4px solid var(--turquesa, #0d9488); }
        .borde-naranja { border-top: 4px solid #ea580c; }
        .borde-azul { border-top: 4px solid #0284c7; }
        .borde-indigo { border-top: 4px solid #6366f1; }
        .borde-esmeralda { border-top: 4px solid #059669; }

        .kpi-top {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .kpi-icono { font-size: 1.2rem; }
        .kpi-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #475569;
        }

        .kpi-valor {
          font-size: 2.15rem;
          font-weight: 700;
          line-height: 1.1;
          margin: 0.25rem 0 0.5rem 0;
        }

        .color-verde { color: var(--verde-azulado, #0f766e); }
        .color-turquesa { color: var(--turquesa, #0d9488); }
        .color-naranja { color: #ea580c; }
        .color-azul { color: #0284c7; }
        .color-indigo { color: #6366f1; }
        .color-esmeralda { color: #059669; }

        .kpi-subdetalle {
          font-size: 0.8rem;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          flex-wrap: wrap;
        }

        .sub-atendidas { color: #166534; font-weight: 600; }
        .sub-pendientes { color: #0369a1; font-weight: 600; }
        .sub-formula { font-size: 0.75rem; color: #64748b; font-style: italic; }
        .badge-nuevos {
          background: #e0f2fe;
          color: #0369a1;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.15rem 0.5rem;
          border-radius: 9999px;
        }

        /* Sección Gráficos */
        .dash-seccion-graficos {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 1.25rem;
          margin-bottom: 1.75rem;
        }

        .dash-panel-grafico {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid var(--borde, #e2e8f0);
          padding: 1.35rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        .panel-grafico-cabecera {
          margin-bottom: 1.15rem;
          padding-bottom: 0.65rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .panel-grafico-titulo {
          font-size: 1.05rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 0.2rem 0;
        }

        .panel-grafico-sub {
          font-size: 0.8rem;
          color: #64748b;
        }

        .lista-barras-progreso {
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
        }

        .fila-barra-distribucion {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .barra-info-top {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
        }

        .barra-label {
          color: #334155;
          font-weight: 600;
        }

        .barra-conteo {
          color: #64748b;
        }

        .barra-track {
          width: 100%;
          height: 8px;
          background: #f1f5f9;
          border-radius: 9999px;
          overflow: hidden;
        }

        .barra-fill {
          height: 100%;
          border-radius: 9999px;
          transition: width 0.4s ease-in-out;
        }

        .fill-turquesa { background: var(--turquesa, #0d9488); }
        .fill-atendida { background: #10b981; }
        .fill-confirmada, .fill-programada { background: #0284c7; }
        .fill-en_espera { background: #f59e0b; }
        .fill-inasistencia { background: #ef4444; }
        .fill-postergada { background: #f97316; }
        .fill-cancelada { background: #94a3b8; }

        /* Sección de Tablas y Feeds */
        .dash-seccion-tablas {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 1.25rem;
        }

        .dash-tarjeta-feed {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid var(--borde, #e2e8f0);
          padding: 1.35rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        .feed-cabecera {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.65rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .feed-titulo {
          font-size: 1.05rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .feed-enlace {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--verde-azulado, #0f766e);
          text-decoration: none;
        }

        .feed-enlace:hover {
          text-decoration: underline;
        }

        .feed-vacio {
          text-align: center;
          padding: 2rem 1rem;
          color: #94a3b8;
          font-size: 0.9rem;
        }

        .feed-lista-citas {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .feed-item-cita {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          border-radius: 8px;
          background: #f8fafc;
          border: 1px solid #f1f5f9;
        }

        .cita-item-left {
          display: flex;
          flex-direction: column;
        }

        .cita-item-codigo {
          font-family: monospace;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--verde-azulado, #0f766e);
        }

        .cita-item-paciente {
          font-size: 0.9rem;
          color: #1e293b;
        }

        .cita-item-sub {
          font-size: 0.785rem;
          color: #64748b;
        }

        .cita-item-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.35rem;
        }

        .cita-item-hora {
          font-size: 0.785rem;
          color: #64748b;
        }

        /* Feeds de Auditoría */
        .feed-lista-eventos {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }

        .feed-item-evento {
          padding: 0.75rem;
          background: #fafaf9;
          border-radius: 8px;
          border: 1px solid #f5f5f4;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .evento-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .evento-accion-badge {
          background: #e0e7ff;
          color: #3730a3;
          font-size: 0.725rem;
          font-weight: 700;
          padding: 0.15rem 0.5rem;
          border-radius: 4px;
        }

        .evento-fecha {
          font-size: 0.75rem;
          color: #78716c;
        }

        .evento-cuerpo {
          font-size: 0.825rem;
          color: #44403c;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .evento-tabla code {
          background: #f1f5f9;
          padding: 0.1rem 0.3rem;
          border-radius: 4px;
          font-size: 0.75rem;
        }

        /* Badges de Citas */
        .dash-badge {
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
          .dash-cabecera {
            flex-direction: column;
          }
          .dash-acciones-rapidas {
            width: 100%;
          }
          .dash-btn {
            width: 100%;
          }
          .feed-item-cita {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
          .cita-item-right {
            align-items: flex-start;
          }
        }
      `}</style>
    </LayoutPrincipal>
  );
}
