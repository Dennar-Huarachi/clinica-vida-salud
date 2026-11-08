import React, { useState, useEffect, useRef } from 'react';

/**
 * Normaliza cadenas de texto para búsqueda tolerante a mayúsculas, minúsculas y tildes/diacríticos.
 */
function normalizarTexto(texto) {
  if (texto === null || texto === undefined) return '';
  return texto
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Componente SelectorBuscador (Autocomplete Predictivo)
 * Sustituye a <select> nativo para catálogos extensos con filtro en tiempo real.
 */
export default function SelectorBuscador({
  etiqueta,
  id,
  nombre,
  valor,
  alCambiar,
  alSeleccionar,
  opciones = [],
  marcador = 'Escriba o seleccione una opción...',
  error,
  requerido = false,
  deshabilitado = false,
  mensajeVacio = 'No se encontraron coincidencias.',
}) {
  const identificador = id || nombre || 'selector-buscador';
  const contenedorRef = useRef(null);
  const inputRef = useRef(null);
  const listaRef = useRef(null);

  const [abierto, setAbierto] = useState(false);
  const [textoBusqueda, setTextoBusqueda] = useState('');
  const [indiceResaltado, setIndiceResaltado] = useState(0);

  // Sincronizar texto visible con el valor actual
  useEffect(() => {
    if (valor !== undefined && valor !== null && valor !== '') {
      const seleccionada = opciones.find((op) => String(op.valor) === String(valor));
      setTextoBusqueda(seleccionada ? seleccionada.etiqueta : '');
    } else {
      setTextoBusqueda('');
    }
  }, [valor, opciones]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function manejarClicFuera(evento) {
      if (contenedorRef.current && !contenedorRef.current.contains(evento.target)) {
        setAbierto(false);
        // Si se cerró sin seleccionar una opción diferente, restaurar el texto correspondiente al valor
        if (valor !== undefined && valor !== null && valor !== '') {
          const seleccionada = opciones.find((op) => String(op.valor) === String(valor));
          setTextoBusqueda(seleccionada ? seleccionada.etiqueta : '');
        } else {
          setTextoBusqueda('');
        }
      }
    }

    document.addEventListener('mousedown', manejarClicFuera);
    document.addEventListener('touchstart', manejarClicFuera);
    return () => {
      document.removeEventListener('mousedown', manejarClicFuera);
      document.removeEventListener('touchstart', manejarClicFuera);
    };
  }, [valor, opciones]);

  // Filtrado reactivo insensible a mayúsculas/minúsculas y tildes
  const termino = normalizarTexto(textoBusqueda);
  const opcionesFiltradas = opciones.filter((op) => {
    if (!termino) return true;
    const txtEtiqueta = normalizarTexto(op.etiqueta);
    const txtSub = normalizarTexto(op.subtitulo || '');
    const txtExtra = normalizarTexto(op.busqueda || '');
    return (
      txtEtiqueta.includes(termino) ||
      txtSub.includes(termino) ||
      txtExtra.includes(termino)
    );
  });

  // Reiniciar índice resaltado al cambiar opciones filtradas
  useEffect(() => {
    setIndiceResaltado(0);
  }, [textoBusqueda]);

  const seleccionarOpcion = (op) => {
    if (alCambiar) {
      alCambiar({ target: { name: nombre, value: op.valor } });
    }
    if (alSeleccionar) {
      alSeleccionar(op.valor, op);
    }
    setTextoBusqueda(op.etiqueta);
    setAbierto(false);
  };

  const limpiarSeleccion = (e) => {
    e.stopPropagation();
    if (alCambiar) {
      alCambiar({ target: { name: nombre, value: '' } });
    }
    if (alSeleccionar) {
      alSeleccionar('', null);
    }
    setTextoBusqueda('');
    setAbierto(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const manejarKeyDown = (e) => {
    if (deshabilitado) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!abierto) {
        setAbierto(true);
      } else {
        setIndiceResaltado((prev) =>
          prev < opcionesFiltradas.length - 1 ? prev + 1 : prev
        );
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (abierto) {
        setIndiceResaltado((prev) => (prev > 0 ? prev - 1 : 0));
      }
    } else if (e.key === 'Enter') {
      if (abierto && opcionesFiltradas[indiceResaltado]) {
        e.preventDefault();
        seleccionarOpcion(opcionesFiltradas[indiceResaltado]);
      }
    } else if (e.key === 'Escape') {
      setAbierto(false);
    }
  };

  const tieneValor = valor !== undefined && valor !== null && valor !== '';

  return (
    <div
      ref={contenedorRef}
      className={`grupo-campo selector-buscador-contenedor ${deshabilitado ? 'deshabilitado' : ''}`}
      style={{ position: 'relative', marginBottom: '1.25rem' }}
    >
      {etiqueta && (
        <label htmlFor={identificador} className="etiqueta-campo">
          {etiqueta} {requerido && <span style={{ color: 'var(--cancelada, #E53E3E)' }}>*</span>}
        </label>
      )}

      <div style={{ position: 'relative', width: '100%' }}>
        <input
          ref={inputRef}
          id={identificador}
          name={nombre}
          type="text"
          autoComplete="off"
          value={textoBusqueda}
          placeholder={marcador}
          disabled={deshabilitado}
          onChange={(e) => {
            setTextoBusqueda(e.target.value);
            if (!abierto) setAbierto(true);
          }}
          onClick={() => {
            if (!deshabilitado) setAbierto(true);
          }}
          onFocus={() => {
            if (!deshabilitado) setAbierto(true);
          }}
          onKeyDown={manejarKeyDown}
          className={`input-campo selector-buscador-input ${error ? 'error' : ''}`}
          style={{
            paddingRight: tieneValor && !deshabilitado ? '3rem' : '2.25rem',
            cursor: deshabilitado ? 'not-allowed' : 'text',
          }}
        />

        {/* Botonera de acciones (Limpiar y Flecha desplegable) */}
        <div
          style={{
            position: 'absolute',
            right: '0.65rem',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            pointerEvents: deshabilitado ? 'none' : 'auto',
          }}
        >
          {tieneValor && !deshabilitado && (
            <button
              type="button"
              onClick={limpiarSeleccion}
              className="btn-limpiar-selector"
              title="Borrar selección"
              aria-label="Borrar selección"
              tabIndex={-1}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}

          <span
            onClick={() => {
              if (!deshabilitado) {
                setAbierto(!abierto);
                if (!abierto && inputRef.current) inputRef.current.focus();
              }
            }}
            style={{
              cursor: deshabilitado ? 'not-allowed' : 'pointer',
              color: 'var(--texto-sec, #5B7078)',
              display: 'flex',
              alignItems: 'center',
              transform: abierto ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </div>

        {/* Menú Flotante Desplegable */}
        {abierto && !deshabilitado && (
          <div
            ref={listaRef}
            className="selector-buscador-menu"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              background: '#FFFFFF',
              border: '1.5px solid var(--turquesa, #1FA5B8)',
              borderRadius: '10px',
              boxShadow: '0 8px 24px rgba(10, 108, 132, 0.16)',
              maxHeight: '220px',
              overflowY: 'auto',
              zIndex: 1050,
              padding: '0.35rem 0',
            }}
          >
            {opcionesFiltradas.length === 0 ? (
              <div
                style={{
                  padding: '0.85rem 1rem',
                  fontSize: '0.875rem',
                  color: 'var(--texto-sec, #5B7078)',
                  textAlign: 'center',
                }}
              >
                🔍 {mensajeVacio}
              </div>
            ) : (
              opcionesFiltradas.map((op, idx) => {
                const esSeleccionado = String(op.valor) === String(valor);
                const esResaltado = idx === indiceResaltado;

                return (
                  <div
                    key={op.valor}
                    onClick={() => seleccionarOpcion(op)}
                    onMouseEnter={() => setIndiceResaltado(idx)}
                    className="selector-buscador-item"
                    style={{
                      padding: '0.65rem 0.95rem',
                      cursor: 'pointer',
                      fontSize: '0.925rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      background: esSeleccionado
                        ? '#EAF5F7'
                        : esResaltado
                        ? '#F4FAFB'
                        : 'transparent',
                      color: esSeleccionado ? 'var(--verde-azulado, #0A6C84)' : 'var(--texto, #12343B)',
                      fontWeight: esSeleccionado ? 700 : 500,
                      borderLeft: esSeleccionado
                        ? '4px solid var(--turquesa, #1FA5B8)'
                        : '4px solid transparent',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{op.etiqueta}</span>
                      {esSeleccionado && (
                        <span style={{ color: 'var(--turquesa, #1FA5B8)', fontSize: '0.9rem' }}>✓</span>
                      )}
                    </div>
                    {op.subtitulo && (
                      <span
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--texto-sec, #5B7078)',
                          fontWeight: 400,
                        }}
                      >
                        {op.subtitulo}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {error && <span className="mensaje-error-campo">{error}</span>}

      <style>{`
        .btn-limpiar-selector {
          background: #E1ECEE;
          border: none;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #5B7078;
          transition: background 0.15s ease, color 0.15s ease;
          padding: 0;
        }
        .btn-limpiar-selector:hover {
          background: #CFDEE3;
          color: #12343B;
        }
        .selector-buscador-item:hover {
          background: #E8F8FA !important;
          color: #0A6C84 !important;
        }
      `}</style>
    </div>
  );
}

