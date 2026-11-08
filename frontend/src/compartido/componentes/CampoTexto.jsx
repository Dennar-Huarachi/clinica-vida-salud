import React from 'react';

export default function CampoTexto({
  etiqueta,
  id,
  nombre,
  tipo = 'text',
  valor,
  alCambiar,
  error,
  marcador = '',
  requerido = false,
  deshabilitado = false,
  filas = null,
}) {
  const identificador = id || nombre;

  return (
    <div className="grupo-campo">
      {etiqueta && (
        <label htmlFor={identificador} className="etiqueta-campo">
          {etiqueta} {requerido && <span style={{ color: 'var(--cancelada)' }}>*</span>}
        </label>
      )}

      {filas ? (
        <textarea
          id={identificador}
          name={nombre}
          value={valor ?? ''}
          onChange={alCambiar}
          placeholder={marcador}
          disabled={deshabilitado}
          rows={filas}
          className={`textarea-campo ${error ? 'error' : ''}`}
        />
      ) : (
        <input
          id={identificador}
          name={nombre}
          type={tipo}
          value={valor ?? ''}
          onChange={alCambiar}
          placeholder={marcador}
          disabled={deshabilitado}
          className={`input-campo ${error ? 'error' : ''}`}
        />
      )}

      {error && <span className="mensaje-error-campo">{error}</span>}
    </div>
  );
}
