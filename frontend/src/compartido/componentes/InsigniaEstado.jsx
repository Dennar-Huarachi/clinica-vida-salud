import React from 'react';

export default function InsigniaEstado({ estado, texto }) {
  const clave = (estado || '').toLowerCase().replace(/\s+/g, '_');
  const etiqueta = texto || estado || 'N/A';

  return (
    <span className={`insignia insignia-${clave}`}>
      {etiqueta}
    </span>
  );
}
