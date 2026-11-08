<?php

// ============================================================================
// GUARDA DE SEGURIDAD ESTRICTA: PREVENCIÓN DE EJECUCIÓN EN PRODUCCIÓN
// ============================================================================
$host = '127.0.0.1';
$port = '5432';
$user = 'postgres';
$pass = 'admin123';
$testDb = 'clinica_sandbox_seed_test';

$esHostLocalValido = in_array(strtolower($host), ['127.0.0.1', 'localhost', '::1', '']);
if (!$esHostLocalValido) {
    echo "\n\033[31m[BLOQUEO DE SEGURIDAD]\033[0m Host no local detectado: '{$host}'. Abortando.\n\n";
    exit(1);
}
// ============================================================================

echo "===================================================================\n";
echo " VERIFICACIÓN DE MIGRATE:FRESH --SEED EN BASE DE PRUEBAS APARTE\n";
echo " Base de datos temporal: clinica_sandbox_seed_test (NO clinica_db)\n";
echo "===================================================================\n";

try {
    $pdo = new PDO("pgsql:host={$host};port={$port};dbname=postgres", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // 1. Crear base de datos de pruebas aparte
    $pdo->exec("DROP DATABASE IF EXISTS {$testDb};");
    $pdo->exec("CREATE DATABASE {$testDb};");
    echo "1. Base de datos temporal '{$testDb}' creada correctamente.\n";

    // 2. Ejecutar php artisan migrate:fresh --seed apuntando a clinica_sandbox_seed_test
    // Pasamos variables de entorno para no tocar .env ni clinica_db
    $phpBin = defined('PHP_BINARY') && PHP_BINARY ? PHP_BINARY : 'php';
    $artisan = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'artisan';
    $cmd = escapeshellarg($phpBin) . " " . escapeshellarg($artisan) . " migrate:fresh --seed --force";
    
    // Configuramos environment para el comando
    $descriptors = [
        0 => ['pipe', 'r'],
        1 => ['pipe', 'w'],
        2 => ['pipe', 'w']
    ];
    
    $env = array_merge($_SERVER, [
        'DB_DATABASE' => $testDb,
        'DB_HOST' => $host,
        'DB_PORT' => $port,
        'DB_USERNAME' => $user,
        'DB_PASSWORD' => $pass,
    ]);

    echo "2. Ejecutando: {$cmd} contra '{$testDb}'...\n";
    $process = proc_open($cmd, $descriptors, $pipes, dirname(__DIR__ . '/..'), $env);

    $stdout = stream_get_contents($pipes[1]);
    $stderr = stream_get_contents($pipes[2]);
    fclose($pipes[0]); fclose($pipes[1]); fclose($pipes[2]);
    $exitCode = proc_close($process);

    echo "--- SALIDA DE ARTISAN ---\n";
    echo $stdout;
    if ($stderr) {
        echo "STDERR:\n" . $stderr . "\n";
    }

    // 3. Verificar si el índice único existe en la base temporal
    $pdoTest = new PDO("pgsql:host={$host};port={$port};dbname={$testDb}", $user, $pass);
    $idxExists = $pdoTest->query("
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'citas' AND indexname = 'uq_citas_turno_activo'
    ")->fetchColumn();

    $totalCitas = $pdoTest->query("SELECT count(*) FROM citas")->fetchColumn();

    echo "\n--- VERIFICACIÓN DE INTEGRIDAD EN SANDBOX ---\n";
    echo "Código de salida Artisan: {$exitCode}\n";
    echo "Índice uq_citas_turno_activo creado: " . ($idxExists ? "SÍ (100% OK)" : "NO") . "\n";
    echo "Total de citas sembradas por seeders: {$totalCitas}\n";

    // 4. Limpieza: borrar la base de pruebas temporal
    $pdoTest = null;
    $pdo->exec("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '{$testDb}' AND pid <> pg_backend_pid();");
    $pdo->exec("DROP DATABASE IF EXISTS {$testDb};");
    echo "4. Base de datos temporal '{$testDb}' eliminada limpiamente.\n";

    if ($exitCode === 0 && $idxExists) {
        echo "\n>>> RESULTADO: migrate:fresh --seed FUNCIONÓ PERFECTAMENTE CON EL ÍNDICE CREADO <<<\n";
    } else {
        echo "\n>>> FALLÓ LA VERIFICACIÓN EN SANDBOX <<<\n";
    }

} catch (\Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
