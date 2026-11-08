# Informe de Implementación — Sección FT Implementación (PUDS-UML)
**Sistema Web de Gestión de Citas Médicas — Clínica "Vida Salud"**  
**Auditoría y Extracción Técnica de Código Real**  
**Fecha:** 07 de Noviembre de 2026  

---

## A. Herramientas

### A1. Backend (PHP / Laravel)
- **PHP Mínimo Requerido:** `^8.3` (definido en `backend/composer.json`).
- **Versión Exacta del Framework:** `laravel/framework v13.38.0` (instalada en `composer.lock`; restricción declarada: `^13.17`).

#### Dependencias de Producción (`require`)
| Paquete | Versión Declarada (`composer.json`) | Versión Instalada (`composer.lock`) |
| :--- | :--- | :--- |
| `laravel/framework` | `^13.17` | `v13.38.0` |
| `laravel/tinker` | `^3.0` | `v3.0.2` |

#### Dependencias de Desarrollo (`require-dev`)
| Paquete | Versión Declarada (`composer.json`) | Versión Instalada (`composer.lock`) |
| :--- | :--- | :--- |
| `fakerphp/faker` | `^1.23` | `v1.24.1` |
| `laravel/pail` | `^1.2.5` | `v1.2.7` |
| `laravel/pao` | `^1.0.6` | `v1.1.5` |
| `laravel/pint` | `^1.27` | `v1.32.1` |
| `mockery/mockery` | `^1.6` | `1.6.15` |
| `nunomaduro/collision` | `^8.6` | `v8.9.5` |
| `phpunit/phpunit` | `^12.5.12` | `12.5.40` |

#### Scripts Útiles de `composer.json`
- `dev`: Ejecuta simultáneamente el servidor PHP, worker de colas y logs con Pail (`npx concurrently -c "#93c5fd,#c4b5fd,#fb7185,#fdba74" ...`).
- `post-autoload-dump`: Descubre paquetes de Laravel y ejecuta optimizaciones (`@php artisan package:discover --ansi`).
- `post-update-cmd`: Publica assets de Laravel con vendor:publish (`@php artisan vendor:publish --tag=laravel-assets --ansi --force`).
- `post-root-package-install`: Copia automáticamente el archivo `.env.example` a `.env`.
- `post-create-project-cmd`: Genera la clave criptográfica de la aplicación (`@php artisan key:generate --ansi`).

---

### A2. Frontend (React / Vite)
- **Node.js / npm Requeridos:** `NO ENCONTRADO` (no existe bloque `engines` en `frontend/package.json`).
- **Librerías Principales:**
  - `react`: `19.3.1` (declarada: `^19.3.1`)
  - `react-dom`: `19.3.1` (declarada: `^19.3.1`)
  - `react-router-dom`: `7.18.4` (declarada: `^7.18.4`)
  - `axios`: `1.20.0` (declarada: `^1.20.0`)
  - `vite`: `8.3.4` (declarada: `^8.3.4`)

#### Dependencias de Producción (`dependencies`)
| Librería | Versión Declarada (`package.json`) | Versión Instalada (`package-lock.json`) |
| :--- | :--- | :--- |
| `axios` | `^1.20.0` | `1.20.0` |
| `react` | `^19.3.1` | `19.3.1` |
| `react-dom` | `^19.3.1` | `19.3.1` |
| `react-router-dom` | `^7.18.4` | `7.18.4` |

#### Dependencias de Desarrollo (`devDependencies`)
| Herramienta | Versión Declarada (`package.json`) | Versión Instalada (`package-lock.json`) |
| :--- | :--- | :--- |
| `@eslint/js` | `^10.0.1` | `10.0.1` |
| `@types/react` | `^19.3.0` | `19.3.0` |
| `@types/react-dom` | `^19.3.0` | `19.3.0` |
| `@vitejs/plugin-react` | `^6.1.2` | `6.1.2` |
| `eslint` | `^10.13.0` | `10.13.0` |
| `eslint-plugin-react-hooks` | `^7.1.1` | `7.1.1` |
| `eslint-plugin-react-refresh` | `^0.5.7` | `0.5.7` |
| `globals` | `^17.13.0` | `17.13.0` |
| `vite` | `^8.3.4` | `8.3.4` |

#### Scripts de `package.json`
- `npm run dev`: Inicia el servidor de desarrollo local con Vite (`vite`).
- `npm run build`: Compila el bundle de producción para despliegue (`vite build`).
- `npm run lint`: Analiza estáticamente el código fuente con ESLint (`eslint .`).
- `npm run preview`: Previsualiza localmente el bundle compilado de producción (`vite preview`).

---

### A3. Base de Datos
- **Motor Configurado:** PostgreSQL (Driver `pgsql` en `backend/config/database.php`).
- **Configuración de Conexión:**
  - `charset`: `utf8`
  - `prefix`: `''` (sin prefijo en tablas)
  - `schema`: `public`
  - `sslmode`: `prefer`
  - `timezone`: `America/La_Paz` (GMT-4)
- **Extensiones PHP Requeridas:**
  - `pdo`: Abstracción de base de datos de PHP.
  - `pdo_pgsql`: Conector nativo PDO para PostgreSQL.
  - `libpq-dev`: Bibliotecas de cliente PostgreSQL en el sistema operativo (instaladas en `backend/Dockerfile`).

---

### A4. Herramientas de Soporte Detectadas
- **Control de Versiones:** Git (repositorio inicializado con `.git`, exclusiones en `.gitignore`).
- **Linters y Formateadores:**
  - Backend: `laravel/pint` (`v1.32.1`) para estilo PSR-12 en PHP.
  - Frontend: `eslint` (`10.13.0`) con plugins `eslint-plugin-react-hooks` (`7.1.1`) y `eslint-plugin-react-refresh` (`0.5.7`).
  - Prettier: `NO ENCONTRADO` (no configurado en el repositorio).
- **Frameworks y Suites de Pruebas:**
  - Backend Unit/Feature: `phpunit/phpunit` (`12.5.40`) configurado mediante `backend/phpunit.xml`.
  - Pruebas de Integración y Reglas de Negocio: `backend/tests/ejecutar_20_pruebas.php` (20 casos de prueba integrales contra base de datos local).
  - Pruebas de Concurrencia de Procesos: `backend/tests/prueba_concurrencia_procesos.php` (simulación paralela de reservas simultáneas con bloqueo pesimista).
  - Pruebas en Frontend: `NO ENCONTRADO` (no existen suites de Jest, Vitest ni React Testing Library en el frontend).
- **Contenedores Docker:**
  - `backend/Dockerfile`: Imagen base `php:8.3-cli`, instala `libpq-dev`, extensiones `pdo` y `pdo_pgsql`, copia Composer y ejecuta el comando de arranque:
    `CMD php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=$PORT`
- **Despliegue y CI/CD:**
  - Frontend: `frontend/vercel.json` con reescritura de rutas para arquitectura SPA (`"rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]`).
  - GitHub Actions (`.github/workflows`): `NO ENCONTRADO`.
  - Render Blueprint (`render.yaml`): `NO ENCONTRADO` (el servicio web backend se configura directamente en Render Web Services apuntando al Dockerfile).
- **Colecciones de API (Postman / Insomnia):** `NO ENCONTRADO` (no existen archivos de colección en el repositorio).

---

### A5. Entornos de Despliegue y Variables de Configuración
- **Plataformas de Despliegue:**
  - **Frontend:** Vercel (`https://clinica-gilt-iota.vercel.app`).
  - **Backend API:** Render Web Service (`https://clinica-backend-plaw.onrender.com`).
  - **Base de Datos:** Supabase Cloud PostgreSQL (instancia gestionada en la nube con pool de conexiones y SSL).
  - **Entorno Local:** Laragon en Windows con PHP 8.3 CLI y servidor web integrado.

#### Variables de Entorno de Backend (`backend/.env.example`)
Lista de variables configurables (solo nombres sin valores sensibles):
`APP_NAME`, `APP_ENV`, `APP_KEY`, `APP_DEBUG`, `APP_URL`, `FRONTEND_URL`, `APP_LOCALE`, `APP_FALLBACK_LOCALE`, `APP_FAKER_LOCALE`, `APP_MAINTENANCE_DRIVER`, `BCRYPT_ROUNDS`, `LOG_CHANNEL`, `LOG_STACK`, `LOG_DEPRECATIONS_CHANNEL`, `LOG_LEVEL`, `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`, `SESSION_DRIVER`, `SESSION_LIFETIME`, `SESSION_ENCRYPT`, `SESSION_PATH`, `SESSION_DOMAIN`, `BROADCAST_CONNECTION`, `FILESYSTEM_DISK`, `QUEUE_CONNECTION`, `CACHE_STORE`, `HORAS_ANTICIPACION_CANCELAR`, `HORAS_VENTANA_POSTERGADAS`, `MINUTOS_DURACION_TURNO`, `MEMCACHED_HOST`, `REDIS_CLIENT`, `REDIS_HOST`, `REDIS_PASSWORD`, `REDIS_PORT`, `MAIL_MAILER`, `MAIL_SCHEME`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION`, `AWS_BUCKET`, `AWS_USE_PATH_STYLE_ENDPOINT`, `VITE_APP_NAME`

#### Variables de Entorno de Frontend (`frontend/.env.example`)
Lista de variables requeridas:
`VITE_API_URL`

---

## B. Arquitectura del sistema

### B1. Árbol de Directorios Real (Máximo 3 Niveles)

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   ├── Middleware/
│   │   └── Requests/
│   ├── Models/
│   │   ├── Cita.php
│   │   ├── Permiso.php
│   │   └── Rol.php
│   ├── Nucleo/
│   │   ├── Bitacora/
│   │   ├── Errores/
│   │   ├── Permisos/
│   │   ├── Sesion/
│   │   └── Validaciones/
│   ├── Paquetes/
│   │   ├── AccesoCuentas/
│   │   ├── CatalogosHorarios/
│   │   ├── CitasNotificaciones/
│   │   ├── HistoriaClinica/
│   │   ├── PacientesPerfil/
│   │   ├── Reportes/
│   │   └── ReportesAuditoria/
│   └── Providers/
│       └── AppServiceProvider.php
├── bootstrap/
│   ├── cache/
│   │   ├── .gitignore
│   │   ├── packages.php
│   │   └── services.php
│   ├── app.php
│   └── providers.php
├── config/
│   ├── app.php
│   ├── auth.php
│   ├── cache.php
│   ├── clinica.php
│   ├── cors.php
│   ├── database.php
│   ├── filesystems.php
│   ├── logging.php
│   ├── mail.php
│   ├── queue.php
│   ├── services.php
│   └── session.php
├── database/
│   ├── factories/
│   ├── migrations/
│   │   ├── .gitkeep
│   │   ├── 2026_10_22_000000_create_initial_vida_salud_schema.php
│   │   ├── 2026_10_22_000001_create_permisos_and_rol_permiso_tables.php
│   │   ├── 2026_10_23_000001_add_nombre_normalizado_to_especialidades_table.php
│   │   ├── 2026_10_23_000002_create_pagos_cita_table_and_add_pago_to_citas.php
│   │   └── 2026_11_07_000001_add_partial_unique_index_to_citas_table.php
│   ├── seeders/
│   │   ├── Demostracion/
│   │   ├── CatalogosBaseSeeder.php
│   │   ├── DatabaseSeeder.php
│   │   ├── DatosDemostracionSeeder.php
│   │   └── PermisosSeeder.php
│   └── .gitignore
├── public/
│   ├── .htaccess
│   ├── favicon.ico
│   ├── index.php
│   └── robots.txt
├── resources/
│   ├── css/
│   │   └── app.css
│   ├── js/
│   │   └── app.js
│   └── views/
│       └── welcome.blade.php
├── routes/
│   ├── api.php
│   ├── console.php
│   └── web.php
├── storage/
│   ├── app/
│   │   ├── backups/
│   │   ├── private/
│   │   ├── public/
│   │   └── .gitignore
│   ├── framework/
│   │   ├── cache/
│   │   ├── sessions/
│   │   ├── testing/
│   │   ├── views/
│   │   └── .gitignore
│   └── logs/
│       ├── .gitignore
│       └── laravel.log
├── tests/
│   ├── Feature/
│   │   └── ExampleTest.php
│   ├── Unit/
│   │   └── ExampleTest.php
│   ├── ejecutar_20_pruebas.php
│   ├── probar_consultas_tarea5.php
│   ├── prueba_concurrencia_procesos.php
│   ├── TestCase.php
│   ├── verificar_migrate_fresh_sandbox.php
│   ├── verificar_rutas_csrf.php
│   └── verificar_seeders_sandbox.php
├── .editorconfig
├── .env
├── .env.example
├── .gitattributes
├── .gitignore
├── .npmrc
├── .phpunit.result.cache
├── artisan
├── composer.json
├── composer.lock
├── Dockerfile
├── package.json
├── phpunit.xml
├── README.md
└── vite.config.js


frontend/src/
├── assets/
│   ├── image_5a9cb4.png
│   └── qr_pago_reserva.svg
├── compartido/
│   ├── componentes/
│   │   ├── Alerta.jsx
│   │   ├── CampoSelect.jsx
│   │   ├── CampoTexto.jsx
│   │   ├── InsigniaEstado.jsx
│   │   └── SelectorBuscador.jsx
│   ├── estilos/
│   │   ├── base.css
│   │   └── variables.css
│   ├── hooks/
│   │   └── useDisponibilidadTurnos.js
│   ├── layouts/
│   │   └── LayoutPrincipal.jsx
│   └── utilidades/
│       └── api.js
├── comun/
│   ├── componentes/
│   │   ├── ChecklistContrasena.jsx
│   │   ├── RutaProtegidaPorRol.jsx
│   │   └── TablaExpandible.jsx
│   ├── hooks/
│   │   └── useInactividad.js
│   ├── HeaderSuperior.jsx
│   ├── LayoutPrincipal.jsx
│   ├── NavbarPublico.jsx
│   ├── rutasPorRol.js
│   └── Sidebar.jsx
├── Paquetes/
│   ├── AccesoCuentas/
│   │   ├── CU01_IniciarCerrarSesion/
│   │   ├── CU02_CambiarContrasena/
│   │   ├── CU03_RegistrarsePaciente/
│   │   ├── CU04_AdministrarUsuariosRoles/
│   │   └── CU26_GenerarRestaurarCopiasSeguridad/
│   ├── CatalogosHorarios/
│   │   ├── CU07_GestionarEspecialidades/
│   │   ├── CU08_GestionarMedicos/
│   │   ├── CU09_GestionarHorariosAtencion/
│   │   ├── CU10_ConsultarDisponibilidad/
│   │   └── CU11_SuspenderHorarioGestionarCitasAfectadas/
│   ├── CitasNotificaciones/
│   │   ├── CU12_GestionarCitas/
│   │   ├── CU13_RegistrarAsistenciaInasistenciaAtencion/
│   │   ├── CU14_ConsultarAgendaCitas/
│   │   ├── CU15_ConsultarHistorialSeguimientoCitas/
│   │   ├── CU16_EnviarNotificacionesRecordatorios/
│   │   └── CU27_GestionarPagosReembolsos/
│   ├── HistoriaClinica/
│   │   ├── CU17_ConsultarMisPacientes/
│   │   ├── CU18_RegistrarAtencionClinica/
│   │   ├── CU19_RegistrarResultadosLaboratorio/
│   │   └── CU20_ConsultarHistorialClinico/
│   ├── PacientesPerfil/
│   │   ├── CU05_GestionarPacientes/
│   │   └── CU06_GestionarMiPerfil/
│   └── Reportes/
│       ├── CU21_ConsultarReportesCitas/
│       ├── CU22_ConsultarReporteAsistenciaPacientes/
│       ├── CU23_ExportarReportes/
│       ├── CU24_ConsultarBitacoraAuditoria/
│       └── CU25_VisualizarDashboardAdministrativo/
├── publico/
│   ├── InicioPublico.jsx
│   └── PaginaInicio.jsx
├── App.jsx
└── main.jsx

```

---

### B2. Capas de la Arquitectura Backend

| Capa | Ubicación en el Código | Cantidad de Archivos | Ejemplo Representativo |
| :--- | :--- | :--- | :--- |
| **Rutas API** | `backend/routes/` | 3 archivos | `backend/routes/api.php` |
| **Middleware HTTP** | `backend/app/Http/Middleware/` | 1 archivo | `backend/app/Http/Middleware/CabecerasSeguridad.php` |
| **Controladores** | `backend/app/Http/Controllers/Paquetes/` | 28 archivos (27 CU + base) | `backend/app/Http/Controllers/Paquetes/CitasNotificaciones/CU12_GestionarCitas/GestionarCitasControlador.php` |
| **FormRequests** | `backend/app/Http/Requests/Paquetes/` | 18 archivos | `backend/app/Http/Requests/Paquetes/CitasNotificaciones/CU12_GestionarCitas/CrearCitaRequest.php` |
| **Servicios de Negocio** | `backend/app/Paquetes/` | 34 archivos (27 CU + 7 auxiliares/alias) | `backend/app/Paquetes/CitasNotificaciones/CU12_GestionarCitas/GestionarCitasServicio.php` |
| **Acceso a Datos** | `backend/app/Paquetes/` | Embebido en Servicios | Consultas con Query Builder (`DB::table(...)`) y transacciones atómicas (`DB::transaction(...)`) |
| **Modelos Eloquent** | `backend/app/Models/` | 3 archivos | `backend/app/Models/Cita.php`, `Permiso.php`, `Rol.php` |
| **Núcleo Transversal** | `backend/app/Nucleo/` | 5 archivos | `backend/app/Nucleo/Bitacora/ServicioBitacora.php` |

---

### B3. Rutas API (`php artisan route:list`)

| Método | URI | Controlador@Método | Middlewares |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/acceso/cambiar-contrasena` | `Paquetes\AccesoCuentas\CU02_CambiarContrasena\CambiarContrasenaControlador@cambiar` | `sesion.clinica, throttle:10,1` |
| `POST` | `/api/acceso/login` | `Paquetes\AccesoCuentas\CU01_IniciarCerrarSesion\IniciarCerrarSesionControlador@login` | `throttle:5,1` |
| `POST` | `/api/acceso/logout` | `Paquetes\AccesoCuentas\CU01_IniciarCerrarSesion\IniciarCerrarSesionControlador@logout` | `sesion.clinica` |
| `POST` | `/api/acceso/registro-paciente` | `Paquetes\AccesoCuentas\CU03_RegistrarsePaciente\RegistrarsePacienteControlador@registrar` | `throttle:10,1` |
| `GET|HEAD` | `/api/acceso/verificar` | `Paquetes\AccesoCuentas\CU01_IniciarCerrarSesion\IniciarCerrarSesionControlador@verificar` | `sesion.clinica` |
| `GET|HEAD` | `/api/admin/roles` | `Paquetes\AccesoCuentas\CU04_AdministrarUsuariosRoles\AdministrarUsuariosRolesControlador@roles` | `sesion.clinica, rol:administrador` |
| `POST` | `/api/admin/roles` | `Paquetes\AccesoCuentas\CU04_AdministrarUsuariosRoles\AdministrarUsuariosRolesControlador@crearRol` | `sesion.clinica, rol:administrador` |
| `GET|HEAD` | `/api/admin/roles/{id}/permisos` | `Paquetes\AccesoCuentas\CU04_AdministrarUsuariosRoles\AdministrarUsuariosRolesControlador@permisosRol` | `sesion.clinica, rol:administrador` |
| `PUT` | `/api/admin/roles/{id}/permisos` | `Paquetes\AccesoCuentas\CU04_AdministrarUsuariosRoles\AdministrarUsuariosRolesControlador@sincronizarPermisosRol` | `sesion.clinica, rol:administrador` |
| `GET|HEAD` | `/api/administracion/backups` | `Paquetes\AccesoCuentas\CU26_GenerarRestaurarCopiasSeguridad\GenerarRestaurarCopiasSeguridadControlador@index` | `sesion.clinica, rol:administrador` |
| `POST` | `/api/administracion/backups` | `Paquetes\AccesoCuentas\CU26_GenerarRestaurarCopiasSeguridad\GenerarRestaurarCopiasSeguridadControlador@store` | `sesion.clinica, rol:administrador, throttle:10,1` |
| `GET|HEAD` | `/api/administracion/roles` | `Paquetes\AccesoCuentas\CU04_AdministrarUsuariosRoles\AdministrarUsuariosRolesControlador@roles` | `sesion.clinica, rol:administrador` |
| `GET|HEAD` | `/api/administracion/usuarios` | `Paquetes\AccesoCuentas\CU04_AdministrarUsuariosRoles\AdministrarUsuariosRolesControlador@index` | `sesion.clinica, rol:administrador` |
| `POST` | `/api/administracion/usuarios` | `Paquetes\AccesoCuentas\CU04_AdministrarUsuariosRoles\AdministrarUsuariosRolesControlador@store` | `sesion.clinica, rol:administrador` |
| `PUT` | `/api/administracion/usuarios/{id}` | `Paquetes\AccesoCuentas\CU04_AdministrarUsuariosRoles\AdministrarUsuariosRolesControlador@update` | `sesion.clinica, rol:administrador` |
| `PATCH` | `/api/administracion/usuarios/{id}/alternar-estado` | `Paquetes\AccesoCuentas\CU04_AdministrarUsuariosRoles\AdministrarUsuariosRolesControlador@alternarEstado` | `sesion.clinica, rol:administrador` |
| `GET|HEAD` | `/api/auditoria` | `Paquetes\Reportes\CU24_ConsultarBitacoraAuditoria\ConsultarBitacoraControlador@index` | `sesion.clinica, rol:administrador` |
| `GET|HEAD` | `/api/auditoria/bitacora` | `Paquetes\Reportes\CU24_ConsultarBitacoraAuditoria\ConsultarBitacoraControlador@index` | `sesion.clinica, rol:administrador` |
| `GET|HEAD` | `/api/catalogos/disponibilidad` | `Paquetes\CatalogosHorarios\CU10_ConsultarDisponibilidad\ConsultarDisponibilidadControlador@consultar` | `sesion.clinica` |
| `POST` | `/api/catalogos/especialidades` | `Paquetes\CatalogosHorarios\CU07_GestionarEspecialidades\GestionarEspecialidadesControlador@store` | `sesion.clinica, rol:administrador` |
| `GET|HEAD` | `/api/catalogos/especialidades-publicas` | `Paquetes\CatalogosHorarios\CU07_GestionarEspecialidades\GestionarEspecialidadesControlador@index` | `-` |
| `PUT` | `/api/catalogos/especialidades/{id}` | `Paquetes\CatalogosHorarios\CU07_GestionarEspecialidades\GestionarEspecialidadesControlador@update` | `sesion.clinica, rol:administrador` |
| `PATCH` | `/api/catalogos/especialidades/{id}/alternar-estado` | `Paquetes\CatalogosHorarios\CU07_GestionarEspecialidades\GestionarEspecialidadesControlador@alternarEstado` | `sesion.clinica, rol:administrador` |
| `GET|HEAD` | `/api/catalogos/horarios` | `Paquetes\CatalogosHorarios\CU09_GestionarHorariosAtencion\GestionarHorariosAtencionControlador@index` | `sesion.clinica, rol:administrador` |
| `POST` | `/api/catalogos/horarios` | `Paquetes\CatalogosHorarios\CU09_GestionarHorariosAtencion\GestionarHorariosAtencionControlador@store` | `sesion.clinica, rol:administrador` |
| `PUT` | `/api/catalogos/horarios/{id}` | `Paquetes\CatalogosHorarios\CU09_GestionarHorariosAtencion\GestionarHorariosAtencionControlador@update` | `sesion.clinica, rol:administrador` |
| `PATCH` | `/api/catalogos/horarios/{id}/alternar-estado` | `Paquetes\CatalogosHorarios\CU09_GestionarHorariosAtencion\GestionarHorariosAtencionControlador@alternarEstado` | `sesion.clinica, rol:administrador` |
| `POST` | `/api/catalogos/medicos` | `Paquetes\CatalogosHorarios\CU08_GestionarMedicos\GestionarMedicosControlador@store` | `sesion.clinica, rol:administrador` |
| `GET|HEAD` | `/api/catalogos/medicos-publicos` | `Paquetes\CatalogosHorarios\CU08_GestionarMedicos\GestionarMedicosControlador@index` | `-` |
| `PUT` | `/api/catalogos/medicos/{id}` | `Paquetes\CatalogosHorarios\CU08_GestionarMedicos\GestionarMedicosControlador@update` | `sesion.clinica, rol:administrador` |
| `PATCH` | `/api/catalogos/medicos/{id}/alternar-estado` | `Paquetes\CatalogosHorarios\CU08_GestionarMedicos\GestionarMedicosControlador@alternarEstado` | `sesion.clinica, rol:administrador` |
| `GET|HEAD` | `/api/catalogos/suspensiones` | `Paquetes\CatalogosHorarios\CU11_SuspenderHorarioGestionarCitasAfectadas\SuspenderHorarioControlador@index` | `sesion.clinica, rol:administrador,recepcionista` |
| `POST` | `/api/catalogos/suspensiones` | `Paquetes\CatalogosHorarios\CU11_SuspenderHorarioGestionarCitasAfectadas\SuspenderHorarioControlador@store` | `sesion.clinica, rol:administrador,recepcionista` |
| `GET|HEAD` | `/api/catalogos/suspensiones/citas-postergadas` | `Paquetes\CatalogosHorarios\CU11_SuspenderHorarioGestionarCitasAfectadas\SuspenderHorarioControlador@citasPostergadas` | `sesion.clinica, rol:administrador,recepcionista` |
| `POST` | `/api/catalogos/suspensiones/reubicar-cita` | `Paquetes\CatalogosHorarios\CU11_SuspenderHorarioGestionarCitasAfectadas\SuspenderHorarioControlador@reubicar` | `sesion.clinica, rol:administrador,recepcionista` |
| `DELETE` | `/api/catalogos/suspensiones/{id}` | `Paquetes\CatalogosHorarios\CU11_SuspenderHorarioGestionarCitasAfectadas\SuspenderHorarioControlador@destroy` | `sesion.clinica, rol:administrador,recepcionista` |
| `GET|HEAD` | `/api/citas` | `Paquetes\CitasNotificaciones\CU12_GestionarCitas\GestionarCitasControlador@index` | `sesion.clinica` |
| `POST` | `/api/citas` | `Paquetes\CitasNotificaciones\CU12_GestionarCitas\GestionarCitasControlador@store` | `sesion.clinica, throttle:60,1` |
| `GET|HEAD` | `/api/citas/agenda` | `Paquetes\CitasNotificaciones\CU14_ConsultarAgendaCitas\ConsultarAgendaCitasControlador@index` | `sesion.clinica` |
| `GET|HEAD` | `/api/citas/historial` | `Paquetes\CitasNotificaciones\CU15_ConsultarHistorialSeguimientoCitas\HistorialSeguimientoCitasControlador@index` | `sesion.clinica` |
| `GET|HEAD` | `/api/citas/{id}` | `Paquetes\CitasNotificaciones\CU12_GestionarCitas\GestionarCitasControlador@show` | `sesion.clinica` |
| `PUT` | `/api/citas/{id}/asistencia` | `Paquetes\CitasNotificaciones\CU13_RegistrarAsistenciaInasistenciaAtencion\RegistrarAsistenciaControlador@registrar` | `sesion.clinica, rol:administrador,recepcionista,medico` |
| `PUT` | `/api/citas/{id}/cancelar` | `Paquetes\CitasNotificaciones\CU12_GestionarCitas\GestionarCitasControlador@cancelar` | `sesion.clinica, throttle:60,1` |
| `PUT` | `/api/citas/{id}/confirmar` | `Paquetes\CitasNotificaciones\CU12_GestionarCitas\GestionarCitasControlador@confirmar` | `sesion.clinica, throttle:60,1` |
| `PUT` | `/api/citas/{id}/reprogramar` | `Paquetes\CitasNotificaciones\CU12_GestionarCitas\GestionarCitasControlador@reprogramar` | `sesion.clinica, throttle:60,1` |
| `GET|HEAD` | `/api/dashboard/metricas` | `Paquetes\Reportes\CU25_VisualizarDashboardAdministrativo\DashboardAdministrativoControlador@index` | `sesion.clinica, rol:administrador` |
| `POST` | `/api/historia-clinica/atenciones` | `Paquetes\HistoriaClinica\CU18_RegistrarAtencionClinica\RegistrarAtencionClinicaControlador@store` | `sesion.clinica, rol:administrador,medico, throttle:60,1` |
| `GET|HEAD` | `/api/historia-clinica/atenciones/cita/{idCita}` | `Paquetes\HistoriaClinica\CU18_RegistrarAtencionClinica\RegistrarAtencionClinicaControlador@showPorCita` | `sesion.clinica, rol:administrador,medico` |
| `POST` | `/api/historia-clinica/laboratorios` | `Paquetes\HistoriaClinica\CU19_RegistrarResultadosLaboratorio\ResultadosLaboratorioControlador@store` | `sesion.clinica, rol:administrador,medico, throttle:60,1` |
| `GET|HEAD` | `/api/historia-clinica/laboratorios` | `Paquetes\HistoriaClinica\CU19_RegistrarResultadosLaboratorio\ResultadosLaboratorioControlador@index` | `sesion.clinica, rol:administrador,medico` |
| `GET|HEAD` | `/api/historia-clinica/mis-pacientes` | `Paquetes\HistoriaClinica\CU17_ConsultarMisPacientes\ConsultarMisPacientesControlador@index` | `sesion.clinica, rol:administrador,medico` |
| `GET|HEAD` | `/api/historia-clinica/pacientes/{idPaciente}` | `Paquetes\HistoriaClinica\CU20_ConsultarHistorialClinico\ConsultarHistorialClinicoControlador@show` | `sesion.clinica` |
| `GET|HEAD` | `/api/notificaciones` | `Paquetes\CitasNotificaciones\CU16_EnviarNotificacionesRecordatorios\EnviarNotificacionesControlador@index` | `sesion.clinica` |
| `POST` | `/api/notificaciones/disparar-recordatorios` | `Paquetes\CitasNotificaciones\CU16_EnviarNotificacionesRecordatorios\EnviarNotificacionesControlador@dispararRecordatorios` | `sesion.clinica, rol:administrador,recepcionista` |
| `PUT` | `/api/notificaciones/leer-todas` | `Paquetes\CitasNotificaciones\CU16_EnviarNotificacionesRecordatorios\EnviarNotificacionesControlador@marcarTodasLeidas` | `sesion.clinica` |
| `PUT` | `/api/notificaciones/{id}/leida` | `Paquetes\CitasNotificaciones\CU16_EnviarNotificacionesRecordatorios\EnviarNotificacionesControlador@marcarLeida` | `sesion.clinica` |
| `GET|HEAD` | `/api/pacientes` | `Paquetes\PacientesPerfil\CU05_GestionarPacientes\GestionarPacientesControlador@index` | `sesion.clinica, rol:administrador,recepcionista` |
| `POST` | `/api/pacientes` | `Paquetes\PacientesPerfil\CU05_GestionarPacientes\GestionarPacientesControlador@store` | `sesion.clinica, rol:administrador,recepcionista` |
| `GET|HEAD` | `/api/pacientes/{id}` | `Paquetes\PacientesPerfil\CU05_GestionarPacientes\GestionarPacientesControlador@show` | `sesion.clinica, rol:administrador,recepcionista` |
| `PUT` | `/api/pacientes/{id}` | `Paquetes\PacientesPerfil\CU05_GestionarPacientes\GestionarPacientesControlador@update` | `sesion.clinica, rol:administrador,recepcionista` |
| `PATCH` | `/api/pacientes/{id}/alternar-estado` | `Paquetes\PacientesPerfil\CU05_GestionarPacientes\GestionarPacientesControlador@alternarEstado` | `sesion.clinica, rol:administrador,recepcionista` |
| `GET|HEAD` | `/api/pagos/cita/{id_cita}` | `Paquetes\CitasNotificaciones\CU27_GestionarPagosReembolsos\GestionarPagosReembolsosControlador@consultarPorCita` | `sesion.clinica` |
| `POST` | `/api/pagos/garantia` | `Paquetes\CitasNotificaciones\CU27_GestionarPagosReembolsos\GestionarPagosReembolsosControlador@procesarPago` | `sesion.clinica, throttle:60,1` |
| `POST` | `/api/pagos/{id_cita}/reembolso` | `Paquetes\CitasNotificaciones\CU27_GestionarPagosReembolsos\GestionarPagosReembolsosControlador@procesarReembolso` | `sesion.clinica, throttle:60,1` |
| `GET|HEAD` | `/api/perfil` | `Paquetes\PacientesPerfil\CU06_GestionarMiPerfil\GestionarMiPerfilControlador@show` | `sesion.clinica` |
| `PUT` | `/api/perfil` | `Paquetes\PacientesPerfil\CU06_GestionarMiPerfil\GestionarMiPerfilControlador@update` | `sesion.clinica, throttle:30,1` |
| `GET|HEAD` | `/api/perfil/mi-perfil` | `Paquetes\PacientesPerfil\CU06_GestionarMiPerfil\GestionarMiPerfilControlador@show` | `sesion.clinica` |
| `PUT` | `/api/perfil/mi-perfil` | `Paquetes\PacientesPerfil\CU06_GestionarMiPerfil\GestionarMiPerfilControlador@update` | `sesion.clinica, throttle:30,1` |
| `GET|HEAD` | `/api/reportes/asistencia` | `Paquetes\Reportes\CU22_ConsultarReporteAsistenciaPacientes\ReporteAsistenciaControlador@index` | `sesion.clinica, rol:administrador` |
| `GET|HEAD` | `/api/reportes/citas` | `Paquetes\Reportes\CU21_ConsultarReportesCitas\ReportesCitasControlador@index` | `sesion.clinica, rol:administrador, rol:administrador,recepcionista` |
| `GET|HEAD` | `/api/reportes/dashboard` | `Paquetes\Reportes\CU25_VisualizarDashboardAdministrativo\DashboardAdministrativoControlador@index` | `sesion.clinica, rol:administrador` |
| `GET|HEAD` | `/api/reportes/exportar` | `Paquetes\Reportes\CU23_ExportarReportes\ExportarReportesControlador@exportar` | `sesion.clinica, rol:administrador` |
| `GET|HEAD` | `/api/salud` | `Closure` | `-` |
| `GET|HEAD` | `/api/seguridad/backups` | `Paquetes\AccesoCuentas\CU26_GenerarRestaurarCopiasSeguridad\GenerarRestaurarCopiasSeguridadControlador@index` | `sesion.clinica, rol:administrador` |
| `POST` | `/api/seguridad/backups` | `Paquetes\AccesoCuentas\CU26_GenerarRestaurarCopiasSeguridad\GenerarRestaurarCopiasSeguridadControlador@store` | `sesion.clinica, rol:administrador, throttle:10,1` |
| `GET|HEAD` | `/api/seguridad/backups/{id}/descargar` | `Paquetes\AccesoCuentas\CU26_GenerarRestaurarCopiasSeguridad\GenerarRestaurarCopiasSeguridadControlador@descargar` | `sesion.clinica, rol:administrador` |
| `POST` | `/api/seguridad/backups/{id}/restaurar` | `Paquetes\AccesoCuentas\CU26_GenerarRestaurarCopiasSeguridad\GenerarRestaurarCopiasSeguridadControlador@restaurar` | `sesion.clinica, rol:administrador, throttle:5,1` |

---

### B4. Middleware y Seguridad
Los middlewares personalizados se registran en `backend/bootstrap/app.php`:

1. **`CabecerasSeguridad` (`App\Http\Middleware\CabecerasSeguridad`):**
   - *Registro:* Global (`$middleware->append(...)`).
   - *Función:* Inyecta cabeceras HTTP de protección OWASP Top 10 (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`).
2. **`ManejadorSesion` (`App\Nucleo\Sesion\ManejadorSesion`):**
   - *Registro:* Alias `sesion.clinica`.
   - *Función:* Inspecciona el token Bearer en el encabezado `Authorization` (o la cookie `token_clinica`), autentica contra el registro `usuarios.token_sesion` en la base de datos e inyecta el objeto `usuario_autenticado` en la petición.
3. **`MiddlewareVerificarRol` (`App\Nucleo\Permisos\MiddlewareVerificarRol`):**
   - *Registro:* Alias `rol`.
   - *Función:* Restringe el acceso a la ruta según el rol del usuario autenticado (ej. `rol:administrador,medico`), con bypass permanente e irrestricto para el rol `administrador`.

> **Mecanismo Real de Autenticación de Sesión:**  
> El sistema **no utiliza Laravel Sanctum ni Laravel Passport**. La autenticación se realiza mediante tokens criptográficos Bearer únicos (generados con `bin2hex(random_bytes(32))`) almacenados directamente en la columna `usuarios.token_sesion` de la tabla `usuarios`. El frontend almacena dicho token en `localStorage.getItem('token_clinica')` y lo envía en el encabezado HTTP `Authorization: Bearer <token>`. La API soporta también una cookie `token_clinica` como fallback de transporte.

---

### B5. Componentes Transversales (`app/Nucleo/`)

1. **`ServicioBitacora.php` (`App\Nucleo\Bitacora`):**  
   Registra eventos inmutables de auditoría en la tabla `bitacora_auditoria` (CU-24 / RN21), normalizando payloads en JSONB, extrayendo IP de origen (con soporte para proxies de Render/Cloudflare) y aislando la inserción de transacciones fallidas.
2. **`RespuestaApi.php` (`App\Nucleo\Errores`):**  
   Estandariza los esquemas de respuesta JSON para toda la aplicación mediante los métodos estáticos `exito($datos, $mensaje, $codigo)`, `error($mensaje, $codigo, $errores)` y `validacion($errores, $mensaje)`.
3. **`ManejadorSesion.php` (`App\Nucleo\Sesion`):**  
   Middleware interceptor que valida el token Bearer en la tabla `usuarios`, verifica el estado `activo` y vincula automáticamente las identidades de `id_medico` o `id_paciente` al contexto de la solicitud.
4. **`MiddlewareVerificarRol.php` (`App\Nucleo\Permisos`):**  
   Middleware de autorización basada en roles (RBAC) que contrasta el rol del usuario contra la lista de roles autorizados en la definición de la ruta.
5. **`FormRequestPersonalizado.php` (`App\Nucleo\Validaciones`):**  
   Clase base abstracta para todas las peticiones validadas; aplica sanitización recursiva anti-XSS (`strip_tags`) en `prepareForValidation()` y unifica el manejo de errores arrojando excepciones en formato JSON 422.

---

### B6. Arquitectura Frontend (React 19)

#### Enrutamiento Central (`frontend/src/App.jsx`)
| Ruta Frontend | Componente Renderizado | Roles Permitidos |
| :--- | :--- | :--- |
| `/` | `PaginaInicio` | Público |
| `/login` | `IniciarSesion` | Público |
| `/login/paciente` | `LoginPaciente` | Público |
| `/login/personal` | `LoginPersonal` | Público |
| `/registro-paciente` | `PaginaRegistroPaciente` | Público |
| `/paciente/mis-citas` | `PaginaHistorialCitas` | `paciente` |
| `/paciente/reservar` | `PaginaReservaCitas` | `paciente` |
| `/paciente/historial` | `PaginaHistorialClinico` | `paciente` |
| `/paciente/perfil` | `PaginaMiPerfil` | `paciente` |
| `/medico/agenda` | `PaginaAgendaCitas` | `medico` |
| `/medico/pacientes` | `PaginaKardexPacientes` | `medico` |
| `/medico/pacientes/:idPaciente` | `PaginaHistorialClinico` | `medico`, `administrador` |
| `/medico/atenciones` | `PaginaHistorialClinico` | `medico` |
| `/medico/atenciones/:idPaciente` | `PaginaHistorialClinico` | `medico`, `administrador` |
| `/medico/laboratorio` | `PaginaHistorialClinico` | `medico` |
| `/medico/laboratorio/:idPaciente` | `PaginaHistorialClinico` | `medico`, `administrador` |
| `/recepcion/citas` | `PaginaAgendaCitas` | `recepcionista`, `administrador` |
| `/recepcion/agendar` | `PaginaReservaCitas` | `recepcionista`, `administrador` |
| `/recepcion/pacientes` | `PaginaGestionPacientes` | `recepcionista`, `administrador` |
| `/recepcion/suspensiones` | `PaginaSuspensiones` | `recepcionista`, `administrador` |
| `/recepcion/reportes` | `PaginaReportes` | `recepcionista`, `administrador` |
| `/admin/dashboard` | `PaginaDashboard` | `administrador` |
| `/admin/especialidades` | `PaginaEspecialidades` | `administrador` |
| `/admin/medicos` | `PaginaMedicos` | `administrador` |
| `/admin/horarios` | `PaginaHorarios` | `administrador` |
| `/admin/suspensiones` | `PaginaSuspensiones` | `administrador` |
| `/admin/citas` | `PaginaAgendaCitas` | `administrador` |
| `/admin/pacientes` | `PaginaGestionPacientes` | `administrador` |
| `/admin/usuarios` | `PaginaUsuariosRoles` | `administrador` |
| `/admin/bitacora` | `PaginaBitacora` | `administrador` |
| `/admin/respaldos` | `PaginaCopiasSeguridad` | `administrador` |
| `/admin/reportes` | `PaginaReportes` | `administrador` |
| `/cuenta/cambiar-contrasena`| `PaginaCambiarContrasena` | Todos los roles autenticados |
| `/historia-clinica/atencion/:idCita`| `FormularioAtencionClinica`| `medico` |
| `*` | `PaginaNoEncontrada` | Público (404) |

#### Guardia de Seguridad (`RutaProtegidaPorRol.jsx`)
Ejecuta validación en dos fases:
1. **Autenticación:** Comprueba la presencia de `token_clinica` y `usuario_clinica` en `localStorage`. Si no existen o están corruptos, purga el almacenamiento y redirige a `/login`.
2. **Autorización Estricta (RN12):** Comprueba si el rol del usuario está incluido en `rolesPermitidos`. Si no lo está, almacena un mensaje explicativo en `sessionStorage` y redirige automáticamente al usuario a su portal correspondiente (`/paciente/mis-citas`, `/medico/agenda`, `/recepcion/citas`, `/admin/dashboard`), impidiendo el renderizado del componente protegido bajo cualquier circunstancia.

#### Interceptor HTTP (`api.js`)
- **Peticiones:** Inyecta automáticamente el encabezado `Authorization: Bearer <token_clinica>` si existe en `localStorage` y normaliza el prefijo `/api`.
- **Respuestas 401 (Unauthorized):** P识e el token revocado/expirado de `localStorage` y fuerza la redirección a `/login?motivo=sesion_expirada`.
- **Respuestas 403 (Forbidden):** Registra una alerta institucional en `sessionStorage` y redirige a la ruta principal del rol para evitar navegación no autorizada (Anti-IDOR).
- **Respuestas 422 (Unprocessable Entity):** Retorna la promesa rechazada (`Promise.reject(error)`) para que el formulario solicitante capture los mensajes específicos del backend en `error.response.data.errores`.

#### Hooks y Componentes Compartidos
- `useInactividad.js`: Temporizador de 15 minutos que escucha eventos de usuario (`mousemove`, `keydown`, `click`) y ejecuta el cierre de sesión automático tras inactividad prolongada.
- `useDisponibilidadTurnos.js`: Hook reactivo que consulta turnos libres en intervalos de 15 minutos, filtra turnos ocupados y deselecciona de forma segura ante colisiones.
- `TablaExpandible.jsx`: Tabla responsive con patrón acordeón mobile-first que elimina el scroll horizontal en dispositivos móviles.
- `ChecklistContrasena.jsx`: Validador en tiempo real de los 5 requisitos de seguridad de contraseñas (longitud, mayúsculas, minúsculas, números, caracteres especiales).

#### Gestión del Estado
- **Gestión Global:** `NO ENCONTRADO` (no se utiliza Redux, Zustand ni React Context global).
- **Mecanismo Real:** El estado se gestiona de forma local y desacoplada mediante hooks de React (`useState`, `useEffect`, `useCallback`, `useRef`), persistencia en `localStorage` / `sessionStorage` y sincronización de sesión entre pestañas mediante el evento `window.addEventListener('storage', ...)` en `App.jsx`.

---

### B7. Base de Datos (PostgreSQL)

#### Migraciones Reales (Orden Cronológico)
1. `2026_10_22_000000_create_initial_vida_salud_schema.php`: Crea las 20 tablas maestras iniciales del sistema.
2. `2026_10_22_000001_create_permisos_and_rol_permiso_tables.php`: Crea `permisos`, `rol_permiso` y agrega la columna `reservable_en_linea` a `especialidades`.
3. `2026_10_23_000001_add_nombre_normalizado_to_especialidades_table.php`: Agrega `nombre_normalizado` con índice único a `especialidades`.
4. `2026_10_23_000002_create_pagos_cita_table_and_add_pago_to_citas.php`: Crea la tabla `pagos_cita` y agrega columnas `id_pago` y `pago_confirmado` a `citas`.
5. `2026_11_07_000001_add_partial_unique_index_to_citas_table.php`: Crea el índice único parcial `uq_citas_turno_activo` sobre citas activas en PostgreSQL.

#### Tablas Físicas Creadas (23 Tablas)
`roles`, `personas`, `usuarios`, `pacientes`, `informacion_medica_paciente`, `contactos_emergencia`, `medicos`, `especialidades`, `medico_especialidad`, `horarios_atencion`, `bloqueos_clinica`, `suspensiones_horario`, `estados_cita`, `citas`, `notificaciones`, `atenciones_clinicas`, `resultados_laboratorio`, `bitacora_auditoria`, `copias_seguridad`, `parametros_sistema`, `permisos`, `rol_permiso`, `pagos_cita`.

#### Índices Únicos y Restricciones Notables
- `uq_citas_turno_activo` en `citas (id_medico, fecha_cita, hora_inicio)` condicionado a `WHERE estado != 'cancelada' AND es_postergada = false AND id_estado_cita NOT IN (cancelada, postergada)`.
- `especialidades_nombre_normalizado_unique` en `especialidades (nombre_normalizado)`.
- `citas_codigo_cita_unique` en `citas (codigo_cita)`.
- Restricciones foráneas con `onDelete('restrict')` en todas las entidades clínicas para impedir borrados físicos accidentales.

#### Seeders Existentes
- `DatabaseSeeder.php`: Invocador central.
- `CatalogosBaseSeeder.php`: Roles maestros, 9 estados de cita y parámetros del sistema.
- `PermisosSeeder.php`: Catálogo de permisos del sistema y asignación al rol administrador.
- `DatosDemostracionSeeder.php`: Orquestador de datos de prueba demostrativos.
- Módulos en `database/seeders/Demostracion/`: `AccesoDemoSeeder.php`, `BitacoraAuditoriaDemoSeeder.php`, `CatalogosHorariosDemoSeeder.php`, `CitasDemoSeeder.php`, `HistoriaClinicaDemoSeeder.php`, `PacientesDemoSeeder.php`, `SuspensionesNotificacionesDemoSeeder.php`.

---

### B8. Comunicación entre Capas — Recorrido Completo de una Petición ("Reservar Cita", CU-12)

```
[Componente React] PaginaReservaCitas.jsx
       │ (procesarPagoYConfirmar, líneas 104-174)
       ▼
[Cliente HTTP] api.js
       │ (interceptors.request: inyecta Authorization: Bearer <token_clinica>)
       ▼
[Definición de Ruta] routes/api.php
       │ (POST api/citas -> GestionarCitasControlador@store, middleware 'sesion.clinica')
       ▼
[Middleware Global] CabecerasSeguridad.php
       │ (handle: inyecta X-Frame-Options, nosniff, CSP)
       ▼
[Middleware de Sesión] ManejadorSesion.php
       │ (handle: valida token_sesion en tabla usuarios, resuelve id_paciente)
       ▼
[FormRequest] CrearCitaRequest.php
       │ (prepareForValidation sanitiza anti-XSS; rules valida médico, horario, pago)
       ▼
[Controlador] GestionarCitasControlador.php
       │ (store, línea 54: invoca GestionarCitasServicio->crear)
       ▼
[Servicio de Negocio] GestionarCitasServicio.php
       │ (crear, líneas 21-125: DB::transaction, bloqueo lockForUpdate() en citas)
       │ ──> Inserta en tabla 'citas'
       │ ──> Inserta en tabla 'pagos_cita'
       │ ──> Inserta en tabla 'notificaciones'
       ▼
[Auditoría Inmutable] ServicioBitacora.php
       │ (registrar: inserta evento 'CREAR_CITA' en tabla bitacora_auditoria)
       ▼
[Respuesta Estandarizada] RespuestaApi.php
       │ (exito: retorna JsonResponse HTTP 201 con { exito: true, datos: { ... } })
       ▼
[Componente React] PaginaReservaCitas.jsx
         (Recibe respuesta, oculta pasarela y renderiza ComprobanteDigitalTransaccion)
```

---

## C. Subsistemas

### 1. Paquete `AccesoCuentas`
| Aspecto | Implementación Real |
| :--- | :--- |
| **Casos de Uso** | CU-01 (`CU01_IniciarCerrarSesion`), CU-02 (`CU02_CambiarContrasena`), CU-03 (`CU03_RegistrarsePaciente`), CU-04 (`CU04_AdministrarUsuariosRoles`), CU-26 (`CU26_GenerarRestaurarCopiasSeguridad`) |
| **Controladores** | `IniciarCerrarSesionControlador.php`, `CambiarContrasenaControlador.php`, `RegistrarsePacienteControlador.php`, `AdministrarUsuariosRolesControlador.php`, `GenerarRestaurarCopiasSeguridadControlador.php` |
| **FormRequests** | `IniciarSesionRequest.php`, `CambiarContrasenaRequest.php`, `RegistrarsePacienteRequest.php`, `GuardarUsuarioRequest.php` |
| **Servicios** | `IniciarCerrarSesionServicio.php`, `CambiarContrasenaServicio.php`, `RegistrarsePacienteServicio.php`, `AdministrarUsuariosRolesServicio.php`, `GenerarRestaurarCopiasSeguridadServicio.php` |
| **Componentes React** | `IniciarSesion.jsx`, `LoginPaciente.jsx`, `LoginPersonal.jsx`, `ModalRecuperarPassword.jsx`, `PaginaLogin.jsx`, `SelectorPerfilLogin.jsx`, `ModalCambiarContrasena.jsx`, `PaginaCambiarContrasena.jsx`, `PaginaRegistroPaciente.jsx`, `MatrizRolesPermisos.jsx`, `ModalNuevoRol.jsx`, `PaginaUsuariosRoles.jsx`, `PaginaCopiasSeguridad.jsx` |
| **Endpoints Expuestos** | `POST /api/acceso/login`, `POST /api/acceso/logout`, `GET /api/acceso/verificar`, `POST /api/acceso/cambiar-contrasena`, `POST /api/acceso/registro-paciente`, `GET|POST /api/admin/roles`, `GET|PUT /api/admin/roles/{id}/permisos`, `GET|POST|PUT|PATCH /api/administracion/usuarios`, `GET|POST /api/administracion/backups`, `GET|POST /api/seguridad/backups/{id}/*` |
| **Tablas Leídas / Escritas** | `usuarios`, `roles`, `personas`, `pacientes`, `medicos`, `informacion_medica_paciente`, `permisos`, `rol_permiso`, `copias_seguridad` |
| **Dependencias hacia Otros Paquetes** | Ninguna directa en código (paquete base independiente). |
| **Líneas de Código Aprox.** | Controladores: ~363 líneas | FormRequests: ~174 líneas | Servicios: ~1065 líneas | Frontend: ~6432 líneas |

---

### 2. Paquete `PacientesPerfil`
| Aspecto | Implementación Real |
| :--- | :--- |
| **Casos de Uso** | CU-05 (`CU05_GestionarPacientes`), CU-06 (`CU06_GestionarMiPerfil`) |
| **Controladores** | `GestionarPacientesControlador.php`, `GestionarMiPerfilControlador.php` |
| **FormRequests** | `GuardarPacienteRequest.php`, `ActualizarPerfilRequest.php` |
| **Servicios** | `GestionarPacientesServicio.php`, `GestionarMiPerfilServicio.php` |
| **Componentes React** | `ModalFichaPaciente.jsx`, `PaginaGestionPacientes.jsx`, `MiPerfil.jsx`, `PaginaMiPerfil.jsx` |
| **Endpoints Expuestos** | `GET|POST|PUT|PATCH /api/pacientes`, `GET|PUT /api/perfil`, `GET|PUT /api/perfil/mi-perfil` |
| **Tablas Leídas / Escritas** | `pacientes`, `personas`, `informacion_medica_paciente`, `contactos_emergencia`, `roles`, `usuarios`, `medicos` |
| **Dependencias hacia Otros Paquetes** | Ninguna directa en código (acceso desacoplado mediante base de datos). |
| **Líneas de Código Aprox.** | Controladores: ~128 líneas | FormRequests: ~98 líneas | Servicios: ~431 líneas | Frontend: ~2131 líneas |

---

### 3. Paquete `CatalogosHorarios`
| Aspecto | Implementación Real |
| :--- | :--- |
| **Casos de Uso** | CU-07 (`CU07_GestionarEspecialidades`), CU-08 (`CU08_GestionarMedicos`), CU-09 (`CU09_GestionarHorariosAtencion`), CU-10 (`CU10_ConsultarDisponibilidad`), CU-11 (`CU11_SuspenderHorarioGestionarCitasAfectadas`) |
| **Controladores** | `GestionarEspecialidadesControlador.php`, `GestionarMedicosControlador.php`, `GestionarHorariosAtencionControlador.php`, `ConsultarDisponibilidadControlador.php`, `SuspenderHorarioControlador.php` |
| **FormRequests** | `GuardarEspecialidadRequest.php`, `GuardarMedicoRequest.php`, `GuardarHorarioRequest.php`, `ConsultarDisponibilidadRequest.php`, `ReubicarCitaPostergadaRequest.php`, `SuspenderHorarioRequest.php` |
| **Servicios** | `GestionarEspecialidadesServicio.php`, `GestionarMedicosServicio.php`, `GestionarHorariosAtencionServicio.php`, `ConsultarDisponibilidadServicio.php`, `SuspenderHorarioServicio.php` |
| **Componentes React** | `PaginaEspecialidades.jsx`, `PaginaMedicos.jsx`, `ModalHorario.jsx`, `PaginaHorarios.jsx`, `SelectorDisponibilidadTurnos.jsx`, `useDisponibilidadTurnos.js`, `ModalNuevaSuspension.jsx`, `ModalReubicarCita.jsx`, `PaginaSuspensiones.jsx` |
| **Endpoints Expuestos** | `POST|PUT|PATCH /api/catalogos/especialidades`, `GET /api/catalogos/especialidades-publicas`, `POST|PUT|PATCH /api/catalogos/medicos`, `GET /api/catalogos/medicos-publicos`, `GET|POST|PUT|PATCH /api/catalogos/horarios`, `GET /api/catalogos/disponibilidad`, `GET|POST|DELETE /api/catalogos/suspensiones`, `GET /api/catalogos/suspensiones/citas-postergadas`, `POST /api/catalogos/suspensiones/reubicar-cita` |
| **Tablas Leídas / Escritas** | `especialidades`, `medicos`, `medico_especialidad`, `horarios_atencion`, `bloqueos_clinica`, `suspensiones_horario`, `citas`, `estados_cita`, `usuarios`, `pacientes`, `personas` |
| **Dependencias hacia Otros Paquetes** | `CatalogosHorarios` → `CitasNotificaciones`: `SuspenderHorarioServicio.php` invoca `EnviarNotificacionesServicio` para notificar a pacientes postergados tras suspender horario. |
| **Líneas de Código Aprox.** | Controladores: ~323 líneas | FormRequests: ~295 líneas | Servicios: ~1265 líneas | Frontend: ~4842 líneas |

---

### 4. Paquete `CitasNotificaciones`
| Aspecto | Implementación Real |
| :--- | :--- |
| **Casos de Uso** | CU-12 (`CU12_GestionarCitas`), CU-13 (`CU13_RegistrarAsistenciaInasistenciaAtencion`), CU-14 (`CU14_ConsultarAgendaCitas`), CU-15 (`CU15_ConsultarHistorialSeguimientoCitas`), CU-16 (`CU16_EnviarNotificacionesRecordatorios`), CU-27 (`CU27_GestionarPagosReembolsos`) |
| **Controladores** | `GestionarCitasControlador.php`, `RegistrarAsistenciaControlador.php`, `ConsultarAgendaCitasControlador.php`, `HistorialSeguimientoCitasControlador.php`, `EnviarNotificacionesControlador.php`, `GestionarPagosReembolsosControlador.php` |
| **FormRequests** | `CrearCitaRequest.php`, `ReprogramarCitaRequest.php`, `RegistrarAsistenciaRequest.php`, `ProcesarPagoRequest.php` |
| **Servicios** | `GestionarCitasServicio.php`, `RegistrarAsistenciaServicio.php`, `ConsultarAgendaCitasServicio.php`, `HistorialSeguimientoCitasServicio.php`, `EnviarNotificacionesServicio.php`, `GestionarPagosReembolsosServicio.php` |
| **Componentes React** | `ModalReprogramarCita.jsx`, `PaginaReservaCitas.jsx`, `PaginaAgendaCitas.jsx`, `VistaSemanalAgenda.jsx`, `PaginaHistorialCitas.jsx`, `CampanaNotificaciones.jsx`, `ComprobanteDigitalTransaccion.jsx`, `InsigniaEstadoPago.jsx`, `ModalPasarelaPagoSimulada.jsx` |
| **Endpoints Expuestos** | `GET|POST /api/citas`, `GET /api/citas/{id}`, `PUT /api/citas/{id}/confirmar`, `PUT /api/citas/{id}/cancelar`, `PUT /api/citas/{id}/reprogramar`, `PUT /api/citas/{id}/asistencia`, `GET /api/citas/agenda`, `GET /api/citas/historial`, `GET|PUT /api/notificaciones`, `POST /api/notificaciones/disparar-recordatorios`, `GET|POST /api/pagos/cita/{id_cita}`, `POST /api/pagos/garantia`, `POST /api/pagos/{id_cita}/reembolso` |
| **Tablas Leídas / Escritas** | `citas`, `estados_cita`, `notificaciones`, `pagos_cita`, `parametros_sistema`, `horarios_atencion`, `bloqueos_clinica`, `suspensiones_horario`, `medicos`, `pacientes`, `especialidades`, `personas`, `usuarios`, `roles` |
| **Dependencias hacia Otros Paquetes** | Consulta tablas maestras de `CatalogosHorarios` y `PacientesPerfil` mediante Query Builder sin acoplamiento de clases. |
| **Líneas de Código Aprox.** | Controladores: ~498 líneas | FormRequests: ~152 líneas | Servicios: ~1353 líneas | Frontend: ~4072 líneas |

---

### 5. Paquete `HistoriaClinica`
| Aspecto | Implementación Real |
| :--- | :--- |
| **Casos de Uso** | CU-17 (`CU17_ConsultarMisPacientes`), CU-18 (`CU18_RegistrarAtencionClinica`), CU-19 (`CU19_RegistrarResultadosLaboratorio`), CU-20 (`CU20_ConsultarHistorialClinico`) |
| **Controladores** | `ConsultarMisPacientesControlador.php`, `RegistrarAtencionClinicaControlador.php`, `ResultadosLaboratorioControlador.php`, `ConsultarHistorialClinicoControlador.php` |
| **FormRequests** | `RegistrarAtencionRequest.php`, `RegistrarLaboratorioRequest.php` |
| **Servicios** | `ConsultarMisPacientesServicio.php`, `RegistrarAtencionClinicaServicio.php` (con alias `RegistrarAtencionServicio.php`), `ResultadosLaboratorioServicio.php` (con alias `RegistrarResultadosLabServicio.php`), `ConsultarHistorialClinicoServicio.php` |
| **Componentes React** | `PaginaKardexPacientes.jsx`, `FormularioAtencionClinica.jsx`, `ModalResultadosLab.jsx`, `PaginaHistorialClinico.jsx` |
| **Endpoints Expuestos** | `GET /api/historia-clinica/mis-pacientes`, `POST /api/historia-clinica/atenciones`, `GET /api/historia-clinica/atenciones/cita/{idCita}`, `GET|POST /api/historia-clinica/laboratorios`, `GET /api/historia-clinica/pacientes/{idPaciente}` |
| **Tablas Leídas / Escritas** | `atenciones_clinicas`, `resultados_laboratorio`, `citas`, `estados_cita`, `pacientes`, `personas`, `medicos`, `especialidades`, `informacion_medica_paciente`, `contactos_emergencia` |
| **Dependencias hacia Otros Paquetes** | Actualiza estado de la cita a 'atendida' en la tabla `citas` (CU-12/13). |
| **Líneas de Código Aprox.** | Controladores: ~286 líneas | FormRequests: ~42 líneas | Servicios: ~420 líneas | Frontend: ~2843 líneas |

---

### 6. Paquete `Reportes`
| Aspecto | Implementación Real |
| :--- | :--- |
| **Casos de Uso** | CU-21 (`CU21_ConsultarReportesCitas`), CU-22 (`CU22_ConsultarReporteAsistenciaPacientes`), CU-23 (`CU23_ExportarReportes`), CU-24 (`CU24_ConsultarBitacoraAuditoria`), CU-25 (`CU25_VisualizarDashboardAdministrativo`) |
| **Controladores** | `ReportesCitasControlador.php`, `ReporteAsistenciaControlador.php`, `ExportarReportesControlador.php`, `ConsultarBitacoraControlador.php`, `DashboardAdministrativoControlador.php` |
| **FormRequests** | Ninguno (filtros por Query Params validados en el controlador) |
| **Servicios** | `ReportesCitasServicio.php`, `ReporteAsistenciaServicio.php`, `ExportarReportesServicio.php`, `ConsultarBitacoraServicio.php`, `DashboardAdministrativoServicio.php` |
| **Componentes React** | `PaginaReportes.jsx`, `PaginaAuditoria.jsx`, `PaginaBitacora.jsx`, `PaginaDashboard.jsx` |
| **Endpoints Expuestos** | `GET /api/reportes/citas`, `GET /api/reportes/asistencia`, `GET /api/reportes/exportar`, `GET /api/reportes/dashboard`, `GET /api/dashboard/metricas`, `GET /api/auditoria`, `GET /api/auditoria/bitacora` |
| **Tablas Leídas / Escritas** | `citas`, `pacientes`, `medicos`, `especialidades`, `estados_cita`, `personas`, `bitacora_auditoria`, `pagos_cita` (solo lectura salvo bitácora de auditoría al consultar) |
| **Dependencias hacia Otros Paquetes** | Consolida métricas y vistas agregadas sobre tablas de todos los demás paquetes. |
| **Líneas de Código Aprox.** | Controladores: ~210 líneas | FormRequests: 0 líneas | Servicios: ~835 líneas | Frontend: ~2532 líneas |

---

### C-final-1. Matriz de Dependencias entre Subsistemas

| Paquete Origen \ Paquete Destino | AccesoCuentas | PacientesPerfil | CatalogosHorarios | CitasNotificaciones | HistoriaClinica | Reportes |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **AccesoCuentas** | — | Independiente | Independiente | Independiente | Independiente | Independiente |
| **PacientesPerfil** | Vía BD (`usuarios`) | — | Independiente | Independiente | Independiente | Independiente |
| **CatalogosHorarios**| Independiente | Independiente | — | `SuspenderHorarioServicio` → `EnviarNotificacionesServicio` | Independiente | Independiente |
| **CitasNotificaciones**| Independiente | Vía BD (`pacientes`) | Vía BD (`medicos`, `horarios`) | — | Independiente | Independiente |
| **HistoriaClinica** | Independiente | Vía BD (`pacientes`) | Vía BD (`medicos`) | Vía BD (`citas`, `estados_cita`) | — | Independiente |
| **Reportes** | Independiente | Vía BD (`pacientes`) | Vía BD (`medicos`, `especialidades`)| Vía BD (`citas`, `pagos_cita`) | Vía BD (`atenciones`) | — |

---

### C-final-2. Servicios y Componentes Transversales Usados por los Paquetes

| Componente Transversal | Paquetes que lo Usan | Conteo | Responsabilidad Principal |
| :--- | :--- | :---: | :--- |
| **`RespuestaApi`** | Todos (AccesoCuentas, PacientesPerfil, CatalogosHorarios, CitasNotificaciones, HistoriaClinica, Reportes) | 6 / 6 | Estandarización de respuestas JSON HTTP (`exito`, `error`, `validacion`). |
| **`ServicioBitacora`** | Todos (AccesoCuentas, PacientesPerfil, CatalogosHorarios, CitasNotificaciones, HistoriaClinica, Reportes) | 6 / 6 | Registro inmutable de eventos en la tabla `bitacora_auditoria` (RN21). |
| **`FormRequestPersonalizado`** | AccesoCuentas, PacientesPerfil, CatalogosHorarios, CitasNotificaciones, HistoriaClinica | 5 / 6 | Sanitización anti-XSS recursiva y captura de errores 422. (Reportes no usa FormRequests). |
| **`Cita` (Modelo Eloquent)** | CatalogosHorarios, CitasNotificaciones | 2 / 6 | Centralizador de `ESTADOS_OCUPANTES`, `aplicarFiltroOcupantes()` y detección de solapamiento. |
| **`ManejadorSesion`** | Registrado en `bootstrap/app.php` como middleware de ruta | Global | Valida sesión Bearer y asocia entidades clínicas (`id_medico`, `id_paciente`). |
| **`MiddlewareVerificarRol`** | Registrado en `bootstrap/app.php` como middleware de ruta | Global | Control de acceso basado en roles (RBAC) con bypass de administrador. |

---

### C-final-3. Fragmentos de Código Representativos por Paquete

#### 1. `AccesoCuentas` — Autenticación y Generación de Token Criptográfico (CU-01)
*Archivo:* `backend/app/Paquetes/AccesoCuentas/CU01_IniciarCerrarSesion/IniciarCerrarSesionServicio.php` (Líneas 98–118)
```php
// Generar Bearer token criptográfico seguro de 64 caracteres
$token = bin2hex(random_bytes(32));

DB::table('usuarios')->where('id_usuario', $usuario->id_usuario)->update([
    'token_sesion' => $token,
    'ultimo_acceso' => now(),
    'updated_at' => now(),
]);

ServicioBitacora::registrar(
    'CU-01',
    'INICIO_SESION_EXITOSO',
    'usuarios',
    (string)$usuario->id_usuario,
    null,
    ['nombre_usuario' => $usuario->nombre_usuario, 'rol' => $usuario->rol],
    $usuario->id_usuario
);

return [
    'token' => $token,
    'usuario' => $usuario,
];
```

#### 2. `PacientesPerfil` — Creación Atómica de Persona y Paciente (CU-05)
*Archivo:* `backend/app/Paquetes/PacientesPerfil/CU05_GestionarPacientes/GestionarPacientesServicio.php` (Líneas 95–118)
```php
return DB::transaction(function () use ($datos) {
    $idPersona = DB::table('personas')->insertGetId([
        'nombres' => trim($datos['nombres']),
        'apellidos' => trim($datos['apellidos']),
        'ci' => trim($datos['ci']),
        'telefono' => $datos['telefono'] ?? null,
        'direccion' => $datos['direccion'] ?? null,
        'fecha_nacimiento' => $datos['fecha_nacimiento'] ?? null,
        'genero' => $datos['genero'] ?? null,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $idPaciente = DB::table('pacientes')->insertGetId([
        'id_persona' => $idPersona,
        'grupo_sanguineo' => $datos['grupo_sanguineo'] ?? null,
        'estado' => 'activo',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    return $this->obtenerPorId($idPaciente);
});
```

#### 3. `CatalogosHorarios` — Normalización Fonética de Especialidad (CU-07)
*Archivo:* `backend/app/Paquetes/CatalogosHorarios/CU07_GestionarEspecialidades/GestionarEspecialidadesServicio.php` (Líneas 32–50)
```php
$nombreNormalizado = GuardarEspecialidadRequest::normalizar($datos['nombre']);

// Búsqueda insensible a diacríticos (ej. 'Cardiología' == 'CARDIOLOGIA')
$existente = DB::table('especialidades')
    ->where('nombre_normalizado', $nombreNormalizado)
    ->first();

if ($existente) {
    if ($existente->estado === 'inactivo') {
        DB::table('especialidades')
            ->where('id_especialidad', $existente->id_especialidad)
            ->update([
                'estado' => 'activo',
                'nombre' => trim($datos['nombre']),
                'descripcion' => $datos['descripcion'] ?? $existente->descripcion,
                'nombre_normalizado' => $nombreNormalizado,
                'updated_at' => now(),
            ]);
        return (array)$existente;
    }
    throw new Exception("Ya existe una especialidad registrada con este nombre.", 422);
}
```

#### 4. `CitasNotificaciones` — Bloqueo Pesimista contra Sobreventa Concurrente (CU-12)
*Archivo:* `backend/app/Paquetes/CitasNotificaciones/CU12_GestionarCitas/GestionarCitasServicio.php` (Líneas 95–115)
```php
// Control estricto de concurrencia: bloqueo pesimista a nivel de fila (FOR UPDATE)
$solapada = DB::table('citas')
    ->where('id_medico', $datos['id_medico'])
    ->where('fecha_cita', $datos['fecha_cita'])
    ->where('hora_inicio', $datos['hora_inicio'])
    ->where('estado', '!=', 'cancelada')
    ->where('es_postergada', false)
    ->whereNotIn('id_estado_cita', [$idCancelada, $idPostergada])
    ->lockForUpdate()
    ->exists();

if ($solapada) {
    throw new Exception(
        "El turno médico seleccionado ({$datos['hora_inicio']}) ya ha sido reservado por otro paciente. Por favor elija otro turno disponible.",
        409
    );
}
```

#### 5. `HistoriaClinica` — Transición Atómica de Cita a 'Atendida' y Registro Clínico (CU-18)
*Archivo:* `backend/app/Paquetes/HistoriaClinica/CU18_RegistrarAtencionClinica/RegistrarAtencionClinicaServicio.php` (Líneas 35–58)
```php
// Insertar la atención médica en atenciones_clinicas
$idAtencion = DB::table('atenciones_clinicas')->insertGetId([
    'id_cita' => $idCita,
    'id_paciente' => $cita->id_paciente,
    'id_medico' => $idMedico,
    'motivo_atencion' => $datos['motivo_atencion'],
    'examen_fisico' => $datos['examen_fisico'] ?? null,
    'diagnostico' => $datos['diagnostico'],
    'tratamiento_indicaciones' => $datos['tratamiento_indicaciones'],
    'receta_medica' => $datos['receta_medica'] ?? null,
    'fecha_atencion' => now(),
    'created_at' => now(),
    'updated_at' => now(),
]);

// Transición atómica de estado de la cita a 'atendida' (id_estado_cita = 5)
DB::table('citas')->where('id_cita', $idCita)->update([
    'id_estado_cita' => $idEstadoAtendida,
    'updated_at' => now(),
]);
```

#### 6. `Reportes` — Agregaciones de Finanzas y Métricas de Dashboard (CU-25)
*Archivo:* `backend/app/Paquetes/Reportes/CU25_VisualizarDashboardAdministrativo/DashboardAdministrativoServicio.php` (Líneas 105–125)
```php
// Consolidación de ingresos financieros por garantías de reserva (CU-27 / RN15)
$ingresosGarantia = (float)(DB::table('pagos_cita')
    ->where('estado_pago', 'completado')
    ->sum('monto') ?? 0);

$penalizacionesRetenidas = (float)(DB::table('pagos_cita')
    ->where('estado_pago', 'retenido')
    ->sum('monto') ?? 0);

$reembolsosEmitidos = (float)(DB::table('pagos_cita')
    ->where('estado_pago', 'reembolsado')
    ->sum('monto') ?? 0);

$citasPorEspecialidad = DB::table('citas')
    ->join('especialidades', 'citas.id_especialidad', '=', 'especialidades.id_especialidad')
    ->select('especialidades.nombre as especialidad', DB::raw('COUNT(citas.id_cita) as total'))
    ->groupBy('especialidades.nombre')
    ->orderByDesc('total')
    ->get();
```

---

## D. Pruebas

### D1. Pruebas Existentes y Mecanismos de Ejecución
1. **Suite de Integración y Reglas de Negocio (`backend/tests/ejecutar_20_pruebas.php`):**
   - *Ejecución:* `php backend/tests/ejecutar_20_pruebas.php` desde consola.
   - *Naturaleza:* Script CLI automatizado que ejecuta 20 pruebas de extremo a extremo contra base de datos local emulando peticiones HTTP, validaciones de esquemas, transiciones de estados y bitácora de auditoría.
2. **Pruebas de Concurrencia de Procesos (`backend/tests/prueba_concurrencia_procesos.php`):**
   - *Ejecución:* `php backend/tests/prueba_concurrencia_procesos.php`.
   - *Naturaleza:* Lanza dos procesos PHP en paralelo que intentan reservar el mismo slot simultáneamente para verificar que `lockForUpdate()` y el índice `uq_citas_turno_activo` rechacen la colisión con HTTP 409.
3. **Scripts de Verificación Sandbox:**
   - `verificar_migrate_fresh_sandbox.php`: Ejecuta `migrate:fresh` y seeders en base aislada temporal.
   - `verificar_seeders_sandbox.php`: Valida idempotencia y ausencia de violaciones de integridad referencial.
   - `verificar_rutas_csrf.php`: Valida que los métodos POST/PUT/DELETE no arrojen error 419 al llamarse sin CSRF token desde el dominio frontend de Vercel.
4. **Framework PHPUnit (`backend/tests/`):**
   - *Ejecución:* `php artisan test` o `./vendor/bin/phpunit`.
   - *Configuración:* `backend/phpunit.xml`, clase base `backend/tests/TestCase.php`, pruebas de ejemplo en `tests/Feature/ExampleTest.php` y `tests/Unit/ExampleTest.php`.
5. **Pruebas en el Frontend:**
   - `NO ENCONTRADO` (el frontend no tiene configurados corredores de pruebas como Vitest o Jest en `package.json`).

### D2. Cobertura de Requisitos del Sistema
La suite principal (`ejecutar_20_pruebas.php`) evalúa exhaustivamente 20 escenarios de negocio críticos:
- **Prueba 1 (CU-03):** Registro exitoso de paciente nuevo generando registros en `personas`, `pacientes` y `usuarios`.
- **Prueba 2 (RN01):** Rechazo de registro ante CI duplicado arrojando HTTP 422.
- **Prueba 3 (CU-12):** Reserva exitosa de cita médica en turno libre de 15 minutos con comprobante.
- **Prueba 4 (CU-12):** Rechazo inmediato de cita superpuesta en el mismo horario con HTTP 409 Conflict.
- **Prueba 5 (RN03):** Rechazo de agendamiento fuera del horario de atención médica con HTTP 422.
- **Prueba 6 (CU-12):** Cancelación oportuna de cita: libera el turno, mantiene la fila en base de datos (`estado = 'cancelada'`) y preserva la auditoría histórica.
- **Prueba 7 (CU-15):** Consulta del historial clínico de citas del paciente ordenado cronológicamente.
- **Prueba 8 (CU-14):** Consulta de agenda operativa de un médico para una fecha específica.
- **Prueba 9 (Seguridad):** Rechazo de acceso a rutas protegidas sin encabezado de autenticación con HTTP 401.
- **Prueba 10 (Validación):** Rechazo de parámetros inválidos en FormRequests devolviendo JSON 422 con detalles.
- **Prueba 11 (RN15):** Paciente intenta cancelar cita con menos de 12 horas de anticipación: el sistema rechaza la solicitud con HTTP 422.
- **Prueba 12 (RN14):** Paciente intenta agendar en especialidad marcada como no reservable en línea: rechaza con HTTP 403.
- **Prueba 13 (RN16):** Intento inválido de marcar como 'Atendida' una cita que fue previamente 'Cancelada': rechaza con HTTP 422.
- **Prueba 14 (RN17):** Administrador rectifica una cita de 'Atendida' a 'Inasistencia' suministrando justificativo obligatorio: operación permitida y auditada en bitácora.
- **Prueba 15 (RN18/19):** Suspensión del horario de un médico: transiciona citas a 'Postergada', bloquea la franja y habilita ventana prioritaria de 48 horas.
- **Prueba 16 (RN12/IDOR):** Paciente intenta consultar la cita o expediente de otro paciente: rechaza categóricamente con HTTP 403.
- **Prueba 17 (RN02):** Registro con CI preexistente cuyos nombres o apellidos no coinciden: rechaza con HTTP 422.
- **Prueba 18 (CU-01 / RN21):** Intento de inicio de sesión con credenciales fallidas: verificación del registro de auditoría en la tabla `bitacora_auditoria`.
- **Prueba 19 (RN12):** Usuario sin rol administrador intenta acceder al endpoint de bitácora o respaldo: rechaza con HTTP 403.
- **Prueba 20 (CU-26):** Generación de copia de seguridad del esquema de la base de datos con registro en `copias_seguridad`.

---

## Discrepancias

### Discrepancias entre Documentación Inicial y Código Implementado

| Tema | Lo que dice la Documentación Inicial | Lo que hace el Código Real | Archivo de Referencia |
| :--- | :--- | :--- | :--- |
| **Catálogo de Estados de Cita** | Menciona 8 estados operacionales (`pendiente`, `confirmada`, `en_espera`, `atendida`, `cancelada`, `inasistencia`, `reprogramada`, `postergada`). | Siembra **9 estados** en total: incluye además el estado formal `programada` (código `programada`, nombre 'Programada') junto a `pendiente`. | `backend/database/seeders/CatalogosBaseSeeder.php` (Líneas 35–45) |
| **Columna `ocupa_turno`** | Algunos documentos preliminares proponen un campo booleano `ocupa_turno` en la tabla `estados_cita`. | **NO EXISTE** la columna `ocupa_turno` en la base de datos. La determinación de ocupación de turno se evalúa en tiempo de ejecución en `App\Models\Cita::ESTADOS_OCUPANTES` y a nivel físico con el índice `uq_citas_turno_activo`. | `backend/database/migrations/2026_10_22_000000_create_initial_vida_salud_schema.php` |
| **Mecanismo de Autenticación** | Menciones teóricas a cookies de sesión web de Laravel o Sanctum. | Implementa **Token Bearer Criptográfico** propio almacenado en la columna `usuarios.token_sesion` y verificado por el middleware `ManejadorSesion`. | `backend/app/Nucleo/Sesion/ManejadorSesion.php` |
| **Versión de PostgreSQL** | `estructura-proyecto.md` menciona 'PostgreSQL 18'. | El entorno de producción en Supabase corre PostgreSQL 15.x / 16.x; en Docker se usa PHP 8.3 CLI con `libpq-dev` estándar. PostgreSQL 18 no ha sido lanzado al mercado general. | `backend/Dockerfile`, `backend/config/database.php` |
| **Cantidad de Casos de Uso** | El catálogo inicial define 26 casos de uso (CU-01 a CU-26). | Se implementaron **27 Casos de Uso**: se agregó **CU-27: Gestionar Pagos y Reembolsos** para dar cumplimiento financiero y contable a la RN15 (garantía de 50.00 Bs). | `backend/app/Paquetes/CitasNotificaciones/CU27_GestionarPagosReembolsos/` |
| **Cantidad de Tablas en BD** | Documentos preliminares mencionaban 20 o 22 tablas. | Existen exactamente **23 tablas físicas** creadas por las 5 migraciones, sumando `permisos`, `rol_permiso` y `pagos_cita`. | `backend/database/migrations/` |
| **Nombres de Clases de Servicios** | `estructura-proyecto.md` lista `RegistrarAtencionServicio` y `RegistrarResultadosLabServicio`. | Las clases base implementadas se llaman `RegistrarAtencionClinicaServicio` y `ResultadosLaboratorioServicio`. Se crearon clases alias para garantizar compatibilidad con ambos nombres. | `backend/app/Paquetes/HistoriaClinica/CU18_RegistrarAtencionClinica/`, `CU19_RegistrarResultadosLaboratorio/` |
| **Tabla de Recetas Médicas** | Documentación inicial mencionaba una tabla separada `recetas_medicas`. | La receta médica se almacena como columna `receta_medica` (tipo TEXT) dentro de la tabla `atenciones_clinicas`. No existe tabla independiente. | `backend/database/migrations/2026_10_22_000000_create_initial_vida_salud_schema.php` (Línea 204) |
| **Páginas Independientes en Frontend** | Asume que cada Caso de Uso posee una página autónoma en el router. | CUs como CU-13 (marcar asistencia/inasistencia), CU-16 (campana de notificaciones), CU-19 (modal de laboratorio), CU-22 (asistencia), CU-23 (exportar) y CU-27 (pasarela de pagos) están **embebidos como modales o pestañas** dentro de páginas principales. | `frontend/src/App.jsx` |
