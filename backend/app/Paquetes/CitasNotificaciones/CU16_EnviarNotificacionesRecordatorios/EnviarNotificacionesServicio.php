<?php

namespace App\Paquetes\CitasNotificaciones\CU16_EnviarNotificacionesRecordatorios;

use Illuminate\Support\Facades\DB;
use App\Nucleo\Bitacora\ServicioBitacora;

class EnviarNotificacionesServicio
{
    /**
     * Emite una notificación interna en el sistema para un usuario específico.
     */
    public function crearNotificacion(int $idUsuario, string $tipo, string $titulo, string $mensaje, ?array $metadata = null): int
    {
        return DB::table('notificaciones')->insertGetId([
            'id_usuario' => $idUsuario,
            'tipo' => $tipo,
            'titulo' => $titulo,
            'mensaje' => $mensaje,
            'leido' => false,
            'fecha_leido' => null,
            'metadata' => $metadata ? json_encode($metadata) : null,
            'created_at' => now(),
            'updated_at' => now(),
        ], 'id_notificacion');
    }

    /**
     * Lista las notificaciones del usuario autenticado en orden cronológico descendente.
     */
    public function listarPorUsuario(int $idUsuario, bool $soloNoLeidas = false, int $limite = 40): array
    {
        $query = DB::table('notificaciones')
            ->where('id_usuario', $idUsuario)
            ->orderBy('id_notificacion', 'desc')
            ->limit($limite);

        if ($soloNoLeidas) {
            $query->where('leido', false);
        }

        return $query->get()->toArray();
    }

    /**
     * Retorna el conteo de notificaciones no leídas de un usuario.
     */
    public function contarNoLeidas(int $idUsuario): int
    {
        return DB::table('notificaciones')
            ->where('id_usuario', $idUsuario)
            ->where('leido', false)
            ->count();
    }

    /**
     * Marca una notificación específica como leída.
     */
    public function marcarLeida(int $idNotificacion, int $idUsuario): void
    {
        DB::table('notificaciones')
            ->where('id_notificacion', $idNotificacion)
            ->where('id_usuario', $idUsuario)
            ->update([
                'leido' => true,
                'fecha_leido' => now(),
                'updated_at' => now(),
            ]);
    }

    /**
     * Marca todas las notificaciones pendientes del usuario como leídas en lote.
     */
    public function marcarTodasLeidas(int $idUsuario): int
    {
        return DB::table('notificaciones')
            ->where('id_usuario', $idUsuario)
            ->where('leido', false)
            ->update([
                'leido' => true,
                'fecha_leido' => now(),
                'updated_at' => now(),
            ]);
    }

    /**
     * Genera y emite automáticamente recordatorios de citas médicas para el día siguiente.
     */
    public function enviarRecordatoriosProximos(): int
    {
        $manana = date('Y-m-d', strtotime('+1 day'));

        $citasManana = DB::table('citas')
            ->join('pacientes', 'citas.id_paciente', '=', 'pacientes.id_paciente')
            ->join('usuarios', 'pacientes.id_persona', '=', 'usuarios.id_persona')
            ->join('medicos', 'citas.id_medico', '=', 'medicos.id_medico')
            ->join('personas as p_medico', 'medicos.id_persona', '=', 'p_medico.id_persona')
            ->where('citas.fecha_cita', $manana)
            ->where('citas.estado', '!=', 'cancelada')
            ->whereNotIn('citas.id_estado_cita', [4, 5, 6]) // no atendida, cancelada o inasistencia
            ->select(
                'citas.*',
                'usuarios.id_usuario',
                'p_medico.nombres as medico_nombres',
                'p_medico.apellidos as medico_apellidos'
            )
            ->get();

        $enviados = 0;
        foreach ($citasManana as $cita) {
            // Verificar si ya se emitió recordatorio para esta cita
            $yaEnviado = DB::table('notificaciones')
                ->where('id_usuario', $cita->id_usuario)
                ->where('tipo', 'recordatorio_cita')
                ->whereRaw("(metadata->>'id_cita')::int = ?", [$cita->id_cita])
                ->exists();

            if (!$yaEnviado) {
                $nombreMedico = "Dr(a). {$cita->medico_nombres} {$cita->medico_apellidos}";
                $horaFormateada = substr($cita->hora_inicio, 0, 5);

                $this->crearNotificacion(
                    $cita->id_usuario,
                    'recordatorio_cita',
                    'Recordatorio de Cita Médica para Mañana',
                    "Le recordamos que tiene una cita médica programada para mañana {$cita->fecha_cita} a las {$horaFormateada} con {$nombreMedico}. Código: {$cita->codigo_cita}.",
                    [
                        'id_cita' => $cita->id_cita,
                        'codigo_cita' => $cita->codigo_cita,
                        'fecha_cita' => $cita->fecha_cita,
                        'hora_inicio' => $horaFormateada
                    ]
                );

                $enviados++;
            }
        }

        ServicioBitacora::registrar(
            'CU16_EnviarNotificacionesRecordatorios',
            'ENVIAR_RECORDATORIOS_CITAS',
            'notificaciones',
            null,
            null,
            ['enviados' => $enviados, 'fecha_objetivo' => $manana]
        );

        return $enviados;
    }
}
