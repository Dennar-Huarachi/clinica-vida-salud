import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../compartido/utilidades/api';
import CampoTexto from '../../../compartido/componentes/CampoTexto';
import CampoSelect from '../../../compartido/componentes/CampoSelect';
import Alerta from '../../../compartido/componentes/Alerta';
import ChecklistContrasena, { esContrasenaSegura } from '../../../comun/componentes/ChecklistContrasena';

/**
 * PaginaRegistroPaciente (/registro-paciente)
 * Vista 100% pública e independiente.
 * Sin sidebar ni encabezados de sesión interna.
 * Diseño institucional con fondo #F4FAFB y tarjeta centrada max-width: 650px.
 */
export default function PaginaRegistroPaciente() {
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
    nombre_usuario: '',
    contrasena: '',
  });
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [errores, setErrores] = useState({});
  const [alerta, setAlerta] = useState(null);
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormulario((prev) => ({ ...prev, [name]: value }));
    if (errores[name]) {
      setErrores((prev) => ({ ...prev, [name]: null }));
    }
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setAlerta(null);
    setErrores({});

    if (!esContrasenaSegura(formulario.contrasena)) {
      setAlerta({
        tipo: 'error',
        mensaje: 'La contraseña no cumple con todos los requisitos mínimos de seguridad.',
      });
      return;
    }

    setCargando(true);

    try {
      const respuesta = await api.post('/acceso/registro-paciente', formulario);
      const { token, usuario } = respuesta.data.datos;

      localStorage.setItem('token_clinica', token);
      localStorage.setItem('usuario_clinica', JSON.stringify(usuario));

      setAlerta({ tipo: 'exito', mensaje: '¡Registro completado con éxito! Redirigiendo a tu portal…' });
      setTimeout(() => navigate('/paciente/mis-citas'), 1200);
    } catch (err) {
      if (err.response?.status === 422 && err.response.data?.errores) {
        setErrores(err.response.data.errores);
      } else {
        setAlerta({
          tipo: 'error',
          mensaje: err.response?.data?.mensaje || 'Error al completar el registro. Verifique los datos ingresados.',
        });
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="registro-paciente-viewport">
      <div className="registro-paciente-bloque">
        {/* Enlace Superior para volver a la selección de login */}
        <div className="registro-paciente-nav-superior">
          <Link to="/login" className="chip-retorno">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Volver a la selección de ingreso</span>
          </Link>
        </div>

        {/* Tarjeta Blanca Centrada */}
        <div className="tarjeta-registro-paciente">
          {/* Logotipo Institucional Superior */}
          <div className="cabecera-logo-registro">
            <div className="isotipo-medico-registro">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <div className="nombre-marca-registro">
              <span className="marca-clinica">Clínica</span>
              <span className="marca-vida">Vida Salud</span>
            </div>
          </div>

          <div className="titulos-registro">
            <h1 className="titulo-bicolor-registro">
              <b>Crear Cuenta</b> <span>de Paciente</span>
            </h1>
            <p className="subtitulo-registro">
              Completa tus datos personales para agendar consultas médicas, consultar disponibilidad y ver tu historial clínico en línea.
            </p>
          </div>

          <Alerta tipo={alerta?.tipo} mensaje={alerta?.mensaje} />

          <form onSubmit={manejarEnvio} noValidate>
            <div className="seccion-formulario-titulo">
              <span>1. Información de Identidad y Contacto</span>
            </div>

            <div className="grid-2-columnas">
              <CampoTexto
                etiqueta="Cédula de Identidad (CI)"
                nombre="ci"
                valor={formulario.ci}
                alCambiar={manejarCambio}
                error={errores.ci?.[0] || errores.ci}
                placeholder="Ej. 6842910"
                requerido
              />

              <CampoTexto
                etiqueta="Teléfono o Celular"
                nombre="telefono"
                valor={formulario.telefono}
                alCambiar={manejarCambio}
                error={errores.telefono?.[0] || errores.telefono}
                placeholder="Ej. 70012345"
                requerido
              />
            </div>

            <div className="grid-2-columnas">
              <CampoTexto
                etiqueta="Nombres"
                nombre="nombres"
                valor={formulario.nombres}
                alCambiar={manejarCambio}
                error={errores.nombres?.[0] || errores.nombres}
                placeholder="Ej. Juan Carlos"
                requerido
              />

              <CampoTexto
                etiqueta="Apellidos"
                nombre="apellidos"
                valor={formulario.apellidos}
                alCambiar={manejarCambio}
                error={errores.apellidos?.[0] || errores.apellidos}
                placeholder="Ej. Pérez Quispe"
                requerido
              />
            </div>

            <div className="grid-3-columnas">
              <CampoTexto
                etiqueta="Fecha de Nacimiento"
                nombre="fecha_nacimiento"
                tipo="date"
                valor={formulario.fecha_nacimiento}
                alCambiar={manejarCambio}
                error={errores.fecha_nacimiento?.[0] || errores.fecha_nacimiento}
                requerido
              />

              <CampoSelect
                etiqueta="Sexo"
                nombre="sexo"
                valor={formulario.sexo}
                alCambiar={manejarCambio}
                error={errores.sexo?.[0] || errores.sexo}
                opciones={[
                  { valor: 'M', etiqueta: 'Masculino' },
                  { valor: 'F', etiqueta: 'Femenino' },
                ]}
                requerido
              />

              <CampoSelect
                etiqueta="Grupo Sanguíneo"
                nombre="grupo_sanguineo"
                valor={formulario.grupo_sanguineo}
                alCambiar={manejarCambio}
                error={errores.grupo_sanguineo?.[0] || errores.grupo_sanguineo}
                opciones={[
                  { valor: 'O+', etiqueta: 'O+ (Positivo)' },
                  { valor: 'O-', etiqueta: 'O- (Negativo)' },
                  { valor: 'A+', etiqueta: 'A+ (Positivo)' },
                  { valor: 'A-', etiqueta: 'A- (Negativo)' },
                  { valor: 'B+', etiqueta: 'B+ (Positivo)' },
                  { valor: 'B-', etiqueta: 'B- (Negativo)' },
                  { valor: 'AB+', etiqueta: 'AB+ (Positivo)' },
                  { valor: 'AB-', etiqueta: 'AB- (Negativo)' },
                ]}
              />
            </div>

            <CampoTexto
              etiqueta="Correo Electrónico"
              nombre="correo"
              tipo="email"
              valor={formulario.correo}
              alCambiar={manejarCambio}
              error={errores.correo?.[0] || errores.correo}
              placeholder="juan.perez@ejemplo.com"
              requerido
            />

            <CampoTexto
              etiqueta="Dirección de Domicilio"
              nombre="direccion"
              valor={formulario.direccion}
              alCambiar={manejarCambio}
              error={errores.direccion?.[0] || errores.direccion}
              placeholder="Av. Las Rosas #450, Zona Este"
            />

            <div className="seccion-formulario-titulo" style={{ marginTop: '1.25rem' }}>
              <span>2. Credenciales de Acceso a la Plataforma</span>
            </div>

            <CampoTexto
              etiqueta="Nombre de Usuario"
              nombre="nombre_usuario"
              valor={formulario.nombre_usuario}
              alCambiar={manejarCambio}
              error={errores.nombre_usuario?.[0] || errores.nombre_usuario}
              placeholder="juanperez"
              requerido
            />

            {/* Campo Contraseña con Ojo y Checklist Dinámico */}
            <div className="grupo-input-registro">
              <label htmlFor="contrasena-registro" className="label-campo-registro">
                <span>Contraseña Segura</span>
                <span className="asterisco-rojo"> *</span>
              </label>

              <div className="input-contenedor-ojo">
                <input
                  id="contrasena-registro"
                  name="contrasena"
                  type={mostrarContrasena ? 'text' : 'password'}
                  value={formulario.contrasena}
                  onChange={manejarCambio}
                  placeholder="Crea una contraseña segura"
                  className={`input-registro ${errores.contrasena ? 'error' : ''}`}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarContrasena(!mostrarContrasena)}
                  className="boton-toggle-ojo"
                  title={mostrarContrasena ? 'Ocultar contraseña' : 'Ver contraseña'}
                  aria-label={mostrarContrasena ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {mostrarContrasena ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              {errores.contrasena && (
                <span className="texto-error-registro">
                  {Array.isArray(errores.contrasena) ? errores.contrasena[0] : errores.contrasena}
                </span>
              )}

              {/* Checklist en tiempo real de 5 requisitos de seguridad */}
              <ChecklistContrasena contrasena={formulario.contrasena} />
            </div>

            <button
              type="submit"
              className="boton-submit-registro"
              disabled={cargando}
            >
              {cargando ? (
                <span className="spinner-centrado">
                  <span className="spinner-circulo" />
                  Registrando cuenta de paciente…
                </span>
              ) : (
                'Completar Registro e Iniciar'
              )}
            </button>
          </form>

          <div className="pie-tarjeta-registro">
            <p>
              ¿Ya estás registrado en la clínica?{' '}
              <Link to="/login/paciente" className="enlace-login-destacado">
                Iniciar Sesión Aquí
              </Link>
            </p>
          </div>
        </div>

        {/* Enlace inferior secundario */}
        <div className="registro-paciente-nav-inferior">
          <Link to="/" className="chip-retorno">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>Ir a la Página Principal</span>
          </Link>
        </div>
      </div>

      {/* Estilos específicos de la vista pública independiente */}
      <style>{`
        .registro-paciente-viewport {
          min-height: 100vh;
          width: 100%;
          background-color: var(--fondo, #F4FAFB);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          box-sizing: border-box;
        }

        .registro-paciente-bloque {
          width: 100%;
          max-width: 650px;
          display: flex;
          flex-direction: column;
          margin: auto 0;
        }

        .registro-paciente-nav-superior {
          margin-bottom: 16px;
          display: flex;
          justify-content: flex-start;
        }

        .registro-paciente-nav-inferior {
          margin-top: 20px;
          display: flex;
          justify-content: center;
        }

        .tarjeta-registro-paciente {
          width: 100%;
          background: #FFFFFF;
          border-radius: 14px;
          box-shadow: 0 10px 30px rgba(10, 108, 132, 0.08);
          border: 1px solid #DCE9ED;
          border-top: 4px solid var(--turquesa, #1FA5B8);
          padding: 32px 36px;
          box-sizing: border-box;
        }

        .cabecera-logo-registro {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 12px;
        }

        .isotipo-medico-registro {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--turquesa, #1FA5B8), var(--verde-azulado, #0A6C84));
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 3px 10px rgba(31, 165, 184, 0.25);
        }

        .nombre-marca-registro {
          display: flex;
          gap: 0.35rem;
          font-size: 1.15rem;
          line-height: 1.2;
        }

        .marca-clinica {
          color: var(--verde-azulado, #0A6C84);
          font-weight: 700;
        }

        .marca-vida {
          color: var(--turquesa, #1FA5B8);
          font-weight: 600;
        }

        .titulos-registro {
          text-align: center;
          margin-bottom: 20px;
        }

        .titulo-bicolor-registro {
          font-size: 1.65rem;
          color: var(--verde-azulado, #0A6C84);
          margin-bottom: 6px;
          line-height: 1.2;
        }

        .titulo-bicolor-registro b {
          font-weight: 700;
        }

        .titulo-bicolor-registro span {
          font-weight: 400;
          color: var(--turquesa, #1FA5B8);
        }

        .subtitulo-registro {
          font-size: 0.9rem;
          color: var(--texto-sec, #5A7184);
          line-height: 1.45;
          margin: 0;
        }

        .seccion-formulario-titulo {
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--verde-azulado, #0A6C84);
          padding-bottom: 6px;
          border-bottom: 2px solid #EDF4F6;
          margin-bottom: 12px;
        }

        .grid-2-columnas {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0 1rem;
        }

        .grid-3-columnas {
          display: grid;
          grid-template-columns: 1.2fr 1fr 1fr;
          gap: 0 1rem;
        }

        .grupo-input-registro {
          margin-bottom: 12px;
        }

        .label-campo-registro {
          display: block;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--texto, #1C2D37);
          margin-bottom: 4px;
        }

        .asterisco-rojo {
          color: var(--cancelada, #DC2626);
        }

        .input-contenedor-ojo {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .input-registro {
          width: 100%;
          min-height: 42px;
          background: #FFFFFF;
          border: 2px solid #DCE9ED;
          border-radius: 10px;
          padding: 0 42px 0 0.85rem;
          font-family: inherit;
          font-size: 0.9rem;
          color: var(--texto, #1C2D37);
          box-sizing: border-box;
          outline: none;
          transition: border-color 0.15s ease;
        }

        .input-registro:focus {
          border-color: var(--turquesa, #1FA5B8);
        }

        .input-registro.error {
          border-color: var(--cancelada, #DC2626);
        }

        .boton-toggle-ojo {
          position: absolute;
          right: 2px;
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          cursor: pointer;
          color: var(--texto-sec, #5A7184);
          border-radius: 8px;
        }

        .boton-toggle-ojo:hover {
          color: var(--verde-azulado, #0A6C84);
        }

        .texto-error-registro {
          display: block;
          color: var(--cancelada, #DC2626);
          font-size: 12px;
          font-weight: 600;
          margin-top: 4px;
        }

        .boton-submit-registro {
          width: 100%;
          min-height: 46px;
          background: var(--naranja, #FF7A00);
          color: #FFFFFF;
          border: none;
          border-radius: 10px;
          font-family: inherit;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: background-color 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 14px;
          box-sizing: border-box;
          box-shadow: 0 4px 14px rgba(255, 122, 0, 0.25);
        }

        .boton-submit-registro:hover:not(:disabled) {
          background: var(--naranja-oscuro, #E06500);
        }

        .boton-submit-registro:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .pie-tarjeta-registro {
          margin-top: 16px;
          padding-top: 14px;
          border-top: 1px solid #EDF4F6;
          text-align: center;
          font-size: 13.5px;
          color: var(--texto-sec, #5A7184);
        }

        .pie-tarjeta-registro p {
          margin: 0;
        }

        .enlace-login-destacado {
          color: var(--verde-azulado, #0A6C84);
          font-weight: 700;
          text-decoration: none;
          margin-left: 4px;
        }

        .enlace-login-destacado:hover {
          text-decoration: underline;
        }

        .chip-retorno {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background-color: #FFFFFF;
          border: 1px solid #D2E4E8;
          border-radius: 20px;
          padding: 6px 16px;
          font-size: 13px;
          font-weight: 500;
          color: #0A6C84;
          text-decoration: none;
          box-shadow: 0 2px 6px rgba(10, 108, 132, 0.04);
          transition: border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease;
        }

        .chip-retorno:hover {
          border-color: #1FA5B8;
          background-color: #EAF4F6;
          color: #074454;
        }

        .spinner-centrado {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .spinner-circulo {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.35);
          border-top-color: #FFFFFF;
          border-radius: 50%;
          animation: spin 0.75s infinite linear;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          .tarjeta-registro-paciente {
            padding: 24px 18px;
          }

          .grid-2-columnas, .grid-3-columnas {
            grid-template-columns: 1fr;
          }

          .titulo-bicolor-registro {
            font-size: 1.4rem;
          }
        }
      `}</style>
    </div>
  );
}
