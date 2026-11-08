<?php

namespace App\Paquetes\CatalogosHorarios\CU11_SuspenderHorarioGestionarCitasAfectadas;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\Cita;
use App\Nucleo\Bitacora\ServicioBitacora;
use App\Paquetes\CitasNotificaciones\CU16_EnviarNotificacionesRecordatorios\EnviarNotificacionesServicio;

class SuspenderHorarioServicio
{
    public function __construct(
        protected EnviarNotificacionesServicio $notificacionesServicio
    ) {}

    /**
     * Registra una suspensión de horario médico, identifica las citas en conflicto,
     * las marca como postergadas con ventana de prioridad de 48h (RN17) y notifica a los pacientes.
     */
    public function suspender(array $datos, ?int $idUsuarioOperador = null): array
    {
        return DB::transaction(function () use ($datos, $idUsuarioOperador) {
            // Normalizar fechas y horas de inicio y fin
            $strInicio = $datos['fecha_inicio'];
            if (strlen(trim($strInicio)) <= 10) {
                $strInicio = trim($strInicio) . ' 00:00:00';
            }
            $strFin = $datos['fecha_fin'];
            if (strlen(trim($strFin)) <= 10) {
                $strFin = trim($strFin) . ' 23:59:59';
            }

            $inicioSuspension = Carbon::parse($strInicio);
            $finSuspension = Carbon::parse($strFin);

            if ($finSuspension->lt($inicioSuspension)) {
                throw new \Exception('La fecha/hora de finalización no puede ser anterior a la de inicio.', 422);
            }

            // 1. Registrar la suspensión en la tabla física
            $idSuspension = DB::table('suspensiones_horario')->insertGetId([
                'id_medico' => $datos['id_medico'],
                'fecha_inicio' => $inicioSuspension,
                'fecha_fin' => $finSuspension,
                'motivo' => $datos['motivo'],
                'estado_citas_accion' => $datos['accion_citas'] ?? 'reprogramacion_pendiente',
                'created_at' => now(),
                'updated_at' => now(),
            ], 'id_suspension');

            // 2. Obtener el ID del estado 'postergada' (9) en estados_cita
            $estadoPostergada = DB::table('estados_cita')->where('codigo', 'postergada')->first();
            $idEstadoPostergada = $estadoPostergada ? (int)$estadoPostergada->id_estado_cita : 9;

            // 3. Buscar citas candidatas del médico en ese rango de fechas
            $fechaInicioStr = $inicioSuspension->toDateString();
            $fechaFinStr = $finSuspension->toDateString();

            $candidatas = DB::table('citas')
                ->join('pacientes', 'citas.id_paciente', '=', 'pacientes.id_paciente')
                ->join('personas as p_paciente', 'pacientes.id_persona', '=', 'p_paciente.id_persona')
                ->where('citas.id_medico', $datos['id_medico'])
                ->whereBetween('citas.fecha_cita', [$fechaInicioStr, $fechaFinStr])
                ->where('citas.estado', '!=', 'cancelada')
                ->whereNotIn('citas.id_estado_cita', [5, 6, 7]) // Excluir atendidas (5), canceladas (6) o inasistencias (7)
                ->select(
                    'citas.*',
                    'p_paciente.nombres as paciente_nombres',
                    'p_paciente.apellidos as paciente_apellidos',
                    'p_paciente.ci as paciente_ci',
                    'p_paciente.telefono as paciente_telefono',
                    'pacientes.id_persona as id_persona_paciente'
                )
                ->get();

            $citasAfectadas = [];
            $expiracionReserva = now()->addHours(48); // Ventana de prioridad de 48 horas (RN17)

            foreach ($candidatas as $cita) {
                $inicioCita = Carbon::parse($cita->fecha_cita . ' ' . $cita->hora_inicio);
                $finCita = Carbon::parse($cita->fecha_cita . ' ' . $cita->hora_fin);

                // Evaluación precisa de solapamiento temporal
                if ($inicioCita->lt($finSuspension) && $finCita->gt($inicioSuspension)) {
                    // Actualizar cita a estado postergada
                    DB::table('citas')->where('id_cita', $cita->id_cita)->update([
                        'id_estado_cita' => $idEstadoPostergada,
                        'estado' => 'activo',
                        'es_postergada' => true,
                        'fecha_expiracion_reserva' => $expiracionReserva,
                        'observaciones' => trim(($cita->observaciones ?? '') . " [Afectada por suspensión: {$datos['motivo']}]"),
                        'updated_at' => now(),
                    ]);

                    // Determinar si el paciente tiene cuenta de usuario para notificación en línea
                    $usuarioPaciente = DB::table('usuarios')
                        ->where('id_persona', $cita->id_persona_paciente)
                        ->where('estado', 'activo')
                        ->select('id_usuario')
                        ->first();

                    $notificado = false;
                    if ($usuarioPaciente) {
                        $this->notificacionesServicio->crearNotificacion(
                            $usuarioPaciente->id_usuario,
                            'suspension_horario',
                            'Aviso Urgente: Cita Médica Postergada',
                            "Su cita médica con código {$cita->codigo_cita} programada para el {$cita->fecha_cita} a las " . substr($cita->hora_inicio, 0, 5) . " ha sido postergada por contingencia del médico: {$datos['motivo']}. Dispone de 48 horas de prioridad para su reubicación.",
                            [
                                'id_cita' => $cita->id_cita,
                                'id_suspension' => $idSuspension,
                                'codigo_cita' => $cita->codigo_cita,
                                'fecha_original' => $cita->fecha_cita,
                                'hora_original' => $cita->hora_inicio,
                                'motivo' => $datos['motivo']
                            ]
                        );
                        $notificado = true;
                    }

                    $citasAfectadas[] = [
                        'id_cita' => $cita->id_cita,
                        'codigo_cita' => $cita->codigo_cita,
                        'paciente' => trim("{$cita->paciente_nombres} {$cita->paciente_apellidos}"),
                        'ci' => $cita->paciente_ci,
                        'telefono' => $cita->paciente_telefono,
                        'fecha_cita' => $cita->fecha_cita,
                        'hora_inicio' => substr($cita->hora_inicio, 0, 5),
                        'hora_fin' => substr($cita->hora_fin, 0, 5),
                        'notificado_web' => $notificado,
                    ];
                }
            }

            $totalAfectadas = count($citasAfectadas);

            // Trazabilidad inmutable en bitácora
            ServicioBitacora::registrar(
                'CU11_SuspenderHorarioGestionarCitasAfectadas',
                'SUSPENDER_HORARIO_MEDICO',
                'suspensiones_horario',
                (string)$idSuspension,
                null,
                [
                    'id_medico' => $datos['id_medico'],
                    'fecha_inicio' => $inicioSuspension->toDateTimeString(),
                    'fecha_fin' => $finSuspension->toDateTimeString(),
                    'motivo' => $datos['motivo'],
                    'citas_afectadas' => $totalAfectadas,
                ],
                $idUsuarioOperador
            );

            return [
                'id_suspension' => $idSuspension,
                'total_afectadas' => $totalAfectadas,
                'citas_afectadas' => $citasAfectadas,
                'mensaje' => $totalAfectadas > 0
                    ? "Suspensión registrada. {$totalAfectadas} cita(s) fueron cambiadas a estado postergada con 48h de prioridad de reubicación y notificación emitida."
                    : "Suspensión registrada con éxito. No se detectaron citas agendadas en el rango indicado."
            ];
        });
    }

    /**
     * Reubica una cita postergada a un nuevo turno libre y notifica al paciente.
     */
    public function reubicarCita(array $datos, ?int $idUsuarioOperador = null): array
    {
        try {
            return DB::transaction(function () use ($datos, $idUsuarioOperador) {
            // 1. Bloqueo pesimista sobre la cita a reubicar
            $cita = DB::table('citas')
                ->where('id_cita', $datos['id_cita'])
                ->lockForUpdate()
                ->first();

            if (!$cita) {
                throw new \Exception('La cita médica indicada no existe.', 404);
            }

            $estadoPostergada = DB::table('estados_cita')->where('codigo', 'postergada')->value('id_estado_cita') ?: 9;
            if (!$cita->es_postergada && (int)$cita->id_estado_cita !== (int)$estadoPostergada) {
                throw new \Exception('La cita no se encuentra en estado postergada para reubicación.', 422);
            }

            $idMedico = !empty($datos['nuevo_id_medico']) ? (int)$datos['nuevo_id_medico'] : (int)$cita->id_medico;
            $nuevaFecha = $datos['nueva_fecha'];
            $nuevaHoraInicio = substr($datos['nueva_hora_inicio'], 0, 5);
            $nuevaHoraFin = substr($datos['nueva_hora_fin'], 0, 5);

            // Validar que la fecha sea presente o futura (RN06)
            if ($nuevaFecha < date('Y-m-d')) {
                throw new \Exception('No se puede reubicar una cita a una fecha pasada.', 422);
            }

            $carbonInicioTurno = Carbon::parse($nuevaFecha . ' ' . $nuevaHoraInicio);
            $carbonFinTurno = Carbon::parse($nuevaFecha . ' ' . $nuevaHoraFin);

            // 2. Verificar bloqueos de clínica (RN20)
            $bloqueoClinica = DB::table('bloqueos_clinica')
                ->where('estado', 'activo')
                ->where(function ($q) use ($idMedico) {
                    $q->where('aplica_a_todos', true)->orWhere('id_medico', $idMedico);
                })
                ->where('fecha_inicio', '<=', $carbonFinTurno)
                ->where('fecha_fin', '>=', $carbonInicioTurno)
                ->first();

            if ($bloqueoClinica) {
                throw new \Exception('El turno seleccionado coincide con un bloqueo institucional: ' . $bloqueoClinica->titulo, 422);
            }

            // 3. Verificar que el médico no tenga suspensión en ese nuevo turno
            $suspension = DB::table('suspensiones_horario')
                ->where('id_medico', $idMedico)
                ->where('fecha_inicio', '<=', $carbonFinTurno)
                ->where('fecha_fin', '>=', $carbonInicioTurno)
                ->first();

            if ($suspension) {
                throw new \Exception('El médico cuenta con una suspensión activa en el turno seleccionado: ' . $suspension->motivo, 422);
            }

            // 4. Control de concurrencia: Bloqueo pesimista del registro del médico para serializar
            // operaciones simultáneas y verificación unificada de solapamiento
            DB::table('medicos')
                ->where('id_medico', $idMedico)
                ->lockForUpdate()
                ->first();

            $solapamiento = Cita::querySolapamiento(
                $idMedico,
                $nuevaFecha,
                $nuevaHoraInicio,
                $nuevaHoraFin,
                $cita->id_cita
            )->lockForUpdate()->exists();

            if ($solapamiento) {
                throw new \Exception('El turno seleccionado ya se encuentra ocupado por otra cita agendada.', 409);
            }

            // 5. Estado destino: Confirmada (id=3 en catálogo)
            $estadoConfirmada = DB::table('estados_cita')->where('codigo', 'confirmada')->first();
            $idEstadoConfirmada = $estadoConfirmada ? $estadoConfirmada->id_estado_cita : 3;

            $notaReubicacion = " [Reubicada el " . now()->format('Y-m-d H:i') . ": turno anterior {$cita->fecha_cita} " . substr($cita->hora_inicio, 0, 5) . "]";
            if (!empty($datos['motivo_reubicacion'])) {
                $notaReubicacion .= " (Motivo: {$datos['motivo_reubicacion']})";
            }

            DB::table('citas')->where('id_cita', $cita->id_cita)->update([
                'id_medico' => $idMedico,
                'fecha_cita' => $nuevaFecha,
                'hora_inicio' => $nuevaHoraInicio,
                'hora_fin' => $nuevaHoraFin,
                'id_estado_cita' => $idEstadoConfirmada,
                'estado' => 'activo',
                'es_postergada' => false,
                'fecha_expiracion_reserva' => null,
                'observaciones' => trim(($cita->observaciones ?? '') . $notaReubicacion),
                'updated_at' => now(),
            ]);

            // Obtener nombre del médico para el aviso
            $medicoPersona = DB::table('medicos')
                ->join('personas', 'medicos.id_persona', '=', 'personas.id_persona')
                ->where('medicos.id_medico', $idMedico)
                ->select('personas.nombres', 'personas.apellidos')
                ->first();
            $nombreMedico = $medicoPersona ? "Dr(a). {$medicoPersona->nombres} {$medicoPersona->apellidos}" : "su profesional asignado";

            // 6. Notificar al paciente (CU-16)
            $usuarioPaciente = DB::table('pacientes')
                ->join('usuarios', 'pacientes.id_persona', '=', 'usuarios.id_persona')
                ->where('pacientes.id_paciente', $cita->id_paciente)
                ->where('usuarios.estado', 'activo')
                ->select('usuarios.id_usuario')
                ->first();

            if ($usuarioPaciente) {
                $this->notificacionesServicio->crearNotificacion(
                    $usuarioPaciente->id_usuario,
                    'reubicacion_cita',
                    'Cita Médica Reubicada con Éxito',
                    "Su cita médica con código {$cita->codigo_cita} ha sido reubicada para el {$nuevaFecha} a las {$nuevaHoraInicio} con {$nombreMedico}.",
                    [
                        'id_cita' => $cita->id_cita,
                        'codigo_cita' => $cita->codigo_cita,
                        'fecha_anterior' => $cita->fecha_cita,
                        'hora_anterior' => substr($cita->hora_inicio, 0, 5),
                        'nueva_fecha' => $nuevaFecha,
                        'nueva_hora' => $nuevaHoraInicio,
                        'medico' => $nombreMedico,
                    ]
                );
            }

            // 7. Registro de auditoría
            ServicioBitacora::registrar(
                'CU11_SuspenderHorarioGestionarCitasAfectadas',
                'REUBICAR_CITA_POSTERGADA',
                'citas',
                (string)$cita->id_cita,
                [
                    'fecha_anterior' => $cita->fecha_cita,
                    'hora_anterior' => $cita->hora_inicio,
                    'estado_anterior' => 'postergada'
                ],
                [
                    'nueva_fecha' => $nuevaFecha,
                    'nueva_hora' => $nuevaHoraInicio,
                    'id_medico' => $idMedico,
                    'estado_nuevo' => 'confirmada'
                ],
                $idUsuarioOperador
            );

            return [
                'id_cita' => $cita->id_cita,
                'codigo_cita' => $cita->codigo_cita,
                'mensaje' => "Cita {$cita->codigo_cita} reubicada exitosamente para el {$nuevaFecha} a las {$nuevaHoraInicio}."
            ];
        });
    } catch (\Illuminate\Database\UniqueConstraintViolationException | \Illuminate\Database\QueryException $e) {
        $esConflicto = ($e->getCode() === '23505') || str_contains($e->getMessage(), 'uq_citas_turno_activo');
        if ($esConflicto) {
            throw new \Exception('El turno seleccionado ya se encuentra ocupado por otra cita agendada.', 409);
        }
        throw $e;
    }
}

    /**
     * Lista todas las citas médicas actualmente en estado postergada pendientes de reubicación.
     */
    public function listarCitasPostergadas(): array
    {
        return DB::table('citas')
            ->join('pacientes', 'citas.id_paciente', '=', 'pacientes.id_paciente')
            ->join('personas as p_paciente', 'pacientes.id_persona', '=', 'p_paciente.id_persona')
            ->join('medicos', 'citas.id_medico', '=', 'medicos.id_medico')
            ->join('personas as p_medico', 'medicos.id_persona', '=', 'p_medico.id_persona')
            ->join('especialidades', 'citas.id_especialidad', '=', 'especialidades.id_especialidad')
            ->leftJoin('usuarios', 'pacientes.id_persona', '=', 'usuarios.id_persona')
            ->where(function ($q) {
                $estadoPostergada = DB::table('estados_cita')->where('codigo', 'postergada')->value('id_estado_cita') ?: 9;
                $q->where('citas.id_estado_cita', $estadoPostergada)
                  ->orWhere('citas.es_postergada', true);
            })
            ->where('citas.estado', '!=', 'cancelada')
            ->select(
                'citas.id_cita',
                'citas.codigo_cita',
                'citas.fecha_cita',
                'citas.hora_inicio',
                'citas.hora_fin',
                'citas.motivo_consulta',
                'citas.observaciones',
                'citas.es_postergada',
                'citas.fecha_expiracion_reserva',
                'citas.id_especialidad',
                'citas.id_medico',
                'p_paciente.ci as paciente_ci',
                'p_paciente.nombres as paciente_nombres',
                'p_paciente.apellidos as paciente_apellidos',
                'p_paciente.telefono as paciente_telefono',
                'p_paciente.correo as paciente_correo',
                'p_medico.nombres as medico_nombres',
                'p_medico.apellidos as medico_apellidos',
                'especialidades.nombre as especialidad_nombre',
                'usuarios.id_usuario as tiene_cuenta_usuario'
            )
            ->orderBy('citas.fecha_cita', 'asc')
            ->orderBy('citas.hora_inicio', 'asc')
            ->get()
            ->map(function ($item) {
                $item->hora_inicio = substr($item->hora_inicio, 0, 5);
                $item->hora_fin = substr($item->hora_fin, 0, 5);
                $item->paciente_nombre_completo = trim("{$item->paciente_nombres} {$item->paciente_apellidos}");
                $item->medico_nombre_completo = trim("{$item->medico_nombres} {$item->medico_apellidos}");
                $item->tiene_cuenta = !empty($item->tiene_cuenta_usuario);
                return $item;
            })
            ->toArray();
    }

    /**
     * Lista todas las suspensiones registradas con los datos del médico y cantidad de citas afectadas.
     */
    public function listarSuspensiones(?int $idMedico = null): array
    {
        $query = DB::table('suspensiones_horario')
            ->join('medicos', 'suspensiones_horario.id_medico', '=', 'medicos.id_medico')
            ->join('personas', 'medicos.id_persona', '=', 'personas.id_persona')
            ->select(
                'suspensiones_horario.*',
                'personas.nombres as medico_nombres',
                'personas.apellidos as medico_apellidos',
                'personas.ci as medico_ci'
            )
            ->orderBy('suspensiones_horario.id_suspension', 'desc');

        if ($idMedico) {
            $query->where('suspensiones_horario.id_medico', $idMedico);
        }

        return $query->get()->map(function ($item) {
            $item->medico_nombre_completo = trim("{$item->medico_nombres} {$item->medico_apellidos}");
            return $item;
        })->toArray();
    }

    /**
     * Levanta o anula una suspensión de horario médica.
     */
    public function levantarSuspension(int $idSuspension, ?int $idUsuarioOperador = null): array
    {
        $suspension = DB::table('suspensiones_horario')->where('id_suspension', $idSuspension)->first();
        if (!$suspension) {
            throw new \Exception('La suspensión no existe.', 404);
        }

        DB::table('suspensiones_horario')->where('id_suspension', $idSuspension)->delete();

        ServicioBitacora::registrar(
            'CU11_SuspenderHorarioGestionarCitasAfectadas',
            'LEVANTAR_SUSPENSION_HORARIO',
            'suspensiones_horario',
            (string)$idSuspension,
            ['id_medico' => $suspension->id_medico, 'motivo' => $suspension->motivo],
            null,
            $idUsuarioOperador
        );

        return ['mensaje' => 'Suspensión levantada. El horario del médico vuelve a estar habilitado para agendamiento.'];
    }
}
