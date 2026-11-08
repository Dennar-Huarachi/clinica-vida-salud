# Diferencias entre Documentación Inicial y Código Implementado

**Proyecto:** Sistema de Gestión de Citas Médicas — Clínica Vida Salud  
**Fecha de Actualización:** 07 de Noviembre de 2026  
**Versión de Entrega:** Presentación 2 / Defensa Final  

---

## 1. Introducción y Propósito

Este documento tiene como objetivo registrar de forma exhaustiva, técnica y transparente las adaptaciones arquitectónicas y aportes propios desarrollados durante la implementación del sistema que complementan o precisan lo estipulado en el catálogo original de 26 Casos de Uso y las Reglas de Negocio (RN) iniciales.

---

## 2. Aportes propios no incluidos en el catálogo de 26 casos de uso

### 2.1 Caso de Uso Adicional: CU-27 (Pasarela de Pagos y Gestión de Reembolsos)
- **Motivación y Justificación Técnica:**
  El catálogo original concebía la reserva de citas (CU-12) como un proceso puramente administrativo. Sin embargo, para dar cumplimiento estricto y ejecutable a la **Regla de Negocio 15 (RN15)** sobre penalizaciones por inasistencia y derechos de cancelación anticipada, era indispensable un mecanismo de garantía financiera que desincentivara las reservas ficticias o el ausentismo no avisado.
- **Implementación:**
  Se implementó el caso de uso **CU-27: Gestionar Pagos y Reembolsos** (`App\Paquetes\CitasNotificaciones\CU27_GestionarPagosReembolsos\GestionarPagosReembolsosServicio.php`), el cual orquesta:
  1. El cobro del depósito de reserva en el momento del agendamiento.
  2. La emisión automática de comprobantes con código de transacción único.
  3. El procesamiento de reembolsos automáticos en cancelaciones oportunas.
  4. La retención del depósito como penalización económica ante cancelaciones tardías o inasistencias.

---

### 2.2 Tabla `pagos_cita` y Esquema Financiero
- **Estructura en Base de Datos:**
  Creada mediante la migración `2026_10_23_000002_create_pagos_cita_table_and_add_pago_to_citas.php`:
  - `id_pago` (PK, BigSerial)
  - `id_cita` (FK a `citas`, relación 1:1 o 1:N en caso de reintentos)
  - `monto` (Decimal 10,2): Depósito de garantía estandarizado en **50.00 Bs**.
  - `metodo_pago` (Varchar): `'qr'`, `'tarjeta'`, `'efectivo'`.
  - `estado_pago` (Varchar): `'completado'`, `'reembolsado'`, `'retenido'`.
  - `nro_transaccion` (Varchar): Identificador alfanumérico único (`TX-...`).
  - `datos_pago` (JSONB): Trazabilidad de tarjeta emulada (últimos 4 dígitos, banco emisor) o payload QR.
  - `fecha_pago` y `fecha_reembolso` (Timestamps con zona horaria).
- **Propósito:**
  Garantizar la auditoría contable inmutable de cada transacción asociada al ciclo de vida de la cita médica.

---

### 2.3 Estados Adicionales de la Cita Médica
El catálogo preliminar contemplaba estados básicos (`programada`, `cancelada`, `atendida`, `inasistencia`). Durante la construcción del flujo real de atención clínica y operativa, se formalizaron estados adicionales en la tabla `estados_cita`:
1. **`pendiente` (id=1):** Cita generada temporalmente a la espera de confirmación y acreditación del depósito de garantía.
2. **`en_espera` (id=4):** Paciente que ya se apersonó a recepción de la clínica antes de su consulta. Este estado intermedio entre `confirmada` y `atendida` permite al médico ver en su panel quiénes ya están físicamente en la sala de espera.
3. **`reprogramada` (id=8):** Cita que cambió de fecha u horario. Mantiene el registro histórico original sin sobreescribir el slot anterior destructivamente, preservando la trazabilidad clínica y auditoría de cambios.
4. **`postergada` (id=9):** Cita afectada por la suspensión forzosa del horario de un médico (CU-11). Otorga al paciente una ventana de prioridad de 48 horas para reubicar su turno antes de que se libere al público general.

---

### 2.4 Comportamiento Exacto de la Regla RN15 en el Código
- **Parámetro de Configuración (`HORAS_ANTICIPACION_CANCELAR`):**
  - En la tabla de base de datos `parametros_sistema`, el valor almacenado es **`12`** horas.
  - En `backend/config/clinica.php` (línea 18), el valor por defecto configurado mediante variable de entorno es:
    ```php
    'horas_anticipacion_cancelar' => (int) env('HORAS_ANTICIPACION_CANCELAR', 2),
    ```
  - Tanto `GestionarCitasServicio.php` (líneas 414-415) como `GestionarPagosReembolsosServicio.php` (líneas 180-181) priorizan explícitamente el valor dinámico de la base de datos con fallback a 12:
    ```php
    $paramHoras = DB::table('parametros_sistema')->where('clave', 'HORAS_ANTICIPACION_CANCELAR')->value('valor') ?: 12;
    $horasMinimas = (int)$paramHoras;
    ```
    Por lo tanto, **el umbral efectivo de cancelación en el sistema es de 12 horas**.

- **¿Qué hace exactamente el sistema cuando un paciente intenta cancelar con menos de 12 horas?**
  - **Ubicación en código:** `backend/app/Paquetes/CitasNotificaciones/CU12_GestionarCitas/GestionarCitasServicio.php`, líneas 420-422.
  - **Comportamiento:** Si quien solicita la cancelación es el propio paciente (`$esPaciente === true`) a través del portal web y la cita no es de tipo postergada, el sistema **NO cancela la cita sin reembolso**; en su lugar, **RECHAZA categóricamente la solicitud arrojando una excepción HTTP 422 (Unprocessable Entity)** con el mensaje:
    > *"Las cancelaciones con derecho a reembolso deben realizarse con al menos 12 horas de anticipación. Para asistencia personalizada comuníquese con recepción."*
  - **Cancelación por Recepción/Administrador:** Si el paciente acude a recepción o se comunica telefónicamente, el personal autorizado puede registrar la cancelación administrativa. En ese caso, la cita se cancela lógicamente y el servicio financiero (`GestionarPagosReembolsosServicio.php`, líneas 220-245) marca el pago como **`retenido`** aplicando la penalización económica por cancelación tardía e inscribiendo el evento `PENALIZACION_RETENCION_PAGO_RN15` en la bitácora inmutable.

---

### 2.5 Pasarela de Pagos Simulada (Aclaración de Alcance Demostrativo)
- **Alcance Académico:**
  Se declara con total transparencia técnica que el módulo de cobro (`frontend/src/Paquetes/CitasNotificaciones/CU12_GestionarCitas/ModalPasarelaPagoSimulada.jsx` y su contraparte backend) es una **simulación funcional y demostrativa**.
- **Detalle de la simulación:**
  - El sistema genera códigos QR dinámicos y formularios de validación con algoritmo de Luhn sintético para tarjetas de débito/crédito.
  - Se generan códigos de autorización ficticios (`TX-...`).
  - **No existe integración con pasarelas bancarias reales** (como Red Enlace, Libélula, Stripe o PayPal) ni almacenamiento de números reales de tarjetas de crédito o CVV, en resguardo del cumplimiento PCI-DSS.
  - La simulación reproduce de manera fidedigna la experiencia de usuario (UX) y el flujo de estados asíncronos requerido por las reglas de negocio de la clínica.

---

### 2.6 Índice Único Parcial Seguro (`uq_citas_turno_activo`) y Regla Unificada de Ocupación
- **Motivación:**
  Originalmente, el control de no-solapamiento descansaba exclusivamente en la transacción a nivel de aplicación con `lockForUpdate()`. Para garantizar integridad absoluta a nivel de motor contra carreras críticas en entornos desacoplados o APIs externas, se agregó la migración `2026_11_07_000001_add_partial_unique_index_to_citas_table.php`.
- **Definición del Índice en PostgreSQL:**
  ```sql
  CREATE UNIQUE INDEX IF NOT EXISTS uq_citas_turno_activo 
  ON citas (id_medico, fecha_cita, hora_inicio) 
  WHERE estado != 'cancelada' 
    AND es_postergada = false 
    AND id_estado_cita NOT IN (6, 9);
  ```
- **Unificación de Criterio:**
  Tanto `Cita::ESTADOS_OCUPANTES` como `Cita::aplicarFiltroOcupantes()`, `Cita::querySolapamiento()` y el índice de base de datos comparten exactamente la misma regla matemática: un turno solo está liberado si la cita tiene `estado = 'cancelada'` o `es_postergada = true` / `id_estado_cita = 9`.

---

### 2.7 Resiliencia y UX en la Cuadrícula de Turnos del Frontend
- **Visualización Limpia de Slots:** Los botones de turnos muestran únicamente la hora de inicio (ej. `14:00`), eliminando la sobrecarga visual de la hora de fin.
- **Filtrado Estricto de Turnos Ocupados:** Los intervalos que colisionan con citas activas son completamente excluidos del renderizado en lugar de mostrarse deshabilitados.
- **Deselección Reactiva Segura (`useDisponibilidadTurnos.js`):** Si un turno seleccionado deja de estar disponible tras un refresco o si la lista llega vacía, el hook deselecciona el turno de forma reactiva únicamente cuando ha concluido la carga (`!cargando`), evitando desmarques transitorios.
- **Componente Desacoplado `ModalReprogramarCita.jsx`:** Modularizado para permitir la reprogramación de turnos tanto desde la agenda operativa como desde la gestión de citas con soporte inmediato ante respuestas 409 Conflict.
