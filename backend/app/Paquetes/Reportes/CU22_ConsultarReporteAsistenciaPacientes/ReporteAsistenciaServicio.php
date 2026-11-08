<?php

namespace App\Paquetes\Reportes\CU22_ConsultarReporteAsistenciaPacientes;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReporteAsistenciaServicio
{
    /**
     * Genera el reporte de cumplimiento, ausentismo y nuevos registros de pacientes (CU-22).
     * Fórmula oficial de efectividad: Atendidas / (Atendidas + Inasistencias) * 100%
     */
    public function generarReporte(
        ?string $fechaInicio = null,
        ?string $fechaFin = null,
        ?int $idEspecialidad = null,
        ?int $idMedico = null
    ): array {
        $inicio = $fechaInicio ?: Carbon::now('America/La_Paz')->startOfMonth()->toDateString();
        $fin = $fechaFin ?: Carbon::now('America/La_Paz')->endOfMonth()->toDateString();

        if (Carbon::parse($inicio)->gt(Carbon::parse($fin))) {
            throw new \InvalidArgumentException('El rango cronológico es inválido: la fecha inicial no puede ser posterior a la fecha final.');
        }

        // 1. Consulta base de citas en el intervalo
        $queryCitas = DB::table('citas')
            ->join('estados_cita', 'citas.id_estado_cita', '=', 'estados_cita.id_estado_cita')
            ->whereBetween('citas.fecha_cita', [$inicio, $fin]);

        if ($idEspecialidad) {
            $queryCitas->where('citas.id_especialidad', $idEspecialidad);
        }

        if ($idMedico) {
            $queryCitas->where('citas.id_medico', $idMedico);
        }

        $citas = (clone $queryCitas)
            ->select('citas.id_cita', 'citas.id_especialidad', 'citas.id_medico', 'estados_cita.codigo')
            ->get();

        $totalCitas = $citas->count();
        $atendidas = $citas->where('codigo', 'atendida')->count();
        $inasistencias = $citas->where('codigo', 'inasistencia')->count();
        $canceladas = $citas->where('codigo', 'cancelada')->count();
        $pendientes = $totalCitas - ($atendidas + $inasistencias + $canceladas);

        // Denominador para cumplimiento de citas concluidas
        $denominadorEfectividad = $atendidas + $inasistencias;

        $tasaEfectividad = $denominadorEfectividad > 0
            ? round(($atendidas / $denominadorEfectividad) * 100, 2)
            : 0;

        $tasaAusentismo = $denominadorEfectividad > 0
            ? round(($inasistencias / $denominadorEfectividad) * 100, 2)
            : 0;

        $tasaCancelacion = $totalCitas > 0
            ? round(($canceladas / $totalCitas) * 100, 2)
            : 0;

        // 2. Métricas de Pacientes Empadronados
        $totalPacientesEmpadronados = DB::table('pacientes')->count();
        $pacientesNuevosPeriodo = DB::table('pacientes')
            ->whereBetween('created_at', [
                Carbon::parse($inicio)->startOfDay(),
                Carbon::parse($fin)->endOfDay()
            ])
            ->count();

        // 3. Desglose de Asistencia por Especialidad
        $desgloseEspecialidades = DB::table('citas')
            ->join('especialidades', 'citas.id_especialidad', '=', 'especialidades.id_especialidad')
            ->join('estados_cita', 'citas.id_estado_cita', '=', 'estados_cita.id_estado_cita')
            ->whereBetween('citas.fecha_cita', [$inicio, $fin])
            ->select(
                'especialidades.id_especialidad',
                'especialidades.nombre as especialidad',
                DB::raw('count(citas.id_cita) as total'),
                DB::raw("count(case when estados_cita.codigo = 'atendida' then 1 end) as atendidas"),
                DB::raw("count(case when estados_cita.codigo = 'inasistencia' then 1 end) as inasistencias"),
                DB::raw("count(case when estados_cita.codigo = 'cancelada' then 1 end) as canceladas")
            )
            ->groupBy('especialidades.id_especialidad', 'especialidades.nombre')
            ->orderByDesc('total')
            ->get()
            ->map(function ($item) {
                $den = (int)$item->atendidas + (int)$item->inasistencias;
                $item->tasa_efectividad = $den > 0
                    ? round(((int)$item->atendidas / $den) * 100, 2)
                    : 0;
                return $item;
            });

        // 4. Desglose de Asistencia por Médico
        $desgloseMedicos = DB::table('citas')
            ->join('medicos', 'citas.id_medico', '=', 'medicos.id_medico')
            ->join('personas', 'medicos.id_persona', '=', 'personas.id_persona')
            ->join('estados_cita', 'citas.id_estado_cita', '=', 'estados_cita.id_estado_cita')
            ->whereBetween('citas.fecha_cita', [$inicio, $fin])
            ->select(
                'medicos.id_medico',
                DB::raw("personas.nombres || ' ' || personas.apellidos as medico"),
                DB::raw('count(citas.id_cita) as total'),
                DB::raw("count(case when estados_cita.codigo = 'atendida' then 1 end) as atendidas"),
                DB::raw("count(case when estados_cita.codigo = 'inasistencia' then 1 end) as inasistencias")
            )
            ->groupBy('medicos.id_medico', 'personas.nombres', 'personas.apellidos')
            ->orderByDesc('total')
            ->get()
            ->map(function ($item) {
                $den = (int)$item->atendidas + (int)$item->inasistencias;
                $item->tasa_efectividad = $den > 0
                    ? round(((int)$item->atendidas / $den) * 100, 2)
                    : 0;
                return $item;
            });

        return [
            'periodo' => [
                'inicio' => $inicio,
                'fin' => $fin,
            ],
            'filtros' => [
                'id_especialidad' => $idEspecialidad,
                'id_medico' => $idMedico,
            ],
            'total_citas' => $totalCitas,
            'atendidas' => $atendidas,
            'inasistencias' => $inasistencias,
            'canceladas' => $canceladas,
            'pendientes_o_en_espera' => $pendientes,
            'porcentajes' => [
                'tasa_efectividad' => $tasaEfectividad,
                'tasa_ausentismo' => $tasaAusentismo,
                'tasa_cancelacion' => $tasaCancelacion,
            ],
            'pacientes' => [
                'total_empadronados' => $totalPacientesEmpadronados,
                'nuevos_periodo' => $pacientesNuevosPeriodo,
            ],
            'desglose_por_especialidad' => $desgloseEspecialidades->toArray(),
            'desglose_por_medico' => $desgloseMedicos->toArray(),
        ];
    }
}
