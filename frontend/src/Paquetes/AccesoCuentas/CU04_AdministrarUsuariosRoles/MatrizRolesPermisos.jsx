import React, { useState, useEffect } from 'react';
import api from '../../../compartido/utilidades/api';
import Alerta from '../../../compartido/componentes/Alerta';
import ModalNuevoRol from './ModalNuevoRol';

/**
 * MatrizRolesPermisos (CU-04)
 * Matriz modular de asignación granular de permisos agrupados por módulos funcionales
 */
export default function MatrizRolesPermisos() {
  const [roles, setRoles] = useState([]);
  const [rolSeleccionadoId, setRolSeleccionadoId] = useState('');
  const [modulosPermisos, setModulosPermisos] = useState({});
  const [permisosSeleccionados, setPermisosSeleccionados] = useState(new Set());

  const [modalNuevoRolAbierto, setModalNuevoRolAbierto] = useState(false);
  const [cargandoRoles, setCargandoRoles] = useState(false);
  const [cargandoPermisos, setCargandoPermisos] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [alerta, setAlerta] = useState(null);

  // Cargar lista de roles
  const cargarRoles = async (rolIdASeleccionar = null) => {
    setCargandoRoles(true);
    try {
      const res = await api.get('/admin/roles');
      const listado = res.data?.datos || [];
      setRoles(listado);

      let targetId = rolIdASeleccionar;
      if (!targetId) {
        targetId = rolSeleccionadoId || (listado.length > 0 ? String(listado[0].id_rol) : '');
      }

      setRolSeleccionadoId(String(targetId));

      if (targetId) {
        await cargarPermisosDelRol(targetId);
      }
    } catch (err) {
      setAlerta({
        tipo: 'error',
        mensaje: err.response?.data?.mensaje || 'Error al cargar los roles disponibles.',
      });
    } finally {
      setCargandoRoles(false);
    }
  };

  useEffect(() => {
    cargarRoles();
  }, []);

  // Cargar permisos al cambiar de rol seleccionado
  const cargarPermisosDelRol = async (idRol) => {
    if (!idRol) return;
    setCargandoPermisos(true);
    setAlerta(null);
    try {
      const res = await api.get(`/admin/roles/${idRol}/permisos`);
      const datos = res.data?.datos || {};
      const modulos = datos.modulos || {};
      setModulosPermisos(modulos);

      // Poblar el set de permisos asignados con IDs numéricos consistentes
      const asignados = new Set();
      Object.values(modulos).forEach((listaPermisos) => {
        if (Array.isArray(listaPermisos)) {
          listaPermisos.forEach((p) => {
            if (p && p.asignado) {
              asignados.add(Number(p.id_permiso));
            }
          });
        }
      });
      setPermisosSeleccionados(asignados);
    } catch (err) {
      setAlerta({
        tipo: 'error',
        mensaje: err.response?.data?.mensaje || 'Error al consultar la matriz de permisos.',
      });
    } finally {
      setCargandoPermisos(false);
    }
  };

  const handleSeleccionarRol = (e) => {
    const nuevoId = e.target.value;
    setRolSeleccionadoId(nuevoId);
    if (nuevoId) {
      cargarPermisosDelRol(nuevoId);
    }
  };

  // Alternar checkbox de permiso individual
  const togglePermiso = (idPermiso) => {
    const id = Number(idPermiso);
    setPermisosSeleccionados((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) {
        nuevo.delete(id);
      } else {
        nuevo.add(id);
      }
      return nuevo;
    });
  };

  // Alternar todos los permisos de un módulo
  const toggleModuloCompleto = (nombreModulo) => {
    const permisosDelModulo = modulosPermisos[nombreModulo] || [];
    const todosAsignados = permisosDelModulo.length > 0 && permisosDelModulo.every((p) => permisosSeleccionados.has(Number(p.id_permiso)));

    setPermisosSeleccionados((prev) => {
      const nuevo = new Set(prev);
      permisosDelModulo.forEach((p) => {
        const id = Number(p.id_permiso);
        if (todosAsignados) {
          nuevo.delete(id);
        } else {
          nuevo.add(id);
        }
      });
      return nuevo;
    });
  };

  // Guardar cambios en el backend
  const guardarCambios = async () => {
    if (!rolSeleccionadoId) return;
    setGuardando(true);
    setAlerta(null);

    try {
      const arrayPermisos = Array.from(permisosSeleccionados).map(Number);
      await api.put(`/admin/roles/${rolSeleccionadoId}/permisos`, {
        permisos: arrayPermisos,
      });

      setAlerta({
        tipo: 'exito',
        mensaje: `Matriz de permisos actualizada correctamente (${arrayPermisos.length} asignados).`,
      });
      cargarRoles(rolSeleccionadoId);
    } catch (err) {
      setAlerta({
        tipo: 'error',
        mensaje: err.response?.data?.mensaje || 'Error al guardar la asignación de permisos.',
      });
    } finally {
      setGuardando(false);
    }
  };

  const rolActual = roles.find((r) => String(r.id_rol) === String(rolSeleccionadoId));

  return (
    <div className="matriz-roles-contenedor">
      {/* 1. Barra de Control Superior */}
      <div className="matriz-barra-superior">
        <div className="matriz-selector-rol-bloque">
          <label htmlFor="selector-rol-matriz" className="matriz-selector-label">
            Rol a Configurar:
          </label>
          <select
            id="selector-rol-matriz"
            value={rolSeleccionadoId}
            onChange={handleSeleccionarRol}
            className="matriz-dropdown-rol"
            disabled={cargandoRoles || guardando}
          >
            {roles.map((r) => (
              <option key={r.id_rol} value={r.id_rol}>
                {r.nombre.toUpperCase()} {r.permisos_count !== undefined ? `(${r.permisos_count} permisos)` : ''}
              </option>
            ))}
          </select>

          {/* Contador Dinámico de Permisos Asignados */}
          <div className="matriz-contador-badge">
            <span role="img" aria-label="Escudo">🛡️</span>{' '}
            <strong>{permisosSeleccionados.size}</strong> permisos asignados
          </div>
        </div>

        <div className="matriz-botones-acciones">
          <button
            type="button"
            onClick={() => setModalNuevoRolAbierto(true)}
            className="boton-institucional-secundario"
            disabled={guardando}
          >
            + Nuevo Rol
          </button>
          <button
            type="button"
            onClick={guardarCambios}
            className="boton-primario-naranja"
            disabled={guardando || cargandoPermisos}
          >
            {guardando ? 'Guardando…' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {rolActual?.descripcion && (
        <div className="matriz-rol-descripcion-caja">
          <span className="rol-desc-titulo">Alcance de este rol:</span> {rolActual.descripcion}
        </div>
      )}

      <Alerta tipo={alerta?.tipo} mensaje={alerta?.mensaje} />

      {/* 2. Cuadrícula de Tarjetas por Módulo (Grid responsivo de 2 columnas en desktop, 1 en móvil) */}
      {cargandoPermisos ? (
        <div className="matriz-cargando-estado">
          <span className="spinner-clinico" /> Cargando catálogo modular de permisos…
        </div>
      ) : Object.keys(modulosPermisos).length === 0 ? (
        <div className="matriz-vacia-estado">
          <span style={{ fontSize: '2.5rem' }}>🛡️</span>
          <h3 style={{ margin: '0.5rem 0', color: '#1e293b' }}>Catálogo de Permisos Pendiente de Carga</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1rem' }}>
            No se encontraron módulos de permisos asociados a este rol en la base de datos.
          </p>
          <button
            type="button"
            className="boton-institucional-secundario"
            onClick={() => cargarRoles(rolSeleccionadoId)}
          >
            🔄 Recargar y Sincronizar Permisos
          </button>
        </div>
      ) : (
        <div className="matriz-grid-modulos">
          {Object.entries(modulosPermisos).map(([nombreModulo, items]) => {
            const activosCount = items.filter((p) => permisosSeleccionados.has(Number(p.id_permiso))).length;
            const totalCount = items.length;
            const todosMarcados = activosCount === totalCount && totalCount > 0;

            return (
              <div key={nombreModulo} className="tarjeta-modulo-permisos">
                {/* Cabecera de la Tarjeta del Módulo */}
                <div className="tarjeta-modulo-cabecera">
                  <div className="modulo-titulo-grupo">
                    <span className="modulo-icono">📂</span>
                    <h3 className="modulo-titulo">{nombreModulo}</h3>
                  </div>

                  <div className="modulo-cabecera-derecha">
                    <span className={`modulo-fraccion-badge ${activosCount > 0 ? 'activo' : 'vacio'}`}>
                      {activosCount}/{totalCount}
                    </span>
                    <button
                      type="button"
                      className="btn-marcar-todos-modulo"
                      onClick={() => toggleModuloCompleto(nombreModulo)}
                      title={todosMarcados ? 'Desmarcar todos en este módulo' : 'Marcar todos en este módulo'}
                    >
                      {todosMarcados ? 'Desmarcar' : 'Todos'}
                    </button>
                  </div>
                </div>

                {/* Lista de Checkboxes de Permisos */}
                <div className="modulo-lista-permisos">
                  {items.map((permiso) => {
                    const checked = permisosSeleccionados.has(Number(permiso.id_permiso));
                    return (
                      <label
                        key={permiso.id_permiso}
                        className={`item-permiso-fila ${checked ? 'seleccionado' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePermiso(Number(permiso.id_permiso))}
                          className="checkbox-turquesa"
                        />
                        <div className="permiso-info-texto">
                          <span className="permiso-nombre-legible">{permiso.nombre}</span>
                          <span className="permiso-slug-tecnico">{permiso.slug}</span>
                          {permiso.descripcion && (
                            <span className="permiso-desc-sub">{permiso.descripcion}</span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para Crear Nuevo Rol */}
      <ModalNuevoRol
        abierto={modalNuevoRolAbierto}
        alCerrar={() => setModalNuevoRolAbierto(false)}
        alRolCreado={(nuevoId) => {
          cargarRoles(nuevoId);
        }}
      />

      <style>{`
        .matriz-roles-contenedor {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .matriz-barra-superior {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #FFFFFF;
          border: 1px solid #DCE9ED;
          border-radius: 12px;
          padding: 14px 20px;
          flex-wrap: wrap;
          gap: 12px;
          box-shadow: 0 4px 14px rgba(10, 108, 132, 0.04);
        }

        .matriz-selector-rol-bloque {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .matriz-selector-label {
          font-size: 13.5px;
          font-weight: 700;
          color: #0A6C84;
        }

        .matriz-dropdown-rol {
          min-height: 40px;
          border: 2px solid #D2E4E8;
          border-radius: 8px;
          padding: 0 12px;
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          color: #1C2D37;
          background-color: #F8FAFB;
          cursor: pointer;
          outline: none;
          transition: border-color 0.15s ease;
        }

        .matriz-dropdown-rol:focus {
          border-color: #1FA5B8;
        }

        .matriz-contador-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background-color: #EAF7F9;
          color: #0A6C84;
          border: 1px solid #CCEAF0;
          border-radius: 20px;
          padding: 6px 14px;
          font-size: 13px;
        }

        .matriz-botones-acciones {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .boton-institucional-secundario {
          background-color: #F1F6F8;
          color: #0A6C84;
          border: 1.5px solid #CFE2E8;
          border-radius: 8px;
          min-height: 40px;
          padding: 0 16px;
          font-family: inherit;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          transition: background-color 0.15s ease, border-color 0.15s ease;
        }

        .boton-institucional-secundario:hover:not(:disabled) {
          background-color: #E2ECF0;
          border-color: #1FA5B8;
        }

        .boton-primario-naranja {
          background-color: #FF7A00;
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          min-height: 40px;
          padding: 0 20px;
          font-family: inherit;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(255, 122, 0, 0.25);
          transition: background-color 0.15s ease;
        }

        .boton-primario-naranja:hover:not(:disabled) {
          background-color: #E06500;
        }

        .matriz-rol-descripcion-caja {
          background-color: #F4FAFB;
          border: 1px solid #D2E4E8;
          border-radius: 8px;
          padding: 10px 16px;
          font-size: 13px;
          color: #4A6572;
        }

        .rol-desc-titulo {
          font-weight: 700;
          color: #0A6C84;
          margin-right: 4px;
        }

        .matriz-cargando-estado {
          text-align: center;
          padding: 40px;
          color: #5A7184;
          font-size: 14px;
        }

        .matriz-vacia-estado {
          text-align: center;
          padding: 48px 24px;
          background: #FFFFFF;
          border: 1px dashed #CBD5E1;
          border-radius: 12px;
          color: #5A7184;
        }

        .spinner-clinico {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid #1FA5B8;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.75s infinite linear;
          margin-right: 8px;
          vertical-align: middle;
        }

        /* Grid Responsivo de 2 Columnas */
        .matriz-grid-modulos {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        @media (max-width: 900px) {
          .matriz-grid-modulos {
            grid-template-columns: 1fr;
          }
          .matriz-barra-superior {
            flex-direction: column;
            align-items: stretch;
          }
          .matriz-selector-rol-bloque {
            flex-direction: column;
            align-items: stretch;
          }
          .matriz-botones-acciones {
            justify-content: flex-end;
          }
        }

        /* Tarjeta de Módulo */
        .tarjeta-modulo-permisos {
          background: #FFFFFF;
          border: 1px solid #DCE9ED;
          border-radius: 12px;
          box-shadow: 0 4px 14px rgba(10, 108, 132, 0.04);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .tarjeta-modulo-cabecera {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: #F8FAFB;
          border-bottom: 2px solid #E5EEF1;
          padding: 12px 16px;
        }

        .modulo-titulo-grupo {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .modulo-icono {
          font-size: 16px;
        }

        .modulo-titulo {
          font-size: 14px;
          font-weight: 700;
          color: #0A6C84;
          margin: 0;
        }

        .modulo-cabecera-derecha {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .modulo-fraccion-badge {
          font-size: 12px;
          font-weight: 700;
          border-radius: 12px;
          padding: 3px 9px;
        }

        .modulo-fraccion-badge.activo {
          background-color: #E2F5F8;
          color: #0A6C84;
          border: 1px solid #BDE5ED;
        }

        .modulo-fraccion-badge.vacio {
          background-color: #F1F5F7;
          color: #8BB2BC;
          border: 1px solid #E2E8EC;
        }

        .btn-marcar-todos-modulo {
          background: transparent;
          border: 1px solid #D2E4E8;
          border-radius: 6px;
          color: #0A6C84;
          font-size: 11px;
          font-weight: 600;
          padding: 3px 8px;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }

        .btn-marcar-todos-modulo:hover {
          background-color: #EAF4F6;
        }

        .modulo-lista-permisos {
          padding: 10px 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
        }

        .item-permiso-fila {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.12s ease;
          border: 1px solid transparent;
        }

        .item-permiso-fila:hover {
          background-color: #F5FBFC;
          border-color: #E2F0F3;
        }

        .item-permiso-fila.seleccionado {
          background-color: #F0F9FB;
          border-color: #D3EDF2;
        }

        .checkbox-turquesa {
          appearance: none;
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border: 2px solid #8BB2BC;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 2px;
          position: relative;
          background-color: #FFFFFF;
          flex-shrink: 0;
          transition: background-color 0.15s ease, border-color 0.15s ease;
        }

        .checkbox-turquesa:checked {
          background-color: #1FA5B8;
          border-color: #1FA5B8;
        }

        .checkbox-turquesa:checked::after {
          content: '';
          position: absolute;
          left: 5px;
          top: 1px;
          width: 4px;
          height: 9px;
          border: solid #FFFFFF;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }

        .permiso-info-texto {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .permiso-nombre-legible {
          font-size: 13px;
          font-weight: 600;
          color: #1C2D37;
          line-height: 1.3;
        }

        .permiso-slug-tecnico {
          font-size: 11px;
          font-family: monospace;
          color: #0A6C84;
          background-color: #EBF5F7;
          display: inline-block;
          width: fit-content;
          padding: 1px 6px;
          border-radius: 4px;
          margin-top: 2px;
        }

        .permiso-desc-sub {
          font-size: 11.5px;
          color: #5A7184;
          line-height: 1.25;
          margin-top: 2px;
        }
      `}</style>
    </div>
  );
}
