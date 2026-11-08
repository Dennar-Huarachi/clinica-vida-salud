# Informe de Auditoría Integral QA y Corrección de Software
## Sistema Web de Gestión de Citas Médicas — Clínica Vida Salud

**Fecha de Ejecución:** 7 de noviembre de 2026  
**Auditor Senior Líder:** Ingeniero Senior de QA y Desarrollo Full-Stack  
**Entorno de Evaluación:** Local (Laragon Windows) / Base de Datos PostgreSQL 16 (Zona Horaria: `America/La_Paz` UTC-4)  
**Compatibilidad de Despliegue:** Render (Backend Laravel 11 sin prefijo `/api`), Supabase (PostgreSQL), Vercel (Frontend React 18 + Vite en Linux)

---

## 1. Hallazgos Clasificados por Severidad

### 1.1 Severidad Crítica

#### [CRIT-01] Desalineación de IDs en Catálogo `estados_cita` y Fallbacks Erróneos
- **Archivos Afectados:**
  - `backend/app/Paquetes/CitasNotificaciones/CU13_RegistrarAsistenciaInasistenciaAtencion/RegistrarAsistenciaServicio.php`
  - `backend/app/Paquetes/CitasNotificaciones/CU12_GestionarCitas/GestionarCitasServicio.php`
  - `backend/app/Paquetes/CatalogosHorarios/CU11_SuspenderHorarioGestionarCitasAfectadas/SuspenderHorarioServicio.php`
  - `backend/app/Paquetes/HistoriaClinica/CU17_ConsultarMisPacientes/ConsultarMisPacientesServicio.php`
  - `backend/app/Paquetes/HistoriaClinica/CU18_RegistrarAtencionClinica/RegistrarAtencionClinicaServicio.php`
- **Causa Raíz:** Varios controladores y servicios utilizaban identificadores enteros codificados en duro (*hardcoded*) o valores de respaldo (*fallback*) desfasados con la tabla `estados_cita`:
  - `1: pendiente`
  - `2: programada`
  - `3: confirmada`
  - `4: en_espera`
  - `5: atendida`
  - `6: cancelada`
  - `7: inasistencia`
  - `8: reprogramada`
  - `9: postergada`
  En `RegistrarAsistenciaServicio.php` la línea 30 comprobaba `id_estado_cita === 5` asumiendo que correspondía a `cancelada`, lo que bloqueaba la corrección administrativa RN16 de citas atendidas. En `GestionarCitasServicio.php` y `SuspenderHorarioServicio.php` se utilizaba `5` como fallback de `cancelada` y `8` como fallback de `postergada` (cuando postergada es `9` y reprogramada es `8`).
- **Impacto:** Bloqueo de flujos asistenciales, citas suspendidas asignadas a estados incorrectos, e imposibilidad de que el administrador corrigiera citas conmutativamente entre atendida e inasistencia.
- **Corrección Aplicada:** Se reemplazaron todas las constantes erróneas por búsquedas dinámicas mediante el código oficial (`'cancelada'`, `'atendida'`, `'inasistencia'`, `'reprogramada'`, `'postergada'`) con fallbacks exactos vinculados a la base de datos real.

#### [CRIT-02] Inconsistencia en Detección de Turnos Ocupantes (`ConsultarDisponibilidadServicio.php`)
- **Archivos Afectados:**
  - `backend/app/Paquetes/CatalogosHorarios/CU10_ConsultarDisponibilidad/ConsultarDisponibilidadServicio.php`
  - `backend/app/Models/Cita.php` (Nuevo modelo centralizador)
- **Causa Raíz:** Al calcular los intervalos libres, la consulta filtraba únicamente citas con estado `programada` o `confirmada`. Las citas con estado `reprogramada` (ID 8) o `en_espera` (ID 4) quedaban fuera del filtro de exclusión de la cuadrícula, provocando que turnos ya comprometidos (como el caso CM-0043 del Dr. Alarcón Paz a las 14:00) aparecieran erróneamente como disponibles en la interfaz del paciente, siendo rechazados recién al confirmar la transacción con un error 409 de concurrencia.
- **Impacto:** Experiencia de usuario frustrante, degradación de la confianza del paciente y colisiones de citas médicas.
- **Corrección Aplicada:** Se creó el modelo `App\Models\Cita` centralizando la constante `ESTADOS_OCUPANTES = ['pendiente', 'programada', 'confirmada', 'en_espera', 'atendida', 'inasistencia', 'reprogramada']` y el método `Cita::querySolapamiento()`. Se integró este método en `ConsultarDisponibilidadServicio`, garantizando que ningún turno con cita activa u ocupante se muestre en la cuadrícula de agendamiento.

#### [CRIT-03] Vulnerabilidad de Referencia Directa Insegura (IDOR / RN19) en Detalle de Citas y Atenciones Clínicas
- **Archivos Afectados:**
  - `backend/app/Http/Controllers/Paquetes/HistoriaClinica/CU18_RegistrarAtencionClinica/RegistrarAtencionClinicaControlador.php`
  - `backend/app/Http/Controllers/Paquetes/HistoriaClinica/CU20_ConsultarHistorialClinico/ConsultarHistorialClinicoControlador.php`
  - `backend/app/Http/Controllers/Paquetes/CitasNotificaciones/CU12_GestionarCitas/GestionarCitasControlador.php`
  - `backend/routes/api.php`
- **Causa Raíz:** El endpoint `/historia-clinica/atenciones/cita/{idCita}` no validaba si el usuario autenticado (paciente o médico) era el titular de la cita. En `ConsultarHistorialClinicoControlador`, ante una solicitud de un paciente con un `idPaciente` ajeno, el sistema sobreescribía el parámetro pero no denegaba el acceso explícitamente con HTTP 403. No existía un endpoint seguro `GET /citas/{id}` con validación de titularidad.
- **Impacto:** Fuga de información clínica confidencial (diagnósticos, antecedentes y tratamientos) entre pacientes.
- **Corrección Aplicada:** Se implementó una verificación estricta en dos capas:
  1. Si el rol es `paciente` y el `id_paciente` de la cita/expediente solicitado no coincide exactamente con el de la sesión criptográfica activa, se aborta la petición retornando inmediatamente HTTP 403 Forbidden.
  2. Si el rol es `medico`, se valida que la cita pertenezca a su agenda profesional.
  3. Se incorporó el método `show` en `GestionarCitasControlador` y la ruta protegida `GET /citas/{id}`.

#### [CRIT-04] Estandarización de Consumo HTTP y Manejo Canónico de Errores en Axios
- **Archivos Afectados:**
  - `frontend/src/compartido/utilidades/api.js`
  - `frontend/src/Paquetes/CitasNotificaciones/CU12_GestionarCitas/PaginaReservaCitas.jsx`
- **Causa Raíz:** Llamadas en componentes que empleaban `fetch()` nativo o instancias no configuradas de Axios provocaban fallos HTTP 401 (falta de token Bearer) y respuestas sin formato adecuado ante errores de red o validación (422/500).
- **Impacto:** Bloqueo silencioso de la UI o pantallas en blanco al presentarse fallos de red o errores de validación.
- **Corrección Aplicada:** Se estandarizó el uso de la instancia central `api` en Axios con interceptores automáticos de `Authorization: Bearer`, captura de 401 para redirección controlada al login, y normalización amigable de mensajes en español sin exponer trazas técnicas al usuario final.

---

### 1.2 Severidad Alta

#### [ALTA-01] Condición de Carrera (*Race Condition*) en Reserva de Turnos Concurrentes
- **Archivos Afectados:**
  - `backend/app/Paquetes/CitasNotificaciones/CU12_GestionarCitas/GestionarCitasServicio.php`
- **Causa Raíz:** Dos transacciones concurrentes podían consultar la disponibilidad del mismo intervalo de tiempo en milisegundos idénticos y ambas pasar la validación antes de que se completara el commit de la primera.
- **Impacto:** Sobreventa de turnos médicos (*double booking*) para el mismo especialista.
- **Corrección Aplicada:** Se implementó un bloqueo pesimista `lockForUpdate()` sobre la consulta de solapamiento dentro de la transacción atómica de base de datos (`DB::transaction`). Si un segundo proceso compite por el mismo turno, se bloquea a nivel de fila y el segundo intento es rechazado con HTTP 409 Conflict y el mensaje de contingencia adecuado.

#### [ALTA-02] Desincronización de Zona Horaria (UTC vs `America/La_Paz`)
- **Archivos Afectados:**
  - `backend/config/database.php`
  - `backend/app/Paquetes/CitasNotificaciones/CU12_GestionarCitas/GestionarCitasServicio.php`
  - `backend/app/Paquetes/Reportes/CU21_ConsultarReportesCitas/ReportesCitasServicio.php`
  - `backend/app/Paquetes/Reportes/CU22_ConsultarReporteAsistenciaPacientes/ReporteAsistenciaServicio.php`
  - `backend/app/Paquetes/Reportes/CU25_VisualizarDashboardAdministrativo/DashboardAdministrativoServicio.php`
- **Causa Raíz:** Los servidores de Render y Vercel se ejecutan de manera estándar en UTC (GMT+0), mientras que la Clínica Vida Salud opera en Bolivia (`America/La_Paz`, UTC-4). El uso de `now()` o `Carbon::now()` sin especificar zona horaria provocaba un desfase de 4 horas en el cálculo de las 12 horas mínimas de anticipación (RN15), en la habilitación del turno del día y en los reportes operativos.
- **Impacto:** Rechazo indebido de cancelaciones de pacientes y desfase en el cómputo de métricas diarias del Dashboard.
- **Corrección Aplicada:** Se fijó `'timezone' => 'America/La_Paz'` en `config/database.php` para la conexión PostgreSQL, y se sustituyeron los llamados de fecha en servicios por `Carbon::now('America/La_Paz')` y `Carbon::today('America/La_Paz')`.

#### [ALTA-03] Bloqueo en Vinculación de Pacientes Registrados en Ventanilla (Casos de Prueba 2 y 17)
- **Archivos Afectados:**
  - `backend/app/Http/Requests/Paquetes/AccesoCuentas/CU03_RegistrarsePaciente/RegistrarsePacienteRequest.php`
  - `backend/app/Paquetes/AccesoCuentas/CU03_RegistrarsePaciente/RegistrarsePacienteServicio.php`
- **Causa Raíz:** La regla de validación `'ci' => 'required|unique:personas,ci'` en `RegistrarsePacienteRequest` impedía que un paciente previamente atendido en recepción (que ya tiene ficha civil en `personas` pero no cuenta de usuario) pudiera autoregistrarse en línea para consultar su historial. Por otro lado, no existía validación para impedir que un usuario usurpara la ficha de otro paciente ingresando un CI existente con nombres divergentes.
- **Impacto:** Imposibilidad de que pacientes de ventanilla activaran su cuenta web (Test 2) y riesgo de usurpación de expedientes clínicos (Test 17).
- **Corrección Aplicada:** Se removió la restricción rígida en el FormRequest y se delegó la lógica de validación al servicio transaccional:
  1. Si el CI ya posee un usuario activo en `usuarios`, se rechaza con HTTP 422 (Test 2).
  2. Si el CI existe en `personas` pero no tiene usuario, se normalizan y comparan los nombres y apellidos. Si no coinciden, se rechaza con HTTP 422 indicando acudir a recepción (Test 17). Si coinciden, se vincula de forma segura a su historial clínico existente.

#### [ALTA-04] Prevención de Destrucción de la Cuenta del Último Administrador (RN11 / CU-04)
- **Archivos Afectados:**
  - `backend/app/Paquetes/AccesoCuentas/CU04_AdministrarUsuariosRoles/AdministrarUsuariosRolesServicio.php`
- **Causa Raíz:** Los métodos `actualizar` y `alternarEstado` permitían desactivar o despojar del rol de Administrador al único usuario administrador activo en la clínica.
- **Impacto:** Pérdida permanente del control de gestión del sistema institucional.
- **Corrección Aplicada:** Se añadió una validación atómica que contabiliza el total de administradores activos antes de cualquier modificación de rol o estado. Si el usuario afectado es el último administrador, la operación se cancela arrojando una excepción con código 422.

#### [ALTA-05] Doble Blindaje Físico de Concurrencia mediante Índice Único Parcial en PostgreSQL
- **Archivos Afectados:**
  - `backend/database/migrations/2026_11_07_000001_add_partial_unique_index_to_citas_table.php`
  - `backend/app/Models/Cita.php`
- **Causa Raíz:** Aunque la lógica de negocio aplicaba `lockForUpdate()`, no existía una restricción física en el motor PostgreSQL que impidiera el doble agendamiento en caso de peticiones directas, hilos desacoplados o transacciones no bloqueadas.
- **Impacto:** Riesgo residual de colisión de turnos en escenarios de concurrencia extrema o reinicio de conexiones.
- **Corrección Aplicada:** Se creó la migración `2026_11_07_000001` que añade el índice único parcial `uq_citas_turno_activo` sobre `(id_medico, fecha_cita, hora_inicio)` para citas que ocupan turno (`estado != 'cancelada' AND es_postergada = false AND id_estado_cita NOT IN (6, 9)`), resolviendo los IDs de forma dinámica e idempotente.

---

### 1.3 Severidad Media

#### [MED-01] Fuga de Información Técnica en Excepciones No Controladas
- **Archivos Afectados:**
  - `backend/bootstrap/app.php`
- **Causa Raíz:** Ante fallas de conexión a la base de datos o sintaxis SQL, Laravel renderizaba páginas HTML de depuración con rastreo de variables internas (*stack trace*).
- **Impacto:** Exposición de credenciales, rutas del servidor y detalles arquitectónicos a posibles atacantes (OWASP A05).
- **Corrección Aplicada:** Se reconfiguró el manejador global de excepciones en `bootstrap/app.php` para capturar cualquier excepción en peticiones dirigidas a la API, respondiendo siempre con formato JSON estructurado (`RespuestaApi::error()`) y código HTTP acorde (400, 401, 403, 404, 409, 422 o 500), sin volcar trazas internas.

#### [MED-02] Falta de Soporte Híbrido de Sesión (`SESSION_DRIVER=cookie` + Bearer Token)
- **Archivos Afectados:**
  - `backend/config/session.php`
  - `backend/config/cors.php`
  - `backend/app/Nucleo/Sesion/ManejadorSesion.php`
  - `backend/app/Http/Controllers/Paquetes/AccesoCuentas/CU01_IniciarCerrarSesion/IniciarCerrarSesionControlador.php`
  - `frontend/src/compartido/utilidades/api.js`
- **Causa Raíz:** En entornos desacoplados (Frontend en Vercel y Backend en Render), los navegadores bloquean cookies de terceros si no se configura explícitamente `supports_credentials = true`, `SameSite=None` y `Secure`. Además, el middleware `ManejadorSesion` sólo leía el encabezado `Authorization: Bearer`.
- **Impacto:** Sesión inestable o cierre inesperado al navegar entre pantallas.
- **Corrección Aplicada:** Se configuró CORS admitiendo expresiones regulares para dominios de Vercel y localhost, se habilitó `withCredentials: true` en Axios, se emitió la cookie `token_clinica` durante el login y se actualizó `ManejadorSesion` para autenticar a partir del Bearer Token o de la cookie en caso de ausencia del encabezado.

#### [MED-03] Restricción del Canal Online para Especialidades Solo Presenciales (RN18)
- **Archivos Afectados:**
  - `backend/app/Paquetes/CatalogosHorarios/CU10_ConsultarDisponibilidad/ConsultarDisponibilidadServicio.php`
  - `backend/app/Paquetes/CitasNotificaciones/CU12_GestionarCitas/GestionarCitasServicio.php`
- **Causa Raíz:** La columna en base de datos es `reservable_en_linea` (tipo boolean). Algunos fragmentos evaluaban `permite_reserva_online` o hacían comparación estricta `=== false`, lo que fallaba ante valores falsy de PostgreSQL (`0` o `'f'`).
- **Impacto:** Pacientes podían acceder a especialidades exclusivas de ventanilla presencial.
- **Corrección Aplicada:** Se unificó la lectura de `reservable_en_linea` mediante verificación boolean robusta (`!$especialidad->reservable_en_linea`), arrojando HTTP 403 tanto al consultar turnos como al intentar confirmar el agendamiento.

---

### 1.4 Severidad Baja

#### [BAJ-01] Manejo Seguro de Auditoría Forense en Copias de Seguridad y Bitácora
- **Archivos Afectados:**
  - `backend/app/Http/Controllers/Paquetes/Reportes/CU24_ConsultarBitacoraAuditoria/ConsultarBitacoraControlador.php`
  - `backend/app/Http/Controllers/Paquetes/AccesoCuentas/CU26_GenerarRestaurarCopiasSeguridad/GenerarRestaurarCopiasSeguridadControlador.php`
- **Causa Raíz:** Aunque las rutas estaban agrupadas con middleware de rol administrador, los controladores carecían de verificación interna de defensa en profundidad.
- **Corrección Aplicada:** Se añadió una validación explícita al inicio de cada método para retornar HTTP 403 inmediato si el rol autenticado no es estrictamente `administrador`.

---

## 2. Problemas Detectados pero NO Corregidos (Con Justificación Técnica)

1. **Aislamiento de Pacientes por Médico en Especialidades Compartidas:**
   - *Detalle:* En `ConsultarMisPacientesServicio.php`, el kardex muestra a todos los pacientes que han tenido al menos una cita con el médico evaluado. No se restringe la visualización de antecedentes médicos generales (alergias, enfermedades crónicas) declarados por el paciente, ya que esto responde a la necesidad clínica de conocer el historial médico completo previo a emitir un diagnóstico o receta.
   - *Justificación:* Modificar esto fragmentaría el expediente clínico del paciente y violaría las buenas prácticas médicas internacionales de continuidad del cuidado del paciente.

2. **Conservación de Registros de Auditoría y No Eliminación Física:**
   - *Detalle:* No se agregaron mecanismos para vaciar, truncar o depurar la tabla `bitacora_auditoria` ni `copias_seguridad`.
   - *Justificación:* La regla de negocio RN21 establece taxativamente que la bitácora debe ser inmutable y permanente. Cualquier mecanismo de borrado violaría las directrices forenses y las restricciones del mandato de auditoría.

3. **Tamaño de Chunks en Empaquetado Frontend de Vite (> 500 kB):**
   - *Detalle:* La compilación genera una advertencia indicando que el chunk principal `index-*.js` supera los 500 kB (922 kB descompreso / 209 kB comprimido gzip).
   - *Justificación:* El tamaño es totalmente admisible para la aplicación en producción. La división agresiva de chunks requeriría reestructurar el sistema de enrutamiento con `React.lazy()` en un entorno de entrega continua, lo que podría inducir problemas de resolución asíncrona en conexiones de baja latencia sin aportar beneficios funcionales inmediatos.

---

## 3. Esquema de Base de Datos y Supabase

### 3.1 Compatibilidad de Esquema
El esquema PostgreSQL alojado en Supabase fue rigurosamente respetado. **No se requirieron migraciones destructivas ni alteración de nombres de tablas o columnas existentes.**

### 3.2 Convenciones Mantenidas
- Tablas en español, singular y PascalCase / SnakeCase en catálogo de base de datos (`citas`, `pacientes`, `personas`, `medicos`, `especialidades`, `estados_cita`, `horarios_atencion`, `suspensiones_horario`, `bloqueos_clinica`, `pagos_cita`, `atenciones_clinicas`, `resultados_laboratorio`, `bitacora_auditoria`, `copias_seguridad`).
- Columna de especialidad: `reservable_en_linea` (boolean).
- Mapeo canónico verificado de `estados_cita`:
  | ID | Código | Nombre |
  | :--- | :--- | :--- |
  | 1 | `pendiente` | Pendiente |
  | 2 | `programada` | Programada |
  | 3 | `confirmada` | Confirmada |
  | 4 | `en_espera` | En Sala de Espera |
  | 5 | `atendida` | Atendida |
  | 6 | `cancelada` | Cancelada |
  | 7 | `inasistencia` | Inasistencia |
  | 8 | `reprogramada` | Reprogramada |
  | 9 | `postergada` | Postergada por Suspensión |

---

## 4. Resultados de los Casos de Prueba y Build de Frontend

### 4.1 Batería de Pruebas Automatizadas de Verificación (21 de 21 Aprobadas)
Ejecutadas mediante el script `backend/tests/ejecutar_20_pruebas.php` contra la base de datos real en Laragon:

| N° | Caso de Prueba | Regla / CU | Resultado Obtenido | Estado |
| :---: | :--- | :--- | :--- | :---: |
| **1** | Registrar paciente nuevo | CU-03 | Paciente creado con ID asignado, historia clínica única y usuario activo | **APROBADO** |
| **2** | Registrar paciente con CI duplicado | CU-03 / RN01 | Rechazado con HTTP 422: Cédula ya registrada con cuenta activa | **APROBADO** |
| **3** | Programar cita en turno libre | CU-12 / RN03 | Cita creada exitosamente con código alfanumérico y estado Programada | **APROBADO** |
| **4** | Programar cita en turno superpuesto | CU-12 / RN04 | Rechazado con HTTP 409 Conflict: Turno ya reservado por otro paciente | **APROBADO** |
| **5** | Reservar cita fuera de horario de médico | CU-12 / RN05 | Rechazado con HTTP 422: Fuera del horario de atención del profesional | **APROBADO** |
| **6** | Cancelar cita médica | CU-12 / RN11 | Estado lógico actualizado a Cancelada y turno liberado para nuevos pacientes | **APROBADO** |
| **7** | Historial del paciente | CU-15 | Lista cronológica de consultas previas con diagnóstico y pagos asociada | **APROBADO** |
| **8** | Citas de un médico por fecha | CU-14 | Agenda diaria y semanal consultada exitosamente con detalle de pacientes | **APROBADO** |
| **9** | Acceso a página interna sin sesión | CU-01 | Middleware de autenticación bloquea la petición retornando HTTP 401 | **APROBADO** |
| **10** | Operación con datos inválidos | Validación | FormRequest valida campos obligatorios y formato, retornando HTTP 422 | **APROBADO** |
| **11** | Cancelar cita con menos de 12 horas | CU-12 / RN15 | Rechazado con HTTP 422: Requiere mínimo 12h de anticipación para reembolso | **APROBADO** |
| **12** | Paciente busca turno presencial en línea | CU-10 / RN18 | Rechazado con HTTP 403: Especialidad requiere agendamiento en ventanilla | **APROBADO** |
| **13** | Marcar Atendida una cita Cancelada | CU-13 / RN16 | Rechazado con HTTP 422: Una cita cancelada no puede reactivarse | **APROBADO** |
| **14** | Admin corrige Atendida a Inasistencia | CU-13 / RN16 | Conmutación exitosa con motivo justificado y auditoría forense registrada | **APROBADO** |
| **15** | Suspender horario con citas activas | CU-11 / RN17 | Citas pasaron a Postergada (id=9) con prioridad 48h y horario bloqueado | **APROBADO** |
| **16** | Paciente abre cita de otro paciente | CU-12 / RN19 | Acceso denegado con HTTP 403 Forbidden por aislamiento Anti-IDOR | **APROBADO** |
| **17** | Registro con CI de ventanilla divergente | CU-03 / RN01 | Rechazado con HTTP 422: Nombres no coinciden con la ficha registrada | **APROBADO** |
| **18** | Login con contraseña incorrecta | CU-01 / RN21 | Login denegado con HTTP 401 y registrado en bitácora inmutable | **APROBADO** |
| **19** | No Administrador intenta abrir auditoría | CU-24 / CU-26 | Acceso a bitácora y respaldos bloqueado con HTTP 403 Forbidden | **APROBADO** |
| **20** | Generar y registrar copia de seguridad | CU-26 / RN22 | Archivo SQL generado físicamente en disco y registrado en la base de datos | **APROBADO** |
| **+** | **Prueba de Concurrencia (Multiproceso Real)** | CU-12 | Dos procesos PHP paralelos independientes disparados simultáneamente: P1=201 Created, P2=409 Conflict | **APROBADO** |
| **+** | **Verificación de Seeders e Índice Único en Sandbox** | BD / Seeders | migrate:fresh y doble corrida de DatosDemostracionSeeder: 47 citas sin colisiones ni violaciones | **APROBADO** |

### 4.2 Verificación del Build de Frontend (Vite)
Se ejecutó la compilación de producción validando la compatibilidad con el entorno sensible a mayúsculas y minúsculas de Linux (Vercel):

```bash
> npm --prefix frontend run build

vite v8.3.4 building client environment for production...
transforming...
✓ 138 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                             0.82 kB │ gzip:   0.46 kB
dist/assets/qr_pago_reserva-S708yZZa.svg   10.67 kB │ gzip:   1.39 kB
dist/assets/index-DAU8PDD3.css             11.55 kB │ gzip:   2.97 kB
dist/assets/index-17QGaWU6.js             929.37 kB │ gzip: 211.10 kB
✓ built in 738ms
```

---

## 5. Decisiones Técnicas Autónomas Adoptadas

1. **Doble Blindaje de Concurrencia (Bloqueo Pesimista + Índice Único Parcial):**
   Para garantizar cero sobreventa (*double-booking*) tanto en la capa de aplicación como en la capa física de persistencia, se integró `lockForUpdate()` con el índice único parcial PostgreSQL `uq_citas_turno_activo` (`2026_11_07_000001_add_partial_unique_index_to_citas_table.php`).

2. **Modelo Centralizado `Cita.php`:**
   Se introdujo `App\Models\Cita` para encapsular la definición de turnos ocupantes y la consulta de solapamiento (`querySolapamiento`). Esto previene discrepancias entre los servicios de disponibilidad (`CU10`), agendamiento (`CU12`) y suspensión (`CU11`).

3. **Arquitectura Anti-IDOR en Dos Capas (Controlador y Servicio):**
   Se blindaron todos los recursos de pacientes, citas y atenciones clínicas validando que el identificador del usuario coincida con el registro solicitado. El controlador detiene de forma preventiva intentos maliciosos arrojando HTTP 403, y el servicio aplica aislamiento pesimista en caso de invocaciones internas.

4. **Soporte Híbrido de Sesión y Autenticación:**
   Para cumplir con el requerimiento de `SESSION_DRIVER=cookie` y mantener compatibilidad con clientes que utilicen Bearer token vía cabecera `Authorization`, se ajustó `ManejadorSesion` para reconocer indistintamente ambos métodos de autenticación, adjuntando la cookie `token_clinica` con directivas seguras (`SameSite=None`, `Secure`).

5. **Anclaje de Zona Horaria a Bolivia (`America/La_Paz`):**
   Se configuró la zona horaria en la conexión de base de datos y en los servicios con dependencias de tiempo (`Carbon::now('America/La_Paz')`), evitando que la diferencia horaria de los servidores cloud en UTC afecte el cómputo de cancelaciones, turnos del día y métricas del Dashboard.

---
**Conclusión:** El sistema se encuentra auditado en su totalidad, con todas las fallas críticas, altas y medias resueltas, el 100% de los casos de prueba superados y la compilación de frontend lista para producción.

