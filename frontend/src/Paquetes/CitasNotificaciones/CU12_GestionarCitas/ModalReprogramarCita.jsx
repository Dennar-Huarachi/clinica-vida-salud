import React, { useState, useEffect } from 'react';
import useDisponibilidadTurnos from '../../CatalogosHorarios/CU10_ConsultarDisponibilidad/useDisponibilidadTurnos';

export default function ModalReprogramarCita({
  abierto,
  onCerrar,
  cita,
  onConfirmar,
  guardando = false,
}) {
  const hoyStr = new Date().toISOString().split('T')[0];

  const [nuevaFecha, setNuevaFecha] = useState(hoyStr);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [motivoReprogramacion, setMotivoReprogramacion] = useState('');
  const [errorLocal, setErrorLocal] = useState(null);

  const {
    turnos,
    turnosDisponibles,
    cargando: cargandoTurnos,
    motivoBloqueo,
    errorServidor,
    refrescar: refrescarTurnos,
  } = useDisponibilidadTurnos({
    idMedico: cita?.id_medico,
    idEspecialidad: cita?.id_especialidad,
    fecha: nuevaFecha,
    turnoSeleccionado,
    onDeseleccionarTurno: () => setTurnoSeleccionado(null),
    activo: Boolean(abierto && cita && cita.id_medico && nuevaFecha),
  });

  useEffect(() => {
    if (abierto && cita) {
      setNuevaFecha(cita.fecha_cita >= hoyStr ? cita.fecha_cita : hoyStr);
      setTurnoSeleccionado(null);
      setMotivoReprogramacion('');
      setErrorLocal(null);
    }
  }, [abierto, cita, hoyStr]);

  if (!abierto || !cita) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!turnoSeleccionado) {
      setErrorLocal('Debe seleccionar un turno médico disponible.');
      return;
    }

    let horaLimpia = String(turnoSeleccionado.hora_inicio).trim();
    if (horaLimpia.length > 5) horaLimpia = horaLimpia.slice(0, 5);

    const payload = {
      fecha_cita: nuevaFecha,
      hora_inicio: horaLimpia,
      motivo_reprogramacion: motivoReprogramacion.trim() || 'Reprogramación a solicitud del paciente en ventanilla',
    };

    onConfirmar(payload, (error) => {
      setErrorLocal(error);
      setTurnoSeleccionado(null);
      refrescarTurnos();
    });
  };

  return (
    <div className="modal-backdrop" onClick={onCerrar}>
      <div
        className="modal-contenido tarjeta"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{ maxWidth: '600px', width: '95%' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--azul-petroleo, #0A6C84)' }}>
              Reprogramar Turno de Cita Médica
            </h3>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--texto-sec, #64748B)', fontSize: '0.88rem' }}>
              Cita: <b>{cita.codigo_cita}</b> — {cita.paciente_apellidos}, {cita.paciente_nombres}
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748B' }}
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {errorLocal && (
          <div
            className="alerta-error"
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontSize: '0.88rem',
              marginBottom: '1rem',
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              color: '#B91C1C',
            }}
          >
            ⚠️ {errorLocal}
          </div>
        )}

        <div style={{ background: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.88rem' }}>
          <div><strong>Médico:</strong> Dr(a). {cita.medico_apellidos || cita.medico} ({cita.especialidad_nombre || cita.especialidad})</div>
          <div><strong>Turno actual:</strong> {cita.fecha_cita} a las {cita.hora_inicio}</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="nueva-fecha-reprog" style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.35rem' }}>
              Nueva Fecha de Consulta *
            </label>
            <input
              type="date"
              id="nueva-fecha-reprog"
              className="campo-control"
              value={nuevaFecha}
              min={hoyStr}
              onChange={(e) => setNuevaFecha(e.target.value)}
              disabled={guardando}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.35rem', color: '#0A6C84' }}>
              Turnos Disponibles para el {nuevaFecha}:
            </label>

            {cargandoTurnos ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0A6C84', padding: '0.75rem 0' }}>
                <span className="spinner-tabla" style={{ width: '16px', height: '16px' }} />
                <span style={{ fontSize: '0.88rem', fontStyle: 'italic' }}>Calculando turnos disponibles en tiempo real…</span>
              </div>
            ) : motivoBloqueo ? (
              <div style={{ padding: '0.75rem', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '6px', color: '#B91C1C', fontSize: '0.88rem' }}>
                {motivoBloqueo}
              </div>
            ) : errorServidor ? (
              <div style={{ padding: '0.75rem', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '6px', color: '#B91C1C', fontSize: '0.88rem' }}>
                {errorServidor}
              </div>
            ) : turnosDisponibles.length === 0 ? (
              <div style={{ padding: '0.75rem', background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '6px', textAlign: 'center', color: '#64748B', fontSize: '0.88rem' }}>
                No hay turnos disponibles para esta fecha. Elija otra fecha u otro médico.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(75px, 1fr))', gap: '8px', maxHeight: '180px', overflowY: 'auto', padding: '4px' }}>
                {turnos
                  .filter((t) => t.disponible === true || t.disponible === 1)
                  .map((t) => {
                    const seleccionado = turnoSeleccionado?.hora_inicio === t.hora_inicio;
                    return (
                      <button
                        key={t.hora_inicio}
                        type="button"
                        disabled={guardando}
                        onClick={() => setTurnoSeleccionado(t)}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '6px',
                          border: seleccionado ? '2px solid #F28C1E' : '1px solid #CBD5E1',
                          background: seleccionado ? '#F28C1E' : '#FFFFFF',
                          color: seleccionado ? '#FFFFFF' : '#1E293B',
                          fontWeight: 700,
                          fontSize: '0.88rem',
                          cursor: 'pointer',
                        }}
                      >
                        {t.hora_inicio}
                      </button>
                    );
                  })}
              </div>
            )}

            {turnoSeleccionado && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#166534', fontWeight: 600 }}>
                ✓ Turno seleccionado: {turnoSeleccionado.hora_inicio}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="motivo-reprog" style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.35rem' }}>
              Motivo de Reprogramación *
            </label>
            <textarea
              id="motivo-reprog"
              value={motivoReprogramacion}
              onChange={(e) => setMotivoReprogramacion(e.target.value)}
              placeholder="Indique la causa del cambio de fecha/hora..."
              rows={2}
              disabled={guardando}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #CBD5E1', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onCerrar}
              disabled={guardando}
              className="boton-terciario"
              style={{ minHeight: '40px', padding: '0 1rem' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando || !turnoSeleccionado}
              className="boton-primario"
              style={{ minHeight: '40px', padding: '0 1.25rem' }}
            >
              {guardando ? 'Reprogramando…' : 'Confirmar Reprogramación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
