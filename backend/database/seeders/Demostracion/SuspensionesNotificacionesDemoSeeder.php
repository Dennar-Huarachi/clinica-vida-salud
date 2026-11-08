<?php

namespace Database\Seeders\Demostracion;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SuspensionesNotificacionesDemoSeeder extends Seeder
{
    public function run(): void
    {
        $hoy = Carbon::today('America/La_Paz');
        $proximoLunes = $hoy->copy()->next(Carbon::MONDAY);
        $proxMar = $proximoLunes->copy()->next(Carbon::TUESDAY);

        // Médico con suspensión: Dra. Beatriz Torres (MED-BOL-10453)
        $medicoTorres = DB::table('medicos')->where('nro_matricula', 'MED-BOL-10453')->first();
        if (!$medicoTorres) {
            throw new \RuntimeException("Médico Dra. Beatriz Torres (MED-BOL-10453) no encontrado para registrar suspensión.");
        }

        $idAdmin = DB::table('usuarios')->where('nombre_usuario', 'admin')->value('id_usuario');
        $idRecepcion = DB::table('usuarios')->where('nombre_usuario', 'recepcion1')->value('id_usuario');
        $idOperador = $idRecepcion ?? $idAdmin;

        if (!$idOperador) {
            throw new \RuntimeException("No se encontró usuario de administración o recepción para autorizar la suspensión.");
        }

        // Obtener dinámicamente el ID del estado 'postergada'
        $idEstadoPostergada = DB::table('estados_cita')
            ->where('codigo', 'postergada')
            ->orWhere('nombre', 'like', 'Postergada%')
            ->value('id_estado_cita');

        if (!$idEstadoPostergada) {
            throw new \RuntimeException("Estado de cita 'postergada' no encontrado en estados_cita.");
        }

        // 1. Registro idempotente en suspensiones_horario
        $suspension = DB::table('suspensiones_horario')
            ->where('id_medico', $medicoTorres->id_medico)
            ->whereDate('fecha_inicio', $proxMar->toDateString())
            ->first();

        $inicioSusp = $proxMar->copy()->startOfDay()->toDateTimeString();
        $finSusp = $proxMar->copy()->endOfDay()->toDateTimeString();

        if ($suspension) {
            DB::table('suspensiones_horario')->where('id_suspension', $suspension->id_suspension)->update([
                'motivo' => 'Emergencia médica',
                'estado_citas_accion' => 'reprogramacion_pendiente',
                'updated_at' => now(),
            ]);
            $idSuspension = (int)$suspension->id_suspension;
        } else {
            $idSuspension = (int)DB::table('suspensiones_horario')->insertGetId([
                'id_medico' => $medicoTorres->id_medico,
                'fecha_inicio' => $inicioSusp,
                'fecha_fin' => $finSusp,
                'motivo' => 'Emergencia médica',
                'estado_citas_accion' => 'reprogramacion_pendiente',
                'created_at' => now(),
                'updated_at' => now(),
            ], 'id_suspension');
        }

        // 2. Conmutar las 3 citas de ese día a Postergada dinámicamente
        $citasAfectadas = ['CM-0032', 'CM-0033', 'CM-0034'];
        foreach ($citasAfectadas as $cod) {
            DB::table('citas')->where('codigo_cita', $cod)->update([
                'id_estado_cita' => $idEstadoPostergada,
                'es_postergada' => true,
                'observaciones' => 'Postergada por suspensión de horario médica: Emergencia médica (ID Suspensión #' . $idSuspension . ').',
                'updated_at' => now(),
            ]);
        }

        // 3. Notificaciones automáticas
        // a) 3 Notificaciones para las citas postergadas
        foreach ($citasAfectadas as $cod) {
            $cita = DB::table('citas')->where('codigo_cita', $cod)->first();
            if (!$cita) continue;

            $paciente = DB::table('pacientes')->where('id_paciente', $cita->id_paciente)->first();
            $usuarioPac = $paciente ? DB::table('usuarios')->where('id_persona', $paciente->id_persona)->first() : null;
            $idDestinatario = $usuarioPac ? $usuarioPac->id_usuario : $idOperador;

            DB::table('notificaciones')->updateOrInsert(
                [
                    'tipo' => 'suspension_horario',
                    'titulo' => 'Aviso: Turno Postergado ' . $cod,
                ],
                [
                    'id_usuario' => $idDestinatario,
                    'mensaje' => 'Estimado paciente, su cita ' . $cod . ' con la Dra. Beatriz Torres programada para el ' . $proxMar->toDateString() . ' ha sido postergada por motivo de Emergencia médica. Sus derechos de prioridad para reubicar su turno están habilitados.',
                    'leido' => false,
                    'metadata' => json_encode(['id_cita' => $cita->id_cita, 'id_suspension' => $idSuspension]),
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }

        // b) Notificación de cita cancelada por el personal (CM-0047)
        $citaCanceladaPersonal = DB::table('citas')->where('codigo_cita', 'CM-0047')->first();
        if ($citaCanceladaPersonal) {
            $paciente = DB::table('pacientes')->where('id_paciente', $citaCanceladaPersonal->id_paciente)->first();
            $usuarioPac = $paciente ? DB::table('usuarios')->where('id_persona', $paciente->id_persona)->first() : null;
            $idDestinatario = $usuarioPac ? $usuarioPac->id_usuario : $idOperador;

            DB::table('notificaciones')->updateOrInsert(
                [
                    'tipo' => 'cancelacion_cita',
                    'titulo' => 'Cancelación de Turno por Personal CM-0047',
                ],
                [
                    'id_usuario' => $idDestinatario,
                    'mensaje' => 'La cita CM-0047 fue cancelada por la administración médica debido a fuerza mayor. El reembolso de su garantía ha sido tramitado.',
                    'leido' => false,
                    'metadata' => json_encode(['id_cita' => $citaCanceladaPersonal->id_cita]),
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }

        // c) 3 Recordatorios de citas próximas confirmadas (CM-0027, CM-0029, CM-0030)
        $citasRecordatorios = [
            'CM-0027' => 'Recordatorio: Mañana tiene cita de Medicina General a las 08:00.',
            'CM-0029' => 'Recordatorio: Su consulta de Ginecología está confirmada a las 08:30.',
            'CM-0030' => 'Recordatorio: Cita de Pediatría programada para las 14:00.',
        ];

        foreach ($citasRecordatorios as $cod => $mensajeRecordatorio) {
            $cita = DB::table('citas')->where('codigo_cita', $cod)->first();
            if (!$cita) continue;

            $paciente = DB::table('pacientes')->where('id_paciente', $cita->id_paciente)->first();
            $usuarioPac = $paciente ? DB::table('usuarios')->where('id_persona', $paciente->id_persona)->first() : null;
            $idDestinatario = $usuarioPac ? $usuarioPac->id_usuario : $idOperador;

            DB::table('notificaciones')->updateOrInsert(
                [
                    'tipo' => 'recordatorio_cita',
                    'titulo' => 'Recordatorio Cita Próxima ' . $cod,
                ],
                [
                    'id_usuario' => $idDestinatario,
                    'mensaje' => $mensajeRecordatorio,
                    'leido' => false,
                    'metadata' => json_encode(['id_cita' => $cita->id_cita]),
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }
}
