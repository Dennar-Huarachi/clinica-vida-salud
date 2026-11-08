<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Crear tabla pagos_cita
        Schema::create('pagos_cita', function (Blueprint $table) {
            $table->id('id_pago');
            $table->foreignId('id_cita')->constrained('citas', 'id_cita')->onUpdate('cascade')->onDelete('restrict');
            $table->decimal('monto', 10, 2);
            $table->string('metodo_pago', 30); // qr_transferencia, tarjeta_debito_credito
            $table->string('nro_transaccion', 60)->unique();
            $table->string('estado_pago', 20)->default('completado'); // completado, reembolsado, retenido
            $table->text('detalles_pasarela')->nullable(); // Metadatos simulados de pasarela
            $table->timestamp('fecha_pago')->useCurrent();
            $table->timestamp('fecha_reembolso')->nullable();
            $table->timestamps();

            $table->index(['id_cita']);
            $table->index(['estado_pago']);
        });

        // 2. Agregar id_pago y pago_confirmado a la tabla citas
        Schema::table('citas', function (Blueprint $table) {
            $table->foreignId('id_pago')->nullable()->constrained('pagos_cita', 'id_pago')->nullOnDelete();
            $table->boolean('pago_confirmado')->default(true);
        });

        // 3. Registrar / Actualizar parámetros de sistema para RN15 y D17
        DB::table('parametros_sistema')->updateOrInsert(
            ['clave' => 'HORAS_ANTICIPACION_CANCELAR'],
            [
                'valor' => '12',
                'descripcion' => 'Horas mínimas de anticipación requeridas para que un paciente cancele su turno con derecho a reembolso (RN15)',
                'tipo_dato' => 'integer',
                'updated_at' => now(),
            ]
        );

        DB::table('parametros_sistema')->updateOrInsert(
            ['clave' => 'MONTO_FIJO_RESERVA_CITA'],
            [
                'valor' => '50.00',
                'descripcion' => 'Monto fijo de garantía de reserva de cita médica en Bolivianos (D17, RN15)',
                'tipo_dato' => 'decimal',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    public function down(): void
    {
        if (Schema::hasColumn('citas', 'id_pago')) {
            Schema::table('citas', function (Blueprint $table) {
                $table->dropForeign(['id_pago']);
                $table->dropColumn(['id_pago', 'pago_confirmado']);
            });
        }

        Schema::dropIfExists('pagos_cita');
    }
};
