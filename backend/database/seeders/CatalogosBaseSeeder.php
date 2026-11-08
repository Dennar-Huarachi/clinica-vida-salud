<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CatalogosBaseSeeder extends Seeder
{
    /**
     * Garantiza los catálogos maestros obligatorios del sistema con nombres reales y claves naturales.
     * Idempotente y libre de IDs manuales para compatibilidad con PostgreSQL.
     */
    public function run(): void
    {
        // 1. Roles institucionales del sistema (clave única natural: nombre)
        $roles = [
            ['nombre' => 'administrador', 'descripcion' => 'Administrador total del sistema'],
            ['nombre' => 'medico', 'descripcion' => 'Profesional médico de la clínica'],
            ['nombre' => 'recepcionista', 'descripcion' => 'Personal de recepción y gestión de citas'],
            ['nombre' => 'paciente', 'descripcion' => 'Usuario paciente con acceso a autoservicio'],
        ];

        foreach ($roles as $rol) {
            DB::table('roles')->updateOrInsert(
                ['nombre' => $rol['nombre']],
                [
                    'descripcion' => $rol['descripcion'],
                    'updated_at' => now(),
                ]
            );
        }

        // 2. Estados de Cita médica requeridos por el sistema (clave única natural: codigo)
        $estadosCita = [
            ['codigo' => 'pendiente', 'nombre' => 'Pendiente', 'descripcion' => 'Cita reservada a la espera de confirmación'],
            ['codigo' => 'programada', 'nombre' => 'Programada', 'descripcion' => 'Cita médica agendada en calendario'],
            ['codigo' => 'confirmada', 'nombre' => 'Confirmada', 'descripcion' => 'Cita confirmada por el paciente o recepción'],
            ['codigo' => 'en_espera', 'nombre' => 'En Sala de Espera', 'descripcion' => 'Paciente presente en la clínica esperando llamado'],
            ['codigo' => 'atendida', 'nombre' => 'Atendida', 'descripcion' => 'Consulta médica concluida con atención clínica registrada'],
            ['codigo' => 'cancelada', 'nombre' => 'Cancelada', 'descripcion' => 'Cita cancelada con anticipación'],
            ['codigo' => 'inasistencia', 'nombre' => 'Inasistencia', 'descripcion' => 'El paciente no asistió a su cita programada'],
            ['codigo' => 'reprogramada', 'nombre' => 'Reprogramada', 'descripcion' => 'Cita movida a otro turno u horario'],
            ['codigo' => 'postergada', 'nombre' => 'Postergada por Suspensión', 'descripcion' => 'Cita afectada por suspensión de médico pendiente de reubicación'],
        ];

        foreach ($estadosCita as $estado) {
            DB::table('estados_cita')->updateOrInsert(
                ['codigo' => $estado['codigo']],
                [
                    'nombre' => $estado['nombre'],
                    'descripcion' => $estado['descripcion'],
                    'updated_at' => now(),
                ]
            );
        }

        // 3. Parámetros globales del sistema (clave única natural: clave)
        $parametros = [
            [
                'clave' => 'HORAS_ANTICIPACION_CANCELAR',
                'valor' => '12',
                'descripcion' => 'Horas mínimas de anticipación requeridas para que un paciente cancele su turno con derecho a reembolso (RN15)',
                'tipo_dato' => 'integer',
            ],
            [
                'clave' => 'MONTO_FIJO_RESERVA_CITA',
                'valor' => '50.00',
                'descripcion' => 'Monto fijo de garantía de reserva de cita médica en Bolivianos (D17, RN15)',
                'tipo_dato' => 'decimal',
            ],
            [
                'clave' => 'HORAS_VENTANA_POSTERGADAS',
                'valor' => '48',
                'descripcion' => 'Horas en que los turnos liberados tras suspensión quedan reservados exclusivamente para reubicar citas postergadas',
                'tipo_dato' => 'integer',
            ],
            [
                'clave' => 'MINUTOS_DURACION_TURNO',
                'valor' => '15',
                'descripcion' => 'Duración estándar de cada turno de consulta en minutos',
                'tipo_dato' => 'integer',
            ],
            [
                'clave' => 'NOMBRE_CLINICA',
                'valor' => 'Clínica Vida Salud',
                'descripcion' => 'Nombre institucional del establecimiento',
                'tipo_dato' => 'string',
            ],
        ];

        foreach ($parametros as $param) {
            DB::table('parametros_sistema')->updateOrInsert(
                ['clave' => $param['clave']],
                [
                    'valor' => $param['valor'],
                    'descripcion' => $param['descripcion'],
                    'tipo_dato' => $param['tipo_dato'],
                    'updated_at' => now(),
                ]
            );
        }

        // 4. Catálogo de Permisos del Sistema y Asignación Base (CU-04)
        $this->call(PermisosSeeder::class);
    }
}

