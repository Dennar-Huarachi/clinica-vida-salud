<?php

namespace App\Paquetes\Reportes\CU21_ConsultarReportesCitas;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportesCitasServicio
{
    /**
     * Genera el reporte operativo detallado y cuantitativo de citas médicas (CU-21).
     * Aplica filtros combinables por rango de fechas, especialidad, médico y estado.
     */
    public function generarReporte(
        ?string $fechaInicio = null,
        ?string $fechaFin = null,
        ?int $idEspecialidad = null,
        ?int $idMedico = null,
        ?int $idEstadoCita = null
    ): array {
        $inicio = $fechaInicio ?: Carbon::now('America/La_Paz')->startOfMonth()->toDateString();
        $fin = $fechaFin ?: Carbon::now('America/La_Paz')->endOfMonth()->toDateString();

        if (Carbon::parse($inicio)->gt(Carbon::parse($fin))) {
            throw new \InvalidArgumentException('El rango cronológico es inválido: la fecha inicial no puede ser posterior a la fecha final.');
        }

        // Construir consulta base filtrable
        $baseQuery = DB::table('citas')
            ->join('pacientes', 'citas.id_paciente', '=', 'pacientes.id_paciente')
            ->join('personas as p_pac', 'pacientes.id_persona', '=', 'p_pac.id_persona')
            ->join('medicos', 'citas.id_medico', '=', 'medicos.id_medico')
            ->join('personas as p_med', 'medicos.id_persona', '=', 'p_med.id_persona')
            ->join('especialidades', 'citas.id_especialidad', '=', 'especialidades.id_especialidad')
            ->join('estados_cita', 'citas.id_estado_cita', '=', 'estados_cita.id_estado_cita')
            ->leftJoin('pagos_cita', 'citas.id_cita', '=', 'pagos_cita.id_cita')
            ->whereBetween('citas.fecha_cita', [$inicio, $fin]);

        if ($idEspecialidad) {
            $baseQuery->where('citas.id_especialidad', $idEspecialidad);
        }

        if ($idMedico) {
            $baseQuery->where('citas.id_medico', $idMedico);
        }

        if ($idEstadoCita) {
            $baseQuery->where('citas.id_estado_cita', $idEstadoCita);
        }

        // 1. Agregado: Total general
        $totalGeneral = (clone $baseQuery)->count('citas.id_cita');

        // 2. Agregado: Citas por Estado
        $porEstado = (clone $baseQuery)
            ->select(
                'estados_cita.codigo as estado_codigo',
                'estados_cita.nombre as estado_nombre',
                DB::raw('count(citas.id_cita) as total')
            )
            ->groupBy('estados_cita.codigo', 'estados_cita.nombre')
            ->get();

        // 3. Agregado: Citas por Especialidad
        $porEspecialidad = (clone $baseQuery)
            ->where('citas.estado', '!=', 'cancelada')
            ->select('especialidades.nombre as especialidad', DB::raw('count(citas.id_cita) as total'))
            ->groupBy('especialidades.nombre')
            ->orderByDesc('total')
            ->get();

        // 4. Agregado: Citas por Médico
        $porMedico = (clone $baseQuery)
            ->where('citas.estado', '!=', 'cancelada')
            ->select(
                DB::raw("p_med.nombres || ' ' || p_med.apellidos as medico"),
                DB::raw('count(citas.id_cita) as total')
            )
            ->groupBy('p_med.nombres', 'p_med.apellidos')
            ->orderByDesc('total')
            ->get();

        // 5. Listado detallado para renderizar o paginar
        $citasDetalle = (clone $baseQuery)
            ->select(
                'citas.id_cita',
                'citas.codigo_cita',
                'citas.fecha_cita',
                'citas.hora_inicio',
                'citas.hora_fin',
                DB::raw("p_pac.nombres || ' ' || p_pac.apellidos as paciente_nombre"),
                'p_pac.ci as paciente_ci',
                'pacientes.codigo_historia',
                DB::raw("p_med.nombres || ' ' || p_med.apellidos as medico_nombre"),
                'especialidades.nombre as especialidad_nombre',
                'estados_cita.codigo as estado_codigo',
                'estados_cita.nombre as estado_nombre',
                'pagos_cita.monto as monto_garantia',
                'pagos_cita.estado_pago'
            )
            ->orderBy('citas.fecha_cita', 'desc')
            ->orderBy('citas.hora_inicio', 'desc')
            ->limit(300)
            ->get()
            ->map(function ($item) {
                $item->hora_inicio = substr($item->hora_inicio, 0, 5);
                $item->hora_fin = substr($item->hora_fin, 0, 5);
                return $item;
            });

        return [
            'periodo' => [
                'inicio' => $inicio,
                'fin' => $fin,
            ],
            'filtros_aplicados' => [
                'id_especialidad' => $idEspecialidad,
                'id_medico' => $idMedico,
                'id_estado_cita' => $idEstadoCita,
            ],
            'total_citas' => $totalGeneral,
            'por_estado' => $porEstado,
            'por_especialidad' => $porEspecialidad,
            'por_medico' => $porMedico,
            'citas' => $citasDetalle->toArray(),
        ];
    }
}
