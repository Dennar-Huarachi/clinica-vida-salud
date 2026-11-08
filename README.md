# Sistema Web de Gestión de Citas Médicas — Clínica "Vida Salud"
> **Documentación Técnica Integral de Análisis, Diseño UML y Operaciones (Metodología PUDS)**  
> **Asignatura:** Ingeniería de Requisitos / Sistemas de Información I — FCET / UAGRM  
> **Metodología:** Proceso Unificado de Desarrollo de Software (PUDS)  
> **Patrón Arquitectónico:** Clean Layered Package-by-Feature (Laravel REST API + React SPA + PostgreSQL)  

<div align="center">

[![Repositorio en GitHub](https://img.shields.io/badge/GitHub-Dennar--Huarachi%2Fclinica-181717?style=for-the-badge&logo=github)](https://github.com/Dennar-Huarachi/clinica.git)
[![Frontend en Vercel](https://img.shields.io/badge/Frontend-Vercel%20Live-000000?style=for-the-badge&logo=vercel)](https://clinica-gilt-iota.vercel.app)
[![Backend en Render](https://img.shields.io/badge/Backend-Render%20Live-46E3B7?style=for-the-badge&logo=render)](https://clinica-backend-plaw.onrender.com)
[![Base de Datos en Supabase](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![Casos de Uso](https://img.shields.io/badge/Casos%20de%20Uso-26%20%2F%2026%20Completados-success?style=for-the-badge)](#listado-oficial-de-casos-de-uso-programados)

<br/>

<a href="https://github.com/Dennar-Huarachi/clinica.git">
  <img src="docs/qr-repositorio.png" alt="Código QR del Repositorio de GitHub" width="160"/>
</a>

**Escanear para acceder al repositorio oficial de código fuente:**  
[`https://github.com/Dennar-Huarachi/clinica.git`](https://github.com/Dennar-Huarachi/clinica.git)

</div>

---

## 1. Ficha Técnica, Alcance y Objetivo Clínico

### Objetivo Clínico del Sistema
La plataforma web de la **Clínica "Vida Salud"** automatiza la gestión integral de citas médicas ambulatorias, eliminando tiempos muertos, aglomeraciones en recepción y errores humanos en la asignación de turnos. Sus pilares clínicos y operativos son:
1. **Cero Sobrevueltas (Double-Booking Prevention):** Concurrencia estricta a nivel de base de datos (`SELECT ... FOR UPDATE` sobre transacciones ACID) que previene reservas simultáneas del mismo slot médico.
2. **Garantía y Compromiso de Asistencia (RN15 / CU-27):** Depósito de garantía de 50 Bs reembolsable automáticamente si el paciente cancela con más de 12 horas de anticipación, penalizando el ausentismo sin previo aviso.
3. **Resiliencia ante Imprevistos Médicos (RN17 / CU-11):** Suspensión formal de turnos médicos por emergencia con ventana protegida de 48 horas de prioridad para reubicar a los pacientes afectados antes de liberar los turnos al público general.
4. **Trazabilidad Médico-Legal y Auditoría Inmutable (RN21 / CU-24):** Bitácora transaccional forense que registra IP, navegador, valores anteriores y nuevos en cada operación sensible, asegurando conformidad con normativas de salud.

### Enlaces de Despliegue en Producción

| Componente | Plataforma / Infraestructura | URL de Acceso Oficial | Estado / Monitoreo |
| :--- | :--- | :--- | :--- |
| **Frontend Web (SPA)** | Vercel (CI/CD Automático en Linux) | [https://clinica-gilt-iota.vercel.app](https://clinica-gilt-iota.vercel.app) | En Línea (HTTPS / CDN Global) |
| **Backend REST API** | Render (Web Service Docker/Native) | [https://clinica-backend-plaw.onrender.com](https://clinica-backend-plaw.onrender.com) | En Línea (HTTPS / PHP 8.3) |
| **Base de Datos** | Supabase (Cloud PostgreSQL 16) | `aws-0-sa-east-1.pooler.supabase.com:5432` | En Línea (Zona Horaria UTC-4) |
| **Código Fuente** | GitHub (Dennar-Huarachi/clinica) | [https://github.com/Dennar-Huarachi/clinica.git](https://github.com/Dennar-Huarachi/clinica.git) | Rama `main` |

### Stack Tecnológico Completo
* **Backend:** PHP 8.3+ / Laravel 13 (REST API, Arquitectura limpia por Paquetes, FormRequests con sanitización recursiva `strip_tags()`, Manejador Global de Excepciones JSON, Rate Limiting granular `throttle:5,1`, `throttle:10,1`, `throttle:60,1`).
* **Frontend:** React 19 / Vite / React Router v7 / CSS Modular Nativo (Variables CSS en `:root`, diseño Mobile-First estricto, sin desbordamiento horizontal gracias a `TablaExpandible.jsx`, interceptores Axios para token Bearer y normalización de errores HTTP 400/401/403/409/422).
* **Persistencia:** PostgreSQL 18 (Local en Laragon) y PostgreSQL 16 (Producción en Supabase) con 23 tablas normalizadas, integridad referencial con claves foráneas, índice único parcial `uq_citas_turno_activo` para prevención a nivel de motor de sobreventa concurrente sobre `(id_medico, fecha_cita, hora_inicio)` y transacciones ACID.
* **Seguridad (OWASP Top 10):** Middleware de cabeceras HTTP seguras (`CabecerasSeguridad.php`), blindaje anti-IDOR con validación de identidad a partir de token Bearer en sesión (RN19), sanitización de cadenas y protección CORS restringido a orígenes autorizados.

### Matriz de Roles y Privilegios del Sistema

| Módulo / Capacidad | Paciente | Recepcionista | Médico | Administrador |
| :--- | :---: | :---: | :---: | :---: |
| **Registro y Autenticación** | Registrarse, Iniciar sesión | Iniciar sesión | Iniciar sesión | Iniciar sesión |
| **Gestión de Perfil Personal** | Actualizar datos, alergias, contactos | Solo credenciales | Solo credenciales | Solo credenciales |
| **Catálogo de Especialidades y Médicos** | Solo lectura | Solo lectura | Solo lectura | CRUD Completo |
| **Horarios de Atención y Bloqueos** | Solo lectura (disponibilidad) | Solo lectura | Ver su propio horario | CRUD Completo |
| **Suspensión de Horarios y Reubicación** | Notificado | Ver / Reubicar afectados | Notificado | Crear suspensión / Reubicar |
| **Reserva de Citas Médicas** | Sí (Web con garantía) | Sí (Ventanilla / Teléfono) | No | No |
| **Pago y Reembolso de Garantía** | Pagar QR/Tarjeta, ver recibo | Pagar Efectivo/QR, ver recibo | No | Consultar transacciones |
| **Cancelación de Citas** | Sí ($\ge 12$h con reembolso) | Sí (En cualquier momento) | No | Sí (En cualquier momento) |
| **Registro de Asistencia en Sala** | No | Sí (En Espera / Inasistencia) | No | Corrección justificada (RN16) |
| **Agenda Diaria de Consultas** | No | Agenda general de clínica | Agenda de su consultorio | Vista global |
| **Atención Clínica y Recetas** | Solo lectura en su historial | No | Registrar diagnóstico / RP | No |
| **Resultados de Laboratorio** | Solo lectura en su historial | No | Registrar / Adjuntar estudio | No |
| **Historial Clínico / Kardex** | Ver mi historial médico | No | Mis pacientes / Historial | No |
| **Reportes Estadísticos y Exportación**| No | No | No | Citas, Asistencia, CSV/Excel |
| **Bitácora de Auditoría (RN21)** | No | No | No | Auditoría forense inmutable |
| **Copias de Seguridad (CU-26)** | No | No | No | Crear y restaurar backups |
| **Administración de Usuarios y Roles** | No | No | No | CRUD Usuarios, Roles, Permisos |

### Listado Oficial de Casos de Uso Programados

| Identificador | Nombre del Caso de Uso | Paquete Arquitectónico | Actor Principal | Estado |
| :--- | :--- | :--- | :--- | :---: |
| **CU-01** | Iniciar y Cerrar Sesión | `AccesoCuentas` | Paciente / Personal Clínico | **Completado** |
| **CU-02** | Cambiar y Recuperar Contraseña | `AccesoCuentas` | Usuario Autenticado | **Completado** |
| **CU-03** | Registrarse como Paciente | `AccesoCuentas` | Paciente no registrado | **Completado** |
| **CU-04** | Administrar Usuarios y Roles | `AccesoCuentas` | Administrador | **Completado** |
| **CU-05** | Gestionar Pacientes | `PacientesPerfil` | Recepcionista / Administrador | **Completado** |
| **CU-06** | Gestionar Mi Perfil de Paciente | `PacientesPerfil` | Paciente | **Completado** |
| **CU-07** | Gestionar Especialidades Médicas | `CatalogosHorarios` | Administrador | **Completado** |
| **CU-08** | Gestionar Médicos Especialistas | `CatalogosHorarios` | Administrador | **Completado** |
| **CU-09** | Gestionar Horarios de Atención | `CatalogosHorarios` | Administrador | **Completado** |
| **CU-10** | Consultar Disponibilidad de Turnos | `CatalogosHorarios` | Paciente / Recepcionista | **Completado** |
| **CU-11** | Suspender Horario de Atención y Reubicar | `CatalogosHorarios` | Administrador | **Completado** |
| **CU-12** | Reservar Cita Médica | `CitasNotificaciones` | Paciente / Recepcionista | **Completado** |
| **CU-13** | Registrar Asistencia del Paciente | `CitasNotificaciones` | Recepcionista | **Completado** |
| **CU-14** | Consultar Agenda de Citas | `CitasNotificaciones` | Médico / Recepcionista | **Completado** |
| **CU-15** | Historial y Seguimiento de Citas | `CitasNotificaciones` | Paciente | **Completado** |
| **CU-16** | Enviar y Consultar Notificaciones | `CitasNotificaciones` | Paciente / Personal Clínico | **Completado** |
| **CU-17** | Consultar Mis Pacientes (Kardex) | `HistoriaClinica` | Médico | **Completado** |
| **CU-18** | Registrar Atención Clínica y Prescripción | `HistoriaClinica` | Médico | **Completado** |
| **CU-19** | Registrar y Consultar Resultados de Laboratorio | `HistoriaClinica` | Médico | **Completado** |
| **CU-20** | Consultar Historial Clínico Integral | `HistoriaClinica` | Médico / Paciente | **Completado** |
| **CU-21** | Generar Reporte de Citas por Especialidad y Médico | `Reportes` | Administrador | **Completado** |
| **CU-22** | Generar Reporte de Asistencia e Inasistencia | `Reportes` | Administrador | **Completado** |
| **CU-23** | Exportar Reportes en Formato CSV / Excel | `Reportes` | Administrador | **Completado** |
| **CU-24** | Consultar Bitácora de Auditoría | `Reportes` | Administrador | **Completado** |
| **CU-25** | Visualizar Dashboard Estadístico | `Reportes` | Administrador | **Completado** |
| **CU-26** | Generar y Restaurar Copias de Seguridad | `AccesoCuentas` | Administrador | **Completado** |
| **CU-27** | Gestionar Pagos y Reembolsos de Garantía | `CitasNotificaciones` | Paciente / Recepcionista | **Completado** |

---

## 2. Mapa de Persistencia Relacional (23 Entidades PostgreSQL 18)

| Tabla Física | Descripción de Dominio y Atributos Físicos Clave |
| :--- | :--- |
| `roles` | `id_rol`, `nombre`, `descripcion`, `timestamps` (`administrador`, `medico`, `recepcionista`, `paciente`) |
| `personas` | `id_persona`, `ci`, `nombres`, `apellidos`, `fecha_nacimiento`, `sexo`, `telefono`, `correo`, `direccion`, `timestamps` |
| `usuarios` | `id_usuario`, `id_persona`, `id_rol`, `nombre_usuario`, `correo`, `contrasena_hash`, `token_sesion`, `debe_cambiar_contrasena`, `estado`, `ultimo_acceso`, `timestamps` |
| `permisos` | `id_permiso`, `modulo`, `nombre`, `slug`, `descripcion`, `timestamps` |
| `rol_permiso` | `id_rol`, `id_permiso`, `timestamps` (Matriz M:N de privilegios granulares) |
| `pacientes` | `id_paciente`, `id_persona`, `codigo_historia`, `grupo_sanguineo`, `estado`, `timestamps` |
| `informacion_medica_paciente` | `id_informacion_medica`, `id_paciente`, `alergias`, `enfermedades_cronicas`, `medicamentos_actuales`, `antecedentes_familiares`, `observaciones`, `timestamps` |
| `contactos_emergencia` | `id_contacto_emergencia`, `id_paciente`, `nombre_completo`, `relacion`, `telefono`, `direccion`, `es_principal`, `timestamps` |
| `medicos` | `id_medico`, `id_persona`, `nro_matricula`, `biografia`, `estado`, `timestamps` |
| `especialidades` | `id_especialidad`, `nombre`, `nombre_normalizado`, `descripcion`, `duracion_turno_minutos`, `reservable_en_linea`, `estado`, `timestamps` |
| `medico_especialidad` | `id_medico_especialidad`, `id_medico`, `id_especialidad`, `timestamps` (Relación M:N) |
| `horarios_atencion` | `id_horario`, `id_medico`, `id_especialidad`, `dia_semana`, `hora_inicio`, `hora_fin`, `duracion_intervalo_minutos`, `estado`, `timestamps` |
| `bloqueos_clinica` | `id_bloqueo`, `titulo`, `motivo`, `fecha_inicio`, `fecha_fin`, `aplica_a_todos`, `id_medico`, `estado`, `timestamps` |
| `suspensiones_horario` | `id_suspension`, `id_medico`, `fecha_inicio`, `fecha_fin`, `motivo`, `estado_citas_accion`, `timestamps` |
| `estados_cita` | `id_estado_cita`, `codigo`, `nombre`, `descripcion`, `timestamps` (9 estados: `pendiente`, `programada`, `confirmada`, `en_espera`, `atendida`, `cancelada`, `inasistencia`, `reprogramada`, `postergada`) |
| `citas` | `id_cita`, `codigo_cita`, `id_paciente`, `id_medico`, `id_especialidad`, `id_estado_cita`, `fecha_cita`, `hora_inicio`, `hora_fin`, `motivo_consulta`, `observaciones`, `es_postergada`, `fecha_expiracion_reserva`, `creado_por_usuario`, `id_pago`, `pago_confirmado`, `estado`, `timestamps` |
| `pagos_cita` | `id_pago`, `id_cita`, `monto`, `metodo_pago`, `nro_transaccion`, `estado_pago` (`completado`, `reembolsado`, `retenido`), `detalles_pasarela`, `fecha_pago`, `fecha_reembolso`, `timestamps` |
| `notificaciones` | `id_notificacion`, `id_usuario`, `tipo`, `titulo`, `mensaje`, `leido`, `fecha_leido`, `metadata`, `timestamps` |
| `atenciones_clinicas` | `id_atencion`, `id_cita`, `id_paciente`, `id_medico`, `motivo_atencion`, `examen_fisico`, `diagnostico`, `tratamiento_indicaciones`, `receta_medica`, `fecha_atencion`, `timestamps` |
| `resultados_laboratorio` | `id_resultado`, `id_paciente`, `id_atencion`, `tipo_estudio`, `descripcion`, `archivo_adjunto`, `fecha_estudio`, `timestamps` |
| `bitacora_auditoria` | `id_bitacora`, `id_usuario`, `caso_uso`, `accion`, `tabla_afectada`, `registro_id`, `datos_anteriores`, `datos_nuevos`, `ip_origen`, `user_agent`, `fecha_hora`, `timestamps` |
| `copias_seguridad` | `id_copia`, `id_usuario`, `nombre_archivo`, `ruta_almacenamiento`, `tamano_bytes`, `tipo`, `estado`, `timestamps` |
| `parametros_sistema` | `id_parametro`, `clave`, `valor`, `descripcion`, `tipo_dato`, `timestamps` (`HORAS_ANTICIPACION_CANCELAR = '12'`, `MONTO_FIJO_RESERVA_CITA = '50.00'`, `HORAS_VENTANA_POSTERGADAS = '48'`, `MINUTOS_DURACION_TURNO = '15'`) |

---

## 3. Especificación Técnica por Casos de Uso (Ciclo 1)

---

### PAQUETE 1: ACCESO Y CUENTAS (`AccesoCuentas`)

```
backend/app/Http/Controllers/Paquetes/AccesoCuentas/
backend/app/Http/Requests/Paquetes/AccesoCuentas/
backend/app/Paquetes/AccesoCuentas/
frontend/src/Paquetes/AccesoCuentas/
```

---

#### [CU-01] Iniciar y Cerrar Sesión
* **Actores:** `Paciente`, `PersonalClinico` (`Administrador`, `Recepcionista`, `Médico`).
* **Objetivo:** Autenticar credenciales diferenciando acceso web de pacientes vs. personal clínico, emitiendo token Bearer y auditando eventos en bitácora inmutable (RN21).

##### 1. Análisis de Clases (BCE)
* **Frontera (Boundary):**
  - `frontend/src/Paquetes/AccesoCuentas/CU01_IniciarCerrarSesion/SelectorPerfilLogin.jsx`
  - `frontend/src/Paquetes/AccesoCuentas/CU01_IniciarCerrarSesion/PaginaLogin.jsx`
  - `frontend/src/comun/componentes/RutaProtegidaPorRol.jsx`
  - `frontend/src/comun/LayoutPrincipal.jsx`
* **Control:**
  - `app/Http/Controllers/Paquetes/AccesoCuentas/CU01_IniciarCerrarSesion/IniciarCerrarSesionControlador.php`
  - `app/Http/Requests/Paquetes/AccesoCuentas/CU01_IniciarCerrarSesion/IniciarSesionRequest.php`
  - `app/Paquetes/AccesoCuentas/CU01_IniciarCerrarSesion/IniciarCerrarSesionServicio.php`
  - `app/Nucleo/Bitacora/ServicioBitacora.php`
* **Entidad (Entity):**
  - Tablas: `usuarios`, `personas`, `roles`, `medicos`, `pacientes`, `bitacora_auditoria`.

##### 2. Diagrama de Secuencia
```text
Actor -> PaginaLogin.jsx: submit(tipo_acceso, identificador, contrasena)
PaginaLogin.jsx -> IniciarCerrarSesionControlador: login(IniciarSesionRequest $request)
IniciarCerrarSesionControlador -> IniciarCerrarSesionServicio: iniciarSesion(string $tipoAcceso, string $identificador, string $contrasena)
IniciarCerrarSesionServicio -> DB: table('usuarios')->join('roles')->join('personas')->where(...)->first()
alt Credenciales Inválidas o Hash Incorrecto
    IniciarCerrarSesionServicio -> ServicioBitacora: registrar('CU01_IniciarCerrarSesion', 'INTENTO_FALLIDO_SESION', 'usuarios', ...)
    IniciarCerrarSesionServicio --> IniciarCerrarSesionControlador: throw Exception('Credenciales incorrectas o cuenta inactiva.', 401)
    IniciarCerrarSesionControlador --> PaginaLogin.jsx: RespuestaApi::error('Credenciales incorrectas...', 401)
else Cuenta Inactiva
    IniciarCerrarSesionServicio -> ServicioBitacora: registrar('CU01_IniciarCerrarSesion', 'INTENTO_SESION_CUENTA_INACTIVA', ...)
    IniciarCerrarSesionServicio --> IniciarCerrarSesionControlador: throw Exception('Cuenta inactiva', 403)
    IniciarCerrarSesionControlador --> PaginaLogin.jsx: RespuestaApi::error('Cuenta inactiva...', 403)
else Canal / Perfil Incorrecto (Paciente ingresando como Personal o viceversa)
    IniciarCerrarSesionServicio -> ServicioBitacora: registrar('CU01_IniciarCerrarSesion', 'INTENTO_ACCESO_CANAL_INCORRECTO', ...)
    IniciarCerrarSesionServicio --> IniciarCerrarSesionControlador: throw Exception('Canal incorrecto', 403)
    IniciarCerrarSesionControlador --> PaginaLogin.jsx: RespuestaApi::error('Canal incorrecto...', 403)
else Autenticación Exitosa
    IniciarCerrarSesionServicio -> DB: table('usuarios')->where('id_usuario', $id)->update(['token_sesion' => $token, 'ultimo_acceso' => now()])
    IniciarCerrarSesionServicio -> ServicioBitacora: registrar('CU01_IniciarCerrarSesion', 'INICIO_SESION', 'usuarios', ...)
    IniciarCerrarSesionServicio --> IniciarCerrarSesionControlador: array ['token' => $token, 'usuario' => $datosUsuario]
    IniciarCerrarSesionControlador --> PaginaLogin.jsx: RespuestaApi::exito($resultado, 'Sesión iniciada exitosamente')
    PaginaLogin.jsx -> RutaProtegidaPorRol.jsx: window.dispatchEvent(new Event('storage')) y redirección al portal canónico
end

== Cierre de Sesión ==
Actor -> LayoutPrincipal.jsx: clickLogout()
LayoutPrincipal.jsx -> IniciarCerrarSesionControlador: logout(Request $request)
IniciarCerrarSesionControlador -> IniciarCerrarSesionServicio: cerrarSesion(int $idUsuario)
IniciarCerrarSesionServicio -> DB: table('usuarios')->where('id_usuario', $idUsuario)->update(['token_sesion' => null])
IniciarCerrarSesionServicio -> ServicioBitacora: registrar('CU01_IniciarCerrarSesion', 'CERRAR_SESION', 'usuarios', ...)
IniciarCerrarSesionControlador --> LayoutPrincipal.jsx: RespuestaApi::exito(null, 'Sesión cerrada correctamente')
```

##### 3. Diagrama de Comunicación
```text
[Actor: Paciente/Personal]
       │
       │ 1: submit(tipo_acceso, identificador, contrasena)
       ▼
[:PaginaLogin.jsx] ──── 2: login(IniciarSesionRequest $request) ───► [:IniciarCerrarSesionControlador]
                                                                              │
                                                                              │ 3: iniciarSesion($tipo, $id, $pass)
                                                                              ▼
                                                                  [:IniciarCerrarSesionServicio]
                                                                        │           │
                     4: join('roles')->where(...)->first()             │           │ 6: registrar('INICIO_SESION')
                     5: update(['token_sesion' => $token])             │           ▼
                                       ┌───────────────────────────────┘   [:ServicioBitacora]
                                       ▼                                           │
                                  [:DB / PostgreSQL]                               │ 7: insert()
                                       │                                           ▼
                                       └──────────────────────────────────► [:bitacora_auditoria]
```

---

#### [CU-02] Cambiar y recuperar contraseña
* **Actores:** `Usuario Autenticado` (`Paciente`, `Administrador`, `Recepcionista`, `Médico`), `Usuario con Credencial Olvidada`.
* **Objetivo:** Actualizar la contraseña en sesión verificando el hash previo, impidiendo duplicidad con la contraseña actual y revocando la bandera `debe_cambiar_contrasena`, así como gestionar la solicitud de recuperación de credenciales mediante correo electrónico (simulado para Ciclo 1).

##### 1. Análisis de Clases (BCE)
* **Frontera (Boundary):**
  - `frontend/src/Paquetes/AccesoCuentas/CU01_IniciarCerrarSesion/ModalRecuperarPassword.jsx`
  - Modal o formulario de perfil de cambio de clave.
* **Control:**
  - `app/Http/Controllers/Paquetes/AccesoCuentas/CU02_CambiarContrasena/CambiarContrasenaControlador.php`
  - `app/Http/Requests/Paquetes/AccesoCuentas/CU02_CambiarContrasena/CambiarContrasenaRequest.php`
  - `app/Paquetes/AccesoCuentas/CU02_CambiarContrasena/CambiarContrasenaServicio.php`
  - `app/Nucleo/Bitacora/ServicioBitacora.php`
* **Entidad (Entity):**
  - Tablas: `usuarios`, `bitacora_auditoria`.

##### 2. Diagrama de Secuencia
```text
Actor -> FormularioCambioPassword: submit(contrasena_actual, contrasena_nueva, confirmacion)
FormularioCambioPassword -> CambiarContrasenaControlador: cambiar(CambiarContrasenaRequest $request)
CambiarContrasenaControlador -> CambiarContrasenaServicio: cambiar(int $idUsuario, string $contrasenaActual, string $contrasenaNueva)
CambiarContrasenaServicio -> DB: table('usuarios')->where('id_usuario', $idUsuario)->first()
alt Hash actual no coincide
    CambiarContrasenaServicio --> CambiarContrasenaControlador: throw Exception('La contraseña actual ingresada es incorrecta.', 422)
    CambiarContrasenaControlador --> FormularioCambioPassword: RespuestaApi::error('La contraseña actual...', 422)
else Nueva contraseña idéntica a la anterior
    CambiarContrasenaServicio --> CambiarContrasenaControlador: throw Exception('La nueva contraseña no puede ser idéntica...', 422)
    CambiarContrasenaControlador --> FormularioCambioPassword: RespuestaApi::error('La nueva contraseña...', 422)
else Validación Exitosa
    CambiarContrasenaServicio -> DB: table('usuarios')->where('id_usuario', $idUsuario)->update(['contrasena_hash' => Hash::make($nueva), 'debe_cambiar_contrasena' => false])
    CambiarContrasenaServicio -> ServicioBitacora: registrar('CU02_CambiarContrasena', 'CAMBIO_CONTRASENA', 'usuarios', ...)
    CambiarContrasenaServicio --> CambiarContrasenaControlador: void
    CambiarContrasenaControlador --> FormularioCambioPassword: RespuestaApi::exito(null, 'Contraseña actualizada satisfactoriamente')
end
```

##### 3. Diagrama de Comunicación
```text
[Actor: Usuario Autenticado]
       │
       │ 1: submit(actual, nueva, confirmacion)
       ▼
[:FormularioCambioPassword] ── 2: cambiar(CambiarContrasenaRequest) ──► [:CambiarContrasenaControlador]
                                                                                 │
                                                                                 │ 3: cambiar($id, $act, $nuev)
                                                                                 ▼
                                                                     [:CambiarContrasenaServicio]
                                                                        │           │
                    4: where('id_usuario', $id)->first()                │           │ 6: registrar('CAMBIO_CONTRASENA')
                    5: update(['contrasena_hash' => Hash::make(...)])   │           ▼
                                       ┌────────────────────────────────┘   [:ServicioBitacora]
                                       ▼                                            │
                                  [:DB / PostgreSQL]                                │ 7: insert()
                                       │                                            ▼
                                       └───────────────────────────────────► [:bitacora_auditoria]
```

---

#### [CU-03] Registrarse como Paciente
* **Actores:** `Paciente` (Autoservicio Web).
* **Objetivo:** Registro integral y atómico del paciente (creación en `personas`, `usuarios` y `pacientes` con generación de historia clínica y ficha médica inicial).

##### 1. Análisis de Clases (BCE)
* **Frontera (Boundary):**
  - `frontend/src/Paquetes/AccesoCuentas/CU03_RegistrarsePaciente/PaginaRegistroPaciente.jsx`
* **Control:**
  - `app/Http/Controllers/Paquetes/AccesoCuentas/CU03_RegistrarsePaciente/RegistrarsePacienteControlador.php`
  - `app/Http/Requests/Paquetes/AccesoCuentas/CU03_RegistrarsePaciente/RegistrarsePacienteRequest.php`
  - `app/Paquetes/AccesoCuentas/CU03_RegistrarsePaciente/RegistrarsePacienteServicio.php`
  - `app/Nucleo/Bitacora/ServicioBitacora.php`
* **Entidad (Entity):**
  - Tablas: `personas`, `usuarios`, `pacientes`, `informacion_medica_paciente`, `bitacora_auditoria`.

##### 2. Diagrama de Secuencia
```text
Actor -> PaginaRegistroPaciente.jsx: submit(formulario)
PaginaRegistroPaciente.jsx -> RegistrarsePacienteControlador: registrar(RegistrarsePacienteRequest $request)
RegistrarsePacienteControlador -> RegistrarsePacienteServicio: registrar(array $datos)
RegistrarsePacienteServicio -> DB: transaction()
RegistrarsePacienteServicio -> DB: table('personas')->insertGetId([ci, nombres, apellidos, fecha_nacimiento, sexo, telefono, correo, direccion])
RegistrarsePacienteServicio -> DB: table('roles')->where('nombre', 'paciente')->first() // id_rol = 4
RegistrarsePacienteServicio -> DB: table('usuarios')->insertGetId([id_persona, id_rol: 4, nombre_usuario, correo, contrasena_hash, token_sesion, estado: 'activo'])
RegistrarsePacienteServicio -> DB: table('pacientes')->insertGetId([id_persona, codigo_historia: 'HC-YYYY-XXXXX', grupo_sanguineo, estado: 'activo'])
RegistrarsePacienteServicio -> DB: table('informacion_medica_paciente')->insert([id_paciente])
RegistrarsePacienteServicio -> ServicioBitacora: registrar('CU03_RegistrarsePaciente', 'AUTORREGISTRO_PACIENTE', 'pacientes', ...)
RegistrarsePacienteServicio --> RegistrarsePacienteControlador: array ['id_usuario' => ..., 'id_paciente' => ..., 'token' => ...]
RegistrarsePacienteControlador --> PaginaRegistroPaciente.jsx: RespuestaApi::exito($resultado, 'Registro de paciente completado con éxito', 201)
```

##### 3. Diagrama de Comunicación
```text
[Actor: Paciente Visitante]
       │
       │ 1: submit(datosRegistro)
       ▼
[:PaginaRegistroPaciente.jsx] ── 2: registrar(RegistrarsePacienteRequest) ──► [:RegistrarsePacienteControlador]
                                                                                       │
                                                                                       │ 3: registrar(array $datos)
                                                                                       ▼
                                                                           [:RegistrarsePacienteServicio]
                                                                                │            │
                    4: DB::transaction()                                        │            │ 9: registrar()
                    5: table('personas')->insertGetId(...)                      │            ▼
                    6: table('usuarios')->insertGetId(...)                      │   [:ServicioBitacora]
                    7: table('pacientes')->insertGetId(...)                     │            │
                    8: table('informacion_medica_paciente')->insert(...)        │            │ 10: insert()
                                       ┌────────────────────────────────────────┘            ▼
                                       ▼                                             [:bitacora_auditoria]
                                  [:DB / PostgreSQL]
```

---

#### [CU-04] Administrar Usuarios y Roles
* **Actores:** `Administrador`.
* **Objetivo:** Gestión CRUD de usuarios, creación de roles, asignación modular de permisos y alternancia de estado activo/inactivo (RN01, RN11).

##### 1. Análisis de Clases (BCE)
* **Frontera (Boundary):**
  - `frontend/src/Paquetes/AccesoCuentas/CU04_AdministrarUsuariosRoles/PaginaUsuariosRoles.jsx`
* **Control:**
  - `app/Http/Controllers/Paquetes/AccesoCuentas/CU04_AdministrarUsuariosRoles/AdministrarUsuariosRolesControlador.php`
  - `app/Http/Requests/Paquetes/AccesoCuentas/CU04_AdministrarUsuariosRoles/GuardarUsuarioRequest.php`
  - `app/Paquetes/AccesoCuentas/CU04_AdministrarUsuariosRoles/AdministrarUsuariosRolesServicio.php`
  - `app/Nucleo/Bitacora/ServicioBitacora.php`
* **Entidad (Entity):**
  - Tablas: `usuarios`, `personas`, `roles`, `permisos`, `rol_permiso`, `bitacora_auditoria`.

##### 2. Diagrama de Secuencia
```text
Actor -> PaginaUsuariosRoles.jsx: guardarUsuario(datos)
PaginaUsuariosRoles.jsx -> AdministrarUsuariosRolesControlador: store(GuardarUsuarioRequest $request)
AdministrarUsuariosRolesControlador -> AdministrarUsuariosRolesServicio: crear(array $datos)
AdministrarUsuariosRolesServicio -> DB: transaction()
AdministrarUsuariosRolesServicio -> DB: table('personas')->insertGetId(...)
AdministrarUsuariosRolesServicio -> DB: table('usuarios')->insertGetId([id_persona, id_rol, nombre_usuario, correo, contrasena_hash, estado: 'activo'])
AdministrarUsuariosRolesServicio -> ServicioBitacora: registrar('CU04_AdministrarUsuariosRoles', 'CREAR_USUARIO', 'usuarios', ...)
AdministrarUsuariosRolesServicio --> AdministrarUsuariosRolesControlador: int $idUsuario
AdministrarUsuariosRolesControlador --> PaginaUsuariosRoles.jsx: RespuestaApi::exito(['id_usuario' => $id], 'Usuario creado satisfactoriamente', 201)

== Gestión Modular de Permisos de Rol ==
Actor -> PaginaUsuariosRoles.jsx: guardarPermisosRol(idRol, permisosIds)
PaginaUsuariosRoles.jsx -> AdministrarUsuariosRolesControlador: sincronizarPermisosRol(Request $request, int $id)
AdministrarUsuariosRolesControlador -> AdministrarUsuariosRolesServicio: sincronizarPermisosRol(int $idRol, array $permisosIds)
AdministrarUsuariosRolesServicio -> DB: transaction()
AdministrarUsuariosRolesServicio -> DB: table('rol_permiso')->where('id_rol', $idRol)->delete()
AdministrarUsuariosRolesServicio -> DB: table('rol_permiso')->insert($nuevosPermisos)
AdministrarUsuariosRolesServicio -> ServicioBitacora: registrar('CU04_AdministrarUsuariosRoles', 'SINCRONIZAR_PERMISOS_ROL', 'roles', ...)
AdministrarUsuariosRolesControlador --> PaginaUsuariosRoles.jsx: RespuestaApi::exito(null, 'Permisos del rol sincronizados correctamente')
```

##### 3. Diagrama de Comunicación
```text
[Actor: Administrador]
       │
       │ 1: guardarUsuario(datos)
       ▼
[:PaginaUsuariosRoles.jsx] ── 2: store(GuardarUsuarioRequest) ──► [:AdministrarUsuariosRolesControlador]
                                                                                 │
                                                                                 │ 3: crear(array $datos)
                                                                                 ▼
                                                                     [:AdministrarUsuariosRolesServicio]
                                                                        │           │
                     4: DB::transaction()                               │           │ 7: registrar('CREAR_USUARIO')
                     5: table('personas')->insertGetId(...)             │           ▼
                     6: table('usuarios')->insertGetId(...)             │   [:ServicioBitacora]
                                       ┌────────────────────────────────┘           │
                                       ▼                                            │ 8: insert()
                                  [:DB / PostgreSQL]                                ▼
                                       │                                    [:bitacora_auditoria]
                                       └───────────────────────────────────►
```

---

### PAQUETE 2: PACIENTES Y PERFIL (`PacientesPerfil`)

```
backend/app/Http/Controllers/Paquetes/PacientesPerfil/
backend/app/Http/Requests/Paquetes/PacientesPerfil/
backend/app/Paquetes/PacientesPerfil/
frontend/src/Paquetes/PacientesPerfil/
```

---

#### [CU-05] Gestionar Pacientes
* **Actores:** `Recepcionista`, `Administrador`.
* **Objetivo:** Registro presencial en ventanilla, edición de filiación, contactos de emergencia y alternancia lógica de estado activo/inactivo preservando el historial médico (RN01, RN11).

##### 1. Análisis de Clases (BCE)
* **Frontera (Boundary):**
  - `frontend/src/Paquetes/PacientesPerfil/CU05_GestionarPacientes/PaginaGestionPacientes.jsx`
  - `frontend/src/compartido/componentes/TablaExpandible.jsx`
* **Control:**
  - `app/Http/Controllers/Paquetes/PacientesPerfil/CU05_GestionarPacientes/GestionarPacientesControlador.php`
  - `app/Http/Requests/Paquetes/PacientesPerfil/CU05_GestionarPacientes/GuardarPacienteRequest.php`
  - `app/Paquetes/PacientesPerfil/CU05_GestionarPacientes/GestionarPacientesServicio.php`
  - `app/Nucleo/Bitacora/ServicioBitacora.php`
* **Entidad (Entity):**
  - Tablas: `pacientes`, `personas`, `contactos_emergencia`, `informacion_medica_paciente`, `bitacora_auditoria`.

##### 2. Diagrama de Secuencia
```text
Actor -> PaginaGestionPacientes.jsx: guardarPaciente(datosPaciente)
PaginaGestionPacientes.jsx -> GestionarPacientesControlador: store(GuardarPacienteRequest $request)
GestionarPacientesControlador -> GestionarPacientesServicio: crear(array $datos)
GestionarPacientesServicio -> DB: transaction()
GestionarPacientesServicio -> DB: table('personas')->insertGetId([ci, nombres, apellidos, fecha_nacimiento, sexo, telefono, correo, direccion])
GestionarPacientesServicio -> DB: table('pacientes')->insertGetId([id_persona, codigo_historia, grupo_sanguineo, estado: 'activo'])
opt Tiene Contacto de Emergencia
    GestionarPacientesServicio -> DB: table('contactos_emergencia')->insert([id_paciente, nombre_completo, relacion, telefono])
end
GestionarPacientesServicio -> DB: table('informacion_medica_paciente')->insert([id_paciente])
GestionarPacientesServicio -> ServicioBitacora: registrar('CU05_GestionarPacientes', 'CREAR_PACIENTE', 'pacientes', ...)
GestionarPacientesServicio --> GestionarPacientesControlador: int $idPaciente
GestionarPacientesControlador --> PaginaGestionPacientes.jsx: RespuestaApi::exito(['id_paciente' => $id], 'Paciente registrado satisfactoriamente', 201)
```

##### 3. Diagrama de Comunicación
```text
[Actor: Recepcionista / Admin]
       │
       │ 1: guardarPaciente(datos)
       ▼
[:PaginaGestionPacientes.jsx] ── 2: store(GuardarPacienteRequest) ──► [:GestionarPacientesControlador]
                                                                                │
                                                                                │ 3: crear(array $datos)
                                                                                ▼
                                                                     [:GestionarPacientesServicio]
                                                                        │           │
                     4: DB::transaction()                               │           │ 8: registrar('CREAR_PACIENTE')
                     5: table('personas')->insertGetId(...)             │           ▼
                     6: table('pacientes')->insertGetId(...)            │   [:ServicioBitacora]
                     7: table('contactos_emergencia')->insert(...)      │           │
                                       ┌────────────────────────────────┘           │ 9: insert()
                                       ▼                                            ▼
                                  [:DB / PostgreSQL] ───────────────────────► [:bitacora_auditoria]
```

---

#### [CU-06] Gestionar Mi Perfil
* **Actores:** `Paciente` (Autoservicio Web).
* **Objetivo:** Consultar y actualizar datos personales de contacto, información clínica declarada (alergias, patologías crónicas, medicamentos, antecedentes familiares) y contacto de emergencia con extracción exclusiva de identidad desde el token criptográfico de sesión (Anti-IDOR / RN19).

##### 1. Análisis de Clases (BCE)
* **Frontera (Boundary):**
  - `frontend/src/Paquetes/PacientesPerfil/CU06_GestionarMiPerfil/PaginaMiPerfil.jsx`
  - `frontend/src/Paquetes/PacientesPerfil/CU06_GestionarMiPerfil/MiPerfil.jsx`
* **Control:**
  - `app/Http/Controllers/Paquetes/PacientesPerfil/CU06_GestionarMiPerfil/GestionarMiPerfilControlador.php`
  - `app/Http/Requests/Paquetes/PacientesPerfil/CU06_GestionarMiPerfil/ActualizarPerfilRequest.php`
  - `app/Paquetes/PacientesPerfil/CU06_GestionarMiPerfil/GestionarMiPerfilServicio.php`
  - `app/Nucleo/Bitacora/ServicioBitacora.php`
* **Entidad (Entity):**
  - Tablas: `personas`, `pacientes`, `informacion_medica_paciente`, `contactos_emergencia`, `bitacora_auditoria`.

##### 2. Diagrama de Secuencia
```text
Actor -> PaginaMiPerfil.jsx: useEffect() -> api.get('/perfil/mi-perfil')
PaginaMiPerfil.jsx -> GestionarMiPerfilControlador: show(Request $request)
GestionarMiPerfilControlador -> GestionarMiPerfilServicio: obtenerPerfil($usuario->id_persona, $usuario->id_paciente)
GestionarMiPerfilServicio -> DB: table('personas')->join('pacientes')->where(...)->first()
GestionarMiPerfilServicio -> DB: table('informacion_medica_paciente')->where('id_paciente', ...)->first()
GestionarMiPerfilServicio -> DB: table('contactos_emergencia')->where('id_paciente', ...)->first()
GestionarMiPerfilServicio --> GestionarMiPerfilControlador: array $perfilCompleto
GestionarMiPerfilControlador --> PaginaMiPerfil.jsx: RespuestaApi::exito($perfilCompleto)

== Actualización de Perfil ==
Actor -> MiPerfil.jsx: submit(contacto, info_medica, contacto_emergencia)
MiPerfil.jsx -> GestionarMiPerfilControlador: update(ActualizarPerfilRequest $request)
GestionarMiPerfilControlador -> GestionarMiPerfilServicio: actualizarPerfil($idPersona, $idPaciente, $datosValidados, $idUsuario)
GestionarMiPerfilServicio -> DB: transaction(...)
GestionarMiPerfilServicio -> DB: table('personas')->where('id_persona', $idPersona)->update(['telefono', 'correo', 'direccion'])
GestionarMiPerfilServicio -> DB: table('informacion_medica_paciente')->updateOrInsert(['id_paciente' => $idPaciente], [...])
GestionarMiPerfilServicio -> DB: table('contactos_emergencia')->updateOrInsert(['id_paciente' => $idPaciente], [...])
GestionarMiPerfilServicio -> ServicioBitacora: registrar('CU06_GestionarMiPerfil', 'ACTUALIZAR_PERFIL', 'pacientes', ...)
GestionarMiPerfilServicio --> GestionarMiPerfilControlador: array $perfilActualizado
GestionarMiPerfilControlador --> MiPerfil.jsx: RespuestaApi::exito($perfilActualizado, 'Perfil actualizado correctamente')
```

---

### PAQUETE 3: CATÁLOGOS Y HORARIOS (`CatalogosHorarios`)

```
backend/app/Http/Controllers/Paquetes/CatalogosHorarios/
backend/app/Http/Requests/Paquetes/CatalogosHorarios/
backend/app/Paquetes/CatalogosHorarios/
frontend/src/Paquetes/CatalogosHorarios/
```

---

#### [CU-07] Gestionar Especialidades
* **Actores:** `Administrador`.
* **Objetivo:** Mantenimiento de especialidades con normalización canónica anti-duplicados (`nombre_normalizado`), configuración de duración estándar y conmutación de reserva en línea (RF04, RN18).

##### 1. Análisis de Clases (BCE)
* **Frontera (Boundary):**
  - `frontend/src/Paquetes/CatalogosHorarios/CU07_GestionarEspecialidades/PaginaEspecialidades.jsx`
* **Control:**
  - `app/Http/Controllers/Paquetes/CatalogosHorarios/CU07_GestionarEspecialidades/GestionarEspecialidadesControlador.php`
  - `app/Http/Requests/Paquetes/CatalogosHorarios/CU07_GestionarEspecialidades/GuardarEspecialidadRequest.php`
  - `app/Paquetes/CatalogosHorarios/CU07_GestionarEspecialidades/GestionarEspecialidadesServicio.php`
  - `app/Nucleo/Bitacora/ServicioBitacora.php`
* **Entidad (Entity):**
  - Tablas: `especialidades`, `medico_especialidad`, `citas`, `bitacora_auditoria`.

##### 2. Diagrama de Secuencia
```text
Actor -> PaginaEspecialidades.jsx: submit(nombre, descripcion, duracion_turno_minutos, reservable_en_linea)
PaginaEspecialidades.jsx -> GestionarEspecialidadesControlador: store(GuardarEspecialidadRequest $request)
GestionarEspecialidadesControlador -> GestionarEspecialidadesServicio: crear(array $datos)
GestionarEspecialidadesServicio -> GuardarEspecialidadRequest: normalizar(string $nombre)
GestionarEspecialidadesServicio -> DB: table('especialidades')->insertGetId([nombre, nombre_normalizado, descripcion, duracion_turno_minutos, reservable_en_linea, estado: 'activo'])
GestionarEspecialidadesServicio -> ServicioBitacora: registrar('CU07_GestionarEspecialidades', 'CREAR_ESPECIALIDAD', 'especialidades', ...)
GestionarEspecialidadesServicio --> GestionarEspecialidadesControlador: int $idEspecialidad
GestionarEspecialidadesControlador --> PaginaEspecialidades.jsx: RespuestaApi::exito(['id_especialidad' => $id], 'Especialidad creada con éxito', 201)

== Alternar Estado con Advertencia Preventiva ==
Actor -> PaginaEspecialidades.jsx: clickAlternar(idEspecialidad)
PaginaEspecialidades.jsx -> GestionarEspecialidadesControlador: alternarEstado(int $id)
GestionarEspecialidadesControlador -> GestionarEspecialidadesServicio: alternarEstado(int $id)
GestionarEspecialidadesServicio -> DB: table('medico_especialidad')->where('id_especialidad', $id)->count()
GestionarEspecialidadesServicio -> DB: table('citas')->where('id_especialidad', $id)->where('fecha_cita', '>=', today())->count()
GestionarEspecialidadesServicio -> DB: table('especialidades')->where('id_especialidad', $id)->update(['estado' => $nuevoEstado])
GestionarEspecialidadesServicio -> ServicioBitacora: registrar('CU07_GestionarEspecialidades', 'ALTERNAR_ESTADO_ESPECIALIDAD', ...)
GestionarEspecialidadesServicio --> GestionarEspecialidadesControlador: array ['estado' => $nuevo, 'advertencia' => $alertaMsg]
GestionarEspecialidadesControlador --> PaginaEspecialidades.jsx: RespuestaApi::exito($resultado, $mensaje)
```

##### 3. Diagrama de Comunicación
```text
[Actor: Administrador]
       │
       │ 1: submit(datosEspecialidad)
       ▼
[:PaginaEspecialidades.jsx] ── 2: store(GuardarEspecialidadRequest) ──► [:GestionarEspecialidadesControlador]
                                                                                    │
                                                                                    │ 3: crear(array $datos)
                                                                                    ▼
                                                                        [:GestionarEspecialidadesServicio]
                                                                           │        │
                   4: GuardarEspecialidadRequest::normalizar()             │        │ 6: registrar('CREAR_ESPECIALIDAD')
                   5: table('especialidades')->insertGetId(...)            │        ▼
                                       ┌───────────────────────────────────┘   [:ServicioBitacora]
                                       ▼                                                │
                                  [:DB / PostgreSQL]                                    │ 7: insert()
                                       │                                                ▼
                                       └───────────────────────────────────────► [:bitacora_auditoria]
```

---

#### [CU-08] Gestionar Médicos
* **Actores:** `Administrador`.
* **Objetivo:** Registro y actualización de profesionales con matrícula única, asignación múltiple de especialidades activas y control de reactivación (RN02, RN04, RN11).

##### 1. Análisis de Clases (BCE)
* **Frontera (Boundary):**
  - `frontend/src/Paquetes/CatalogosHorarios/CU08_GestionarMedicos/PaginaMedicos.jsx`
* **Control:**
  - `app/Http/Controllers/Paquetes/CatalogosHorarios/CU08_GestionarMedicos/GestionarMedicosControlador.php`
  - `app/Http/Requests/Paquetes/CatalogosHorarios/CU08_GestionarMedicos/GuardarMedicoRequest.php`
  - `app/Paquetes/CatalogosHorarios/CU08_GestionarMedicos/GestionarMedicosServicio.php`
  - `app/Nucleo/Bitacora/ServicioBitacora.php`
* **Entidad (Entity):**
  - Tablas: `medicos`, `personas`, `medico_especialidad`, `especialidades`, `citas`, `bitacora_auditoria`.

##### 2. Diagrama de Secuencia
```text
Actor -> PaginaMedicos.jsx: submit(datosMedico, especialidadesIds)
PaginaMedicos.jsx -> GestionarMedicosControlador: store(GuardarMedicoRequest $request)
GestionarMedicosControlador -> GestionarMedicosServicio: crear(array $datos)
GestionarMedicosServicio -> DB: transaction()
GestionarMedicosServicio -> DB: table('personas')->insertGetId([ci, nombres, apellidos, fecha_nacimiento, sexo, telefono, correo])
GestionarMedicosServicio -> DB: table('medicos')->insertGetId([id_persona, nro_matricula, biografia, estado: 'activo'])
loop Para cada especialidad seleccionada
    GestionarMedicosServicio -> DB: table('medico_especialidad')->insert([id_medico, id_especialidad])
end
GestionarMedicosServicio -> ServicioBitacora: registrar('CU08_GestionarMedicos', 'CREAR_MEDICO', 'medicos', ...)
GestionarMedicosServicio --> GestionarMedicosControlador: int $idMedico
GestionarMedicosControlador --> PaginaMedicos.jsx: RespuestaApi::exito(['id_medico' => $id], 'Médico registrado exitosamente', 201)
```

##### 3. Diagrama de Comunicación
```text
[Actor: Administrador]
       │
       │ 1: submit(datosMedico)
       ▼
[:PaginaMedicos.jsx] ── 2: store(GuardarMedicoRequest) ──► [:GestionarMedicosControlador]
                                                                        │
                                                                        │ 3: crear(array $datos)
                                                                        ▼
                                                             [:GestionarMedicosServicio]
                                                                │            │
                    4: DB::transaction()                        │            │ 8: registrar('CREAR_MEDICO')
                    5: table('personas')->insertGetId(...)      │            ▼
                    6: table('medicos')->insertGetId(...)       │    [:ServicioBitacora]
                    7: table('medico_especialidad')->insert(...)│            │
                                       ┌────────────────────────┘            │ 9: insert()
                                       ▼                                     ▼
                                  [:DB / PostgreSQL] ────────────────► [:bitacora_auditoria]
```

---

#### [CU-09] Gestionar Horarios de Atención
* **Actores:** `Administrador`.
* **Objetivo:** Parametrización de franjas horarias con cálculo de divisibilidad exacta de turnos (RN08) y prevención de colisión médica global inter-especialidad (RN05, RN07).

##### 1. Análisis de Clases (BCE)
* **Frontera (Boundary):**
  - `frontend/src/Paquetes/CatalogosHorarios/CU09_GestionarHorariosAtencion/PaginaHorarios.jsx`
  - `frontend/src/Paquetes/CatalogosHorarios/CU09_GestionarHorariosAtencion/ModalHorario.jsx`
* **Control:**
  - `app/Http/Controllers/Paquetes/CatalogosHorarios/CU09_GestionarHorariosAtencion/GestionarHorariosAtencionControlador.php`
  - `app/Http/Requests/Paquetes/CatalogosHorarios/CU09_GestionarHorariosAtencion/GuardarHorarioRequest.php`
  - `app/Paquetes/CatalogosHorarios/CU09_GestionarHorariosAtencion/GestionarHorariosAtencionServicio.php`
  - `app/Nucleo/Bitacora/ServicioBitacora.php`
* **Entidad (Entity):**
  - Tablas: `horarios_atencion`, `medicos`, `especialidades`, `citas`, `bitacora_auditoria`.

##### 2. Diagrama de Secuencia
```text
Actor -> ModalHorario.jsx: submit(id_medico, id_especialidad, dias, hora_inicio, hora_fin, duracion_turno_minutos)
ModalHorario.jsx -> GestionarHorariosAtencionControlador: store(GuardarHorarioRequest $request)
GestionarHorariosAtencionControlador -> GestionarHorariosAtencionServicio: crear(array $datos)
GestionarHorariosAtencionServicio -> DB: transaction()
loop Para cada día seleccionado en lote
    GestionarHorariosAtencionServicio -> DB: table('horarios_atencion')->where('id_medico', $idMedico)->where('dia_semana', $dia)->where('estado', 'activo')->get()
    alt Existe Solapamiento Global de Horas con el Médico (RN05/RN07)
        GestionarHorariosAtencionServicio --> GestionarHorariosAtencionControlador: throw Exception('Conflicto: El médico ya tiene horario...', 422)
        GestionarHorariosAtencionControlador --> ModalHorario.jsx: RespuestaApi::error('Conflicto...', 422)
    else Franja Horaria Libre
        GestionarHorariosAtencionServicio -> DB: table('horarios_atencion')->insertGetId([id_medico, id_especialidad, dia_semana, hora_inicio, hora_fin, duracion_turno_minutos, estado: 'activo'])
        GestionarHorariosAtencionServicio -> ServicioBitacora: registrar('CU09_GestionarHorariosAtencion', 'CREAR_HORARIO', ...)
    end
end
GestionarHorariosAtencionServicio --> GestionarHorariosAtencionControlador: array $idsCreados
GestionarHorariosAtencionControlador --> ModalHorario.jsx: RespuestaApi::exito(['ids_horarios' => $ids], 'Horario(s)...', 201)
```

##### 3. Diagrama de Comunicación
```text
[Actor: Administrador]
       │
       │ 1: submit(datosHorario)
       ▼
[:ModalHorario.jsx] ── 2: store(GuardarHorarioRequest) ──► [:GestionarHorariosAtencionControlador]
                                                                        │
                                                                        │ 3: crear(array $datos)
                                                                        ▼
                                                             [:GestionarHorariosAtencionServicio]
                                                                │            │
                    4: where('id_medico')->where('dia_semana')  │            │ 6: registrar('CREAR_HORARIO')
                    5: table('horarios_atencion')->insertGetId  │            ▼
                                       ┌────────────────────────┘    [:ServicioBitacora]
                                       ▼                                     │
                                  [:DB / PostgreSQL]                         │ 7: insert()
                                       │                                     ▼
                                       └─────────────────────────────► [:bitacora_auditoria]
```

---

#### [CU-10] Consultar Disponibilidad
* **Actores:** `Paciente`, `Recepcionista`.
* **Objetivo:** Cálculo dinámico en servidor de turnos libres descontando citas activas, feriados de clínica (RN20) y suspensiones (RF05, RF07, RN09).

##### 1. Análisis de Clases (BCE)
* **Frontera (Boundary):**
  - `frontend/src/Paquetes/CatalogosHorarios/CU10_ConsultarDisponibilidad/SelectorDisponibilidadTurnos.jsx`
  - `frontend/src/Paquetes/CitasNotificaciones/CU12_GestionarCitas/PaginaReservaCitas.jsx`
* **Control:**
  - `app/Http/Controllers/Paquetes/CatalogosHorarios/CU10_ConsultarDisponibilidad/ConsultarDisponibilidadControlador.php`
  - `app/Http/Requests/Paquetes/CatalogosHorarios/CU10_ConsultarDisponibilidad/ConsultarDisponibilidadRequest.php`
  - `app/Paquetes/CatalogosHorarios/CU10_ConsultarDisponibilidad/ConsultarDisponibilidadServicio.php`
* **Entidad (Entity):**
  - Tablas: `horarios_atencion`, `citas`, `bloqueos_clinica`, `suspensiones_horario`, `estados_cita`, `especialidades`.

##### 2. Diagrama de Secuencia
```text
Actor -> SelectorDisponibilidadTurnos.jsx: changeFiltros(id_medico, id_especialidad, fecha)
SelectorDisponibilidadTurnos.jsx -> ConsultarDisponibilidadControlador: consultar(ConsultarDisponibilidadRequest $request)
ConsultarDisponibilidadControlador -> ConsultarDisponibilidadServicio: consultar(int $idMedico, int $idEspecialidad, string $fecha, ?string $rolUsuario)
ConsultarDisponibilidadServicio -> DB: table('bloqueos_clinica')->where(...)->first()
alt Existe Bloqueo de Clínica o Feriado (RN20)
    ConsultarDisponibilidadServicio --> ConsultarDisponibilidadControlador: array ['disponible' => false, 'motivo_bloqueo' => ..., 'turnos' => []]
    ConsultarDisponibilidadControlador --> SelectorDisponibilidadTurnos.jsx: RespuestaApi::exito($resultado)
else Sin Bloqueo General
    ConsultarDisponibilidadServicio -> DB: table('suspensiones_horario')->where('id_medico', $idMedico)->where(...)->first()
    alt Médico con Suspensión Activa
        ConsultarDisponibilidadServicio --> ConsultarDisponibilidadControlador: array ['disponible' => false, 'motivo_bloqueo' => ..., 'turnos' => []]
    else Médico Operativo
        ConsultarDisponibilidadServicio -> DB: table('horarios_atencion')->where('id_medico', $idMedico)->where('dia_semana', $dia)->where('estado', 'activo')->get()
        ConsultarDisponibilidadServicio -> DB: table('citas')->join('estados_cita')->where('id_medico', $idMedico)->where('fecha_cita', $fecha)->where('estados_cita.ocupa_turno', true)->get()
        ConsultarDisponibilidadServicio -> ConsultarDisponibilidadServicio: descomponerIntervalosEnTurnos($horarios, $citasOcupadas)
        ConsultarDisponibilidadServicio --> ConsultarDisponibilidadControlador: array ['disponible' => true, 'turnos' => $turnosCalculados]
        ConsultarDisponibilidadControlador --> SelectorDisponibilidadTurnos.jsx: RespuestaApi::exito($resultado)
    end
end
```

##### 3. Diagrama de Comunicación
```text
[Actor: Paciente / Recepcionista]
       │
       │ 1: changeFiltros(medico, especialidad, fecha)
       ▼
[:SelectorDisponibilidadTurnos.jsx] ── 2: consultar(ConsultarDisponibilidadRequest) ──► [:ConsultarDisponibilidadControlador]
                                                                                                    │
                                                                                                    │ 3: consultar($med, $esp, $fec, $rol)
                                                                                                    ▼
                                                                                        [:ConsultarDisponibilidadServicio]
                                                                                                    │
                                          4: table('bloqueos_clinica')->where(...)                  │
                                          5: table('suspensiones_horario')->where(...)              │
                                          6: table('horarios_atencion')->where(...)                 │
                                          7: table('citas')->where('ocupa_turno', true)             ▼
                                                                                           [:DB / PostgreSQL]
```

---

### PAQUETE 4: CITAS Y NOTIFICACIONES (`CitasNotificaciones`)

```
backend/app/Http/Controllers/Paquetes/CitasNotificaciones/
backend/app/Http/Requests/Paquetes/CitasNotificaciones/
backend/app/Paquetes/CitasNotificaciones/
frontend/src/Paquetes/CitasNotificaciones/
```

---

#### [CU-12] Gestionar Citas (Programar, Reprogramar, Cancelar y Confirmar)
* **Actores:** `Recepcionista`, `Paciente`.
* **Objetivo:** Orquestación transaccional con bloqueo pesimista `lockForUpdate()`, delegando el depósito de garantía en CU-27 y aplicando la política de cancelación de 12 horas (RN15).

##### 1. Análisis de Clases (BCE)
* **Frontera (Boundary):**
  - `frontend/src/Paquetes/CitasNotificaciones/CU12_GestionarCitas/PaginaReservaCitas.jsx`
  - `frontend/src/Paquetes/CitasNotificaciones/CU27_GestionarPagosReembolsos/ModalPasarelaPagoSimulada.jsx`
  - `frontend/src/compartido/componentes/TablaExpandible.jsx`
* **Control:**
  - `app/Http/Controllers/Paquetes/CitasNotificaciones/CU12_GestionarCitas/GestionarCitasControlador.php`
  - `app/Http/Requests/Paquetes/CitasNotificaciones/CU12_GestionarCitas/CrearCitaRequest.php`
  - `app/Http/Requests/Paquetes/CitasNotificaciones/CU12_GestionarCitas/ReprogramarCitaRequest.php`
  - `app/Paquetes/CitasNotificaciones/CU12_GestionarCitas/GestionarCitasServicio.php`
  - `app/Paquetes/CitasNotificaciones/CU27_GestionarPagosReembolsos/GestionarPagosReembolsosServicio.php`
  - `app/Nucleo/Bitacora/ServicioBitacora.php`
* **Entidad (Entity):**
  - Tablas: `citas`, `estados_cita`, `pagos_cita`, `parametros_sistema`, `bitacora_auditoria`.

##### 2. Diagrama de Secuencia
```text
== Flujo de Reserva con Pago (Programar) ==
Actor -> PaginaReservaCitas.jsx: confirmarReserva(id_paciente, id_medico, id_esp, fecha, hora_inicio, metodo_pago)
PaginaReservaCitas.jsx -> GestionarCitasControlador: store(CrearCitaRequest $request)
GestionarCitasControlador -> GestionarCitasServicio: crear(array $datos, ?int $idUsuarioOperador)
GestionarCitasServicio -> DB: transaction()
GestionarCitasServicio -> DB: table('citas')->where('id_medico', $idMed)->where('fecha_cita', $fecha)->where('hora_inicio', '<', $fin)->where('hora_fin', '>', $inicio)->lockForUpdate()->first()
alt Turno Solapado (Conflicto Concurrente)
    GestionarCitasServicio --> GestionarCitasControlador: throw Exception('El turno médico seleccionado ya ha sido reservado...', 409)
    GestionarCitasControlador --> PaginaReservaCitas.jsx: RespuestaApi::error('Turno reservado...', 409)
else Turno Libre
    GestionarCitasServicio -> DB: table('citas')->insertGetId([codigo_cita: 'CIT-YYYYMMDD-XXXXX', id_paciente, id_medico, id_especialidad, id_estado_cita: 1, fecha_cita, hora_inicio, hora_fin, estado: 'programada'])
    opt Pasarela de Pago Solicitada en Reserva
        GestionarCitasServicio -> GestionarPagosReembolsosServicio: procesarDepositoGarantia(int $idCita, array $datosPago, $usuarioOperador)
        GestionarPagosReembolsosServicio --> GestionarCitasServicio: array $resPago
    end
    GestionarCitasServicio -> ServicioBitacora: registrar('CU12_GestionarCitas', 'CREAR_CITA', 'citas', ...)
    GestionarCitasServicio --> GestionarCitasControlador: array ['id_cita' => $idCita, 'codigo_cita' => ..., 'pago' => ...]
    GestionarCitasControlador --> PaginaReservaCitas.jsx: RespuestaApi::exito($resultado, 'Cita reservada satisfactoriamente', 201)
end

== Flujo de Cancelación (RN15 con Política de Reembolso/Retención) ==
Actor -> TablaExpandible.jsx: cancelar(idCita, motivo)
TablaExpandible.jsx -> GestionarCitasControlador: cancelar(Request $request, int $id)
GestionarCitasControlador -> GestionarCitasServicio: cancelar(int $idCita, string $motivo, $usuarioOperador)
GestionarCitasServicio -> DB: transaction()
GestionarCitasServicio -> DB: table('citas')->where('id_cita', $idCita)->lockForUpdate()->first()
GestionarCitasServicio -> Carbon: now()->diffInMinutes($inicioTurno, false)
alt Anticipación >= 12 Horas (720 min)
    GestionarCitasServicio -> GestionarPagosReembolsosServicio: procesarReembolsoORetencion($idCita, $usuarioOperador, $motivo)
    // Actualiza pagos_cita.estado_pago = 'reembolsado' y audita REEMBOLSO_RESERVA_RN15
else Anticipación < 12 Horas o Inasistencia
    alt Si es Paciente Web
        GestionarCitasServicio --> GestionarCitasControlador: throw Exception('El plazo de cancelación en línea ha vencido (mínimo 12 horas)...', 422)
    else Si cancela Recepción/Personal
        GestionarCitasServicio -> GestionarPagosReembolsosServicio: procesarReembolsoORetencion($idCita, $usuarioOperador, $motivo)
        // Actualiza pagos_cita.estado_pago = 'retenido' en concepto de penalización administrativa
    end
end
GestionarCitasServicio -> DB: table('citas')->where('id_cita', $idCita)->update(['id_estado_cita' => 5, 'estado' => 'cancelada'])
GestionarCitasServicio -> ServicioBitacora: registrar('CU12_GestionarCitas', 'CANCELAR_CITA', 'citas', ...)
GestionarCitasControlador --> TablaExpandible.jsx: RespuestaApi::exito(null, 'Cita cancelada correctamente')
```

##### 3. Diagrama de Comunicación
```text
[Actor: Paciente / Recepcionista]
       │
       │ 1: confirmarReserva(datosReserva)
       ▼
[:PaginaReservaCitas.jsx] ── 2: store(CrearCitaRequest) ──► [:GestionarCitasControlador]
                                                                        │
                                                                        │ 3: crear(array $datos, $user)
                                                                        ▼
                                                             [:GestionarCitasServicio]
                                                                │            │
                    4: lockForUpdate()                          │            │ 6: procesarDepositoGarantia()
                    5: table('citas')->insertGetId(...)         │            ▼
                                       ┌────────────────────────┤   [:GestionarPagosReembolsosServicio]
                                       │                        │            │
                                       ▼                        │            │ 7: table('pagos_cita')->insertGetId()
                                  [:DB / PostgreSQL] ◄──────────┴────────────┘
                                       │
                                       └────────────────────────► [:bitacora_auditoria]
```

---

#### [CU-13] Registrar Asistencia, Inasistencia o Atención
* **Actores:** `Recepcionista`, `Médico`, `Administrador` (Exclusivo Corrección RN16).
* **Objetivo:** Conmutación operativa de estados con restricción temporal estricta (RN10), blindaje anti-reactivación de citas canceladas y Corrección Administrativa Autorizada (RN16) auditada en bitácora (RN21).

##### 1. Análisis de Clases (BCE)
* **Frontera (Boundary):**
  - `frontend/src/Paquetes/CitasNotificaciones/CU14_ConsultarAgendaCitas/PaginaAgendaCitas.jsx`
  - Modal de confirmación y marcación de estado.
* **Control:**
  - `app/Http/Controllers/Paquetes/CitasNotificaciones/CU13_RegistrarAsistenciaInasistenciaAtencion/RegistrarAsistenciaControlador.php`
  - `app/Http/Requests/Paquetes/CitasNotificaciones/CU13_RegistrarAsistenciaInasistenciaAtencion/RegistrarAsistenciaRequest.php`
  - `app/Paquetes/CitasNotificaciones/CU13_RegistrarAsistenciaInasistenciaAtencion/RegistrarAsistenciaServicio.php`
  - `app/Nucleo/Bitacora/ServicioBitacora.php`
* **Entidad (Entity):**
  - Tablas: `citas`, `estados_cita`, `pagos_cita`, `bitacora_auditoria`.

##### 2. Diagrama de Secuencia
```text
Actor -> PaginaAgendaCitas.jsx: registrarAsistencia(id_cita, estado: 'atendida' | 'inasistencia')
PaginaAgendaCitas.jsx -> RegistrarAsistenciaControlador: registrar(RegistrarAsistenciaRequest $request, int $id)
RegistrarAsistenciaControlador -> RegistrarAsistenciaServicio: registrar(array $datos, mixed $usuarioOperador)
RegistrarAsistenciaServicio -> DB: transaction()
RegistrarAsistenciaServicio -> DB: table('citas')->where('id_cita', $idCita)->lockForUpdate()->first()
alt Cita Cancelada (Regla Anti-Reactivación RN16)
    RegistrarAsistenciaServicio --> RegistrarAsistenciaControlador: throw Exception('Una cita cancelada no puede reactivarse...', 422)
    RegistrarAsistenciaControlador --> PaginaAgendaCitas.jsx: RespuestaApi::error('Cita cancelada...', 422)
else Cita Cerrada (Atendida o Inasistencia) -> Corrección Administrativa RN16
    alt Usuario Operador NO es Administrador
        RegistrarAsistenciaServicio --> RegistrarAsistenciaControlador: throw Exception('Solo el Administrador cuenta con autorización...', 403)
    else Motivo Justificado Presente
        RegistrarAsistenciaServicio -> DB: table('citas')->where('id_cita', $idCita)->update(['id_estado_cita' => $nuevoId, 'estado' => $nuevoCod])
        RegistrarAsistenciaServicio -> ServicioBitacora: registrar('CU13_RegistrarAsistencia', 'CORRECCION_ADMINISTRATIVA_ESTADO_CITA', ...)
    end
else Marcación Normal de Turno en Curso (RN10)
    alt Fecha/Hora Futura antes del Inicio del Turno
        RegistrarAsistenciaServicio --> RegistrarAsistenciaControlador: throw Exception('No se puede registrar asistencia antes del inicio del turno programado.', 422)
    else Turno en Ejecución o Pasado
        RegistrarAsistenciaServicio -> DB: table('citas')->where('id_cita', $idCita)->update(['id_estado_cita' => $nuevoId, 'estado' => $nuevoCod])
        opt Si el Estado es Inasistencia
            RegistrarAsistenciaServicio -> DB: table('pagos_cita')->where('id_cita', $idCita)->update(['estado_pago' => 'retenido'])
        end
        RegistrarAsistenciaServicio -> ServicioBitacora: registrar('CU13_RegistrarAsistencia', 'CAMBIO_ESTADO_CITA', ...)
    end
end
RegistrarAsistenciaServicio --> RegistrarAsistenciaControlador: array ['id_cita' => $idCita, 'estado_nuevo' => $nuevoCod]
RegistrarAsistenciaControlador --> PaginaAgendaCitas.jsx: RespuestaApi::exito($resultado, 'Estado de cita actualizado satisfactoriamente')
```

##### 3. Diagrama de Comunicación
```text
[Actor: Médico / Recepcionista / Admin]
       │
       │ 1: registrarAsistencia(id_cita, nuevo_estado)
       ▼
[:PaginaAgendaCitas.jsx] ── 2: registrar(RegistrarAsistenciaRequest) ──► [:RegistrarAsistenciaControlador]
                                                                                     │
                                                                                     │ 3: registrar(array $datos, $user)
                                                                                     ▼
                                                                         [:RegistrarAsistenciaServicio]
                                                                            │             │
                    4: lockForUpdate()                                      │             │ 7: registrar('CAMBIO_ESTADO_CITA')
                    5: table('citas')->update(...)                          │             ▼
                    6: table('pagos_cita')->update(['retenido'])            │    [:ServicioBitacora]
                                       ┌────────────────────────────────────┘             │
                                       ▼                                                  │ 8: insert()
                                  [:DB / PostgreSQL]                                      ▼
                                       │                                         [:bitacora_auditoria]
                                       └────────────────────────────────────────►
```

---

#### [CU-14] Consultar Agenda de Citas
* **Actores:** `Médico` (Aislado a su perfil, RN12/RN19), `Recepcionista`, `Administrador`.
* **Objetivo:** Consulta operativa de citas del día con filtros reactivos por especialidad y estado, excluyendo citas canceladas de la grilla de atención.

##### 1. Análisis de Clases (BCE)
* **Frontera (Boundary):**
  - `frontend/src/Paquetes/CitasNotificaciones/CU14_ConsultarAgendaCitas/PaginaAgendaCitas.jsx`
  - `frontend/src/compartido/componentes/TablaExpandible.jsx`
* **Control:**
  - `app/Http/Controllers/Paquetes/CitasNotificaciones/CU14_ConsultarAgendaCitas/ConsultarAgendaCitasControlador.php`
  - `app/Paquetes/CitasNotificaciones/CU14_ConsultarAgendaCitas/ConsultarAgendaCitasServicio.php`
* **Entidad (Entity):**
  - Tablas: `citas`, `medicos`, `pacientes`, `personas`, `especialidades`, `estados_cita`.

##### 2. Diagrama de Secuencia
```text
Actor -> PaginaAgendaCitas.jsx: filtrar(fecha, id_especialidad, estado)
PaginaAgendaCitas.jsx -> ConsultarAgendaCitasControlador: index(Request $request)
ConsultarAgendaCitasControlador -> ConsultarAgendaCitasServicio: obtenerAgenda(?int $idMedico, ?string $fecha, ?int $idEspecialidad, ?string $estado)
alt Usuario Autenticado es Médico (RN12/RN19)
    ConsultarAgendaCitasControlador -> ConsultarAgendaCitasControlador: forzar $idMedico = $usuario->id_medico
end
ConsultarAgendaCitasServicio -> DB: table('citas')
    ->join('pacientes', 'citas.id_paciente', '=', 'pacientes.id_paciente')
    ->join('personas as per_paciente', 'pacientes.id_persona', '=', 'per_paciente.id_persona')
    ->join('medicos', 'citas.id_medico', '=', 'medicos.id_medico')
    ->join('personas as per_medico', 'medicos.id_persona', '=', 'per_medico.id_persona')
    ->join('especialidades', 'citas.id_especialidad', '=', 'especialidades.id_especialidad')
    ->join('estados_cita', 'citas.id_estado_cita', '=', 'estados_cita.id_estado_cita')
    ->where('citas.fecha_cita', $fecha)
    ->where('citas.estado', '!=', 'cancelada') // Exclusión operativa de canceladas
    ->orderBy('citas.hora_inicio', 'asc')->get()
ConsultarAgendaCitasServicio --> ConsultarAgendaCitasControlador: array $agenda
ConsultarAgendaCitasControlador --> PaginaAgendaCitas.jsx: RespuestaApi::exito($agenda)
PaginaAgendaCitas.jsx -> TablaExpandible.jsx: renderizarCardsMobile()
```

##### 3. Diagrama de Comunicación
```text
[Actor: Médico / Recepcionista]
       │
       │ 1: filtrar(fecha, especialidad, estado)
       ▼
[:PaginaAgendaCitas.jsx] ── 2: index(Request $request) ──► [:ConsultarAgendaCitasControlador]
                                                                      │
                                                                      │ 3: obtenerAgenda($medico, $fecha, $esp, $est)
                                                                      ▼
                                                          [:ConsultarAgendaCitasServicio]
                                                                      │
                                   4: join('pacientes')->join('medicos')->where(...)
                                   5: where('estado', '!=', 'cancelada')->get()
                                                                      ▼
                                                             [:DB / PostgreSQL]
```

---

#### [CU-15] Consultar Historial y Seguimiento de Citas
* **Actores:** `Paciente` (Aislado forzosamente por token, RN19), `Recepcionista`, `Médico`.
* **Objetivo:** Trazabilidad cronológica descendente de todas las citas del paciente (incluyendo canceladas y pasadas, RN10), con búsqueda predictiva e insignia del estado del depósito de garantía.

##### 1. Análisis de Clases (BCE)
* **Frontera (Boundary):**
  - `frontend/src/Paquetes/CitasNotificaciones/CU15_ConsultarHistorialSeguimientoCitas/PaginaHistorialCitas.jsx`
  - `frontend/src/compartido/componentes/TablaExpandible.jsx`
  - `frontend/src/Paquetes/CitasNotificaciones/CU27_GestionarPagosReembolsos/InsigniaEstadoPago.jsx`
* **Control:**
  - `app/Http/Controllers/Paquetes/CitasNotificaciones/CU15_ConsultarHistorialSeguimientoCitas/HistorialSeguimientoCitasControlador.php`
  - `app/Paquetes/CitasNotificaciones/CU15_ConsultarHistorialSeguimientoCitas/HistorialSeguimientoCitasServicio.php`
* **Entidad (Entity):**
  - Tablas: `citas`, `pacientes`, `personas`, `medicos`, `especialidades`, `estados_cita`, `pagos_cita`, `atenciones_clinicas`.

##### 2. Diagrama de Secuencia
```text
Actor -> PaginaHistorialCitas.jsx: buscar(codigo_cita)
PaginaHistorialCitas.jsx -> HistorialSeguimientoCitasControlador: index(Request $request)
alt Usuario Autenticado es Paciente (Blindaje IDOR RN19)
    HistorialSeguimientoCitasControlador -> HistorialSeguimientoCitasControlador: forzar $idPaciente = $usuario->id_paciente
end
HistorialSeguimientoCitasControlador -> HistorialSeguimientoCitasServicio: consultarHistorial(?int $idPaciente, ?string $codigoCita)
HistorialSeguimientoCitasServicio -> DB: table('citas')
    ->join('pacientes', 'citas.id_paciente', '=', 'pacientes.id_paciente')
    ->join('personas as per_paciente', 'pacientes.id_persona', '=', 'per_paciente.id_persona')
    ->join('medicos', 'citas.id_medico', '=', 'medicos.id_medico')
    ->join('personas as per_medico', 'medicos.id_persona', '=', 'per_medico.id_persona')
    ->join('especialidades', 'citas.id_especialidad', '=', 'especialidades.id_especialidad')
    ->join('estados_cita', 'citas.id_estado_cita', '=', 'estados_cita.id_estado_cita')
    ->leftJoin('pagos_cita', 'citas.id_cita', '=', 'pagos_cita.id_cita')
    ->orderBy('citas.fecha_cita', 'desc')
    ->orderBy('citas.hora_inicio', 'desc')->get()
HistorialSeguimientoCitasServicio --> HistorialSeguimientoCitasControlador: array $historial
HistorialSeguimientoCitasControlador --> PaginaHistorialCitas.jsx: RespuestaApi::exito($historial)
PaginaHistorialCitas.jsx -> InsigniaEstadoPago.jsx: renderBadge(pago_estado)
```

##### 3. Diagrama de Comunicación
```text
[Actor: Paciente / Personal]
       │
       │ 1: buscar(codigo_cita)
       ▼
[:PaginaHistorialCitas.jsx] ── 2: index(Request $request) ──► [:HistorialSeguimientoCitasControlador]
                                                                           │
                                                                           │ 3: consultarHistorial($idPac, $cod)
                                                                           ▼
                                                              [:HistorialSeguimientoCitasServicio]
                                                                           │
                                  4: join('pacientes')->leftJoin('pagos_cita')
                                  5: orderBy('fecha_cita', 'desc')->get()  │
                                                                           ▼
                                                                  [:DB / PostgreSQL]
```

---

#### [CU-27] Gestionar Pagos y Reembolsos de Garantía de Cita
* **Actores:** `Paciente` (Web), `Recepcionista` (Ventanilla).
* **Objetivo:** Caso de uso autónomo para procesar depósitos de garantía (50 Bs, D17), emitir comprobantes digitales oficiales y gestionar reembolsos automáticos ($\ge 12$h) o retenciones por penalización ($< 12$h o inasistencia) según RN15.

##### 1. Análisis de Clases (BCE)
* **Frontera (Boundary):**
  - `frontend/src/Paquetes/CitasNotificaciones/CU27_GestionarPagosReembolsos/ModalPasarelaPagoSimulada.jsx`
  - `frontend/src/Paquetes/CitasNotificaciones/CU27_GestionarPagosReembolsos/ComprobanteDigitalTransaccion.jsx`
  - `frontend/src/Paquetes/CitasNotificaciones/CU27_GestionarPagosReembolsos/InsigniaEstadoPago.jsx`
* **Control:**
  - `app/Http/Controllers/Paquetes/CitasNotificaciones/CU27_GestionarPagosReembolsos/GestionarPagosReembolsosControlador.php`
  - `app/Http/Requests/Paquetes/CitasNotificaciones/CU27_GestionarPagosReembolsos/ProcesarPagoRequest.php`
  - `app/Paquetes/CitasNotificaciones/CU27_GestionarPagosReembolsos/GestionarPagosReembolsosServicio.php`
  - `app/Nucleo/Bitacora/ServicioBitacora.php`
* **Entidad (Entity):**
  - Tablas: `pagos_cita`, `citas`, `parametros_sistema`, `bitacora_auditoria`.

##### 2. Diagrama de Secuencia
```text
== Procesamiento de Depósito de Garantía ==
Actor -> ModalPasarelaPagoSimulada.jsx: procesarPago(id_cita, metodo_pago: 'qr_transferencia' | 'tarjeta_debito_credito')
ModalPasarelaPagoSimulada.jsx -> GestionarPagosReembolsosControlador: procesarPago(ProcesarPagoRequest $request)
GestionarPagosReembolsosControlador -> GestionarPagosReembolsosServicio: procesarDepositoGarantia(int $idCita, array $datosPago, $usuarioOperador)
GestionarPagosReembolsosServicio -> DB: transaction()
GestionarPagosReembolsosServicio -> DB: table('citas')->where('id_cita', $idCita)->lockForUpdate()->first()
alt Si es Paciente autenticado (Blindaje IDOR RN19)
    GestionarPagosReembolsosServicio -> GestionarPagosReembolsosServicio: validarPropiedadCita($cita, $usuarioOperador)
end
GestionarPagosReembolsosServicio -> DB: table('parametros_sistema')->where('clave', 'MONTO_FIJO_RESERVA_CITA')->value('valor') // 50.00 Bs
GestionarPagosReembolsosServicio -> DB: table('pagos_cita')->insertGetId([
    id_cita: $idCita,
    monto: 50.00,
    metodo_pago: $metodo,
    nro_transaccion: 'TX-YYYYMMDD-XXXXXX',
    estado_pago: 'completado',
    fecha_pago: now()
])
GestionarPagosReembolsosServicio -> DB: table('citas')->where('id_cita', $idCita)->update(['id_pago' => $idPago, 'pago_confirmado' => true])
GestionarPagosReembolsosServicio -> ServicioBitacora: registrar('CU27_GestionarPagosReembolsos', 'PAGO_GARANTIA_RESERVA_COMPLETADO', 'pagos_cita', ...)
GestionarPagosReembolsosServicio --> GestionarPagosReembolsosControlador: array $comprobanteDigital
GestionarPagosReembolsosControlador --> ModalPasarelaPagoSimulada.jsx: RespuestaApi::exito($comprobante, 'Depósito procesado...', 201)
ModalPasarelaPagoSimulada.jsx -> ComprobanteDigitalTransaccion.jsx: renderizarReciboOficial()

== Evaluación de Reembolso o Retención (RN15) ==
ControladorExterno -> GestionarPagosReembolsosServicio: procesarReembolsoORetencion(int $idCita, $usuarioOperador, string $motivo)
GestionarPagosReembolsosServicio -> Carbon: now()->diffInMinutes($inicioTurno, false)
alt Anticipación >= 12 Horas (>= 720 min)
    GestionarPagosReembolsosServicio -> DB: table('pagos_cita')->where('id_cita', $idCita)->update(['estado_pago' => 'reembolsado', 'fecha_reembolso' => now()])
    GestionarPagosReembolsosServicio -> ServicioBitacora: registrar('CU27_GestionarPagosReembolsos', 'REEMBOLSO_RESERVA_RN15', 'pagos_cita', ...)
else Anticipación < 12 Horas o Inasistencia
    GestionarPagosReembolsosServicio -> DB: table('pagos_cita')->where('id_cita', $idCita)->update(['estado_pago' => 'retenido'])
    GestionarPagosReembolsosServicio -> ServicioBitacora: registrar('CU27_GestionarPagosReembolsos', 'PENALIZACION_RETENCION_PAGO_RN15', 'pagos_cita', ...)
end
```

##### 3. Diagrama de Comunicación
```text
[Actor: Paciente / Recepcionista]
       │
       │ 1: procesarPago(id_cita, metodo_pago)
       ▼
[:ModalPasarelaPagoSimulada.jsx] ── 2: procesarPago(ProcesarPagoRequest) ──► [:GestionarPagosReembolsosControlador]
                                                                                          │
                                                                                          │ 3: procesarDepositoGarantia($id, $datos, $user)
                                                                                          ▼
                                                                             [:GestionarPagosReembolsosServicio]
                                                                                │            │
                    4: DB::transaction()                                        │            │ 8: registrar('PAGO_GARANTIA...')
                    5: table('citas')->lockForUpdate()                          │            ▼
                    6: table('pagos_cita')->insertGetId(...)                    │    [:ServicioBitacora]
                    7: table('citas')->update(['id_pago', 'pago_confirmado'])   │            │
                                       ┌────────────────────────────────────────┘            │ 9: insert()
                                       ▼                                                     ▼
                                  [:DB / PostgreSQL] ────────────────────────► [:bitacora_auditoria]
```

---

## 4. Matriz de Cobertura y Trazabilidad Cruzada: Clases BCE vs Casos de Uso

| CU | Paquete | Frontera (Boundary) | Control (Controlador / Request / Servicio) | Entidad (Entity) |
| :--- | :--- | :--- | :--- | :--- |
| **CU-01** | `AccesoCuentas` | `PaginaLogin.jsx`, `SelectorPerfilLogin.jsx`, `LayoutPrincipal.jsx` | `IniciarCerrarSesionControlador`, `IniciarSesionRequest`, `IniciarCerrarSesionServicio` | `usuarios`, `personas`, `roles`, `bitacora_auditoria` |
| **CU-02** | `AccesoCuentas` (Cambiar y recuperar contraseña) | `ModalRecuperarPassword.jsx`, `ModalCambiarContrasena.jsx` | `CambiarContrasenaControlador`, `CambiarContrasenaRequest`, `CambiarContrasenaServicio` | `usuarios`, `bitacora_auditoria` |
| **CU-03** | `AccesoCuentas` | `PaginaRegistroPaciente.jsx` | `RegistrarsePacienteControlador`, `RegistrarsePacienteRequest`, `RegistrarsePacienteServicio` | `personas`, `usuarios`, `pacientes`, `bitacora_auditoria` |
| **CU-04** | `AccesoCuentas` | `PaginaUsuariosRoles.jsx` | `AdministrarUsuariosRolesControlador`, `GuardarUsuarioRequest`, `AdministrarUsuariosRolesServicio` | `usuarios`, `personas`, `roles`, `permisos`, `rol_permiso` |
| **CU-05** | `PacientesPerfil` | `PaginaGestionPacientes.jsx`, `TablaExpandible.jsx` | `GestionarPacientesControlador`, `GuardarPacienteRequest`, `GestionarPacientesServicio` | `pacientes`, `personas`, `contactos_emergencia`, `bitacora_auditoria` |
| **CU-06** | `PacientesPerfil` | `PaginaMiPerfil.jsx`, `MiPerfil.jsx` | `GestionarMiPerfilControlador`, `ActualizarPerfilRequest`, `GestionarMiPerfilServicio` | `personas`, `pacientes`, `informacion_medica_paciente`, `contactos_emergencia`, `bitacora_auditoria` |
| **CU-07** | `CatalogosHorarios` | `PaginaEspecialidades.jsx` | `GestionarEspecialidadesControlador`, `GuardarEspecialidadRequest`, `GestionarEspecialidadesServicio` | `especialidades`, `medico_especialidad`, `citas` |
| **CU-08** | `CatalogosHorarios` | `PaginaMedicos.jsx` | `GestionarMedicosControlador`, `GuardarMedicoRequest`, `GestionarMedicosServicio` | `medicos`, `personas`, `medico_especialidad`, `especialidades` |
| **CU-09** | `CatalogosHorarios` | `PaginaHorarios.jsx`, `ModalHorario.jsx` | `GestionarHorariosAtencionControlador`, `GuardarHorarioRequest`, `GestionarHorariosAtencionServicio` | `horarios_atencion`, `medicos`, `especialidades` |
| **CU-10** | `CatalogosHorarios` | `SelectorDisponibilidadTurnos.jsx`, `PaginaReservaCitas.jsx` | `ConsultarDisponibilidadControlador`, `ConsultarDisponibilidadRequest`, `ConsultarDisponibilidadServicio` | `horarios_atencion`, `citas`, `bloqueos_clinica`, `suspensiones_horario` |
| **CU-11** | `CatalogosHorarios` | `PaginaSuspensiones.jsx`, `ModalNuevaSuspension.jsx`, `ModalReubicarCita.jsx` | `SuspenderHorarioControlador`, `SuspenderHorarioRequest`, `ReubicarCitaPostergadaRequest`, `SuspenderHorarioServicio` | `suspensiones_horario`, `citas`, `notificaciones`, `medicos`, `bitacora_auditoria` |
| **CU-12** | `CitasNotificaciones` | `PaginaReservaCitas.jsx`, `TablaExpandible.jsx` | `GestionarCitasControlador`, `CrearCitaRequest`, `ReprogramarCitaRequest`, `GestionarCitasServicio` | `citas`, `estados_cita`, `pagos_cita`, `parametros_sistema` |
| **CU-13** | `CitasNotificaciones` | `PaginaAgendaCitas.jsx`, modal de corrección RN16 | `RegistrarAsistenciaControlador`, `RegistrarAsistenciaRequest`, `RegistrarAsistenciaServicio` | `citas`, `estados_cita`, `pagos_cita`, `bitacora_auditoria` |
| **CU-14** | `CitasNotificaciones` | `PaginaAgendaCitas.jsx`, `TablaExpandible.jsx` | `ConsultarAgendaCitasControlador`, `ConsultarAgendaCitasServicio` | `citas`, `medicos`, `pacientes`, `especialidades`, `estados_cita` |
| **CU-15** | `CitasNotificaciones` | `PaginaHistorialCitas.jsx`, `TablaExpandible.jsx`, `InsigniaEstadoPago.jsx` | `HistorialSeguimientoCitasControlador`, `HistorialSeguimientoCitasServicio` | `citas`, `pagos_cita`, `estados_cita`, `especialidades`, `medicos` |
| **CU-16** | `CitasNotificaciones` | `CampanaNotificaciones.jsx`, `HeaderSuperior.jsx` | `EnviarNotificacionesControlador`, `EnviarNotificacionesServicio` | `notificaciones`, `citas`, `pacientes`, `usuarios` |
| **CU-17** | `HistoriaClinica` | `PaginaKardexPacientes.jsx`, `TablaExpandible.jsx` | `ConsultarMisPacientesControlador`, `ConsultarMisPacientesServicio` | `pacientes`, `personas`, `citas`, `atenciones_clinicas`, `informacion_medica_paciente` |
| **CU-18** | `HistoriaClinica` | `FormularioAtencionClinica.jsx` | `RegistrarAtencionClinicaControlador`, `RegistrarAtencionRequest`, `RegistrarAtencionServicio` | `atenciones_clinicas`, `citas`, `recetas_medicas`, `bitacora_auditoria` |
| **CU-19** | `HistoriaClinica` | `ModalResultadosLab.jsx` | `ResultadosLaboratorioControlador`, `RegistrarLaboratorioRequest`, `ResultadosLaboratorioServicio` | `resultados_laboratorio`, `pacientes`, `bitacora_auditoria` |
| **CU-20** | `HistoriaClinica` | `PaginaHistorialClinico.jsx`, `TablaExpandible.jsx` | `ConsultarHistorialClinicoControlador`, `ConsultarHistorialClinicoServicio` | `pacientes`, `personas`, `atenciones_clinicas`, `resultados_laboratorio`, `citas` |
| **CU-21** | `Reportes` | `PaginaReportes.jsx` | `ReportesCitasControlador`, `ReportesCitasServicio` | `citas`, `especialidades`, `medicos`, `estados_cita` |
| **CU-22** | `Reportes` | `PaginaReportes.jsx` | `ReporteAsistenciaControlador`, `ReporteAsistenciaServicio` | `citas`, `pacientes`, `personas`, `estados_cita` |
| **CU-23** | `Reportes` | `PaginaReportes.jsx` | `ExportarReportesControlador`, `ExportarReportesServicio` | `citas`, `pacientes`, `estados_cita` |
| **CU-24** | `Reportes` | `PaginaAuditoria.jsx`, `PaginaBitacora.jsx` | `ConsultarBitacoraControlador`, `ConsultarBitacoraServicio` | `bitacora_auditoria`, `usuarios` |
| **CU-25** | `Reportes` | `PaginaDashboard.jsx` | `DashboardAdministrativoControlador`, `DashboardAdministrativoServicio` | `citas`, `pacientes`, `medicos`, `bitacora_auditoria` |
| **CU-26** | `AccesoCuentas` | `PaginaCopiasSeguridad.jsx` | `GenerarRestaurarCopiasSeguridadControlador`, `GenerarRestaurarCopiasSeguridadServicio` | `copias_seguridad`, `usuarios`, `bitacora_auditoria` |
| **CU-27** | `CitasNotificaciones` | `ModalPasarelaPagoSimulada.jsx`, `ComprobanteDigitalTransaccion.jsx`, `InsigniaEstadoPago.jsx` | `GestionarPagosReembolsosControlador`, `ProcesarPagoRequest`, `GestionarPagosReembolsosServicio` | `pagos_cita`, `citas`, `parametros_sistema`, `bitacora_auditoria` |

---

## 5. Instrucciones de Despliegue y Ejecución Local

### 5.1. Prerrequisitos del Entorno
* **Sistema Operativo:** Windows 10/11 con Laragon (o Linux / macOS).
* **PHP:** Versión $\ge 8.3$ con extensiones habilitadas: `pdo_pgsql`, `pgsql`, `mbstring`, `openssl`, `bcmath`, `curl`.
* **Gestor de Paquetes PHP:** Composer $\ge 2.7$.
* **Node.js:** Versión $\ge 20$ (LTS) y `npm` $\ge 10$.
* **Motor de Base de Datos:** PostgreSQL $\ge 16$ (localmente en puerto 5432 con base de datos `clinica_db` creada).

---

### 5.2. Instalación y Configuración del Backend (Laravel)

1. **Navegar al directorio del backend:**
   ```bash
   cd backend
   ```

2. **Instalar dependencias de PHP:**
   ```bash
   composer install
   ```

3. **Configurar el archivo de variables de entorno:**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. **Ejecutar migraciones y poblar datos de demostración:**
   ```bash
   php artisan migrate --force
   php artisan db:seed --class=DatosDemostracionSeeder
   ```
   > [!NOTE]
   > `DatosDemostracionSeeder` es idempotente y genera el universo completo para la defensa: 4 roles de usuario, médicos con horarios, 47 citas en todos los estados (`pendiente`, `confirmada`, `en_espera`, `atendida`, `cancelada`, `inasistencia`, `reprogramada` [CM-0043] y `postergada` por suspensión), 8 atenciones clínicas con recetas e historial de laboratorio, parámetros del sistema y bitácora de auditoría.

5. **Iniciar el servidor de desarrollo:**
   ```bash
   php artisan serve --port=8000
   ```
   *El backend quedará disponible en `http://127.0.0.1:8000`.*

---

### 5.3. Instalación y Configuración del Frontend (React + Vite)

1. **Navegar al directorio del frontend:**
   ```bash
   cd frontend
   ```

2. **Instalar dependencias de Node.js:**
   ```bash
   npm install
   ```

3. **Configurar el archivo de variables de entorno:**
   ```bash
   cp .env.example .env
   ```
   *Asegúrate de que `VITE_API_URL=http://127.0.0.1:8000/api` (o `http://127.0.0.1:8000`).*

4. **Compilar para verificación estricta de tipos e imports:**
   ```bash
   npm run build
   ```

5. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   *El frontend SPA quedará disponible en `http://localhost:5173`.*

---

### 5.4. Verificación Automatizada de Pruebas

Para validar los 20 requisitos esenciales del sistema de forma local:
```bash
php backend/tests/ejecutar_20_pruebas.php
```
*Resultado esperado: **21 de 21 pruebas superadas exitosamente (100%)**.*

---

### 5.5. Especificación de Variables de Entorno (Placeholders)

#### Backend (`backend/.env.example`)
```env
APP_NAME="Clinica Vida Salud"
APP_ENV=local
APP_KEY=base64:PLACEHOLDER_GENERADO_CON_KEY_GENERATE=
APP_DEBUG=true
APP_URL=http://localhost:8000
FRONTEND_URL=https://clinica-gilt-iota.vercel.app,http://localhost:5173

APP_LOCALE=es
APP_FALLBACK_LOCALE=es

# Conexión a Base de Datos PostgreSQL
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=clinica_db
DB_USERNAME=tu_usuario_postgres
DB_PASSWORD=tu_contrasena_postgres

# Control de Sesión y Caché
SESSION_DRIVER=cookie
SESSION_LIFETIME=120
CACHE_STORE=file

# Parámetros y Reglas de Negocio Clínicas
HORAS_ANTICIPACION_CANCELAR=12
HORAS_VENTANA_POSTERGADAS=48
MINUTOS_DURACION_TURNO=15
MONTO_FIJO_RESERVA_CITA=50.00
```

#### Frontend (`frontend/.env.example`)
```env
# URL de la API del Backend (Sin barra diagonal final)
VITE_API_URL=http://127.0.0.1:8000/api
```

> [!CAUTION]
> NUNCA expongas contraseñas reales, credenciales de producción ni secretos de infraestructura en archivos `.env.example` ni en el historial de control de versiones. El archivo `.gitignore` del proyecto excluye estrictamente `.env`, directorios de dependencias y copias de seguridad.
