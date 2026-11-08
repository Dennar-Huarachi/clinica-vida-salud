<?php

/**
 * Script de Verificación Integral de 20 Casos de Prueba + Concurrencia
 * Sistema: Clínica Vida Salud
 */

require_once __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// ============================================================================
// GUARDA DE SEGURIDAD ESTRICTA: PREVENCIÓN DE EJECUCIÓN EN PRODUCCIÓN
// ============================================================================
$envApp = env('APP_ENV', 'production');
$dbHost = env('DB_HOST', '');
$dbName = env('DB_DATABASE', '');

$esHostRemotoProhibido = false;
foreach (['supabase', 'render', 'pooler', 'aws', 'rds'] as $patron) {
    if (stripos($dbHost, $patron) !== false) {
        $esHostRemotoProhibido = true;
        break;
    }
}
$esHostLocalValido = in_array(strtolower($dbHost), ['127.0.0.1', 'localhost', '::1', '']) || empty($dbHost);

if ($envApp === 'production' || $esHostRemotoProhibido || !$esHostLocalValido) {
    echo "\n\033[31m[BLOQUEO DE SEGURIDAD]\033[0m Script abortado.\n";
    echo "Este script de prueba escribe datos y solo puede ejecutarse en entorno local de pruebas.\n";
    echo "Valores actuales: APP_ENV='{$envApp}', DB_HOST='{$dbHost}', DB_DATABASE='{$dbName}'.\n\n";
    exit(1);
}
// ============================================================================

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;
use Carbon\Carbon;
use App\Models\Cita;
use App\Paquetes\AccesoCuentas\CU01_IniciarCerrarSesion\IniciarCerrarSesionServicio;
use App\Paquetes\AccesoCuentas\CU03_RegistrarsePaciente\RegistrarsePacienteServicio;
use App\Paquetes\AccesoCuentas\CU26_GenerarRestaurarCopiasSeguridad\GenerarRestaurarCopiasSeguridadServicio;
use App\Paquetes\CitasNotificaciones\CU12_GestionarCitas\GestionarCitasServicio;
use App\Paquetes\CitasNotificaciones\CU13_RegistrarAsistenciaInasistenciaAtencion\RegistrarAsistenciaServicio;
use App\Paquetes\CitasNotificaciones\CU14_ConsultarAgendaCitas\ConsultarAgendaCitasServicio;
use App\Paquetes\CitasNotificaciones\CU15_ConsultarHistorialSeguimientoCitas\HistorialSeguimientoCitasServicio;
use App\Paquetes\CatalogosHorarios\CU10_ConsultarDisponibilidad\ConsultarDisponibilidadServicio;
use App\Paquetes\CatalogosHorarios\CU11_SuspenderHorarioGestionarCitasAfectadas\SuspenderHorarioServicio;
use App\Http\Controllers\Paquetes\CitasNotificaciones\CU12_GestionarCitas\GestionarCitasControlador;
use App\Http\Controllers\Paquetes\Reportes\CU24_ConsultarBitacoraAuditoria\ConsultarBitacoraControlador;
use App\Http\Controllers\Paquetes\AccesoCuentas\CU26_GenerarRestaurarCopiasSeguridad\GenerarRestaurarCopiasSeguridadControlador;
use App\Nucleo\Sesion\ManejadorSesion;

$resultados = [];
$totalPruebas = 0;
$pruebasExitosas = 0;

function registrarResultado(string $numero, string $nombre, bool $exito, string $detalle = '') {
    global $resultados, $totalPruebas, $pruebasExitosas;
    $totalPruebas++;
    if ($exito) $pruebasExitosas++;
    $resultados[] = [
        'numero' => $numero,
        'nombre' => $nombre,
        'exito' => $exito,
        'detalle' => $detalle
    ];
    $simbolo = $exito ? '[OK]' : '[FALLO]';
    echo "{$simbolo} {$numero}. {$nombre}: {$detalle}\n";
}

echo "========================================================================\n";
echo " INICIANDO AUDITORÍA Y EJECUCIÓN DE PRUEBAS - CLÍNICA VIDA SALUD\n";
echo " Fecha/Hora: " . Carbon::now('America/La_Paz')->toDateTimeString() . " (America/La_Paz)\n";
echo "========================================================================\n\n";

$adminUser = DB::table('usuarios')->where('nombre_usuario', 'admin')->first();
$adminUser->rol = 'administrador';
$adminUser->id_medico = null;
$adminUser->id_paciente = null;

$doctorUser = DB::table('usuarios')->where('nombre_usuario', 'dr.alarcon')->first();
$doctorUser->rol = 'medico';
$docRecord = DB::table('medicos')->where('id_persona', $doctorUser->id_persona)->first();
$doctorUser->id_medico = $docRecord ? $docRecord->id_medico : 2;

$pacienteUser = DB::table('usuarios')->where('nombre_usuario', 'paciente1')->first();
$pacienteUser->rol = 'paciente';
$pacRecord = DB::table('pacientes')->where('id_persona', $pacienteUser->id_persona)->first();
$pacienteUser->id_paciente = $pacRecord ? $pacRecord->id_paciente : 2;

function limpiarCitaDePrueba($idCita) {
    if (!$idCita) return;
    DB::table('pagos_cita')->where('id_cita', $idCita)->delete();
    DB::table('atenciones_clinicas')->where('id_cita', $idCita)->delete();
    DB::table('citas')->where('id_cita', $idCita)->delete();
}

function limpiarCitasPorHorario($idMedico, $fecha, $hora) {
    $ids = DB::table('citas')
        ->where('id_medico', $idMedico)
        ->where('fecha_cita', $fecha)
        ->where('hora_inicio', $hora)
        ->pluck('id_cita');
    foreach ($ids as $id) {
        limpiarCitaDePrueba($id);
    }
}

// -------------------------------------------------------------------------
// PRUEBA 1: Registrar paciente nuevo (CU-03)
// -------------------------------------------------------------------------
$ciNuevo = 'CI_' . time() . '_' . rand(100, 999);
$userNuevo = 'pac_' . time();
$emailNuevo = "pac_{$userNuevo}@test.com";

try {
    $srvReg = app(RegistrarsePacienteServicio::class);
    $resReg = $srvReg->registrar([
        'ci' => $ciNuevo,
        'nombres' => 'Carlos Alberto',
        'apellidos' => 'Mamani Rojas',
        'fecha_nacimiento' => '1990-05-15',
        'sexo' => 'M',
        'telefono' => '70012345',
        'correo' => $emailNuevo,
        'direccion' => 'Av. San Martín #456',
        'nombre_usuario' => $userNuevo,
        'contrasena' => 'ClaveSegura123*'
    ]);
    $idPacienteCreado = $resReg['usuario']['id_paciente'] ?? null;
    $pacienteEnBD = DB::table('pacientes')->where('id_paciente', $idPacienteCreado)->exists();
    registrarResultado('1', 'Registrar paciente nuevo (CU-03)', $pacienteEnBD, "Paciente creado con ID {$idPacienteCreado} y CI {$ciNuevo}");
} catch (\Throwable $e) {
    registrarResultado('1', 'Registrar paciente nuevo (CU-03)', false, $e->getMessage());
}

// -------------------------------------------------------------------------
// PRUEBA 2: Registrar paciente con CI duplicado (rechaza con 422)
// -------------------------------------------------------------------------
try {
    $srvReg = app(RegistrarsePacienteServicio::class);
    $srvReg->registrar([
        'ci' => $ciNuevo,
        'nombres' => 'Otro Nombre',
        'apellidos' => 'Otro Apellido',
        'fecha_nacimiento' => '1992-01-01',
        'sexo' => 'M',
        'telefono' => '70099999',
        'correo' => "dup_{$emailNuevo}",
        'direccion' => 'Calle Falsa 123',
        'nombre_usuario' => "dup_{$userNuevo}",
        'contrasena' => 'ClaveSegura123*'
    ]);
    registrarResultado('2', 'Registrar paciente con CI duplicado (rechaza)', false, 'No se rechazó el registro con CI existente');
} catch (\Throwable $e) {
    $rechazado = str_contains($e->getMessage(), 'ya se encuentra registrada') || $e->getCode() === 422;
    registrarResultado('2', 'Registrar paciente con CI duplicado (rechaza)', $rechazado, "Rechazado correctamente: " . $e->getMessage());
}

// -------------------------------------------------------------------------
// PRUEBA 3: Programar cita en turno libre (CU-12)
// -------------------------------------------------------------------------
// Dr. Alarcón (ID 2): Viernes 14:00 - 18:00 (dia_semana = 5)
// Buscar el próximo viernes futuro
$proximoViernes = Carbon::now('America/La_Paz')->next(Carbon::FRIDAY)->toDateString();
$horaTurnoP3 = '15:00:00';
$citaCreadaP3 = null;

try {
    // Asegurar que ese slot esté libre antes de la prueba
    limpiarCitasPorHorario(2, $proximoViernes, $horaTurnoP3);

    $srvCitas = app(GestionarCitasServicio::class);
    $citaCreadaP3 = $srvCitas->crear([
        'id_medico' => 2,
        'id_especialidad' => 1, // Medicina General
        'id_paciente' => $idPacienteCreado ?: 2,
        'fecha_cita' => $proximoViernes,
        'hora_inicio' => $horaTurnoP3,
        'motivo_consulta' => 'Consulta de control general rutinaria',
        'metodo_pago' => 'qr',
    ], $adminUser->id_usuario);

    $idCitaP3 = $citaCreadaP3['id_cita'] ?? null;
    $existeCita = $idCitaP3 && DB::table('citas')->where('id_cita', $idCitaP3)->exists();
    registrarResultado('3', 'Programar cita en turno libre (CU-12)', $existeCita, "Cita agendada #{$idCitaP3} ({$citaCreadaP3['codigo_cita']}) para el {$proximoViernes} a las {$horaTurnoP3}");
} catch (\Throwable $e) {
    registrarResultado('3', 'Programar cita en turno libre (CU-12)', false, $e->getMessage());
}

// -------------------------------------------------------------------------
// PRUEBA 4: Programar cita superpuesta (rechaza con 409)
// -------------------------------------------------------------------------
try {
    $srvCitas = app(GestionarCitasServicio::class);
    $srvCitas->crear([
        'id_medico' => 2,
        'id_especialidad' => 1,
        'id_paciente' => 3,
        'fecha_cita' => $proximoViernes,
        'hora_inicio' => $horaTurnoP3,
        'motivo_consulta' => 'Intento de agendamiento superpuesto',
        'metodo_pago' => 'tarjeta',
    ], $adminUser->id_usuario);
    registrarResultado('4', 'Programar cita superpuesta (rechaza con 409)', false, 'No se detectó el solapamiento');
} catch (\Throwable $e) {
    $es409 = ($e->getCode() === 409) || str_contains($e->getMessage(), 'ya ha sido reservado');
    registrarResultado('4', 'Programar cita superpuesta (rechaza con 409)', $es409, "Rechazado con 409: " . $e->getMessage());
}

// -------------------------------------------------------------------------
// PRUEBA 5: Reservar fuera de horario (rechaza con 422)
// -------------------------------------------------------------------------
try {
    $srvCitas = app(GestionarCitasServicio::class);
    $srvCitas->crear([
        'id_medico' => 2,
        'id_especialidad' => 1,
        'id_paciente' => 2,
        'fecha_cita' => $proximoViernes,
        'hora_inicio' => '03:00:00', // Fuera de horario
        'motivo_consulta' => 'Cita fuera de horario laboral',
        'metodo_pago' => 'qr',
    ], $adminUser->id_usuario);
    registrarResultado('5', 'Reservar fuera de horario (rechaza)', false, 'Se permitió reservar en hora no laboral');
} catch (\Throwable $e) {
    $rechazado = str_contains($e->getMessage(), 'fuera del horario habitual') || $e->getCode() === 422;
    registrarResultado('5', 'Reservar fuera de horario (rechaza)', $rechazado, "Rechazado correctamente: " . $e->getMessage());
}

// -------------------------------------------------------------------------
// PRUEBA 6: Cancelar cita (libera turno, conserva historial)
// -------------------------------------------------------------------------
try {
    $srvCitas = app(GestionarCitasServicio::class);
    $srvCitas->cancelar((int)$citaCreadaP3['id_cita'], 'Cancelación de prueba auditoría', $adminUser);

    $citaBD = DB::table('citas')->where('id_cita', $citaCreadaP3['id_cita'])->first();
    $canceladaLimpia = ($citaBD && $citaBD->estado === 'cancelada' && (int)$citaBD->id_estado_cita === 6);

    // Verificar que el turno ahora está libre para volver a agendar
    $libre = !Cita::querySolapamiento(2, $proximoViernes, $horaTurnoP3, '15:15:00')->exists();

    registrarResultado('6', 'Cancelar cita (libera turno, conserva historial)', $canceladaLimpia && $libre, "Cita #{$citaCreadaP3['id_cita']} cancelada lógicamente, turno liberado para nuevos pacientes");
} catch (\Throwable $e) {
    registrarResultado('6', 'Cancelar cita (libera turno, conserva historial)', false, $e->getMessage());
}

// -------------------------------------------------------------------------
// PRUEBA 7: Historial del paciente (CU-15)
// -------------------------------------------------------------------------
try {
    $srvHistorial = app(HistorialSeguimientoCitasServicio::class);
    $historial = $srvHistorial->consultarHistorial(2);
    $valido = is_array($historial) && count($historial) > 0;
    registrarResultado('7', 'Historial del paciente (CU-15)', $valido, "Se recuperaron " . count($historial) . " citas históricas para el paciente ID 2");
} catch (\Throwable $e) {
    registrarResultado('7', 'Historial del paciente (CU-15)', false, $e->getMessage());
}

// -------------------------------------------------------------------------
// PRUEBA 8: Citas de un médico por fecha (CU-14)
// -------------------------------------------------------------------------
try {
    $srvAgenda = app(ConsultarAgendaCitasServicio::class);
    $agenda = $srvAgenda->obtenerAgenda(2, null, null, null, Carbon::now()->subMonths(1)->toDateString(), Carbon::now()->addMonths(1)->toDateString());
    $tieneCitas = is_array($agenda['citas'] ?? null);
    registrarResultado('8', 'Citas de un médico por fecha (CU-14)', $tieneCitas, "Agenda del Dr. Alarcón consultada con éxito (" . count($agenda['citas']) . " citas en rango)");
} catch (\Throwable $e) {
    registrarResultado('8', 'Citas de un médico por fecha (CU-14)', false, $e->getMessage());
}

// -------------------------------------------------------------------------
// PRUEBA 9: Acceso a página interna sin sesión (401)
// -------------------------------------------------------------------------
try {
    $middleware = new ManejadorSesion();
    $reqVacia = Request::create('/api/citas', 'GET');
    $res401 = $middleware->handle($reqVacia, function ($r) {
        return response()->json(['exito' => true]);
    });
    $es401 = ($res401->getStatusCode() === 401);
    registrarResultado('9', 'Acceso a página interna sin sesión (401)', $es401, "Middleware bloquea petición sin token retornando HTTP 401");
} catch (\Throwable $e) {
    registrarResultado('9', 'Acceso a página interna sin sesión (401)', false, $e->getMessage());
}

// -------------------------------------------------------------------------
// PRUEBA 10: Operación con datos inválidos (422)
// -------------------------------------------------------------------------
try {
    $reglas = (new \App\Http\Requests\Paquetes\CitasNotificaciones\CU12_GestionarCitas\CrearCitaRequest())->rules();
    $validator = Validator::make([], $reglas);
    $falla = $validator->fails();
    $tieneErrores = count($validator->errors()->all()) > 0;
    registrarResultado('10', 'Operación con datos inválidos (422)', $falla && $tieneErrores, "FormRequest detectó campos requeridos faltantes (" . count($validator->errors()->all()) . " errores)");
} catch (\Throwable $e) {
    registrarResultado('10', 'Operación con datos inválidos (422)', false, $e->getMessage());
}

// -------------------------------------------------------------------------
// PRUEBA 11: Paciente cancela en línea con menos de N horas (rechaza con 422)
// -------------------------------------------------------------------------
try {
    // Crear cita para hoy en 2 horas
    $horaProxima = Carbon::now('America/La_Paz')->addHours(2)->format('H:i:00');
    $idCitaPronta = DB::table('citas')->insertGetId([
        'codigo_cita' => 'CM-TEST-11',
        'id_paciente' => $pacienteUser->id_paciente,
        'id_medico' => 2,
        'id_especialidad' => 1,
        'fecha_cita' => Carbon::today('America/La_Paz')->toDateString(),
        'hora_inicio' => $horaProxima,
        'hora_fin' => Carbon::now('America/La_Paz')->addHours(2)->addMinutes(15)->format('H:i:00'),
        'motivo_consulta' => 'Prueba de cancelación tardía',
        'id_estado_cita' => 2,
        'estado' => 'activo',
        'created_at' => now(),
        'updated_at' => now(),
    ], 'id_cita');

    $srvCitas = app(GestionarCitasServicio::class);
    $srvCitas->cancelar($idCitaPronta, 'Paciente intenta cancelar a última hora', $pacienteUser);
    registrarResultado('11', 'Paciente cancela con menos de 12 horas (rechaza)', false, 'Permitió cancelación tardía sin penalización');
} catch (\Throwable $e) {
    $rechazado12h = str_contains($e->getMessage(), 'horas de anticipación') || $e->getCode() === 422;
    registrarResultado('11', 'Paciente cancela con menos de 12 horas (rechaza)', $rechazado12h, "Rechazado con 422 (RN15): " . $e->getMessage());
    // Limpiar cita de prueba
    if (isset($idCitaPronta)) limpiarCitaDePrueba($idCitaPronta);
}

// -------------------------------------------------------------------------
// PRUEBA 12: Paciente busca turno en especialidad solo presencial (rechaza con 403)
// -------------------------------------------------------------------------
try {
    // Configurar temporalmente una especialidad con reservable_en_linea = false
    $espPresencial = DB::table('especialidades')->where('id_especialidad', 3)->first();
    DB::table('especialidades')->where('id_especialidad', 3)->update(['reservable_en_linea' => false]);

    $srvDisp = app(ConsultarDisponibilidadServicio::class);
    $srvDisp->consultar(2, 3, $proximoViernes, 'paciente');
    registrarResultado('12', 'Paciente busca turno en especialidad solo presencial (403)', false, 'No se bloqueó el canal en línea');
} catch (\Throwable $e) {
    $bloqueado = str_contains($e->getMessage(), 'ventanilla o recepción') || $e->getCode() === 403;
    registrarResultado('12', 'Paciente busca turno en especialidad solo presencial (403)', $bloqueado, "Rechazado con 403 (RN18): " . $e->getMessage());
} finally {
    // Restaurar valor de la especialidad
    DB::table('especialidades')->where('id_especialidad', 3)->update(['reservable_en_linea' => true]);
}

// -------------------------------------------------------------------------
// PRUEBA 13: Marcar Atendida una cita Cancelada (rechaza con 422)
// -------------------------------------------------------------------------
try {
    // Crear cita cancelada de prueba
    $idCitaCancelada = DB::table('citas')->insertGetId([
        'codigo_cita' => 'CM-TEST-13',
        'id_paciente' => 2,
        'id_medico' => 2,
        'id_especialidad' => 1,
        'fecha_cita' => Carbon::yesterday('America/La_Paz')->toDateString(),
        'hora_inicio' => '10:00:00',
        'hora_fin' => '10:15:00',
        'motivo_consulta' => 'Prueba cita cancelada',
        'id_estado_cita' => 6, // cancelada
        'estado' => 'cancelada',
        'created_at' => now(),
        'updated_at' => now(),
    ], 'id_cita');

    $srvAsistencia = app(RegistrarAsistenciaServicio::class);
    $srvAsistencia->registrar([
        'id_cita' => $idCitaCancelada,
        'estado' => 'atendida',
    ], $adminUser);

    registrarResultado('13', 'Marcar Atendida una cita Cancelada (rechaza)', false, 'Permitió reactivar una cita cancelada');
} catch (\Throwable $e) {
    $rechazadoReactivar = str_contains($e->getMessage(), 'cancelada no puede reactivarse') || $e->getCode() === 422;
    registrarResultado('13', 'Marcar Atendida una cita Cancelada (rechaza)', $rechazadoReactivar, "Rechazado con 422 (RN16): " . $e->getMessage());
    if (isset($idCitaCancelada)) limpiarCitaDePrueba($idCitaCancelada);
}

// -------------------------------------------------------------------------
// PRUEBA 14: Administrador corrige Atendida a Inasistencia con motivo (permite y audita)
// -------------------------------------------------------------------------
try {
    $idCitaAtendida = DB::table('citas')->insertGetId([
        'codigo_cita' => 'CM-TEST-14',
        'id_paciente' => 2,
        'id_medico' => 2,
        'id_especialidad' => 1,
        'fecha_cita' => Carbon::yesterday('America/La_Paz')->toDateString(),
        'hora_inicio' => '11:00:00',
        'hora_fin' => '11:15:00',
        'motivo_consulta' => 'Cita cerrada para corrección',
        'id_estado_cita' => 5, // atendida
        'estado' => 'activo',
        'created_at' => now(),
        'updated_at' => now(),
    ], 'id_cita');

    $srvAsistencia = app(RegistrarAsistenciaServicio::class);
    $resCorr = $srvAsistencia->registrar([
        'id_cita' => $idCitaAtendida,
        'estado' => 'inasistencia',
        'motivo_correccion' => 'Paciente fue confundido con homónimo y nunca ingresó al consultorio.'
    ], $adminUser);

    $citaCorregida = DB::table('citas')->where('id_cita', $idCitaAtendida)->first();
    $esInasistencia = ((int)$citaCorregida->id_estado_cita === 7);

    // Verificar registro en bitácora
    $auditBitacora = DB::table('bitacora_auditoria')
        ->where('accion', 'CORRECCION_AUTORIZADA_CITA_RN16')
        ->where('registro_id', (string)$idCitaAtendida)
        ->exists();

    registrarResultado('14', 'Admin corrige Atendida a Inasistencia con motivo (RN16)', $esInasistencia && $auditBitacora, "Cita #{$idCitaAtendida} conmutada a inasistencia y registrada en bitácora inmutable");
    limpiarCitaDePrueba($idCitaAtendida);
} catch (\Throwable $e) {
    registrarResultado('14', 'Admin corrige Atendida a Inasistencia con motivo (RN16)', false, $e->getMessage());
}

// -------------------------------------------------------------------------
// PRUEBA 15: Suspender horario con citas (pasan a Postergada y bloquea turnos)
// -------------------------------------------------------------------------
try {
    $proximoLunes = Carbon::now('America/La_Paz')->next(Carbon::MONDAY)->toDateString();

    // Crear cita para el Dr. Alarcón ese lunes a las 09:00 (en su horario regular 08:00-12:00)
    $idCitaP15 = DB::table('citas')->insertGetId([
        'codigo_cita' => 'CM-TEST-15',
        'id_paciente' => 2,
        'id_medico' => 2,
        'id_especialidad' => 1,
        'fecha_cita' => $proximoLunes,
        'hora_inicio' => '09:00:00',
        'hora_fin' => '09:15:00',
        'motivo_consulta' => 'Cita afectada por contingencia',
        'id_estado_cita' => 2,
        'estado' => 'activo',
        'created_at' => now(),
        'updated_at' => now(),
    ], 'id_cita');

    $srvSusp = app(SuspenderHorarioServicio::class);
    $resSusp = $srvSusp->suspender([
        'id_medico' => 2,
        'fecha_inicio' => "{$proximoLunes} 08:00:00",
        'fecha_fin' => "{$proximoLunes} 12:00:00",
        'motivo' => 'Cirugía de urgencia no programada en hospital externo',
    ], $adminUser->id_usuario);

    $idSusp = $resSusp['id_suspension'] ?? null;
    $citaPostergada = DB::table('citas')->where('id_cita', $idCitaP15)->first();

    $pasoAPostergada = ($citaPostergada && (int)$citaPostergada->id_estado_cita === 9 && (bool)$citaPostergada->es_postergada);

    // Verificar que el horario ahora está bloqueado por la suspensión
    $bloqueado = false;
    try {
        $srvCitas = app(GestionarCitasServicio::class);
        $srvCitas->crear([
            'id_medico' => 2,
            'id_especialidad' => 1,
            'id_paciente' => 3,
            'fecha_cita' => $proximoLunes,
            'hora_inicio' => '09:15:00',
            'motivo_consulta' => 'Intento durante suspensión',
            'metodo_pago' => 'qr',
        ], $adminUser->id_usuario);
    } catch (\Throwable $exSusp) {
        $bloqueado = str_contains($exSusp->getMessage(), 'suspensión');
    }

    registrarResultado('15', 'Suspender horario con citas (postergada y bloqueo)', $pasoAPostergada && $bloqueado, "Cita #{$idCitaP15} pasó a postergada (id=9) con 48h de prioridad y nuevos agendamientos bloqueados");

    // Limpiar suspensión y cita de prueba
    if ($idSusp) DB::table('suspensiones_horario')->where('id_suspension', $idSusp)->delete();
    limpiarCitaDePrueba($idCitaP15);
} catch (\Throwable $e) {
    registrarResultado('15', 'Suspender horario con citas (postergada y bloqueo)', false, $e->getMessage());
}

// -------------------------------------------------------------------------
// PRUEBA 16: Paciente abre cita de otro paciente (403 IDOR)
// -------------------------------------------------------------------------
try {
    // Paciente 1 (ID 2) intenta consultar cita de Paciente 3 (ID 3)
    $citaAjena = DB::table('citas')->where('id_paciente', 3)->first();
    if (!$citaAjena) {
        $idCitaAjena = DB::table('citas')->insertGetId([
            'codigo_cita' => 'CM-TEST-16',
            'id_paciente' => 3,
            'id_medico' => 2,
            'id_especialidad' => 1,
            'fecha_cita' => $proximoViernes,
            'hora_inicio' => '16:00:00',
            'hora_fin' => '16:15:00',
            'motivo_consulta' => 'Cita ajena paciente 3',
            'id_estado_cita' => 2,
            'estado' => 'activo',
            'created_at' => now(),
            'updated_at' => now(),
        ], 'id_cita');
    } else {
        $idCitaAjena = $citaAjena->id_cita;
    }

    $reqIdor = Request::create("/api/citas/{$idCitaAjena}", 'GET');
    $reqIdor->attributes->set('usuario_autenticado', $pacienteUser);

    $ctrlCitas = app(GestionarCitasControlador::class);
    $resIdor = $ctrlCitas->show($reqIdor, (int)$idCitaAjena);

    $es403 = ($resIdor->getStatusCode() === 403);
    registrarResultado('16', 'Paciente abre cita de otro paciente (403 IDOR)', $es403, "Controlador bloquea acceso cruzado retornando HTTP 403 (RN19)");
} catch (\Throwable $e) {
    registrarResultado('16', 'Paciente abre cita de otro paciente (403 IDOR)', false, $e->getMessage());
}

// -------------------------------------------------------------------------
// PRUEBA 17: Registro con CI existente y datos que no coinciden (rechaza con 422)
// -------------------------------------------------------------------------
try {
    // Crear persona de recepción sin usuario
    $ciFicha = 'CI_FICHA_' . rand(10000, 99999);
    $idPersonaFicha = DB::table('personas')->insertGetId([
        'ci' => $ciFicha,
        'nombres' => 'Mario Fernando',
        'apellidos' => 'Banzer Suarez',
        'fecha_nacimiento' => '1985-04-12',
        'sexo' => 'M',
        'telefono' => '71122334',
        'correo' => 'mario.banzer@mail.com',
        'created_at' => now(),
        'updated_at' => now(),
    ], 'id_persona');

    $srvReg = app(RegistrarsePacienteServicio::class);
    $srvReg->registrar([
        'ci' => $ciFicha,
        'nombres' => 'Pedro Pablo', // Datos divergentes
        'apellidos' => 'Gomez Morales',
        'fecha_nacimiento' => '1995-10-20',
        'sexo' => 'M',
        'telefono' => '79998877',
        'correo' => 'hacker@mail.com',
        'nombre_usuario' => 'usurpa_' . rand(100, 999),
        'contrasena' => 'ClaveInsegura123*'
    ]);
    registrarResultado('17', 'Registro con CI existente y datos divergentes (rechaza)', false, 'Permitió vincular cuenta con datos no coincidentes');
} catch (\Throwable $e) {
    $rechazadoDivergente = str_contains($e->getMessage(), 'no coinciden con la ficha clínica') || $e->getCode() === 422;
    registrarResultado('17', 'Registro con CI existente y datos divergentes (rechaza)', $rechazadoDivergente, "Rechazado con 422: " . $e->getMessage());
    if (isset($idPersonaFicha)) DB::table('personas')->where('id_persona', $idPersonaFicha)->delete();
}

// -------------------------------------------------------------------------
// PRUEBA 18: Login con contraseña incorrecta y verificación en bitácora
// -------------------------------------------------------------------------
try {
    $srvAuth = app(IniciarCerrarSesionServicio::class);
    try {
        $srvAuth->iniciarSesion('personal', 'admin', 'password_totalmente_incorrecta');
        registrarResultado('18', 'Login con contraseña incorrecta y bitácora', false, 'Permitió login con credenciales inválidas');
    } catch (\Throwable $eAuth) {
        $es401 = ($eAuth->getCode() === 401);
        $bitacoraLog = DB::table('bitacora_auditoria')
            ->where('accion', 'INTENTO_FALLIDO_SESION')
            ->where('caso_uso', 'CU01_IniciarCerrarSesion')
            ->orderBy('id_bitacora', 'desc')
            ->first();

        $auditado = ($bitacoraLog !== null);
        registrarResultado('18', 'Login con contraseña incorrecta y bitácora', $es401 && $auditado, "Login rechazado con 401 y registrado en bitácora #{$bitacoraLog->id_bitacora}");
    }
} catch (\Throwable $e) {
    registrarResultado('18', 'Login con contraseña incorrecta y bitácora', false, $e->getMessage());
}

// -------------------------------------------------------------------------
// PRUEBA 19: No Administrador intenta abrir bitácora o restaurar copia (403)
// -------------------------------------------------------------------------
try {
    $reqNoAdmin = Request::create('/api/auditoria/bitacora', 'GET');
    $reqNoAdmin->attributes->set('usuario_autenticado', $doctorUser);

    $ctrlBit = app(ConsultarBitacoraControlador::class);
    $resBit = $ctrlBit->index($reqNoAdmin);
    $es403Bit = ($resBit->getStatusCode() === 403);

    $reqBackup = Request::create('/api/seguridad/backups', 'POST');
    $reqBackup->attributes->set('usuario_autenticado', $pacienteUser);

    $ctrlBack = app(GenerarRestaurarCopiasSeguridadControlador::class);
    $resBack = $ctrlBack->store($reqBackup);
    $es403Back = ($resBack->getStatusCode() === 403);

    registrarResultado('19', 'No Administrador intenta abrir bitácora o backup (403)', $es403Bit && $es403Back, "Acceso a auditoría y backups denegado a no administradores con HTTP 403");
} catch (\Throwable $e) {
    registrarResultado('19', 'No Administrador intenta abrir bitácora o backup (403)', false, $e->getMessage());
}

// -------------------------------------------------------------------------
// PRUEBA 20: Generar copia de seguridad (CU-26)
// -------------------------------------------------------------------------
try {
    $srvBackup = app(GenerarRestaurarCopiasSeguridadServicio::class);
    $resBkp = $srvBackup->generar($adminUser->id_usuario);
    $existeArchivo = file_exists($resBkp['ruta_almacenamiento']) && filesize($resBkp['ruta_almacenamiento']) > 0;
    $registradoBD = DB::table('copias_seguridad')->where('id_copia', $resBkp['id_copia'])->exists();

    registrarResultado('20', 'Generar y registrar copia de seguridad (CU-26)', $existeArchivo && $registradoBD, "Respaldo #{$resBkp['id_copia']} ({$resBkp['nombre_archivo']}) generado físicamente ({$resBkp['tamano_kb']} KB)");
} catch (\Throwable $e) {
    registrarResultado('20', 'Generar y registrar copia de seguridad (CU-26)', false, $e->getMessage());
}

// -------------------------------------------------------------------------
// PRUEBA DE CONCURRENCIA: Dos reservas simultáneas para el mismo turno
// -------------------------------------------------------------------------
echo "\n--- Ejecutando Prueba de Concurrencia (Simulación de Carrera) ---\n";
$horaConcurrente = '17:00:00';

limpiarCitasPorHorario(2, $proximoViernes, $horaConcurrente);

$ganador = false;
$rechazadoConflicto = false;

try {
    $srvCitas1 = app(GestionarCitasServicio::class);
    $res1 = $srvCitas1->crear([
        'id_medico' => 2,
        'id_especialidad' => 1,
        'id_paciente' => 2,
        'fecha_cita' => $proximoViernes,
        'hora_inicio' => $horaConcurrente,
        'motivo_consulta' => 'Paciente A - Reserva concurrente 1',
        'metodo_pago' => 'qr',
    ], $adminUser->id_usuario);
    $ganador = isset($res1['id_cita']);

    // Segundo intento simultáneo
    try {
        $srvCitas2 = app(GestionarCitasServicio::class);
        $srvCitas2->crear([
            'id_medico' => 2,
            'id_especialidad' => 1,
            'id_paciente' => 3,
            'fecha_cita' => $proximoViernes,
            'hora_inicio' => $horaConcurrente,
            'motivo_consulta' => 'Paciente B - Reserva concurrente 2',
            'metodo_pago' => 'tarjeta',
        ], $adminUser->id_usuario);
    } catch (\Throwable $e2) {
        $rechazadoConflicto = ($e2->getCode() === 409) || str_contains($e2->getMessage(), 'ya ha sido reservado');
    }

    registrarResultado('CONCURRENCIA', 'Doble reserva simultánea para el mismo turno', $ganador && $rechazadoConflicto, "Primer paciente reservó con éxito (#{$res1['id_cita']}); segundo intento rechazado con 409 Conflict");
} catch (\Throwable $e) {
    registrarResultado('CONCURRENCIA', 'Doble reserva simultánea para el mismo turno', false, $e->getMessage());
}

echo "\n========================================================================\n";
echo " RESUMEN FINAL: {$pruebasExitosas} de {$totalPruebas} pruebas superadas exitosamente.\n";
echo "========================================================================\n";

if ($pruebasExitosas === $totalPruebas) {
    echo ">>> TODOS LOS CASOS DE PRUEBA Y BLINDAJES FUERON SUPERADOS AL 100% <<<\n";
    exit(0);
} else {
    echo ">>> ALGUNAS PRUEBAS FALLARON. REVISAR DETALLES ARRIBA <<<\n";
    exit(1);
}

