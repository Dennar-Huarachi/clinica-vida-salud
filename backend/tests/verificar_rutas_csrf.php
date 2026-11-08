<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
$httpKernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

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
    echo "Este script escribe datos de prueba y solo puede ejecutarse en entorno local de pruebas.\n";
    echo "Valores actuales: APP_ENV='{$envApp}', DB_HOST='{$dbHost}', DB_DATABASE='{$dbName}'.\n\n";
    exit(1);
}
// ============================================================================

echo "--- PROBANDO RUTAS CON PREFIJO /api/ Y SIN PREFIJO ---\n";

// Obtener una clave válida dinámicamente o usar usuario de prueba
$passwordTest = env('TEST_USER_PASSWORD', 'ClavePrueba_Temporal');
$userTest = DB::table('usuarios')->where('nombre_usuario', 'paciente1')->first();
if ($userTest) {
    DB::table('usuarios')->where('id_usuario', $userTest->id_usuario)->update([
        'contrasena_hash' => Illuminate\Support\Facades\Hash::make($passwordTest)
    ]);
}

// 1. POST /api/acceso/login
$req1 = Illuminate\Http\Request::create('/api/acceso/login', 'POST', [], [], [], [
    'HTTP_ORIGIN' => 'https://clinica-gilt-iota.vercel.app',
    'HTTP_ACCEPT' => 'application/json',
    'CONTENT_TYPE' => 'application/json',
], json_encode(['tipo_acceso' => 'paciente', 'identificador' => 'paciente1', 'contrasena' => $passwordTest]));
$res1 = $httpKernel->handle($req1);
echo "1. POST /api/acceso/login -> Status: " . $res1->getStatusCode() . " | Cookies: " . count($res1->headers->getCookies()) . " | Content: " . substr($res1->getContent(), 0, 80) . "\n";

// 2. POST /acceso/login (sin prefijo)
$req2 = Illuminate\Http\Request::create('/acceso/login', 'POST', [], [], [], [
    'HTTP_ORIGIN' => 'https://clinica-gilt-iota.vercel.app',
    'HTTP_ACCEPT' => 'application/json',
    'CONTENT_TYPE' => 'application/json',
], json_encode(['tipo_acceso' => 'paciente', 'identificador' => 'paciente1', 'contrasena' => $passwordTest]));
$res2 = $httpKernel->handle($req2);
echo "2. POST /acceso/login (sin /api) -> Status: " . $res2->getStatusCode() . " | Cookies: " . count($res2->headers->getCookies()) . " | Content: " . substr($res2->getContent(), 0, 80) . "\n";

// Obtener token para pruebas protegidas
$json1 = json_decode($res1->getContent(), true);
$token = $json1['datos']['token'] ?? $json1['token'] ?? null;
echo "Token obtenido: " . ($token ? 'OK (' . substr($token, 0, 15) . '...)' : 'NO') . "\n";

// 3. PUT /api/citas/1/confirmar
$req3 = Illuminate\Http\Request::create('/api/citas/1/confirmar', 'PUT', [], [], [], [
    'HTTP_ORIGIN' => 'https://clinica-gilt-iota.vercel.app',
    'HTTP_ACCEPT' => 'application/json',
    'HTTP_AUTHORIZATION' => "Bearer {$token}",
    'CONTENT_TYPE' => 'application/json',
]);
$res3 = $httpKernel->handle($req3);
echo "3. PUT /api/citas/1/confirmar -> Status: " . $res3->getStatusCode() . "\n";

// 4. PUT /citas/1/confirmar (sin prefijo)
$req4 = Illuminate\Http\Request::create('/citas/1/confirmar', 'PUT', [], [], [], [
    'HTTP_ORIGIN' => 'https://clinica-gilt-iota.vercel.app',
    'HTTP_ACCEPT' => 'application/json',
    'HTTP_AUTHORIZATION' => "Bearer {$token}",
    'CONTENT_TYPE' => 'application/json',
]);
$res4 = $httpKernel->handle($req4);
echo "4. PUT /citas/1/confirmar (sin /api) -> Status: " . $res4->getStatusCode() . "\n";
