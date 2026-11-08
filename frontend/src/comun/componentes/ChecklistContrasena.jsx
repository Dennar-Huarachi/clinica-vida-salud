import React from 'react';

/**
 * Validador y Checklist visual de los 5 requisitos de seguridad de contraseña
 * Requisitos:
 * 1. Mínimo 8 caracteres
 * 2. Al menos una letra mayúscula [A-Z]
 * 3. Al menos una letra minúscula [a-z]
 * 4. Al menos un número [0-9]
 * 5. Al menos un carácter especial o símbolo [!@#$%^&*(),.?":{}|<>]
 */
export function validarRequisitosContrasena(contrasena = '') {
  return {
    longitud: contrasena.length >= 8,
    mayuscula: /[A-Z]/.test(contrasena),
    minuscula: /[a-z]/.test(contrasena),
    numero: /[0-9]/.test(contrasena),
    simbolo: /[!@#$%^&*(),.?":{}|<>]/.test(contrasena),
  };
}

export function esContrasenaSegura(contrasena = '') {
  const req = validarRequisitosContrasena(contrasena);
  return req.longitud && req.mayuscula && req.minuscula && req.numero && req.simbolo;
}

export default function ChecklistContrasena({ contrasena = '' }) {
  const req = validarRequisitosContrasena(contrasena);

  const items = [
    { cumplido: req.longitud, texto: 'Mínimo 8 caracteres' },
    { cumplido: req.mayuscula, texto: 'Al menos una letra mayúscula (A-Z)' },
    { cumplido: req.minuscula, texto: 'Al menos una letra minúscula (a-z)' },
    { cumplido: req.numero, texto: 'Al menos un número (0-9)' },
    { cumplido: req.simbolo, texto: 'Al menos un símbolo o carácter especial (!@#$%...)' },
  ];

  return (
    <div className="checklist-contrasena-contenedor" aria-live="polite">
      <div className="checklist-contrasena-titulo">Requisitos de seguridad de la contraseña:</div>
      <div className="checklist-contrasena-grid">
        {items.map((item, index) => (
          <div
            key={index}
            className={`checklist-item ${item.cumplido ? 'cumplido' : 'pendiente'}`}
          >
            <span className="checklist-icono">
              {item.cumplido ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                </svg>
              )}
            </span>
            <span className="checklist-texto">{item.texto}</span>
          </div>
        ))}
      </div>

      <style>{`
        .checklist-contrasena-contenedor {
          background-color: #F8FAFB;
          border: 1px solid #E2EBF0;
          border-radius: 8px;
          padding: 10px 12px;
          margin-top: 8px;
          margin-bottom: 12px;
          font-size: 12px;
        }

        .checklist-contrasena-titulo {
          font-weight: 600;
          color: #4A6572;
          margin-bottom: 6px;
        }

        .checklist-contrasena-grid {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .checklist-item {
          display: flex;
          align-items: center;
          gap: 6px;
          transition: color 0.15s ease;
        }

        .checklist-item.pendiente {
          color: #94A3B8;
        }

        .checklist-item.cumplido {
          color: #16A34A;
          font-weight: 500;
        }

        .checklist-icono {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}
