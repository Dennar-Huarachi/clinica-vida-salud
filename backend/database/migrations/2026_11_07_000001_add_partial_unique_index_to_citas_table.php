<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Crea un índice único parcial en PostgreSQL para prevenir sobreventa y doble reserva
     * simultánea a nivel de motor de base de datos para citas que ocupan turno activo.
     * Es idempotente y no destructiva: si detecta duplicados preexistentes, omite la creación
     * registrando una advertencia en el log para no romper despliegues automatizados (Render).
     */
    public function up(): void
    {
        // 1. Detectar si el motor soporta índices parciales (PostgreSQL)
        $driver = DB::getDriverName();
        if ($driver !== 'pgsql') {
            return;
        }

        // 2. Verificar si el índice ya existe previamente (idempotencia)
        $existeIndice = DB::selectOne("
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'citas' AND indexname = 'uq_citas_turno_activo'
        ");
        if ($existeIndice) {
            return;
        }

        // 3. Garantizar catálogos base si la tabla está vacía en una instalación limpia
        if (Schema::hasTable('estados_cita') && DB::table('estados_cita')->count() === 0) {
            if (class_exists(\Database\Seeders\CatalogosBaseSeeder::class)) {
                (new \Database\Seeders\CatalogosBaseSeeder())->run();
            }
        }

        // 4. Obtener dinámicamente los IDs de 'cancelada' y 'postergada' por nombre o código (sin IDs fijos)
        $estadoCancelada = DB::table('estados_cita')
            ->where(function ($q) {
                $q->whereRaw("LOWER(nombre) LIKE '%cancelada%'")
                  ->orWhereRaw("LOWER(codigo) = 'cancelada'");
            })
            ->first();

        $estadoPostergada = DB::table('estados_cita')
            ->where(function ($q) {
                $q->whereRaw("LOWER(nombre) LIKE '%postergada%'")
                  ->orWhereRaw("LOWER(codigo) = 'postergada'");
            })
            ->first();

        $idCancelada = $estadoCancelada?->id_estado_cita;
        $idPostergada = $estadoPostergada?->id_estado_cita;

        if (!$idCancelada || !$idPostergada) {
            Log::warning("MIGRACIÓN SEGURA: No se encontraron los estados 'cancelada' y/o 'postergada' en 'estados_cita'. Se omite la creación del índice único 'uq_citas_turno_activo'.");
            if (app()->runningInConsole()) {
                echo " [ADVERTENCIA] Se omitió crear uq_citas_turno_activo: estados 'cancelada' o 'postergada' no encontrados en estados_cita.\n";
            }
            return;
        }

        $idCancelada = (int)$idCancelada;
        $idPostergada = (int)$idPostergada;

        // 5. Verificar si existen citas duplicadas en turnos que ocupan atención médica
        $duplicados = DB::select("
            SELECT id_medico, fecha_cita, hora_inicio, COUNT(*) as cantidad
            FROM citas
            WHERE estado != 'cancelada' 
              AND es_postergada = false 
              AND id_estado_cita NOT IN ({$idCancelada}, {$idPostergada})
            GROUP BY id_medico, fecha_cita, hora_inicio
            HAVING COUNT(*) > 1
        ");

        if (!empty($duplicados)) {
            $totalGrupos = count($duplicados);
            Log::warning("MIGRACIÓN SEGURA: Se omitió la creación del índice único 'uq_citas_turno_activo' porque existen {$totalGrupos} turnos con citas duplicadas en la tabla 'citas'. Resuelva los duplicados antes de aplicar el índice en Supabase.");
            if (app()->runningInConsole()) {
                echo " [ADVERTENCIA] Se omitió crear uq_citas_turno_activo: existen {$totalGrupos} turnos con citas duplicadas.\n";
            }
            return;
        }

        // 6. Crear índice único parcial con los IDs dinámicos resueltos
        DB::statement("
            CREATE UNIQUE INDEX IF NOT EXISTS uq_citas_turno_activo 
            ON citas (id_medico, fecha_cita, hora_inicio) 
            WHERE estado != 'cancelada' 
              AND es_postergada = false 
              AND id_estado_cita NOT IN ({$idCancelada}, {$idPostergada});
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::getDriverName();
        if ($driver === 'pgsql') {
            DB::statement("DROP INDEX IF EXISTS uq_citas_turno_activo;");
        }
    }
};

