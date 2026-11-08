<?php

namespace Database\Seeders;

use Database\Seeders\CatalogosBaseSeeder;
use Database\Seeders\Demostracion\AccesoDemoSeeder;
use Database\Seeders\Demostracion\BitacoraAuditoriaDemoSeeder;
use Database\Seeders\Demostracion\CatalogosHorariosDemoSeeder;
use Database\Seeders\Demostracion\CitasDemoSeeder;
use Database\Seeders\Demostracion\HistoriaClinicaDemoSeeder;
use Database\Seeders\Demostracion\PacientesDemoSeeder;
use Database\Seeders\Demostracion\SuspensionesNotificacionesDemoSeeder;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatosDemostracionSeeder extends Seeder
{
    /**
     * Sincroniza secuencias auto-incrementales en PostgreSQL.
     */
    public static function sincronizarSecuenciasPostgreSQL(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            $tablas = [
                'roles' => 'id_rol',
                'personas' => 'id_persona',
                'usuarios' => 'id_usuario',
                'pacientes' => 'id_paciente',
                'informacion_medica_paciente' => 'id_informacion_medica',
                'contactos_emergencia' => 'id_contacto_emergencia',
                'medicos' => 'id_medico',
                'especialidades' => 'id_especialidad',
                'medico_especialidad' => 'id_medico_especialidad',
                'horarios_atencion' => 'id_horario',
                'bloqueos_clinica' => 'id_bloqueo',
                'suspensiones_horario' => 'id_suspension',
                'estados_cita' => 'id_estado_cita',
                'citas' => 'id_cita',
                'pagos_cita' => 'id_pago',
                'notificaciones' => 'id_notificacion',
                'atenciones_clinicas' => 'id_atencion',
                'resultados_laboratorio' => 'id_resultado',
                'bitacora_auditoria' => 'id_bitacora',
                'copias_seguridad' => 'id_copia',
                'parametros_sistema' => 'id_parametro',
                'permisos' => 'id_permiso',
            ];

            foreach ($tablas as $tabla => $pk) {
                try {
                    DB::statement("SELECT setval(pg_get_serial_sequence('{$tabla}', '{$pk}'), COALESCE((SELECT MAX({$pk}) FROM {$tabla}), 1))");
                } catch (\Throwable $e) {
                    // Silencioso
                }
            }
        }
    }

    /**
     * Poblado integral de datos de demostración para la defensa de la Clínica Vida Salud.
     */
    public function run(): void
    {
        // 1. Garantizar catálogos base antes de cualquier dato de demostración
        $this->call(CatalogosBaseSeeder::class);

        // 2. Sincronizar secuencias para garantizar IDs limpios
        self::sincronizarSecuenciasPostgreSQL();

        // 3. Ejecutar seeders modulares de demostración en orden estricto de dependencias
        $this->call([
            AccesoDemoSeeder::class,
            CatalogosHorariosDemoSeeder::class,
            PacientesDemoSeeder::class,
            CitasDemoSeeder::class,
            SuspensionesNotificacionesDemoSeeder::class,
            BitacoraAuditoriaDemoSeeder::class,
            HistoriaClinicaDemoSeeder::class,
        ]);

        // 4. Sincronización final de secuencias
        self::sincronizarSecuenciasPostgreSQL();
    }
}
