import axios from 'axios';

// Obtener la URL base desde las variables de entorno de Vite con sanitización de prefijo
const rawBaseURL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').trim().replace(/\/+$/, '');

// Garantizar que siempre apunte al prefijo /api requerido por el backend sin duplicarlo
const apiBaseURL = rawBaseURL.endsWith('/api') ? rawBaseURL : `${rawBaseURL}/api`;

// Instancia de axios para comunicarse con la API del backend (Laravel).
const api = axios.create({
  baseURL: apiBaseURL,
  withCredentials: true,
});

// Interceptor de peticiones: adjuntar token Bearer si existe en localStorage
api.interceptors.request.use((configuracion) => {
  const token = localStorage.getItem('token_clinica');

  if (token) {
    if (configuracion.headers && typeof configuracion.headers.set === 'function') {
      configuracion.headers.set('Authorization', `Bearer ${token}`);
    } else {
      configuracion.headers = configuracion.headers || {};
      configuracion.headers.Authorization = `Bearer ${token}`;
      configuracion.headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // Sanitizar si se pasa la ruta con prefijo /api repetido
  if (configuracion.url && configuracion.url.startsWith('/api/')) {
    configuracion.url = configuracion.url.substring(4);
  }

  return configuracion;
});

// Mapeo canónico de rutas de inicio según el rol para redirección segura
const RUTAS_BASE_ROL = {
  paciente: '/paciente/mis-citas',
  medico: '/medico/agenda',
  recepcionista: '/recepcion/citas',
  administrador: '/admin/dashboard',
};

// Interceptor global de respuestas (CAPA 2: Manejo de 401 y 403)
api.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    const estado = error?.response?.status;

    if (estado === 401) {
      // Token expirado, revocado o inválido: purgar almacenamiento
      localStorage.removeItem('token_clinica');
      localStorage.removeItem('usuario_clinica');

      // Redirigir de inmediato a la vista de login con motivo explicativo si no se encuentra allí
      if (!window.location.pathname.startsWith('/login') && window.location.pathname !== '/') {
        window.location.href = '/login?motivo=sesion_expirada';
      }
    } else if (estado === 403) {
      // 403 Forbidden: Intento de acceso a recurso ajeno o no autorizado (Anti-IDOR / RN12)
      try {
        const usuarioRaw = localStorage.getItem('usuario_clinica');
        const usuario = usuarioRaw ? JSON.parse(usuarioRaw) : null;
        const rol = (usuario?.rol || '').toLowerCase().trim();

        // Almacenar alerta institucional de seguridad
        sessionStorage.setItem(
          'alerta_seguridad_clinica',
          JSON.stringify({
            mensaje: 'Permiso denegado: No cuenta con autorización para acceder a este recurso clínico.',
            timestamp: Date.now(),
            origen: window.location.pathname,
          })
        );

        // Redirigir a la pantalla principal legítima de su rol
        const rutaDestino = RUTAS_BASE_ROL[rol] || '/login';
        if (window.location.pathname !== rutaDestino) {
          window.location.href = rutaDestino;
        }
      } catch (e) {
        // Ignorar fallos de parsing
      }
    }

    return Promise.reject(error);
  }
);

export default api;
