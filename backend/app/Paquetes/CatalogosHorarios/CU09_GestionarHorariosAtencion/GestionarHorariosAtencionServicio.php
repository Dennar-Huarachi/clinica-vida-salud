<?php

namespace App\Paquetes\CatalogosHorarios\CU09_GestionarHorariosAtencion;

use Illuminate\Support\Facades\DB;
use App\Models\Cita;
use App\Nucleo\Bitacora\ServicioBitacora;

class GestionarHorariosAtencionServicio
{
    public function listar(?int $idMedico = null, ?int $idEspecialidad = null): array
    {
        $query = DB::table('horarios_atencion')
            ->join('medicos', 'horarios_atencion.id_medico', '=', 'medicos.id_medico')
            ->join('personas', 'medicos.id_persona', '=', 'personas.id_persona')
            ->join('especialidades', 'horarios_atencion.id_especialidad', '=', 'especialidades.id_especialidad')
            ->select(
                'horarios_atencion.*',
                'personas.nombres as medico_nombres',
                'personas.apellidos as medico_apellidos',
                'especialidades.nombre as especialidad_nombre',
                'especialidades.duracion_turno_minutos as especialidad_duracion_default'
            )
            ->orderBy('horarios_atencion.dia_semana')
            ->orderBy('horarios_atencion.hora_inicio');

        if ($idMedico) {
            $query->where('horarios_atencion.id_medico', $idMedico);
        }

        if ($idEspecialidad) {
            $query->where('horarios_atencion.id_especialidad', $idEspecialidad);
        }

        return $query->get()->toArray();
    }

    /**
     * Prevención de Solapamientos Global por Médico (RN05 / RN07).
     * Valida que no exista colisión temporal para el médico en el mismo día,
     * SIN importar la especialidad (un médico no puede estar en dos lugares/especialidades a la vez).
     */
    protected function validarSolapamiento(int $idMedico, int $diaSemana, string $horaInicio, string $horaFin, ?int $idHorarioExcluir = null): void
    {
        $query = DB::table('horarios_atencion')
            ->join('especialidades', 'horarios_atencion.id_especialidad', '=', 'especialidades.id_especialidad')
            ->where('horarios_atencion.id_medico', $idMedico)
            ->where('horarios_atencion.dia_semana', $diaSemana)
            ->where('horarios_atencion.estado', 'activo')
            ->where(function ($q) use ($horaInicio, $horaFin) {
                $q->where('horarios_atencion.hora_inicio', '<', $horaFin)
                  ->where('horarios_atencion.hora_fin', '>', $horaInicio);
            })
            ->select('horarios_atencion.*', 'especialidades.nombre as especialidad_nombre');

        if ($idHorarioExcluir) {
            $query->where('horarios_atencion.id_horario', '!=', $idHorarioExcluir);
        }

        $colision = $query->first();
        if ($colision) {
            $inicioCol = substr($colision->hora_inicio, 0, 5);
            $finCol = substr($colision->hora_fin, 0, 5);
            $espCol = $colision->especialidad_nombre ?? 'Especialidad';
            $diasNombre = [1 => 'Lunes', 2 => 'Martes', 3 => 'Miércoles', 4 => 'Jueves', 5 => 'Viernes', 6 => 'Sábado', 7 => 'Domingo'];
            $diaTexto = $diasNombre[$diaSemana] ?? "día {$diaSemana}";
            throw new \Exception(
                "El médico ya tiene un bloque horario configurado el {$diaTexto} ({$inicioCol} - {$finCol}) en {$espCol} que colisiona con el rango solicitado.",
                422
            );
        }
    }

    /**
     * Registro individual o en bloque multi-día (RN05).
     */
    public function crear(array $datos): int|array
    {
        $dias = [];
        if (!empty($datos['dias_semana']) && is_array($datos['dias_semana'])) {
            $dias = array_values(array_unique(array_map('intval', $datos['dias_semana'])));
        } elseif (!empty($datos['dia_semana'])) {
            $dias = [(int)$datos['dia_semana']];
        }

        if (empty($dias)) {
            throw new \Exception('Debe seleccionar al menos un día de atención semanal', 422);
        }

        $estado = $datos['estado'] ?? 'activo';

        return DB::transaction(function () use ($datos, $dias, $estado) {
            $ids = [];
            foreach ($dias as $dia) {
                if ($estado === 'activo') {
                    $this->validarSolapamiento(
                        $datos['id_medico'],
                        $dia,
                        $datos['hora_inicio'],
                        $datos['hora_fin']
                    );
                }

                $id = DB::table('horarios_atencion')->insertGetId([
                    'id_medico' => $datos['id_medico'],
                    'id_especialidad' => $datos['id_especialidad'],
                    'dia_semana' => $dia,
                    'hora_inicio' => $datos['hora_inicio'],
                    'hora_fin' => $datos['hora_fin'],
                    'duracion_intervalo_minutos' => $datos['duracion_intervalo_minutos'] ?? 15,
                    'estado' => $estado,
                    'created_at' => now(),
                    'updated_at' => now(),
                ], 'id_horario');

                $ids[] = $id;

                ServicioBitacora::registrar(
                    'CU09_GestionarHorariosAtencion',
                    'CREAR_HORARIO_ATENCION',
                    'horarios_atencion',
                    (string)$id,
                    null,
                    array_merge($datos, ['dia_semana' => $dia])
                );
            }

            return count($ids) === 1 ? $ids[0] : $ids;
        });
    }

    public function actualizar(int $id, array $datos): void
    {
        $horario = DB::table('horarios_atencion')->where('id_horario', $id)->first();
        if (!$horario) {
            throw new \Exception('Horario no encontrado', 404);
        }

        $dia = !empty($datos['dia_semana']) 
            ? (int)$datos['dia_semana'] 
            : (!empty($datos['dias_semana'][0]) ? (int)$datos['dias_semana'][0] : (int)$horario->dia_semana);

        $estado = $datos['estado'] ?? $horario->estado;

        if ($estado === 'activo') {
            $this->validarSolapamiento(
                $datos['id_medico'],
                $dia,
                $datos['hora_inicio'],
                $datos['hora_fin'],
                $id
            );
        }

        DB::table('horarios_atencion')->where('id_horario', $id)->update([
            'id_medico' => $datos['id_medico'],
            'id_especialidad' => $datos['id_especialidad'],
            'dia_semana' => $dia,
            'hora_inicio' => $datos['hora_inicio'],
            'hora_fin' => $datos['hora_fin'],
            'duracion_intervalo_minutos' => $datos['duracion_intervalo_minutos'] ?? 15,
            'estado' => $estado,
            'updated_at' => now(),
        ]);

        ServicioBitacora::registrar(
            'CU09_GestionarHorariosAtencion',
            'ACTUALIZAR_HORARIO_ATENCION',
            'horarios_atencion',
            (string)$id,
            (array)$horario,
            array_merge($datos, ['dia_semana' => $dia])
        );
    }

    /**
     * Alternar estado lógico (RN11 y RN21).
     * Advierte si existen citas futuras agendadas al inactivar el horario.
     */
    public function alternarEstado(int $id): array
    {
        $horario = DB::table('horarios_atencion')->where('id_horario', $id)->first();
        if (!$horario) {
            throw new \Exception('Horario no encontrado', 404);
        }

        $nuevoEstado = $horario->estado === 'activo' ? 'inactivo' : 'activo';
        $alerta = null;
        $citasAfectadas = 0;

        if ($nuevoEstado === 'activo') {
            $this->validarSolapamiento(
                $horario->id_medico,
                $horario->dia_semana,
                $horario->hora_inicio,
                $horario->hora_fin,
                $id
            );
        } else {
            // Inactivación con citas futuras (RN11)
            $hoy = date('Y-m-d');
            $citasAfectadasQuery = DB::table('citas')
                ->where('citas.id_medico', $horario->id_medico)
                ->where('citas.id_especialidad', $horario->id_especialidad)
                ->where('citas.fecha_cita', '>=', $hoy)
                ->whereRaw('EXTRACT(ISODOW FROM citas.fecha_cita) = ?', [$horario->dia_semana])
                ->where('citas.hora_inicio', '>=', $horario->hora_inicio)
                ->where('citas.hora_inicio', '<', $horario->hora_fin);
            Cita::aplicarFiltroOcupantes($citasAfectadasQuery, 'citas');
            $citasAfectadas = $citasAfectadasQuery->count();

            if ($citasAfectadas > 0) {
                $alerta = "El horario se inactivó pero tiene {$citasAfectadas} cita(s) futura(s) asociada(s). Se recomienda gestionar suspensiones para reubicar a los pacientes afectados.";
            }
        }

        DB::table('horarios_atencion')->where('id_horario', $id)->update([
            'estado' => $nuevoEstado,
            'updated_at' => now(),
        ]);

        ServicioBitacora::registrar(
            'CU09_GestionarHorariosAtencion',
            'CAMBIAR_ESTADO_HORARIO_ATENCION',
            'horarios_atencion',
            (string)$id,
            ['estado' => $horario->estado],
            [
                'estado' => $nuevoEstado,
                'citas_afectadas' => $citasAfectadas,
                'alerta' => $alerta,
            ]
        );

        return [
            'estado' => $nuevoEstado,
            'alerta' => $alerta,
            'citas_afectadas' => $citasAfectadas,
        ];
    }
}
