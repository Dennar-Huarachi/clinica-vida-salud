import React, { useState, useEffect } from 'react';
import api from '../../../compartido/utilidades/api';
import LayoutPrincipal from '../../../compartido/layouts/LayoutPrincipal';
import Alerta from '../../../compartido/componentes/Alerta';
import TablaExpandible from '../../../comun/componentes/TablaExpandible';

export default function PaginaAuditoria() {
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [alerta, setAlerta] = useState(null);

  // Filtros de búsqueda
  const [usuarioFiltro, setUsuarioFiltro] = useState('');
  const [accionFiltro, setAccionFiltro] = useState('');
  const [casoUsoFiltro, setCasoUsoFiltro] = useState('');
  const [tablaFiltro, setTablaFiltro] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const cargarBitacora = async (filtrosSobrescritos = null) => {
    setCargando(true);
    setAlerta(null);

    const u = filtrosSobrescritos ? filtrosSobrescritos.usuario : usuarioFiltro;
    const a = filtrosSobrescritos ? filtrosSobrescritos.accion : accionFiltro;
    const c = filtrosSobrescritos ? filtrosSobrescritos.casoUso : casoUsoFiltro;
    const t = filtrosSobrescritos ? filtrosSobrescritos.tabla : tablaFiltro;
    const fi = filtrosSobrescritos ? filtrosSobrescritos.fechaInicio : fechaInicio;
    const ff = filtrosSobrescritos ? filtrosSobrescritos.fechaFin : fechaFin;

    const params = new URLSearchParams();
    if (u && u.trim()) params.append('usuario', u.trim());
    if (a && a.trim()) params.append('accion', a.trim());
    if (c && c.trim()) params.append('caso_uso', c.trim());
    if (t && t.trim()) params.append('tabla_afectada', t.trim());
    if (fi) params.append('fecha_inicio', fi);
    if (ff) params.append('fecha_fin', ff);
    params.append('limite', '200');

    try {
      let res;
      try {
        res = await api.get(`/auditoria?${params.toString()}`);
      } catch (ePrimario) {
        res = await api.get(`/auditoria/bitacora?${params.toString()}`);
      }
      setRegistros(res.data?.datos || []);
    } catch (err) {
      setAlerta({
        tipo: 'error',
        mensaje: err.response?.data?.mensaje || 'Error al consultar los registros inmutables de la bitácora de auditoría.',
      });
    } finally {
      setCargando(false);
    }
  };

  const handleLimpiarFiltros = () => {
    setUsuarioFiltro('');
    setAccionFiltro('');
    setCasoUsoFiltro('');
    setTablaFiltro('');
    setFechaInicio('');
    setFechaFin('');
    cargarBitacora({
      usuario: '',
      accion: '',
      casoUso: '',
      tabla: '',
      fechaInicio: '',
      fechaFin: '',
    });
  };

  useEffect(() => {
    cargarBitacora();
  }, []);

  const badgeAccion = (accion) => {
    const act = (accion || '').toUpperCase();
    if (act.includes('INSERT') || act.includes('CREAR') || act.includes('REGISTR')) {
      return <span className="audi-badge badge-insert">{accion}</span>;
    }
    if (act.includes('UPDATE') || act.includes('MODIFICAR') || act.includes('EDITAR') || act.includes('CAMBIO')) {
      return <span className="audi-badge badge-update">{accion}</span>;
    }
    if (act.includes('DELETE') || act.includes('ELIMINAR') || act.includes('CANCEL')) {
      return <span className="audi-badge badge-delete">{accion}</span>;
    }
    if (act.includes('LOGIN') || act.includes('SESION') || act.includes('ACCESO')) {
      return <span className="audi-badge badge-auth">{accion}</span>;
    }
    if (act.includes('EXPORT') || act.includes('DESCARGA')) {
      return <span className="audi-badge badge-export">{accion}</span>;
    }
    return <span className="audi-badge badge-default">{accion}</span>;
  };

  const humanizarCasoUso = (casoUso) => {
    if (!casoUso) return 'Sistema General';
    const cu = casoUso.replace(/^CU\d+_?/i, '');
    // Separar PascalCase o camelCase con espacios legibles
    return cu.replace(/([A-Z])/g, ' $1').trim() || casoUso;
  };

  const columnas = [
    'Fecha y Hora',
    'Usuario Responsable',
    'Evento / Acción',
    'Módulo Operacional',
    'IP de Origen',
    '',
  ];

  return (
    <LayoutPrincipal titulo="Bitácora de Auditoría Forense">
      <div className="audi-contenedor">
        {alerta && (
          <div className="audi-alerta-box">
            <Alerta
              tipo={alerta.tipo}
              mensaje={alerta.mensaje}
              onCerrar={() => setAlerta(null)}
            />
          </div>
        )}

        {/* Cabecera */}
        <div className="audi-cabecera">
          <div>
            <span className="audi-subtitulo">Seguridad y Trazabilidad Inmutable</span>
            <h1 className="audi-titulo">Bitácora de Auditoría del Sistema</h1>
            <p className="audi-descripcion">
              Registro estricto y de solo lectura de todas las operaciones, autenticaciones, transacciones y mutaciones de estado clínico.
            </p>
          </div>

          <div className="audi-kpi-eventos">
            <span className="kpi-eventos-numero">{registros.length}</span>
            <span className="kpi-eventos-label">Eventos Filtrados</span>
          </div>
        </div>

        {/* Tarjeta de Filtros */}
        <div className="tarjeta audi-tarjeta-filtros">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              cargarBitacora();
            }}
            className="audi-formulario-filtros"
          >
            <div className="audi-filtros-grilla">
              {/* Usuario */}
              <div className="filtro-item">
                <label htmlFor="filtro-usuario" className="filtro-etiqueta">
                  Usuario o Correo
                </label>
                <input
                  type="text"
                  id="filtro-usuario"
                  className="filtro-input"
                  placeholder="Ej: admin, dr.rodriguez..."
                  value={usuarioFiltro}
                  onChange={(e) => setUsuarioFiltro(e.target.value)}
                />
              </div>

              {/* Acción / Evento */}
              <div className="filtro-item">
                <label htmlFor="filtro-accion" className="filtro-etiqueta">
                  Acción o Evento
                </label>
                <input
                  type="text"
                  id="filtro-accion"
                  className="filtro-input"
                  placeholder="Ej: LOGIN, INSERT, CAMBIO_ESTADO..."
                  value={accionFiltro}
                  onChange={(e) => setAccionFiltro(e.target.value)}
                />
              </div>

              {/* Módulo / Caso de uso */}
              <div className="filtro-item">
                <label htmlFor="filtro-modulo" className="filtro-etiqueta">
                  Módulo o Caso de Uso
                </label>
                <input
                  type="text"
                  id="filtro-modulo"
                  className="filtro-input"
                  placeholder="Ej: Citas, HistoriaClinica..."
                  value={casoUsoFiltro}
                  onChange={(e) => setCasoUsoFiltro(e.target.value)}
                />
              </div>

              {/* Tabla Afectada */}
              <div className="filtro-item">
                <label htmlFor="filtro-tabla" className="filtro-etiqueta">
                  Tabla de Base de Datos
                </label>
                <input
                  type="text"
                  id="filtro-tabla"
                  className="filtro-input"
                  placeholder="Ej: citas, atenciones_clinicas..."
                  value={tablaFiltro}
                  onChange={(e) => setTablaFiltro(e.target.value)}
                />
              </div>

              {/* Fecha Inicio */}
              <div className="filtro-item">
                <label htmlFor="filtro-desde" className="filtro-etiqueta">
                  Fecha Desde
                </label>
                <input
                  type="date"
                  id="filtro-desde"
                  className="filtro-input"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </div>

              {/* Fecha Fin */}
              <div className="filtro-item">
                <label htmlFor="filtro-hasta" className="filtro-etiqueta">
                  Fecha Hasta
                </label>
                <input
                  type="date"
                  id="filtro-hasta"
                  className="filtro-input"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                />
              </div>
            </div>

            <div className="audi-filtros-acciones">
              <button
                type="button"
                className="boton-secundario audi-btn"
                onClick={handleLimpiarFiltros}
              >
                Limpiar Criterios
              </button>
              <button
                type="submit"
                className="boton-primario audi-btn"
                disabled={cargando}
              >
                {cargando ? 'Buscando…' : '🔍 Aplicar Búsqueda'}
              </button>
            </div>
          </form>
        </div>

        {/* Tabla Expandible Obligatoria de Auditoría */}
        <div className="audi-tabla-wrapper">
          <TablaExpandible
            columnas={columnas}
            datos={registros}
            cargando={cargando}
            obtenerClaveFila={(r) => r.id_bitacora}
            mensajeVacio="No se encontraron eventos registrados en la bitácora para los criterios seleccionados."
            renderFilaPrincipal={(r, isExpanded) => (
              <>
                <td>
                  <strong className="audi-fecha">{r.fecha_hora}</strong>
                  <div className="audi-id-sub">Evento #{r.id_bitacora}</div>
                </td>
                <td>
                  <div className="audi-usuario-contenedor">
                    <strong className="audi-usuario-nombre">
                      {r.nombre_usuario ? `@${r.nombre_usuario}` : 'Sistema Automático'}
                    </strong>
                    {r.usuario_rol && (
                      <span className="audi-usuario-rol">{r.usuario_rol}</span>
                    )}
                  </div>
                </td>
                <td>
                  {badgeAccion(r.accion)}
                  {r.tabla_afectada && (
                    <div className="audi-tabla-sub">
                      Tabla: <code>{r.tabla_afectada}</code>
                      {r.registro_id && <span> (ID: {r.registro_id})</span>}
                    </div>
                  )}
                </td>
                <td>
                  <span className="audi-modulo">{humanizarCasoUso(r.caso_uso)}</span>
                </td>
                <td>
                  <span className="audi-ip">🌐 {r.ip_origen || 'Local'}</span>
                </td>
                <td className="col-flecha">
                  <span className={`flecha-desplegar ${isExpanded ? 'rotada' : ''}`}>▼</span>
                </td>
              </>
            )}
            renderFilaMovil={(r, isExpanded) => (
              <div className="tarjeta-audi-movil">
                <div className="audi-movil-top">
                  <span className="audi-movil-id">#{r.id_bitacora}</span>
                  {badgeAccion(r.accion)}
                  <span className={`flecha-desplegar ${isExpanded ? 'rotada' : ''}`}>▼</span>
                </div>
                <div className="audi-movil-mid">
                  <strong>{r.nombre_usuario ? `@${r.nombre_usuario}` : 'Sistema'}</strong>
                  <span>{humanizarCasoUso(r.caso_uso)}</span>
                </div>
                <div className="audi-movil-bot">
                  <span>📅 {r.fecha_hora}</span>
                  <span>🌐 {r.ip_origen || 'Local'}</span>
                </div>
              </div>
            )}
            renderDetalle={(r) => (
              <div className="subpanel-detalle-audi">
                <div className="subpanel-audi-cabecera">
                  <div>
                    <span className="subpanel-audi-etiqueta">Detalle Forense del Evento</span>
                    <h3 className="subpanel-audi-titulo">
                      Registro Inmutable de Auditoría Nro. #{r.id_bitacora}
                    </h3>
                  </div>
                  <div className="subpanel-audi-meta">
                    <span>IP: <strong>{r.ip_origen || 'Local'}</strong></span>
                    {r.user_agent && (
                      <span className="subpanel-user-agent" title={r.user_agent}>
                        Agente: {r.user_agent.slice(0, 60)}…
                      </span>
                    )}
                  </div>
                </div>

                {/* Visor de Datos Anteriores y Nuevos (JSON) */}
                <div className="subpanel-audi-json-grilla">
                  {/* Datos Anteriores */}
                  <div className="bloque-json-visor">
                    <span className="visor-json-titulo">Estado Previo (datos_anteriores):</span>
                    {r.datos_anteriores ? (
                      <pre className="visor-json-codigo">
                        {JSON.stringify(r.datos_anteriores, null, 2)}
                      </pre>
                    ) : (
                      <div className="visor-json-vacio">
                        No registra datos previos (Operación de creación / inserción inicial).
                      </div>
                    )}
                  </div>

                  {/* Datos Nuevos */}
                  <div className="bloque-json-visor">
                    <span className="visor-json-titulo">Estado Posterior / Parámetros (datos_nuevos):</span>
                    {r.datos_nuevos ? (
                      <pre className="visor-json-codigo codigo-nuevo">
                        {JSON.stringify(r.datos_nuevos, null, 2)}
                      </pre>
                    ) : (
                      <div className="visor-json-vacio">
                        Sin carga de datos posteriores asociada.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          />
        </div>
      </div>

      <style>{`
        .audi-contenedor {
          max-width: 1140px;
          margin: 0 auto;
          padding: 0.5rem 0.5rem 3rem 0.5rem;
        }

        .audi-alerta-box {
          margin-bottom: 1.25rem;
        }

        .audi-cabecera {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .audi-subtitulo {
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--turquesa, #0d9488);
          display: block;
          margin-bottom: 0.2rem;
        }

        .audi-titulo {
          font-size: 1.65rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 0.25rem 0;
        }

        .audi-descripcion {
          font-size: 0.875rem;
          color: var(--texto-sec, #64748b);
          margin: 0;
          max-width: 650px;
        }

        .audi-kpi-eventos {
          background: #ffffff;
          border: 1px solid var(--borde, #e2e8f0);
          border-radius: 12px;
          padding: 0.85rem 1.4rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        .kpi-eventos-numero {
          font-size: 1.85rem;
          font-weight: 700;
          color: var(--verde-azulado, #0f766e);
          line-height: 1.1;
        }

        .kpi-eventos-label {
          font-size: 0.775rem;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
        }

        /* Tarjeta de Filtros */
        .audi-tarjeta-filtros {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid var(--borde, #e2e8f0);
          padding: 1.25rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        .audi-filtros-grilla {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
          margin-bottom: 1.25rem;
        }

        .filtro-item {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .filtro-etiqueta {
          font-size: 0.8rem;
          font-weight: 600;
          color: #334155;
        }

        .filtro-input {
          width: 100%;
          min-height: 44px;
          padding: 0.6rem 0.8rem;
          border: 1px solid var(--borde, #cbd5e1);
          border-radius: 8px;
          font-size: 0.885rem;
          color: #1e293b;
          background: #ffffff;
          box-sizing: border-box;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .filtro-input:focus {
          outline: none;
          border-color: var(--turquesa, #0d9488);
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.15);
        }

        .audi-filtros-acciones {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
        }

        .audi-btn {
          min-height: 44px;
          padding: 0.6rem 1.4rem;
          font-size: 0.9rem;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
        }

        /* Tabla de Auditoría */
        .audi-tabla-wrapper {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid var(--borde, #e2e8f0);
          padding: 1.25rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        .audi-fecha {
          font-size: 0.875rem;
          color: #0f172a;
          white-space: nowrap;
        }

        .audi-id-sub {
          font-family: monospace;
          font-size: 0.75rem;
          color: #64748b;
        }

        .audi-usuario-contenedor {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .audi-usuario-nombre {
          color: var(--verde-azulado, #0f766e);
          font-size: 0.9rem;
        }

        .audi-usuario-rol {
          font-size: 0.75rem;
          color: #64748b;
          text-transform: capitalize;
        }

        .audi-tabla-sub {
          font-size: 0.775rem;
          color: #64748b;
          margin-top: 0.25rem;
        }

        .audi-tabla-sub code {
          background: #f1f5f9;
          padding: 0.1rem 0.35rem;
          border-radius: 4px;
          font-size: 0.775rem;
        }

        .audi-modulo {
          font-size: 0.885rem;
          color: #334155;
        }

        .audi-ip {
          font-family: monospace;
          font-size: 0.825rem;
          color: #64748b;
          white-space: nowrap;
        }

        /* Fila Móvil */
        .tarjeta-audi-movil {
          padding: 0.85rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .audi-movil-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .audi-movil-id {
          font-family: monospace;
          font-weight: 700;
          color: #64748b;
          font-size: 0.8rem;
        }

        .audi-movil-mid {
          display: flex;
          flex-direction: column;
          font-size: 0.885rem;
        }

        .audi-movil-mid span {
          color: #64748b;
          font-size: 0.8rem;
        }

        .audi-movil-bot {
          font-size: 0.775rem;
          color: #64748b;
          display: flex;
          justify-content: space-between;
        }

        /* Subpanel Detalle */
        .subpanel-detalle-audi {
          padding: 1.25rem;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
        }

        .subpanel-audi-cabecera {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-bottom: 1rem;
          padding-bottom: 0.65rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .subpanel-audi-etiqueta {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          color: var(--turquesa, #0d9488);
          display: block;
        }

        .subpanel-audi-titulo {
          font-size: 1.05rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0.15rem 0 0 0;
        }

        .subpanel-audi-meta {
          font-size: 0.825rem;
          color: #64748b;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.2rem;
        }

        .subpanel-user-agent {
          font-size: 0.75rem;
          color: #94a3b8;
        }

        .subpanel-audi-json-grilla {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
        }

        .bloque-json-visor {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .visor-json-titulo {
          font-size: 0.775rem;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
        }

        .visor-json-codigo {
          background: #0f172a;
          color: #38bdf8;
          padding: 0.85rem;
          border-radius: 8px;
          font-family: monospace;
          font-size: 0.825rem;
          line-height: 1.45;
          max-height: 240px;
          overflow-y: auto;
          margin: 0;
          border: 1px solid #1e293b;
        }

        .codigo-nuevo {
          color: #34d399;
        }

        .visor-json-vacio {
          padding: 1rem;
          background: #ffffff;
          border: 1px dashed #cbd5e1;
          border-radius: 8px;
          color: #94a3b8;
          font-size: 0.825rem;
          font-style: italic;
        }

        /* Badges de Auditoría */
        .audi-badge {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.2rem 0.6rem;
          border-radius: 4px;
          display: inline-block;
          letter-spacing: 0.3px;
        }

        .badge-insert { background: #dcfce7; color: #166534; }
        .badge-update { background: #e0f2fe; color: #0369a1; }
        .badge-delete { background: #fee2e2; color: #991b1b; }
        .badge-auth { background: #f3e8ff; color: #6b21a8; }
        .badge-export { background: #fef9c3; color: #854d0e; }
        .badge-default { background: #f1f5f9; color: #475569; }

        @media (max-width: 640px) {
          .audi-cabecera {
            flex-direction: column;
          }
          .audi-kpi-eventos {
            width: 100%;
          }
          .audi-filtros-acciones {
            flex-direction: column-reverse;
          }
          .audi-btn {
            width: 100%;
          }
          .subpanel-audi-meta {
            align-items: flex-start;
          }
        }
      `}</style>
    </LayoutPrincipal>
  );
}

