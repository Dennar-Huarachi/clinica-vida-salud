<?php

namespace App\Paquetes\CatalogosHorarios\CU10_ConsultarDisponibilidad;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\Cita;

class ConsultarDisponibilidadServicio
{
    /**
     * Consulta y calcula los turnos disponibles para un médico en una fecha y especialidad.
     * Aplica RN06 (Fecha no pasada), RN18 (Canal reserva web), RN20 (Bloqueos) y cruce preciso con estados_cita y suspensiones (CU-11).
     */
    public function consultar(int $idMedico, int $idEspecialidad, string $fecha, ?string $rolUsuario = null): array
    {
        // 1. Validación de fecha futura o presente (RN06)
        $hoy = date('Y-m-d');
        if ($fecha < $hoy) {
            throw new \Exception('No se puede consultar disponibilidad en fechas pasadas.', 422);
        }

        // 2. Canal de reserva web (RN18)
        if ($rolUsuario === 'paciente') {
            $especialidad = DB::table('especialidades')->where('id_especialidad', $idEspecialidad)->first();
            if ($especialidad && isset($especialidad->reservable_en_linea) && !$especialidad->reservable_en_linea) {
                throw new \Exception('Esta especialidad solo puede ser agendada presencialmente en ventanilla o recepción (RN18).', 403);
            }
        }

        $carbonFecha = Carbon::parse($fecha);
        // Carbon isoFormat('E') returns 1 for Monday to 7 for Sunday
        $diaSemana = (int)$carbonFecha->dayOfWeekIso;

        // 3. Regla RN20: Verificar bloqueos institucionales de la clínica en esa fecha
        $bloqueoClinica = DB::table('bloqueos_clinica')
            ->where('estado', 'activo')
            ->where(function ($q) use ($idMedico) {
                $q->where('aplica_a_todos', true)
                  ->orWhere('id_medico', $idMedico);
            })
            ->where('fecha_inicio', '<=', $carbonFecha->endOfDay())
            ->where('fecha_fin', '>=', $carbonFecha->startOfDay())
            ->first();

        if ($bloqueoClinica) {
            return [
                'disponible' => false,
                'motivo_bloqueo' => 'La clínica o el profesional presenta un bloqueo programado: ' . $bloqueoClinica->titulo,
                'turnos' => []
            ];
        }

        // 4. Verificar suspensiones del médico (CU-11)
        $suspensiones = DB::table('suspensiones_horario')
            ->where('id_medico', $idMedico)
            ->where('fecha_inicio', '<=', $carbonFecha->endOfDay())
            ->where('fecha_fin', '>=', $carbonFecha->startOfDay())
            ->get();

        // Si existe una suspensión que cubre toda la jornada completa
        $suspensionCompleta = $suspensiones->first(function ($s) use ($carbonFecha) {
            $sIni = Carbon::parse($s->fecha_inicio);
            $sFin = Carbon::parse($s->fecha_fin);
            return $sIni->lte($carbonFecha->copy()->startOfDay()) && $sFin->gte($carbonFecha->copy()->endOfDay());
        });

        if ($suspensionCompleta) {
            return [
                'disponible' => false,
                'motivo_bloqueo' => 'El médico cuenta con una suspensión de actividades para toda la fecha: ' . $suspensionCompleta->motivo,
                'turnos' => []
            ];
        }

        // 5. Obtener horarios de atención configurados para ese día de la semana
        $horarios = DB::table('horarios_atencion')
            ->where('id_medico', $idMedico)
            ->where('id_especialidad', $idEspecialidad)
            ->where('dia_semana', $diaSemana)
            ->where('estado', 'activo')
            ->get();

        if ($horarios->isEmpty()) {
            return [
                'disponible' => false,
                'motivo_bloqueo' => 'El médico no tiene horario de consulta configurado para este día.',
                'turnos' => []
            ];
        }

        // 6. Cruce Preciso con Estados de Cita (estados_cita)
        // Se seleccionan citas que ocupan turno según la regla única centralizada (Cita::ESTADOS_OCUPANTES)
        $citasAgendadasQuery = DB::table('citas')
            ->leftJoin('estados_cita', 'citas.id_estado_cita', '=', 'estados_cita.id_estado_cita')
            ->where('citas.id_medico', $idMedico)
            ->where('citas.fecha_cita', $fecha);

        Cita::aplicarFiltroOcupantes($citasAgendadasQuery, 'citas');

        $citasAgendadas = $citasAgendadasQuery
            ->select('citas.hora_inicio', 'citas.hora_fin', 'citas.codigo_cita', 'citas.es_postergada', 'estados_cita.codigo as estado_codigo', 'estados_cita.nombre as estado_nombre')
            ->get();

        $turnos = [];

        foreach ($horarios as $horario) {
            $inicio = Carbon::parse($fecha . ' ' . $horario->hora_inicio);
            $fin = Carbon::parse($fecha . ' ' . $horario->hora_fin);
            $intervalo = $horario->duracion_intervalo_minutos ?: 15;

            while ($inicio->copy()->addMinutes($intervalo)->lte($fin)) {
                $horaSlot = $inicio->format('H:i');
                $slotFin = $inicio->copy()->addMinutes($intervalo);
                $horaFinSlot = $slotFin->format('H:i');

                // Verificar si este turno puntual cae dentro de alguna suspensión del médico
                $enSuspension = $suspensiones->first(function ($s) use ($inicio, $slotFin) {
                    $sIni = Carbon::parse($s->fecha_inicio);
                    $sFin = Carbon::parse($s->fecha_fin);
                    return $inicio->lt($sFin) && $slotFin->gt($sIni);
                });

                if ($enSuspension) {
                    $turnos[] = [
                        'hora_inicio' => $horaSlot,
                        'hora_fin' => $horaFinSlot,
                        'disponible' => false,
                        'estado_turno' => 'bloqueado',
                        'motivo' => 'Suspensión médica: ' . $enSuspension->motivo,
                    ];
                } else {
                    $ocupado = $citasAgendadas->contains(function ($cita) use ($fecha, $inicio, $slotFin, $horaSlot) {
                        $citaHoraIni = substr(trim($cita->hora_inicio), 0, 5);
                        if (preg_match('/^(\d):(\d{2})$/', $citaHoraIni, $m)) {
                            $citaHoraIni = '0' . $m[1] . ':' . $m[2];
                        }

                        // Coincidencia exacta con la hora de inicio del intervalo
                        if ($citaHoraIni === $horaSlot) {
                            return true;
                        }

                        // Coincidencia por solapamiento de rango [hora_inicio, hora_fin)
                        if (!empty($cita->hora_fin)) {
                            $citaHoraFin = substr(trim($cita->hora_fin), 0, 5);
                            if (preg_match('/^(\d):(\d{2})$/', $citaHoraFin, $m)) {
                                $citaHoraFin = '0' . $m[1] . ':' . $m[2];
                            }

                            $cIni = Carbon::parse($fecha . ' ' . $citaHoraIni);
                            $cFin = Carbon::parse($fecha . ' ' . $citaHoraFin);

                            return $cIni->lt($slotFin) && $cFin->gt($inicio);
                        }

                        return false;
                    });

                    $turnos[] = [
                        'hora_inicio' => $horaSlot,
                        'hora_fin' => $horaFinSlot,
                        'disponible' => !$ocupado,
                        'estado_turno' => $ocupado ? 'ocupado' : 'libre',
                    ];
                }

                $inicio->addMinutes($intervalo);
            }
        }

        return [
            'disponible' => true,
            'motivo_bloqueo' => null,
            'turnos' => $turnos,
        ];
    }
}
