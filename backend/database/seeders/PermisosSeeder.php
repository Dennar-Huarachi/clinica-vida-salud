<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PermisosSeeder extends Seeder
{
    public function run(): void
    {
        $permisos = [
            // Módulo: Compras e Insumos
            [
                'modulo' => 'Compras e Insumos',
                'nombre' => 'Ver Compras e Insumos',
                'slug' => 'compras.view',
                'descripcion' => 'Permite consultar el catálogo de compras, proveedores e insumos médicos.',
            ],
            [
                'modulo' => 'Compras e Insumos',
                'nombre' => 'Administrar Compras e Insumos',
                'slug' => 'compras.manage',
                'descripcion' => 'Permite registrar órdenes de compra, stock de materiales y recepción de insumos.',
            ],

            // Módulo: Seguridad · Sesión
            [
                'modulo' => 'Seguridad · Sesión',
                'nombre' => 'Iniciar Sesión en Plataforma',
                'slug' => 'auth.login',
                'descripcion' => 'Permite acceder a los portales correspondientes del sistema según credenciales.',
            ],
            [
                'modulo' => 'Seguridad · Sesión',
                'nombre' => 'Control de Sesiones Activas',
                'slug' => 'auth.sesiones',
                'descripcion' => 'Permite supervisar sesiones activas y forzar cierre por inactividad o seguridad.',
            ],

            // Módulo: Seguridad · Bitácora de Auditoría
            [
                'modulo' => 'Seguridad · Bitácora de Auditoría',
                'nombre' => 'Consultar Bitácora de Auditoría',
                'slug' => 'auditoria.view',
                'descripcion' => 'Permite visualizar el historial inmutable de acciones críticas y trazabilidad.',
            ],
            [
                'modulo' => 'Seguridad · Bitácora de Auditoría',
                'nombre' => 'Exportar Registros de Auditoría',
                'slug' => 'auditoria.export',
                'descripcion' => 'Permite descargar el registro cronológico de auditoría para fines de control.',
            ],

            // Módulo: Seguridad · Usuarios y Permisos
            [
                'modulo' => 'Seguridad · Usuarios y Permisos',
                'nombre' => 'Visualizar Usuarios',
                'slug' => 'usuarios.view',
                'descripcion' => 'Permite consultar la lista de usuarios registrados en el sistema.',
            ],
            [
                'modulo' => 'Seguridad · Usuarios y Permisos',
                'nombre' => 'Gestionar Usuarios',
                'slug' => 'usuarios.manage',
                'descripcion' => 'Permite crear nuevos usuarios, editar credenciales y alternar estado activo/inactivo.',
            ],
            [
                'modulo' => 'Seguridad · Usuarios y Permisos',
                'nombre' => 'Gestionar Roles y Permisos',
                'slug' => 'roles.manage',
                'descripcion' => 'Permite crear roles personalizados y asignar o revocar permisos modulares.',
            ],

            // Módulo: Citas Médicas
            [
                'modulo' => 'Citas Médicas',
                'nombre' => 'Gestionar Citas Médicas',
                'slug' => 'citas.gestionar',
                'descripcion' => 'Permite consultar agendas, supervisar turnos y actualizar estados de citas.',
            ],
            [
                'modulo' => 'Citas Médicas',
                'nombre' => 'Reservar y Agendar Citas',
                'slug' => 'citas.reservar',
                'descripcion' => 'Permite asignar turnos médicos para pacientes propios o en ventanilla.',
            ],
            [
                'modulo' => 'Citas Médicas',
                'nombre' => 'Cancelar Citas Programadas',
                'slug' => 'citas.cancelar',
                'descripcion' => 'Permite anular turnos médicos respetando las políticas de anticipación.',
            ],
            [
                'modulo' => 'Citas Médicas',
                'nombre' => 'Registrar Asistencia en Sala',
                'slug' => 'citas.asistencia',
                'descripcion' => 'Permite marcar asistencia o inasistencia de pacientes en recepción.',
            ],

            // Módulo: Pacientes
            [
                'modulo' => 'Pacientes',
                'nombre' => 'Consultar Padrón de Pacientes',
                'slug' => 'pacientes.ver',
                'descripcion' => 'Permite buscar y listar expedientes de pacientes.',
            ],
            [
                'modulo' => 'Pacientes',
                'nombre' => 'Gestionar Fichas de Pacientes',
                'slug' => 'pacientes.gestionar',
                'descripcion' => 'Permite registrar nuevos pacientes, modificar datos de contacto y estado lógico.',
            ],
            [
                'modulo' => 'Pacientes',
                'nombre' => 'Consultar Historial Clínico',
                'slug' => 'pacientes.historial',
                'descripcion' => 'Permite revisar diagnósticos previos, tratamientos e indicaciones médicas.',
            ],

            // Módulo: Horarios y Especialidades
            [
                'modulo' => 'Horarios y Especialidades',
                'nombre' => 'Gestionar Especialidades Médicas',
                'slug' => 'catalogos.especialidades',
                'descripcion' => 'Permite dar de alta especialidades, definir duración y disponibilidad en línea.',
            ],
            [
                'modulo' => 'Horarios y Especialidades',
                'nombre' => 'Gestionar Cuerpo Médico',
                'slug' => 'catalogos.medicos',
                'descripcion' => 'Permite registrar médicos, vincular especialidades y matrícula profesional.',
            ],
            [
                'modulo' => 'Horarios y Especialidades',
                'nombre' => 'Gestionar Horarios de Atención',
                'slug' => 'horarios.gestionar',
                'descripcion' => 'Permite configurar rangos horarios de atención semanal por médico y rama.',
            ],
            [
                'modulo' => 'Horarios y Especialidades',
                'nombre' => 'Suspender Horarios Médicos',
                'slug' => 'horarios.suspensiones',
                'descripcion' => 'Permite registrar suspensiones de turno y reubicar citas afectadas.',
            ],

            // Módulo: Reportes
            [
                'modulo' => 'Reportes',
                'nombre' => 'Consultar Reportes Operativos',
                'slug' => 'reportes.citas',
                'descripcion' => 'Permite consultar métricas de citas emitidas, canceladas y atendidas.',
            ],
            [
                'modulo' => 'Reportes',
                'nombre' => 'Reportes de Asistencia de Pacientes',
                'slug' => 'reportes.asistencia',
                'descripcion' => 'Permite evaluar el porcentaje de inasistencias y cumplimientos de turno.',
            ],
            [
                'modulo' => 'Reportes',
                'nombre' => 'Exportar Reportes a Archivo',
                'slug' => 'reportes.exportar',
                'descripcion' => 'Permite descargar listados consolidados en formatos para hoja de cálculo.',
            ],
            [
                'modulo' => 'Reportes',
                'nombre' => 'Visualizar Dashboard Gerencial',
                'slug' => 'dashboard.view',
                'descripcion' => 'Permite acceder a los indicadores clave de desempeño de la clínica.',
            ],
        ];

        foreach ($permisos as $permiso) {
            DB::table('permisos')->updateOrInsert(
                ['slug' => $permiso['slug']],
                [
                    'modulo' => $permiso['modulo'],
                    'nombre' => $permiso['nombre'],
                    'descripcion' => $permiso['descripcion'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        // Asignar todos los permisos al rol Administrador (id_rol = 1 o nombre = 'administrador')
        $rolAdmin = DB::table('roles')->where('nombre', 'administrador')->first();
        if ($rolAdmin) {
            $todosPermisos = DB::table('permisos')->pluck('id_permiso');
            foreach ($todosPermisos as $idPermiso) {
                DB::table('rol_permiso')->updateOrInsert(
                    ['id_rol' => $rolAdmin->id_rol, 'id_permiso' => $idPermiso],
                    ['created_at' => now(), 'updated_at' => now()]
                );
            }
        }
    }
}
