/**
 * Configuración dinámica de rutas y navegación categorizada por rol
 * Clínica Vida Salud
 */

export const RUTAS_POR_ROL = {
  paciente: [
    {
      seccion: 'ATENCIÓN',
      items: [
        {
          titulo: 'Mis Citas',
          ruta: '/paciente/mis-citas',
          icono: 'calendario',
          descripcion: 'Consulta y seguimiento de citas programadas'
        },
        {
          titulo: 'Agendar Cita',
          ruta: '/paciente/reservar',
          icono: 'calendario-plus',
          descripcion: 'Reserva de nueva consulta médica'
        },
        {
          titulo: 'Historial Clínico',
          ruta: '/paciente/historial',
          icono: 'historia',
          descripcion: 'Atenciones y antecedentes de salud'
        }
      ]
    }
  ],

  medico: [
    {
      seccion: 'CONSULTA',
      items: [
        {
          titulo: 'Mi Agenda de Citas',
          ruta: '/medico/agenda',
          icono: 'agenda',
          descripcion: 'Pacientes programados para hoy'
        },
        {
          titulo: 'Mis Pacientes (Kardex)',
          ruta: '/medico/pacientes',
          icono: 'pacientes',
          descripcion: 'Expedientes clínicos y kardex'
        }
      ]
    },
    {
      seccion: 'HISTORIAL',
      items: [
        {
          titulo: 'Atenciones Clínicas',
          ruta: '/medico/atenciones',
          icono: 'estetoscopio',
          descripcion: 'Registro y seguimiento de consultas'
        },
        {
          titulo: 'Resultados de Laboratorio',
          ruta: '/medico/laboratorio',
          icono: 'laboratorio',
          descripcion: 'Exámenes clínicos y diagnósticos'
        }
      ]
    }
  ],

  recepcionista: [
    {
      seccion: 'VENTANILLA',
      items: [
        {
          titulo: 'Agenda General',
          ruta: '/recepcion/citas',
          icono: 'calendario',
          descripcion: 'Grilla de citas por consultorio'
        },
        {
          titulo: 'Programar Cita',
          ruta: '/recepcion/agendar',
          icono: 'calendario-plus',
          descripcion: 'Asignación rápida de turnos'
        },
        {
          titulo: 'Padrón de Pacientes',
          ruta: '/recepcion/pacientes',
          icono: 'pacientes',
          descripcion: 'Búsqueda y registro de pacientes'
        }
      ]
    },
    {
      seccion: 'OPERACIONES',
      items: [
        {
          titulo: 'Suspensiones de Horario',
          ruta: '/recepcion/suspensiones',
          icono: 'pausa',
          descripcion: 'Bloqueos de agenda médica'
        },
        {
          titulo: 'Reportes de Citas',
          ruta: '/recepcion/reportes',
          icono: 'reportes',
          descripcion: 'Estadísticas operativas de ventanilla'
        }
      ]
    }
  ],

  administrador: [
    {
      seccion: 'PANEL',
      items: [
        {
          titulo: 'Dashboard General',
          ruta: '/admin/dashboard',
          icono: 'dashboard',
          descripcion: 'Indicadores globales y métricas clave'
        }
      ]
    },
    {
      seccion: 'CATÁLOGOS CLÍNICOS',
      items: [
        {
          titulo: 'Especialidades',
          ruta: '/admin/especialidades',
          icono: 'especialidades',
          descripcion: 'Gestión de ramas y servicios'
        },
        {
          titulo: 'Cuerpo Médico',
          ruta: '/admin/medicos',
          icono: 'medicos',
          descripcion: 'Directorio de profesionales de salud'
        },
        {
          titulo: 'Horarios de Atención',
          ruta: '/admin/horarios',
          icono: 'horarios',
          descripcion: 'Turnos y disponibilidad semanal'
        },
        {
          titulo: 'Suspensiones y Contingencias',
          ruta: '/admin/suspensiones',
          icono: 'pausa',
          descripcion: 'Suspensiones médicas y reubicaciones'
        }
      ]
    },
    {
      seccion: 'CITAS & PACIENTES',
      items: [
        {
          titulo: 'Gestión de Citas',
          ruta: '/admin/citas',
          icono: 'calendario',
          descripcion: 'Monitoreo de citas y estados'
        },
        {
          titulo: 'Pacientes Registrados',
          ruta: '/admin/pacientes',
          icono: 'pacientes',
          descripcion: 'Padrón y expedientes'
        }
      ]
    },
    {
      seccion: 'SEGURIDAD & AUDITORÍA',
      items: [
        {
          titulo: 'Usuarios, Roles y Permisos',
          ruta: '/admin/usuarios',
          icono: 'seguridad',
          descripcion: 'Control de accesos y credenciales'
        },
        {
          titulo: 'Bitácora de Auditoría',
          ruta: '/admin/bitacora',
          icono: 'auditoria',
          descripcion: 'Trazabilidad de acciones del sistema'
        },
        {
          titulo: 'Copias de Seguridad',
          ruta: '/admin/respaldos',
          icono: 'respaldos',
          descripcion: 'Mantenimiento y resguardo de datos'
        }
      ]
    },
    {
      seccion: 'REPORTES',
      items: [
        {
          titulo: 'Reportes y Estadísticas',
          ruta: '/admin/reportes',
          icono: 'reportes',
          descripcion: 'Informes gerenciales e imprimibles'
        }
      ]
    }
  ]
};

/**
 * Obtiene la configuración de menú según el rol normalizado
 */
export function obtenerMenuPorRol(rol) {
  if (!rol) return [];
  const rolNormalizado = rol.toLowerCase().trim();
  return RUTAS_POR_ROL[rolNormalizado] || RUTAS_POR_ROL['paciente'] || [];
}

/**
 * Mapeo para obtener títulos amigables según la ruta actual
 */
export const TITULOS_RUTAS = {
  '/admin/dashboard': 'Panel de Control General',
  '/dashboard': 'Panel de Control General',
  '/admin/especialidades': 'Catálogo de Especialidades Médicas',
  '/especialidades': 'Catálogo de Especialidades Médicas',
  '/admin/medicos': 'Directorio del Cuerpo Médico',
  '/medicos': 'Directorio del Cuerpo Médico',
  '/admin/horarios': 'Programación y Horarios de Atención',
  '/admin/citas': 'Gestión Integral de Citas Médicas',
  '/admin/pacientes': 'Padrón de Pacientes Registrados',
  '/admin/usuarios': 'Control de Usuarios, Roles y Permisos',
  '/usuarios': 'Control de Usuarios, Roles y Permisos',
  '/admin/bitacora': 'Bitácora de Auditoría del Sistema',
  '/auditoria': 'Bitácora de Auditoría del Sistema',
  '/admin/respaldos': 'Copias de Seguridad y Resguardo',
  '/admin/reportes': 'Reportes y Estadísticas Clínicas',
  '/reportes': 'Reportes y Estadísticas Clínicas',
  
  '/paciente/mis-citas': 'Mis Citas Médicas',
  '/paciente/reservar': 'Agendar Nueva Cita Médica',
  '/citas/reserva': 'Agendar Nueva Cita Médica',
  '/paciente/historial': 'Mi Historial Clínico',
  '/paciente/perfil': 'Mi Perfil de Usuario',
  '/perfil': 'Mi Perfil de Usuario',

  '/medico/agenda': 'Mi Agenda de Citas',
  '/medico/pacientes': 'Mis Pacientes (Kardex)',
  '/medico/atenciones': 'Atenciones Clínicas Realizadas',
  '/medico/laboratorio': 'Resultados y Exámenes de Laboratorio',

  '/recepcion/citas': 'Ventanilla - Agenda General de Citas',
  '/recepcion/agendar': 'Ventanilla - Programar Cita',
  '/recepcion/pacientes': 'Ventanilla - Padrón de Pacientes',
  '/recepcion/suspensiones': 'Gestión de Suspensiones y Reubicación de Citas',
  '/admin/suspensiones': 'Gestión de Suspensiones y Reubicación de Citas',
  '/suspensiones': 'Gestión de Suspensiones y Reubicación de Citas',
  '/recepcion/reportes': 'Ventanilla - Reportes de Citas',

  '/pacientes': 'Gestión de Pacientes',
  '/citas/agenda': 'Agenda General de Citas',
  '/citas/historial': 'Historial y Seguimiento de Citas',
  '/historia-clinica': 'Historia Clínica Electrónica',
};

/**
 * Obtiene el título correspondiente a una ruta, con soporte para rutas dinámicas
 */
export function resolverTituloRuta(pathname) {
  if (TITULOS_RUTAS[pathname]) {
    return TITULOS_RUTAS[pathname];
  }

  // Rutas dinámicas
  if (pathname.startsWith('/medico/pacientes/')) {
    return 'Expediente Clínico del Paciente';
  }
  if (pathname.startsWith('/medico/atenciones/')) {
    return 'Expediente Clínico del Paciente';
  }
  if (pathname.startsWith('/medico/laboratorio/')) {
    return 'Laboratorio del Paciente';
  }
  if (pathname.startsWith('/historia-clinica/atencion/')) {
    return 'Registro de Atención Clínica';
  }
  if (pathname.startsWith('/historia-clinica/')) {
    return 'Expediente Clínico del Paciente';
  }

  return 'Panel de Control - Clínica Vida Salud';
}
