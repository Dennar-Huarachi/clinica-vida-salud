import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../compartido/utilidades/api';

/**
 * Custom Hook: useInactividad
 * Manejador transversal de auto-cierre de sesión tras un periodo de inactividad del usuario.
 *
 * @param {number} tiempoLimiteMs - Tiempo en milisegundos (por defecto 15 minutos = 900,000 ms)
 */
export default function useInactividad(tiempoLimiteMs = 15 * 60 * 1000) {
  const navigate = useNavigate();
  const temporizadorRef = useRef(null);

  const cerrarPorInactividad = useCallback(async () => {
    const token = localStorage.getItem('token_clinica');
    
    // Si no hay sesión activa, no realizar ninguna acción
    if (!token) {
      return;
    }

    try {
      // Notificar al backend la revocación de la sesión si aún es posible
      await api.post('/acceso/logout');
    } catch {
      // Ignorar errores de red en la desconexión por inactividad
    } finally {
      // Limpiar tokens y credenciales locales
      localStorage.removeItem('token_clinica');
      localStorage.removeItem('usuario_clinica');

      // Guardar mensaje flash de inactividad para mostrar en la vista de login
      const mensaje = 'Su sesión ha expirado por inactividad por motivos de seguridad.';
      sessionStorage.setItem('flash_inactividad', mensaje);

      // Redirigir al login con estado y parámetro informativo
      navigate('/login?expirada=1', {
        replace: true,
        state: { mensajeInactividad: mensaje }
      });
    }
  }, [navigate]);

  const reiniciarTemporizador = useCallback(() => {
    if (temporizadorRef.current) {
      clearTimeout(temporizadorRef.current);
    }

    // Solo activar temporizador si existe una sesión activa
    if (localStorage.getItem('token_clinica')) {
      temporizadorRef.current = setTimeout(() => {
        cerrarPorInactividad();
      }, tiempoLimiteMs);
    }
  }, [tiempoLimiteMs, cerrarPorInactividad]);

  useEffect(() => {
    // Si no hay sesión, no registrar oyentes de inactividad
    if (!localStorage.getItem('token_clinica')) {
      return;
    }

    // Iniciar temporizador inmediatamente
    reiniciarTemporizador();

    // Eventos globales a monitorear
    const eventos = ['mousemove', 'keydown', 'click', 'scroll'];

    const manejarActividad = () => {
      reiniciarTemporizador();
    };

    // Registrar oyentes con passive: true para rendimiento óptimo
    eventos.forEach((evento) => {
      window.addEventListener(evento, manejarActividad, { passive: true });
    });

    return () => {
      if (temporizadorRef.current) {
        clearTimeout(temporizadorRef.current);
      }
      eventos.forEach((evento) => {
        window.removeEventListener(evento, manejarActividad);
      });
    };
  }, [reiniciarTemporizador]);

  return { reiniciarTemporizador };
}
