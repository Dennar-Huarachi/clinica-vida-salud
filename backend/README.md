# Backend API REST — Clínica "Vida Salud"

API RESTful desarrollada en **Laravel 13** y **PHP 8.3+** para la persistencia, lógica de negocio y seguridad del **Sistema Web de Gestión de Citas Médicas (Clínica Vida Salud)**, conectada a **PostgreSQL 18**.

---

## 1. Arquitectura de Software

El backend sigue el patrón **Package-by-Feature (Organización por Paquetes y Casos de Uso)** integrado con el ciclo de vida de Laravel:

```
backend/app/
├── Http/
│   ├── Controllers/
│   │   ├── Controller.php
│   │   └── Paquetes/
│   │       ├── AccesoCuentas/ (CU01, CU02, CU03, CU04, CU26)
│   │       ├── PacientesPerfil/ (CU05, CU06)
│   │       ├── CatalogosHorarios/ (CU07, CU08, CU09, CU10, CU11)
│   │       ├── CitasNotificaciones/ (CU12, CU13, CU14, CU15, CU16, CU27)
│   │       ├── HistoriaClinica/ (CU17, CU18, CU19, CU20)
│   │       └── Reportes/ (CU21, CU22, CU23, CU24, CU25)
│   ├── Middleware/
│   │   └── CabecerasSeguridad.php
│   └── Requests/
│       └── Paquetes/
│           ├── AccesoCuentas/ (CU01, CU02, CU03, CU04)
│           ├── PacientesPerfil/ (CU05, CU06)
│           ├── CatalogosHorarios/ (CU07, CU08, CU09, CU10, CU11)
│           ├── CitasNotificaciones/ (CU12, CU13, CU27)
│           └── HistoriaClinica/ (CU18, CU19)
├── Paquetes/
│   ├── AccesoCuentas/ (Servicios de dominio CU01, CU02, CU03, CU04, CU26)
│   ├── PacientesPerfil/ (Servicios CU05, CU06)
│   ├── CatalogosHorarios/ (Servicios CU07, CU08, CU09, CU10, CU11)
│   ├── CitasNotificaciones/ (Servicios CU12, CU13, CU14, CU15, CU16, CU27)
│   ├── HistoriaClinica/ (Servicios CU17, CU18, CU19, CU20)
│   └── Reportes/ (Servicios CU21, CU22, CU23, CU24, CU25)
├── Nucleo/
│   ├── Bitacora/ServicioBitacora.php (Auditoría inmutable RN21)
│   ├── Errores/RespuestaApi.php (Estandarización JSON exito/error)
│   ├── Permisos/MiddlewareVerificarRol.php (Guardia RBAC por rol)
│   ├── Sesion/ManejadorSesion.php (Bearer token y anti-IDOR)
│   └── Validaciones/FormRequestPersonalizado.php (Sanitización anti-XSS recursiva)
└── Models/
    └── Cita.php (Modelo de dominio centralizador de ESTADOS_OCUPANTES, aplicarFiltroOcupantes() y querySolapamiento())
```

---

## 2. Base de Datos y Persistencia (PostgreSQL 18)

La base de datos se consolida en **5 migraciones secuenciales** que estructuran **23 tablas físicas** e índices de unicidad parcial:

| Migración | Contenido y Entidades |
| :--- | :--- |
| `2026_10_22_000000_create_initial_vida_salud_schema.php` | 20 tablas base: `roles`, `personas`, `usuarios`, `pacientes`, `informacion_medica_paciente`, `contactos_emergencia`, `medicos`, `especialidades`, `medico_especialidad`, `horarios_atencion`, `bloqueos_clinica`, `suspensiones_horario`, `estados_cita`, `citas`, `notificaciones`, `atenciones_clinicas`, `resultados_laboratorio`, `bitacora_auditoria`, `copias_seguridad`, `parametros_sistema`. |
| `2026_10_22_000001_create_permisos_and_rol_permiso_tables.php` | 2 tablas: `permisos` y pivote `rol_permiso`. Agrega columna `reservable_en_linea` a `especialidades` (RN18). |
| `2026_10_23_000001_add_nombre_normalizado_to_especialidades_table.php` | Agrega columna única `nombre_normalizado` a `especialidades` para prevenir duplicados fonéticos/tildes. |
| `2026_10_23_000002_create_pagos_cita_table_and_add_pago_to_citas.php` | Crea tabla `pagos_cita` (CU-27), agrega `id_pago` y `pago_confirmado` en `citas`, y registra parámetros `HORAS_ANTICIPACION_CANCELAR = 12` y `MONTO_FIJO_RESERVA_CITA = 50.00` (D17, RN15). |
| `2026_11_07_000001_add_partial_unique_index_to_citas_table.php` | Crea el índice único parcial `uq_citas_turno_activo` sobre `(id_medico, fecha_cita, hora_inicio)` en PostgreSQL con resolución dinámica de IDs para blindar la base de datos contra doble agendamiento concurrente (Cero Sobreventa). |

---

## 3. Seguridad y Defensa en Profundidad (OWASP Top 10)

1. **Sanitización anti-XSS Recursiva (`FormRequestPersonalizado.php`):** Todos los FormRequests heredan de esta clase base y ejecutan `strip_tags()` recursivo sobre strings en `prepareForValidation()`.
2. **Mitigación de Fuerza Bruta (Rate Limiting en `routes/api.php`):**
   - `/acceso/login`: `throttle:5,1` (5 intentos por minuto).
   - `/acceso/registro-paciente`: `throttle:10,1` (10 registros por minuto).
   - `/citas` (store, reprogramar, cancelar, confirmar) y `/pagos/*`: `throttle:60,1`.
3. **Cabeceras HTTP de Seguridad Global (`CabecerasSeguridad.php`):**
   - `X-Frame-Options: DENY` (anti-clickjacking).
   - `X-Content-Type-Options: nosniff`.
   - `X-XSS-Protection: 1; mode=block`.
   - `Referrer-Policy: strict-origin-when-cross-origin`.
   - `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
4. **Autenticación e Identidad Criptográfica Anti-IDOR (`ManejadorSesion.php`):**
   - Valida el token Bearer en tabla `usuarios`.
   - Vincula automáticamente `$usuario->id_medico` y `$usuario->id_paciente`.
   - Las operaciones de pacientes y médicos forzan estos identificadores, bloqueando accesos cruzados (RN19).
5. **Control de Acceso Basado en Roles (`MiddlewareVerificarRol.php`):**
   - Permite acceso por alias de roles: `rol:administrador,recepcionista`, `rol:medico`, etc.
   - El administrador posee acceso transversal de supervisión.
6. **Manejo Seguro de Excepciones (`bootstrap/app.php`):**
   - Enmascaramiento de errores 500 no controlados sin revelar trazas, credenciales ni rutas internas en producción.
   - Respuestas estandarizadas en formato JSON mediante `RespuestaApi`.

---

## 4. Mapa de Rutas de la API (`routes/api.php`)

### Rutas Públicas (Sin Autenticación)
- `GET /api/salud`: Verificación de salud y conexión a PostgreSQL.
- `POST /api/acceso/login`: Inicio de sesión (`throttle:5,1`).
- `POST /api/acceso/registro-paciente`: Registro autónomo de pacientes (`throttle:10,1`).
- `GET /api/catalogos/especialidades-publicas`: Especialidades para reserva pública.
- `GET /api/catalogos/medicos-publicos`: Directorio público de profesionales.

### Rutas Protegidas (`middleware: sesion.clinica`)
- **Acceso:**
  - `GET /api/acceso/verificar`: Verificación de sesión activa.
  - `POST /api/acceso/logout`: Cierre de sesión y revocación de token.
  - `POST /api/acceso/cambiar-contrasena`: Cambio de clave (CU-02).
- **Perfil:**
  - `GET|PUT /api/perfil/mi-perfil` (alias `/api/perfil`): Gestión de perfil del paciente (CU-06).
- **Disponibilidad:**
  - `GET /api/catalogos/disponibilidad`: Cálculo de turnos libres en tiempo real (CU-10).
- **Citas Médicas:**
  - `GET /api/citas`: Listado filtrable de citas.
  - `POST /api/citas`: Reserva atómica con concurrencia pesimista `lockForUpdate()` y pago de garantía (CU-12 / CU-27).
  - `PUT /api/citas/{id}/reprogramar`: Reubicación de turno conservando trazabilidad (CU-12).
  - `PUT /api/citas/{id}/cancelar`: Cancelación lógica con política de 12 horas RN15 (CU-12).
  - `PUT /api/citas/{id}/confirmar`: Confirmación voluntaria de turno (CU-12).
  - `GET /api/citas/agenda`: Agenda operativa por fecha y filtros (CU-14).
  - `GET /api/citas/historial`: Historial cronológico con estado de garantía (CU-15).
  - `PUT /api/citas/{id}/asistencia`: Registro de presencia `en_espera`, asistencia o corrección RN16 (`rol:administrador,recepcionista,medico`).
- **Garantía y Pagos (CU-27):**
  - `POST /api/pagos/garantia`: Procesamiento simulado de depósito (50.00 Bs).
  - `POST /api/pagos/{id_cita}/reembolso`: Devolución íntegra ante cancelación oportuna ($\ge 12$h).
  - `GET /api/pagos/cita/{id_cita}`: Consulta de comprobante financiero.
- **Notificaciones (CU-16):**
  - `GET /api/notificaciones`: Notificaciones del usuario autenticado.
  - `PUT /api/notificaciones/{id}/leida`: Marcado de lectura.
  - `POST /api/notificaciones/disparar-recordatorios`: Disparo masivo de recordatorios (`rol:administrador,recepcionista`).
- **Historia Clínica:**
  - `GET /api/historia-clinica/pacientes/{idPaciente}`: Expediente clínico integral (CU-20).
  - `GET /api/historia-clinica/mis-pacientes`: Kardex digital médico (CU-17, `rol:administrador,medico`).
  - `POST /api/historia-clinica/atenciones`: Registro de atención médica (CU-18, `rol:administrador,medico`).
  - `GET|POST /api/historia-clinica/laboratorios`: Exámenes y diagnósticos (CU-19, `rol:administrador,medico`).
- **Administración y Recepción (`rol:administrador,recepcionista`):**
  - `GET|POST /api/pacientes`: Padrón de pacientes (CU-05).
  - `GET|PUT /api/pacientes/{id}`: Consulta y edición de paciente (CU-05).
  - `PATCH /api/pacientes/{id}/alternar-estado`: Baja lógica activo/inactivo (CU-05).
- **Administración Exclusiva (`rol:administrador`):**
  - `GET|POST /api/administracion/usuarios`: Directorio de usuarios (CU-04).
  - `PUT /api/administracion/usuarios/{id}`, `PATCH .../alternar-estado`: Edición y estado (CU-04).
  - `GET|POST /api/admin/roles`: Roles del sistema (CU-04).
  - `GET|PUT /api/admin/roles/{id}/permisos`: Matriz modular de permisos (CU-04).
  - `POST|PUT|PATCH /api/catalogos/especialidades`: Especialidades médicas (CU-07).
  - `POST|PUT|PATCH /api/catalogos/medicos`: Cuerpo médico y asignación de ramas (CU-08).
  - `GET|POST|PUT|PATCH /api/catalogos/horarios`: Horarios semanales de atención (CU-09).
  - `GET|POST /api/catalogos/suspensiones`: Suspensiones médicas y citas afectadas (CU-11).
  - `GET /api/reportes/citas`: Reportes operativos y filtros agregados (CU-21).
  - `GET /api/reportes/asistencia`: Estadísticas de asistencia y ausentismo (CU-22).
  - `GET /api/reportes/exportar`: Exportación tabular a formato CSV (CU-23).
  - `GET /api/auditoria/bitacora`: Registro de auditoría inmutable (CU-24).
  - `GET /api/dashboard/metricas`: Indicadores ejecutivos del panel (CU-25).
  - `GET|POST /api/administracion/backups`: Resguardos y copias de seguridad SQL (CU-26).

---

## 5. Instrucciones de Ejecución Local

### Prerrequisitos
* PHP $\ge 8.3$ con extensiones `pdo_pgsql`, `pgsql`, `mbstring`, `openssl`, `curl`.
* PostgreSQL 18 (o $\ge 16$) en ejecución.
* Composer $\ge 2.7$.

### Puesta en Marcha
```bash
cd backend

# Instalar dependencias
composer install

# Configurar variables de entorno
cp .env.example .env

# Generar clave de aplicación
php artisan key:generate

# Ejecutar migraciones y poblar datos iniciales
php artisan migrate --seed

# Iniciar el servidor local
php artisan serve
```
El servidor quedará disponible en `http://127.0.0.1:8000/api`.

---

## 6. Suite de Pruebas Automatizadas y Blindaje Local

El backend cuenta con scripts de prueba automatizados en `backend/tests/`, todos protegidos mediante **guardas de seguridad de entorno** que impiden su ejecución accidental contra producción (Render / Supabase):

```bash
# 1. Ejecutar la suite integral de 21 casos de prueba funcionales y de seguridad (100% éxito)
php backend/tests/ejecutar_20_pruebas.php

# 2. Ejecutar prueba real de concurrencia con 2 procesos paralelos independientes (201 Created vs 409 Conflict)
php backend/tests/prueba_concurrencia_procesos.php

# 3. Probar migraciones y seeders con índice único en sandbox local aislado
php backend/tests/verificar_seeders_sandbox.php
```
