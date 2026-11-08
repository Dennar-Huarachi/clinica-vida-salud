import React, { useEffect } from 'react';
import useDisponibilidadTurnos from './useDisponibilidadTurnos';

/**
 * SelectorDisponibilidadTurnos (CU-10)
 * Componente modular y reutilizable para consultar y seleccionar turnos médicos disponibles.
 *
 * Props:
 * - idEspecialidad: ID de la especialidad seleccionada
 * - idMedico: ID del médico especialista seleccionado
 * - fecha: Fecha de consulta en formato YYYY-MM-DD
 * - onSeleccionarTurno: Callback invocado al hacer clic en un turno libre: (turno) => void
 * - turnoSeleccionado: Turno actualmente seleccionado { hora_inicio, hora_fin }
 * - claveRefresco: Disparador numérico para forzar recarga inmediata desde el componente padre
 */
export default function SelectorDisponibilidadTurnos({
  idEspecialidad,
  idMedico,
  fecha,
  onSeleccionarTurno,
  turnoSeleccionado = null,
  claveRefresco = 0,
}) {
  const {
    turnos,
    turnosDisponibles,
    cargando,
    motivoBloqueo,
    errorServidor,
    refrescar,
  } = useDisponibilidadTurnos({
    idMedico,
    idEspecialidad,
    fecha,
    turnoSeleccionado,
    onDeseleccionarTurno: () => onSeleccionarTurno && onSeleccionarTurno(null),
  });

  // Re-consultar cuando el componente padre incremente la clave de refresco (ej. tras un conflicto 409)
  useEffect(() => {
    if (claveRefresco > 0) {
      refrescar();
    }
  }, [claveRefresco, refrescar]);

  return (
    <div className="selector-disponibilidad-contenedor" style={{ marginTop: '1.25rem', marginBottom: '1.25rem' }}>
      <label
        className="etiqueta-campo"
        style={{
          display: 'block',
          marginBottom: '0.6rem',
          fontWeight: 700,
          color: '#0A6C84',
          fontSize: '0.9rem',
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
        }}
      >
        Turnos de Atención Disponibles:
      </label>

      {/* 1. Estado de Carga */}
      {cargando && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--turquesa)', padding: '0.75rem 0' }}>
          <span className="spinner-tabla" style={{ width: '16px', height: '16px' }} />
          <span style={{ fontSize: '0.9rem', fontStyle: 'italic' }}>Calculando turnos disponibles en tiempo real…</span>
        </div>
      )}

      {/* 2. Error de Bloqueo institucional o médico (RN20, suspensiones) */}
      {!cargando && motivoBloqueo && (
        <div
          className="alerta-error"
          style={{
            margin: '0.5rem 0',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            fontSize: '0.88rem',
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#B91C1C',
          }}
        >
          {motivoBloqueo}
        </div>
      )}

      {/* 3. Error HTTP / Validación (RN06, RN18 o general) */}
      {!cargando && errorServidor && (
        <div
          className="alerta-error"
          style={{
            margin: '0.5rem 0',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            fontSize: '0.88rem',
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#B91C1C',
          }}
        >
          {errorServidor}
        </div>
      )}

      {/* 4. Sin turnos disponibles para ese día */}
      {!cargando && !motivoBloqueo && !errorServidor && turnosDisponibles.length === 0 && idMedico && idEspecialidad && (
        <div
          style={{
            padding: '1rem',
            background: '#F8FAFC',
            border: '1px dashed #CBD5E1',
            borderRadius: '8px',
            textAlign: 'center',
            color: 'var(--texto-sec)',
            fontSize: '0.88rem',
          }}
        >
          No hay turnos disponibles para esta fecha. Elija otra fecha u otro médico.
        </div>
      )}

      {/* 5. Cuadrícula de Turnos (Filtro estricto: solo turnos disponibles) */}
      {!cargando && !motivoBloqueo && !errorServidor && turnosDisponibles.length > 0 && (
        <>
          <div className="cuadricula-turnos-cu10">
            {turnos
              .filter((turno) => turno.disponible === true || turno.disponible === 1)
              .map((t) => {
                const seleccionado = turnoSeleccionado?.hora_inicio === t.hora_inicio;
                return (
                  <button
                    key={t.hora_inicio}
                    type="button"
                    onClick={() => onSeleccionarTurno && onSeleccionarTurno(t)}
                    className={`slot-turno-cu10 disponible ${seleccionado ? 'seleccionado' : ''}`}
                    title={`Seleccionar turno ${t.hora_inicio}`}
                    aria-label={`Turno ${t.hora_inicio}`}
                  >
                    <span className="slot-hora-inicio">{t.hora_inicio}</span>
                  </button>
                );
              })}
          </div>

          {turnoSeleccionado && (
            <div
              style={{
                marginTop: '0.85rem',
                padding: '0.6rem 0.9rem',
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '6px',
                color: '#166534',
                fontSize: '0.9rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Turno seleccionado: <strong>{turnoSeleccionado.hora_inicio}</strong></span>
            </div>
          )}
        </>
      )}

      <style>{`
        .cuadricula-turnos-cu10 {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 0.65rem;
          margin-top: 0.75rem;
          width: 100%;
          box-sizing: border-box;
        }

        .slot-turno-cu10 {
          min-height: 44px;
          min-width: 44px;
          padding: 0.5rem 0.25rem;
          border: 1.5px solid #CFDEE3;
          border-radius: 8px;
          background: #FFFFFF;
          color: var(--texto);
          font-weight: 700;
          cursor: pointer;
          transition: all 0.18s ease-in-out;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          box-sizing: border-box;
          user-select: none;
        }

        .slot-turno-cu10 .slot-hora-inicio {
          font-size: 0.95rem;
          line-height: 1;
          font-weight: 700;
        }

        .slot-turno-cu10.disponible:hover {
          border-color: var(--naranja);
          background: #FFF8F2;
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(242, 140, 30, 0.18);
        }

        .slot-turno-cu10.seleccionado {
          border-color: var(--naranja) !important;
          background: var(--naranja) !important;
          color: #FFFFFF !important;
          box-shadow: 0 2px 8px rgba(242, 140, 30, 0.35);
        }

        .slot-turno-cu10.ocupado {
          background: #F0F4F6;
          color: #94A3B8;
          border-color: #E2E8F0;
          cursor: not-allowed;
          opacity: 0.7;
          text-decoration: line-through;
        }

        @media (max-width: 640px) {
          .cuadricula-turnos-cu10 {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 0.5rem;
          }

          .slot-turno-cu10 {
            min-height: 44px !important;
            padding: 0.5rem 0.2rem !important;
          }
        }
      `}</style>
    </div>
  );
}
