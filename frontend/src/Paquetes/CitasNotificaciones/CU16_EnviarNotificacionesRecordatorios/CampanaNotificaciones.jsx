import React, { useState, useEffect, useRef } from 'react';
import api from '../../../compartido/utilidades/api';

export default function CampanaNotificaciones() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [totalNoLeidas, setTotalNoLeidas] = useState(0);
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [enviandoRecordatorios, setEnviandoRecordatorios] = useState(false);
  const [mensajeAccion, setMensajeAccion] = useState(null);

  const contenedorRef = useRef(null);

  const usuarioStr = localStorage.getItem('usuario_clinica');
  const usuario = usuarioStr ? JSON.parse(usuarioStr) : null;
  const esPersonal = usuario && ['administrador', 'recepcionista'].includes((usuario.rol || '').toLowerCase());

  const cargarNotificaciones = async () => {
    try {
      const res = await api.get('/notificaciones');
      if (res.data && res.data.datos) {
        setNotificaciones(res.data.datos.notificaciones || []);
        setTotalNoLeidas(res.data.datos.total_no_leidas || 0);
      }
    } catch (err) {
      // Silencioso para no interrumpir el flujo si falla una petición puntual
    }
  };

  useEffect(() => {
    cargarNotificaciones();

    // Sondeo periódico cada 35 segundos para refrescar avisos en tiempo real
    const intervalo = setInterval(() => {
      cargarNotificaciones();
    }, 35000);

    return () => clearInterval(intervalo);
  }, []);

  // Cerrar el popover al hacer clic fuera del componente
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contenedorRef.current && !contenedorRef.current.contains(event.target)) {
        setAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const alternarAbierto = () => {
    setAbierto(!abierto);
    if (!abierto) {
      cargarNotificaciones();
    }
  };

  const marcarComoLeida = async (idNotificacion, yaLeida) => {
    if (yaLeida) return;
    try {
      await api.put(`/notificaciones/${idNotificacion}/leida`);
      setNotificaciones((prev) =>
        prev.map((n) => (n.id_notificacion === idNotificacion ? { ...n, leido: true } : n))
      );
      setTotalNoLeidas((prev) => Math.max(0, prev - 1));
    } catch {
      // Manejo silencioso en UI de notificación
    }
  };

  const marcarTodasLeidas = async () => {
    try {
      setCargando(true);
      await api.put('/notificaciones/leer-todas');
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leido: true })));
      setTotalNoLeidas(0);
    } catch {
      // Manejo silencioso en UI de notificación
    } finally {
      setCargando(false);
    }
  };

  const dispararRecordatorios = async () => {
    try {
      setEnviandoRecordatorios(true);
      setMensajeAccion(null);
      const res = await api.post('/notificaciones/disparar-recordatorios');
      setMensajeAccion(res.data?.mensaje || 'Recordatorios emitidos con éxito.');
      setTimeout(() => setMensajeAccion(null), 4000);
      cargarNotificaciones();
    } catch (err) {
      setMensajeAccion(err.response?.data?.mensaje || 'Error al emitir recordatorios.');
      setTimeout(() => setMensajeAccion(null), 4000);
    } finally {
      setEnviandoRecordatorios(false);
    }
  };

  const obtenerIconoTipo = (tipo) => {
    switch (tipo) {
      case 'suspension_horario':
        return '⚠️';
      case 'reubicacion_cita':
        return '🔄';
      case 'recordatorio_cita':
        return '⏰';
      case 'confirmacion_cita':
        return '✅';
      default:
        return '📌';
    }
  };

  return (
    <div className="campana-notificaciones-contenedor" ref={contenedorRef}>
      {/* Botón de la Campana */}
      <button
        type="button"
        className="campana-notificaciones-btn"
        onClick={alternarAbierto}
        aria-label="Notificaciones y avisos del sistema"
        title="Ver notificaciones del sistema"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {totalNoLeidas > 0 && (
          <span className="campana-badge-contador">
            {totalNoLeidas > 99 ? '99+' : totalNoLeidas}
          </span>
        )}
      </button>

      {/* Popover Desplegable de Notificaciones */}
      {abierto && (
        <div className="campana-popover-panel">
          <div className="campana-popover-header">
            <div className="campana-popover-header-izq">
              <span className="campana-popover-titulo">Avisos y Notificaciones</span>
              {totalNoLeidas > 0 && (
                <span className="campana-badge-sub">{totalNoLeidas} nueva(s)</span>
              )}
            </div>

            {totalNoLeidas > 0 && (
              <button
                type="button"
                className="campana-btn-marcar-todas"
                onClick={marcarTodasLeidas}
                disabled={cargando}
              >
                Marcar leídas
              </button>
            )}
          </div>

          {mensajeAccion && (
            <div className="campana-mensaje-accion">
              <span>{mensajeAccion}</span>
            </div>
          )}

          {esPersonal && (
            <div className="campana-acciones-personal">
              <button
                type="button"
                className="campana-btn-accion-rapida"
                onClick={dispararRecordatorios}
                disabled={enviandoRecordatorios}
              >
                {enviandoRecordatorios ? 'Enviando...' : '⏰ Enviar recordatorios de citas de mañana'}
              </button>
            </div>
          )}

          <div className="campana-lista-notificaciones">
            {notificaciones.length === 0 ? (
              <div className="campana-vacia">
                <span className="campana-vacia-icono">🔔</span>
                <p className="campana-vacia-texto">No tienes notificaciones pendientes.</p>
              </div>
            ) : (
              notificaciones.map((n) => {
                const esNoLeida = !n.leido;
                const icono = obtenerIconoTipo(n.tipo);
                const fechaLegible = n.created_at
                  ? new Date(n.created_at).toLocaleDateString('es-BO', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '';

                return (
                  <div
                    key={n.id_notificacion}
                    className={`campana-item ${esNoLeida ? 'item-no-leido' : ''}`}
                    onClick={() => marcarComoLeida(n.id_notificacion, n.leido)}
                    title={esNoLeida ? 'Clic para marcar como leída' : ''}
                  >
                    <div className="campana-item-icono">{icono}</div>
                    <div className="campana-item-cuerpo">
                      <div className="campana-item-encabezado">
                        <strong className="campana-item-titulo">{n.titulo}</strong>
                        {esNoLeida && <span className="campana-punto-no-leido" />}
                      </div>
                      <p className="campana-item-mensaje">{n.mensaje}</p>
                      <span className="campana-item-fecha">{fechaLegible}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Estilos CSS encapsulados de la Campana */}
      <style>{`
        .campana-notificaciones-contenedor {
          position: relative;
          display: inline-block;
          margin-right: 0.75rem;
        }

        .campana-notificaciones-btn {
          background: #F4FAFB;
          border: 1px solid #C4DCE0;
          color: #0A6C84;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: relative;
          transition: all 0.2s ease;
        }

        .campana-notificaciones-btn:hover {
          background: #EAF5F7;
          border-color: #1FA5B8;
          color: #0A6C84;
        }

        .campana-badge-contador {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #D9534F;
          color: #FFFFFF;
          font-size: 0.7rem;
          font-weight: 700;
          min-width: 18px;
          height: 18px;
          line-height: 18px;
          border-radius: 9px;
          padding: 0 4px;
          text-align: center;
          border: 2px solid #FFFFFF;
        }

        .campana-popover-panel {
          position: absolute;
          top: calc(100% + 10px);
          right: -10px;
          width: 340px;
          max-width: 90vw;
          background: #FFFFFF;
          border: 1px solid #E1ECEE;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(10, 108, 132, 0.15);
          z-index: 1000;
          overflow: hidden;
          animation: animarEntradaCampana 0.15s ease-out;
        }

        @keyframes animarEntradaCampana {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .campana-popover-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background: #F4FAFB;
          border-bottom: 1px solid #E1ECEE;
        }

        .campana-popover-header-izq {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .campana-popover-titulo {
          font-size: 0.85rem;
          font-weight: 700;
          color: #0A6C84;
        }

        .campana-badge-sub {
          background: #1FA5B8;
          color: #FFFFFF;
          font-size: 0.65rem;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 10px;
        }

        .campana-btn-marcar-todas {
          background: none;
          border: none;
          color: #1FA5B8;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          text-decoration: underline;
          padding: 0;
        }

        .campana-btn-marcar-todas:hover {
          color: #0A6C84;
        }

        .campana-acciones-personal {
          padding: 0.5rem 0.75rem;
          background: #FFFFFF;
          border-bottom: 1px solid #EAEAEA;
        }

        .campana-btn-accion-rapida {
          width: 100%;
          background: #F4FAFB;
          border: 1px dashed #1FA5B8;
          color: #0A6C84;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.4rem 0.6rem;
          border-radius: 6px;
          cursor: pointer;
          text-align: center;
          transition: background 0.2s;
        }

        .campana-btn-accion-rapida:hover {
          background: #EAF5F7;
        }

        .campana-mensaje-accion {
          padding: 0.4rem 0.75rem;
          background: #E6F7EC;
          color: #1E6B38;
          font-size: 0.75rem;
          font-weight: 600;
          border-bottom: 1px solid #B8E4C5;
          text-align: center;
        }

        .campana-lista-notificaciones {
          max-height: 360px;
          overflow-y: auto;
        }

        .campana-item {
          display: flex;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #F0F4F5;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .campana-item:hover {
          background: #F9FCFC;
        }

        .campana-item.item-no-leido {
          background: #F0FAFB;
        }

        .campana-item.item-no-leido:hover {
          background: #E5F6F8;
        }

        .campana-item-icono {
          font-size: 1.15rem;
          line-height: 1.2;
        }

        .campana-item-cuerpo {
          flex: 1;
          min-width: 0;
        }

        .campana-item-encabezado {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.2rem;
        }

        .campana-item-titulo {
          font-size: 0.8rem;
          font-weight: 700;
          color: #12343B;
        }

        .campana-punto-no-leido {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #1FA5B8;
        }

        .campana-item-mensaje {
          font-size: 0.75rem;
          color: #5B7078;
          line-height: 1.35;
          margin: 0 0 0.35rem 0;
          word-break: break-word;
        }

        .campana-item-fecha {
          font-size: 0.68rem;
          color: #8C9EA3;
        }

        .campana-vacia {
          padding: 2rem 1rem;
          text-align: center;
        }

        .campana-vacia-icono {
          font-size: 2rem;
          display: block;
          margin-bottom: 0.5rem;
          opacity: 0.4;
        }

        .campana-vacia-texto {
          font-size: 0.8rem;
          color: #5B7078;
          margin: 0;
        }
      `}</style>
    </div>
  );
}

