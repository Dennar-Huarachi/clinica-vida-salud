import React, { useState, useEffect, useMemo } from 'react';
import api from '../../../compartido/utilidades/api';
import CampoTexto from '../../../compartido/componentes/CampoTexto';
import Alerta from '../../../compartido/componentes/Alerta';
import LayoutPrincipal from '../../../compartido/layouts/LayoutPrincipal';
import ModalCambiarContrasena from '../../AccesoCuentas/CU02_CambiarContrasena/ModalCambiarContrasena';

/**
 * MiPerfil (CU-06)
 * Ficha de datos de la cuenta activa para todos los roles (Paciente, Médico, Recepcionista, Administrador).
 * Permite visualizar información personal de solo lectura, actualizar datos de contacto
 * y acceder de forma rápida al cambio de contraseña a través del modal emergente.
 */
export default function MiPerfil() {
  // 1. Obtener usuario inicial desde localStorage para renderizado instantáneo
  const usuarioLocal = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('usuario_clinica') || '{}');
    } catch {
      return {};
    }
  }, []);

  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [alerta, setAlerta] = useState(null);
  const [errores, setErrores] = useState({});
  const [modalClaveAbierto, setModalClaveAbierto] = useState(false);

  // Formulario de datos de contacto editables
  const [formContacto, setFormContacto] = useState({
    correo: usuarioLocal.correo || '',
    telefono: '',
    direccion: '',
    contacto_nombre: '',
    contacto_relacion: '',
    contacto_telefono: '',
  });

  // Cargar perfil completo desde el backend
  const cargarPerfil = async () => {
    try {
      setCargando(true);
      const res = await api.get('/perfil/mi-perfil');
      const datos = res.data.datos;
      setPerfil(datos);

      setFormContacto({
        correo: datos.persona?.correo || datos.usuario?.correo || '',
        telefono: datos.persona?.telefono || '',
        direccion: datos.persona?.direccion || '',
        contacto_nombre: datos.contacto_emergencia?.nombre_completo || '',
        contacto_relacion: datos.contacto_emergencia?.relacion || '',
        contacto_telefono: datos.contacto_emergencia?.telefono || '',
      });
    } catch (err) {
      setAlerta({
        tipo: 'error',
        mensaje: err.response?.data?.mensaje || 'No se pudo cargar la información del perfil del servidor.',
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPerfil();
  }, []);

  // Guardar cambios de contacto
  const manejarGuardarContacto = async (e) => {
    e.preventDefault();
    setAlerta(null);
    setErrores({});
    setGuardando(true);

    try {
      const payload = {
        correo: formContacto.correo.trim(),
        telefono: formContacto.telefono.trim(),
        direccion: formContacto.direccion.trim(),
        contacto_nombre: formContacto.contacto_nombre.trim(),
        contacto_relacion: formContacto.contacto_relacion.trim(),
        contacto_telefono: formContacto.contacto_telefono.trim(),
      };

      await api.put('/perfil/mi-perfil', payload);

      setAlerta({
        tipo: 'exito',
        mensaje: 'Datos de contacto actualizados correctamente.',
      });

      // Actualizar localStorage si cambió el correo
      try {
        const u = JSON.parse(localStorage.getItem('usuario_clinica') || '{}');
        u.correo = payload.correo;
        localStorage.setItem('usuario_clinica', JSON.stringify(u));
      } catch (e) {
        // Ignorar error de storage
      }

      // Refrescar datos
      cargarPerfil();
    } catch (err) {
      if (err.response?.status === 422 && err.response.data?.errores) {
        setErrores(err.response.data.errores);
      } else {
        setAlerta({
          tipo: 'error',
          mensaje: err.response?.data?.mensaje || 'Error al actualizar los datos de contacto.',
        });
      }
    } finally {
      setGuardando(false);
    }
  };

  // Datos consolidados
  const usuarioActivo = perfil?.usuario || usuarioLocal;
  const personaActiva = perfil?.persona || {};
  const nombreCompleto =
    `${personaActiva.nombres || usuarioActivo.nombres || ''} ${personaActiva.apellidos || usuarioActivo.apellidos || ''}`.trim() ||
    usuarioActivo.nombre_usuario ||
    'Usuario';

  const rolActivo = (usuarioActivo.rol || usuarioActivo.rol_nombre || 'Usuario').toUpperCase();
  const ciActivo = personaActiva.ci || usuarioActivo.ci || '—';

  // Iniciales para el avatar
  const iniciales = useMemo(() => {
    const partes = nombreCompleto.split(' ').filter(Boolean);
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return nombreCompleto.slice(0, 2).toUpperCase() || 'US';
  }, [nombreCompleto]);

  // Formato amigable de fecha de último acceso
  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return 'Sesión activa actual';
    try {
      const fecha = new Date(fechaStr);
      if (isNaN(fecha.getTime())) return fechaStr;
      return fecha.toLocaleString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return fechaStr;
    }
  };

  return (
    <LayoutPrincipal titulo="Mi Perfil · Clínica Vida Salud">
      <div style={{ maxWidth: '820px', margin: '0 auto', paddingBottom: '2.5rem' }}>
        {/* Cabecera del Módulo */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 className="titulo" style={{ marginBottom: '0.25rem' }}>
            <b>Mi Perfil</b> <span>y Datos de Cuenta</span>
          </h2>
          <p style={{ color: 'var(--texto-sec)', fontSize: '0.9rem', margin: 0 }}>
            Consulta los datos registrados de tu cuenta y mantén actualizados tus canales de contacto directo.
          </p>
        </div>

        {alerta && <Alerta tipo={alerta.tipo} mensaje={alerta.mensaje} />}

        {/* Tarjeta de Perfil Principal (Diseño Médico y Limpio) */}
        <div
          className="tarjeta"
          style={{
            padding: 0,
            overflow: 'hidden',
            border: '1px solid #E2EFF2',
            boxShadow: '0 4px 16px rgba(10, 108, 132, 0.08)',
            backgroundColor: '#FFFFFF',
          }}
        >
          {/* 1. Cabecera de Perfil */}
          <div
            style={{
              padding: '1.75rem 2rem',
              background: 'linear-gradient(135deg, #0A6C84 0%, #074454 100%)',
              color: '#FFFFFF',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              {/* Avatar circular */}
              <div
                style={{
                  width: '74px',
                  height: '74px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #22C3E0 0%, #1FA5B8 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                  border: '3px solid rgba(255, 255, 255, 0.85)',
                  flexShrink: 0,
                }}
              >
                {iniciales}
              </div>

              {/* Información de usuario en cabecera */}
              <div style={{ flex: 1, minWidth: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '1.45rem',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {nombreCompleto}
                  </h3>
                  {/* Badge de Rol */}
                  <span
                    style={{
                      display: 'inline-block',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(4px)',
                      color: '#E0F7FA',
                      padding: '3px 12px',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      border: '1px solid rgba(255, 255, 255, 0.35)',
                    }}
                  >
                    {rolActivo}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.25rem',
                    flexWrap: 'wrap',
                    fontSize: '0.85rem',
                    color: '#BCE4EC',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    @{usuarioActivo.nombre_usuario || 'usuario'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    Último acceso: {formatearFecha(usuarioActivo.ultimo_acceso)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: '2rem' }}>
            {cargando && !perfil ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#5A7184' }}>
                <span className="cargando-spinner" /> Cargando ficha de usuario…
              </div>
            ) : (
              <>
                {/* 2. Sección: Información Personal (Solo lectura) */}
                <div style={{ marginBottom: '2rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '1rem',
                      paddingBottom: '0.5rem',
                      borderBottom: '2px solid #EBF4F6',
                    }}
                  >
                    <span style={{ fontSize: '1.1rem', color: 'var(--turquesa)' }}>🪪</span>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: 'var(--texto-pri)',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      Información Personal <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--texto-sec)' }}>(Solo lectura)</span>
                    </h4>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: '1rem',
                      backgroundColor: '#F9FCFD',
                      padding: '1.25rem',
                      borderRadius: '8px',
                      border: '1px solid #E4F1F4',
                    }}
                  >
                    <div>
                      <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--texto-sec)', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Cédula de Identidad (CI)
                      </span>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--texto-pri)' }}>
                        {ciActivo}
                      </strong>
                    </div>

                    <div>
                      <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--texto-sec)', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Rol Asignado
                      </span>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--verde-azulado)' }}>
                        {rolActivo}
                      </strong>
                    </div>

                    {perfil?.medico?.matricula_profesional && (
                      <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--texto-sec)', textTransform: 'uppercase', marginBottom: '4px' }}>
                          Matrícula Profesional
                        </span>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--texto-pri)' }}>
                          {perfil.medico.matricula_profesional}
                        </strong>
                      </div>
                    )}

                    {personaActiva.fecha_nacimiento && (
                      <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--texto-sec)', textTransform: 'uppercase', marginBottom: '4px' }}>
                          Fecha de Nacimiento
                        </span>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--texto-pri)' }}>
                          {personaActiva.fecha_nacimiento}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Sección: Datos de Contacto (Editables) */}
                <div style={{ marginBottom: '2rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '1rem',
                      paddingBottom: '0.5rem',
                      borderBottom: '2px solid #EBF4F6',
                    }}
                  >
                    <span style={{ fontSize: '1.1rem', color: 'var(--turquesa)' }}>📞</span>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: 'var(--texto-pri)',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      Datos de Contacto <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--texto-sec)' }}>(Actualizables)</span>
                    </h4>
                  </div>

                  <form onSubmit={manejarGuardarContacto}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0 1rem' }}>
                      <CampoTexto
                        etiqueta="Correo Electrónico"
                        nombre="correo"
                        tipo="email"
                        valor={formContacto.correo}
                        alCambiar={(e) => setFormContacto({ ...formContacto, correo: e.target.value })}
                        error={errores.correo?.[0] || errores.correo}
                        requerido
                        marcador="ejemplo@clinica.com"
                      />
                      <CampoTexto
                        etiqueta="Teléfono / Celular"
                        nombre="telefono"
                        valor={formContacto.telefono}
                        alCambiar={(e) => setFormContacto({ ...formContacto, telefono: e.target.value })}
                        error={errores.telefono?.[0] || errores.telefono}
                        marcador="Ej. 70012345"
                      />
                    </div>

                    <CampoTexto
                      etiqueta="Dirección de Domicilio"
                      nombre="direccion"
                      valor={formContacto.direccion}
                      alCambiar={(e) => setFormContacto({ ...formContacto, direccion: e.target.value })}
                      error={errores.direccion?.[0] || errores.direccion}
                      marcador="Zona, Calle / Avenida y Nro. de Domicilio"
                    />

                    {/* Contacto de Emergencia para Pacientes */}
                    {usuarioActivo.id_paciente && (
                      <div
                        style={{
                          marginTop: '1rem',
                          padding: '1rem 1.25rem',
                          backgroundColor: '#FDFBF7',
                          borderRadius: '8px',
                          border: '1px solid #F5E8D3',
                        }}
                      >
                        <h5
                          style={{
                            margin: '0 0 0.75rem 0',
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            color: '#8A5314',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                          }}
                        >
                          🚨 Contacto de Emergencia
                        </h5>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 0.75rem' }}>
                          <CampoTexto
                            etiqueta="Nombre del Familiar / Tutor"
                            nombre="contacto_nombre"
                            valor={formContacto.contacto_nombre}
                            alCambiar={(e) => setFormContacto({ ...formContacto, contacto_nombre: e.target.value })}
                            marcador="Nombre completo"
                          />
                          <CampoTexto
                            etiqueta="Parentesco / Relación"
                            nombre="contacto_relacion"
                            valor={formContacto.contacto_relacion}
                            alCambiar={(e) => setFormContacto({ ...formContacto, contacto_relacion: e.target.value })}
                            marcador="Cónyuge, Padre, Hijo…"
                          />
                          <CampoTexto
                            etiqueta="Teléfono de Contacto"
                            nombre="contacto_telefono"
                            valor={formContacto.contacto_telefono}
                            alCambiar={(e) => setFormContacto({ ...formContacto, contacto_telefono: e.target.value })}
                            marcador="Teléfono de urgencias"
                          />
                        </div>
                      </div>
                    )}

                    <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-start' }}>
                      <button
                        type="submit"
                        className="boton-primario"
                        disabled={guardando}
                        style={{
                          minHeight: '42px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0 1.5rem',
                        }}
                      >
                        {guardando ? (
                          <>
                            <span className="cargando-spinner" /> Guardando cambios…
                          </>
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                              <polyline points="17 21 17 13 7 13 7 21" />
                              <polyline points="7 3 7 8 15 8" />
                            </svg>
                            Guardar Cambios de Contacto
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* 4. Sección: Acceso Rápido a Seguridad */}
                <div
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1.25rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: '240px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '8px',
                        backgroundColor: '#EFF8FA',
                        color: 'var(--turquesa)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                    <div>
                      <h5 style={{ margin: '0 0 2px 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--texto-pri)' }}>
                        Seguridad de la Cuenta
                      </h5>
                      <span style={{ fontSize: '0.8rem', color: 'var(--texto-sec)' }}>
                        Protege tu acceso actualizando periódicamente tu contraseña mediante validación de 5 requisitos.
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setModalClaveAbierto(true)}
                    className="boton-secundario"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.55rem 1.15rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Cambiar Contraseña de Acceso
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal Emergente Compartido para Cambio de Contraseña (CU-02) */}
      <ModalCambiarContrasena
        abierto={modalClaveAbierto}
        alCerrar={() => setModalClaveAbierto(false)}
      />
    </LayoutPrincipal>
  );
}
