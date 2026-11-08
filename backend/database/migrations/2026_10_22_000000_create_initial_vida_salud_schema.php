<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Consolidación del esquema relacional base de 20 tablas para la Clínica Vida Salud.
     * Motor: PostgreSQL con tipos nativos, claves foráneas e integridad referencial estricta.
     */
    public function up(): void
    {
    // 1. roles
        Schema::create('roles', function (Blueprint $table) {
            $table->id('id_rol');
            $table->string('nombre', 30)->unique();
            $table->string('descripcion', 150)->nullable();
            $table->timestamps();
        });

        // 2. personas
        Schema::create('personas', function (Blueprint $table) {
            $table->id('id_persona');
            $table->string('ci', 20)->nullable()->unique();
            $table->string('nombres', 80);
            $table->string('apellidos', 80);
            $table->date('fecha_nacimiento')->nullable();
            $table->char('sexo', 1)->nullable();
            $table->string('telefono', 20)->nullable();
            $table->string('correo', 100)->nullable();
            $table->string('direccion', 200)->nullable();
            $table->timestamps();
        });

        // 3. usuarios
        Schema::create('usuarios', function (Blueprint $table) {
            $table->id('id_usuario');
            $table->foreignId('id_persona')->unique()->constrained('personas', 'id_persona')->onUpdate('cascade')->onDelete('restrict');
            $table->foreignId('id_rol')->constrained('roles', 'id_rol')->onUpdate('cascade')->onDelete('restrict');
            $table->string('nombre_usuario', 50)->unique();
            $table->string('correo', 100)->nullable()->unique();
            $table->string('contrasena_hash', 255);
            $table->boolean('debe_cambiar_contrasena')->default(true);
            $table->string('estado', 20)->default('activo'); // activo, inactivo, bloqueado
            $table->timestamp('ultimo_acceso')->nullable();
            $table->string('token_sesion', 255)->nullable();
            $table->timestamps();
        });

        // 4. pacientes
        Schema::create('pacientes', function (Blueprint $table) {
            $table->id('id_paciente');
            $table->foreignId('id_persona')->unique()->constrained('personas', 'id_persona')->onUpdate('cascade')->onDelete('restrict');
            $table->string('codigo_historia', 30)->unique();
            $table->string('grupo_sanguineo', 10)->nullable();
            $table->string('estado', 20)->default('activo'); // activo, inactivo (prohibido borrado físico)
            $table->timestamps();
        });

        // 5. informacion_medica_paciente
        Schema::create('informacion_medica_paciente', function (Blueprint $table) {
            $table->id('id_informacion_medica');
            $table->foreignId('id_paciente')->unique()->constrained('pacientes', 'id_paciente')->onUpdate('cascade')->onDelete('restrict');
            $table->text('alergias')->nullable();
            $table->text('enfermedades_cronicas')->nullable();
            $table->text('medicamentos_actuales')->nullable();
            $table->text('antecedentes_familiares')->nullable();
            $table->text('observaciones')->nullable();
            $table->timestamps();
        });

        // 6. contactos_emergencia
        Schema::create('contactos_emergencia', function (Blueprint $table) {
            $table->id('id_contacto_emergencia');
            $table->foreignId('id_paciente')->constrained('pacientes', 'id_paciente')->onUpdate('cascade')->onDelete('restrict');
            $table->string('nombre_completo', 120);
            $table->string('relacion', 50);
            $table->string('telefono', 20);
            $table->string('direccion', 200)->nullable();
            $table->boolean('es_principal')->default(true);
            $table->timestamps();
        });

        // 7. medicos
        Schema::create('medicos', function (Blueprint $table) {
            $table->id('id_medico');
            $table->foreignId('id_persona')->unique()->constrained('personas', 'id_persona')->onUpdate('cascade')->onDelete('restrict');
            $table->string('nro_matricula', 50)->unique();
            $table->text('biografia')->nullable();
            $table->string('estado', 20)->default('activo'); // activo, inactivo (prohibido borrado físico)
            $table->timestamps();
        });

        // 8. especialidades
        Schema::create('especialidades', function (Blueprint $table) {
            $table->id('id_especialidad');
            $table->string('nombre', 80)->unique();
            $table->string('descripcion', 255)->nullable();
            $table->integer('duracion_turno_minutos')->default(15);
            $table->string('estado', 20)->default('activo');
            $table->timestamps();
        });

        // 9. medico_especialidad
        Schema::create('medico_especialidad', function (Blueprint $table) {
            $table->id('id_medico_especialidad');
            $table->foreignId('id_medico')->constrained('medicos', 'id_medico')->onUpdate('cascade')->onDelete('restrict');
            $table->foreignId('id_especialidad')->constrained('especialidades', 'id_especialidad')->onUpdate('cascade')->onDelete('restrict');
            $table->unique(['id_medico', 'id_especialidad']);
            $table->timestamps();
        });

        // 10. horarios_atencion
        Schema::create('horarios_atencion', function (Blueprint $table) {
            $table->id('id_horario');
            $table->foreignId('id_medico')->constrained('medicos', 'id_medico')->onUpdate('cascade')->onDelete('restrict');
            $table->foreignId('id_especialidad')->constrained('especialidades', 'id_especialidad')->onUpdate('cascade')->onDelete('restrict');
            $table->smallInteger('dia_semana'); // 1=Lunes .. 7=Domingo
            $table->time('hora_inicio');
            $table->time('hora_fin');
            $table->integer('duracion_intervalo_minutos')->default(15);
            $table->string('estado', 20)->default('activo');
            $table->timestamps();
        });

        // 11. bloqueos_clinica
        Schema::create('bloqueos_clinica', function (Blueprint $table) {
            $table->id('id_bloqueo');
            $table->string('titulo', 120);
            $table->text('motivo')->nullable();
            $table->timestamp('fecha_inicio');
            $table->timestamp('fecha_fin');
            $table->boolean('aplica_a_todos')->default(true);
            $table->foreignId('id_medico')->nullable()->constrained('medicos', 'id_medico')->onUpdate('cascade')->onDelete('restrict');
            $table->string('estado', 20)->default('activo');
            $table->timestamps();
        });

        // 12. suspensiones_horario
        Schema::create('suspensiones_horario', function (Blueprint $table) {
            $table->id('id_suspension');
            $table->foreignId('id_medico')->constrained('medicos', 'id_medico')->onUpdate('cascade')->onDelete('restrict');
            $table->timestamp('fecha_inicio');
            $table->timestamp('fecha_fin');
            $table->string('motivo', 255);
            $table->string('estado_citas_accion', 50)->default('reprogramacion_pendiente');
            $table->timestamps();
        });

        // 13. estados_cita
        Schema::create('estados_cita', function (Blueprint $table) {
            $table->id('id_estado_cita');
            $table->string('codigo', 30)->unique();
            $table->string('nombre', 50);
            $table->string('descripcion', 150)->nullable();
            $table->timestamps();
        });

        // 14. citas
        Schema::create('citas', function (Blueprint $table) {
            $table->id('id_cita');
            $table->string('codigo_cita', 30)->unique();
            $table->foreignId('id_paciente')->constrained('pacientes', 'id_paciente')->onUpdate('cascade')->onDelete('restrict');
            $table->foreignId('id_medico')->constrained('medicos', 'id_medico')->onUpdate('cascade')->onDelete('restrict');
            $table->foreignId('id_especialidad')->constrained('especialidades', 'id_especialidad')->onUpdate('cascade')->onDelete('restrict');
            $table->foreignId('id_estado_cita')->constrained('estados_cita', 'id_estado_cita')->onUpdate('cascade')->onDelete('restrict');
            $table->date('fecha_cita');
            $table->time('hora_inicio');
            $table->time('hora_fin');
            $table->string('motivo_consulta', 255)->nullable();
            $table->text('observaciones')->nullable();
            $table->boolean('es_postergada')->default(false);
            $table->timestamp('fecha_expiracion_reserva')->nullable();
            $table->foreignId('creado_por_usuario')->nullable()->constrained('usuarios', 'id_usuario')->onUpdate('cascade')->onDelete('restrict');
            $table->string('estado', 20)->default('activo'); // activo, cancelada (prohibido borrado físico)
            $table->timestamps();

            $table->index(['id_medico', 'fecha_cita']);
            $table->index(['id_paciente', 'fecha_cita']);
        });

        // 15. notificaciones
        Schema::create('notificaciones', function (Blueprint $table) {
            $table->id('id_notificacion');
            $table->foreignId('id_usuario')->constrained('usuarios', 'id_usuario')->onUpdate('cascade')->onDelete('restrict');
            $table->string('tipo', 50);
            $table->string('titulo', 120);
            $table->text('mensaje');
            $table->boolean('leido')->default(false);
            $table->timestamp('fecha_leido')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            $table->index(['id_usuario', 'leido']);
        });

        // 16. atenciones_clinicas
        Schema::create('atenciones_clinicas', function (Blueprint $table) {
            $table->id('id_atencion');
            $table->foreignId('id_cita')->unique()->constrained('citas', 'id_cita')->onUpdate('cascade')->onDelete('restrict');
            $table->foreignId('id_paciente')->constrained('pacientes', 'id_paciente')->onUpdate('cascade')->onDelete('restrict');
            $table->foreignId('id_medico')->constrained('medicos', 'id_medico')->onUpdate('cascade')->onDelete('restrict');
            $table->text('motivo_atencion');
            $table->text('examen_fisico')->nullable();
            $table->text('diagnostico');
            $table->text('tratamiento_indicaciones');
            $table->text('receta_medica')->nullable();
            $table->timestamp('fecha_atencion');
            $table->timestamps();
        });

        // 17. resultados_laboratorio
        Schema::create('resultados_laboratorio', function (Blueprint $table) {
            $table->id('id_resultado');
            $table->foreignId('id_paciente')->constrained('pacientes', 'id_paciente')->onUpdate('cascade')->onDelete('restrict');
            $table->foreignId('id_atencion')->nullable()->constrained('atenciones_clinicas', 'id_atencion')->onUpdate('cascade')->onDelete('restrict');
            $table->string('tipo_estudio', 100);
            $table->text('descripcion');
            $table->string('archivo_adjunto', 255)->nullable();
            $table->date('fecha_estudio');
            $table->timestamps();
        });

        // 18. bitacora_auditoria
        Schema::create('bitacora_auditoria', function (Blueprint $table) {
            $table->id('id_bitacora');
            $table->foreignId('id_usuario')->nullable()->constrained('usuarios', 'id_usuario')->onUpdate('cascade')->onDelete('restrict');
            $table->string('caso_uso', 80);
            $table->string('accion', 50);
            $table->string('tabla_afectada', 50)->nullable();
            $table->string('registro_id', 50)->nullable();
            $table->jsonb('datos_anteriores')->nullable();
            $table->jsonb('datos_nuevos')->nullable();
            $table->string('ip_origen', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('fecha_hora')->useCurrent();
            $table->timestamps();

            $table->index(['caso_uso']);
            $table->index(['fecha_hora']);
            $table->index(['id_usuario']);
        });

        // 19. copias_seguridad
        Schema::create('copias_seguridad', function (Blueprint $table) {
            $table->id('id_copia');
            $table->foreignId('id_usuario')->nullable()->constrained('usuarios', 'id_usuario')->onUpdate('cascade')->onDelete('restrict');
            $table->string('nombre_archivo', 255);
            $table->string('ruta_almacenamiento', 255);
            $table->bigInteger('tamano_bytes')->default(0);
            $table->string('tipo', 30)->default('completa');
            $table->string('estado', 20)->default('completado');
            $table->timestamps();
        });

        // 20. parametros_sistema
        Schema::create('parametros_sistema', function (Blueprint $table) {
            $table->id('id_parametro');
            $table->string('clave', 60)->unique();
            $table->text('valor');
            $table->string('descripcion', 255)->nullable();
            $table->string('tipo_dato', 20)->default('string'); // string, integer, boolean, json
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     * Eliminación en orden estricto de dependencias inversas.
     */
    public function down(): void
    {
        Schema::dropIfExists('parametros_sistema');
        Schema::dropIfExists('copias_seguridad');
        Schema::dropIfExists('bitacora_auditoria');
        Schema::dropIfExists('resultados_laboratorio');
        Schema::dropIfExists('atenciones_clinicas');
        Schema::dropIfExists('notificaciones');
        Schema::dropIfExists('citas');
        Schema::dropIfExists('estados_cita');
        Schema::dropIfExists('suspensiones_horario');
        Schema::dropIfExists('bloqueos_clinica');
        Schema::dropIfExists('horarios_atencion');
        Schema::dropIfExists('medico_especialidad');
        Schema::dropIfExists('especialidades');
        Schema::dropIfExists('medicos');
        Schema::dropIfExists('contactos_emergencia');
        Schema::dropIfExists('informacion_medica_paciente');
        Schema::dropIfExists('pacientes');
        Schema::dropIfExists('usuarios');
        Schema::dropIfExists('personas');
        Schema::dropIfExists('roles');
    }
};
