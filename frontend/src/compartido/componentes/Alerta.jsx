import React from 'react';

export default function Alerta({ tipo = 'exito', mensaje }) {
  if (!mensaje) return null;

  return (
    <div className={tipo === 'error' ? 'alerta-error' : 'alerta-exito'}>
      {mensaje}
    </div>
  );
}
