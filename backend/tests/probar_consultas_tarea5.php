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
    exit(1);
}
// ============================================================================

use Illuminate\Support\Facades\DB;

echo "--- PROBANDO CONSULTAS DE LA TAREA 5 ---\n";

// 1. Usuarios
$q1 = DB::select("
    SELECT u.id_usuario, u.nombre_usuario, r.nombre AS rol, p.ci, p.nombres, p.apellidos, u.correo, u.estado, u.ultimo_acceso, u.created_at, u.updated_at
    FROM usuarios u
    INNER JOIN personas p ON u.id_persona = p.id_persona
    INNER JOIN roles r ON u.id_rol = r.id_rol
    WHERE DATE(u.created_at) = '2026-11-07' OR DATE(u.updated_at) = '2026-11-07' OR DATE(u.ultimo_acceso) = '2026-11-07'
    ORDER BY COALESCE(u.updated_at, u.created_at) DESC
    LIMIT 50;
");
echo "1. Consulta Usuarios: OK (" . count($q1) . " filas obtenidas)\n";

// 2. Pacientes
$q2 = DB::select("
    SELECT pac.id_paciente, pac.codigo_historia, p.ci, p.nombres, p.apellidos, p.telefono, pac.grupo_sanguineo, pac.estado, pac.created_at, pac.updated_at
    FROM pacientes pac
    INNER JOIN personas p ON pac.id_persona = p.id_persona
    WHERE DATE(pac.created_at) = '2026-11-07' OR DATE(pac.updated_at) = '2026-11-07'
    ORDER BY COALESCE(pac.updated_at, pac.created_at) DESC
    LIMIT 50;
");
echo "2. Consulta Pacientes: OK (" . count($q2) . " filas obtenidas)\n";

// 3. Citas
$q3 = DB::select("
    SELECT c.id_cita, c.codigo_cita, ec.nombre AS estado_cita, c.estado AS estado_logico, c.fecha_cita, c.hora_inicio, c.hora_fin, esp.nombre AS especialidad, CONCAT(p_med.nombres, ' ', p_med.apellidos) AS medico, CONCAT(p_pac.nombres, ' ', p_pac.apellidos) AS paciente, p_pac.ci AS ci_paciente, c.es_postergada, c.pago_confirmado, c.created_at, c.updated_at
    FROM citas c
    INNER JOIN estados_cita ec ON c.id_estado_cita = ec.id_estado_cita
    INNER JOIN especialidades esp ON c.id_especialidad = esp.id_especialidad
    INNER JOIN medicos m ON c.id_medico = m.id_medico
    INNER JOIN personas p_med ON m.id_persona = p_med.id_persona
    INNER JOIN pacientes pac ON c.id_paciente = pac.id_paciente
    INNER JOIN personas p_pac ON pac.id_persona = p_pac.id_persona
    WHERE DATE(c.created_at) = '2026-11-07' OR DATE(c.updated_at) = '2026-11-07'
    ORDER BY COALESCE(c.updated_at, c.created_at) DESC
    LIMIT 50;
");
echo "3. Consulta Citas: OK (" . count($q3) . " filas obtenidas)\n";

// 4. Pagos
$q4 = DB::select("
    SELECT pag.id_pago, pag.id_cita, c.codigo_cita, pag.monto, pag.metodo_pago, pag.estado_pago, pag.nro_transaccion, pag.fecha_pago, pag.fecha_reembolso, pag.created_at, pag.updated_at
    FROM pagos_cita pag
    INNER JOIN citas c ON pag.id_cita = c.id_cita
    WHERE DATE(pag.fecha_pago) = '2026-11-07' OR DATE(pag.updated_at) = '2026-11-07' OR DATE(pag.fecha_reembolso) = '2026-11-07'
    ORDER BY COALESCE(pag.updated_at, pag.fecha_pago) DESC
    LIMIT 50;
");
echo "4. Consulta Pagos: OK (" . count($q4) . " filas obtenidas)\n";

// 5. Bitácora
$q5 = DB::select("
    SELECT b.id_bitacora, b.fecha_hora, u.nombre_usuario, b.caso_uso, b.accion, b.tabla_afectada, b.registro_id, b.ip_origen
    FROM bitacora_auditoria b
    LEFT JOIN usuarios u ON b.id_usuario = u.id_usuario
    WHERE DATE(b.fecha_hora) = '2026-11-07'
    ORDER BY b.fecha_hora DESC
    LIMIT 50;
");
echo "5. Consulta Bitácora: OK (" . count($q5) . " filas obtenidas)\n";

// 6. Estados de Cita
$q6 = DB::select("
    SELECT id_estado_cita, codigo, nombre, descripcion
    FROM estados_cita
    ORDER BY id_estado_cita ASC
    LIMIT 30;
");
echo "6. Consulta Estados Cita: OK (" . count($q6) . " filas obtenidas)\n";

echo ">>> TODAS LAS CONSULTAS EJECUTADAS CON ÉXITO <<<\n";
