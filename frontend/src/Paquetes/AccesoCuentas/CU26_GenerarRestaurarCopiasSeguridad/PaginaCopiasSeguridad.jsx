import React, { useState, useEffect } from 'react';
import api from '../../../compartido/utilidades/api';
import LayoutPrincipal from '../../../compartido/layouts/LayoutPrincipal';
import Alerta from '../../../compartido/componentes/Alerta';
import TablaExpandible from '../../../comun/componentes/TablaExpandible';

export default function PaginaCopiasSeguridad() {
  const [backups, setBackups] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [descargandoId, setDescargandoId] = useState(null);
  const [alerta, setAlerta] = useState(null);

  // Modal de confirmación de restauración
  const [modalRestaurar, setModalRestaurar] = useState(null); // backup object to restore
  const [restaurando, setRestaurando] = useState(false);

  const cargarBackups = async () => {
    try {
      setCargando(true);
      setAlerta(null);
      // Consume el endpoint oficial /seguridad/backups con fallback a /administracion/backups
      const res = await api.get('/seguridad/backups').catch(() => api.get('/administracion/backups'));
      setBackups(res.data?.datos || []);
    } catch (err) {
      setAlerta({
        tipo: 'error',
        mensaje: err.response?.data?.mensaje || 'Error al obtener la lista de copias de seguridad del servidor.',
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarBackups();
  }, []);

  const generarNuevoBackup = async () => {
    try {
      setGenerando(true);
      setAlerta(null);
      const res = await api.post('/seguridad/backups').catch(() => api.post('/administracion/backups'));

      setAlerta({
        tipo: 'exito',
        mensaje: `Copia de seguridad '${res.data?.datos?.nombre_archivo || 'completa'}' generada y resguardada exitosamente en el servidor.`,
      });

      cargarBackups();
    } catch (err) {
      setAlerta({
        tipo: 'error',
        mensaje: err.response?.data?.mensaje || 'Error al solicitar la generación de la copia de seguridad.',
      });
    } finally {
      setGenerando(false);
    }
  };

  const descargarBackup = async (backup) => {
    try {
      setDescargandoId(backup.id_copia);
      setAlerta(null);

      const response = await api.get(`/seguridad/backups/${backup.id_copia}/descargar`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/sql' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', backup.nombre_archivo);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setAlerta({
        tipo: 'exito',
        mensaje: `Archivo descargado correctamente: ${backup.nombre_archivo}`,
      });
    } catch (err) {
      setAlerta({
        tipo: 'error',
        mensaje: 'No fue posible descargar el archivo de respaldo físico.',
      });
    } finally {
      setDescargandoId(null);
    }
  };

  const confirmarRestauracion = async () => {
    if (!modalRestaurar) return;

    try {
      setRestaurando(true);
      setAlerta(null);

      const res = await api.post(`/seguridad/backups/${modalRestaurar.id_copia}/restaurar`);

      setAlerta({
        tipo: 'exito',
        mensaje: res.data?.mensaje || `Base de datos restaurada exitosamente a la versión '${modalRestaurar.nombre_archivo}'.`,
      });

      setModalRestaurar(null);
      cargarBackups();
    } catch (err) {
      setAlerta({
        tipo: 'error',
        mensaje: err.response?.data?.mensaje || 'Error al ejecutar la restauración del respaldo seleccionado.',
      });
    } finally {
      setRestaurando(false);
    }
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '—';
    try {
      const f = new Date(fechaStr);
      return f.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return fechaStr;
    }
  };

  const badgeEstado = (estado) => {
    const est = (estado || '').toLowerCase();
    if (est === 'creada' || est === 'completado' || est === 'completada') {
      return <span className="backup-badge badge-creada">Disponible</span>;
    }
    if (est === 'en_proceso') {
      return <span className="backup-badge badge-proceso">En Proceso</span>;
    }
    if (est === 'fallida') {
      return <span className="backup-badge badge-fallida">Fallida</span>;
    }
    return <span className="backup-badge badge-creada">{estado}</span>;
  };

  const columnas = [
    'Fecha de Generación',
    'Nombre del Archivo SQL',
    'Estado Operacional',
    '',
  ];

  return (
    <LayoutPrincipal titulo="Copias de Seguridad y Resguardo">
      <div className="backups-contenedor">
        {alerta && (
          <div className="backups-alerta-box">
            <Alerta
              tipo={alerta.tipo}
              mensaje={alerta.mensaje}
              onCerrar={() => setAlerta(null)}
            />
          </div>
        )}

        {/* Encabezado y Acción Principal */}
        <div className="backups-cabecera">
          <div>
            <span className="backups-subtitulo">Infraestructura y Continuidad Operativa</span>
            <h1 className="backups-titulo">Copias de Seguridad y Resguardo</h1>
            <p className="backups-descripcion">
              Administración de volcados completos de la base de datos PostgreSQL 18, resguardo en disco y procedimientos de recuperación ante desastres.
            </p>
          </div>

          <div className="backups-accion-top">
            <button
              type="button"
              className="boton-primario btn-generar-backup"
              onClick={generarNuevoBackup}
              disabled={generando || cargando}
            >
              {generando ? 'Generando Volcado SQL…' : '💾 + Generar Nueva Copia de Seguridad'}
            </button>
          </div>
        </div>

        {/* Tarjetas de Información del Almacenamiento */}
        <div className="backups-kpis-grilla">
          <div className="tarjeta kpi-backup-card">
            <span className="kpi-backup-label">Total de Copias Registradas</span>
            <span className="kpi-backup-valor color-verde">{backups.length}</span>
            <span className="kpi-backup-sub">Respaldos conservados en servidor</span>
          </div>

          <div className="tarjeta kpi-backup-card">
            <span className="kpi-backup-label">Último Respaldo Generado</span>
            <strong className="kpi-backup-fecha">
              {backups.length > 0 ? formatearFecha(backups[0].created_at) : 'Ninguno registrado'}
            </strong>
            <span className="kpi-backup-sub">
              {backups.length > 0 ? backups[0].nombre_archivo : 'Sin actividad previa'}
            </span>
          </div>

          <div className="tarjeta kpi-backup-card">
            <span className="kpi-backup-label">Motor de Base de Datos</span>
            <span className="kpi-backup-valor color-turquesa">PostgreSQL 18</span>
            <span className="kpi-backup-sub">Codificación UTF-8 / Transaccional ACID</span>
          </div>
        </div>

        {/* Tabla Expandible Obligatoria de Respaldos */}
        <div className="tarjeta backups-tabla-tarjeta">
          <div className="backups-tabla-cabecera">
            <h2 className="backups-tabla-titulo">Historial Cronológico de Respaldos</h2>
            <button
              type="button"
              className="boton-terciario btn-refrescar"
              onClick={cargarBackups}
              disabled={cargando}
            >
              🔄 Actualizar Listado
            </button>
          </div>

          <TablaExpandible
            columnas={columnas}
            datos={backups}
            cargando={cargando}
            obtenerClaveFila={(b) => b.id_copia}
            mensajeVacio="No existen copias de seguridad registradas en el sistema. Puedes generar una ahora."
            renderFilaPrincipal={(b, isExpanded) => (
              <>
                <td>
                  <strong className="backup-fecha-principal">
                    {formatearFecha(b.created_at)}
                  </strong>
                  <div className="backup-id-sub">Copia Nro. #{b.id_copia}</div>
                </td>
                <td>
                  <span className="backup-nombre-archivo">{b.nombre_archivo}</span>
                </td>
                <td>
                  {badgeEstado(b.estado)}
                </td>
                <td className="col-flecha">
                  <span className={`flecha-desplegar ${isExpanded ? 'rotada' : ''}`}>▼</span>
                </td>
              </>
            )}
            renderFilaMovil={(b, isExpanded) => (
              <div className="tarjeta-backup-movil">
                <div className="backup-movil-top">
                  <span className="backup-id-sub">#{b.id_copia}</span>
                  {badgeEstado(b.estado)}
                  <span className={`flecha-desplegar ${isExpanded ? 'rotada' : ''}`}>▼</span>
                </div>
                <div className="backup-movil-mid">
                  <strong className="backup-nombre-archivo">{b.nombre_archivo}</strong>
                </div>
                <div className="backup-movil-bot">
                  <span>📅 {formatearFecha(b.created_at)}</span>
                </div>
              </div>
            )}
            renderDetalle={(b) => (
              <div className="subpanel-detalle-backup">
                <div className="grid-detalle-backup">
                  <div>
                    <span className="etiqueta-subdetalle">Peso del Archivo:</span>
                    <strong className="valor-subdetalle">
                      {b.tamano_mb ? `${b.tamano_mb} MB` : b.tamano_kb ? `${b.tamano_kb} KB` : `${b.tamano_bytes || 0} bytes`}
                    </strong>
                  </div>
                  <div>
                    <span className="etiqueta-subdetalle">Generado por:</span>
                    <span className="valor-subdetalle">
                      {b.generado_por_nombre || (b.generado_por ? `@${b.generado_por}` : 'Administrador del Sistema')}
                    </span>
                  </div>
                  <div>
                    <span className="etiqueta-subdetalle">Tipo de Volcado:</span>
                    <span className="valor-subdetalle">
                      Copia Completa (Estructura DDL y Datos Tabulares)
                    </span>
                  </div>
                  <div>
                    <span className="etiqueta-subdetalle">Ruta en Servidor:</span>
                    <code className="valor-subdetalle-ruta">{b.ruta_almacenamiento}</code>
                  </div>
                </div>

                {/* Botonera de Acciones del Subpanel */}
                <div className="subpanel-acciones-backup">
                  <button
                    type="button"
                    className="boton-primario btn-accion-subpanel"
                    onClick={() => descargarBackup(b)}
                    disabled={descargandoId === b.id_copia}
                  >
                    {descargandoId === b.id_copia ? 'Descargando…' : '📥 Descargar Archivo SQL'}
                  </button>

                  <button
                    type="button"
                    className="boton-secundario btn-accion-subpanel btn-restaurar-peligro"
                    onClick={() => setModalRestaurar(b)}
                  >
                    🔄 Restaurar Esta Copia
                  </button>
                </div>
              </div>
            )}
          />
        </div>

        {/* Modal de Confirmación de Restauración */}
        {modalRestaurar && (
          <div className="modal-restaurar-overlay" role="dialog" aria-modal="true">
            <div className="modal-restaurar-tarjeta">
              <div className="modal-restaurar-cabecera">
                <span className="modal-icono-alerta">⚠️</span>
                <h3 className="modal-restaurar-titulo">Confirmación Requerida para Restauración</h3>
              </div>

              <div className="modal-restaurar-cuerpo">
                <p>
                  Estás a punto de restaurar la base de datos clínica al estado registrado en el archivo:
                </p>
                <div className="caja-archivo-confirmacion">
                  <strong>{modalRestaurar.nombre_archivo}</strong>
                  <span>Fecha: {formatearFecha(modalRestaurar.created_at)}</span>
                </div>
                <div className="aviso-peligro-restaurar">
                  <strong>Atención:</strong> Esta acción reemplazará los datos actuales y no puede deshacerse.
                  Se recomienda contar con una copia previa antes de proceder.
                </div>
              </div>

              <div className="modal-restaurar-acciones">
                <button
                  type="button"
                  className="boton-secundario modal-btn"
                  onClick={() => setModalRestaurar(null)}
                  disabled={restaurando}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="boton-primario modal-btn btn-confirmar-peligro"
                  onClick={confirmarRestauracion}
                  disabled={restaurando}
                >
                  {restaurando ? 'Restaurando Base de Datos…' : 'Confirmar y Restaurar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .backups-contenedor {
          max-width: 1040px;
          margin: 0 auto;
          padding: 0.5rem 0.5rem 3rem 0.5rem;
        }

        .backups-alerta-box {
          margin-bottom: 1.25rem;
        }

        .backups-cabecera {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .backups-subtitulo {
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--turquesa, #0d9488);
          display: block;
          margin-bottom: 0.2rem;
        }

        .backups-titulo {
          font-size: 1.65rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 0.25rem 0;
        }

        .backups-descripcion {
          font-size: 0.875rem;
          color: var(--texto-sec, #64748b);
          margin: 0;
          max-width: 650px;
        }

        .btn-generar-backup {
          min-height: 44px;
          padding: 0.65rem 1.4rem;
          font-size: 0.925rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        /* KPIs */
        .backups-kpis-grilla {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .kpi-backup-card {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid var(--borde, #e2e8f0);
          padding: 1.25rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .kpi-backup-label {
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
        }

        .kpi-backup-valor {
          font-size: 1.85rem;
          font-weight: 700;
          line-height: 1.1;
        }

        .kpi-backup-fecha {
          font-size: 1.1rem;
          font-weight: 700;
          color: #1e293b;
          margin-top: 0.2rem;
        }

        .color-verde { color: var(--verde-azulado, #0f766e); }
        .color-turquesa { color: var(--turquesa, #0d9488); }

        .kpi-backup-sub {
          font-size: 0.8rem;
          color: #64748b;
        }

        /* Tabla */
        .backups-tabla-tarjeta {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid var(--borde, #e2e8f0);
          padding: 1.25rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        .backups-tabla-cabecera {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.65rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .backups-tabla-titulo {
          font-size: 1.1rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .btn-refrescar {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--verde-azulado, #0f766e);
          cursor: pointer;
          min-height: 36px;
        }

        .backup-fecha-principal {
          font-size: 0.9rem;
          color: #0f172a;
        }

        .backup-id-sub {
          font-family: monospace;
          font-size: 0.75rem;
          color: #64748b;
        }

        .backup-nombre-archivo {
          font-family: monospace;
          font-size: 0.85rem;
          color: var(--verde-azulado, #0f766e);
          font-weight: 600;
        }

        /* Badges */
        .backup-badge {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.2rem 0.6rem;
          border-radius: 9999px;
          display: inline-block;
        }

        .badge-creada { background: #dcfce7; color: #166534; }
        .badge-proceso { background: #fef9c3; color: #854d0e; }
        .badge-fallida { background: #fee2e2; color: #991b1b; }

        /* Fila Móvil */
        .tarjeta-backup-movil {
          padding: 0.85rem;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .backup-movil-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .backup-movil-mid {
          word-break: break-all;
        }

        .backup-movil-bot {
          font-size: 0.8rem;
          color: #64748b;
        }

        /* Subpanel Detalle */
        .subpanel-detalle-backup {
          padding: 1.25rem;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
        }

        .grid-detalle-backup {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 0.85rem;
          margin-bottom: 1.25rem;
        }

        .etiqueta-subdetalle {
          display: block;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
          margin-bottom: 0.2rem;
        }

        .valor-subdetalle {
          font-size: 0.885rem;
          color: #1e293b;
        }

        .valor-subdetalle-ruta {
          font-size: 0.775rem;
          color: #475569;
          word-break: break-all;
          background: #ffffff;
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
          display: block;
        }

        .subpanel-acciones-backup {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          padding-top: 0.85rem;
          border-top: 1px solid #e2e8f0;
        }

        .btn-accion-subpanel {
          min-height: 44px;
          padding: 0.6rem 1.25rem;
          font-size: 0.885rem;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
        }

        .btn-restaurar-peligro {
          color: #b91c1c;
          border-color: #fca5a5;
          background: #fff;
        }

        .btn-restaurar-peligro:hover {
          background: #fee2e2;
        }

        /* Modal de Confirmación */
        .modal-restaurar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          z-index: 1050;
        }

        .modal-restaurar-tarjeta {
          background: #ffffff;
          border-radius: 12px;
          width: 100%;
          max-width: 520px;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .modal-restaurar-cabecera {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1.25rem 1.5rem;
          background: #fffbeb;
          border-bottom: 1px solid #fef3c7;
        }

        .modal-icono-alerta { font-size: 1.5rem; }

        .modal-restaurar-titulo {
          font-size: 1.15rem;
          font-weight: 700;
          color: #92400e;
          margin: 0;
        }

        .modal-restaurar-cuerpo {
          padding: 1.25rem 1.5rem;
          font-size: 0.925rem;
          color: #334155;
          line-height: 1.5;
        }

        .caja-archivo-confirmacion {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 0.75rem;
          margin: 0.75rem 0;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          font-family: monospace;
        }

        .aviso-peligro-restaurar {
          background: #fef2f2;
          border-left: 4px solid #ef4444;
          padding: 0.75rem;
          border-radius: 4px;
          font-size: 0.85rem;
          color: #991b1b;
          margin-top: 0.75rem;
        }

        .modal-restaurar-acciones {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
        }

        .modal-btn {
          min-height: 44px;
          padding: 0.6rem 1.3rem;
          font-size: 0.9rem;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
        }

        .btn-confirmar-peligro {
          background: #dc2626;
          border-color: #dc2626;
          color: #ffffff;
        }

        .btn-confirmar-peligro:hover {
          background: #b91c1c;
        }

        @media (max-width: 640px) {
          .backups-cabecera {
            flex-direction: column;
          }
          .btn-generar-backup {
            width: 100%;
            justify-content: center;
          }
          .subpanel-acciones-backup {
            flex-direction: column;
          }
          .btn-accion-subpanel {
            width: 100%;
            justify-content: center;
          }
          .modal-restaurar-acciones {
            flex-direction: column-reverse;
          }
          .modal-btn {
            width: 100%;
          }
        }
      `}</style>
    </LayoutPrincipal>
  );
}

