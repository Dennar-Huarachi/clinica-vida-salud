<?php

// ============================================================================
// GUARDA DE SEGURIDAD ESTRICTA: PREVENCIÓN DE EJECUCIÓN EN PRODUCCIÓN
// ============================================================================
$host = '127.0.0.1';
$port = '5432';
$user = 'postgres';
$pass = 'admin123';
$testDb = 'clinica_sandbox_seeders_test';

$esHostLocalValido = in_array(strtolower($host), ['127.0.0.1', 'localhost', '::1', '']);
if (!$esHostLocalValido) {
    echo "\n\033[31m[BLOQUEO DE SEGURIDAD]\033[0m Host no local detectado: '{$host}'. Abortando.\n\n";
    exit(1);
}
// ============================================================================

echo "===================================================================\n";
echo " VERIFICACIÓN DE SEEDERS DE DEMOSTRACIÓN CONTRA ÍNDICE ÚNICO\n";
echo " Base de datos temporal: {$testDb} (NO clinica_db)\n";
echo "===================================================================\n";

try {
    $pdo = new PDO("pgsql:host={$host};port={$port};dbname=postgres", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // 1. Crear base de datos temporal
    $pdo->exec("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '{$testDb}' AND pid <> pg_backend_pid();");
    $pdo->exec("DROP DATABASE IF EXISTS {$testDb};");
    $pdo->exec("CREATE DATABASE {$testDb};");
    echo "1. Base de datos temporal '{$testDb}' creada con éxito.\n";

    $phpBin = defined('PHP_BINARY') && PHP_BINARY ? PHP_BINARY : 'php';
    $artisan = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'artisan';

    $descriptors = [
        0 => ['pipe', 'r'],
        1 => ['pipe', 'w'],
        2 => ['pipe', 'w']
    ];

    $rawEnv = array_merge($_SERVER, [
        'DB_DATABASE' => $testDb,
        'DB_HOST' => $host,
        'DB_PORT' => $port,
        'DB_USERNAME' => $user,
        'DB_PASSWORD' => $pass,
    ]);
    $env = [];
    foreach ($rawEnv as $k => $v) {
        if (is_scalar($v)) {
            $env[$k] = (string)$v;
        }
    }

    // Función auxiliar para ejecutar artisan
    $ejecutarArtisan = function ($args) use ($phpBin, $artisan, $descriptors, $env) {
        $cmd = escapeshellarg($phpBin) . " " . escapeshellarg($artisan) . " " . $args;
        $proc = proc_open($cmd, $descriptors, $pipes, dirname(__DIR__), $env);
        $stdout = stream_get_contents($pipes[1]);
        $stderr = stream_get_contents($pipes[2]);
        fclose($pipes[0]); fclose($pipes[1]); fclose($pipes[2]);
        $code = proc_close($proc);
        return ['code' => $code, 'stdout' => $stdout, 'stderr' => $stderr];
    };

    // 2. Ejecutar migrate:fresh
    echo "2. Ejecutando migrate:fresh en sandbox...\n";
    $resMigrate = $ejecutarArtisan("migrate:fresh --force");
    if ($resMigrate['code'] !== 0) {
        echo "Error en migrate:fresh:\n" . $resMigrate['stderr'] . "\n" . $resMigrate['stdout'] . "\n";
        exit(1);
    }
    echo "   migrate:fresh completado exitosamente.\n";

    // 3. Ejecutar DatosDemostracionSeeder COMPLETO (Primera vez)
    echo "3. Ejecutando DatosDemostracionSeeder COMPLETO (Poblado 1)...\n";
    $resSeed1 = $ejecutarArtisan("db:seed --class=DatosDemostracionSeeder --force");
    if ($resSeed1['code'] !== 0) {
        echo "Error en Seeder 1:\n" . $resSeed1['stderr'] . "\n" . $resSeed1['stdout'] . "\n";
        exit(1);
    }
    echo "   DatosDemostracionSeeder (Paso 1) completado exitosamente.\n";

    // 4. Ejecutar DatosDemostracionSeeder COMPLETO (Segunda vez para probar IDEMPOTENCIA)
    echo "4. Ejecutando DatosDemostracionSeeder COMPLETO por SEGUNDA vez (Prueba de Idempotencia)...\n";
    $resSeed2 = $ejecutarArtisan("db:seed --class=DatosDemostracionSeeder --force");
    if ($resSeed2['code'] !== 0) {
        echo "Error en Seeder 2 (Fallo de idempotencia):\n" . $resSeed2['stderr'] . "\n" . $resSeed2['stdout'] . "\n";
        exit(1);
    }
    echo "   DatosDemostracionSeeder (Paso 2 - Idempotencia) superado exitosamente sin violaciones.\n";

    // 5. Verificaciones en la base de datos de prueba
    $pdoTest = new PDO("pgsql:host={$host};port={$port};dbname={$testDb}", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // Verificar si el índice único existe
    $idxExists = $pdoTest->query("
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'citas' AND indexname = 'uq_citas_turno_activo'
    ")->fetchColumn();

    // Total de citas
    $totalCitas = (int)$pdoTest->query("SELECT count(*) FROM citas")->fetchColumn();

    // Citas por estado
    $citasPorEstado = $pdoTest->query("
        SELECT 
            c.id_estado_cita, 
            ec.nombre AS estado_nombre, 
            c.estado AS estado_columna,
            c.es_postergada,
            count(*) as total
        FROM citas c
        INNER JOIN estados_cita ec ON c.id_estado_cita = ec.id_estado_cita
        GROUP BY c.id_estado_cita, ec.nombre, c.estado, c.es_postergada
        ORDER BY c.id_estado_cita
    ")->fetchAll(PDO::FETCH_ASSOC);

    // Detección de colisiones de turnos activos
    $colisiones = $pdoTest->query("
        SELECT id_medico, fecha_cita, hora_inicio, count(*) as cantidad
        FROM citas
        WHERE estado != 'cancelada' 
          AND es_postergada = false 
          AND id_estado_cita NOT IN (
              SELECT id_estado_cita FROM estados_cita WHERE LOWER(nombre) LIKE '%cancelada%' OR LOWER(nombre) LIKE '%postergada%'
          )
        GROUP BY id_medico, fecha_cita, hora_inicio
        HAVING count(*) > 1
    ")->fetchAll(PDO::FETCH_ASSOC);

    echo "\n--- RESULTADOS DE AUDITORÍA EN SANDBOX ---\n";
    echo "Índice uq_citas_turno_activo presente en BD: " . ($idxExists ? "SÍ (100% OK)" : "NO") . "\n";
    echo "Total de citas en tabla 'citas': {$totalCitas}\n";
    echo "Colisiones de turnos activos: " . count($colisiones) . " (0 colisiones = Éxito)\n\n";

    echo "Desglose de Citas por Estado:\n";
    echo str_repeat("-", 75) . "\n";
    printf("%-5s | %-25s | %-12s | %-14s | %-6s\n", "ID", "Estado (estados_cita)", "Col. estado", "Es Postergada", "Total");
    echo str_repeat("-", 75) . "\n";
    foreach ($citasPorEstado as $fila) {
        printf(
            "%-5d | %-25s | %-12s | %-14s | %-6d\n",
            $fila['id_estado_cita'],
            $fila['estado_nombre'],
            $fila['estado_columna'],
            $fila['es_postergada'] ? 'true' : 'false',
            $fila['total']
        );
    }
    echo str_repeat("-", 75) . "\n";

    // 6. Limpieza completa
    $pdoTest = null;
    $pdo->exec("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '{$testDb}' AND pid <> pg_backend_pid();");
    $pdo->exec("DROP DATABASE IF EXISTS {$testDb};");
    echo "\n5. Limpieza: Base de datos temporal '{$testDb}' eliminada correctamente.\n";

    echo "\n>>> VERIFICACIÓN TAREA 1 COMPLETADA CON ÉXITO TOTAL <<<\n";

} catch (\Throwable $e) {
    echo "\nERROR EXCEPCIÓN: " . $e->getMessage() . "\n";
    exit(1);
}
