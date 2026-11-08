# Detalle de Casos de Uso — Paquete: HistoriaClinica

**Proyecto:** Sistema Web de Gestión de Citas Médicas — Clínica Vida Salud  
**Tecnologías:** Laravel 13 + React 19 + PostgreSQL 18  
**Paquete:** HistoriaClinica (CU-17, CU-18, CU-19, CU-20)

---

### CU-17 — Mis pacientes (kardex digital)

| Campo | Contenido |
|---|---|
| Caso de Uso | CU-17 Mis pacientes (kardex digital) |
| Propósito | Proporcionar al profesional médico un catálogo consolidado y en tiempo real de los pacientes que cuentan con citas en su agenda, permitiendo el acceso rápido a sus antecedentes y el seguimiento de sus consultas clínicas (RF18). |
| Resumen | Este caso de uso permite al Médico consultar el padrón de pacientes asignados a sus turnos de atención clínica (Kardex Digital). Aplica de manera rigurosa la regla de negocio RN19 (Anti-IDOR), deduciendo el identificador del médico exclusivamente desde el token criptográfico de la sesión en el servidor e ignorando cualquier parámetro externo. Consolida por paciente la información demográfica, canales de contacto directo, grupo sanguíneo, alergias, patologías crónicas, total de consultas realizadas, cantidad de citas atendidas y fecha de la última atención recibida, excluyendo las citas canceladas. Incluye un buscador predictivo que filtra por nombres, apellidos, cédula de identidad, teléfono o código de historia clínica, y ofrece acceso directo al expediente clínico integral (CU-20). |
| Actores | Médico (actor principal que monitorea su padrón de pacientes), Administrador (supervisión global o por profesional médico), y el Sistema (verifica el token de sesión, aísla los pacientes por profesional asignado y consolida métricas). |
| Actor iniciador | Médico (durante su jornada laboral de consulta externa) o Administrador. |
| Flujo del proceso | **Flujo básico (Consulta del kardex de pacientes asignados):**<br>1. Actor: Ingresa al módulo "Mis Pacientes" desde el menú lateral del sistema.<br>2. Sistema: Valida que la sesión cuente con un token activo y posea el rol de Médico o Administrador.<br>3. Sistema: Si el usuario es Médico, extrae su identificador profesional directamente del token de sesión verificado (Anti-IDOR / RN19); si es Administrador, permite consultar el universo completo o filtrar opcionalmente por un médico específico.<br>4. Sistema: Consulta en la base de datos a los pacientes vinculados a las citas agendadas con dicho profesional, excluyendo de forma estricta las citas canceladas.<br>5. Sistema: Agrupa y calcula para cada paciente el total histórico de consultas agendadas, la cantidad de atenciones efectivamente concluidas, la última fecha de atención y la edad cronológica calculada a partir de su fecha de nacimiento.<br>6. Sistema: Presenta el kardex en una tabla responsiva mostrando código de expediente, nombre completo, contacto directo, métricas de consultas y fecha de última atención.<br>7. Sistema: Al interactuar con el buscador o escribir un término, filtra de forma instantánea el listado por cédula, nombres, apellidos o expediente.<br>8. Actor: Selecciona un paciente y pulsa el botón "Ver Expediente" / "Historia Clínica".<br>9. Sistema: Redirige al profesional hacia el expediente clínico integral del paciente seleccionado (CU-20).<br><br>**Flujo alterno A1 (Médico sin pacientes agendados):**<br>1. Actor: Ingresa al módulo de kardex.<br>2. Sistema: Ejecuta la consulta y detecta que no existen citas activas asociadas al profesional.<br>3. Sistema: Despliega una vista con estado amigable indicando que aún no cuenta con pacientes asignados en su agenda de citas. |
| Precondición | - Sesión activa con un token válido emitido por el sistema.<br>- Contar con el rol de Médico o Administrador (`rol:administrador,medico`).<br>- Para el médico, contar con una ficha profesional activa en el catálogo de médicos vinculada a su cuenta de usuario. |
| Postcondición | Operación de solo lectura: no se crean, modifican ni eliminan registros en la base de datos; la bitácora no genera eventos transaccionales al ser una consulta de monitoreo clínico. |
| Excepciones | - Solicitud sin token de sesión válido → "Acceso no autorizado: se requiere un token de sesión válido" → Código HTTP 401.<br>- Token de sesión inválido o expirado → "Sesión inválida o expirada. Por favor vuelva a iniciar sesión." → Código HTTP 401.<br>- Atributo de sesión no identificado en el controlador → "Sesión no identificada." → Código HTTP 401.<br>- Rol de usuario no autorizado (ej. recepcionista o paciente) → "Permisos insuficientes para acceder a este caso de uso" → Código HTTP 403.<br>- Usuario con rol médico sin ficha médica profesional asociada → "No se encontró una ficha médica activa asociada a este usuario." → Código HTTP 403.<br>- Error imprevisto al consultar la base de datos → Mensaje de error general de la API → Código HTTP 500. |

- **Roles autorizados:** Médico, Administrador.
- **Límite de tasa (Throttle):** No posee un límite restrictivo por minuto en su ruta específica; opera bajo la configuración general del enrutador.

**Evidencia:**
- `backend/routes/api.php` (líneas 150–152)
- `backend/app/Http/Controllers/Paquetes/HistoriaClinica/CU17_ConsultarMisPacientes/ConsultarMisPacientesControlador.php`
- `backend/app/Paquetes/HistoriaClinica/CU17_ConsultarMisPacientes/ConsultarMisPacientesServicio.php`
- `frontend/src/Paquetes/HistoriaClinica/CU17_ConsultarMisPacientes/PaginaKardexPacientes.jsx`
- `frontend/src/comun/componentes/TablaExpandible.jsx`
- `backend/database/migrations/2026_10_22_000000_create_initial_vida_salud_schema.php` (tablas `pacientes`, `personas`, `citas`, `medicos`, `informacion_medica_paciente`)

**Referencias:**
- Requisitos Funcionales: RF18 (Kardex digital de pacientes asignados).
- Reglas de Negocio: RN12 (Control de acceso basado en roles), RN19 (Aislamiento de información clínica y prevención Anti-IDOR forzando identidad en el servidor).

---

### CU-18 — Atención clínica

| Campo | Contenido |
|---|---|
| Caso de Uso | CU-18 Atención clínica |
| Propósito | Registrar la evolución médica, diagnóstico, examen físico, indicaciones terapéuticas y prescripción de una consulta, actualizando de forma atómica e inmediata el estado de la cita médica a atendida (RF18, RN16). |
| Resumen | Este caso de uso permite al Médico asentar formalmente el resultado de la consulta clínica efectuada a un paciente. Mediante una transacción de base de datos atómica protegida con bloqueo pesimista en el servidor, registra el motivo de consulta, examen físico, diagnósticos (con soporte predictivo CIE-10), indicaciones de tratamiento y receta médica. Dentro de la misma transacción indivisible, actualiza de inmediato el estado de la cita asociada al estado "atendida", previniendo duplicidades de registro para una misma cita médica. Aplica la regla RN19 verificando que la cita corresponda estrictamente a la agenda del médico autenticado y audita la acción clínica en la bitácora inmutable (RN21). |
| Actores | Médico (actor principal que registra la consulta y emite diagnósticos/recetas), Paciente (titular de la atención clínica y receptor del tratamiento), y el Sistema (aplica bloqueo concurrente, valida pertinencia de agenda, actualiza estado de la cita y registra bitácora). |
| Actor iniciador | Médico (al concluir la entrevista y evaluación médica en consultorio). |
| Flujo del proceso | **Flujo básico (Registro de atención médica y conclusión de cita):**<br>1. Actor: Accede al formulario de atención clínica desde su agenda diaria de citas (CU-14) o desde el expediente del paciente.<br>2. Sistema: Valida que la sesión cuente con rol de Médico o Administrador y precarga en pantalla el contexto de la cita (nombre del paciente, cédula, horario, especialidad y motivo de consulta inicial).<br>3. Actor: Completa el motivo de atención, redacta los hallazgos del examen físico, selecciona o introduce el diagnóstico clínico (pudiendo hacer clic sobre sugerencias frecuentes basadas en estándares internacionales CIE-10), redacta el plan de tratamiento e indicaciones generales, y formula la receta médica de fármacos prescritos.<br>4. Actor: Presiona el botón "Guardar Atención Médica".<br>5. Sistema: Sanitiza el texto libre contra inyecciones de código malicioso y valida que el identificador de cita, motivo, diagnóstico y tratamiento estén presentes.<br>6. Sistema: Inicia una transacción atómica de base de datos y ejecuta un bloqueo pesimista sobre la cita médica para evitar escrituras concurrentes.<br>7. Sistema: Verifica que la cita pertenezca a la agenda del médico autenticado (Anti-IDOR / RN19) y comprueba que no exista una atención médica previa registrada para dicha cita.<br>8. Sistema: Inserta el registro clínico en la tabla de atenciones médicas con fecha y hora exacta del sistema.<br>9. Sistema: Actualiza de forma automática e inmediata el estado de la cita al código "atendida" dentro de la misma transacción indivisible.<br>10. Sistema: Registra el evento en la bitácora de auditoría inmutable con la acción REGISTRAR_ATENCION_CLINICA, asociando el identificador del médico operador, de la cita y el nuevo estado alcanzado.<br>11. Sistema: Confirma el guardado exitoso y redirige al médico a su agenda de trabajo.<br><br>**Flujo alterno A1 (Consulta de detalle de una atención previa vinculada a una cita):**<br>1. Actor: Solicita consultar la atención médica asociada a una cita específica.<br>2. Sistema: Valida la sesión activa y localiza la atención en la base de datos.<br>3. Sistema: Aplica control de acceso Anti-IDOR (RN19): si el actor es Paciente comprueba que la atención corresponda a su propio expediente; si es Médico comprueba que haya sido atendida por él; el Administrador tiene visibilidad plena.<br>4. Sistema: Retorna el detalle completo de la atención (motivo, examen físico, diagnóstico, tratamiento, receta médica, fecha/hora y datos del médico interviniente). |
| Precondición | - Sesión iniciada con un token de sesión válido.<br>- Rol de Médico o Administrador (`rol:administrador,medico`).<br>- Cita médica previamente agendada y perteneciente a la agenda del médico autenticado.<br>- Que la cita médica no cuente previamente con una atención clínica registrada. |
| Postcondición | Se crea un nuevo registro en la tabla `atenciones_clinicas`; se actualiza atómicamente el campo `id_estado_cita` de la tabla `citas` al valor 5 (código "atendida"); queda registrado en la tabla `bitacora_auditoria` con la acción "REGISTRAR_ATENCION_CLINICA" y el identificador de usuario responsable; la cita queda cerrada para nuevas atenciones. |
| Excepciones | - Solicitud sin token de sesión válido → "Acceso no autorizado: se requiere un token de sesión válido" → Código HTTP 401.<br>- Token de sesión inválido o expirado → "Sesión inválida o expirada. Por favor vuelva a iniciar sesión." → Código HTTP 401.<br>- Usuario con rol no autorizado (ej. recepcionista o paciente) → "Permisos insuficientes para acceder a este caso de uso" → Código HTTP 403.<br>- Médico intentando registrar atención para una cita asignada a otro profesional → "Error al registrar atención médica: Acceso denegado: esta cita médica corresponde a la agenda de otro profesional." → Código HTTP 403.<br>- Omisión de campos obligatorios en el formulario (identificador de cita, motivo, diagnóstico o tratamiento) → "El campo motivo atencion es obligatorio." / "El campo diagnostico es obligatorio." / "El campo tratamiento indicaciones es obligatorio." → Código HTTP 422.<br>- Cita médica inexistente en el sistema → "Error al registrar atención médica: La cita médica indicada no fue encontrada en el sistema." → Código HTTP 404.<br>- Intento de registrar atención sobre una cita que ya fue atendida → "Error al registrar atención médica: Esta cita médica ya cuenta con una atención clínica registrada previamente." → Código HTTP 400.<br>- Consulta de atención inexistente en showPorCita → "No se encontró atención médica registrada para esta cita." → Código HTTP 404.<br>- Paciente o médico intentando consultar el detalle de una atención ajena en showPorCita → "Acceso denegado: no tiene autorización para consultar la atención médica de otro paciente." / "Acceso denegado: no tiene autorización para consultar atenciones de otro profesional." → Código HTTP 403.<br>- Límite de transacciones superado (más de 60 por minuto) → "Demasiados intentos. Por favor espere un momento antes de volver a intentar." → Código HTTP 429. |

- **Roles autorizados:** Médico, Administrador.
- **Límite de tasa (Throttle):** `throttle:60,1` (máximo 60 registros por minuto por usuario/IP).

**Evidencia:**
- `backend/routes/api.php` (líneas 150–154)
- `backend/app/Http/Controllers/Paquetes/HistoriaClinica/CU18_RegistrarAtencionClinica/RegistrarAtencionClinicaControlador.php`
- `backend/app/Http/Requests/Paquetes/HistoriaClinica/CU18_RegistrarAtencionClinica/RegistrarAtencionRequest.php`
- `backend/app/Paquetes/HistoriaClinica/CU18_RegistrarAtencionClinica/RegistrarAtencionClinicaServicio.php`
- `frontend/src/Paquetes/HistoriaClinica/CU18_RegistrarAtencionClinica/FormularioAtencionClinica.jsx`
- `backend/database/migrations/2026_10_22_000000_create_initial_vida_salud_schema.php` (tablas `atenciones_clinicas`, `citas`, `estados_cita`, `bitacora_auditoria`)

**Referencias:**
- Requisitos Funcionales: RF18 (Registro y documentación de atención clínica).
- Reglas de Negocio: RN12 (Control de acceso basado en roles), RN16 (Conmutabilidad de estados de citas), RN19 (Aislamiento de citas por médico en sesión), RN21 (Registro inmutable en bitácora de auditoría).

---

### CU-19 — Resultados de laboratorio

| Campo | Contenido |
|---|---|
| Caso de Uso | CU-19 Resultados de laboratorio |
| Propósito | Incorporar al expediente clínico del paciente los informes, valoraciones diagnósticas y referencias documentales de análisis de laboratorio o estudios de gabinete complementarios (RF19). |
| Resumen | Este caso de uso permite al personal clínico autorizado (Médico, Administrador o Recepcionista de apoyo) registrar y asociar estudios clínicos (análisis de sangre, orina, perfiles bioquímicos, ecografías, cultivos o radiografías) a la ficha del paciente, pudiendo opcionalmente vincularlos a una atención médica específica. Almacena el tipo de examen, fecha de toma/emisión, hallazgos o valores descriptivos, y la ruta de referencia, folio o nombre del archivo digital escaneado (almacenado como texto en base de datos sin persistencia física binaria de archivos en el servidor). Permite a los profesionales médicos y al propio paciente consultar la cronología de exámenes auxiliares, garantizando aislamiento estricto de privacidad (RN19) y auditoría inmutable (RN21). |
| Actores | Médico, Administrador y Recepcionista (registro y consulta clínica de estudios), Paciente (consulta autónoma exclusiva de sus propios resultados), y el Sistema (valida formatos, vincula al expediente y registra bitácora). |
| Actor iniciador | Médico o Administrador (durante el seguimiento clínico o al recibir reportes de laboratorio). |
| Flujo del proceso | **Flujo básico (Registro de estudio de laboratorio desde modal accesible):**<br>1. Actor: Pulsa el botón para registrar un nuevo estudio de laboratorio desde el expediente clínico del paciente (CU-20) o desde el formulario de consulta médica (CU-18).<br>2. Sistema: Despliega el formulario modal de registro de estudios mostrando el nombre del paciente destinatario y atajos para exámenes frecuentes (hemograma, glucemia, perfil lipídico, urocultivo, función renal, radiografía, ecografía).<br>3. Actor: Selecciona o escribe el tipo de estudio, fecha de emisión, descripción detallada o valores cuantitativos del informe, y de manera opcional introduce la referencia del documento escaneado (código de folio, nombre del archivo PDF o identificador de muestra física).<br>4. Actor: Presiona "Guardar Resultado".<br>5. Sistema: Sanitiza las entradas de texto contra inyección de código y valida que el identificador de paciente exista, que el tipo de estudio y la descripción no estén vacíos, y que la fecha de estudio sea válida.<br>6. Sistema: Inserta el registro en la tabla de resultados de laboratorio, asociándolo al paciente y a la atención médica en caso de haberse provisto.<br>7. Sistema: Registra el evento en la bitácora de auditoría inmutable con la acción REGISTRAR_LABORATORIO y los metadatos del estudio registrado.<br>8. Sistema: Confirma la incorporación exitosa al actor, cierra el modal y refresca la cronología de estudios de la historia clínica.<br><br>**Flujo alterno A1 (Consulta de resultados de laboratorio de un paciente):**<br>1. Actor: Accede a la pestaña de "Estudios y Laboratorios" dentro del expediente clínico.<br>2. Sistema: Valida la sesión activa y aplica las directivas Anti-IDOR (RN19): si el actor es Paciente, aísla la consulta forzosamente a su propio identificador de paciente impidiendo consultar exámenes de terceros; si es personal clínico, requiere especificar el identificador del paciente consultado.<br>3. Sistema: Recupera los estudios de laboratorio vinculados al paciente ordenados cronológicamente descendente.<br>4. Sistema: Presenta el listado detallando fecha, tipo de estudio, hallazgos clínicos, referencia documental y diagnóstico de la consulta asociada. |
| Precondición | - Sesión iniciada con un token de sesión válido (`sesion.clinica`).<br>- Para registrar estudios: rol de Administrador, Médico o Recepcionista.<br>- Existencia previa del registro del paciente en el sistema. |
| Postcondición | Se inserta un nuevo registro en la tabla `resultados_laboratorio` con la descripción y la ruta o folio textual del archivo (`archivo_adjunto`); se asocia opcionalmente a una atención médica previa; queda registrado en `bitacora_auditoria` con la acción "REGISTRAR_LABORATORIO". |
| Excepciones | - Solicitud sin token de sesión válido → "Acceso no autorizado: se requiere un token de sesión válido" → Código HTTP 401.<br>- Token de sesión inválido o expirado → "Sesión inválida o expirada. Por favor vuelva a iniciar sesión." → Código HTTP 401.<br>- Atributo de sesión no identificado en el controlador → "Sesión no identificada." → Código HTTP 401.<br>- Rol sin privilegios para registrar estudios clínicos → "Acceso denegado: no tiene privilegios para registrar estudios de laboratorio." → Código HTTP 403.<br>- Paciente intentando consultar estudios de laboratorio de otro paciente → "Acceso denegado: no tiene autorización para ver los resultados de laboratorio de otro paciente." → Código HTTP 403.<br>- Omisión del identificador de paciente al consultar estudios desde un rol de personal → "Debe indicar el identificador del paciente para listar sus estudios." → Código HTTP 422.<br>- Omisión de campos obligatorios en el formulario (tipo de estudio, descripción o fecha) → "El campo tipo estudio es obligatorio." / "El campo descripcion es obligatorio." / "El campo fecha estudio es obligatorio." → Código HTTP 422.<br>- Paciente o atención clínica inexistente en el sistema → "El campo id paciente seleccionado no existe." / "El campo id atencion seleccionado no existe." → Código HTTP 422.<br>- Formato de fecha de estudio inválido → "El campo fecha estudio no es una fecha válida." → Código HTTP 422.<br>- Límite de tasa excedido en registro (más de 60 por minuto) → "Demasiados intentos. Por favor espere un momento antes de volver a intentar." → Código HTTP 429.<br>- Error imprevisto al registrar en base de datos → "Error al registrar estudio de laboratorio: [detalle]" → Código HTTP 400. |

- **Roles autorizados:** Médico, Administrador (registro y consulta); Recepcionista (registro y consulta de apoyo); Paciente (solo consulta de sus propios estudios).
- **Límite de tasa (Throttle):** `throttle:60,1` (máximo 60 registros por minuto por usuario/IP en la ruta de guardado).

**Evidencia:**
- `backend/routes/api.php` (líneas 150, 155–156)
- `backend/app/Http/Controllers/Paquetes/HistoriaClinica/CU19_RegistrarResultadosLaboratorio/ResultadosLaboratorioControlador.php`
- `backend/app/Http/Requests/Paquetes/HistoriaClinica/CU19_RegistrarResultadosLaboratorio/RegistrarLaboratorioRequest.php`
- `backend/app/Paquetes/HistoriaClinica/CU19_RegistrarResultadosLaboratorio/ResultadosLaboratorioServicio.php`
- `frontend/src/Paquetes/HistoriaClinica/CU19_RegistrarResultadosLaboratorio/ModalResultadosLab.jsx` (componente modal reutilizable embebido en `PaginaHistorialClinico.jsx`)
- `backend/database/migrations/2026_10_22_000000_create_initial_vida_salud_schema.php` (tablas `resultados_laboratorio`, `pacientes`, `atenciones_clinicas`, `bitacora_auditoria`)

**Referencias:**
- Requisitos Funcionales: RF19 (Registro y archivo de estudios auxiliares y resultados de laboratorio).
- Reglas de Negocio: RN12 (Control de acceso por roles), RN19 (Aislamiento de información clínica), RN21 (Registro inmutable en bitácora de auditoría).

---

### CU-20 — Historial clínico

| Campo | Contenido |
|---|---|
| Caso de Uso | CU-20 Historial clínico |
| Propósito | Brindar una visión integral, cronológica y consolidada del expediente de salud del paciente, unificando antecedentes personales, consultas médicas, tratamientos, recetas y exámenes auxiliares (RF18, RF19). |
| Resumen | Este caso de uso permite consultar el Expediente Clínico Electrónico consolidado de un paciente. Unifica en una sola estructura la ficha demográfica (edad calculada, sexo, cédula), antecedentes de salud declarados (alergias, enfermedades crónicas, medicación), contactos de emergencia, la cronología completa de atenciones médicas efectuadas (con examen físico, diagnóstico, indicaciones y prescripción farmacológica), los estudios de laboratorio realizados y el historial de citas agendadas (excluyendo citas canceladas). Implementa un blindaje estricto de seguridad Anti-IDOR (RN19): si el consultante es un paciente, el sistema ignora cualquier identificador recibido en la URL y fuerza exclusivamente el expediente correspondiente a su token de sesión, rechazando con código 403 cualquier intento de acceso a historiales ajenos. |
| Actores | Paciente (consulta autónoma de su propio expediente médico), Médico (consulta el historial para emitir diagnósticos informados), Recepcionista y Administrador (gestión y consulta clínica autorizada), y el Sistema (aplica Anti-IDOR, consolida datos de múltiples tablas y calcula edades y cronologías). |
| Actor iniciador | Paciente (desde su portal de autoservicio), Médico (desde su agenda o kardex), o personal de Recepción/Administración. |
| Flujo del proceso | **Flujo básico (Consulta del expediente clínico integral):**<br>1. Actor: Solicita acceder al historial clínico de un paciente desde el enlace de navegación, desde el kardex o seleccionando una cita de la agenda.<br>2. Sistema: Valida que la sesión cuente con un token de autenticación válido (`sesion.clinica`).<br>3. Sistema: Aplica el mecanismo Anti-IDOR (RN19): si el actor autenticado tiene rol de Paciente, verifica si el identificador solicitado coincide con su propio registro; si difiere, bloquea el acceso; si coincide o se omite, fuerza en el servidor su propio identificador de paciente extraído de la sesión.<br>4. Sistema: Consulta en la base de datos la ficha demográfica del paciente y calcula su edad en años a partir de su fecha de nacimiento.<br>5. Sistema: Recupera la información médica declarada (alergias conocidas, patologías crónicas, medicación y antecedentes) y los contactos de emergencia registrados.<br>6. Sistema: Consulta la cronología de atenciones clínicas concluidas, vinculando la fecha, la especialidad médica, el profesional tratante, el diagnóstico, el examen físico, las indicaciones y la receta médica emitida.<br>7. Sistema: Recupera los estudios y resultados de laboratorio indexados cronológicamente descendente.<br>8. Sistema: Consulta el historial de citas médicas del paciente, excluyendo las citas canceladas, y formatea las horas de atención.<br>9. Sistema: Entrega la estructura integral a la interfaz y renderiza la vista organizada en secciones: ficha del paciente en cabecera, pestaña de consultas médicas concluidas (con tarjetas expandibles de diagnósticos y recetas), pestaña de estudios de laboratorio (con opción de registrar nuevos exámenes para personal clínico) y pestaña de citas programadas.<br><br>**Flujo alterno A1 (Impresión o exportación de la receta médica o atención):**<br>1. Actor: Desde el desglose de una atención clínica en la vista de expediente, localiza el bloque de prescripción médica.<br>2. Actor: Utiliza las opciones del navegador o del sistema para generar el respaldo impreso o lectura de las indicaciones terapéuticas. |
| Precondición | - Sesión iniciada con un token de sesión válido emitido por el sistema (`sesion.clinica`).<br>- Contar con rol de Paciente (únicamente para su propio expediente), Médico, Recepcionista o Administrador.<br>- Existencia del expediente del paciente en la base de datos. |
| Postcondición | Operación de solo lectura: no se mutan registros en la base de datos ni se altera el estado operativo de las entidades; se consolida y presenta la información de 6 entidades relacionadas. |
| Excepciones | - Solicitud sin token de sesión válido → "Acceso no autorizado: se requiere un token de sesión válido" → Código HTTP 401.<br>- Token de sesión inválido o expirado → "Sesión inválida o expirada. Por favor vuelva a iniciar sesión." → Código HTTP 401.<br>- Atributo de sesión ausente en el controlador → "Sesión no identificada." → Código HTTP 401.<br>- Paciente intentando consultar el expediente de otro paciente mediante alteración del identificador en la URL → "Acceso denegado: no tiene privilegios para consultar el expediente de otro paciente." → Código HTTP 403.<br>- Usuario con rol paciente sin perfil clínico vinculado a su cuenta activa → "Perfil de paciente no vinculado a la cuenta activa." → Código HTTP 403.<br>- Identificador de paciente no encontrado en la base de datos → "Expediente clínico del paciente no encontrado." → Código HTTP 404.<br>- Error imprevisto al consultar la base de datos → Mensaje de error general de la API → Código HTTP 500. |

- **Roles autorizados:** Paciente (estrictamente su propio expediente), Médico, Recepcionista, Administrador.
- **Límite de tasa (Throttle):** No posee un límite restrictivo por minuto en su ruta de consulta; opera bajo la configuración general del enrutador.

**Evidencia:**
- `backend/routes/api.php` (líneas 116–117)
- `backend/app/Http/Controllers/Paquetes/HistoriaClinica/CU20_ConsultarHistorialClinico/ConsultarHistorialClinicoControlador.php`
- `backend/app/Paquetes/HistoriaClinica/CU20_ConsultarHistorialClinico/ConsultarHistorialClinicoServicio.php`
- `frontend/src/Paquetes/HistoriaClinica/CU20_ConsultarHistorialClinico/PaginaHistorialClinico.jsx`
- `frontend/src/Paquetes/HistoriaClinica/CU19_RegistrarResultadosLaboratorio/ModalResultadosLab.jsx` (modal embebido en la vista para personal médico)
- `backend/database/migrations/2026_10_22_000000_create_initial_vida_salud_schema.php` (tablas `pacientes`, `personas`, `informacion_medica_paciente`, `contactos_emergencia`, `citas`, `estados_cita`, `atenciones_clinicas`, `resultados_laboratorio`, `medicos`, `especialidades`)

**Referencias:**
- Requisitos Funcionales: RF18 (Expediente clínico electrónico y cronología de consultas), RF19 (Integración de estudios auxiliares y laboratorio).
- Reglas de Negocio: RN11 (Preservación histórica inalterable), RN12 (Control de acceso basado en roles), RN19 (Aislamiento de expedientes y blindaje Anti-IDOR), RN21 (Trazabilidad y auditoría).

---

### Verificaciones Específicas Respondidas

#### 1. CU-18: Si marca la cita como Atendida dentro de la misma transacción
- **Respuesta contundente:** **SÍ, absolutamente.**
- **Mecanismo técnico en el código:** En `RegistrarAtencionClinicaServicio::registrar` (líneas 17–80 de `backend/app/Paquetes/HistoriaClinica/CU18_RegistrarAtencionClinica/RegistrarAtencionClinicaServicio.php`), todo el procedimiento se encuentra encapsulado dentro de una llamada atómica a `DB::transaction(function () use (...) { ... })`.
- **Secuencia exacta ejecutada:**
  1. Se ejecuta un bloqueo pesimista a nivel de fila sobre la cita: `DB::table('citas')->where('id_cita', $idCita)->lockForUpdate()->first()`.
  2. Se valida que la cita pertenezca a la agenda del médico en sesión (RN19) y que no tenga una atención previa registrada.
  3. Se inserta el registro en la tabla `atenciones_clinicas` obteniendo `$idAtencion`.
  4. De forma consecutiva e indivisible en la misma transacción, se ejecuta `DB::table('citas')->where('id_cita', $idCita)->update(['id_estado_cita' => 5, 'estado' => 'activo', 'updated_at' => now()])`, cambiando el estado de la cita a "atendida" (`id_estado_cita = 5`).
  5. Se inserta el registro de auditoría en `bitacora_auditoria` con la acción `REGISTRAR_ATENCION_CLINICA`.
  6. Si ocurriera cualquier error o excepción en cualquiera de los pasos, la transacción ejecuta un `ROLLBACK` total, impidiendo inconsistencias o citas atendidas sin registro clínico.

#### 2. CU-19: Si el archivo adjunto se guarda realmente o solo se guarda una ruta
- **Respuesta contundente:** **SOLO SE GUARDA UNA RUTA, NOMBRE DE ARCHIVO O FOLIO DE REFERENCIA.**
- **Mecanismo técnico en el código:**
  - En la base de datos (`backend/database/migrations/2026_10_22_000000_create_initial_vida_salud_schema.php`, tabla `resultados_laboratorio`), la columna física es `$table->string('archivo_adjunto', 255)->nullable();`.
  - En el FormRequest (`RegistrarLaboratorioRequest.php`), la regla de validación es `'archivo_adjunto' => 'nullable|string|max:255'`. No existe regla de tipo `file`, `image` ni `mimes:pdf,jpg`.
  - En el servicio (`ResultadosLaboratorioServicio::registrar`), el valor se almacena directamente como string: `'archivo_adjunto' => $datos['archivo_adjunto'] ?? null`.
  - En el frontend (`ModalResultadosLab.jsx`, líneas 231–244), el control de interfaz es un `<input type="text" placeholder="Ej. INFORME-LAB-984.pdf o URL del repositorio" maxLength={255} />` acompañado de la aclaración explícita: *"Código de muestra física, folio de laboratorio o nombre del documento escaneado."*
  - Por lo tanto, no existe persistencia física binaria de archivos en el disco del servidor (`Storage::disk` o `move_uploaded_file`), tratándose exclusivamente de una referencia textual documental.

#### 3. Todos los casos de paciente o médico: cómo se impide ver o alterar datos de otra persona (Mecanismo Anti-IDOR / RN19)
- **En CU-17 (Mis pacientes):** En `ConsultarMisPacientesControlador::index`, si el usuario autenticado tiene rol de `medico`, el código ignora cualquier parámetro recibido en la petición HTTP y extrae el identificador del médico exclusivamente desde el token criptográfico validado en la sesión (`$idMedico = $usuario->id_medico`). El servicio filtra estrictamente las citas con `citas.id_medico = $idMedico`, impidiendo que un profesional visualice a los pacientes de otro colega.
- **En CU-18 (Atención clínica):** En `RegistrarAtencionClinicaServicio::registrar`, tras aplicar bloqueo pesimista sobre la cita, se evalúa `if ($idMedicoOperador && (int)$cita->id_medico !== (int)$idMedicoOperador)` y, en caso de discrepancia, se aborta la transacción con HTTP 403 (*"Acceso denegado: esta cita médica corresponde a la agenda de otro profesional."*). Asimismo, en `showPorCita`, se comprueba tanto para pacientes como para médicos que el identificador del registro coincida con la identidad extraída del token de sesión, rechazando cualquier acceso no autorizado con código 403.
- **En CU-19 (Resultados de laboratorio):** En `ResultadosLaboratorioControlador::index`, si el consultante tiene rol de `paciente`, el sistema ignora cualquier `id_paciente` ajeno y fuerza el identificador del paciente en sesión; si el usuario envía un `id_paciente` diferente en la URL, responde de inmediato con HTTP 403 (*"Acceso denegado: no tiene autorización para ver los resultados de laboratorio de otro paciente."*). Para el guardado (`store`), solo los roles clínicos (`administrador`, `medico`, `recepcionista`) están autorizados.
- **En CU-20 (Historial clínico):** En `ConsultarHistorialClinicoControlador::show`, cuando el rol es `paciente`, se evalúa `if ($idPaciente !== 0 && (int)$idPaciente !== $idPacienteAutenticado)`. Si un paciente intenta consultar el expediente de otra persona manipulando el número en la ruta `/historia-clinica/pacientes/{idPaciente}`, el sistema bloquea la solicitud con HTTP 403 (*"Acceso denegado: no tiene privilegios para consultar el expediente de otro paciente."*) y fuerza estrictamente su propio `id_paciente`.

---

### Discrepancias entre Documentación y Código Real

1. **CU-17 — Página de interfaz de usuario de Kardex de pacientes (Frontend dedicado):**
   - **Qué dice la documentación:** En `casos-de-uso-citas-medicas-vida-salud-v3.md` (sección CU-17, Implementación Técnica) se indicaba que el frontend era `PaginaGestionPacientes.jsx (modo expediente / kardex filtrado para rol médico)`.
   - **Qué hace el código:** El proyecto cuenta con una vista React completamente independiente y especializada: `frontend/src/Paquetes/HistoriaClinica/CU17_ConsultarMisPacientes/PaginaKardexPacientes.jsx`. Esta vista está enlazada en el enrutador oficial (`App.jsx`, ruta `/medico/pacientes`) bajo el componente `<PaginaKardexPacientes />`, ofreciendo métricas de seguimiento, buscador dinámico en tiempo real y navegación directa hacia el expediente clínico electrónico.
   - **Archivo:** `frontend/src/App.jsx` y `frontend/src/Paquetes/HistoriaClinica/CU17_ConsultarMisPacientes/PaginaKardexPacientes.jsx`.

2. **CU-18 — Conmutabilidad vs cierre directo e indivisible de la cita:**
   - **Qué dice la documentación:** En `casos-de-uso-citas-medicas-vida-salud-v3.md` se mencionaba que CU-18 "marca la cita médica como Atendida en CU-13 de forma conmutable".
   - **Qué hace el código:** En `RegistrarAtencionClinicaServicio::registrar`, el cierre de la cita médica a estado "atendida" (`id_estado_cita = 5`) no delega en CU-13 ni es un procedimiento conmutable opcional: se ejecuta directamente e indivisiblemente dentro de la misma transacción SQL con bloqueo pesimista (`lockForUpdate()`), y se valida que la cita no cuente previamente con otra atención registrada, asegurando unicidad de registro clínico por cita.
   - **Archivo:** `backend/app/Paquetes/HistoriaClinica/CU18_RegistrarAtencionClinica/RegistrarAtencionClinicaServicio.php`.

3. **CU-19 — Naturaleza del archivo adjunto (almacenamiento de ruta vs archivo físico):**
   - **Qué dice la documentación:** En `casos-de-uso-citas-medicas-vida-salud-v3.md` (sección CU-19) se hablaba de "ruta de archivo adjunto digital" o subida de documentos complementarios.
   - **Qué hace el código:** El campo `archivo_adjunto` es estrictamente una cadena de texto en base de datos (`VARCHAR(255)`) donde se registra el nombre, folio físico o identificador del documento escaneado. No existe subida de archivos binarios (`multipart/form-data`) ni almacenamiento físico en disco (`Storage::disk`).
   - **Archivo:** `backend/app/Http/Requests/Paquetes/HistoriaClinica/CU19_RegistrarResultadosLaboratorio/RegistrarLaboratorioRequest.php` y `frontend/src/Paquetes/HistoriaClinica/CU19_RegistrarResultadosLaboratorio/ModalResultadosLab.jsx`.

4. **CU-19 — Integración de interfaz de usuario (Modal embebido):**
   - **Qué dice la documentación:** En `estructura-proyecto.md` figuraba `ModalResultadosLab.jsx` de forma aislada dentro del paquete.
   - **Qué hace el código:** `ModalResultadosLab.jsx` funciona como un componente modal accesible que se encuentra embebido e integrado tanto dentro de `PaginaHistorialClinico.jsx` (CU-20) como en los flujos de consulta de los médicos, permitiendo registrar análisis auxiliares sin abandonar la vista del expediente.
   - **Archivo:** `frontend/src/Paquetes/HistoriaClinica/CU20_ConsultarHistorialClinico/PaginaHistorialClinico.jsx`.

5. **CU-20 — Exclusión de citas canceladas del expediente clínico:**
   - **Qué dice la documentación:** En la especificación funcional de CU-20 se indicaba que el sistema consolidaba "el historial completo de citas médicas agendadas".
   - **Qué hace el código:** En `ConsultarHistorialClinicoServicio::obtenerHistorialCompleto` (líneas 97–98), el backend aplica un filtro explícito: `where('citas.estado', '!=', 'cancelada')`, excluyendo de la cronología de citas del paciente aquellas que hayan sido canceladas, mostrando únicamente las citas válidas, reprogramadas, pendientes, confirmadas o atendidas.
   - **Archivo:** `backend/app/Paquetes/HistoriaClinica/CU20_ConsultarHistorialClinico/ConsultarHistorialClinicoServicio.php`.

---

### Campos con valor "NO ENCONTRADO"

**Ninguno.** Todos los campos solicitados para los casos de uso CU-17, CU-18, CU-19 y CU-20 fueron localizados, contrastados y verificados exhaustivamente en el código fuente del proyecto.
