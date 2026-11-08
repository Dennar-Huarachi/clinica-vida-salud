import React, { useState, useEffect } from 'react';
import useDisponibilidadTurnos from '../CU10_ConsultarDisponibilidad/useDisponibilidadTurnos';

export default function ModalReubicarCita({
  abierto,
  onCerrar,
  cita,
  medicos = [],
  onConfirmar,
  guardando = false,
}) {
  const hoyStr = new Date().toISOString().split('T')[0];

  const [nuevaFecha, setNuevaFecha] = useState(hoyStr);
  const [idMedico, setIdMedico] = useState('');
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [motivoReubicacion, setMotivoReubicacion] = useState('');
  const [errorLocal, setErrorLocal] = useState(null);

  const {
    turnos,
    turnosDisponibles,
    cargando: cargandoTurnos,
    motivoBloqueo,
    errorServidor,
    refrescar: refrescarTurnos,
  } = useDisponibilidadTurnos({
    idMedico,
    idEspecialidad: cita?.id_especialidad,
    fecha: nuevaFecha,
    turnoSeleccionado,
    onDeseleccionarTurno: () => setTurnoSeleccionado(null),
    activo: Boolean(abierto && cita && idMedico && nuevaFecha),
  });

  useEffect(() => {
    if (abierto && cita) {
      setNuevaFecha(cita.fecha_cita >= hoyStr ? cita.fecha_cita : hoyStr);
      setIdMedico(cita.id_medico ? String(cita.id_medico) : '');
      setTurnoSeleccionado(null);
      setMotivoReubicacion('');
      setErrorLocal(null);
    }
  }, [abierto, cita, hoyStr]);

  if (!abierto || !cita) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!turnoSeleccionado) {
      setErrorLocal('Debe seleccionar un turno disponible de la grilla.');
      return;
    }

    const payload = {
      id_cita: cita.id_cita,
      nueva_fecha: nuevaFecha,
      nueva_hora_inicio: turnoSeleccionado.hora_inicio,
      nueva_hora_fin: turnoSeleccionado.hora_fin,
      nuevo_id_medico: parseInt(idMedico, 10),
      motivo_reubicacion: motivoReubicacion.trim() || 'Reubicación por contingencia de horario médico',
    };

    onConfirmar(payload, (error) => {
      setErrorLocal(error);
      setTurnoSeleccionado(null);
      refrescarTurnos();
    });
  };

  return (
    <div className="modal-backdrop-reubicar" onClick={onCerrar}>
      <div
        className="modal-contenido-reubicar"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-reubicar"
      >
        <div className="modal-header-reubicar">
          <div>
            <h2 id="titulo-modal-reubicar" className="modal-titulo-reubicar">
              Reubicar Turno de Consulta Médica
            </h2>
            <p className="modal-subtitulo-reubicar">
              Asigne un nuevo cupo libre garantizado con prioridad a la cita afectada.
            </p>
          </div>
          <button
            type="button"
            className="modal-btn-cerrar"
            onClick={onCerrar}
            aria-label="Cerrar ventana"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form-reubicar">
          {errorLocal && (
            <div className="alerta-error-reubicar">
              <span>⚠️ {errorLocal}</span>
            </div>
          )}

          {/* Tarjeta Resumen de la Cita Afectada */}
          <div className="tarjeta-resumen-cita">
            <div className="resumen-header">
              <span className="resumen-codigo">{cita.codigo_cita}</span>
              <span className="resumen-badge-prioridad">Prioridad de Reubicación Activa</span>
            </div>

            <div className="resumen-cuerpo-grid">
              <div>
                <span className="resumen-etiqueta">Paciente:</span>
                <strong className="resumen-valor">{cita.paciente_nombre_completo || cita.paciente}</strong>
                <span className="resumen-sub">CI: {cita.paciente_ci || cita.ci} · Tel: {cita.paciente_telefono || cita.telefono || 'Sin registrar'}</span>
              </div>
              <div>
                <span className="resumen-etiqueta">Especialidad y Médico Original:</span>
                <strong className="resumen-valor">{cita.especialidad_nombre || 'Consulta'}</strong>
                <span className="resumen-sub">{cita.medico_nombre_completo || cita.medico}</span>
              </div>
              <div>
                <span className="resumen-etiqueta">Turno Original Afectado:</span>
                <strong className="resumen-valor">{cita.fecha_cita} a las {cita.hora_inicio}</strong>
              </div>
            </div>
          </div>

          {/* Filtros para el Nuevo Turno */}
          <div className="fila-filtros-reubicar">
            <div className="campo-grupo">
              <label htmlFor="nueva-fecha-reubicar" className="campo-etiqueta">
                Nueva Fecha de Consulta *
              </label>
              <input
                type="date"
                id="nueva-fecha-reubicar"
                className="campo-control"
                value={nuevaFecha}
                min={hoyStr}
                onChange={(e) => setNuevaFecha(e.target.value)}
                disabled={guardando}
              />
            </div>

            <div className="campo-grupo">
              <label htmlFor="select-medico-reubicar" className="campo-etiqueta">
                Médico a Asignar *
              </label>
              <select
                id="select-medico-reubicar"
                className="campo-control"
                value={idMedico}
                onChange={(e) => setIdMedico(e.target.value)}
                disabled={guardando}
              >
                {medicos.map((m) => (
                  <option key={m.id_medico} value={m.id_medico}>
                    Dr(a). {m.nombres} {m.apellidos}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selector de Turnos Disponibles */}
          <div className="seccion-turnos-disponibles">
            <div className="turnos-encabezado">
              <span className="turnos-titulo">Turnos Disponibles para el {nuevaFecha}</span>
              {turnoSeleccionado && (
                <span className="turno-seleccionado-badge">
                  Turno seleccionado: {turnoSeleccionado.hora_inicio}
                </span>
              )}
            </div>

            {cargandoTurnos ? (
              <div className="turnos-cargando">
                <span className="spinner-turnos" /> Calculando turnos disponibles en tiempo real…
              </div>
            ) : motivoBloqueo ? (
              <div className="turnos-mensaje-vacio">
                <span>ℹ️ {motivoBloqueo}</span>
              </div>
            ) : errorServidor ? (
              <div className="turnos-mensaje-vacio">
                <span>⚠️ {errorServidor}</span>
              </div>
            ) : turnosDisponibles.length === 0 ? (
              <div className="turnos-mensaje-vacio">
                <span>No hay turnos disponibles para esta fecha. Elija otra fecha u otro médico.</span>
              </div>
            ) : (
              <div className="grilla-turnos-chips">
                {turnos
                  .filter((t) => t.disponible === true || t.disponible === 1)
                  .map((t, idx) => {
                    const esSeleccionado =
                      turnoSeleccionado && turnoSeleccionado.hora_inicio === t.hora_inicio;

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={guardando}
                        onClick={() => setTurnoSeleccionado(t)}
                        className={`turno-chip chip-libre ${
                          esSeleccionado ? 'chip-seleccionado' : ''
                        }`}
                        title={`Seleccionar turno ${t.hora_inicio}`}
                        aria-label={`Turno ${t.hora_inicio}`}
                      >
                        <span className="chip-hora">{t.hora_inicio}</span>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Nota Opcional de Reubicación */}
          <div className="campo-grupo">
            <label htmlFor="nota-reubicacion" className="campo-etiqueta">
              Nota / Justificación Operativa (Opcional)
            </label>
            <input
              type="text"
              id="nota-reubicacion"
              className="campo-control"
              placeholder="Ej. Paciente acordó reubicación telefónica para primera hora..."
              value={motivoReubicacion}
              onChange={(e) => setMotivoReubicacion(e.target.value)}
              disabled={guardando}
            />
          </div>

          <div className="modal-acciones-reubicar">
            <button
              type="button"
              className="btn-secundario"
              onClick={onCerrar}
              disabled={guardando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-naranja-reubicar"
              disabled={!turnoSeleccionado || guardando}
            >
              {guardando ? 'Guardando reubicación...' : 'Confirmar Reubicación del Turno'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .modal-backdrop-reubicar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(10, 108, 132, 0.45);
          backdrop-filter: blur(3px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1100;
          padding: 1rem;
        }

        .modal-contenido-reubicar {
          background: #FFFFFF;
          border-radius: 14px;
          max-width: 650px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 16px 40px rgba(10, 108, 132, 0.22);
          animation: modalEntrada 0.2s ease-out;
        }

        .modal-header-reubicar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          background: #F4FAFB;
          border-bottom: 1px solid #E1ECEE;
          border-radius: 14px 14px 0 0;
        }

        .modal-titulo-reubicar {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 700;
          color: #0A6C84;
        }

        .modal-subtitulo-reubicar {
          margin: 0.25rem 0 0 0;
          font-size: 0.8rem;
          color: #5B7078;
        }

        .modal-form-reubicar {
          padding: 1.25rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
        }

        .tarjeta-resumen-cita {
          background: #FEF9E7;
          border: 1px solid #FAD7A0;
          border-radius: 10px;
          padding: 0.85rem 1rem;
        }

        .resumen-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.6rem;
          padding-bottom: 0.4rem;
          border-bottom: 1px dashed #F5CBA7;
        }

        .resumen-codigo {
          font-family: monospace;
          font-weight: 700;
          color: #7D6608;
          font-size: 0.95rem;
        }

        .resumen-badge-prioridad {
          background: #E0A100;
          color: #FFFFFF;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 12px;
        }

        .resumen-cuerpo-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        @media (max-width: 520px) {
          .resumen-cuerpo-grid {
            grid-template-columns: 1fr;
          }
        }

        .resumen-etiqueta {
          display: block;
          font-size: 0.72rem;
          color: #7D6608;
          text-transform: uppercase;
          font-weight: 600;
        }

        .resumen-valor {
          display: block;
          font-size: 0.85rem;
          color: #12343B;
        }

        .resumen-sub {
          display: block;
          font-size: 0.75rem;
          color: #6E5B05;
        }

        .fila-filtros-reubicar {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        @media (max-width: 480px) {
          .fila-filtros-reubicar {
            grid-template-columns: 1fr;
          }
        }

        .seccion-turnos-disponibles {
          background: #F4FAFB;
          border: 1px solid #E1ECEE;
          border-radius: 10px;
          padding: 0.85rem 1rem;
        }

        .turnos-encabezado {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }

        .turnos-titulo {
          font-size: 0.82rem;
          font-weight: 700;
          color: #0A6C84;
        }

        .turno-seleccionado-badge {
          background: #2E9E6B;
          color: #FFFFFF;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 8px;
        }

        .turnos-cargando, .turnos-mensaje-vacio {
          padding: 1.5rem 1rem;
          text-align: center;
          font-size: 0.82rem;
          color: #5B7078;
        }

        .grilla-turnos-chips {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(95px, 1fr));
          gap: 0.5rem;
          max-height: 200px;
          overflow-y: auto;
          padding: 2px;
        }

        .turno-chip {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.6rem 0.5rem;
          min-height: 42px;
          border-radius: 8px;
          cursor: pointer;
          border: 1.5px solid transparent;
          transition: all 0.15s ease;
        }

        .chip-hora {
          font-size: 0.95rem;
          font-weight: 700;
          line-height: 1;
        }

        .chip-libre {
          background: #FFFFFF;
          border-color: #22C3E0;
          color: #0A6C84;
        }

        .chip-libre:hover:not(:disabled) {
          background: #E8F8FA;
          border-color: #0A6C84;
          transform: translateY(-1px);
        }

        .chip-bloqueado {
          background: #EAEAEA;
          border-color: #D5D5D5;
          color: #999999;
          cursor: not-allowed;
          opacity: 0.65;
        }

        .chip-seleccionado {
          background: #F28C1E !important;
          border-color: #C75F00 !important;
          color: #FFFFFF !important;
          box-shadow: 0 4px 10px rgba(242, 140, 30, 0.35);
        }

        .modal-acciones-reubicar {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid #E1ECEE;
        }

        .btn-naranja-reubicar {
          background: #F28C1E;
          color: #FFFFFF;
          font-size: 0.875rem;
          font-weight: 700;
          padding: 0.65rem 1.35rem;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-naranja-reubicar:hover:not(:disabled) {
          background: #C75F00;
        }

        .btn-naranja-reubicar:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .alerta-error-reubicar {
          background: #FDEDEC;
          border: 1px solid #F5B7B1;
          color: #922B21;
          padding: 0.6rem 0.75rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}

