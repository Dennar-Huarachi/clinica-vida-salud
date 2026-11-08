<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
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
    echo "Este script de concurrencia escribe datos y solo puede ejecutarse en entorno local de pruebas.\n";
    echo "Valores actuales: APP_ENV='{$envApp}', DB_HOST='{$dbHost}', DB_DATABASE='{$dbName}'.\n\n";
    exit(1);
}
// ============================================================================

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

echo "===============================================================\n";
echo " PRUEBA DE CONCURRENCIA REAL: 2 PROCESOS PARALELOS INDEPENDIENTES\n";
echo "===============================================================\n";

$fecha = Carbon::now('America/La_Paz')->next(Carbon::FRIDAY)->toDateString();
$hora = '15:30:00';
$idMedico = 2; // Dr. Alarcón

// 1. Limpieza de cualquier cita previa en ese slot
$citasViejas = DB::table('citas')
    ->where('id_medico', $idMedico)
    ->where('fecha_cita', $fecha)
    ->where('hora_inicio', $hora)
    ->pluck('id_cita');

foreach ($citasViejas as $id) {
    DB::table('pagos_cita')->where('id_cita', $id)->delete();
    DB::table('atenciones_clinicas')->where('id_cita', $id)->delete();
    DB::table('citas')->where('id_cita', $id)->delete();
}

echo "Slot liberado: Médico {$idMedico}, Fecha {$fecha}, Hora {$hora}\n";

// Script para cada proceso
$workerCode = '
require "backend/vendor/autoload.php";
$app = require "backend/bootstrap/app.php";
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$idPaciente = (int)$argv[1];
$fecha = $argv[2];
$hora = $argv[3];

$srv = app(\App\Paquetes\CitasNotificaciones\CU12_GestionarCitas\GestionarCitasServicio::class);
$admin = Illuminate\Support\Facades\DB::table("usuarios")->where("nombre_usuario", "admin")->first();

try {
    $res = $srv->crear([
        "id_medico" => 2,
        "id_especialidad" => 1,
        "id_paciente" => $idPaciente,
        "fecha_cita" => $fecha,
        "hora_inicio" => $hora,
        "motivo_consulta" => "Prueba concurrencia proceso " . $idPaciente,
        "metodo_pago" => "qr",
    ], $admin->id_usuario);
    echo json_encode(["status" => 201, "id_cita" => $res["id_cita"]]);
} catch (\Throwable $e) {
    $code = $e->getCode() ?: 400;
    echo json_encode(["status" => $code, "error" => $e->getMessage()]);
}
';

$tempWorker = __DIR__ . '/_worker_concurrencia.php';
file_put_contents($tempWorker, "<?php\n" . $workerCode);

// Ejecutar ambos procesos en paralelo usando proc_open
$cmd1 = "php \"{$tempWorker}\" 2 \"{$fecha}\" \"{$hora}\"";
$cmd2 = "php \"{$tempWorker}\" 3 \"{$fecha}\" \"{$hora}\"";

$desc = [
    0 => ['pipe', 'r'],
    1 => ['pipe', 'w'],
    2 => ['pipe', 'w'],
];

echo "Disparando Proceso 1 y Proceso 2 simultáneamente...\n";
$p1 = proc_open($cmd1, $desc, $pipes1);
$p2 = proc_open($cmd2, $desc, $pipes2);

$out1 = stream_get_contents($pipes1[1]);
$err1 = stream_get_contents($pipes1[2]);
fclose($pipes1[0]); fclose($pipes1[1]); fclose($pipes1[2]);
$status1 = proc_close($p1);

$out2 = stream_get_contents($pipes2[1]);
$err2 = stream_get_contents($pipes2[2]);
fclose($pipes2[0]); fclose($pipes2[1]); fclose($pipes2[2]);
$status2 = proc_close($p2);

// Limpiar worker temporal
if (file_exists($tempWorker)) {
    unlink($tempWorker);
}

echo "\n--- RESULTADOS DE LOS PROCESOS SIMULTÁNEOS ---\n";
echo "PROCESO 1: " . trim($out1 ?: $err1) . "\n";
echo "PROCESO 2: " . trim($out2 ?: $err2) . "\n";

$res1 = json_decode($out1, true);
$res2 = json_decode($out2, true);

$s1 = $res1['status'] ?? null;
$s2 = $res2['status'] ?? null;

echo "\nEstado P1: {$s1} | Estado P2: {$s2}\n";

$exitoConcurrencia = ($s1 === 201 && $s2 === 409) || ($s1 === 409 && $s2 === 201);

if ($exitoConcurrencia) {
    echo "\n>>> VERIFICACIÓN EXITOSA: Uno recibió 201 y el otro 409 Conflict. Cero sobreventa garantizada. <<<\n";
} else {
    echo "\n>>> FALLO DE CONCURRENCIA: No se obtuvo combinación 201 / 409 <<<\n";
}
