import React, { useState, useEffect } from 'react';

export default function ModalNuevaSuspension({
  abierto,
  onCerrar,
  medicos = [],
  onGuardar,
  guardando = false,
}) {
  const hoyStr = new Date().toISOString().split('T')[0];

  const [idMedico, setIdMedico] = useState('');
  const [fechaInicio, setFechaInicio] = useState(hoyStr);
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [fechaFin, setFechaFin] = useState(hoyStr);
  const [horaFin, setHoraFin] = useState('18:00');
  const [diaCompleto, setDiaCompleto] = useState(true);
  const [motivo, setMotivo] = useState('');
  const [errores, setErrores] = useState({});

  useEffect(() => {
    if (abierto) {
      setIdMedico(medicos.length > 0 ? medicos[0].id_medico : '');
      setFechaInicio(hoyStr);
      setFechaFin(hoyStr);
      setHoraInicio('08:00');
      setHoraFin('18:00');
      setDiaCompleto(true);
      setMotivo('');
      setErrores({});
    }
  }, [abierto, medicos]);

  if (!abierto) return null;

  const validar = () => {
    const errs = {};
    if (!idMedico) errs.id_medico = 'Debe seleccionar un profesional médico.';
    if (!fechaInicio) errs.fecha_inicio = 'La fecha de inicio es obligatoria.';
    if (!fechaFin) errs.fecha_fin = 'La fecha de fin es obligatoria.';
    if (fechaFin < fechaInicio) errs.fecha_fin = 'La fecha de fin no puede ser anterior a la de inicio.';
    if (!motivo || motivo.trim().length < 5) {
      errs.motivo = 'Debe indicar un motivo descriptivo (mínimo 5 caracteres).';
    }
    setErrores(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validar()) return;

    const inicioStr = diaCompleto
      ? `${fechaInicio} 00:00:00`
      : `${fechaInicio} ${horaInicio}:00`;

    const finStr = diaCompleto
      ? `${fechaFin} 23:59:59`
      : `${fechaFin} ${horaFin}:00`;

    const payload = {
      id_medico: parseInt(idMedico, 10),
      fecha_inicio: inicioStr,
      fecha_fin: finStr,
      motivo: motivo.trim(),
      accion_citas: 'reprogramacion_pendiente',
    };

    onGuardar(payload, setErrores);
  };

  return (
    <div className="modal-backdrop-suspension" onClick={onCerrar}>
      <div
        className="modal-contenido-suspension"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-suspension"
      >
        <div className="modal-header-suspension">
          <div>
            <h2 id="titulo-modal-suspension" className="modal-titulo-suspension">
              Registrar Suspensión de Horario
            </h2>
            <p className="modal-subtitulo-suspension">
              Bloquea la disponibilidad médica y procesa automáticamente las citas afectadas para reubicación prioritaria.
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

        <form onSubmit={handleSubmit} className="modal-form-suspension">
          {errores.general && (
            <div className="alerta-error-form">
              <span>⚠️ {errores.general}</span>
            </div>
          )}

          {/* Profesional Médico */}
          <div className="campo-grupo">
            <label htmlFor="select-medico-suspension" className="campo-etiqueta">
              Médico Especialista *
            </label>
            <select
              id="select-medico-suspension"
              className={`campo-control ${errores.id_medico ? 'control-invalido' : ''}`}
              value={idMedico}
              onChange={(e) => setIdMedico(e.target.value)}
              disabled={guardando}
            >
              <option value="">-- Seleccione un médico --</option>
              {medicos.map((m) => {
                const nombreCompleto = `Dr(a). ${m.nombres || ''} ${m.apellidos || ''}`.trim() || `Médico #${m.id_medico}`;
                const esp = m.especialidades_nombres ? ` (${m.especialidades_nombres})` : '';
                return (
                  <option key={m.id_medico} value={m.id_medico}>
                    {nombreCompleto} {esp}
                  </option>
                );
              })}
            </select>
            {errores.id_medico && <span className="error-texto">{errores.id_medico}</span>}
          </div>

          {/* Switch Día Completo vs Rango de Horas */}
          <div className="switch-dia-completo">
            <label className="checkbox-contenedor">
              <input
                type="checkbox"
                checked={diaCompleto}
                onChange={(e) => setDiaCompleto(e.target.checked)}
                disabled={guardando}
              />
              <span className="checkbox-texto">Suspender durante toda la jornada laboral</span>
            </label>
          </div>

          {/* Rango de Fechas y Horas */}
          <div className="fila-fechas">
            <div className="campo-grupo">
              <label htmlFor="fecha-inicio-susp" className="campo-etiqueta">
                Fecha Desde *
              </label>
              <input
                type="date"
                id="fecha-inicio-susp"
                className={`campo-control ${errores.fecha_inicio ? 'control-invalido' : ''}`}
                value={fechaInicio}
                min={hoyStr}
                onChange={(e) => {
                  setFechaInicio(e.target.value);
                  if (fechaFin < e.target.value) setFechaFin(e.target.value);
                }}
                disabled={guardando}
              />
              {errores.fecha_inicio && <span className="error-texto">{errores.fecha_inicio}</span>}
            </div>

            <div className="campo-grupo">
              <label htmlFor="fecha-fin-susp" className="campo-etiqueta">
                Fecha Hasta *
              </label>
              <input
                type="date"
                id="fecha-fin-susp"
                className={`campo-control ${errores.fecha_fin ? 'control-invalido' : ''}`}
                value={fechaFin}
                min={fechaInicio || hoyStr}
                onChange={(e) => setFechaFin(e.target.value)}
                disabled={guardando}
              />
              {errores.fecha_fin && <span className="error-texto">{errores.fecha_fin}</span>}
            </div>
          </div>

          {!diaCompleto && (
            <div className="fila-fechas">
              <div className="campo-grupo">
                <label htmlFor="hora-inicio-susp" className="campo-etiqueta">
                  Hora Inicio *
                </label>
                <input
                  type="time"
                  id="hora-inicio-susp"
                  className="campo-control"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  disabled={guardando}
                />
              </div>

              <div className="campo-grupo">
                <label htmlFor="hora-fin-susp" className="campo-etiqueta">
                  Hora Fin *
                </label>
                <input
                  type="time"
                  id="hora-fin-susp"
                  className="campo-control"
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                  disabled={guardando}
                />
              </div>
            </div>
          )}

          {/* Motivo de la Suspensión */}
          <div className="campo-grupo">
            <label htmlFor="motivo-suspension" className="campo-etiqueta">
              Motivo de la Contingencia / Suspensión *
            </label>
            <textarea
              id="motivo-suspension"
              rows={3}
              className={`campo-control ${errores.motivo ? 'control-invalido' : ''}`}
              placeholder="Ej. Intervención quirúrgica de emergencia, reposo médico certificado, participación en congreso de la especialidad..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              disabled={guardando}
            />
            {errores.motivo && <span className="error-texto">{errores.motivo}</span>}
          </div>

          {/* Mensaje Informativo de Reglas */}
          <div className="aviso-informativo-suspension">
            <span className="aviso-icono">ℹ️</span>
            <div className="aviso-texto">
              <strong>Impacto Operativo:</strong> Todas las citas activas que coincidan con este rango cambiarán inmediatamente a estado <em>Postergada</em>. Los pacientes con cuenta activa recibirán una notificación web automática y contarán con una ventana de 48 horas de prioridad para su reubicación.
            </div>
          </div>

          <div className="modal-acciones-suspension">
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
              className="btn-primario"
              disabled={guardando}
            >
              {guardando ? 'Procesando suspensión...' : 'Confirmar y Notificar'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .modal-backdrop-suspension {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(10, 108, 132, 0.4);
          backdrop-filter: blur(3px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1100;
          padding: 1rem;
        }

        .modal-contenido-suspension {
          background: #FFFFFF;
          border-radius: 14px;
          max-width: 580px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 16px 40px rgba(10, 108, 132, 0.2);
          animation: modalEntrada 0.2s ease-out;
        }

        @keyframes modalEntrada {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .modal-header-suspension {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          background: #F4FAFB;
          border-bottom: 1px solid #E1ECEE;
          border-radius: 14px 14px 0 0;
        }

        .modal-titulo-suspension {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 700;
          color: #0A6C84;
        }

        .modal-subtitulo-suspension {
          margin: 0.25rem 0 0 0;
          font-size: 0.8rem;
          color: #5B7078;
          line-height: 1.35;
        }

        .modal-btn-cerrar {
          background: none;
          border: none;
          font-size: 1.25rem;
          color: #5B7078;
          cursor: pointer;
          padding: 0.25rem;
          line-height: 1;
        }

        .modal-btn-cerrar:hover {
          color: #0A6C84;
        }

        .modal-form-suspension {
          padding: 1.25rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .campo-grupo {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .campo-etiqueta {
          font-size: 0.82rem;
          font-weight: 600;
          color: #12343B;
        }

        .campo-control {
          padding: 0.6rem 0.75rem;
          font-size: 0.875rem;
          border: 1px solid #C4DCE0;
          border-radius: 8px;
          background: #FFFFFF;
          color: #12343B;
          outline: none;
          transition: border-color 0.2s;
        }

        .campo-control:focus {
          border-color: #1FA5B8;
          box-shadow: 0 0 0 3px rgba(31, 165, 184, 0.15);
        }

        .control-invalido {
          border-color: #D9534F;
        }

        .error-texto {
          font-size: 0.75rem;
          color: #D9534F;
          font-weight: 500;
        }

        .switch-dia-completo {
          background: #F4FAFB;
          padding: 0.6rem 0.75rem;
          border-radius: 8px;
          border: 1px solid #E1ECEE;
        }

        .checkbox-contenedor {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .checkbox-texto {
          font-size: 0.82rem;
          font-weight: 600;
          color: #0A6C84;
        }

        .fila-fechas {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        @media (max-width: 480px) {
          .fila-fechas {
            grid-template-columns: 1fr;
          }
        }

        .aviso-informativo-suspension {
          display: flex;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: #FEF9E7;
          border: 1px solid #FAD7A0;
          border-radius: 8px;
          font-size: 0.78rem;
          color: #7D6608;
          line-height: 1.4;
        }

        .aviso-icono {
          font-size: 1.1rem;
        }

        .modal-acciones-suspension {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 0.5rem;
          padding-top: 1rem;
          border-top: 1px solid #E1ECEE;
        }

        .btn-primario {
          background: #0A6C84;
          color: #FFFFFF;
          font-size: 0.875rem;
          font-weight: 600;
          padding: 0.6rem 1.25rem;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-primario:hover:not(:disabled) {
          background: #074F61;
        }

        .btn-primario:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secundario {
          background: #FFFFFF;
          color: #5B7078;
          font-size: 0.875rem;
          font-weight: 600;
          padding: 0.6rem 1.25rem;
          border-radius: 8px;
          border: 1px solid #C4DCE0;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secundario:hover:not(:disabled) {
          background: #F4FAFB;
          color: #12343B;
        }

        .alerta-error-form {
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

