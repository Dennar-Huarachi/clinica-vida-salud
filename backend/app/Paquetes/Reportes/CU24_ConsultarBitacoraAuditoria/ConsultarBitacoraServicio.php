<?php

namespace App\Paquetes\Reportes\CU24_ConsultarBitacoraAuditoria;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ConsultarBitacoraServicio
{
    /**
     * Garantiza que la bitácora contenga al menos registros iniciales de demostración o del sistema.
     */
    private function garantizarRegistrosIniciales(): void
    {
        try {
            if (DB::table('bitacora_auditoria')->count() === 0) {
                if (class_exists(\Database\Seeders\Demostracion\BitacoraAuditoriaDemoSeeder::class)) {
                    (new \Database\Seeders\Demostracion\BitacoraAuditoriaDemoSeeder())->run();
                } else {
                    DB::table('bitacora_auditoria')->insert([
                        'caso_uso' => 'CU01_IniciarCerrarSesion',
                        'accion' => 'SISTEMA_INICIALIZADO',
                        'tabla_afectada' => 'parametros_sistema',
                        'registro_id' => '1',
                        'datos_anteriores' => null,
                        'datos_nuevos' => json_encode(['estado' => 'operativo', 'despliegue' => 'produccion']),
                        'ip_origen' => '127.0.0.1',
                        'user_agent' => 'Sistema/Inicializador',
                        'fecha_hora' => now(),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        } catch (\Throwable $e) {
            report($e);
        }
    }

    /**
     * Consulta el registro histórico inmutable de auditoría forense del sistema (CU-24 / RN21).
     * Exclusivo de solo lectura para el rol Administrador.
     */
    public function consultar(
        ?string $casoUso = null,
        ?string $accion = null,
        ?string $usuario = null,
        ?string $tablaAfectada = null,
        ?string $fechaInicio = null,
        ?string $fechaFin = null,
        ?string $fecha = null,
        int $limite = 150
    ): array {
        $this->garantizarRegistrosIniciales();

        $query = DB::table('bitacora_auditoria')
            ->leftJoin('usuarios', 'bitacora_auditoria.id_usuario', '=', 'usuarios.id_usuario')
            ->leftJoin('roles', 'usuarios.id_rol', '=', 'roles.id_rol')
            ->leftJoin('personas', 'usuarios.id_persona', '=', 'personas.id_persona')
            ->select(
                'bitacora_auditoria.id_bitacora',
                'bitacora_auditoria.id_usuario',
                'bitacora_auditoria.caso_uso',
                'bitacora_auditoria.accion',
                'bitacora_auditoria.tabla_afectada',
                'bitacora_auditoria.registro_id',
                'bitacora_auditoria.datos_anteriores',
                'bitacora_auditoria.datos_nuevos',
                'bitacora_auditoria.ip_origen',
                'bitacora_auditoria.user_agent',
                'bitacora_auditoria.fecha_hora',
                'usuarios.nombre_usuario',
                'roles.nombre as usuario_rol',
                DB::raw("trim(personas.nombres || ' ' || personas.apellidos) as usuario_nombre_completo")
            )
            ->orderBy('bitacora_auditoria.fecha_hora', 'desc')
            ->orderBy('bitacora_auditoria.id_bitacora', 'desc')
            ->limit(min(max($limite, 10), 500));

        if ($casoUso && trim($casoUso) !== '') {
            $query->where('bitacora_auditoria.caso_uso', 'ilike', '%' . trim($casoUso) . '%');
        }

        if ($accion && trim($accion) !== '') {
            $query->where('bitacora_auditoria.accion', 'ilike', '%' . trim($accion) . '%');
        }

        if ($tablaAfectada && trim($tablaAfectada) !== '') {
            $query->where('bitacora_auditoria.tabla_afectada', 'ilike', '%' . trim($tablaAfectada) . '%');
        }

        if ($usuario && trim($usuario) !== '') {
            $u = trim($usuario);
            $query->where(function ($sub) use ($u) {
                $sub->where('usuarios.nombre_usuario', 'ilike', "%{$u}%")
                    ->orWhere('usuarios.correo', 'ilike', "%{$u}%")
                    ->orWhere('personas.correo', 'ilike', "%{$u}%")
                    ->orWhere('personas.nombres', 'ilike', "%{$u}%")
                    ->orWhere('personas.apellidos', 'ilike', "%{$u}%")
                    ->orWhere('roles.nombre', 'ilike', "%{$u}%");
            });
        }

        if ($fecha && trim($fecha) !== '') {
            $inicio = Carbon::parse($fecha, 'America/La_Paz')->startOfDay();
            $fin = Carbon::parse($fecha, 'America/La_Paz')->endOfDay();
            $query->whereBetween('bitacora_auditoria.fecha_hora', [$inicio, $fin]);
        } else {
            if ($fechaInicio && trim($fechaInicio) !== '') {
                $inicio = Carbon::parse($fechaInicio, 'America/La_Paz')->startOfDay();
                $query->where('bitacora_auditoria.fecha_hora', '>=', $inicio);
            }
            if ($fechaFin && trim($fechaFin) !== '') {
                $fin = Carbon::parse($fechaFin, 'America/La_Paz')->endOfDay();
                $query->where('bitacora_auditoria.fecha_hora', '<=', $fin);
            }
        }

        return $query->get()->map(function ($row) {
            // Decodificar JSON si viene como string
            if (is_string($row->datos_anteriores)) {
                $row->datos_anteriores = json_decode($row->datos_anteriores, true);
            }
            if (is_string($row->datos_nuevos)) {
                $row->datos_nuevos = json_decode($row->datos_nuevos, true);
            }
            return $row;
        })->toArray();
    }
}
