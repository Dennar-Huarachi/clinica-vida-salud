import React, { useState, useEffect } from 'react';
import api from '../../../compartido/utilidades/api';
import CampoTexto from '../../../compartido/componentes/CampoTexto';
import CampoSelect from '../../../compartido/componentes/CampoSelect';
import InsigniaEstado from '../../../compartido/componentes/InsigniaEstado';
import Alerta from '../../../compartido/componentes/Alerta';
import LayoutPrincipal from '../../../compartido/layouts/LayoutPrincipal';
import TablaExpandible from '../../../comun/componentes/TablaExpandible';
import MatrizRolesPermisos from './MatrizRolesPermisos';

/**
 * PaginaUsuariosRoles (CU-04)
 * Incluye dos pestañas principales:
 * 1. Gestión de Usuarios (con acordeón / collapsible rows de la Tarea 4)
 * 2. Roles y Permisos (matriz modular de la Tarea 3)
 */
export default function PaginaUsuariosRoles() {
  const [pestanaActiva, setPestanaActiva] = useState('usuarios'); // 'usuarios' | 'roles'
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [termino, setTermino] = useState('');
  const [cargando, setCargando] = useState(false);
  const [alerta, setAlerta] = useState(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [formulario, setFormulario] = useState({
    ci: '',
    nombres: '',
    apellidos: '',
    correo: '',
    telefono: '',
    id_rol: '',
    nombre_usuario: '',
    contrasena: '',
  });
  const [errores, setErrores] = useState({});

  const cargarDatos = () => {
    setCargando(true);
    Promise.all([
      api.get(`/administracion/usuarios?termino=${encodeURIComponent(termino)}`),
      api.get('/admin/roles'),
    ])
      .then(([resUsr, resRol]) => {
        setUsuarios(resUsr.data.datos || []);
        setRoles(resRol.data.datos || []);
      })
      .catch((err) =>
        setAlerta({
          tipo: 'error',
          mensaje: err.response?.data?.mensaje || 'Error al cargar usuarios y roles.',
        })
      )
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    if (pestanaActiva === 'usuarios') {
      cargarDatos();
    }
  }, [termino, pestanaActiva]);

  const abrirModalCrear = () => {
    setUsuarioEditando(null);
    setFormulario({
      ci: '',
      nombres: '',
      apellidos: '',
      correo: '',
      telefono: '',
      id_rol: roles[0]?.id_rol || '',
      nombre_usuario: '',
      contrasena: '',
    });
    setErrores({});
    setModalAbierto(true);
  };

  const abrirModalEditar = (u) => {
    setUsuarioEditando(u);
    setFormulario({
      ci: u.ci || '',
      nombres: u.nombres || '',
      apellidos: u.apellidos || '',
      correo: u.correo || '',
      telefono: u.telefono || '',
      id_rol: u.id_rol || '',
      nombre_usuario: u.nombre_usuario || '',
      contrasena: '',
    });
    setErrores({});
    setModalAbierto(true);
  };

  const guardarUsuario = async (e) => {
    e.preventDefault();
    setErrores({});

    try {
      const payload = {
        ...formulario,
        id_rol: Number(formulario.id_rol),
      };
      if (usuarioEditando && !payload.contrasena) {
        delete payload.contrasena;
      }

      if (usuarioEditando) {
        await api.put(`/administracion/usuarios/${usuarioEditando.id_usuario}`, payload);
        setAlerta({ tipo: 'exito', mensaje: 'Usuario actualizado satisfactoriamente.' });
      } else {
        await api.post('/administracion/usuarios', payload);
        setAlerta({ tipo: 'exito', mensaje: 'Usuario creado satisfactoriamente.' });
      }
      setModalAbierto(false);
      cargarDatos();
    } catch (err) {
      if (err.response?.status === 422 && err.response.data?.errores) {
        setErrores(err.response.data.errores);
      } else {
        setAlerta({
          tipo: 'error',
          mensaje: err.response?.data?.mensaje || 'Error al guardar usuario.',
        });
      }
    }
  };

  const alternarEstado = async (idUsuario) => {
    try {
      const res = await api.patch(`/administracion/usuarios/${idUsuario}/alternar-estado`);
      setAlerta({ tipo: 'exito', mensaje: res.data.mensaje || 'Estado de usuario actualizado.' });
      cargarDatos();
    } catch (err) {
      setAlerta({ tipo: 'error', mensaje: err.response?.data?.mensaje || 'Error al cambiar estado.' });
    }
  };

  return (
    <LayoutPrincipal titulo="Administración · Usuarios, Roles y Permisos">
      <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
        {/* Cabecera Principal */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 className="titulo">
            <b>Seguridad</b> <span>· Usuarios, Roles y Permisos</span>
          </h2>
          <p style={{ color: 'var(--texto-sec)', fontSize: '0.9rem', margin: '2px 0 0 0' }}>
            Control centralizado de cuentas de acceso, perfiles funcionales y privilegios del sistema.
          </p>
        </div>

        {/* Barra de Navegación por Pestañas */}
        <div className="pestanas-usuarios-roles-nav">
          <button
            type="button"
            className={`btn-pestana ${pestanaActiva === 'usuarios' ? 'activa' : ''}`}
            onClick={() => setPestanaActiva('usuarios')}
          >
            <span>👥</span> Gestión de Usuarios
          </button>
          <button
            type="button"
            className={`btn-pestana ${pestanaActiva === 'roles' ? 'activa' : ''}`}
            onClick={() => setPestanaActiva('roles')}
          >
            <span>🛡️</span> Roles y Permisos (Matriz Modular)
          </button>
        </div>

        <Alerta tipo={alerta?.tipo} mensaje={alerta?.mensaje} />

        {/* PESTAÑA 1: GESTIÓN DE USUARIOS CON ACORDEÓN / TABLA EXPANDIBLE */}
        {pestanaActiva === 'usuarios' && (
          <div className="seccion-pestana-contenido">
            {/* Barra de Búsqueda y Botón Nuevo */}
            <div className="barra-busqueda-usuarios">
              <div style={{ flex: 1, minWidth: '260px' }}>
                <CampoTexto
                  etiqueta="Buscar colaborador o usuario"
                  nombre="termino"
                  valor={termino}
                  alCambiar={(e) => setTermino(e.target.value)}
                  placeholder="Por usuario, nombre, apellido o CI…"
                />
              </div>
              <button
                type="button"
                onClick={abrirModalCrear}
                className="boton-primario"
                style={{ minHeight: '44px', marginBottom: '1.25rem' }}
              >
                + Nuevo Usuario
              </button>
            </div>

            {/* Tabla Expandible con Acordeón (Tarea 4) */}
            <TablaExpandible
              columnas={['Usuario / Correo', 'Rol Asignado', 'Estado', '']}
              datos={usuarios}
              cargando={cargando}
              obtenerClaveFila={(u) => u.id_usuario}
              mensajeVacio="No se encontraron usuarios que coincidan con la búsqueda."
              renderFilaPrincipal={(u, isExpanded, toggleExpand) => (
                <>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--verde-azulado)' }}>
                      {u.nombre_usuario}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--texto-sec)' }}>{u.correo}</div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                      {u.rol}
                    </span>
                  </td>
                  <td>
                    <InsigniaEstado estado={u.estado} />
                  </td>
                  <td style={{ width: '44px', textAlign: 'center' }}>
                    <button
                      type="button"
                      className={`boton-chevron-expandir ${isExpanded ? 'rotado' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand();
                      }}
                      title={isExpanded ? 'Colapsar detalles' : 'Expandir información'}
                      aria-label="Expandir detalles"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                  </td>
                </>
              )}
              renderFilaMovil={(u, isExpanded, toggleExpand) => (
                <div className="fila-resumen-movil">
                  {/* Línea 1 (Arriba): Usuario (badge turquesa) y a la derecha el Estado */}
                  <div className="fila-resumen-movil-linea1">
                    <span className="badge-codigo-turquesa">
                      @{u.nombre_usuario}
                    </span>
                    <InsigniaEstado estado={u.estado} />
                  </div>

                  {/* Línea 2 (Abajo): Nombre completo en negrita y Rol, Chevron a la derecha */}
                  <div className="fila-resumen-movil-linea2">
                    <div className="fila-resumen-movil-nombre">
                      <strong className="nombre-paciente-destacado">{u.apellidos}, {u.nombres}</strong>
                      <span className="ci-paciente-sub" style={{ textTransform: 'capitalize' }}>
                        Rol: {u.rol} {u.correo ? `· ${u.correo}` : ''}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={`boton-chevron-expandir ${isExpanded ? 'rotado' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand();
                      }}
                      title={isExpanded ? 'Colapsar detalles' : 'Expandir información'}
                      aria-label={isExpanded ? 'Colapsar detalles' : 'Expandir información'}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              renderDetalle={(u) => (
                <>
                  <div className="panel-detalle-grid">
                    <div className="detalle-dato-item">
                      <span className="detalle-etiqueta">Persona Asignada</span>
                      <span className="detalle-valor">{u.apellidos}, {u.nombres}</span>
                    </div>
                    <div className="detalle-dato-item">
                      <span className="detalle-etiqueta">Cédula de Identidad</span>
                      <span className="detalle-valor">{u.ci || 'Sin registrar'}</span>
                    </div>
                    <div className="detalle-dato-item">
                      <span className="detalle-etiqueta">Correo Electrónico</span>
                      <span className="detalle-valor">{u.correo || 'Sin registrar'}</span>
                    </div>
                    <div className="detalle-dato-item">
                      <span className="detalle-etiqueta">Teléfono de Contacto</span>
                      <span className="detalle-valor">{u.telefono || 'Sin registrar'}</span>
                    </div>
                    <div className="detalle-dato-item">
                      <span className="detalle-etiqueta">Último Acceso al Sistema</span>
                      <span className="detalle-valor">{u.ultimo_acceso || 'Nunca ha ingresado'}</span>
                    </div>
                    <div className="detalle-dato-item">
                      <span className="detalle-etiqueta">Estado de Contraseña</span>
                      <span className="detalle-valor">
                        {u.debe_cambiar_contrasena ? (
                          <span style={{ color: '#D97706', fontWeight: 600 }}>⚠️ Debe cambiar clave al ingresar</span>
                        ) : (
                          <span style={{ color: '#16A34A', fontWeight: 600 }}>✓ Clave actualizada</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="panel-detalle-acciones">
                    <button
                      type="button"
                      onClick={() => abrirModalEditar(u)}
                      className="boton-terciario"
                      style={{ minHeight: '44px' }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Editar Usuario
                    </button>
                    <button
                      type="button"
                      onClick={() => alternarEstado(u.id_usuario)}
                      className={u.estado === 'activo' ? 'boton-peligro' : 'boton-primario'}
                      style={{ minHeight: '44px' }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                      </svg>
                      {u.estado === 'activo' ? 'Desactivar Cuenta' : 'Activar Cuenta'}
                    </button>
                  </div>
                </>
              )}
            />
          </div>
        )}

        {/* PESTAÑA 2: MATRIZ MODULAR DE ROLES Y PERMISOS */}
        {pestanaActiva === 'roles' && (
          <div className="seccion-pestana-contenido">
            <MatrizRolesPermisos />
          </div>
        )}

        {/* Modal Formulario Usuario */}
        {modalAbierto && (
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
            <div className="tarjeta" style={{ maxWidth: '580px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
              <h3 className="titulo" style={{ fontSize: '1.35rem', marginBottom: '1rem' }}>
                <b>{usuarioEditando ? 'Editar' : 'Crear'}</b> <span>Usuario</span>
              </h3>

              <form onSubmit={guardarUsuario}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 1rem' }}>
                  <CampoTexto
                    etiqueta="Cédula de Identidad"
                    nombre="ci"
                    valor={formulario.ci}
                    alCambiar={(e) => setFormulario({ ...formulario, ci: e.target.value })}
                    error={errores.ci?.[0] || errores.ci}
                    requerido
                  />
                  <CampoTexto
                    etiqueta="Teléfono"
                    nombre="telefono"
                    valor={formulario.telefono}
                    alCambiar={(e) => setFormulario({ ...formulario, telefono: e.target.value })}
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
                  />
                  <CampoTexto
                    etiqueta="Apellidos"
                    nombre="apellidos"
                    valor={formulario.apellidos}
                    alCambiar={(e) => setFormulario({ ...formulario, apellidos: e.target.value })}
                    error={errores.apellidos?.[0] || errores.apellidos}
                    requerido
                  />
                </div>

                <CampoTexto
                  etiqueta="Correo Electrónico"
                  nombre="correo"
                  tipo="email"
                  valor={formulario.correo}
                  alCambiar={(e) => setFormulario({ ...formulario, correo: e.target.value })}
                  error={errores.correo?.[0] || errores.correo}
                  requerido
                />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 1rem' }}>
                  <CampoSelect
                    etiqueta="Rol Asignado"
                    nombre="id_rol"
                    valor={formulario.id_rol}
                    alCambiar={(e) => setFormulario({ ...formulario, id_rol: e.target.value })}
                    error={errores.id_rol?.[0] || errores.id_rol}
                    opciones={roles.map((r) => ({ valor: r.id_rol, etiqueta: r.nombre.toUpperCase() }))}
                    requerido
                  />

                  <CampoTexto
                    etiqueta="Nombre de Usuario"
                    nombre="nombre_usuario"
                    valor={formulario.nombre_usuario}
                    alCambiar={(e) => setFormulario({ ...formulario, nombre_usuario: e.target.value })}
                    error={errores.nombre_usuario?.[0] || errores.nombre_usuario}
                    requerido
                  />
                </div>

                <CampoTexto
                  etiqueta={usuarioEditando ? 'Nueva Contraseña (dejar en blanco para no cambiar)' : 'Contraseña Inicial'}
                  nombre="contrasena"
                  tipo="password"
                  valor={formulario.contrasena}
                  alCambiar={(e) => setFormulario({ ...formulario, contrasena: e.target.value })}
                  error={errores.contrasena?.[0] || errores.contrasena}
                  requerido={!usuarioEditando}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                  <button type="button" onClick={() => setModalAbierto(false)} className="boton-terciario">
                    Cancelar
                  </button>
                  <button type="submit" className="boton-primario">
                    Guardar Usuario
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .pestanas-usuarios-roles-nav {
          display: flex;
          gap: 8px;
          border-bottom: 2px solid #DCE9ED;
          margin-bottom: 20px;
        }

        .btn-pestana {
          background: transparent;
          border: none;
          border-bottom: 3px solid transparent;
          padding: 10px 18px;
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          color: #5A7184;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: color 0.15s ease, border-color 0.15s ease;
          margin-bottom: -2px;
        }

        .btn-pestana:hover {
          color: #0A6C84;
        }

        .btn-pestana.activa {
          color: #0A6C84;
          border-bottom-color: #1FA5B8;
          font-weight: 700;
        }

        .barra-busqueda-usuarios {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 12px;
        }

        .seccion-pestana-contenido {
          animation: animPestana 0.2s ease-out;
        }

        @keyframes animPestana {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </LayoutPrincipal>
  );
}
