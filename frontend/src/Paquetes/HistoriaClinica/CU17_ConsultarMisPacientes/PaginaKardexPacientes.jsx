import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../compartido/utilidades/api';
import LayoutPrincipal from '../../../compartido/layouts/LayoutPrincipal';
import TablaExpandible from '../../../comun/componentes/TablaExpandible';
import Alerta from '../../../compartido/componentes/Alerta';

export default function PaginaKardexPacientes() {
  const navigate = useNavigate();

  const [pacientes, setPacientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [alerta, setAlerta] = useState(null);

  const cargarPacientes = async (filtro = '') => {
    try {
      setCargando(true);
      const url = filtro.trim()
        ? `/historia-clinica/mis-pacientes?termino=${encodeURIComponent(filtro.trim())}`
        : '/historia-clinica/mis-pacientes';

      const res = await api.get(url);
      setPacientes(res.data?.datos || []);
    } catch (err) {
      setAlerta({
        tipo: 'error',
        mensaje: err.response?.data?.mensaje || 'Error al cargar el padrón de pacientes asignados.',
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPacientes();
  }, []);

  // Búsqueda con debounce para fluidez en tiempo real
  useEffect(() => {
    const timer = setTimeout(() => {
      cargarPacientes(terminoBusqueda);
    }, 300);

    return () => clearTimeout(timer);
  }, [terminoBusqueda]);

  const irAExpediente = (idPaciente) => {
    const id = idPaciente || 0;
    if (!id || id === '0' || id === 'undefined' || id === 'null') {
      setAlerta({
        tipo: 'advertencia',
        mensaje: 'No se pudo identificar el expediente del paciente seleccionado.',
      });
      return;
    }
    navigate(`/medico/atenciones/${id}`);
  };

  const columnas = [
    'Expediente',
    'Paciente',
    'Contacto Directo',
    'Consultas Médicas',
    'Última Atención',
    'Acción',
    '',
  ];

  return (
    <LayoutPrincipal titulo="Kardex Digital de Pacientes">
      <div className="pagina-kardex-contenedor">
        {alerta && (
          <div className="mb-4">
            <Alerta
              tipo={alerta.tipo}
              mensaje={alerta.mensaje}
              onCerrar={() => setAlerta(null)}
            />
          </div>
        )}

        {/* Cabecera del Kardex */}
        <div className="seccion-cabecera-kardex">
          <div className="cabecera-info">
            <h1 className="cabecera-titulo">Padrón de Pacientes Asignados</h1>
            <p className="cabecera-subtitulo">
              Expedientes clínicos y registro histórico de consultas de los pacientes que cuentan con citas en su agenda médica.
            </p>
          </div>

          <div className="kpi-contador-pacientes">
            <span className="kpi-numero">{pacientes.length}</span>
            <span className="kpi-etiqueta">Pacientes en Seguimiento</span>
          </div>
        </div>

        {/* Barra de Filtro y Búsqueda en Tiempo Real */}
        <div className="barra-busqueda-kardex">
          <div className="contenedor-input-busqueda">
            <span className="icono-lupa">🔍</span>
            <input
              type="text"
              className="input-busqueda-predictiva"
              placeholder="Buscar por Nombre, Apellidos, Cédula de Identidad (CI) o Nro. de Expediente..."
              value={terminoBusqueda}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
            />
            {terminoBusqueda && (
              <button
                type="button"
                className="btn-limpiar-busqueda"
                onClick={() => setTerminoBusqueda('')}
                aria-label="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Tabla Expandible Mobile-First */}
        <div className="panel-tabla-kardex">
          <TablaExpandible
            columnas={columnas}
            datos={pacientes}
            cargando={cargando}
            mensajeVacio={
              terminoBusqueda
                ? `No se encontraron pacientes que coincidan con "${terminoBusqueda}".`
                : 'Aún no tiene pacientes asignados en su agenda médica.'
            }
            obtenerClaveFila={(item) => item.id_paciente}
            renderFilaPrincipal={(item, isExpanded, toggleExpand) => (
              <>
                <td>
                  <strong className="badge-expediente">
                    {item.codigo_historia || `EXP-${item.id_paciente}`}
                  </strong>
                </td>
                <td>
                  <div className="celda-paciente">
                    <strong className="nombre-paciente">{item.nombre_completo}</strong>
                    <span className="sub-ci">CI: {item.ci}</span>
                  </div>
                </td>
                <td>
                  <div className="celda-contacto">
                    <span>📞 {item.telefono || 'Sin teléfono'}</span>
                    <small>{item.correo || 'Sin correo'}</small>
                  </div>
                </td>
                <td>
                  <div className="celda-consultas">
                    <span className="badge-consultas-total">
                      {item.total_consultas} {item.total_consultas === '1' ? 'cita' : 'citas'}
                    </span>
                    {item.consultas_atendidas > 0 && (
                      <span className="sub-atendidas">
                        {item.consultas_atendidas} atendida(s)
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="celda-atencion">
                    <strong>{item.ultima_fecha_atencion || item.fecha_ultima_cita || 'Pendiente'}</strong>
                  </div>
                </td>
                <td>
                  <button
                    type="button"
                    className="btn-ver-expediente"
                    onClick={(e) => {
                      e.stopPropagation();
                      irAExpediente(item.id_paciente);
                    }}
                  >
                    Ver Expediente
                  </button>
                </td>
                <td className="col-flecha">
                  <span className={`flecha-desplegar ${isExpanded ? 'rotada' : ''}`}>▼</span>
                </td>
              </>
            )}
            renderFilaMovil={(item, isExpanded, toggleExpand) => (
              <div className="tarjeta-movil-kardex">
                <div className="tarjeta-movil-top">
                  <strong className="badge-expediente">
                    {item.codigo_historia || `EXP-${item.id_paciente}`}
                  </strong>
                  <span className="badge-consultas-total">
                    {item.total_consultas} citas
                  </span>
                  <span className={`flecha-desplegar ${isExpanded ? 'rotada' : ''}`}>▼</span>
                </div>
                <div className="tarjeta-movil-mid">
                  <strong className="movil-nombre">{item.nombre_completo}</strong>
                  <span className="movil-ci">CI: {item.ci} · {item.telefono || 'Sin teléfono'}</span>
                </div>
                <div className="tarjeta-movil-bot">
                  <span>Última atención: {item.ultima_fecha_atencion || item.fecha_ultima_cita || 'Pendiente'}</span>
                </div>
              </div>
            )}
            renderDetalle={(item) => (
              <div className="subpanel-detalle-kardex">
                <div className="grid-datos-clinicos">
                  <div>
                    <span className="etiqueta-detalle">Edad / Nacimiento:</span>
                    <strong className="valor-detalle">
                      {item.edad ? `${item.edad} años` : '—'} ({item.fecha_nacimiento || 'No registrada'})
                    </strong>
                  </div>
                  <div>
                    <span className="etiqueta-detalle">Sexo / Grupo Sanguíneo:</span>
                    <strong className="valor-detalle">
                      {item.sexo === 'M' ? 'Masculino' : item.sexo === 'F' ? 'Femenino' : '—'} · {item.grupo_sanguineo || 'No declarado'}
                    </strong>
                  </div>
                  <div>
                    <span className="etiqueta-detalle">Dirección Registrada:</span>
                    <span className="valor-detalle">{item.direccion || 'No especificada'}</span>
                  </div>
                  <div className="columna-completa">
                    <span className="etiqueta-detalle">Alergias Conocidas:</span>
                    <p className={`parrafo-clinico ${item.alergias ? 'alerta-alergia' : ''}`}>
                      {item.alergias ? `⚠️ ${item.alergias}` : 'Sin alergias conocidas declaradas.'}
                    </p>
                  </div>
                  <div className="columna-completa">
                    <span className="etiqueta-detalle">Enfermedades Crónicas:</span>
                    <p className="parrafo-clinico">
                      {item.enfermedades_cronicas || 'Ninguna condición crónica declarada.'}
                    </p>
                  </div>
                  {item.medicamentos_actuales && (
                    <div className="columna-completa">
                      <span className="etiqueta-detalle">Medicamentos de Uso Continuo:</span>
                      <p className="parrafo-clinico">{item.medicamentos_actuales}</p>
                    </div>
                  )}
                </div>

                <div className="acciones-detalle-kardex">
                  <button
                    type="button"
                    className="btn-abrir-historia"
                    onClick={() => irAExpediente(item.id_paciente)}
                  >
                    📂 Abrir Expediente Clínico Completo
                  </button>
                </div>
              </div>
            )}
          />
        </div>
      </div>

      <style>{`
        .pagina-kardex-contenedor {
          padding: 1.5rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .seccion-cabecera-kardex {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .cabecera-titulo {
          margin: 0;
          font-size: 1.45rem;
          font-weight: 800;
          color: #12343B;
          letter-spacing: -0.01em;
        }

        .cabecera-subtitulo {
          margin: 0.35rem 0 0 0;
          font-size: 0.85rem;
          color: #5B7078;
          line-height: 1.35;
        }

        .kpi-contador-pacientes {
          background: #FFFFFF;
          border: 1px solid #C4DCE0;
          border-radius: 12px;
          padding: 0.75rem 1.25rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: 0 4px 12px rgba(10, 108, 132, 0.06);
        }

        .kpi-numero {
          font-size: 1.6rem;
          font-weight: 800;
          color: #0A6C84;
          line-height: 1;
        }

        .kpi-etiqueta {
          font-size: 0.72rem;
          font-weight: 600;
          color: #5B7078;
          text-transform: uppercase;
          margin-top: 2px;
        }

        .barra-busqueda-kardex {
          margin-bottom: 1.25rem;
        }

        .contenedor-input-busqueda {
          position: relative;
          display: flex;
          align-items: center;
        }

        .icono-lupa {
          position: absolute;
          left: 1rem;
          font-size: 1rem;
          color: #5B7078;
          pointer-events: none;
        }

        .input-busqueda-predictiva {
          width: 100%;
          min-height: 46px;
          padding: 0.65rem 2.5rem 0.65rem 2.85rem;
          font-size: 0.875rem;
          border: 1px solid #C4DCE0;
          border-radius: 10px;
          background: #FFFFFF;
          color: #12343B;
          outline: none;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(10, 108, 132, 0.04);
        }

        .input-busqueda-predictiva:focus {
          border-color: #1FA5B8;
          box-shadow: 0 0 0 3px rgba(31, 165, 184, 0.15);
        }

        .btn-limpiar-busqueda {
          position: absolute;
          right: 0.75rem;
          background: none;
          border: none;
          color: #5B7078;
          font-size: 1rem;
          cursor: pointer;
          padding: 0.25rem;
        }

        .panel-tabla-kardex {
          background: #FFFFFF;
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(10, 108, 132, 0.06);
          overflow: hidden;
        }

        .badge-expediente {
          display: inline-block;
          font-family: monospace;
          background: #EAF5F7;
          color: #0A6C84;
          padding: 3px 8px;
          border-radius: 6px;
          border: 1px solid #C4DCE0;
          font-size: 0.82rem;
        }

        .celda-paciente, .celda-contacto, .celda-consultas, .celda-atencion {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .nombre-paciente {
          font-size: 0.875rem;
          color: #12343B;
        }

        .sub-ci, .sub-atendidas {
          font-size: 0.75rem;
          color: #5B7078;
        }

        .badge-consultas-total {
          background: #E8F8FA;
          color: #0A6C84;
          font-weight: 700;
          font-size: 0.75rem;
          padding: 2px 7px;
          border-radius: 8px;
          display: inline-block;
          width: fit-content;
        }

        .btn-ver-expediente {
          min-height: 44px;
          background: #0A6C84;
          color: #FFFFFF;
          border: none;
          font-size: 0.8rem;
          font-weight: 700;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .btn-ver-expediente:hover {
          background: #074F61;
        }

        .tarjeta-movil-kardex {
          padding: 0.85rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .tarjeta-movil-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .movil-nombre {
          font-size: 0.95rem;
          color: #12343B;
        }

        .movil-ci {
          font-size: 0.78rem;
          color: #5B7078;
        }

        .tarjeta-movil-bot {
          font-size: 0.75rem;
          color: #0A6C84;
          font-weight: 600;
        }

        .subpanel-detalle-kardex {
          background: #F4FAFB;
          border-radius: 8px;
          padding: 1.15rem 1.25rem;
          margin: 0.5rem 0;
          border: 1px solid #E1ECEE;
        }

        .grid-datos-clinicos {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 0.85rem;
          margin-bottom: 1rem;
        }

        @media (max-width: 768px) {
          .grid-datos-clinicos {
            grid-template-columns: 1fr;
          }
        }

        .columna-completa {
          grid-column: 1 / -1;
        }

        .etiqueta-detalle {
          display: block;
          font-size: 0.72rem;
          font-weight: 700;
          color: #5B7078;
          text-transform: uppercase;
          margin-bottom: 2px;
        }

        .valor-detalle {
          font-size: 0.85rem;
          color: #12343B;
        }

        .parrafo-clinico {
          margin: 0;
          font-size: 0.82rem;
          color: #12343B;
          background: #FFFFFF;
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          border: 1px solid #E1ECEE;
          line-height: 1.35;
        }

        .alerta-alergia {
          background: #FDEDEC;
          border-color: #F5B7B1;
          color: #922B21;
          font-weight: 600;
        }

        .acciones-detalle-kardex {
          display: flex;
          justify-content: flex-end;
          padding-top: 0.75rem;
          border-top: 1px dashed #C4DCE0;
        }

        .btn-abrir-historia {
          min-height: 44px;
          background: #0A6C84;
          color: #FFFFFF;
          font-size: 0.875rem;
          font-weight: 700;
          padding: 0.6rem 1.35rem;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
        }

        .btn-abrir-historia:hover {
          background: #074F61;
        }
      `}</style>
    </LayoutPrincipal>
  );
}

