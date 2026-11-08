import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../../compartido/utilidades/api';

/**
 * Hook personalizado para consultar y monitorear turnos de atención disponibles en tiempo real (CU-10).
 *
 * Características:
 * - Evita respuestas desactualizadas o fuera de orden mediante AbortController y secuencia de requestId.
 * - Desactiva caché HTTP añadiendo timestamp dinámico (_t) y cabeceras 'Cache-Control: no-cache'.
 * - Detecta regreso a la pestaña (visibilitychange / focus) para re-validar disponibilidad fresca.
 * - Filtra estrictamente los turnos que realmente están libres (`disponible === true || disponible === 1`).
 * - Deselecciona automáticamente cualquier turno que deje de estar disponible tras una actualización.
 * - Permite forzar la re-consulta inmediata mediante la función `refrescar()`.
 */
export default function useDisponibilidadTurnos({
  idMedico,
  idEspecialidad,
  fecha,
  rolUsuario = null,
  turnoSeleccionado = null,
  onDeseleccionarTurno = null,
  activo = true,
}) {
  const [turnos, setTurnos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [motivoBloqueo, setMotivoBloqueo] = useState(null);
  const [errorServidor, setErrorServidor] = useState(null);

  const peticionIdRef = useRef(0);
  const abortControllerRef = useRef(null);
  const ultimoRefrescoRef = useRef(0);

  const consultarDisponibilidad = useCallback(() => {
    if (!activo || !idMedico || !idEspecialidad || !fecha) {
      setTurnos([]);
      setMotivoBloqueo(null);
      setErrorServidor(null);
      setCargando(false);
      return;
    }

    // Cancelar petición anterior si aún está en curso
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const nuevoController = new AbortController();
    abortControllerRef.current = nuevoController;

    const idPeticionActual = ++peticionIdRef.current;

    setCargando(true);
    setErrorServidor(null);
    setMotivoBloqueo(null);

    // Parámetro único anti-caché en la URL, SIN encabezados personalizados para evitar bloqueos CORS
    const params = {
      id_medico: idMedico,
      id_especialidad: idEspecialidad,
      fecha: fecha,
      _t: Date.now(),
    };

    if (rolUsuario) {
      params.rol = rolUsuario;
    }

    api
      .get('/catalogos/disponibilidad', {
        params,
        signal: nuevoController.signal,
      })
      .then((res) => {
        // Ignorar respuesta si ya se disparó una petición más reciente
        if (idPeticionActual !== peticionIdRef.current) return;

        const resultado = res.data?.datos || {};
        if (resultado.disponible) {
          const listaTurnos = Array.isArray(resultado.turnos) ? resultado.turnos : [];
          setTurnos(listaTurnos);
          setMotivoBloqueo(null);
        } else {
          setTurnos([]);
          setMotivoBloqueo(
            resultado.motivo_bloqueo ||
              'No hay turnos disponibles para esta fecha. Elija otra fecha u otro médico.'
          );
        }
      })
      .catch((err) => {
        // Si fue abortada voluntariamente o quedó obsoleta, no modificar el estado
        if (
          err.name === 'CanceledError' ||
          err.name === 'AbortError' ||
          err.code === 'ERR_CANCELED' ||
          idPeticionActual !== peticionIdRef.current
        ) {
          return;
        }

        setTurnos([]);
        const codigo = err.response?.status;
        if (codigo === 401) {
          localStorage.removeItem('token_clinica');
          localStorage.removeItem('usuario_clinica');
          window.location.href = '/login?motivo=sesion_expirada';
          return;
        }

        const msj =
          err.response?.data?.mensaje ||
          'No se pudo conectar con el servidor para consultar los turnos disponibles.';
        setErrorServidor(msj);
      })
      .finally(() => {
        if (idPeticionActual === peticionIdRef.current) {
          setCargando(false);
        }
      });
  }, [activo, idMedico, idEspecialidad, fecha, rolUsuario]);

  // Consulta reactiva y limpieza de selección cuando cambian especialidad, médico o fecha
  useEffect(() => {
    if (onDeseleccionarTurno) {
      onDeseleccionarTurno();
    }
    consultarDisponibilidad();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [idMedico, idEspecialidad, fecha, activo]);

  // Monitoreo de foco y visibilidad de pestaña: máximo una vez cada 10 segundos
  useEffect(() => {
    if (!activo) return;

    const manejarRefrescoFoco = () => {
      if (document.visibilityState === 'visible' && idMedico && idEspecialidad && fecha) {
        const ahora = Date.now();
        if (ahora - ultimoRefrescoRef.current >= 10000) {
          ultimoRefrescoRef.current = ahora;
          consultarDisponibilidad();
        }
      }
    };

    document.addEventListener('visibilitychange', manejarRefrescoFoco);
    window.addEventListener('focus', manejarRefrescoFoco);

    return () => {
      document.removeEventListener('visibilitychange', manejarRefrescoFoco);
      window.removeEventListener('focus', manejarRefrescoFoco);
    };
  }, [activo, idMedico, idEspecialidad, fecha, consultarDisponibilidad]);

  // Si el turno seleccionado ya no está disponible tras una recarga (o la lista llega vacía),
  // deseleccionarlo reactivamente. Solo se evalúa cuando NO está cargando (!cargando)
  // para evitar deselecciones transitorias mientras los datos viajan por la red.
  useEffect(() => {
    if (!cargando && turnoSeleccionado) {
      if (turnos.length === 0) {
        if (onDeseleccionarTurno) {
          onDeseleccionarTurno();
        }
      } else {
        const sigueDisponible = turnos.some(
          (t) =>
            (t.disponible === true || t.disponible === 1) &&
            t.hora_inicio === turnoSeleccionado.hora_inicio
        );

        if (!sigueDisponible && onDeseleccionarTurno) {
          onDeseleccionarTurno();
        }
      }
    }
  }, [cargando, turnos, turnoSeleccionado, onDeseleccionarTurno]);

  const turnosDisponibles = turnos.filter(
    (t) => t.disponible === true || t.disponible === 1
  );

  return {
    turnos,
    turnosDisponibles,
    cargando,
    motivoBloqueo,
    errorServidor,
    refrescar: consultarDisponibilidad,
  };
}

