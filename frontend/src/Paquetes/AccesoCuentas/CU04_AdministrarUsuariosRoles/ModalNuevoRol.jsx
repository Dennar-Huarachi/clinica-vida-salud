import React, { useState } from 'react';
import api from '../../../compartido/utilidades/api';
import Alerta from '../../../compartido/componentes/Alerta';

export default function ModalNuevoRol({ abierto, alCerrar, alRolCreado }) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [cargando, setCargando] = useState(false);
  const [alerta, setAlerta] = useState(null);

  if (!abierto) return null;

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setAlerta(null);

    if (!nombre.trim()) {
      setAlerta({ tipo: 'error', mensaje: 'El nombre del rol es obligatorio.' });
      return;
    }

    setCargando(true);
    try {
      const res = await api.post('/admin/roles', {
        nombre: nombre.trim().toLowerCase(),
        descripcion: descripcion.trim() || null,
      });

      const nuevoRolId = res.data?.datos?.id_rol;
      setNombre('');
      setDescripcion('');
      if (alRolCreado) alRolCreado(nuevoRolId);
      alCerrar();
    } catch (err) {
      setAlerta({
        tipo: 'error',
        mensaje: err.response?.data?.mensaje || 'Error al crear el rol institucional.',
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="modal-rol-backdrop" onClick={() => !cargando && alCerrar()}>
      <div className="modal-rol-tarjeta" onClick={(e) => e.stopPropagation()}>
        <div className="modal-rol-cabecera">
          <div>
            <h3 className="modal-rol-titulo">Registrar Nuevo Rol Institucional</h3>
            <p className="modal-rol-subtitulo">
              Define un perfil funcional para agrupar permisos y asignarlo a colaboradores.
            </p>
          </div>
          <button
            type="button"
            className="modal-rol-cerrar"
            onClick={alCerrar}
            disabled={cargando}
          >
            ✕
          </button>
        </div>

        <Alerta tipo={alerta?.tipo} mensaje={alerta?.mensaje} />

        <form onSubmit={manejarEnvio}>
          <div className="grupo-input-rol">
            <label className="label-rol">
              Identificador del Rol <span className="req">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. auditor_clinico, supervisor_farmacia"
              className="input-rol"
              disabled={cargando}
              autoFocus
              required
            />
            <span className="pista-rol">Sin espacios ni caracteres especiales recomendados.</span>
          </div>

          <div className="grupo-input-rol">
            <label className="label-rol">Descripción del Alcance</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe las responsabilidades y alcance funcional de este rol…"
              className="textarea-rol"
              rows={3}
              disabled={cargando}
            />
          </div>

          <div className="modal-rol-acciones">
            <button
              type="button"
              className="btn-rol-cancelar"
              onClick={alCerrar}
              disabled={cargando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-rol-guardar"
              disabled={cargando}
            >
              {cargando ? 'Registrando…' : 'Guardar Rol'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .modal-rol-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(7, 68, 84, 0.45);
          backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          z-index: 2100;
        }

        .modal-rol-tarjeta {
          width: 100%;
          max-width: 480px;
          background: #FFFFFF;
          border-radius: 12px;
          border-top: 4px solid #1FA5B8;
          box-shadow: 0 16px 40px rgba(7, 68, 84, 0.2);
          padding: 24px;
          box-sizing: border-box;
          animation: animModalRol 0.2s ease-out;
        }

        @keyframes animModalRol {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }

        .modal-rol-cabecera {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .modal-rol-titulo {
          font-size: 1.2rem;
          color: #0A6C84;
          font-weight: 700;
          margin: 0 0 4px 0;
        }

        .modal-rol-subtitulo {
          font-size: 13px;
          color: #5A7184;
          margin: 0;
        }

        .modal-rol-cerrar {
          background: transparent;
          border: none;
          color: #8BB2BC;
          font-size: 18px;
          cursor: pointer;
          border-radius: 6px;
          width: 30px;
          height: 30px;
        }

        .grupo-input-rol {
          margin-bottom: 14px;
        }

        .label-rol {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #1C2D37;
          margin-bottom: 4px;
        }

        .req {
          color: #DC2626;
        }

        .input-rol, .textarea-rol {
          width: 100%;
          border: 2px solid #DCE9ED;
          border-radius: 8px;
          padding: 8px 12px;
          font-family: inherit;
          font-size: 13.5px;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.15s ease;
        }

        .input-rol:focus, .textarea-rol:focus {
          border-color: #1FA5B8;
        }

        .pista-rol {
          font-size: 11.5px;
          color: #8BB2BC;
          margin-top: 3px;
          display: block;
        }

        .modal-rol-acciones {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 18px;
          padding-top: 12px;
          border-top: 1px solid #EDF4F6;
        }

        .btn-rol-cancelar {
          background: #F1F6F8;
          color: #4A6572;
          border: 1px solid #D2E4E8;
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-rol-guardar {
          background: #FF7A00;
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          padding: 8px 18px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
