<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Support\Facades\DB;

/**
 * Modelo Cita Médica (Clínica Vida Salud)
 *
 * Centraliza la regla unificada de ocupación de turnos médicos en el sistema.
 * Aplica para: CU-10 (Disponibilidad), CU-11 (Suspensiones y Reubicación) y CU-12 (Creación y Reprogramación).
 */
class Cita extends Model
{
    protected $table = 'citas';
    protected $primaryKey = 'id_cita';

    protected $fillable = [
        'codigo_cita',
        'id_paciente',
        'id_medico',
        'id_especialidad',
        'id_estado_cita',
        'fecha_cita',
        'hora_inicio',
        'hora_fin',
        'motivo_consulta',
        'observaciones',
        'es_postergada',
        'fecha_expiracion_reserva',
        'creado_por_usuario',
        'estado',
        'id_pago',
        'pago_confirmado',
    ];

    /**
     * Regla de Ocupación: Estados de cita médica que efectivamente OCUPAN un turno.
     * Toda cita médica que NO sea 'cancelada' (y que no esté en estado 'postergada' por suspensión
     * a la espera de reubicación prioritaria) ocupa el turno de consulta del médico.
     *
     * Incluye:
     * - pendiente: Cita reservada en espera de confirmación
     * - programada: Cita agendada en calendario
     * - confirmada: Cita confirmada por paciente o recepción
     * - en_espera: Paciente presente en sala de espera
     * - atendida: Consulta médica efectuada
     * - inasistencia: El paciente no asistió pero el turno quedó reservado y bloqueado
     * - reprogramada: Cita trasladada a un nuevo turno válido
     */
    public const ESTADOS_OCUPANTES = [
        'pendiente',
        'programada',
        'confirmada',
        'en_espera',
        'atendida',
        'inasistencia',
        'reprogramada',
    ];

    /**
     * Estados que liberan el turno.
     * Únicamente 'cancelada' libera el turno médico para ser tomado por otro paciente.
     */
    public const ESTADOS_LIBERADORES = [
        'cancelada',
    ];

    /**
     * Aplica la regla única y unificada de turnos ocupados sobre cualquier consulta (QueryBuilder o Eloquent).
     *
     * @param Builder|QueryBuilder $query
     * @param string $aliasCitas
     * @return Builder|QueryBuilder
     */
    public static function aplicarFiltroOcupantes($query, string $aliasCitas = 'citas')
    {
        return $query
            ->where("{$aliasCitas}.estado", '!=', 'cancelada')
            ->where("{$aliasCitas}.es_postergada", false)
            ->whereIn("{$aliasCitas}.id_estado_cita", function ($sub) {
                $sub->select('id_estado_cita')
                    ->from('estados_cita')
                    ->whereIn('codigo', self::ESTADOS_OCUPANTES);
            });
    }

    /**
     * Scope para consultas Eloquent.
     */
    public function scopeOcupandoTurno(Builder $query, string $aliasCitas = 'citas'): Builder
    {
        return self::aplicarFiltroOcupantes($query, $aliasCitas);
    }

    /**
     * Construye y retorna la consulta de verificación de solapamiento para un médico, fecha y rango horario.
     *
     * @param int $idMedico
     * @param string $fecha YYYY-MM-DD
     * @param string $horaInicioStr HH:mm o HH:mm:ss
     * @param string $horaFinStr HH:mm o HH:mm:ss
     * @param int|null $idCitaExcluir ID de la cita a omitir (útil al reprogramar o reubicar)
     * @return QueryBuilder
     */
    public static function querySolapamiento(
        int $idMedico,
        string $fecha,
        string $horaInicioStr,
        string $horaFinStr,
        ?int $idCitaExcluir = null
    ) {
        $query = DB::table('citas')
            ->where('id_medico', $idMedico)
            ->where('fecha_cita', $fecha);

        if ($idCitaExcluir !== null) {
            $query->where('id_cita', '!=', $idCitaExcluir);
        }

        self::aplicarFiltroOcupantes($query, 'citas');

        return $query->where(function ($q) use ($horaInicioStr, $horaFinStr) {
            $q->where('hora_inicio', '<', $horaFinStr)
              ->where('hora_fin', '>', $horaInicioStr);
        });
    }
}

