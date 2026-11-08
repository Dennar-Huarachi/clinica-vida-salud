<?php

namespace Database\Seeders\Demostracion;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BitacoraAuditoriaDemoSeeder extends Seeder
{
    public function run(): void
    {
        $hoy = Carbon::today('America/La_Paz');

        // Mapeo dinámico de usuarios registrados
        $usuarios = [
            'admin' => DB::table('usuarios')->where('nombre_usuario', 'admin')->value('id_usuario'),
            'recepcion1' => DB::table('usuarios')->where('nombre_usuario', 'recepcion1')->value('id_usuario'),
            'recepcion2' => DB::table('usuarios')->where('nombre_usuario', 'recepcion2')->value('id_usuario'),
            'dr.alarcon' => DB::table('usuarios')->where('nombre_usuario', 'dr.alarcon')->value('id_usuario'),
            'dra.torres' => DB::table('usuarios')->where('nombre_usuario', 'dra.torres')->value('id_usuario'),
            'dr.guzman' => DB::table('usuarios')->where('nombre_usuario', 'dr.guzman')->value('id_usuario'),
            'dra.rojas' => DB::table('usuarios')->where('nombre_usuario', 'dra.rojas')->value('id_usuario'),
            'dr.vargas' => DB::table('usuarios')->where('nombre_usuario', 'dr.vargas')->value('id_usuario'),
            'dra.suarez' => DB::table('usuarios')->where('nombre_usuario', 'dra.suarez')->value('id_usuario'),
            'paciente1' => DB::table('usuarios')->where('nombre_usuario', 'paciente1')->value('id_usuario'),
            'paciente2' => DB::table('usuarios')->where('nombre_usuario', 'paciente2')->value('id_usuario'),
            'paciente3' => DB::table('usuarios')->where('nombre_usuario', 'paciente3')->value('id_usuario'),
            'paciente4' => DB::table('usuarios')->where('nombre_usuario', 'paciente4')->value('id_usuario'),
        ];

        // Mapeo dinámico de estados de cita
        $idEstadoAtendida = DB::table('estados_cita')
            ->where('codigo', 'atendida')
            ->orWhere('nombre', 'Atendida')
            ->value('id_estado_cita');

        $idEstadoInasistencia = DB::table('estados_cita')
            ->where('codigo', 'inasistencia')
            ->orWhere('nombre', 'Inasistencia')
            ->value('id_estado_cita');

        $idEstadoConfirmada = DB::table('estados_cita')
            ->where('codigo', 'confirmada')
            ->orWhere('nombre', 'Confirmada')
            ->value('id_estado_cita');

        if (!$idEstadoAtendida || !$idEstadoInasistencia) {
            throw new \RuntimeException("Estados 'atendida' o 'inasistencia' no encontrados en tabla estados_cita.");
        }

        $userAgentDemo = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/133.0.0.0 Safari/537.36';

        // 1. Quince (15) Inicios de sesión exitosos
        $loginsExitosos = [
            ['u' => 'admin', 'dias' => 20, 'hora' => '07:45:12', 'ip' => '192.168.1.10'],
            ['u' => 'recepcion1', 'dias' => 19, 'hora' => '07:50:33', 'ip' => '192.168.1.25'],
            ['u' => 'dr.alarcon', 'dias' => 19, 'hora' => '08:02:10', 'ip' => '192.168.1.41'],
            ['u' => 'dra.torres', 'dias' => 18, 'hora' => '07:55:04', 'ip' => '192.168.1.42'],
            ['u' => 'paciente1', 'dias' => 17, 'hora' => '14:22:18', 'ip' => '181.115.12.88'],
            ['u' => 'recepcion2', 'dias' => 16, 'hora' => '07:48:50', 'ip' => '192.168.1.26'],
            ['u' => 'dr.guzman', 'dias' => 15, 'hora' => '13:55:00', 'ip' => '192.168.1.43'],
            ['u' => 'dra.rojas', 'dias' => 14, 'hora' => '07:58:30', 'ip' => '192.168.1.44'],
            ['u' => 'dr.vargas', 'dias' => 12, 'hora' => '08:05:15', 'ip' => '192.168.1.45'],
            ['u' => 'dra.suarez', 'dias' => 10, 'hora' => '07:52:40', 'ip' => '192.168.1.46'],
            ['u' => 'paciente2', 'dias' => 8, 'hora' => '16:40:11', 'ip' => '181.115.15.42'],
            ['u' => 'paciente3', 'dias' => 7, 'hora' => '19:15:22', 'ip' => '181.115.20.19'],
            ['u' => 'admin', 'dias' => 5, 'hora' => '08:10:00', 'ip' => '192.168.1.10'],
            ['u' => 'recepcion1', 'dias' => 2, 'hora' => '07:45:00', 'ip' => '192.168.1.25'],
            ['u' => 'paciente4', 'dias' => 1, 'hora' => '11:30:45', 'ip' => '181.115.9.105'],
        ];

        foreach ($loginsExitosos as $idx => $l) {
            $idU = $usuarios[$l['u']] ?? null;
            $fecha = $hoy->copy()->subDays($l['dias'])->toDateString() . ' ' . $l['hora'];

            DB::table('bitacora_auditoria')->updateOrInsert(
                [
                    'caso_uso' => 'CU01_IniciarCerrarSesion',
                    'accion' => 'LOGIN_EXITOSO_' . ($idx + 1),
                ],
                [
                    'id_usuario' => $idU,
                    'accion' => 'LOGIN_EXITOSO',
                    'tabla_afectada' => 'usuarios',
                    'registro_id' => (string)$idU,
                    'datos_anteriores' => null,
                    'datos_nuevos' => json_encode(['nombre_usuario' => $l['u'], 'resultado' => 'autenticado']),
                    'ip_origen' => $l['ip'],
                    'user_agent' => $userAgentDemo,
                    'fecha_hora' => $fecha,
                    'updated_at' => now(),
                ]
            );
        }

        // 2. Tres (3) Intentos fallidos de login
        $loginsFallidos = [
            ['u' => 'admin', 'dias' => 15, 'hora' => '22:14:05', 'ip' => '200.87.110.14', 'motivo' => 'Contraseña incorrecta'],
            ['u' => 'desconocido_test', 'dias' => 9, 'hora' => '03:12:49', 'ip' => '45.12.89.102', 'motivo' => 'Usuario inexistente'],
            ['u' => 'recepcion1', 'dias' => 3, 'hora' => '19:04:12', 'ip' => '190.181.45.2', 'motivo' => 'Credenciales no coincidentes'],
        ];

        foreach ($loginsFallidos as $idx => $f) {
            $fecha = $hoy->copy()->subDays($f['dias'])->toDateString() . ' ' . $f['hora'];

            DB::table('bitacora_auditoria')->updateOrInsert(
                [
                    'caso_uso' => 'CU01_IniciarCerrarSesion',
                    'accion' => 'LOGIN_FALLIDO_' . ($idx + 1),
                ],
                [
                    'id_usuario' => null,
                    'accion' => 'LOGIN_FALLIDO',
                    'tabla_afectada' => 'usuarios',
                    'registro_id' => null,
                    'datos_anteriores' => null,
                    'datos_nuevos' => json_encode(['intento_usuario' => $f['u'], 'error' => $f['motivo']]),
                    'ip_origen' => $f['ip'],
                    'user_agent' => $userAgentDemo,
                    'fecha_hora' => $fecha,
                    'updated_at' => now(),
                ]
            );
        }

        // 3. Creación de usuarios del personal
        $personalAudit = ['recepcion1', 'recepcion2', 'dr.alarcon', 'dra.torres', 'dr.guzman', 'dra.rojas', 'dr.vargas', 'dra.suarez'];
        foreach ($personalAudit as $pUser) {
            $idU = $usuarios[$pUser] ?? null;
            if (!$idU) continue;

            DB::table('bitacora_auditoria')->updateOrInsert(
                [
                    'caso_uso' => 'CU04_AdministrarUsuariosRoles',
                    'accion' => 'CREAR_USUARIO_' . $pUser,
                ],
                [
                    'id_usuario' => $usuarios['admin'] ?? null,
                    'accion' => 'CREAR_USUARIO',
                    'tabla_afectada' => 'usuarios',
                    'registro_id' => (string)$idU,
                    'datos_anteriores' => null,
                    'datos_nuevos' => json_encode(['nombre_usuario' => $pUser, 'estado' => 'activo']),
                    'ip_origen' => '192.168.1.10',
                    'user_agent' => $userAgentDemo,
                    'fecha_hora' => $hoy->copy()->subDays(21)->toDateString() . ' 09:30:00',
                    'updated_at' => now(),
                ]
            );
        }

        // 4. Cambios de estado en citas pasadas
        $citasAtendidas = DB::table('citas')->where('id_estado_cita', $idEstadoAtendida)->limit(5)->get();
        foreach ($citasAtendidas as $cita) {
            DB::table('bitacora_auditoria')->updateOrInsert(
                [
                    'caso_uso' => 'CU13_RegistrarAsistenciaInasistenciaAtencion',
                    'accion' => 'ATENDER_CITA_' . $cita->codigo_cita,
                ],
                [
                    'id_usuario' => $cita->id_medico ? DB::table('usuarios')->join('medicos', 'usuarios.id_persona', '=', 'medicos.id_persona')->where('medicos.id_medico', $cita->id_medico)->value('usuarios.id_usuario') : null,
                    'accion' => 'REGISTRAR_ATENCION',
                    'tabla_afectada' => 'citas',
                    'registro_id' => (string)$cita->id_cita,
                    'datos_anteriores' => json_encode(['id_estado_cita' => $idEstadoConfirmada, 'estado' => 'confirmada']),
                    'datos_nuevos' => json_encode(['id_estado_cita' => $idEstadoAtendida, 'estado' => 'atendida']),
                    'ip_origen' => '192.168.1.41',
                    'user_agent' => $userAgentDemo,
                    'fecha_hora' => $cita->fecha_cita . ' ' . $cita->hora_fin,
                    'updated_at' => now(),
                ]
            );
        }

        // 5. Suspensión de horario y cambios a Postergada
        $suspension = DB::table('suspensiones_horario')->where('motivo', 'Emergencia médica')->first();
        if ($suspension) {
            DB::table('bitacora_auditoria')->updateOrInsert(
                [
                    'caso_uso' => 'CU11_SuspenderHorarioGestionarCitasAfectadas',
                    'accion' => 'REGISTRAR_SUSPENSION_' . $suspension->id_suspension,
                ],
                [
                    'id_usuario' => $usuarios['admin'] ?? null,
                    'accion' => 'REGISTRAR_SUSPENSION',
                    'tabla_afectada' => 'suspensiones_horario',
                    'registro_id' => (string)$suspension->id_suspension,
                    'datos_anteriores' => null,
                    'datos_nuevos' => json_encode(['motivo' => 'Emergencia médica', 'citas_postergadas' => 3]),
                    'ip_origen' => '192.168.1.10',
                    'user_agent' => $userAgentDemo,
                    'fecha_hora' => $hoy->copy()->subHours(6)->toDateTimeString(),
                    'updated_at' => now(),
                ]
            );
        }

        // 6. UNA CORRECCIÓN AUTORIZADA DEL ADMINISTRADOR (Atendida -> Inasistencia)
        // Seleccionamos CM-0018
        $citaCorregir = DB::table('citas')->where('codigo_cita', 'CM-0018')->first();
        if ($citaCorregir) {
            DB::table('citas')->where('id_cita', $citaCorregir->id_cita)->update([
                'id_estado_cita' => $idEstadoInasistencia,
                'observaciones' => 'Corrección por error de registro: paciente no ingresó a consulta médica final.',
                'updated_at' => now(),
            ]);

            DB::table('bitacora_auditoria')->updateOrInsert(
                [
                    'caso_uso' => 'CU14_ConsultarAgendaCitas',
                    'accion' => 'CORRECCION_AUTORIZADA_RN16',
                ],
                [
                    'id_usuario' => $usuarios['admin'] ?? null,
                    'accion' => 'CONMUTAR_ESTADO_CITA',
                    'tabla_afectada' => 'citas',
                    'registro_id' => (string)$citaCorregir->id_cita,
                    'datos_anteriores' => json_encode(['id_estado_cita' => $idEstadoAtendida, 'estado_nombre' => 'atendida']),
                    'datos_nuevos' => json_encode([
                        'id_estado_cita' => $idEstadoInasistencia,
                        'estado_nombre' => 'inasistencia',
                        'motivo' => 'Corrección por error de registro',
                        'codigo_cita' => 'CM-0018',
                    ]),
                    'ip_origen' => '192.168.1.10',
                    'user_agent' => $userAgentDemo,
                    'fecha_hora' => $hoy->copy()->subHours(2)->toDateTimeString(),
                    'updated_at' => now(),
                ]
            );
        }
    }
}
