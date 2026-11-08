import React, { useState, useEffect } from 'react';
import api from '../../../compartido/utilidades/api';
import Alerta from '../../../compartido/componentes/Alerta';

const ESTUDIOS_FRECUENTES = [
  'Hemograma Completo',
  'Glucemia en Ayunas',
  'Perfil Lipídico',
  'Examen General de Orina (EGO)',
  'Perfil Renal (Urea / Creatinina)',
  'Perfil Hepático',
  'Radiografía de Tórax',
  'Ecografía Abdominal',
  'Cultivo y Antibiograma',
];

export default function ModalResultadosLab({
  abierto,
  onCerrar,
  idPaciente,
  idAtencion = null,
  nombrePaciente = '',
  alRegistrarExitoso,
}) {
  const hoy = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    id_paciente: idPaciente || '',
    id_atencion: idAtencion || '',
    tipo_estudio: '',
    fecha_estudio: hoy,
    descripcion: '',
    archivo_adjunto: '',
  });

  const [enviando, setEnviando] = useState(false);
  const [alerta, setAlerta] = useState(null);

  useEffect(() => {
    if (abierto) {
      setFormData({
        id_paciente: idPaciente || '',
        id_atencion: idAtencion || '',
        tipo_estudio: '',
        fecha_estudio: hoy,
        descripcion: '',
        archivo_adjunto: '',
      });
      setAlerta(null);
    }
  }, [abierto, idPaciente, idAtencion]);

  if (!abierto) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const seleccionarEstudioSugerido = (nombreEstudio) => {
    setFormData((prev) => ({ ...prev, tipo_estudio: nombreEstudio }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlerta(null);

    if (!formData.tipo_estudio.trim()) {
      setAlerta({ tipo: 'error', mensaje: 'Debe especificar el tipo o nombre del estudio clínico.' });
      return;
    }

    if (!formData.descripcion.trim()) {
      setAlerta({ tipo: 'error', mensaje: 'Debe redactar la descripción, valores o conclusiones del examen.' });
      return;
    }

    if (!formData.fecha_estudio) {
      setAlerta({ tipo: 'error', mensaje: 'La fecha de toma o emisión del estudio es obligatoria.' });
      return;
    }

    try {
      setEnviando(true);
      const payload = {
        id_paciente: parseInt(formData.id_paciente, 10),
        id_atencion: formData.id_atencion ? parseInt(formData.id_atencion, 10) : null,
        tipo_estudio: formData.tipo_estudio.trim(),
        descripcion: formData.descripcion.trim(),
        fecha_estudio: formData.fecha_estudio,
        archivo_adjunto: formData.archivo_adjunto.trim() || null,
      };

      const res = await api.post('/historia-clinica/laboratorios', payload);

      if (alRegistrarExitoso) {
        alRegistrarExitoso(res.data?.datos || payload);
      }

      onCerrar();
    } catch (err) {
      setAlerta({
        tipo: 'error',
        mensaje: err.response?.data?.mensaje || 'Error al guardar el resultado de laboratorio.',
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      className="modal-laboratorio-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-lab-titulo"
    >
      <div className="modal-laboratorio-contenedor">
        {/* Encabezado */}
        <div className="modal-laboratorio-cabecera">
          <div>
            <span className="modal-laboratorio-subtitulo">
              Laboratorio Clínico y Diagnóstico
            </span>
            <h2 id="modal-lab-titulo" className="modal-laboratorio-titulo">
              Registrar Resultado de Estudio
            </h2>
            {nombrePaciente && (
              <p className="modal-laboratorio-paciente">
                Paciente: <strong>{nombrePaciente}</strong>
              </p>
            )}
          </div>
          <button
            type="button"
            className="modal-laboratorio-boton-cerrar"
            onClick={onCerrar}
            aria-label="Cerrar ventana emergente"
          >
            ✕
          </button>
        </div>

        {/* Notificación de alerta */}
        {alerta && (
          <div className="modal-laboratorio-alerta">
            <Alerta
              tipo={alerta.tipo}
              mensaje={alerta.mensaje}
              onCerrar={() => setAlerta(null)}
            />
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="modal-laboratorio-formulario">
          {/* Tipo de Estudio */}
          <div className="grupo-formulario">
            <label htmlFor="tipo_estudio" className="etiqueta-formulario">
              Tipo de Examen o Estudio Clínico <span className="requerido">*</span>
            </label>
            <input
              type="text"
              id="tipo_estudio"
              name="tipo_estudio"
              className="control-formulario"
              placeholder="Ej. Hemograma Completo, Glucemia, Ecografía Renal..."
              value={formData.tipo_estudio}
              onChange={handleChange}
              maxLength={100}
              required
            />

            {/* Chips de sugerencias frecuentes */}
            <div className="chips-estudios-contenedor">
              <span className="chips-estudios-titulo">Frecuentes:</span>
              <div className="chips-estudios-lista">
                {ESTUDIOS_FRECUENTES.map((est) => (
                  <button
                    key={est}
                    type="button"
                    className={`chip-estudio ${formData.tipo_estudio === est ? 'chip-estudio-activo' : ''}`}
                    onClick={() => seleccionarEstudioSugerido(est)}
                  >
                    {est}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Fecha del Estudio */}
          <div className="grupo-formulario">
            <label htmlFor="fecha_estudio" className="etiqueta-formulario">
              Fecha de Emisión / Toma de Muestra <span className="requerido">*</span>
            </label>
            <input
              type="date"
              id="fecha_estudio"
              name="fecha_estudio"
              className="control-formulario"
              value={formData.fecha_estudio}
              onChange={handleChange}
              max={hoy}
              required
            />
          </div>

          {/* Descripción / Resultados / Métricas */}
          <div className="grupo-formulario">
            <label htmlFor="descripcion" className="etiqueta-formulario">
              Descripción, Métricas o Conclusión Médica <span className="requerido">*</span>
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              rows={4}
              className="control-formulario control-textarea"
              placeholder="Detalla valores cuantitativos, hallazgos patológicos, rangos de referencia o la conclusión diagnóstica..."
              value={formData.descripcion}
              onChange={handleChange}
              required
            />
          </div>

          {/* Archivo o Referencia Digital */}
          <div className="grupo-formulario">
            <label htmlFor="archivo_adjunto" className="etiqueta-formulario">
              Referencia / Archivo Adjunto (Opcional)
            </label>
            <input
              type="text"
              id="archivo_adjunto"
              name="archivo_adjunto"
              className="control-formulario"
              placeholder="Ej. INFORME-LAB-984.pdf o URL del repositorio"
              value={formData.archivo_adjunto}
              onChange={handleChange}
              maxLength={255}
            />
            <small className="ayuda-formulario">
              Código de muestra física, folio de laboratorio o nombre del documento escaneado.
            </small>
          </div>

          {/* Botonera de acciones */}
          <div className="modal-laboratorio-acciones">
            <button
              type="button"
              className="boton-secundario modal-btn"
              onClick={onCerrar}
              disabled={enviando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="boton-primario modal-btn"
              disabled={enviando}
            >
              {enviando ? 'Guardando Estudio…' : 'Guardar Resultado'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .modal-laboratorio-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          z-index: 1050;
          animation: modalFadeIn 0.2s ease-out;
        }

        .modal-laboratorio-contenedor {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          width: 100%;
          max-width: 620px;
          max-height: 92vh;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        .modal-laboratorio-cabecera {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--borde, #e2e8f0);
          background: #f8fafc;
          border-top-left-radius: 12px;
          border-top-right-radius: 12px;
        }

        .modal-laboratorio-subtitulo {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--turquesa, #0d9488);
          display: block;
          margin-bottom: 0.2rem;
        }

        .modal-laboratorio-titulo {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--verde-azulado, #0f766e);
          margin: 0;
        }

        .modal-laboratorio-paciente {
          font-size: 0.85rem;
          color: var(--texto-sec, #64748b);
          margin: 0.25rem 0 0 0;
        }

        .modal-laboratorio-boton-cerrar {
          background: none;
          border: none;
          font-size: 1.25rem;
          color: var(--texto-sec, #64748b);
          cursor: pointer;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: background-color 0.15s ease, color 0.15s ease;
        }

        .modal-laboratorio-boton-cerrar:hover {
          background-color: #e2e8f0;
          color: #1e293b;
        }

        .modal-laboratorio-alerta {
          padding: 1rem 1.5rem 0 1.5rem;
        }

        .modal-laboratorio-formulario {
          padding: 1.25rem 1.5rem 1.5rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.15rem;
        }

        .etiqueta-formulario {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: #334155;
          margin-bottom: 0.35rem;
        }

        .requerido {
          color: #ef4444;
        }

        .control-formulario {
          width: 100%;
          padding: 0.65rem 0.85rem;
          border: 1px solid var(--borde, #cbd5e1);
          border-radius: 8px;
          font-size: 0.925rem;
          color: #1e293b;
          background: #ffffff;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          box-sizing: border-box;
          min-height: 44px;
        }

        .control-formulario:focus {
          outline: none;
          border-color: var(--turquesa, #0d9488);
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.15);
        }

        .control-textarea {
          resize: vertical;
          min-height: 96px;
          line-height: 1.5;
        }

        .ayuda-formulario {
          display: block;
          font-size: 0.775rem;
          color: var(--texto-sec, #64748b);
          margin-top: 0.3rem;
        }

        .chips-estudios-contenedor {
          margin-top: 0.5rem;
        }

        .chips-estudios-titulo {
          font-size: 0.75rem;
          color: var(--texto-sec, #64748b);
          font-weight: 600;
          margin-bottom: 0.35rem;
          display: block;
        }

        .chips-estudios-lista {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }

        .chip-estudio {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 9999px;
          padding: 0.3rem 0.75rem;
          font-size: 0.775rem;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s ease;
          min-height: 32px;
          display: inline-flex;
          align-items: center;
        }

        .chip-estudio:hover {
          background: #e2e8f0;
          color: #0f172a;
          border-color: #cbd5e1;
        }

        .chip-estudio-activo {
          background: var(--verde-azulado, #0f766e);
          color: #ffffff;
          border-color: var(--verde-azulado, #0f766e);
          font-weight: 600;
        }

        .modal-laboratorio-acciones {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 0.5rem;
          padding-top: 1rem;
          border-top: 1px solid #f1f5f9;
        }

        .modal-btn {
          min-height: 44px;
          padding: 0.65rem 1.4rem;
          font-size: 0.925rem;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }

        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.98);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @media (max-width: 640px) {
          .modal-laboratorio-contenedor {
            max-height: 96vh;
            border-radius: 8px;
          }
          .modal-laboratorio-acciones {
            flex-direction: column-reverse;
          }
          .modal-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

