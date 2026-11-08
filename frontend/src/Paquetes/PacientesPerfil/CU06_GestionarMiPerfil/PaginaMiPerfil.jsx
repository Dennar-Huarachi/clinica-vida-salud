import React, { useState, useEffect } from 'react';
import api from '../../../compartido/utilidades/api';
import LayoutPrincipal from '../../../compartido/layouts/LayoutPrincipal';
import Alerta from '../../../compartido/componentes/Alerta';
import ModalCambiarContrasena from '../../AccesoCuentas/CU02_CambiarContrasena/ModalCambiarContrasena';

export default function PaginaMiPerfil() {
  const [seccionActiva, setSeccionActiva] = useState('personales'); // 'personales' | 'medica' | 'emergencia'
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [alerta, setAlerta] = useState(null);
  const [errores, setErrores] = useState({});
  const [modalClaveAbierto, setModalClaveAbierto] = useState(false);

  // Formulario completo del paciente
  const [form, setForm] = useState({
    // Contacto
    correo: '',
    telefono: '',
    direccion: '',
    // Información médica declarada
    grupo_sanguineo: '',
    alergias: '',
    enfermedades_cronicas: '',
    medicamentos_actuales: '',
    antecedentes_familiares: '',
    observaciones_medicas: '',
    // Contacto de emergencia
    contacto_nombre: '',
    contacto_relacion: '',
    contacto_telefono: '',
    contacto_direccion: '',
  });

  const cargarPerfil = async () => {
    try {
      setCargando(true);
      const res = await api.get('/perfil/mi-perfil');
      const datos = res.data?.datos || {};
      setPerfil(datos);

      setForm({
        correo: datos.persona?.correo || datos.usuario?.correo || '',
        telefono: datos.persona?.telefono || '',
        direccion: datos.persona?.direccion || '',
        grupo_sanguineo: datos.paciente?.grupo_sanguineo || '',
        alergias: datos.informacion_medica?.alergias || '',
        enfermedades_cronicas: datos.informacion_medica?.enfermedades_cronicas || '',
        medicamentos_actuales: datos.informacion_medica?.medicamentos_actuales || '',
        antecedentes_familiares: datos.informacion_medica?.antecedentes_familiares || '',
        observaciones_medicas: datos.informacion_medica?.observaciones || '',
        contacto_nombre: datos.contacto_emergencia?.nombre_completo || '',
        contacto_relacion: datos.contacto_emergencia?.relacion || '',
        contacto_telefono: datos.contacto_emergencia?.telefono || '',
        contacto_direccion: datos.contacto_emergencia?.direccion || '',
      });
    } catch (err) {
      setAlerta({
        tipo: 'error',
        mensaje: err.response?.data?.mensaje || 'Error al cargar los datos de su perfil.',
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPerfil();
  }, []);

  const handleChange = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    if (errores[campo]) {
      setErrores((prev) => ({ ...prev, [campo]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlerta(null);
    setErrores({});
    setGuardando(true);

    try {
      const payload = {
        correo: form.correo.trim(),
        telefono: form.telefono.trim(),
        direccion: form.direccion.trim(),
        grupo_sanguineo: form.grupo_sanguineo || null,
        alergias: form.alergias.trim() || null,
        enfermedades_cronicas: form.enfermedades_cronicas.trim() || null,
        medicamentos_actuales: form.medicamentos_actuales.trim() || null,
        antecedentes_familiares: form.antecedentes_familiares.trim() || null,
        observaciones_medicas: form.observaciones_medicas.trim() || null,
        contacto_nombre: form.contacto_nombre.trim() || null,
        contacto_relacion: form.contacto_relacion.trim() || null,
        contacto_telefono: form.contacto_telefono.trim() || null,
        contacto_direccion: form.contacto_direccion.trim() || null,
      };

      await api.put('/perfil/mi-perfil', payload);

      setAlerta({
        tipo: 'exito',
        mensaje: 'Su perfil y antecedentes médicos han sido actualizados con éxito.',
      });

      // Actualizar localStorage si cambió el correo
      try {
        const u = JSON.parse(localStorage.getItem('usuario_clinica') || '{}');
        u.correo = payload.correo;
        localStorage.setItem('usuario_clinica', JSON.stringify(u));
      } catch (e) {}

      cargarPerfil();
    } catch (err) {
      if (err.response?.status === 422 && err.response.data?.errores) {
        setErrores(err.response.data.errores);
      } else {
        setAlerta({
          tipo: 'error',
          mensaje: err.response?.data?.mensaje || 'Error al guardar los cambios en su perfil.',
        });
      }
    } finally {
      setGuardando(false);
    }
  };

  const persona = perfil?.persona || {};
  const paciente = perfil?.paciente || {};
  const usuario = perfil?.usuario || {};
  const nombreCompleto = `${persona.nombres || ''} ${persona.apellidos || ''}`.trim() || usuario.nombre_usuario || 'Paciente';

  return (
    <LayoutPrincipal titulo="Mi Perfil y Antecedentes de Salud">
      <div className="pagina-mi-perfil-contenedor">
        {alerta && (
          <div className="mb-4">
            <Alerta
              tipo={alerta.tipo}
              mensaje={alerta.mensaje}
              onCerrar={() => setAlerta(null)}
            />
          </div>
        )}

        {/* Cabecera del Perfil con Identidad del Paciente */}
        <div className="tarjeta-cabecera-perfil">
          <div className="avatar-paciente">
            <span>{((persona.nombres?.[0] || 'P') + (persona.apellidos?.[0] || '')).toUpperCase()}</span>
          </div>

          <div className="info-paciente-cabecera">
            <div className="fila-titulo-paciente">
              <h1 className="nombre-paciente-titulo">{nombreCompleto}</h1>
              {paciente.codigo_historia && (
                <span className="badge-historia-clinica">
                  Expediente: {paciente.codigo_historia}
                </span>
              )}
            </div>

            <div className="detalles-sub-cabecera">
              <span>🪪 CI: {persona.ci || '—'}</span>
              <span>🎂 Nacimiento: {persona.fecha_nacimiento || '—'}</span>
              <span>🩸 Grupo: {paciente.grupo_sanguineo || 'No declarado'}</span>
            </div>
          </div>

          <div className="acciones-cabecera-perfil">
            <button
              type="button"
              className="btn-cambiar-clave"
              onClick={() => setModalClaveAbierto(true)}
            >
              🔒 Cambiar Contraseña
            </button>
          </div>
        </div>

        {/* Navegación por Secciones / Pestañas */}
        <div className="navegacion-secciones-perfil">
          <button
            type="button"
            className={`btn-seccion-perfil ${seccionActiva === 'personales' ? 'seccion-activa' : ''}`}
            onClick={() => setSeccionActiva('personales')}
          >
            👤 Datos Personales y Contacto
          </button>

          <button
            type="button"
            className={`btn-seccion-perfil ${seccionActiva === 'medica' ? 'seccion-activa' : ''}`}
            onClick={() => setSeccionActiva('medica')}
          >
            🩺 Información Médica Declarada
          </button>

          <button
            type="button"
            className={`btn-seccion-perfil ${seccionActiva === 'emergencia' ? 'seccion-activa' : ''}`}
            onClick={() => setSeccionActiva('emergencia')}
          >
            🚨 Contacto de Emergencia
          </button>
        </div>

        {cargando && !perfil ? (
          <div className="perfil-cargando">
            <span className="spinner-tabla" /> Cargando ficha de usuario...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="formulario-perfil">
            {/* SECCIÓN 1: DATOS PERSONALES Y CONTACTO */}
            {seccionActiva === 'personales' && (
              <div className="panel-seccion-perfil">
                <div className="bloque-aviso-inmutable">
                  <span className="icono-aviso">ℹ️</span>
                  <div className="texto-aviso">
                    <strong>Datos de Identidad Civil (Solo Lectura):</strong> Por normativa de seguridad clínica, su Cédula de Identidad, nombres y fecha de nacimiento no pueden ser alterados en línea. En caso de requerir una rectificación civil, por favor acuda a recepción con su documento de identidad original.
                  </div>
                </div>

                <div className="grilla-campos-perfil">
                  <div className="campo-grupo">
                    <label className="campo-etiqueta">Cédula de Identidad (CI)</label>
                    <input
                      type="text"
                      className="campo-control control-bloqueado"
                      value={persona.ci || ''}
                      disabled
                    />
                  </div>

                  <div className="campo-grupo">
                    <label className="campo-etiqueta">Nombres y Apellidos</label>
                    <input
                      type="text"
                      className="campo-control control-bloqueado"
                      value={nombreCompleto}
                      disabled
                    />
                  </div>

                  <div className="campo-grupo">
                    <label className="campo-etiqueta">Fecha de Nacimiento</label>
                    <input
                      type="text"
                      className="campo-control control-bloqueado"
                      value={persona.fecha_nacimiento || 'No registrada'}
                      disabled
                    />
                  </div>

                  <div className="campo-grupo">
                    <label className="campo-etiqueta">Sexo Registrado</label>
                    <input
                      type="text"
                      className="campo-control control-bloqueado"
                      value={persona.sexo === 'M' ? 'Masculino' : persona.sexo === 'F' ? 'Femenino' : persona.sexo || '—'}
                      disabled
                    />
                  </div>

                  <div className="campo-grupo">
                    <label htmlFor="perfil-correo" className="campo-etiqueta">
                      Correo Electrónico (Notificaciones de Turnos) *
                    </label>
                    <input
                      type="email"
                      id="perfil-correo"
                      className={`campo-control ${errores.correo ? 'control-invalido' : ''}`}
                      value={form.correo}
                      onChange={(e) => handleChange('correo', e.target.value)}
                      required
                    />
                    {errores.correo && <span className="error-texto">{errores.correo}</span>}
                  </div>

                  <div className="campo-grupo">
                    <label htmlFor="perfil-telefono" className="campo-etiqueta">
                      Teléfono o Celular de Contacto *
                    </label>
                    <input
                      type="tel"
                      id="perfil-telefono"
                      className={`campo-control ${errores.telefono ? 'control-invalido' : ''}`}
                      value={form.telefono}
                      onChange={(e) => handleChange('telefono', e.target.value)}
                      placeholder="Ej. 70012345"
                    />
                    {errores.telefono && <span className="error-texto">{errores.telefono}</span>}
                  </div>

                  <div className="campo-grupo campo-ancho-completo">
                    <label htmlFor="perfil-direccion" className="campo-etiqueta">
                      Dirección de Domicilio Habitual
                    </label>
                    <input
                      type="text"
                      id="perfil-direccion"
                      className="campo-control"
                      value={form.direccion}
                      onChange={(e) => handleChange('direccion', e.target.value)}
                      placeholder="Zona, Calle/Avenida, Nro. de Domicilio o Referencia"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECCIÓN 2: INFORMACIÓN MÉDICA DECLARADA */}
            {seccionActiva === 'medica' && (
              <div className="panel-seccion-perfil">
                <div className="bloque-aviso-medico">
                  <span className="icono-aviso">🩺</span>
                  <div className="texto-aviso">
                    <strong>Ficha de Salud Preventiva:</strong> Esta información es visible para sus médicos tratantes antes de cada consulta para resguardar su seguridad y prevenir contraindicaciones farmacológicas.
                  </div>
                </div>

                <div className="grilla-campos-perfil">
                  <div className="campo-grupo">
                    <label htmlFor="perfil-grupo-sanguineo" className="campo-etiqueta">
                      Grupo Sanguíneo y Factor RH
                    </label>
                    <select
                      id="perfil-grupo-sanguineo"
                      className="campo-control"
                      value={form.grupo_sanguineo}
                      onChange={(e) => handleChange('grupo_sanguineo', e.target.value)}
                    >
                      <option value="">-- No especificado --</option>
                      <option value="O+">O Positivo (O+)</option>
                      <option value="O-">O Negativo (O-)</option>
                      <option value="A+">A Positivo (A+)</option>
                      <option value="A-">A Negativo (A-)</option>
                      <option value="B+">B Positivo (B+)</option>
                      <option value="B-">B Negativo (B-)</option>
                      <option value="AB+">AB Positivo (AB+)</option>
                      <option value="AB-">AB Negativo (AB-)</option>
                    </select>
                  </div>

                  <div className="campo-grupo campo-ancho-completo">
                    <label htmlFor="perfil-alergias" className="campo-etiqueta">
                      Alergias Conocidas (Medicamentos, Alimentos, Sustancias)
                    </label>
                    <textarea
                      id="perfil-alergias"
                      rows={2}
                      className="campo-control"
                      placeholder="Ej. Alergia a la Penicilina, sulfas, AINES, mariscos, látex..."
                      value={form.alergias}
                      onChange={(e) => handleChange('alergias', e.target.value)}
                    />
                  </div>

                  <div className="campo-grupo campo-ancho-completo">
                    <label htmlFor="perfil-enfermedades" className="campo-etiqueta">
                      Enfermedades Crónicas o Condiciones Preexistentes
                    </label>
                    <textarea
                      id="perfil-enfermedades"
                      rows={2}
                      className="campo-control"
                      placeholder="Ej. Hipertensión arterial, Diabetes Mellitus tipo 2, Asma bronquial, Hipotiroidismo..."
                      value={form.enfermedades_cronicas}
                      onChange={(e) => handleChange('enfermedades_cronicas', e.target.value)}
                    />
                  </div>

                  <div className="campo-grupo campo-ancho-completo">
                    <label htmlFor="perfil-medicamentos" className="campo-etiqueta">
                      Medicamentos Actuales o Tratamientos de Uso Continuo
                    </label>
                    <textarea
                      id="perfil-medicamentos"
                      rows={2}
                      className="campo-control"
                      placeholder="Ej. Losartán 50mg (1 vez al día), Metformina 850mg con el almuerzo..."
                      value={form.medicamentos_actuales}
                      onChange={(e) => handleChange('medicamentos_actuales', e.target.value)}
                    />
                  </div>

                  <div className="campo-grupo campo-ancho-completo">
                    <label htmlFor="perfil-antecedentes" className="campo-etiqueta">
                      Antecedentes Médicos Familiares Relevantes
                    </label>
                    <textarea
                      id="perfil-antecedentes"
                      rows={2}
                      className="campo-control"
                      placeholder="Ej. Madre con cardiopatía isquémica, Padre con diabetes mellitus..."
                      value={form.antecedentes_familiares}
                      onChange={(e) => handleChange('antecedentes_familiares', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECCIÓN 3: CONTACTO DE EMERGENCIA */}
            {seccionActiva === 'emergencia' && (
              <div className="panel-seccion-perfil">
                <div className="bloque-aviso-emergencia">
                  <span className="icono-aviso">🚨</span>
                  <div className="texto-aviso">
                    <strong>Protocolo de Emergencias:</strong> Los datos de esta persona serán utilizados por el personal de enfermería o recepción en caso de imprevistos de salud durante su permanencia en el centro asistencial.
                  </div>
                </div>

                <div className="grilla-campos-perfil">
                  <div className="campo-grupo">
                    <label htmlFor="perfil-contacto-nombre" className="campo-etiqueta">
                      Nombre Completo del Familiar o Tutor
                    </label>
                    <input
                      type="text"
                      id="perfil-contacto-nombre"
                      className="campo-control"
                      placeholder="Ej. María Elena Pérez Gómez"
                      value={form.contacto_nombre}
                      onChange={(e) => handleChange('contacto_nombre', e.target.value)}
                    />
                  </div>

                  <div className="campo-grupo">
                    <label htmlFor="perfil-contacto-relacion" className="campo-etiqueta">
                      Parentesco o Relación
                    </label>
                    <input
                      type="text"
                      id="perfil-contacto-relacion"
                      className="campo-control"
                      placeholder="Ej. Cónyuge, Madre, Padre, Hermano(a), Hijo(a)"
                      value={form.contacto_relacion}
                      onChange={(e) => handleChange('contacto_relacion', e.target.value)}
                    />
                  </div>

                  <div className="campo-grupo">
                    <label htmlFor="perfil-contacto-telefono" className="campo-etiqueta">
                      Teléfono de Urgencias
                    </label>
                    <input
                      type="tel"
                      id="perfil-contacto-telefono"
                      className="campo-control"
                      placeholder="Ej. 71098765 / 4-4567890"
                      value={form.contacto_telefono}
                      onChange={(e) => handleChange('contacto_telefono', e.target.value)}
                    />
                  </div>

                  <div className="campo-grupo">
                    <label htmlFor="perfil-contacto-direccion" className="campo-etiqueta">
                      Dirección del Contacto
                    </label>
                    <input
                      type="text"
                      id="perfil-contacto-direccion"
                      className="campo-control"
                      placeholder="Dirección del familiar o tutor"
                      value={form.contacto_direccion}
                      onChange={(e) => handleChange('contacto_direccion', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Barra de Guardado Accesible (min-height 44px) */}
            <div className="barra-acciones-perfil">
              <button
                type="submit"
                className="btn-guardar-perfil"
                disabled={guardando}
              >
                {guardando ? 'Guardando modificaciones...' : '💾 Guardar Cambios del Perfil'}
              </button>
            </div>
          </form>
        )}

        {/* Modal Emergente para Cambio de Contraseña */}
        <ModalCambiarContrasena
          abierto={modalClaveAbierto}
          alCerrar={() => setModalClaveAbierto(false)}
        />
      </div>

      <style>{`
        .pagina-mi-perfil-contenedor {
          padding: 1.5rem;
          max-width: 960px;
          margin: 0 auto;
        }

        .tarjeta-cabecera-perfil {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          background: linear-gradient(135deg, #0A6C84 0%, #074F61 100%);
          border-radius: 14px;
          padding: 1.75rem 2rem;
          color: #FFFFFF;
          box-shadow: 0 8px 24px rgba(10, 108, 132, 0.15);
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .avatar-paciente {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: #1FA5B8;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.75rem;
          font-weight: 800;
          border: 3px solid rgba(255, 255, 255, 0.4);
          flex-shrink: 0;
        }

        .info-paciente-cabecera {
          flex: 1;
          min-width: 260px;
        }

        .fila-titulo-paciente {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-bottom: 0.35rem;
        }

        .nombre-paciente-titulo {
          margin: 0;
          font-size: 1.45rem;
          font-weight: 800;
          color: #FFFFFF;
        }

        .badge-historia-clinica {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.35);
          color: #FFFFFF;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 12px;
        }

        .detalles-sub-cabecera {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          font-size: 0.85rem;
          color: #D3EFF5;
          flex-wrap: wrap;
        }

        .acciones-cabecera-perfil {
          display: flex;
          align-items: center;
        }

        .btn-cambiar-clave {
          min-height: 44px;
          background: rgba(255, 255, 255, 0.15);
          color: #FFFFFF;
          border: 1px solid rgba(255, 255, 255, 0.4);
          font-size: 0.85rem;
          font-weight: 600;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-cambiar-clave:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        .navegacion-secciones-perfil {
          display: flex;
          gap: 0.5rem;
          border-bottom: 2px solid #E1ECEE;
          margin-bottom: 1.5rem;
          overflow-x: auto;
        }

        .btn-seccion-perfil {
          min-height: 44px;
          padding: 0.75rem 1.25rem;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          font-size: 0.875rem;
          font-weight: 600;
          color: #5B7078;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
          margin-bottom: -2px;
        }

        .btn-seccion-perfil:hover {
          color: #0A6C84;
        }

        .seccion-activa {
          color: #0A6C84;
          border-bottom-color: #0A6C84;
          font-weight: 700;
        }

        .panel-seccion-perfil {
          background: #FFFFFF;
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid #E1ECEE;
          box-shadow: 0 4px 16px rgba(10, 108, 132, 0.06);
          margin-bottom: 1.5rem;
        }

        .bloque-aviso-inmutable, .bloque-aviso-medico, .bloque-aviso-emergencia {
          display: flex;
          gap: 0.75rem;
          padding: 0.85rem 1.15rem;
          border-radius: 8px;
          margin-bottom: 1.25rem;
          font-size: 0.82rem;
          line-height: 1.4;
        }

        .bloque-aviso-inmutable {
          background: #EAF5F7;
          border: 1px solid #C4DCE0;
          color: #074F61;
        }

        .bloque-aviso-medico {
          background: #EBF7EE;
          border: 1px solid #C5E9CD;
          color: #1E6B38;
        }

        .bloque-aviso-emergencia {
          background: #FEF9E7;
          border: 1px solid #FAD7A0;
          color: #7D6608;
        }

        .icono-aviso {
          font-size: 1.25rem;
          line-height: 1;
        }

        .grilla-campos-perfil {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.15rem;
        }

        @media (max-width: 640px) {
          .grilla-campos-perfil {
            grid-template-columns: 1fr;
          }
        }

        .campo-ancho-completo {
          grid-column: 1 / -1;
        }

        .campo-grupo {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .campo-etiqueta {
          font-size: 0.82rem;
          font-weight: 700;
          color: #12343B;
        }

        .campo-control {
          min-height: 44px;
          padding: 0.6rem 0.85rem;
          font-size: 0.875rem;
          border: 1px solid #C4DCE0;
          border-radius: 8px;
          background: #FFFFFF;
          color: #12343B;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }

        .campo-control:focus {
          border-color: #1FA5B8;
          box-shadow: 0 0 0 3px rgba(31, 165, 184, 0.15);
        }

        .control-bloqueado {
          background: #F4FAFB;
          color: #5B7078;
          cursor: not-allowed;
          border-color: #D3E4E7;
        }

        .control-invalido {
          border-color: #D9534F;
        }

        .error-texto {
          font-size: 0.75rem;
          color: #D9534F;
          font-weight: 600;
        }

        .barra-acciones-perfil {
          display: flex;
          justify-content: flex-end;
          margin-top: 1rem;
        }

        .btn-guardar-perfil {
          min-height: 48px;
          background: #F28C1E;
          color: #FFFFFF;
          font-size: 0.95rem;
          font-weight: 700;
          padding: 0.65rem 1.75rem;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-guardar-perfil:hover:not(:disabled) {
          background: #C75F00;
        }

        .btn-guardar-perfil:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .perfil-cargando {
          padding: 3rem 1rem;
          text-align: center;
          color: #5B7078;
        }
      `}</style>
    </LayoutPrincipal>
  );
}
