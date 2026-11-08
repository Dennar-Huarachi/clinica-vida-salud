import React, { useState } from 'react';

/**
 * TablaExpandible
 * Componente reutilizable para el patrón de filas desplegables / acordeón (Collapsible Rows).
 * Adapta la estructura tanto para pantallas grandes (tabla tabular tradicional) como para
 * dispositivos móviles (<= 640px) con transformación 100% vertical, sin scroll horizontal,
 * cabeceras de 2 líneas con badges y botón chevron, y subpanel con datos en columna única
 * y botonera de acciones apilada accesible (min-height: 44px).
 *
 * Props:
 * - columnas: Array de títulos de columnas (ej. ['Código Paciente', 'Nombre Completo', 'Teléfono', 'Estado', ''])
 * - datos: Array de elementos
 * - obtenerClaveFila: Función para obtener identificador único (ej: item => item.id_paciente)
 * - renderFilaPrincipal: (item, isExpanded, toggleExpand) => JSX celdas <td> (usado en Desktop > 640px)
 * - renderFilaMovil: (item, isExpanded, toggleExpand) => JSX (usado en Móvil <= 640px)
 * - renderDetalle: (item, toggleExpand) => JSX subpanel interior
 * - cargando: boolean
 * - mensajeVacio: string
 */
export default function TablaExpandible({
  columnas = [],
  datos = [],
  obtenerClaveFila = (item, idx) => item?.id ?? idx,
  renderFilaPrincipal,
  renderFilaMovil,
  renderDetalle,
  cargando = false,
  mensajeVacio = 'No se encontraron registros.',
}) {
  const [filasExpandidas, setFilasExpandidas] = useState({});

  const toggleExpandir = (id) => {
    setFilasExpandidas((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const colSpanTotal = Math.max(columnas.length, 1);

  return (
    <div className="tabla-expandible-contenedor">
      <table className="tabla-expandible-tabla">
        <thead className="tabla-expandible-thead">
          <tr>
            {columnas.map((col, idx) => (
              <th
                key={idx}
                className={idx === columnas.length - 1 ? 'col-flecha' : ''}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="tabla-expandible-tbody">
          {cargando ? (
            <tr>
              <td colSpan={colSpanTotal} className="fila-vacia-cargando">
                <span className="spinner-tabla" /> Cargando registros…
              </td>
            </tr>
          ) : datos.length === 0 ? (
            <tr>
              <td colSpan={colSpanTotal} className="fila-vacia-mensaje">
                {mensajeVacio}
              </td>
            </tr>
          ) : (
            datos.map((item, index) => {
              const filaId = obtenerClaveFila(item, index);
              const estaExpandido = Boolean(filasExpandidas[filaId]);

              return (
                <React.Fragment key={filaId}>
                  {/* 1. Fila Principal Compacta Desktop (> 640px) */}
                  <tr
                    className={`fila-principal fila-desktop-solo ${estaExpandido ? 'fila-abierta' : ''}`}
                    onClick={() => toggleExpandir(filaId)}
                  >
                    {renderFilaPrincipal ? (
                      renderFilaPrincipal(item, estaExpandido, () => toggleExpandir(filaId))
                    ) : (
                      <td colSpan={colSpanTotal}>Definir renderFilaPrincipal</td>
                    )}
                  </tr>

                  {/* 2. Fila Principal Compacta Móvil (<= 640px) */}
                  <tr
                    className={`fila-principal fila-movil-solo ${estaExpandido ? 'fila-abierta' : ''}`}
                    onClick={() => toggleExpandir(filaId)}
                  >
                    <td colSpan={colSpanTotal} className="celda-fila-movil-contenedor">
                      {renderFilaMovil ? (
                        renderFilaMovil(item, estaExpandido, () => toggleExpandir(filaId))
                      ) : (
                        <div className="fila-resumen-movil-fallback">
                          {renderFilaPrincipal ? (
                            renderFilaPrincipal(item, estaExpandido, () => toggleExpandir(filaId))
                          ) : null}
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* 3. Subpanel Expandible (Común para Desktop y Móvil) */}
                  {estaExpandido && (
                    <tr className="fila-detalle-acordeon">
                      <td colSpan={colSpanTotal} className="celda-detalle-acordeon">
                        <div className="panel-detalle-animado">
                          <div className="panel-detalle">
                            {renderDetalle ? renderDetalle(item, () => toggleExpandir(filaId)) : null}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>

      {/* Estilos CSS del Acordeón Institucional de Tablas */}
      <style>{`
        .tabla-expandible-contenedor {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          background: #FFFFFF;
          border-radius: 12px;
          border: 1px solid #DCE9ED;
          box-shadow: 0 4px 16px rgba(10, 108, 132, 0.05);
          box-sizing: border-box;
        }

        .tabla-expandible-tabla {
          width: 100%;
          border-collapse: collapse;
          font-family: inherit;
          text-align: left;
        }

        .tabla-expandible-thead th {
          background-color: #F4FAFB;
          color: #0A6C84;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 12px 16px;
          border-bottom: 2px solid #D2E4E8;
          white-space: nowrap;
        }

        .tabla-expandible-thead th.col-flecha {
          width: 44px;
          text-align: center;
          padding-right: 16px;
        }

        .fila-principal {
          cursor: pointer;
          transition: background-color 0.15s ease;
          border-bottom: 1px solid #EBF2F4;
        }

        .fila-principal:hover {
          background-color: #F6FCFD;
        }

        .fila-principal.fila-abierta {
          background-color: #EFF8FA;
          border-bottom: none;
        }

        .fila-principal td {
          padding: 12px 16px;
          font-size: 13.5px;
          color: #1C2D37;
          vertical-align: middle;
        }

        /* En Desktop (> 640px), la fila móvil se oculta y la desktop se muestra */
        @media (min-width: 641px) {
          .fila-principal.fila-movil-solo {
            display: none !important;
          }
          .fila-principal.fila-desktop-solo {
            display: table-row !important;
          }
        }

        /* Celda Chevron */
        .boton-chevron-expandir {
          background: transparent;
          border: none;
          cursor: pointer;
          color: #1FA5B8;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          flex-shrink: 0;
          transition: transform 0.25s ease-in-out, background-color 0.15s ease, color 0.15s ease;
        }

        .boton-chevron-expandir:hover {
          background-color: #DDF1F5;
          color: #0A6C84;
        }

        .boton-chevron-expandir.rotado {
          transform: rotate(180deg);
          color: #0A6C84;
        }

        /* Subpanel Fila de Detalle */
        .fila-detalle-acordeon {
          border-bottom: 2px solid #D2E4E8;
        }

        .celda-detalle-acordeon {
          padding: 0 !important;
          background-color: #EFF8FA;
        }

        .panel-detalle-animado {
          animation: abrirAcordeon 0.25s ease-in-out;
          padding: 4px 16px 16px 16px;
          box-sizing: border-box;
          width: 100%;
        }

        @keyframes abrirAcordeon {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .panel-detalle {
          background-color: #FFFFFF;
          border-radius: 8px;
          border: 1px solid #D5E7EB;
          border-left: 4px solid #1FA5B8;
          box-shadow: 0 4px 12px rgba(10, 108, 132, 0.06);
          padding: 16px 20px;
          box-sizing: border-box;
          width: 100%;
        }

        .panel-detalle-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px 20px;
          margin-bottom: 14px;
          width: 100%;
          box-sizing: border-box;
        }

        .detalle-dato-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
          box-sizing: border-box;
        }

        .detalle-etiqueta {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: #5A7184;
          letter-spacing: 0.03em;
        }

        .detalle-valor {
          font-size: 13.5px;
          font-weight: 500;
          color: #1C2D37;
          word-break: break-word;
          overflow-wrap: break-word;
        }

        .panel-detalle-acciones,
        .panel-acciones,
        .acciones-detalle {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          padding-top: 14px;
          border-top: 1px solid #EDF4F6;
          flex-wrap: wrap;
          box-sizing: border-box;
        }

        .fila-vacia-cargando,
        .fila-vacia-mensaje {
          text-align: center;
          padding: 32px 16px;
          color: #5A7184;
          font-size: 14px;
        }

        .spinner-tabla {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid #1FA5B8;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.75s infinite linear;
          margin-right: 6px;
          vertical-align: middle;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ============================================================
           PATRÓN RESPONSIVE MÓVIL ESTRICTO (<= 640px)
           ============================================================ */
        @media (max-width: 640px) {
          .tabla-expandible-contenedor {
            width: 100% !important;
            max-width: 100% !important;
            overflow-x: hidden !important;
            box-sizing: border-box !important;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(10, 108, 132, 0.05);
          }

          .tabla-expandible-tabla {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }

          .tabla-expandible-thead {
            display: none !important;
          }

          .tabla-expandible-tbody {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }

          /* Ocultar fila desktop en móvil */
          .fila-principal.fila-desktop-solo {
            display: none !important;
          }

          /* Mostrar fila compacta móvil */
          .fila-principal.fila-movil-solo {
            display: block !important;
            width: 100% !important;
            box-sizing: border-box !important;
            border-bottom: 1px solid #EBF2F4;
          }

          .fila-principal.fila-movil-solo.fila-abierta {
            background-color: #EFF8FA;
            border-bottom: none;
          }

          .celda-fila-movil-contenedor {
            display: block !important;
            width: 100% !important;
            padding: 0 !important;
            box-sizing: border-box !important;
          }

          /* Subpanel Expandido */
          .fila-detalle-acordeon {
            display: block !important;
            width: 100% !important;
            box-sizing: border-box !important;
            border-bottom: 2px solid #D2E4E8;
          }

          .celda-detalle-acordeon {
            display: block !important;
            width: 100% !important;
            padding: 0 !important;
            background-color: #EFF8FA !important;
            box-sizing: border-box !important;
          }

          .panel-detalle-animado {
            padding: 2px 10px 14px 10px !important;
            box-sizing: border-box !important;
            width: 100% !important;
          }

          .panel-detalle {
            padding: 14px 12px !important;
            border-radius: 8px !important;
            width: 100% !important;
            box-sizing: border-box !important;
            overflow-x: hidden !important;
          }

          /* Grid a 1 sola columna vertical */
          .panel-detalle-grid {
            display: flex !important;
            flex-direction: column !important;
            grid-template-columns: 1fr !important;
            gap: 12px !important;
            width: 100% !important;
            margin-bottom: 16px !important;
            box-sizing: border-box !important;
          }

          .detalle-dato-item {
            width: 100% !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 2px !important;
            box-sizing: border-box !important;
          }

          .detalle-etiqueta {
            font-size: 11px !important;
            font-weight: 700 !important;
            text-transform: uppercase !important;
            color: #64748B !important;
            letter-spacing: 0.04em !important;
            word-break: break-word !important;
          }

          .detalle-valor {
            font-size: 13.5px !important;
            color: #1C2D37 !important;
            word-break: break-word !important;
            overflow-wrap: break-word !important;
          }

          /* Botonera de acciones apilada verticalmente */
          .panel-detalle-acciones,
          .panel-acciones,
          .acciones-detalle {
            display: flex !important;
            flex-direction: column !important;
            width: 100% !important;
            gap: 10px !important;
            padding-top: 14px !important;
            border-top: 1px solid #EDF4F6 !important;
            box-sizing: border-box !important;
          }

          .panel-detalle-acciones a,
          .panel-detalle-acciones button,
          .panel-detalle-acciones .boton-primario,
          .panel-detalle-acciones .boton-secundario,
          .panel-detalle-acciones .boton-terciario,
          .panel-detalle-acciones .boton-peligro,
          .panel-detalle-acciones .btn-accion-detalle,
          .panel-acciones a,
          .panel-acciones button,
          .acciones-detalle a,
          .acciones-detalle button {
            width: 100% !important;
            min-height: 44px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 8px !important;
            font-size: 0.95rem !important;
            font-weight: 600 !important;
            padding: 0 1rem !important;
            box-sizing: border-box !important;
            text-align: center !important;
            margin: 0 !important;
            border-radius: 8px !important;
          }

          /* Clases estándar para la Fila Resumen Móvil (2 Líneas) */
          .fila-resumen-movil {
            display: flex;
            flex-direction: column;
            width: 100%;
            gap: 8px;
            padding: 12px 14px;
            box-sizing: border-box;
          }

          .fila-resumen-movil-linea1 {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            box-sizing: border-box;
          }

          .fila-resumen-movil-linea2 {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            gap: 10px;
            box-sizing: border-box;
          }

          .fila-resumen-movil-nombre {
            display: flex;
            flex-direction: column;
            min-width: 0;
            flex: 1;
            text-align: left;
          }

          .nombre-paciente-destacado {
            font-size: 0.95rem;
            font-weight: 700;
            color: #1C2D37;
            line-height: 1.3;
            word-break: break-word;
          }

          .ci-paciente-sub {
            font-size: 0.8rem;
            color: #5A7184;
            margin-top: 2px;
          }

          .badge-codigo-turquesa {
            display: inline-flex;
            align-items: center;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            font-weight: 700;
            font-size: 0.82rem;
            color: #0A6C84;
            background-color: #E2F5F8;
            border: 1px solid #BDE5ED;
            padding: 3px 10px;
            border-radius: 6px;
            letter-spacing: 0.03em;
          }

          .btn-accion-destacado {
            background-color: #F28C1E !important;
            color: #FFFFFF !important;
          }

          .fila-resumen-movil-fallback {
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 12px 14px;
            width: 100%;
            box-sizing: border-box;
          }

          .fila-resumen-movil-fallback td {
            display: block !important;
            width: 100% !important;
            padding: 4px 0 !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
}
