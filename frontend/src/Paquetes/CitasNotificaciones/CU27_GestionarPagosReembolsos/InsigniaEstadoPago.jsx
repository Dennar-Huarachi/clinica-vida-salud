import React from 'react';

/**
 * Insignia visual accesible para los estados del depósito de garantía (CU-27 / D17 / RN15).
 * Estados admitidos: completado, reembolsado, retenido.
 */
export default function InsigniaEstadoPago({ estado, monto = '50.00', compacto = false }) {
  const estadoNormalizado = (estado || '').toLowerCase().trim();

  if (estadoNormalizado === 'completado') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          backgroundColor: '#DEF7EC',
          color: '#03543F',
          padding: compacto ? '2px 6px' : '4px 10px',
          borderRadius: '6px',
          fontWeight: 700,
          fontSize: compacto ? '0.75rem' : '0.82rem',
          lineHeight: 1.2,
          border: '1px solid #BCF0DA',
        }}
        title="Garantía de reserva pagada y confirmada"
      >
        <span>✓</span>
        <span>{compacto ? `${monto} Bs` : `Depósito ${monto} Bs`}</span>
      </span>
    );
  }

  if (estadoNormalizado === 'reembolsado') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          backgroundColor: '#E1EFFE',
          color: '#1E429F',
          padding: compacto ? '2px 6px' : '4px 10px',
          borderRadius: '6px',
          fontWeight: 700,
          fontSize: compacto ? '0.75rem' : '0.82rem',
          lineHeight: 1.2,
          border: '1px solid #B4C6FC',
        }}
        title="Depósito devuelto íntegramente por cancelación oportuna"
      >
        <span>↩</span>
        <span>{compacto ? `Reembolsado` : `Reembolsado (${monto} Bs)`}</span>
      </span>
    );
  }

  if (estadoNormalizado === 'retenido') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          backgroundColor: '#FDE8E8',
          color: '#9B1C1C',
          padding: compacto ? '2px 6px' : '4px 10px',
          borderRadius: '6px',
          fontWeight: 700,
          fontSize: compacto ? '0.75rem' : '0.82rem',
          lineHeight: 1.2,
          border: '1px solid #F8B4B4',
        }}
        title="Retenido por inasistencia o cancelación tardía con menos de 12 horas de anticipación"
      >
        <span>✕</span>
        <span>{compacto ? `Retenido` : `Retenido (Sin devolución)`}</span>
      </span>
    );
  }

  return (
    <span style={{ color: '#94A3B8', fontSize: '0.82rem' }}>
      —
    </span>
  );
}
