import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../compartido/utilidades/api';
import LayoutPrincipal from '../../../compartido/layouts/LayoutPrincipal';
import Alerta from '../../../compartido/componentes/Alerta';

// Sugerencias diagnósticas frecuentes (CIE-10 / Juicio Clínico) para agilidad en consulta
const SUGERENCIAS_CIE10 = [
  'J00 - Rinofaringitis aguda (Resfriado común)',
  'J02.9 - Faringitis aguda, no especificada',
  'I10 - Hipertensión esencial (primaria)',
  'E11 - Diabetes mellitus no insulinodependiente (Tipo 2)',
  'K29.7 - Gastritis, no especificada',
  'M54.5 - Lumbago no especificado',
  'A09 - Diarrea y gastroenteritis de presunto origen infeccioso',
  'J20.9 - Bronquitis aguda, no especificada',
  'N39.0 - Infección de vías urinarias, sitio no especificado',
  'R51 - Cefalea / Dolor de cabeza',
];

export default function FormularioAtencionClinica() {
  const { idCita } = useParams();
  const navigate = useNavigate();

  const [cita, setCita] = useState(null);
  const [cargandoCita, setCargandoCita] = useState(true);

  const [formulario, setFormulario] = useState({
    id_cita: Number(idCita),
    motivo_atencion: '',
    examen_fisico: '',
    diagnostico: '',
    tratamiento_indicaciones: '',
    receta_medica: '',
  });

  const [errores, setErrores] = useState({});
  const [alerta, setAlerta] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // Cargar datos de la cita para contexto del profesional
  useEffect(() => {
    if (!idCita) return;
    setCargandoCita(true);

    api
      .get('/citas/agenda')
      .then((res) => {
        const citas = res.data?.datos || [];
        const encontrada = citas.find((c) => String(c.id_cita) === String(idCita));
        if (encontrada) {
          setCita(encontrada);
          if (encontrada.motivo_consulta && !formulario.motivo_atencion) {
            setFormulario((prev) => ({
              ...prev,
              motivo_atencion: encontrada.motivo_consulta,
            }));
          }
        }
      })
      .catch(() => {
        // Silencioso: si no se encuentra en la agenda de hoy, se continúa con el formulario
      })
      .finally(() => {
        setCargandoCita(false);
      });
  }, [idCita]);

  const aplicarSugerenciaCIE10 = (sug) => {
    setFormulario((prev) => ({
      ...prev,
      diagnostico: prev.diagnostico ? `${prev.diagnostico}; ${sug}` : sug,
    }));
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setAlerta(null);
    setErrores({});
    setEnviando(true);

    try {
      await api.post('/historia-clinica/atenciones', formulario);
      setAlerta({
        tipo: 'exito',
        mensaje: 'Atención médica registrada exitosamente. La cita ha sido marcada como concluida.',
      });
      setTimeout(() => {
        navigate('/medico/agenda');
      }, 1500);
    } catch (err) {
      if (err.response?.status === 422 && err.response.data?.errores) {
        setErrores(err.response.data.errores);
      } else {
        setAlerta({
          tipo: 'error',
          mensaje: err.response?.data?.mensaje || 'Error al guardar el registro de la atención médica.',
        });
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <LayoutPrincipal titulo="Registro de Consulta Médica">
      <div className="formulario-atencion-contenedor">
        {alerta && (
          <div className="mb-4">
            <Alerta
              tipo={alerta.tipo}
              mensaje={alerta.mensaje}
              onCerrar={() => setAlerta(null)}
            />
          </div>
        )}

        {/* Tarjeta de Contexto de la Cita */}
        {cita && (
          <div className="tarjeta-contexto-cita">
            <div className="contexto-cabecera">
              <span className="contexto-codigo">{cita.codigo_cita}</span>
              <span className="contexto-badge-estado">En Atención Clínica</span>
            </div>
            <div className="contexto-grid">
              <div>
                <span className="contexto-etiqueta">Paciente:</span>
                <strong className="contexto-valor">{cita.paciente_nombre_completo || cita.paciente}</strong>
                <span className="contexto-sub">CI: {cita.paciente_ci || cita.ci}</span>
              </div>
              <div>
                <span className="contexto-etiqueta">Especialidad:</span>
                <strong className="contexto-valor">{cita.especialidad_nombre || 'Consulta General'}</strong>
                <span className="contexto-sub">Hora de Turno: {cita.hora_inicio} hrs</span>
              </div>
              {cita.motivo_consulta && (
                <div className="contexto-motivo-col">
                  <span className="contexto-etiqueta">Motivo de Consulta Declarado:</span>
                  <span className="contexto-motivo">{cita.motivo_consulta}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Formulario Principal de Atención */}
        <div className="tarjeta-formulario-atencion">
          <div className="formulario-header">
            <h1 className="formulario-titulo">Evolución y Expediente de Consulta</h1>
            <p className="formulario-subtitulo">
              Registre la anamnesis, hallazgos del examen físico, juicio diagnóstico y prescripción terapéutica. Al guardar, la cita se concluirá automáticamente.
            </p>
          </div>

          <form onSubmit={manejarEnvio} className="form-cuerpo-atencion">
            {/* 1. Motivo de Atención y Anamnesis */}
            <div className="campo-grupo">
              <label htmlFor="motivo_atencion" className="campo-etiqueta">
                1. Motivo de Consulta y Anamnesis *
              </label>
              <textarea
                id="motivo_atencion"
                rows={3}
                className={`campo-control ${errores.motivo_atencion ? 'control-invalido' : ''}`}
                placeholder="Describa el cuadro clínico, síntomas referidos por el paciente, tiempo de evolución y antecedentes inmediatos…"
                value={formulario.motivo_atencion}
                onChange={(e) =>
                  setFormulario({ ...formulario, motivo_atencion: e.target.value })
                }
                required
              />
              {errores.motivo_atencion && (
                <span className="error-texto">{errores.motivo_atencion}</span>
              )}
            </div>

            {/* 2. Examen Físico y Signos Vitales */}
            <div className="campo-grupo">
              <label htmlFor="examen_fisico" className="campo-etiqueta">
                2. Examen Físico y Signos Vitales
              </label>
              <textarea
                id="examen_fisico"
                rows={3}
                className="campo-control"
                placeholder="Presión arterial (PA), frecuencia cardíaca (FC), temperatura, frecuencia respiratoria (FR), peso, talla, auscultación cardiopulmonar, palpación abdominal…"
                value={formulario.examen_fisico}
                onChange={(e) =>
                  setFormulario({ ...formulario, examen_fisico: e.target.value })
                }
              />
            </div>

            {/* 3. Diagnóstico Clínico / CIE-10 */}
            <div className="campo-grupo">
              <div className="etiqueta-con-ayuda">
                <label htmlFor="diagnostico" className="campo-etiqueta">
                  3. Diagnóstico Clínico (CIE-10 / Criterio Médico) *
                </label>
                <span className="ayuda-sugerencias">Sugerencias rápidas:</span>
              </div>

              {/* Chips de sugerencias CIE-10 */}
              <div className="chips-sugerencias-cie10">
                {SUGERENCIAS_CIE10.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    className="chip-cie10"
                    onClick={() => aplicarSugerenciaCIE10(sug)}
                  >
                    + {sug.split(' - ')[0]}
                  </button>
                ))}
              </div>

              <textarea
                id="diagnostico"
                rows={2}
                className={`campo-control ${errores.diagnostico ? 'control-invalido' : ''}`}
                placeholder="Diagnóstico presuntivo o confirmatorio (CIE-10)…"
                value={formulario.diagnostico}
                onChange={(e) =>
                  setFormulario({ ...formulario, diagnostico: e.target.value })
                }
                required
              />
              {errores.diagnostico && (
                <span className="error-texto">{errores.diagnostico}</span>
              )}
            </div>

            {/* 4. Tratamiento e Indicaciones Médicas */}
            <div className="campo-grupo">
              <label htmlFor="tratamiento_indicaciones" className="campo-etiqueta">
                4. Tratamiento y Conducta Terapéutica *
              </label>
              <textarea
                id="tratamiento_indicaciones"
                rows={3}
                className={`campo-control ${errores.tratamiento_indicaciones ? 'control-invalido' : ''}`}
                placeholder="Recomendaciones generales, reposo, régimen higiénico-dietético, solicitud de exámenes complementarios o fecha de control…"
                value={formulario.tratamiento_indicaciones}
                onChange={(e) =>
                  setFormulario({ ...formulario, tratamiento_indicaciones: e.target.value })
                }
                required
              />
              {errores.tratamiento_indicaciones && (
                <span className="error-texto">{errores.tratamiento_indicaciones}</span>
              )}
            </div>

            {/* 5. Prescripción y Receta Médica */}
            <div className="campo-grupo seccion-receta-medica">
              <label htmlFor="receta_medica" className="campo-etiqueta receta-titulo">
                💊 5. Prescripción Farmacológica / Receta Médica
              </label>
              <textarea
                id="receta_medica"
                rows={3}
                className="campo-control control-receta"
                placeholder="Nombre del medicamento (DCI o comercial), concentración, forma farmacéutica, dosis, frecuencia y duración del tratamiento…"
                value={formulario.receta_medica}
                onChange={(e) =>
                  setFormulario({ ...formulario, receta_medica: e.target.value })
                }
              />
            </div>

            {/* Barra de Acciones con Botones Ergonómicos (min-height 44px) */}
            <div className="barra-acciones-formulario">
              <button
                type="button"
                className="btn-volver-agenda"
                onClick={() => navigate('/medico/agenda')}
                disabled={enviando}
              >
                ← Volver a la Agenda
              </button>

              <button
                type="submit"
                className="btn-finalizar-atencion"
                disabled={enviando}
              >
                {enviando ? 'Guardando consulta...' : '✓ Concluir y Guardar Atención Médica'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        .formulario-atencion-contenedor {
          padding: 1.5rem;
          max-width: 860px;
          margin: 0 auto;
        }

        .tarjeta-contexto-cita {
          background: #EAF5F7;
          border: 1px solid #C4DCE0;
          border-radius: 12px;
          padding: 1rem 1.25rem;
          margin-bottom: 1.5rem;
        }

        .contexto-cabecera {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px dashed #B8D8DE;
        }

        .contexto-codigo {
          font-family: monospace;
          font-weight: 700;
          color: #0A6C84;
          font-size: 0.95rem;
        }

        .contexto-badge-estado {
          background: #0A6C84;
          color: #FFFFFF;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 12px;
        }

        .contexto-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.85rem;
        }

        @media (max-width: 600px) {
          .contexto-grid {
            grid-template-columns: 1fr;
          }
        }

        .contexto-motivo-col {
          grid-column: 1 / -1;
        }

        .contexto-etiqueta {
          display: block;
          font-size: 0.72rem;
          text-transform: uppercase;
          font-weight: 700;
          color: #5B7078;
          margin-bottom: 2px;
        }

        .contexto-valor {
          font-size: 0.95rem;
          color: #12343B;
          display: block;
        }

        .contexto-sub {
          font-size: 0.8rem;
          color: #5B7078;
        }

        .contexto-motivo {
          display: block;
          font-size: 0.85rem;
          color: #12343B;
          background: #FFFFFF;
          padding: 0.4rem 0.6rem;
          border-radius: 6px;
          border: 1px solid #D1E5E8;
        }

        .tarjeta-formulario-atencion {
          background: #FFFFFF;
          border-radius: 14px;
          border: 1px solid #E1ECEE;
          box-shadow: 0 4px 16px rgba(10, 108, 132, 0.08);
          padding: 1.75rem 2rem;
        }

        @media (max-width: 600px) {
          .tarjeta-formulario-atencion {
            padding: 1.25rem 1rem;
          }
        }

        .formulario-header {
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #F4FAFB;
        }

        .formulario-titulo {
          margin: 0;
          font-size: 1.35rem;
          font-weight: 800;
          color: #12343B;
          letter-spacing: -0.01em;
        }

        .formulario-subtitulo {
          margin: 0.35rem 0 0 0;
          font-size: 0.85rem;
          color: #5B7078;
          line-height: 1.35;
        }

        .form-cuerpo-atencion {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .campo-grupo {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .campo-etiqueta {
          font-size: 0.85rem;
          font-weight: 700;
          color: #12343B;
        }

        .etiqueta-con-ayuda {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .ayuda-sugerencias {
          font-size: 0.72rem;
          color: #5B7078;
          font-weight: 600;
        }

        .chips-sugerencias-cie10 {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
          margin-bottom: 0.35rem;
        }

        .chip-cie10 {
          background: #F4FAFB;
          border: 1px solid #C4DCE0;
          color: #0A6C84;
          font-size: 0.72rem;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .chip-cie10:hover {
          background: #0A6C84;
          color: #FFFFFF;
          border-color: #0A6C84;
        }

        .campo-control {
          padding: 0.65rem 0.85rem;
          font-size: 0.875rem;
          border: 1px solid #C4DCE0;
          border-radius: 8px;
          background: #FFFFFF;
          color: #12343B;
          outline: none;
          line-height: 1.4;
          font-family: inherit;
          transition: border-color 0.2s, box-shadow 0.2s;
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
          font-weight: 600;
        }

        .seccion-receta-medica {
          background: #FDFEFE;
          border: 1px dashed #1FA5B8;
          border-radius: 10px;
          padding: 1rem;
        }

        .receta-titulo {
          color: #0A6C84;
        }

        .control-receta {
          background: #FFFFFF;
        }

        .barra-acciones-formulario {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1rem;
          padding-top: 1.25rem;
          border-top: 1px solid #E1ECEE;
          flex-wrap: wrap;
        }

        .btn-volver-agenda {
          min-height: 44px;
          background: #FFFFFF;
          color: #5B7078;
          border: 1px solid #C4DCE0;
          font-size: 0.875rem;
          font-weight: 600;
          padding: 0.6rem 1.25rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-volver-agenda:hover:not(:disabled) {
          background: #F4FAFB;
          color: #12343B;
        }

        .btn-finalizar-atencion {
          min-height: 48px;
          background: #0A6C84;
          color: #FFFFFF;
          font-size: 0.95rem;
          font-weight: 700;
          padding: 0.65rem 1.75rem;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-finalizar-atencion:hover:not(:disabled) {
          background: #074F61;
        }

        .btn-finalizar-atencion:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </LayoutPrincipal>
  );
}
