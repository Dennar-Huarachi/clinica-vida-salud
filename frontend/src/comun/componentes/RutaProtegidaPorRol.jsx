import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * Mapeo de rutas de inicio legítimas por cada rol del sistema.
 */
const RUTAS_BASE_POR_ROL = {
  paciente: '/paciente/mis-citas',
  medico: '/medico/agenda',
  recepcionista: '/recepcion/citas',
  administrador: '/admin/dashboard'
};

/**
 * Guardia Estricto de Rutas por Rol (RN12 - Broken Access Control Protection)
 *
 * Evaluación en dos fases:
 * 1. Autenticación: Comprueba token_clinica y usuario_clinica en localStorage.
 * 2. Autorización: Comprueba que usuario.rol pertenezca a rolesPermitidos.
 *
 * Si no está autorizado, BAJO NINGUNA CIRCUNSTANCIA renderiza el contenido protegido.
 */
export default function RutaProtegidaPorRol({ children, rolesPermitidos = [] }) {
  const location = useLocation();

  // FASE 1: Verificación de Autenticación
  const token = localStorage.getItem('token_clinica');
  const usuarioRaw = localStorage.getItem('usuario_clinica');

  if (!token || !usuarioRaw) {
    // Si no hay sesión válida, limpiar posibles residuos y redirigir al login
    localStorage.removeItem('token_clinica');
    localStorage.removeItem('usuario_clinica');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  let usuario = null;
  try {
    usuario = JSON.parse(usuarioRaw);
  } catch (error) {
    // Corrupción en localStorage -> forzar login limpio
    localStorage.removeItem('token_clinica');
    localStorage.removeItem('usuario_clinica');
    return <Navigate to="/login" replace />;
  }

  if (!usuario || !usuario.rol) {
    return <Navigate to="/login" replace />;
  }

  // FASE 2: Verificación de Autorización Estricta (RN12)
  const rolNormalizado = String(usuario.rol).toLowerCase().trim();
  const rolesPermitidosNormalizados = rolesPermitidos.map((r) => String(r).toLowerCase().trim());

  // Si se definieron roles permitidos y el rol del usuario NO está incluido
  if (rolesPermitidosNormalizados.length > 0 && !rolesPermitidosNormalizados.includes(rolNormalizado)) {
    // Definir la ruta base segura correspondiente a su rol legítimo
    const rutaBaseLegitima = RUTAS_BASE_POR_ROL[rolNormalizado] || '/login';

    // Guardar alerta de seguridad en sessionStorage para que sea leída por el layout
    try {
      sessionStorage.setItem(
        'alerta_seguridad_clinica',
        JSON.stringify({
          mensaje: 'Acceso no autorizado para su perfil. Ha sido redirigido a su portal correspondiente.',
          timestamp: Date.now(),
          origen: location.pathname
        })
      );
    } catch (e) {
      // Ignorar error de cuota en sessionStorage
    }

    // BAJO NINGUNA CIRCUNSTANCIA renderizar children
    return <Navigate to={rutaBaseLegitima} replace />;
  }

  // Autenticado y Autorizado: Renderizar vista protegida
  return children;
}
