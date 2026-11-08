<?php

namespace App\Paquetes\Reportes\CU23_ExportarReportes;

use Illuminate\Support\Facades\DB;
use App\Nucleo\Bitacora\ServicioBitacora;
use Carbon\Carbon;

class ExportarReportesServicio
{
    public function __construct(
        protected ServicioBitacora $servicioBitacora
    ) {}

    /**
     * Genera el contenido formateado en CSV (con BOM UTF-8) del reporte operacional de citas (CU-23).
     */
    public function exportarCitasCSV(
        ?string $fechaInicio = null,
        ?string $fechaFin = null,
        ?int $idEspecialidad = null,
        ?int $idMedico = null,
        ?int $idEstadoCita = null,
        ?int $idUsuarioOperador = null
    ): array {
        $inicio = $fechaInicio ?: Carbon::now('America/La_Paz')->startOfMonth()->toDateString();
        $fin = $fechaFin ?: Carbon::now('America/La_Paz')->endOfMonth()->toDateString();

        $query = DB::table('citas')
            ->join('pacientes', 'citas.id_paciente', '=', 'pacientes.id_paciente')
            ->join('personas as p_pac', 'pacientes.id_persona', '=', 'p_pac.id_persona')
            ->join('medicos', 'citas.id_medico', '=', 'medicos.id_medico')
            ->join('personas as p_med', 'medicos.id_persona', '=', 'p_med.id_persona')
            ->join('especialidades', 'citas.id_especialidad', '=', 'especialidades.id_especialidad')
            ->join('estados_cita', 'citas.id_estado_cita', '=', 'estados_cita.id_estado_cita')
            ->leftJoin('pagos_cita', 'citas.id_cita', '=', 'pagos_cita.id_cita')
            ->whereBetween('citas.fecha_cita', [$inicio, $fin]);

        if ($idEspecialidad) {
            $query->where('citas.id_especialidad', $idEspecialidad);
        }
        if ($idMedico) {
            $query->where('citas.id_medico', $idMedico);
        }
        if ($idEstadoCita) {
            $query->where('citas.id_estado_cita', $idEstadoCita);
        }

        $citas = $query
            ->select(
                'citas.codigo_cita',
                'citas.fecha_cita',
                'citas.hora_inicio',
                'citas.hora_fin',
                DB::raw("p_pac.nombres || ' ' || p_pac.apellidos as paciente"),
                'p_pac.ci as paciente_ci',
                'pacientes.codigo_historia',
                DB::raw("p_med.nombres || ' ' || p_med.apellidos as medico"),
                'especialidades.nombre as especialidad',
                'estados_cita.nombre as estado',
                'pagos_cita.monto as monto_garantia',
                'pagos_cita.estado_pago'
            )
            ->orderBy('citas.fecha_cita')
            ->orderBy('citas.hora_inicio')
            ->get();

        // Construir contenido CSV con BOM UTF-8 para apertura directa en Microsoft Excel
        $output = "\xEF\xBB\xBF";
        $encabezados = [
            'Código Cita',
            'Fecha',
            'Hora Inicio',
            'Hora Fin',
            'Paciente',
            'CI Paciente',
            'Nro Historia',
            'Médico Asignado',
            'Especialidad',
            'Estado Cita',
            'Monto Garantía (Bs)',
            'Estado Pago',
        ];

        $output .= implode(',', array_map([$this, 'escaparCampoCSV'], $encabezados)) . "\r\n";

        foreach ($citas as $c) {
            $fila = [
                $c->codigo_cita,
                $c->fecha_cita,
                substr($c->hora_inicio, 0, 5),
                substr($c->hora_fin, 0, 5),
                $c->paciente,
                $c->paciente_ci,
                $c->codigo_historia,
                $c->medico,
                $c->especialidad,
                $c->estado,
                $c->monto_garantia !== null ? number_format((float)$c->monto_garantia, 2, '.', '') : '0.00',
                $c->estado_pago ? ucfirst($c->estado_pago) : 'Sin pago',
            ];
            $output .= implode(',', array_map([$this, 'escaparCampoCSV'], $fila)) . "\r\n";
        }

        $nombreArchivo = "reporte_citas_" . Carbon::now()->format('Ymd_His') . ".csv";

        // Registro de Auditoría (RN21)
        $this->servicioBitacora->registrar(
            'citas',
            null,
            'EXPORTAR_CSV',
            null,
            [
                'modulo' => 'CU23_ExportarReportes',
                'tipo' => 'citas',
                'total_filas' => count($citas),
                'periodo' => "{$inicio} a {$fin}",
                'archivo' => $nombreArchivo,
            ],
            $idUsuarioOperador
        );

        return [
            'contenido' => $output,
            'nombre_archivo' => $nombreArchivo,
            'total_filas' => count($citas),
        ];
    }

    /**
     * Genera el contenido formateado en CSV del reporte de asistencia y efectividad clínica (CU-23).
     */
    public function exportarAsistenciaCSV(
        ?string $fechaInicio = null,
        ?string $fechaFin = null,
        ?int $idUsuarioOperador = null
    ): array {
        $inicio = $fechaInicio ?: Carbon::now('America/La_Paz')->startOfMonth()->toDateString();
        $fin = $fechaFin ?: Carbon::now('America/La_Paz')->endOfMonth()->toDateString();

        $desgloseEspecialidades = DB::table('citas')
            ->join('especialidades', 'citas.id_especialidad', '=', 'especialidades.id_especialidad')
            ->join('estados_cita', 'citas.id_estado_cita', '=', 'estados_cita.id_estado_cita')
            ->whereBetween('citas.fecha_cita', [$inicio, $fin])
            ->select(
                'especialidades.nombre as especialidad',
                DB::raw('count(citas.id_cita) as total'),
                DB::raw("count(case when estados_cita.codigo = 'atendida' then 1 end) as atendidas"),
                DB::raw("count(case when estados_cita.codigo = 'inasistencia' then 1 end) as inasistencias"),
                DB::raw("count(case when estados_cita.codigo = 'cancelada' then 1 end) as canceladas")
            )
            ->groupBy('especialidades.nombre')
            ->orderByDesc('total')
            ->get();

        $output = "\xEF\xBB\xBF";
        $encabezados = [
            'Especialidad Médica',
            'Total Citas Agendadas',
            'Citas Atendidas Concluidas',
            'Inasistencias Registradas',
            'Citas Canceladas',
            'Tasa de Efectividad (%)',
            'Tasa de Ausentismo (%)',
        ];

        $output .= implode(',', array_map([$this, 'escaparCampoCSV'], $encabezados)) . "\r\n";

        foreach ($desgloseEspecialidades as $esp) {
            $den = (int)$esp->atendidas + (int)$esp->inasistencias;
            $efectividad = $den > 0 ? round(((int)$esp->atendidas / $den) * 100, 2) : 0;
            $ausentismo = $den > 0 ? round(((int)$esp->inasistencias / $den) * 100, 2) : 0;

            $fila = [
                $esp->especialidad,
                $esp->total,
                $esp->atendidas,
                $esp->inasistencias,
                $esp->canceladas,
                number_format($efectividad, 2) . '%',
                number_format($ausentismo, 2) . '%',
            ];
            $output .= implode(',', array_map([$this, 'escaparCampoCSV'], $fila)) . "\r\n";
        }

        $nombreArchivo = "reporte_asistencia_" . Carbon::now()->format('Ymd_His') . ".csv";

        $this->servicioBitacora->registrar(
            'citas',
            null,
            'EXPORTAR_ASISTENCIA_CSV',
            null,
            [
                'modulo' => 'CU23_ExportarReportes',
                'tipo' => 'asistencia',
                'periodo' => "{$inicio} a {$fin}",
                'archivo' => $nombreArchivo,
            ],
            $idUsuarioOperador
        );

        return [
            'contenido' => $output,
            'nombre_archivo' => $nombreArchivo,
            'total_filas' => count($desgloseEspecialidades),
        ];
    }

    private function escaparCampoCSV(?string $valor): string
    {
        $v = (string)$valor;
        $v = str_replace('"', '""', $v);
        return '"' . $v . '"';
    }
}
