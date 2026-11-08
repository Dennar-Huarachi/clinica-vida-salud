import React from 'react';

export default function CampoSelect({
  etiqueta,
  id,
  nombre,
  valor,
  alCambiar,
  error,
  opciones = [],
  textoVacio = '-- Seleccione una opción --',
  requerido = false,
  deshabilitado = false,
}) {
  const identificador = id || nombre;

  return (
    <div className="grupo-campo">
      {etiqueta && (
        <label htmlFor={identificador} className="etiqueta-campo">
          {etiqueta} {requerido && <span style={{ color: 'var(--cancelada)' }}>*</span>}
        </label>
      )}

      <select
        id={identificador}
        name={nombre}
        value={valor ?? ''}
        onChange={alCambiar}
        disabled={deshabilitado}
        className={`select-campo ${error ? 'error' : ''}`}
      >
        <option value="">{textoVacio}</option>
        {opciones.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.etiqueta}
          </option>
        ))}
      </select>

      {error && <span className="mensaje-error-campo">{error}</span>}
    </div>
  );
}
