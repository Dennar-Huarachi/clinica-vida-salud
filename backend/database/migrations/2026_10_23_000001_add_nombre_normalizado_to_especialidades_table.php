<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private static function normalizar(string $texto): string
    {
        $texto = mb_strtolower(trim($texto), 'UTF-8');
        $mapa = [
            'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ü' => 'u',
            'à' => 'a', 'è' => 'e', 'ì' => 'i', 'ò' => 'o', 'ù' => 'u',
            'ñ' => 'n',
        ];
        $texto = strtr($texto, $mapa);
        $texto = preg_replace('/[^a-z0-9\s]/u', '', $texto);
        $texto = preg_replace('/\s+/', ' ', $texto);
        return trim($texto);
    }

    public function up(): void
    {
        if (Schema::hasTable('especialidades') && !Schema::hasColumn('especialidades', 'nombre_normalizado')) {
            // 1. Agregar columna temporalmente nullable
            Schema::table('especialidades', function (Blueprint $table) {
                $table->string('nombre_normalizado', 80)->nullable()->after('nombre');
            });

            // 2. Poblar registros existentes con su versión normalizada
            $especialidades = DB::table('especialidades')->get();
            foreach ($especialidades as $esp) {
                $normalizado = self::normalizar((string)($esp->nombre ?? ''));
                if (empty($normalizado)) {
                    $normalizado = 'especialidad-' . $esp->id_especialidad;
                }
                DB::table('especialidades')
                    ->where('id_especialidad', $esp->id_especialidad)
                    ->update(['nombre_normalizado' => $normalizado]);
            }

            // 3. Aplicar NOT NULL y restricción UNIQUE en PostgreSQL
            DB::statement('ALTER TABLE especialidades ALTER COLUMN nombre_normalizado SET NOT NULL;');
            DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS especialidades_nombre_normalizado_unique ON especialidades (nombre_normalizado);');
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('especialidades') && Schema::hasColumn('especialidades', 'nombre_normalizado')) {
            DB::statement('DROP INDEX IF EXISTS especialidades_nombre_normalizado_unique;');
            Schema::table('especialidades', function (Blueprint $table) {
                $table->dropColumn('nombre_normalizado');
            });
        }
    }
};
