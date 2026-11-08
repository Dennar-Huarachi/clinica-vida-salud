import React, { useState, useEffect, useRef } from 'react';

const DIAS_SEMANA = [
  { id: 1, corto: 'Lun', nombre: 'Lunes' },
  { id: 2, corto: 'Mar', nombre: 'Martes' },
  { id: 3, corto: 'Mié', nombre: 'Miércoles' },
  { id: 4, corto: 'Jue', nombre: 'Jueves' },
  { id: 5, corto: 'Vie', nombre: 'Viernes' },
  { id: 6, corto: 'Sáb', nombre: 'Sábado' },
  { id: 7, corto: 'Dom', nombre: 'Domingo' },
];

export default function ModalHorario({
  abierto,
  alCerrar,
  alGuardar,
  horarioEditando,
  medicos = [],
  cargando = false,
}) {
  const [idMedico, setIdMedico] = useState('');
  const [idEspecialidad, setIdEspecialidad] = useState('');
  const [diasSeleccionados, setDiasSeleccionados] = useState([1]);
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFin, setHoraFin] = useState('12:00');
  const [duracion, setDuracion] = useState(15);
  const [asignarDescanso, setAsignarDescanso] = useState(true);
  const [errores, setErrores] = useState({});

  // Buscador predictivo de médico
  const [busquedaMedico, setBusquedaMedico] = useState('');
  const [desplegableMedicoAbierto, setDesplegableMedicoAbierto] = useState(false);
  const comboboxRef = useRef(null);

  // Cerrar desplegable al hacer clic fuera
  useEffect(() => {
    function manejarClicFuera(e) {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target)) {
        setDesplegableMedicoAbierto(false);
      }
    }
    document.addEventListener('mousedown', manejarClicFuera);
    return () => document.removeEventListener('mousedown', manejarClicFuera);
  }, []);

  // Inicializar o resetear modal
  useEffect(() => {
    if (!abierto) return;

    if (horarioEditando) {
      const medId = horarioEditando.id_medico ? String(horarioEditando.id_medico) : '';
      const espId = horarioEditando.id_especialidad ? String(horarioEditando.id_especialidad) : '';
      setIdMedico(medId);
      setIdEspecialidad(espId);
      setDiasSeleccionados([Number(horarioEditando.dia_semana) || 1]);
      setHoraInicio(horarioEditando.hora_inicio ? horarioEditando.hora_inicio.substring(0, 5) : '08:00');
      setHoraFin(horarioEditando.hora_fin ? horarioEditando.hora_fin.substring(0, 5) : '12:00');
      setDuracion(horarioEditando.duracion_intervalo_minutos || 15);
      setAsignarDescanso(true);
    } else {
      const primerMed = medicos.find((m) => (m.especialidades || []).length > 0) || medicos[0];
      const medId = primerMed ? String(primerMed.id_medico) : '';
      const primerEsp = primerMed?.especialidades?.[0];
      const espId = primerEsp ? String(primerEsp.id_especialidad) : '';

      setIdMedico(medId);
      setIdEspecialidad(espId);
      setDiasSeleccionados([1, 2, 3, 4, 5]); // Por defecto Lun a Vie en nuevo
      setHoraInicio('08:00');
      setHoraFin('12:00');
      setDuracion(primerEsp?.duracion_turno_minutos || 15);
      setAsignarDescanso(true);
    }
    setBusquedaMedico('');
    setDesplegableMedicoAbierto(false);
    setErrores({});
  }, [horarioEditando, abierto, medicos]);

  // Médico seleccionado actual
  const medicoSeleccionado = medicos.find((m) => Number(m.id_medico) === Number(idMedico));
  const especialidadesDisponibles = medicoSeleccionado?.especialidades || [];

  // Cuando cambia el médico desde el autocompletado
  const seleccionarMedico = (med) => {
    const nuevoId = String(med.id_medico);
    setIdMedico(nuevoId);
    setDesplegableMedicoAbierto(false);
    setBusquedaMedico('');

    // Auto-seleccionar primera especialidad disponible del profesional
    const primerEsp = med?.especialidades?.[0];
    if (primerEsp) {
      setIdEspecialidad(String(primerEsp.id_especialidad));
      if (primerEsp.duracion_turno_minutos) {
        setDuracion(primerEsp.duracion_turno_minutos);
      }
    } else {
      setIdEspecialidad('');
    }
    setErrores((prev) => ({ ...prev, id_medico: null, id_especialidad: null, general: null }));
  };

  const limpiarMedico = () => {
    setIdMedico('');
    setIdEspecialidad('');
    setBusquedaMedico('');
    setDesplegableMedicoAbierto(true);
  };

  // Sincronización continua de seguridad de especialidad
  useEffect(() => {
    if (medicoSeleccionado && especialidadesDisponibles.length > 0) {
      const coincide = especialidadesDisponibles.some(
        (e) => Number(e.id_especialidad) === Number(idEspecialidad)
      );
      if (!coincide) {
        const primera = especialidadesDisponibles[0];
        setIdEspecialidad(String(primera.id_especialidad));
        if (primera.duracion_turno_minutos) {
          setDuracion(primera.duracion_turno_minutos);
        }
      }
    } else if (!medicoSeleccionado || especialidadesDisponibles.length === 0) {
      setIdEspecialidad('');
    }
  }, [idMedico, medicoSeleccionado, especialidadesDisponibles, idEspecialidad]);

  // Manejar cambio manual de especialidad
  const manejarCambioEspecialidad = (idEsp) => {
    setIdEspecialidad(String(idEsp));
    const esp = especialidadesDisponibles.find((e) => Number(e.id_especialidad) === Number(idEsp));
    if (esp?.duracion_turno_minutos) {
      setDuracion(esp.duracion_turno_minutos);
    }
    setErrores((prev) => ({ ...prev, id_especialidad: null, general: null }));
  };

  // Manejo de chips de días
  const alternarDia = (diaId) => {
    setDiasSeleccionados((prev) => {
      if (prev.includes(diaId)) {
        return prev.filter((d) => d !== diaId);
      } else {
        return [...prev, diaId].sort((a, b) => a - b);
      }
    });
    setErrores((prev) => ({ ...prev, dias_semana: null, dia_semana: null }));
  };

  const seleccionarLunesAViernes = () => {
    setDiasSeleccionados([1, 2, 3, 4, 5]);
    setErrores((prev) => ({ ...prev, dias_semana: null, dia_semana: null }));
  };

  const seleccionarLMV = () => {
    setDiasSeleccionados([1, 3, 5]);
    setErrores((prev) => ({ ...prev, dias_semana: null, dia_semana: null }));
  };

  const limpiarDias = () => {
    setDiasSeleccionados([]);
  };

  // Cálculo reactivo de turnos generados y residuo/descanso (Mejora 3)
  const calcularTurnos = () => {
    if (!horaInicio || !horaFin || !duracion || duracion <= 0) {
      return { valido: false, mensaje: 'Ingrese horas y duración válidas para calcular los turnos.' };
    }

    const [hIni, mIni] = horaInicio.split(':').map(Number);
    const [hFin, mFin] = horaFin.split(':').map(Number);

    if (isNaN(hIni) || isNaN(mIni) || isNaN(hFin) || isNaN(mFin)) {
      return { valido: false, mensaje: 'Formato de hora no válido (HH:mm).' };
    }

    const totalMinutosInicio = hIni * 60 + mIni;
    const totalMinutosFin = hFin * 60 + mFin;
    const diferencia = totalMinutosFin - totalMinutosInicio;

    if (diferencia <= 0) {
      return { valido: false, mensaje: 'La hora de fin debe ser estrictamente posterior a la hora de inicio.' };
    }

    if (diferencia < duracion) {
      return {
        valido: false,
        mensaje: `El rango (${diferencia} min) no permite alojar al menos un turno completo de ${duracion} min.`,
      };
    }

    const resto = diferencia % duracion;
    const turnos = Math.floor(diferencia / duracion);
    const horaFinExactaSugerida = (() => {
      const minAjustado = totalMinutosInicio + (turnos * duracion);
      const hAjust = String(Math.floor(minAjustado / 60)).padStart(2, '0');
      const mAjust = String(minAjustado % 60).padStart(2, '0');
      return `${hAjust}:${mAjust}`;
    })();

    if (resto !== 0) {
      if (asignarDescanso) {
        const turnoMedio = Math.floor(turnos / 2);
        return {
          valido: true,
          tieneResiduo: true,
          resto,
          turnos,
          horaFinExactaSugerida,
          mensaje: `☕ Capacidad con descanso: ${turnos} turnos de ${duracion} min + 1 descanso de ${resto} min a mitad de jornada (tras el turno ${turnoMedio}).`,
        };
      } else {
        return {
          valido: false,
          tieneResiduo: true,
          resto,
          turnos,
          horaFinExactaSugerida,
          mensaje: `⚠️ El rango seleccionado (${diferencia} min) no es divisible exacto entre ${duracion} min (sobran ${resto} min). Active el descanso o ajuste la hora final.`,
        };
      }
    }

    return {
      valido: true,
      tieneResiduo: false,
      resto: 0,
      turnos,
      mensaje: `⚡ Capacidad exacta: de ${horaInicio} a ${horaFin} cada ${duracion} min = ${turnos} turnos generados por jornada.`,
    };
  };

  const calculo = calcularTurnos();

  const ajustarHoraFinAMultiplo = () => {
    if (calculo.horaFinExactaSugerida) {
      setHoraFin(calculo.horaFinExactaSugerida);
    }
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setErrores({});

    const medIdNum = Number(idMedico);
    let espIdNum = Number(idEspecialidad);

    // Auto-recuperación de especialidad
    if (!espIdNum && especialidadesDisponibles.length > 0) {
      espIdNum = Number(especialidadesDisponibles[0].id_especialidad);
      setIdEspecialidad(String(espIdNum));
    }

    if (!medIdNum) {
      setErrores({ id_medico: 'Debe seleccionar un profesional médico.' });
      return;
    }

    const espValida = especialidadesDisponibles.some(
      (esp) => Number(esp.id_especialidad) === espIdNum
    );

    if (!espIdNum || !espValida) {
      setErrores({ id_especialidad: 'Debe seleccionar una especialidad médica asignada al profesional.' });
      return;
    }

    if (diasSeleccionados.length === 0) {
      setErrores({ dias_semana: 'Debe seleccionar al menos un día de atención semanal.' });
      return;
    }

    if (!calculo.valido) {
      setErrores({ general: calculo.mensaje });
      return;
    }

    const payload = {
      id_medico: medIdNum,
      id_especialidad: espIdNum,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      duracion_intervalo_minutos: parseInt(duracion, 10),
      estado: horarioEditando ? horarioEditando.estado : 'activo',
    };

    if (horarioEditando) {
      payload.dia_semana = diasSeleccionados[0] || 1;
    } else {
      payload.dias_semana = diasSeleccionados;
      if (diasSeleccionados.length === 1) {
        payload.dia_semana = diasSeleccionados[0];
      }
    }

    alGuardar(payload, setErrores);
  };

  // Filtrado reactivo para el combobox predictivo
  const medicosFiltrados = medicos.filter((m) => {
    const q = busquedaMedico.trim().toLowerCase();
    if (!q) return true;
    const nombreCompleto = `${m.nombres || ''} ${m.apellidos || ''}`.toLowerCase();
    const matricula = (m.nro_matricula || '').toLowerCase();
    const espNombres = (m.especialidades || []).map((e) => e.nombre.toLowerCase()).join(' ');
    return nombreCompleto.includes(q) || matricula.includes(q) || espNombres.includes(q);
  });

  if (!abierto) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(18, 52, 59, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
    >
      <div className="tarjeta modal-horario-caja" style={{ maxWidth: '620px', width: '100%', maxHeight: '92vh', overflowY: 'auto' }}>
        <h3 className="titulo" style={{ fontSize: '1.35rem', marginBottom: '1rem' }}>
          <b>{horarioEditando ? 'Editar Franja' : 'Configurar Horarios'}</b> <span>de Atención</span>
        </h3>

        {errores.general && (
          <div
            style={{
              background: '#FEE2E2',
              color: '#991B1B',
              border: '1px solid #F87171',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              marginBottom: '1rem',
              lineHeight: 1.45,
            }}
          >
            {errores.general}
          </div>
        )}

        <form onSubmit={manejarEnvio}>
          {/* ============================================================
              1. BUSCADOR PREDICTIVO DE MÉDICOS (COMBOBOX / AUTOCOMPLETE)
              ============================================================ */}
          <div style={{ marginBottom: '1rem', position: 'relative' }} ref={comboboxRef}>
            <label className="etiqueta-campo" style={{ display: 'block', marginBottom: '0.35rem' }}>
              Profesional Médico <span style={{ color: 'var(--cancelada)' }}>*</span>
            </label>

            {medicoSeleccionado ? (
              /* Ficha del médico seleccionado con botón ✕ para cambiar */
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6rem 0.85rem',
                  background: '#F0FDF4',
                  border: '1.5px solid #86EFAC',
                  borderRadius: '8px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.95rem' }}>
                    Dr. {medicoSeleccionado.apellidos}, {medicoSeleccionado.nombres}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#15803D' }}>
                    Matrícula: {medicoSeleccionado.nro_matricula || 'S/N'} · Especialidades: {especialidadesDisponibles.map((e) => e.nombre).join(', ') || 'Sin especialidad'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={limpiarMedico}
                  title="Cambiar médico"
                  aria-label="Cambiar médico"
                  style={{
                    background: '#DCFCE7',
                    border: '1px solid #86EFAC',
                    color: '#15803D',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                  }}
                >
                  ✕
                </button>
              </div>
            ) : (
              /* Input buscador interactivo */
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#0A6C84"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }}
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    value={busquedaMedico}
                    onChange={(e) => {
                      setBusquedaMedico(e.target.value);
                      setDesplegableMedicoAbierto(true);
                    }}
                    onFocus={() => setDesplegableMedicoAbierto(true)}
                    placeholder="Buscar médico por nombre o matrícula..."
                    className="campo-control"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem 0.65rem 2.4rem',
                      borderRadius: '6px',
                      border: errores.id_medico ? '1.5px solid var(--cancelada)' : '1px solid var(--borde-campo)',
                      fontSize: '0.95rem',
                      background: '#FFFFFF',
                    }}
                  />
                </div>

                {/* Menú flotante desplegable */}
                {desplegableMedicoAbierto && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      maxHeight: '220px',
                      overflowY: 'auto',
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      boxShadow: '0 8px 24px rgba(10, 108, 132, 0.15)',
                      zIndex: 200,
                      marginTop: '4px',
                    }}
                  >
                    {medicosFiltrados.length === 0 ? (
                      <div style={{ padding: '0.75rem 1rem', color: 'var(--texto-sec)', fontSize: '0.88rem', fontStyle: 'italic' }}>
                        No se encontraron profesionales con ese criterio.
                      </div>
                    ) : (
                      medicosFiltrados.map((m) => (
                        <div
                          key={m.id_medico}
                          onClick={() => seleccionarMedico(m)}
                          style={{
                            padding: '0.6rem 0.85rem',
                            borderBottom: '1px solid #F1F5F9',
                            cursor: 'pointer',
                            transition: 'background-color 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F0F9FF')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                        >
                          <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.92rem' }}>
                            Dr. {m.apellidos}, {m.nombres}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                            Mat: <span style={{ fontWeight: 600 }}>{m.nro_matricula || 'S/N'}</span> · Especialidades: {m.especialidades?.map((e) => e.nombre).join(', ') || 'Sin asignar'}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
            {errores.id_medico && (
              <span className="mensaje-error-campo" style={{ color: 'var(--cancelada)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                {errores.id_medico}
              </span>
            )}
          </div>

          {/* ============================================================
              2. SELECTOR DE ESPECIALIDAD VINCULADA
              ============================================================ */}
          <div style={{ marginBottom: '1rem' }}>
            <label className="etiqueta-campo" htmlFor="selector-especialidad" style={{ display: 'block', marginBottom: '0.35rem' }}>
              Especialidad Médica Asignada <span style={{ color: 'var(--cancelada)' }}>*</span>
            </label>
            <select
              id="selector-especialidad"
              value={idEspecialidad}
              onChange={(e) => manejarCambioEspecialidad(e.target.value)}
              disabled={especialidadesDisponibles.length === 0}
              className="campo-control"
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                borderRadius: '6px',
                border: errores.id_especialidad ? '1.5px solid var(--cancelada)' : '1px solid var(--borde-campo)',
                background: especialidadesDisponibles.length === 0 ? '#F3F4F6' : '#FFFFFF',
                fontSize: '0.95rem',
              }}
            >
              {especialidadesDisponibles.length === 0 ? (
                <option value="">{medicoSeleccionado ? 'El médico no tiene especialidades activas' : '-- Primero seleccione un médico --'}</option>
              ) : (
                especialidadesDisponibles.map((esp) => (
                  <option key={esp.id_especialidad} value={String(esp.id_especialidad)}>
                    🩺 {esp.nombre} {esp.duracion_turno_minutos ? `(${esp.duracion_turno_minutos} min)` : ''}
                  </option>
                ))
              )}
            </select>
            {errores.id_especialidad && (
              <span className="mensaje-error-campo" style={{ color: 'var(--cancelada)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                {errores.id_especialidad}
              </span>
            )}
          </div>

          {/* ============================================================
              3. SELECCIÓN MÚLTIPLE DE DÍAS (CHIPS TOGGLE Y ACCIONES RÁPIDAS)
              ============================================================ */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <label className="etiqueta-campo" style={{ margin: 0 }}>
                {horarioEditando ? 'Día de Atención' : 'Días de Atención Semanal (Multi-Día)'} <span style={{ color: 'var(--cancelada)' }}>*</span>
              </label>

              {!horarioEditando && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={seleccionarLunesAViernes}
                    className="boton-atajo-dia"
                    title="Marcar Lunes a Viernes"
                  >
                    Lun a Vie
                  </button>
                  <button
                    type="button"
                    onClick={seleccionarLMV}
                    className="boton-atajo-dia"
                    title="Marcar Lunes, Miércoles y Viernes"
                  >
                    L-M-V
                  </button>
                  <button
                    type="button"
                    onClick={limpiarDias}
                    className="boton-atajo-dia"
                    title="Limpiar selección"
                  >
                    Limpiar
                  </button>
                </div>
              )}
            </div>

            {/* Grupo de Chips Toggle */}
            <div className="grupo-chips-dias">
              {DIAS_SEMANA.map((d) => {
                const activo = diasSeleccionados.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      if (horarioEditando) {
                        setDiasSeleccionados([d.id]);
                      } else {
                        alternarDia(d.id);
                      }
                    }}
                    className={`chip-dia-toggle ${activo ? 'chip-dia-activo' : ''}`}
                    title={d.nombre}
                    aria-pressed={activo}
                  >
                    <span className="chip-dia-corto">{d.corto}</span>
                    <span className="chip-dia-nombre">{d.nombre}</span>
                  </button>
                );
              })}
            </div>
            {(errores.dias_semana || errores.dia_semana) && (
              <span className="mensaje-error-campo" style={{ color: 'var(--cancelada)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                {errores.dias_semana || errores.dia_semana}
              </span>
            )}
          </div>

          {/* ============================================================
              4. DURACIÓN Y FRANJA HORARIA (INICIO Y FIN)
              ============================================================ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label className="etiqueta-campo" htmlFor="input-inicio" style={{ display: 'block', marginBottom: '0.35rem' }}>
                Hora Inicial <span style={{ color: 'var(--cancelada)' }}>*</span>
              </label>
              <input
                id="input-inicio"
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="campo-control"
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '6px',
                  border: errores.hora_inicio ? '1.5px solid var(--cancelada)' : '1px solid var(--borde-campo)',
                  background: '#FFFFFF',
                  fontSize: '0.95rem',
                }}
                required
              />
              {errores.hora_inicio && (
                <span className="mensaje-error-campo" style={{ color: 'var(--cancelada)', fontSize: '0.8rem' }}>
                  {errores.hora_inicio}
                </span>
              )}
            </div>

            <div>
              <label className="etiqueta-campo" htmlFor="input-fin" style={{ display: 'block', marginBottom: '0.35rem' }}>
                Hora Final <span style={{ color: 'var(--cancelada)' }}>*</span>
              </label>
              <input
                id="input-fin"
                type="time"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                className="campo-control"
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '6px',
                  border: errores.hora_fin ? '1.5px solid var(--cancelada)' : '1px solid var(--borde-campo)',
                  background: '#FFFFFF',
                  fontSize: '0.95rem',
                }}
                required
              />
              {errores.hora_fin && (
                <span className="mensaje-error-campo" style={{ color: 'var(--cancelada)', fontSize: '0.8rem' }}>
                  {errores.hora_fin}
                </span>
              )}
            </div>

            <div>
              <label className="etiqueta-campo" htmlFor="input-duracion" style={{ display: 'block', marginBottom: '0.35rem' }}>
                Duración Turno (min) <span style={{ color: 'var(--cancelada)' }}>*</span>
              </label>
              <input
                id="input-duracion"
                type="number"
                min="5"
                max="120"
                step="5"
                value={duracion}
                onChange={(e) => setDuracion(Number(e.target.value))}
                className="campo-control"
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '6px',
                  border: errores.duracion_intervalo_minutos ? '1.5px solid var(--cancelada)' : '1px solid var(--borde-campo)',
                  background: '#FFFFFF',
                  fontSize: '0.95rem',
                }}
                required
              />
              {errores.duracion_intervalo_minutos && (
                <span className="mensaje-error-campo" style={{ color: 'var(--cancelada)', fontSize: '0.8rem' }}>
                  {errores.duracion_intervalo_minutos}
                </span>
              )}
            </div>
          </div>

          {/* ============================================================
              5. GESTIÓN FLEXIBLE DEL TIEMPO SOBRANTE: RECESO INTERMEDIO
              ============================================================ */}
          {calculo.tieneResiduo && (
            <div
              style={{
                padding: '0.85rem 1rem',
                borderRadius: '8px',
                marginBottom: '1.25rem',
                background: asignarDescanso ? '#F0FDFA' : '#FFFBEB',
                border: `1.5px solid ${asignarDescanso ? '#2DD4BF' : '#FCD34D'}`,
                color: asignarDescanso ? '#0F766E' : '#92400E',
                fontSize: '0.88rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={asignarDescanso}
                    onChange={(e) => setAsignarDescanso(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#0A6C84' }}
                  />
                  <span>☕ Asignar los <strong>{calculo.resto} min</strong> sobrantes como receso/descanso intermedio del médico.</span>
                </label>

                {!asignarDescanso && calculo.horaFinExactaSugerida && (
                  <button
                    type="button"
                    onClick={ajustarHoraFinAMultiplo}
                    style={{
                      background: '#F59E0B',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Ajustar Hora Fin a {calculo.horaFinExactaSugerida}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Previsualizador reactivo de capacidad de turnos */}
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '8px',
              marginBottom: '1.25rem',
              background: calculo.valido ? '#ECFDF5' : '#FEF2F2',
              border: `1.5px solid ${calculo.valido ? '#10B981' : '#F87171'}`,
              color: calculo.valido ? '#065F46' : '#991B1B',
              fontSize: '0.875rem',
              lineHeight: 1.45,
            }}
          >
            <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {calculo.mensaje}
            </div>
          </div>

          {/* Botones de acción accesibles */}
          <div className="modal-horarios-botones" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={alCerrar}
              className="boton-terciario"
              style={{ minHeight: '44px' }}
              disabled={cargando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="boton-primario"
              style={{ minHeight: '44px' }}
              disabled={cargando || !calculo.valido}
            >
              {cargando ? 'Guardando...' : horarioEditando ? 'Actualizar Horario' : 'Guardar Horario(s)'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .grupo-chips-dias {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
          width: 100%;
          box-sizing: border-box;
        }

        .chip-dia-toggle {
          min-height: 44px;
          min-width: 44px;
          padding: 0.4rem 0.2rem;
          background: #FFFFFF;
          border: 1.5px solid #CBD5E1;
          border-radius: 8px;
          color: #334155;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease-in-out;
          user-select: none;
        }

        .chip-dia-toggle:hover {
          border-color: #0A6C84;
          background: #F0F9FF;
        }

        .chip-dia-toggle.chip-dia-activo {
          background: #0A6C84 !important;
          border-color: #0A6C84 !important;
          color: #FFFFFF !important;
          box-shadow: 0 2px 6px rgba(10, 108, 132, 0.3);
        }

        .chip-dia-corto {
          font-size: 0.95rem;
          font-weight: 700;
          line-height: 1;
        }

        .chip-dia-nombre {
          font-size: 0.65rem;
          opacity: 0.85;
          margin-top: 2px;
          display: none;
        }

        .boton-atajo-dia {
          background: #E2ECEF;
          border: 1px solid #CBD5E1;
          color: #0A6C84;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.2rem 0.55rem;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }

        .boton-atajo-dia:hover {
          background: #D5E7EB;
        }

        @media (min-width: 480px) {
          .chip-dia-nombre {
            display: block;
          }
        }

        @media (max-width: 640px) {
          .modal-horarios-botones {
            flex-direction: column !important;
            width: 100%;
            gap: 0.5rem !important;
          }
          .modal-horarios-botones button {
            width: 100% !important;
            min-height: 44px !important;
          }
          .grupo-chips-dias {
            gap: 4px;
          }
          .chip-dia-toggle {
            min-height: 44px !important;
            padding: 0.35rem 0.1rem;
          }
        }
      `}</style>
    </div>
  );
}
