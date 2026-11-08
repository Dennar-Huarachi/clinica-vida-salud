import React, { useState, useEffect } from 'react';
import api from '../../../compartido/utilidades/api';
import CampoTexto from '../../../compartido/componentes/CampoTexto';
import CampoSelect from '../../../compartido/componentes/CampoSelect';
import Alerta from '../../../compartido/componentes/Alerta';

/**
 * ModalFichaPaciente (CU-05 Gestionar Pacientes)
 * Modal accesible de registro presencial y edición de ficha de paciente.
 * No solicita contraseñas ya que el backend genera automáticamente la cuenta web
 * asignando el CI como credencial temporal.
 */
export default function ModalFichaPaciente({
  abierto,
  alCerrar,
  pacienteEditando = null,
  alGuardarExitoso,
}) {
  const [formulario, setFormulario] = useState({
    ci: '',
    nombres: '',
    apellidos: '',
    fecha_nacimiento: '',
    sexo: 'M',
    telefono: '',
    correo: '',
    direccion: '',
    grupo_sanguineo: 'O+',
    alergias: '',
    enfermedades_cronicas: '',
    contacto_emergencia_nombre: '',
    contacto_emergencia_telefono: '',
    contacto_emergencia_parentesco: '',
  });

  const [errores, setErrores] = useState({});
  const [alerta, setAlerta] = useState(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (abierto) {
      if (pacienteEditando) {
        setFormulario({
          ci: pacienteEditando.ci || '',
          nombres: pacienteEditando.nombres || '',
          apellidos: pacienteEditando.apellidos || '',
          fecha_nacimiento: pacienteEditando.fecha_nacimiento || '',
          sexo: pacienteEditando.sexo || 'M',
          telefono: pacienteEditando.telefono || '',
          correo: pacienteEditando.correo || '',
          direccion: pacienteEditando.direccion || '',
          grupo_sanguineo: pacienteEditando.grupo_sanguineo || 'O+',
          alergias: pacienteEditando.alergias || '',
          enfermedades_cronicas: pacienteEditando.enfermedades_cronicas || '',
          contacto_emergencia_nombre:
            pacienteEditando.contacto_emergencia_nombre || pacienteEditando.contacto_nombre || '',
          contacto_emergencia_telefono:
            pacienteEditando.contacto_emergencia_telefono || pacienteEditando.contacto_telefono || '',
          contacto_emergencia_parentesco:
            pacienteEditando.contacto_emergencia_parentesco || pacienteEditando.contacto_relacion || '',
        });
      } else {
        setFormulario({
          ci: '',
          nombres: '',
          apellidos: '',
          fecha_nacimiento: '',
          sexo: 'M',
          telefono: '',
          correo: '',
          direccion: '',
          grupo_sanguineo: 'O+',
          alergias: '',
          enfermedades_cronicas: '',
          contacto_emergencia_nombre: '',
          contacto_emergencia_telefono: '',
          contacto_emergencia_parentesco: '',
        });
      }
      setErrores({});
      setAlerta(null);
    }
  }, [abierto, pacienteEditando]);

  // Manejar Escape para accesibilidad
  useEffect(() => {
    const manejarTecla = (e) => {
      if (e.key === 'Escape' && abierto && !cargando) {
        alCerrar();
      }
    };
    window.addEventListener('keydown', manejarTecla);
    return () => window.removeEventListener('keydown', manejarTecla);
  }, [abierto, cargando, alCerrar]);

  if (!abierto) return null;

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setErrores({});
    setAlerta(null);
    setCargando(true);

    try {
      if (pacienteEditando) {
        await api.put(`/pacientes/${pacienteEditando.id_paciente}`, formulario);
        if (alGuardarExitoso) {
          alGuardarExitoso('Paciente actualizado correctamente.');
        }
      } else {
        const respuesta = await api.post('/pacientes', formulario);
        const mensajeExito =
          respuesta.data?.mensaje ||
          'Paciente registrado con éxito. Informar al paciente que puede iniciar sesión en la plataforma utilizando su número de CI como contraseña.';
        if (alGuardarExitoso) {
          alGuardarExitoso(mensajeExito);
        }
      }
      alCerrar();
    } catch (err) {
      if (err.response?.status === 422 && err.response.data?.errores) {
        setErrores(err.response.data.errores);
      } else {
        setAlerta({
          tipo: 'error',
          mensaje: err.response?.data?.mensaje || 'Error al guardar la información del paciente.',
        });
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(18, 52, 59, 0.45)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
      onClick={() => !cargando && alCerrar()}
    >
      <div
        className="tarjeta"
        style={{
          maxWidth: '650px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '1.5rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 className="titulo" style={{ fontSize: '1.35rem', margin: 0 }}>
            <b>{pacienteEditando ? 'Editar' : 'Registrar'}</b> <span>Paciente</span>
          </h3>
          <button
            type="button"
            onClick={alCerrar}
            disabled={cargando}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.25rem',
              cursor: 'pointer',
              color: 'var(--texto-sec, #5A7177)',
            }}
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {/* Notificación informativa sobre la cuenta generada */}
        {!pacienteEditando && (
          <div
            style={{
              backgroundColor: '#EBF7FA',
              border: '1px solid #B8E4ED',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              fontSize: '0.875rem',
              color: '#0A5F75',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'flex-start',
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>ℹ️</span>
            <div>
              <strong>Creación automática de cuenta web:</strong> Al registrar al paciente, el sistema creará su acceso con su <strong>CI como contraseña temporal</strong> y le solicitará el cambio en su primer ingreso.
            </div>
          </div>
        )}

        <Alerta tipo={alerta?.tipo} mensaje={alerta?.mensaje} />

        <form onSubmit={manejarEnvio}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 1rem' }}>
            <CampoTexto
              etiqueta="Cédula de Identidad"
              nombre="ci"
              valor={formulario.ci}
              alCambiar={(e) => setFormulario({ ...formulario, ci: e.target.value })}
              error={errores.ci?.[0] || errores.ci}
              requerido
              deshabilitado={cargando}
            />
            <CampoTexto
              etiqueta="Teléfono"
              nombre="telefono"
              valor={formulario.telefono}
              alCambiar={(e) => setFormulario({ ...formulario, telefono: e.target.value })}
              error={errores.telefono?.[0] || errores.telefono}
              deshabilitado={cargando}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 1rem' }}>
            <CampoTexto
              etiqueta="Nombres"
              nombre="nombres"
              valor={formulario.nombres}
              alCambiar={(e) => setFormulario({ ...formulario, nombres: e.target.value })}
              error={errores.nombres?.[0] || errores.nombres}
              requerido
              deshabilitado={cargando}
            />
            <CampoTexto
              etiqueta="Apellidos"
              nombre="apellidos"
              valor={formulario.apellidos}
              alCambiar={(e) => setFormulario({ ...formulario, apellidos: e.target.value })}
              error={errores.apellidos?.[0] || errores.apellidos}
              requerido
              deshabilitado={cargando}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0 1rem' }}>
            <CampoTexto
              etiqueta="Fecha Nacimiento"
              nombre="fecha_nacimiento"
              tipo="date"
              valor={formulario.fecha_nacimiento}
              alCambiar={(e) => setFormulario({ ...formulario, fecha_nacimiento: e.target.value })}
              error={errores.fecha_nacimiento?.[0] || errores.fecha_nacimiento}
              deshabilitado={cargando}
            />
            <CampoSelect
              etiqueta="Sexo"
              nombre="sexo"
              valor={formulario.sexo}
              alCambiar={(e) => setFormulario({ ...formulario, sexo: e.target.value })}
              opciones={[
                { valor: 'M', etiqueta: 'Masculino' },
                { valor: 'F', etiqueta: 'Femenino' },
              ]}
              deshabilitado={cargando}
            />
            <CampoSelect
              etiqueta="Grupo Sang."
              nombre="grupo_sanguineo"
              valor={formulario.grupo_sanguineo}
              alCambiar={(e) => setFormulario({ ...formulario, grupo_sanguineo: e.target.value })}
              opciones={[
                { valor: 'O+', etiqueta: 'O+' },
                { valor: 'O-', etiqueta: 'O-' },
                { valor: 'A+', etiqueta: 'A+' },
                { valor: 'A-', etiqueta: 'A-' },
                { valor: 'B+', etiqueta: 'B+' },
                { valor: 'B-', etiqueta: 'B-' },
                { valor: 'AB+', etiqueta: 'AB+' },
                { valor: 'AB-', etiqueta: 'AB-' },
              ]}
              deshabilitado={cargando}
            />
          </div>

          <CampoTexto
            etiqueta="Correo Electrónico"
            nombre="correo"
            tipo="email"
            valor={formulario.correo}
            alCambiar={(e) => setFormulario({ ...formulario, correo: e.target.value })}
            error={errores.correo?.[0] || errores.correo}
            deshabilitado={cargando}
          />

          <CampoTexto
            etiqueta="Dirección"
            nombre="direccion"
            valor={formulario.direccion}
            alCambiar={(e) => setFormulario({ ...formulario, direccion: e.target.value })}
            deshabilitado={cargando}
          />

          <CampoTexto
            etiqueta="Alergias Conocidas"
            nombre="alergias"
            valor={formulario.alergias}
            alCambiar={(e) => setFormulario({ ...formulario, alergias: e.target.value })}
            marcador="Ej: Penicilina, sulfas, látex"
            filas={2}
            deshabilitado={cargando}
          />

          <CampoTexto
            etiqueta="Enfermedades Crónicas"
            nombre="enfermedades_cronicas"
            valor={formulario.enfermedades_cronicas}
            alCambiar={(e) => setFormulario({ ...formulario, enfermedades_cronicas: e.target.value })}
            marcador="Ej: Hipertensión arterial, diabetes tipo 2"
            filas={2}
            deshabilitado={cargando}
          />

          {/* Subtítulo y campos: Contacto de Emergencia */}
          <div style={{ marginTop: '1.25rem', marginBottom: '0.75rem', borderTop: '1px solid #E2ECEF', paddingTop: '1rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0A6C84', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Contacto de Emergencia
            </h4>
            <p style={{ margin: '0.2rem 0 0.75rem 0', fontSize: '0.82rem', color: 'var(--texto-sec)' }}>
              Persona designada para notificación inmediata en caso de urgencia médica.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 1rem' }}>
            <CampoTexto
              etiqueta="Nombre Completo Contacto"
              nombre="contacto_emergencia_nombre"
              valor={formulario.contacto_emergencia_nombre}
              alCambiar={(e) => setFormulario({ ...formulario, contacto_emergencia_nombre: e.target.value })}
              error={errores.contacto_emergencia_nombre?.[0] || errores.contacto_emergencia_nombre}
              marcador="Ej: María Pérez"
              deshabilitado={cargando}
            />
            <CampoTexto
              etiqueta="Parentesco / Relación"
              nombre="contacto_emergencia_parentesco"
              valor={formulario.contacto_emergencia_parentesco}
              alCambiar={(e) => setFormulario({ ...formulario, contacto_emergencia_parentesco: e.target.value })}
              error={errores.contacto_emergencia_parentesco?.[0] || errores.contacto_emergencia_parentesco}
              marcador="Ej: Madre, Cónyuge, Hermano"
              deshabilitado={cargando}
            />
          </div>

          <CampoTexto
            etiqueta="Teléfono del Contacto"
            nombre="contacto_emergencia_telefono"
            valor={formulario.contacto_emergencia_telefono}
            alCambiar={(e) => setFormulario({ ...formulario, contacto_emergencia_telefono: e.target.value })}
            error={errores.contacto_emergencia_telefono?.[0] || errores.contacto_emergencia_telefono}
            marcador="Ej: 71234567"
            deshabilitado={cargando}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button
              type="button"
              onClick={alCerrar}
              className="boton-terciario"
              disabled={cargando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="boton-primario"
              disabled={cargando}
            >
              {cargando ? 'Guardando…' : 'Guardar Paciente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

