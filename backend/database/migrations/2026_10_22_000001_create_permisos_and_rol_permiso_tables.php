<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tabla permisos
        if (!Schema::hasTable('permisos')) {
            Schema::create('permisos', function (Blueprint $table) {
                $table->id('id_permiso');
                $table->string('modulo', 50);
                $table->string('nombre', 80);
                $table->string('slug', 80)->unique();
                $table->string('descripcion', 200)->nullable();
                $table->timestamps();

                $table->index('modulo');
            });
        }

        // 2. Tabla pivote rol_permiso
        if (!Schema::hasTable('rol_permiso')) {
            Schema::create('rol_permiso', function (Blueprint $table) {
                $table->foreignId('id_rol')->constrained('roles', 'id_rol')->onUpdate('cascade')->onDelete('cascade');
                $table->foreignId('id_permiso')->constrained('permisos', 'id_permiso')->onUpdate('cascade')->onDelete('cascade');
                $table->primary(['id_rol', 'id_permiso']);
                $table->timestamps();
            });
        }

        // 3. Columna reservable_en_linea en especialidades (CU-07 RN18)
        if (Schema::hasTable('especialidades') && !Schema::hasColumn('especialidades', 'reservable_en_linea')) {
            Schema::table('especialidades', function (Blueprint $table) {
                $table->boolean('reservable_en_linea')->default(true)->after('duracion_turno_minutos');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('especialidades') && Schema::hasColumn('especialidades', 'reservable_en_linea')) {
            Schema::table('especialidades', function (Blueprint $table) {
                $table->dropColumn('reservable_en_linea');
            });
        }

        Schema::dropIfExists('rol_permiso');
        Schema::dropIfExists('permisos');
    }
};
