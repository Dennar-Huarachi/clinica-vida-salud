# Detalle de Casos de Uso — Paquete: Reportes

**Proyecto:** Sistema Web de Gestión de Citas Médicas — Clínica Vida Salud  
**Tecnologías:** Laravel 13 + React 19 + PostgreSQL 18  
**Paquete:** Reportes (CU-21, CU-22, CU-23, CU-24, CU-25)

---

### CU-21 — Reportes de citas

| Campo | Contenido |
|---|---|
| Caso de Uso | CU-21 Reportes de citas |
| Propósito | Brindar una visión cuantitativa y operativa de las citas médicas agendadas en la clínica según rangos de fecha, especialidades, médicos y estados para la toma de decisiones clínicas y logísticas (RF11). |
| Resumen | Este caso de uso permite al personal directivo y de recepción consultar reportes detallados y consolidados sobre las citas médicas registradas en el sistema. Incorpora filtros combinables por rango cronológico (fecha inicial y final, tomando por defecto el mes en curso si se omiten), especialidad médica, profesional asignado y estado operativo de la cita. Retorna métricas cuantitativas agrupadas (total general, distribución por estado de cita, distribución por especialidad médica y por profesional tratante) junto con una cuadrícula operativa detallada de hasta 300 citas con sus horarios formateados, datos demográficos del paciente, código de historia clínica y estado de pago de garantía (CU-27). |
| Actores | Administrador (consulta gerencial y estratégica), Recepcionista (planificación operativa en ventanilla), y el Sistema (valida coherencia cronológica, ejecuta consultas agregadas y estructura el reporte). |
| Actor iniciador | Administrador o Recepcionista. |
| Flujo del proceso | **Flujo básico (Consulta interactiva del reporte operacional de citas):**<br>1. Actor: Ingresa al módulo de reportes desde el menú del sistema.<br>2. Sistema: Valida que la sesión cuente con un token de autenticación válido y posea el rol de Administrador o Recepcionista.<br>3. Sistema: Despliega la interfaz de reportes con la pestaña de "Citas Médicas" seleccionada por defecto, precargando los selectores de filtro con las especialidades, médicos y estados disponibles, y fijando el rango de fechas al mes actual.<br>4. Actor: Define los criterios de consulta deseados (rango de fechas, médico, especialidad médica o estado específico) y presiona "Consultar Reporte".<br>5. Sistema: Valida que la fecha inicial no sea cronológicamente posterior a la fecha final.<br>6. Sistema: Ejecuta consultas agrupadas en la base de datos combinando las tablas de citas, pacientes, personas, médicos, especialidades, estados de cita y pagos de garantía.<br>7. Sistema: Calcula el total de citas del intervalo, la distribución cuantitativa por estado operativo (pendientes, confirmadas, en espera, atendidas, inasistencias, canceladas), el desglose por especialidad y el desglose por médico.<br>8. Sistema: Recupera el listado detallado de citas y formatea las horas de atención a formato de 5 caracteres (HH:MM).<br>9. Sistema: Renderiza en pantalla las tarjetas con indicadores de resumen, gráficos de barras de distribución y la tabla de registros detallados con soporte responsivo.<br><br>**Flujo alterno A1 (Consulta de intervalo sin citas registradas):**<br>1. Actor: Introduce un rango de fechas en el que no existen citas agendadas.<br>2. Sistema: Procesa la consulta y determina que el total general es cero.<br>3. Sistema: Presenta las tarjetas de resumen en cero y despliega un aviso informativo indicando que no se encontraron citas para los criterios seleccionados. |
| Precondición | - Sesión iniciada con un token de sesión válido (`sesion.clinica`).<br>- Contar con rol de Administrador o Recepcionista (`rol:administrador,recepcionista`). |
| Postcondición | Operación de solo lectura analítica: no se mutan registros en las tablas transaccionales de la base de datos. |
| Excepciones | - Solicitud sin token de sesión válido → "Acceso no autorizado: se requiere un token de sesión válido" → Código HTTP 401.<br>- Token de sesión inválido o expirado → "Sesión inválida o expirada. Por favor vuelva a iniciar sesión." → Código HTTP 401.<br>- Rol de usuario sin privilegios para consultar reportes (ej. médico o paciente) → "Permisos insuficientes para acceder a este caso de uso" → Código HTTP 403.<br>- Rango de fechas con orden cronológico invertido (`fecha_inicio > fecha_fin`) → "El rango cronológico es inválido: la fecha inicial no puede ser posterior a la fecha final." → Código HTTP 422.<br>- Error imprevisto al procesar la agregación en base de datos → "Error al generar el reporte de citas: [detalle]" → Código HTTP 500. |

- **Roles autorizados:** Administrador, Recepcionista.
- **Límite de tasa (Throttle):** No posee límite restrictivo por minuto en su ruta específica; opera bajo la configuración general del enrutador.

**Evidencia:**
- `backend/routes/api.php` (líneas 194–195)
- `backend/app/Http/Controllers/Paquetes/Reportes/CU21_ConsultarReportesCitas/ReportesCitasControlador.php`
- `backend/app/Paquetes/Reportes/CU21_ConsultarReportesCitas/ReportesCitasServicio.php`
- `frontend/src/Paquetes/Reportes/CU21_ConsultarReportesCitas/PaginaReportes.jsx`
- `backend/database/migrations/2026_10_22_000000_create_initial_vida_salud_schema.php` (tablas `citas`, `pacientes`, `personas`, `medicos`, `especialidades`, `estados_cita`, `pagos_cita`)

**Referencias:**
- Requisitos Funcionales: RF11 (Generación de reportes de citas), RF13 (Filtros por fecha, médico, especialidad y estado).
- Reglas de Negocio: RN12 (Control de acceso por roles).

---

### CU-22 — Reporte de asistencia

| Campo | Contenido |
|---|---|
| Caso de Uso | CU-22 Reporte de asistencia |
| Propósito | Medir el cumplimiento de la atención médica, cuantificar las tasas de ausentismo de pacientes y monitorear el crecimiento del padrón clínico para optimizar la capacidad institucional (RF13). |
| Resumen | Este caso de uso permite al Administrador evaluar el comportamiento de asistencia y cumplimiento de las citas agendadas en la clínica. A partir de un intervalo de fechas y filtros opcionales por especialidad o médico, calcula la tasa oficial de efectividad de asistencia ($Efectividad = \frac{Atendidas}{Atendidas + Inasistencias} \times 100\%$), la tasa de ausentismo y la tasa de cancelación respecto al total general. Adicionalmente, reporta el crecimiento demográfico (total de pacientes empadronados y nuevos registros incorporados durante el período analizado) y provee un desglose de efectividad comparativa por cada especialidad médica y por profesional de la salud. |
| Actores | Administrador (evalúa la puntualidad, absentismo y rendimiento del servicio médico), y el Sistema (calcula razones porcentuales, desgloses matriciales y estadísticas de pacientes). |
| Actor iniciador | Administrador. |
| Flujo del proceso | **Flujo básico (Generación de métricas de efectividad y ausentismo):**<br>1. Actor: Ingresa al módulo de reportes y pulsa sobre la pestaña "Cumplimiento y Asistencia".<br>2. Sistema: Valida que la sesión cuente con rol de Administrador.<br>3. Sistema: Establece el rango de fechas al mes en curso por defecto y permite al actor modificar el período o filtrar por médico y especialidad.<br>4. Actor: Presiona el botón "Consultar Cumplimiento".<br>5. Sistema: Valida la consistencia de las fechas (fecha de inicio menor o igual a fecha de fin).<br>6. Sistema: Consulta el universo de citas del intervalo y clasifica las citas atendidas concluidas, las inasistencias registradas y las cancelaciones.<br>7. Sistema: Calcula la tasa de efectividad de asistencia clínica descartando citas aún pendientes de realización.<br>8. Sistema: Consulta en la tabla de pacientes el padrón acumulado total y cuenta los pacientes creados dentro del rango de fechas analizado.<br>9. Sistema: Computa la matriz de efectividad desglosada por cada especialidad médica y por cada médico asignado.<br>10. Sistema: Retorna las métricas y renderiza las tarjetas de porcentaje de efectividad, ausentismo y nuevos pacientes, acompañadas de barras visuales de cumplimiento por área médica.<br><br>**Flujo alterno A1 (Período sin citas concluidas):**<br>1. Actor: Selecciona un rango de fechas que no contiene citas cerradas (ni atendidas ni inasistencias).<br>2. Sistema: Detecta que el denominador de efectividad es cero.<br>3. Sistema: Asigna un 0% matemático controlado a las tasas de efectividad y ausentismo para evitar divisiones por cero, informando que no existen registros suficientes para calcular cumplimiento en dicho período. |
| Precondición | - Sesión iniciada con un token de sesión válido emitido por el sistema.<br>- Rol de Administrador (`rol:administrador`). |
| Postcondición | Operación analítica de solo lectura: no se alteran registros en las tablas de la base de datos. |
| Excepciones | - Solicitud sin token de sesión válido → "Acceso no autorizado: se requiere un token de sesión válido" → Código HTTP 401.<br>- Token de sesión inválido o expirado → "Sesión inválida o expirada. Por favor vuelva a iniciar sesión." → Código HTTP 401.<br>- Usuario con rol no autorizado (médico, recepcionista o paciente) → "Permisos insuficientes para acceder a este caso de uso" → Código HTTP 403.<br>- Incoherencia cronológica de fechas (`fecha_inicio > fecha_fin`) → "El rango cronológico es inválido: la fecha inicial no puede ser posterior a la fecha final." → Código HTTP 422.<br>- Error imprevisto al procesar las estadísticas de asistencia → "Error al generar el reporte de asistencia: [detalle]" → Código HTTP 500. |

- **Roles autorizados:** Administrador.
- **Límite de tasa (Throttle):** No posee límite restrictivo por minuto en su ruta específica; opera bajo la configuración general del enrutador.

**Evidencia:**
- `backend/routes/api.php` (líneas 164, 196)
- `backend/app/Http/Controllers/Paquetes/Reportes/CU22_ConsultarReporteAsistenciaPacientes/ReporteAsistenciaControlador.php`
- `backend/app/Paquetes/Reportes/CU22_ConsultarReporteAsistenciaPacientes/ReporteAsistenciaServicio.php`
- `frontend/src/Paquetes/Reportes/CU21_ConsultarReportesCitas/PaginaReportes.jsx` (pestaña integrada de cumplimiento y asistencia)
- `backend/database/migrations/2026_10_22_000000_create_initial_vida_salud_schema.php` (tablas `citas`, `estados_cita`, `pacientes`, `especialidades`, `medicos`, `personas`)

**Referencias:**
- Requisitos Funcionales: RF13 (Reporte de asistencia y efectividad de consultas).
- Reglas de Negocio: RN12 (Control de acceso basado en roles).

---

### CU-23 — Exportar reportes

| Campo | Contenido |
|---|---|
| Caso de Uso | CU-23 Exportar reportes |
| Propósito | Descargar en archivos tabulares estructurados (formato CSV estándar internacional) los conjuntos de datos de citas y cumplimiento clínico filtrados por el usuario para su uso en hojas de cálculo externas y auditoría física (RF13). |
| Resumen | Este caso de uso permite al Administrador exportar a su equipo local los resultados de los reportes generados en CU-21 (Citas Operativas) y CU-22 (Cumplimiento de Asistencia). El sistema procesa el set de datos según los filtros activos en el servidor y genera un archivo con formato CSV estructurado, delimitado por comas, con escape de comillas dobles y cabecera de codificación UTF-8 con marca de orden de bytes (BOM `\xEF\xBB\xBF`) que asegura compatibilidad nativa con Microsoft Excel sin distorsión de caracteres o tildes. Responde con cabeceras HTTP de descarga binaria de adjunto y registra de forma inmutable el evento de exportación en la bitácora de auditoría (RN21). |
| Actores | Administrador (solicita y descarga el archivo tabular), y el Sistema (ensambla las líneas CSV, añade el BOM UTF-8, expide cabeceras de descarga y registra auditoría). |
| Actor iniciador | Administrador. |
| Flujo del proceso | **Flujo básico (Exportación de reporte operacional de citas a formato CSV):**<br>1. Actor: Desde el módulo de reportes, define los filtros deseados (período de fechas, médico, especialidad o estado) y pulsa el botón "Exportar Citas a CSV".<br>2. Sistema: Valida que la sesión cuente con rol de Administrador.<br>3. Sistema: Envía una petición de descarga al servidor especificando el tipo de reporte y los parámetros activos.<br>4. Sistema: Consulta en la base de datos las citas coincidentes con el filtro.<br>5. Sistema: Inicializa la cadena de salida con la firma BOM UTF-8 para garantizar la compatibilidad con Microsoft Excel y redacta la fila de encabezados: Código Cita, Fecha, Hora Inicio, Hora Fin, Paciente, CI Paciente, Nro Historia, Médico Asignado, Especialidad, Estado Cita, Monto Garantía (Bs) y Estado Pago.<br>6. Sistema: Itera sobre cada registro formateando horas, importes monetarios y escapando los caracteres especiales de texto.<br>7. Sistema: Registra el evento de exportación en la bitácora de auditoría inmutable con la acción EXPORTAR_CSV, detallando el período, número de filas generadas y nombre del archivo.<br>8. Sistema: Retorna la respuesta HTTP con tipo MIME text/csv y cabecera de descarga de archivo con nombre dinámico `reporte_citas_YYYYMMDD_HHMMSS.csv`.<br>9. Sistema: El navegador del cliente procesa la respuesta e inicia la descarga inmediata del archivo en el dispositivo del actor.<br><br>**Flujo alterno A1 (Exportación de reporte de asistencia y efectividad a formato CSV):**<br>1. Actor: Desde la pestaña de asistencia, pulsa el botón "Exportar Cumplimiento a CSV".<br>2. Sistema: Valida la sesión de Administrador y procesa la solicitud con el parámetro correspondiente a asistencia.<br>3. Sistema: Genera el archivo CSV con BOM UTF-8 conteniendo los encabezados: Especialidad Médica, Total Citas Agendadas, Citas Atendidas Concluidas, Inasistencias Registradas, Citas Canceladas, Tasa de Efectividad (%) y Tasa de Ausentismo (%).<br>4. Sistema: Audita el evento con la acción EXPORTAR_ASISTENCIA_CSV.<br>5. Sistema: Despacha la descarga del archivo con la nomenclatura `reporte_asistencia_YYYYMMDD_HHMMSS.csv`. |
| Precondición | - Sesión iniciada con un token de sesión válido emitido por el sistema.<br>- Rol de Administrador (`rol:administrador`). |
| Postcondición | Se emite un flujo de descarga de archivo tabular CSV al navegador del cliente; queda registrado un evento de auditoría en la tabla `bitacora_auditoria` con las acciones "EXPORTAR_CSV" o "EXPORTAR_ASISTENCIA_CSV", detallando el total de filas, el período filtrado y el usuario solicitante. |
| Excepciones | - Solicitud sin token de sesión válido → "Acceso no autorizado: se requiere un token de sesión válido" → Código HTTP 401.<br>- Token de sesión inválido o expirado → "Sesión inválida o expirada. Por favor vuelva a iniciar sesión." → Código HTTP 401.<br>- Usuario con rol no autorizado (distinto a Administrador) → "Permisos insuficientes para acceder a este caso de uso" → Código HTTP 403.<br>- Rango de fechas inconsistente en los parámetros de la solicitud → "El rango cronológico es inválido: la fecha inicial no puede ser posterior a la fecha final." → Código HTTP 422.<br>- Fallo imprevisto en la generación del archivo tabular en el servidor → Error HTTP 500. |

- **Roles autorizados:** Administrador.
- **Límite de tasa (Throttle):** No posee límite restrictivo por minuto en su ruta de exportación; opera bajo la configuración general del enrutador.

**Evidencia:**
- `backend/routes/api.php` (líneas 164, 197)
- `backend/app/Http/Controllers/Paquetes/Reportes/CU23_ExportarReportes/ExportarReportesControlador.php`
- `backend/app/Paquetes/Reportes/CU23_ExportarReportes/ExportarReportesServicio.php`
- `frontend/src/Paquetes/Reportes/CU21_ConsultarReportesCitas/PaginaReportes.jsx` (botones integrados de descarga CSV)
- `backend/database/migrations/2026_10_22_000000_create_initial_vida_salud_schema.php` (tablas `citas`, `bitacora_auditoria`)

**Referencias:**
- Requisitos Funcionales: RF13 (Exportación de datos de reportes operacionales y asistenciales).
- Reglas de Negocio: RN12 (Control de acceso basado en roles), RN21 (Trazabilidad y registro de exportaciones en bitácora).

---

### CU-24 — Bitácora de auditoría

| Campo | Contenido |
|---|---|
| Caso de Uso | CU-24 Bitácora de auditoría |
| Propósito | Brindar trazabilidad integral, forense e inmutable sobre todas las operaciones sensibles ejecutadas en el sistema (inicios de sesión, cambios de credenciales, modificaciones de citas, suspensiones de turnos y respaldos) para garantizar la seguridad de la información clínica (RN21). |
| Resumen | Este caso de uso permite de forma exclusiva al Administrador consultar el registro histórico inmutable de eventos de auditoría del sistema (RN21). Recupera los registros ordenados cronológicamente descendente, detallando para cada evento el identificador correlativo, el caso de uso ejecutor, la acción efectuada, la tabla afectada, el identificador del registro manipulado, los datos anteriores y datos nuevos (deserializados automáticamente desde su estructura JSON), la dirección IP de origen, el agente de usuario del navegador y la fecha y hora exacta del suceso. Provee potentes filtros de búsqueda combinables por caso de uso, acción, nombre o correo de usuario, tabla afectada, fecha puntual o intervalo de fechas, permitiendo inspeccionar a detalle las diferencias de estado antes y después de cada cambio operativo. |
| Actores | Administrador (consulta, monitorea e investiga eventos del sistema con fines de control y seguridad), y el Sistema (recupera registros inmutables, decodifica objetos JSON y resuelve nombres de usuarios y roles). |
| Actor iniciador | Administrador. |
| Flujo del proceso | **Flujo básico (Consulta y filtrado de la bitácora de auditoría):**<br>1. Actor: Ingresa al módulo de "Auditoría" desde el menú administrativo de la aplicación.<br>2. Sistema: Valida que la sesión cuente con un token de autenticación válido y posea el rol de Administrador.<br>3. Sistema: Si la tabla de bitácora estuviese vacía, asegura de manera preventiva la inserción de registros iniciales o de demostración del sistema.<br>4. Sistema: Consulta en la base de datos la tabla de bitácora vinculando a los usuarios, personas y roles asociados, ordenando los resultados de forma estrictamente descendente por fecha y hora (`fecha_hora DESC`).<br>5. Sistema: Deserializa los datos anteriores y datos nuevos de formato JSON a estructuras legibles de objetos.<br>6. Sistema: Presenta la interfaz visual con tarjetas métricas de eventos, un formulario de filtros avanzados (por caso de uso, acción, usuario, tabla afectada y fechas) y la tabla paginada de registros.<br>7. Actor: Aplica un filtro específico (por ejemplo, escribe el nombre de un usuario o selecciona una acción como "CANCELAR_CITA") y presiona filtrar.<br>8. Sistema: Ejecuta la consulta filtrada insensible a mayúsculas/minúsculas y actualiza el listado en tiempo real.<br>9. Actor: Pulsa sobre el botón para inspeccionar el detalle o payload de un evento.<br>10. Sistema: Despliega una ventana modal con el visor interactivo de datos JSON, mostrando en paralelo los valores antes de la mutación y los valores nuevos resultantes.<br><br>**Flujo alterno A1 (Intento de acceso por usuario no administrador):**<br>1. Actor: Un usuario con rol de Médico, Recepcionista o Paciente intenta acceder a la ruta de auditoría.<br>2. Sistema: Intercepta la petición y valida que el rol no es Administrador.<br>3. Sistema: Bloquea inmediatamente la solicitud devolviendo error de acceso denegado (código 403) y redirige al usuario a su portal correspondiente. |
| Precondición | - Sesión activa con un token válido emitido por el sistema (`sesion.clinica`).<br>- Contar estrictamente con el rol de Administrador (`rol:administrador`). |
| Postcondición | Operación de solo lectura: los registros de la tabla `bitacora_auditoria` son estrictamente inmutables; la base de datos prohíbe operaciones de modificación (`UPDATE`) o eliminación física (`DELETE`) sobre estos registros. |
| Excepciones | - Solicitud sin token de sesión válido → "Acceso no autorizado: se requiere un token de sesión válido" → Código HTTP 401.<br>- Token de sesión inválido o expirado → "Sesión inválida o expirada. Por favor vuelva a iniciar sesión." → Código HTTP 401.<br>- Atributo de sesión ausente en el controlador → "Sesión no identificada." → Código HTTP 401.<br>- Usuario con rol no autorizado intentando acceder a la bitácora → "Acceso denegado: solo el administrador puede consultar la bitácora de auditoría." → Código HTTP 403.<br>- Middleware de verificación de rol bloqueando al usuario → "Permisos insuficientes para acceder a este caso de uso" → Código HTTP 403.<br>- Error imprevisto al consultar la base de datos → "Error al consultar bitácora de auditoría: [detalle]" → Código HTTP 500. |

- **Roles autorizados:** Administrador (acceso exclusivo).
- **Límite de tasa (Throttle):** No posee límite restrictivo por minuto en su ruta específica; opera bajo la configuración general del enrutador.

**Evidencia:**
- `backend/routes/api.php` (líneas 164, 200–201)
- `backend/app/Http/Controllers/Paquetes/Reportes/CU24_ConsultarBitacoraAuditoria/ConsultarBitacoraControlador.php`
- `backend/app/Paquetes/Reportes/CU24_ConsultarBitacoraAuditoria/ConsultarBitacoraServicio.php`
- `frontend/src/Paquetes/Reportes/CU24_ConsultarBitacoraAuditoria/PaginaAuditoria.jsx`
- `frontend/src/Paquetes/Reportes/CU24_ConsultarBitacoraAuditoria/PaginaBitacora.jsx` (archivo de redirección al componente principal)
- `backend/database/migrations/2026_10_22_000000_create_initial_vida_salud_schema.php` (tabla `bitacora_auditoria`, `usuarios`, `roles`, `personas`)

**Referencias:**
- Requisitos Funcionales: RF20 (Módulo de bitácora de auditoría forense del sistema).
- Reglas de Negocio: RN12 (Control de acceso basado en roles), RN16 (Auditoría de correcciones clínicas), RN21 (Registro inmutable de bitácora de auditoría).

---

### CU-25 — Dashboard administrativo

| Campo | Contenido |
|---|---|
| Caso de Uso | CU-25 Dashboard administrativo |
| Propósito | Centralizar en un panel interactivo y ejecutivo los principales indicadores clave de rendimiento (KPIs) operacionales, de efectividad asistencial, financieros y de seguridad para la gestión estratégica de la clínica (RF13). |
| Resumen | Este caso de uso proporciona al Administrador una vista ejecutiva integral en tiempo real del estado operativo, clínico y financiero de la institución. Consolida y expone indicadores clave (KPIs) que incluyen: conteo de pacientes, médicos y especialidades activos; nuevos pacientes del mes; citas programadas para el día de hoy desglosadas por estado (atendidas, pendientes, canceladas); citas de la semana y del mes; tasas oficiales de efectividad de asistencia y ausentismo; métricas financieras de depósitos de garantía de cita (CU-27: fondos recaudados, penalizaciones retenidas y reembolsos emitidos); distribución porcentual de citas por especialidad médica; el listado de las últimas 7 citas registradas; y una línea de tiempo con los últimos 5 eventos inmutables de la bitácora de auditoría (RN21). |
| Actores | Administrador (revisa la salud operativa, financiera y clínica de la institución), y el Sistema (consolida indicadores desde múltiples tablas, ejecuta agregaciones en tiempo real y calcula razones porcentuales). |
| Actor iniciador | Administrador. |
| Flujo del proceso | **Flujo básico (Carga y visualización del panel ejecutivo de control):**<br>1. Actor: Ingresa al módulo de Dashboard general (`/dashboard` o `/admin/dashboard`) al iniciar su sesión administrativa.<br>2. Sistema: Valida que la sesión cuente con un token activo y posea el rol de Administrador.<br>3. Sistema: Realiza consultas agregadas en tiempo real para determinar el número de pacientes empadronados, médicos activos y especialidades habilitadas.<br>4. Sistema: Cuantifica las citas del día actual y las clasifica según su estado (concluidas, pendientes de atención o canceladas), así como las citas acumuladas en la semana y el mes en curso.<br>5. Sistema: Computa la tasa mensual de efectividad de asistencia clínica y la tasa de ausentismo.<br>6. Sistema: Consulta en la tabla de pagos de garantía los importes consolidados por depósitos completados, retenciones por penalidad de inasistencia/cancelación tardía y reembolsos emitidos a pacientes.<br>7. Sistema: Determina el top de las 5 especialidades médicas más demandadas en el mes con su porcentaje de participación sobre el total.<br>8. Sistema: Recupera las últimas 7 citas agendadas con sus códigos, pacientes, médicos y estados.<br>9. Sistema: Recupera los últimos 5 eventos registrados en la bitácora de auditoría detallando usuario, acción y tabla afectada.<br>10. Sistema: Renderiza la pantalla ejecutiva con paneles numéricos destacados, gráficos interactivos de distribución, tabla de citas recientes y feed cronológico de auditoría con actualización reactiva. |
| Precondición | - Sesión iniciada con un token de sesión válido emitido por el sistema (`sesion.clinica`).<br>- Contar con el rol de Administrador (`rol:administrador`). |
| Postcondición | Operación de consolidación analítica de solo lectura: no se crean ni modifican registros transaccionales en la base de datos. |
| Excepciones | - Solicitud sin token de sesión válido → "Acceso no autorizado: se requiere un token de sesión válido" → Código HTTP 401.<br>- Token de sesión inválido o expirado → "Sesión inválida o expirada. Por favor vuelva a iniciar sesión." → Código HTTP 401.<br>- Rol de usuario sin privilegios administrativos (médico, recepcionista o paciente) → "Permisos insuficientes para acceder a este caso de uso" → Código HTTP 403.<br>- Error imprevisto al consolidar las métricas de base de datos → "Error al consolidar indicadores del dashboard: [detalle]" → Código HTTP 500. |

- **Roles autorizados:** Administrador (acceso exclusivo).
- **Límite de tasa (Throttle):** No posee límite restrictivo por minuto en sus rutas específicas; opera bajo la configuración general del enrutador.

**Evidencia:**
- `backend/routes/api.php` (líneas 164, 204–205)
- `backend/app/Http/Controllers/Paquetes/Reportes/CU25_VisualizarDashboardAdministrativo/DashboardAdministrativoControlador.php`
- `backend/app/Paquetes/Reportes/CU25_VisualizarDashboardAdministrativo/DashboardAdministrativoServicio.php`
- `frontend/src/Paquetes/Reportes/CU25_VisualizarDashboardAdministrativo/PaginaDashboard.jsx`
- `backend/database/migrations/2026_10_22_000000_create_initial_vida_salud_schema.php` (tablas `citas`, `pacientes`, `medicos`, `especialidades`, `estados_cita`, `pagos_cita`, `bitacora_auditoria`)

**Referencias:**
- Requisitos Funcionales: RF13 (Panel y reportes de gestión institucional).
- Reglas de Negocio: RN12 (Control de acceso basado en roles), RN21 (Visualización de eventos recientes de auditoría).

---

### Verificaciones Específicas Respondidas

#### 1. CU-23: Formatos reales de exportación (el catálogo dice CSV/PDF)
- **Qué dice el catálogo/documentación:** En `casos-de-uso-citas-medicas-vida-salud-v3.md` (título de CU-23) se anunciaba "Exportar reportes (CSV/PDF)".
- **Qué hace el código real:**
  - El único formato de exportación implementado en el sistema es **CSV** (delimitado por comas, con textos entrecomillados y encabezado con marca de orden de bytes BOM UTF-8 `\xEF\xBB\xBF` para apertura limpia en hojas de cálculo).
  - En el backend (`ExportarReportesControlador.php` y `ExportarReportesServicio.php`), solo existen los métodos `exportarCitasCSV()` y `exportarAsistenciaCSV()`. La respuesta HTTP retorna `Content-Type: text/csv; charset=UTF-8` y `Content-Disposition: attachment; filename="reporte_..."`.
  - En el frontend (`PaginaReportes.jsx`, líneas 72–118 y 167–184), existen únicamente los botones *"Exportar Citas a CSV"* y *"Exportar Cumplimiento a CSV"*, los cuales descargan el archivo CSV como un objeto Blob de tipo `text/csv`.
  - **No existe generación ni descarga de archivos en formato PDF** (no se utiliza ninguna librería como Dompdf o Snappy ni existen endpoints con salida PDF en el código).

#### 2. CU-24 y CU-25: Filtros y datos que realmente devuelve cada uno
- **CU-24 (Consultar bitácora de auditoría):**
  - **Filtros aceptados por el backend:**
    1. `caso_uso`: filtro parcial insensible a mayúsculas/minúsculas (`ilike`) sobre el código o nombre del caso de uso (ej. `CU01`, `CU12`).
    2. `accion` (o alias `evento`): filtro parcial (`ilike`) sobre la acción ejecutada (ej. `LOGIN_EXITOSO`, `CANCELAR_CITA`).
    3. `usuario`: filtro parcial (`ilike`) sobre el nombre de usuario, correo de cuenta, correo de persona, nombres, apellidos o rol.
    4. `tabla_afectada`: filtro parcial (`ilike`) sobre el nombre físico de la tabla (ej. `citas`, `usuarios`, `personas`).
    5. `fecha`: búsqueda exacta para un día completo (desde las 00:00:00 hasta las 23:59:59 en zona horaria local).
    6. `fecha_inicio` y `fecha_fin`: rango cronológico de fechas.
    7. `limite`: cantidad máxima de registros a retornar (con acotación de seguridad entre un mínimo de 10 y un máximo de 500 registros, por defecto 150).
  - **Datos devueltos:**
    - Array de objetos donde cada uno contiene: `id_bitacora`, `id_usuario`, `caso_uso`, `accion`, `tabla_afectada`, `registro_id`, `datos_anteriores` (objeto/array JSON decodificado), `datos_nuevos` (objeto/array JSON decodificado), `ip_origen`, `user_agent`, `fecha_hora`, `nombre_usuario`, `usuario_rol` y `usuario_nombre_completo`.

- **CU-25 (Visualizar dashboard administrativo):**
  - **Filtros aceptados por el backend:** Ninguno. La ruta `GET /reportes/dashboard` (y su alias `GET /dashboard/metricas`) consolida y computa los indicadores en tiempo real de forma automática para el día, la semana y el mes en curso.
  - **Datos devueltos:**
    - `fecha_actual`: fecha de hoy en formato `YYYY-MM-DD`.
    - `periodo_mes`: objeto con fecha de inicio y fin del mes actual (`inicio`, `fin`).
    - `kpis`:
      - Padrón: `total_pacientes` (activos), `pacientes_nuevos_mes`, `total_medicos` (activos), `total_especialidades` (activas).
      - Citas de hoy: `citas_hoy`, `citas_atendidas_hoy`, `citas_pendientes_hoy` (programadas, confirmadas, en espera), `citas_canceladas_hoy`.
      - Citas de períodos: `citas_semana` (activas sin canceladas), `citas_mes` (total general).
      - Rendimiento asistencial: `tasa_efectividad_asistencia` ($Atendidas / (Atendidas + Inasistencias) \times 100$), `tasa_ausentismo`.
      - Financieros de garantía (CU-27): `ingresos_garantia` (completados), `penalizaciones_retenidas` (retenidos por inasistencia/cancelación tardía), `reembolsos_emitidos` (devueltos).
    - `estados_mes`: array con el conteo de citas agrupadas por cada estado (`estado_codigo`, `estado_nombre`, `total`).
    - `por_especialidad`: array con el top 5 de especialidades más demandadas en el mes con su cantidad de citas y su porcentaje relativo sobre el total.
    - `ultimas_citas`: array con las últimas 7 citas registradas en el sistema (código, fecha, hora, paciente, expediente, médico, especialidad y estado).
    - `ultimos_eventos_auditoria`: array con los últimos 5 eventos inmutables registrados en la bitácora (id, caso de uso, acción, tabla, fecha/hora y usuario responsable).

#### 3. Todos los casos de paciente o médico: cómo se impide ver o alterar datos de otra persona (Mecanismo Anti-IDOR / RN19)
- **En el paquete Reportes (CU-21 a CU-25):**
  - Ninguno de los endpoints de este paquete permite el acceso a pacientes ni médicos regulares.
  - Todas las rutas (`/reportes/citas`, `/reportes/asistencia`, `/reportes/exportar`, `/auditoria/bitacora`, `/dashboard/metricas`) están protegidas a nivel de middleware en `backend/routes/api.php` bajo los grupos `rol:administrador` y `sesion.clinica`.
  - Si un usuario con rol de `paciente` o `medico` intenta invocar directamente cualquiera de estas rutas, el middleware `App\Nucleo\Permisos\MiddlewareVerificarRol` intercepta la petición antes de que llegue a los controladores y responde de inmediato con `HTTP 403` (*"Permisos insuficientes para acceder a este caso de uso"*).
  - Asimismo, en `ConsultarBitacoraControlador::index`, existe una verificación redundante en el propio controlador que comprueba `if (strtolower($usuario->rol ?? '') !== 'administrador')` y retorna `HTTP 403` (*"Acceso denegado: solo el administrador puede consultar la bitácora de auditoría."*).
  - De esta manera, se garantiza el aislamiento estricto y la confidencialidad absoluta de la información clínica y operativa, impidiendo que usuarios sin privilegios administrativos supervisen métricas globales o eventos forenses de otros pacientes o profesionales.

---

### Discrepancias entre Documentación y Código Real

1. **CU-23 — Formatos reales de exportación (CSV vs PDF):**
   - **Qué dice la documentación:** En el catálogo de casos de uso `casos-de-uso-citas-medicas-vida-salud-v3.md` (sección CU-23) se titulaba el caso como "Exportar reportes (CSV/PDF)".
   - **Qué hace el código:** El código real implementa **únicamente la exportación en formato CSV** estructurado con BOM UTF-8 (`\xEF\xBB\xBF`). No existe ningún generador de documentos PDF ni endpoints asociados a dicho formato ni en backend ni en frontend.
   - **Archivo:** `backend/app/Http/Controllers/Paquetes/Reportes/CU23_ExportarReportes/ExportarReportesControlador.php` y `backend/app/Paquetes/Reportes/CU23_ExportarReportes/ExportarReportesServicio.php`.

2. **CU-21 — Enrutamiento y exclusión involuntaria de Recepcionista en backend:**
   - **Qué dice la documentación:** En la especificación funcional de CU-21 y en el enrutamiento frontend (`App.jsx`, línea 203 `/recepcion/reportes`), se establece que la Recepcionista puede consultar los reportes operacionales de citas.
   - **Qué hace el código:** En `backend/routes/api.php` (línea 164), la ruta `GET /reportes/citas` está anidada dentro del grupo `Route::middleware(['rol:administrador'])->group(...)`. Dado que el middleware exterior evalúa `rol:administrador`, las peticiones originadas por un usuario con rol `recepcionista` son interceptadas y rechazadas con `HTTP 403` por el middleware de rol padre antes de alcanzar la ruta hija, restringiendo operativamente la API únicamente al Administrador.
   - **Archivo:** `backend/routes/api.php` (líneas 164 y 195).

3. **CU-24 — Componente oficial de frontend (`PaginaAuditoria.jsx` vs `PaginaBitacora.jsx`):**
   - **Qué dice la documentación:** En `casos-de-uso-citas-medicas-vida-salud-v3.md` y `estructura-proyecto.md` se referenciaba `PaginaBitacora.jsx`.
   - **Qué hace el código:** El componente integral con visor interactivo de JSON y filtros dinámicos es `PaginaAuditoria.jsx` (24 KB). El archivo `PaginaBitacora.jsx` es un archivo puente de 85 bytes que reexporta dicho componente.
   - **Archivo:** `frontend/src/Paquetes/Reportes/CU24_ConsultarBitacoraAuditoria/PaginaAuditoria.jsx`.

4. **CU-25 — Integración de KPIs financieros de garantía (CU-27):**
   - **Qué dice la documentación:** En la descripción preliminar del dashboard solo se mencionaban indicadores cuantitativos de citas y padrón.
   - **Qué hace el código:** `DashboardAdministrativoServicio` incorpora métricas financieras reales conectadas con la tabla `pagos_cita` (CU-27): total de fondos recaudados por reservas (`completado`), retenciones por penalidad de inasistencia (`retenido`) y fondos reembolsados por cancelación anticipada (`reembolsado`).
   - **Archivo:** `backend/app/Paquetes/Reportes/CU25_VisualizarDashboardAdministrativo/DashboardAdministrativoServicio.php`.

5. **CU-22 y CU-23 — Frontend consolidado en una sola vista:**
   - **Qué dice la documentación:** En `estructura-proyecto.md` se detallaban carpetas independientes para `CU22_ConsultarReporteAsistenciaPacientes` y `CU23_ExportarReportes`.
   - **Qué hace el código:** Ambas carpetas en el frontend contienen únicamente un archivo `.gitkeep`, dado que todas las vistas y acciones de CU-21, CU-22 y CU-23 están completamente unificadas en la página `frontend/src/Paquetes/Reportes/CU21_ConsultarReportesCitas/PaginaReportes.jsx`.
   - **Archivo:** `frontend/src/Paquetes/Reportes/CU21_ConsultarReportesCitas/PaginaReportes.jsx`.

---

### Campos con valor "NO ENCONTRADO"

**Ninguno.** Todos los campos solicitados para los casos de uso CU-21, CU-22, CU-23, CU-24 y CU-25 fueron localizados, contrastados y verificados exhaustivamente en el código fuente del proyecto.
