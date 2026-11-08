<?php

namespace App\Nucleo\Bitacora;

use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class ServicioBitacora
{
    /**
     * Serializa de manera segura cualquier payload para compatibilidad estricta con jsonb de PostgreSQL.
     */
    private static function normalizarJson(mixed $data): ?string
    {
        if ($data === null) {
            return null;
        }

        if (is_string($data)) {
            $recorte = trim($data);
            if ($recorte === '') {
                return null;
            }

            // Si ya es un JSON válido, conservarlo; si es texto plano, encapsularlo
            json_decode($recorte);
            if (json_last_error() === JSON_ERROR_NONE) {
                return $recorte;
            }
            $data = ['mensaje' => $recorte];
        }

        try {
            $encoded = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PARTIAL_OUTPUT_ON_ERROR);
            return $encoded !== false ? $encoded : json_encode(['error' => 'No serializable']);
        } catch (\Throwable) {
            return json_encode(['error' => 'Excepcion de serializacion']);
        }
    }

    /**
     * Registra una acción de auditoría inmutable en la tabla bitacora_auditoria (CU-24 / RN21).
     */
    public static function registrar(
        string $casoUso,
        string $accion,
        ?string $tablaAfectada = null,
        ?string $registroId = null,
        mixed $datosAnteriores = null,
        mixed $datosNuevos = null,
        ?int $idUsuario = null
    ): void {
        try {
            $request = request();

            // 1. Detección segura de IP considerando proxies reversos (Render/Cloudflare)
            $ip = '127.0.0.1';
            if ($request) {
                $forwarded = $request->header('x-forwarded-for');
                if ($forwarded) {
                    $partes = explode(',', $forwarded);
                    $ip = trim($partes[0]);
                } else {
                    $ip = $request->ip() ?? '127.0.0.1';
                }
            }
            $ip = mb_substr((string)$ip, 0, 45);

            $userAgent = $request ? mb_substr((string)$request->userAgent(), 0, 500) : 'Sistema/CLI';

            // 2. Resolver usuario autenticado si no fue provisto
            if ($idUsuario === null && $request && $request->attributes->has('usuario_autenticado')) {
                $usuario = $request->attributes->get('usuario_autenticado');
                $idUsuario = $usuario->id_usuario ?? null;
            }

            // 3. Garantizar integridad referencial con tabla usuarios (FK)
            if ($idUsuario !== null) {
                $existeUsuario = DB::table('usuarios')->where('id_usuario', $idUsuario)->exists();
                if (!$existeUsuario) {
                    $idUsuario = null;
                }
            }

            // 4. Sanitizar longitudes según restricciones de esquema PostgreSQL
            $registro = [
                'id_usuario' => $idUsuario,
                'caso_uso' => mb_substr(trim($casoUso), 0, 80),
                'accion' => mb_substr(trim($accion), 0, 50),
                'tabla_afectada' => $tablaAfectada ? mb_substr(trim($tablaAfectada), 0, 50) : null,
                'registro_id' => $registroId !== null ? mb_substr(trim((string)$registroId), 0, 50) : null,
                'datos_anteriores' => self::normalizarJson($datosAnteriores),
                'datos_nuevos' => self::normalizarJson($datosNuevos),
                'ip_origen' => $ip,
                'user_agent' => $userAgent,
                'fecha_hora' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ];

            // 5. Inserción resiliente independiente de transacciones activas
            // Si hay una transacción abierta que pudiera revertirse, usar conexión aislada
            if (DB::transactionLevel() > 0) {
                $connName = 'pgsql_auditoria_autocommit';
                if (!config()->has("database.connections.{$connName}")) {
                    $defaultConn = config('database.default');
                    $connConfig = config("database.connections.{$defaultConn}");
                    if ($connConfig) {
                        config(["database.connections.{$connName}" => $connConfig]);
                    }
                }

                try {
                    DB::connection($connName)->table('bitacora_auditoria')->insert($registro);
                    return;
                } catch (\Throwable) {
                    // Fallback a conexión estándar
                }
            }

            DB::table('bitacora_auditoria')->insert($registro);
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
