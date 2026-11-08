# Frontend SPA — Clínica "Vida Salud"

Aplicación Web de Página Única (Single Page Application - SPA) desarrollada con **React 19**, **Vite** y **CSS Modular Puro (Vanilla CSS con variables `:root`)**, diseñada con enfoque **Mobile-First estricto** para la interacción de pacientes, médicos, recepcionistas y administradores de la **Clínica Vida Salud**.

---

## 1. Stack Tecnológico y Principios de Diseño

* **Framework y Bundler:** React 19 (`react: ^19.3.1`, `react-dom: ^19.3.1`) + Vite (`vite: ^8.3.4`).
* **Enrutamiento:** React Router DOM v7 (`react-router-dom: ^7.18.4`).
* **Cliente HTTP:** Axios (`axios: ^1.20.0`) con interceptores globales para Bearer token, manejo de errores 401 y redirección por 403.
* **Estilos y Maquetación:** **CSS Modular Propio** (sin TailwindCSS ni Bootstrap). Control milimétrico mediante variables CSS en `src/compartido/estilos/variables.css` y reglas base en `src/compartido/estilos/base.css`.
* **Diseño Mobile-First Estricto:** Diseñado prioritariamente para pantallas móviles ($\le 640$ px) y expandido fluidamente a tabletas y laptops.
* **Cero Scroll Horizontal:** Implementación estandarizada del componente `TablaExpandible.jsx`, que transforma cuadrículas de datos en acordeones verticales expandibles en dispositivos móviles.
* **Humanización de la Interfaz (Decisión D19):** Prohibición terminante de exhibir códigos de ingeniería de requisitos (`CU-xx`, `RNxx`, `RFxx`, `Dxx`) en la interfaz visible al usuario final.

---

## 2. Estructura de Directorios

La estructura sigue el principio **Package-by-Feature (Organización por Paquetes y Casos de Uso)** alineado con el backend:

```
frontend/src/
├── Paquetes/
│   ├── AccesoCuentas/
│   │   ├── CU01_IniciarCerrarSesion/
│   │   │   ├── IniciarSesion.jsx (Contenedor general de acceso)
│   │   │   ├── LoginPaciente.jsx (Acceso web autoservicio)
│   │   │   ├── LoginPersonal.jsx (Acceso para médicos, recepcionistas y administradores)
│   │   │   ├── ModalRecuperarPassword.jsx (Recuperación simulada de credenciales)
│   │   │   ├── PaginaLogin.jsx (Vista unificada de autenticación)
│   │   │   └── SelectorPerfilLogin.jsx (Selector de canal paciente vs. personal)
│   │   ├── CU02_CambiarContrasena/
│   │   │   ├── ModalCambiarContrasena.jsx (Modal contextual de cambio de clave)
│   │   │   └── PaginaCambiarContrasena.jsx (Vista protegida de cambio de contraseña)
│   │   ├── CU03_RegistrarsePaciente/
│   │   │   └── PaginaRegistroPaciente.jsx (Formulario de registro autónomo)
│   │   ├── CU04_AdministrarUsuariosRoles/
│   │   │   ├── MatrizRolesPermisos.jsx (Matriz interactiva de permisos por rol)
│   │   │   ├── ModalNuevoRol.jsx (Modal de alta de rol personalizado)
│   │   │   └── PaginaUsuariosRoles.jsx (Gestión integral de usuarios y credenciales)
│   │   └── CU26_GenerarRestaurarCopiasSeguridad/
│   │       └── PaginaCopiasSeguridad.jsx (Generación, descarga y restauración de respaldos SQL)
│   ├── PacientesPerfil/
│   │   ├── CU05_GestionarPacientes/
│   │   │   └── PaginaGestionPacientes.jsx (Padrón, expedientes y kardex de pacientes)
│   │   └── CU06_GestionarMiPerfil/
│   │       ├── MiPerfil.jsx (Componente de formulario clínico y contacto de emergencia)
│   │       └── PaginaMiPerfil.jsx (Vista de perfil personal del paciente)
│   ├── CatalogosHorarios/
│   │   ├── CU07_GestionarEspecialidades/
│   │   │   └── PaginaEspecialidades.jsx (Catálogo de ramas y conmutador en línea)
│   │   ├── CU08_GestionarMedicos/
│   │   │   └── PaginaMedicos.jsx (Directorio del cuerpo médico y asignación de especialidades)
│   │   ├── CU09_GestionarHorariosAtencion/
│   │   │   ├── ModalHorario.jsx (Configurador interactivo de franjas y turnos)
│   │   │   └── PaginaHorarios.jsx (Grilla semanal de atención médica)
│   │   ├── CU10_ConsultarDisponibilidad/
│   │   │   ├── SelectorDisponibilidadTurnos.jsx (Selector dinámico de turnos libres con formato limpio de hora de inicio)
│   │   │   └── useDisponibilidadTurnos.js (Hook personalizado con polling inteligente y deselección reactiva segura)
│   │   └── CU11_SuspenderHorarioGestionarCitasAfectadas/
│   │       ├── PaginaSuspensiones.jsx (Gestión de contingencias y monitoreo de citas postergadas)
│   │       ├── ModalNuevaSuspension.jsx (Formulario de suspensión de horario con validación de fechas)
│   │       └── ModalReubicarCita.jsx (Modal de reubicación con prioridad de 48h, manejo de 409 y grilla limpia)
│   ├── CitasNotificaciones/
│   │   ├── CU12_GestionarCitas/
│   │   │   ├── PaginaReservaCitas.jsx (Flujo de reserva y pago de garantía con manejo robusto de errores 409, 401, 422 y 500)
│   │   │   └── ModalReprogramarCita.jsx (Modal modular de reprogramación de turnos con validación de concurrencia)
│   │   ├── CU13_RegistrarAsistenciaInasistenciaAtencion/
│   │   ├── CU14_ConsultarAgendaCitas/
│   │   │   └── PaginaAgendaCitas.jsx (Agenda médica operativa con control de asistencia)
│   │   ├── CU15_ConsultarHistorialSeguimientoCitas/
│   │   │   └── PaginaHistorialCitas.jsx (Historial cronológico y comprobantes de depósito)
│   │   ├── CU16_EnviarNotificacionesRecordatorios/
│   │   └── CU27_GestionarPagosReembolsos/
│   │       ├── ModalPasarelaPagoSimulada.jsx (Pasarela interactiva QR simple y Tarjeta)
│   │       ├── ComprobanteDigitalTransaccion.jsx (Recibo oficial con código TX)
│   │       └── InsigniaEstadoPago.jsx (Badge financiero: Completado, Reembolsado, Retenido)
│   ├── HistoriaClinica/
│   │   ├── CU17_ConsultarMisPacientes/
│   │   │   └── PaginaKardexPacientes.jsx (Kardex digital y padrón de pacientes asignados al médico)
│   │   ├── CU18_RegistrarAtencionClinica/
│   │   │   └── FormularioAtencionClinica.jsx (Registro de diagnósticos CIE-10, tratamientos y recetas)
│   │   ├── CU19_RegistrarResultadosLaboratorio/
│   │   │   └── ModalResultadosLab.jsx (Registro de estudios, métricas y resultados diagnósticos)
│   │   └── CU20_ConsultarHistorialClinico/
│   │       └── PaginaHistorialClinico.jsx (Expediente médico integral del paciente con línea de tiempo)
│   └── Reportes/
│       ├── CU21_ConsultarReportesCitas/
│       │   └── PaginaReportes.jsx (Reportes operativos y estadísticas de citas)
│       ├── CU22_ConsultarReporteAsistenciaPacientes/
│       ├── CU23_ExportarReportes/
│       ├── CU24_ConsultarBitacoraAuditoria/
│       │   └── PaginaBitacora.jsx (Visor inmutable de eventos del sistema)
│       └── CU25_VisualizarDashboardAdministrativo/
│           └── PaginaDashboard.jsx (Panel ejecutivo con indicadores clave)
├── comun/
│   ├── HeaderSuperior.jsx (Cabecera interna con identidad del usuario y botón de salida)
│   ├── LayoutPrincipal.jsx (Contenedor maestro con barra lateral y área de trabajo)
│   ├── NavbarPublico.jsx (Navegación responsive para visitantes de la clínica)
│   ├── Sidebar.jsx (Menú lateral categorizado y sensible al rol autenticado)
│   ├── rutasPorRol.js (Definición jerárquica de rutas, iconos y títulos canónicos)
│   ├── componentes/
│   │   ├── ChecklistContrasena.jsx (Validación visual reactiva de 5 criterios de seguridad)
│   │   ├── RutaProtegidaPorRol.jsx (Guardia de acceso por rol con auto-redirección canónica)
│   │   └── TablaExpandible.jsx (Tabla responsive con filas acordeón mobile-first)
│   └── hooks/
│       └── useInactividad.js (Temporizador pasivo de 15 minutos para auto-cierre de sesión)
├── compartido/
│   ├── componentes/
│   │   ├── Alerta.jsx (Notificaciones contextuales de éxito, error, advertencia e info)
│   │   ├── CampoSelect.jsx (Selector estilizado con mensajes de validación)
│   │   ├── CampoTexto.jsx (Input semántico con etiqueta superior y feedback)
│   │   └── InsigniaEstado.jsx (Badge de 8 estados de cita y estados de registro)
│   ├── estilos/
│   │   ├── base.css (Estilos globales, tipografía Nunito Sans, tablas y botones)
│   │   └── variables.css (Paleta turquesa/naranja, radios y sombras)
│   ├── layouts/
│   │   └── LayoutPrincipal.jsx
│   └── utilidades/
│       └── api.js (Cliente Axios con interceptores de seguridad 401/403)
├── publico/
│   ├── InicioPublico.jsx (Secciones institucionales, portada y especialidades)
│   └── PaginaInicio.jsx (Página de aterrizaje institucional)
├── main.jsx (Punto de entrada React 19)
└── App.jsx (Enrutador central, listener nativo multi-pestaña 'storage')
```

---

## 3. Seguridad y Resiliencia en el Cliente (OWASP Top 10)

1. **Guardia Estricto por Rol (`RutaProtegidaPorRol.jsx`):**
   - Intercepta los intentos de navegación directa por URL.
   - Si no hay token en `localStorage`, redirige a `/login`.
   - Si el rol no figura entre los `rolesPermitidos`, redirige al portal canónico legítimo del usuario (`/paciente/mis-citas`, `/medico/agenda`, `/recepcion/citas`, `/admin/dashboard`).
2. **Sincronización Multi-Pestaña en Tiempo Real (`App.jsx`):**
   - Escucha el evento nativo `window.addEventListener('storage', ...)` monitoreando las claves `token_clinica` y `usuario_clinica`.
   - Si otra pestaña cierra sesión o inicia sesión con un rol diferente, la pestaña actual se recarga de inmediato (`window.location.reload()`), impidiendo la suplantación de perfiles o sesiones residuales desincronizadas.
3. **Interceptor Global Axios (`api.js`):**
   - **401 Unauthorized:** Purga automáticamente las credenciales de `localStorage` y redirige a `/login?motivo=sesion_expirada`.
   - **403 Forbidden (Anti-IDOR):** Registra una alerta institucional de seguridad en `sessionStorage` (`alerta_seguridad_clinica`) y redirige de inmediato a la ruta base autorizada del rol.
4. **Cierre Automático por Inactividad (`useInactividad.js`):**
   - Monitorea eventos de usuario (`mousemove`, `keydown`, `click`, `scroll`).
   - Tras 15 minutos sin interacción activa, destruye la sesión y redirige a login por seguridad del paciente o del personal.
5. **Checklist Interactivo de Robustez (`ChecklistContrasena.jsx`):**
   - Evalúa en vivo 5 criterios de seguridad criptográfica: mínimo 8 caracteres, al menos una mayúscula, al menos una minúscula, al menos un número y al menos un símbolo especial.

---

## 4. Paleta de Colores y Tokens de Diseño (`variables.css`)

```css
:root {
  /* Marca Institucional */
  --verde-azulado:   #0A6C84; /* Títulos, menús, botones secundarios */
  --turquesa:        #1FA5B8; /* Detalles, iconos de línea, bordes activos */
  --cian:            #22C3E0; /* Botones pequeños, resaltados */
  --naranja:         #F28C1E; /* SOLO para la acción principal (CTA) */
  --naranja-oscuro:  #C75F00; /* Naranja accesible para texto blanco */

  /* Fondos y Superficies */
  --fondo:           #F4FAFB;
  --blanco:          #FFFFFF;

  /* Texto */
  --texto:           #12343B; /* Color de lectura principal */
  --texto-sec:       #5B7078; /* Color para información secundaria */

  /* Estados de la Cita Médica */
  --programada:      #22C3E0;
  --confirmada:      #2E9E6B;
  --atendida:        #0A6C84;
  --cancelada:       #D9534F;
  --inasistencia:    #7A8A90;
  --postergada:      #E0A100;

  /* Depósito de Garantía (CU-27 / D17) */
  --pago-completado: #16A34A;
  --pago-reembolsado:#0284C7;
  --pago-retenido:   #DC2626;

  /* Geometría */
  --radio:           14px;
  --sombra:          0 4px 16px rgba(10, 108, 132, 0.10);
}
```

---

## 5. Instrucciones de Ejecución Local

### Prerrequisitos
* Node.js $\ge 20$ y `npm`.
* Backend de Laravel activo en `http://127.0.0.1:8000`.

### Puesta en Marcha
```bash
cd frontend

# Instalar dependencias
npm install

# Configurar variables de entorno (.env)
# VITE_API_URL=http://127.0.0.1:8000/api
cp .env.example .env

# Iniciar servidor de desarrollo en Vite
npm run dev
```

La aplicación quedará disponible en `http://localhost:5173`.
