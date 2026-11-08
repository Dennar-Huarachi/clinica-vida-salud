<?php

namespace App\Paquetes\Reportes\CU25_VisualizarDashboardAdministrativo;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardAdministrativoServicio
{
    /**
     * Consolidación integral de métricas operacionales, efectividad clínica,
     * gestión financiera de garantías y actividad reciente para el Dashboard Ejecutivo.
     */
    public function obtenerMetricas(): array
    {
        $hoy = Carbon::today('America/La_Paz')->toDateString();
        $inicioMes = Carbon::now('America/La_Paz')->startOfMonth()->toDateString();
        $finMes = Carbon::now('America/La_Paz')->endOfMonth()->toDateString();
        $inicioSemana = Carbon::now('America/La_Paz')->startOfWeek()->toDateString();
        $finSemana = Carbon::now('America/La_Paz')->endOfWeek()->toDateString();

        // 1. Catálogos y Padrón Activo
        $totalPacientes = DB::table('pacientes')->where('estado', 'activo')->count();
        $totalMedicos = DB::table('medicos')->where('estado', 'activo')->count();
        $totalEspecialidades = DB::table('especialidades')->where('estado', 'activo')->count();

        $pacientesNuevosMes = DB::table('pacientes')
            ->whereBetween('created_at', [Carbon::now()->startOfMonth(), Carbon::now()->endOfMonth()])
            ->count();

        // 2. Citas del Día de Hoy
        $citasHoy = DB::table('citas')->where('fecha_cita', $hoy)->count();

        $citasAtendidasHoy = DB::table('citas')
            ->join('estados_cita', 'citas.id_estado_cita', '=', 'estados_cita.id_estado_cita')
            ->where('citas.fecha_cita', $hoy)
            ->where('estados_cita.codigo', 'atendida')
            ->count();

        $citasPendientesHoy = DB::table('citas')
            ->join('estados_cita', 'citas.id_estado_cita', '=', 'estados_cita.id_estado_cita')
            ->where('citas.fecha_cita', $hoy)
            ->whereIn('estados_cita.codigo', ['programada', 'confirmada', 'en_espera'])
            ->count();

        $citasCanceladasHoy = DB::table('citas')
            ->join('estados_cita', 'citas.id_estado_cita', '=', 'estados_cita.id_estado_cita')
            ->where('citas.fecha_cita', $hoy)
            ->where(function ($q) {
                $q->where('estados_cita.codigo', 'cancelada')
                  ->orWhere('citas.estado', 'cancelada');
            })
            ->count();

        // 3. Citas de la Semana
        $citasSemana = DB::table('citas')
            ->whereBetween('fecha_cita', [$inicioSemana, $finSemana])
            ->where('estado', '!=', 'cancelada')
            ->count();

        // 4. Citas del Mes y Desglose por Estado
        $citasMesQuery = DB::table('citas')
            ->join('estados_cita', 'citas.id_estado_cita', '=', 'estados_cita.id_estado_cita')
            ->whereBetween('citas.fecha_cita', [$inicioMes, $finMes]);

        $totalCitasMes = (clone $citasMesQuery)->count();

        $conteoEstadosMes = (clone $citasMesQuery)
            ->select('estados_cita.codigo', 'estados_cita.nombre', DB::raw('count(citas.id_cita) as total'))
            ->groupBy('estados_cita.codigo', 'estados_cita.nombre')
            ->get();

        $atendidasMes = 0;
        $inasistenciasMes = 0;
        $canceladasMes = 0;
        $programadasMes = 0;

        foreach ($conteoEstadosMes as $est) {
            $cod = strtolower($est->codigo);
            if ($cod === 'atendida') {
                $atendidasMes += (int)$est->total;
            } elseif ($cod === 'inasistencia') {
                $inasistenciasMes += (int)$est->total;
            } elseif ($cod === 'cancelada') {
                $canceladasMes += (int)$est->total;
            } else {
                $programadasMes += (int)$est->total;
            }
        }

        // Tasa de Efectividad de Asistencia: Atendidas / (Atendidas + Inasistencias) * 100%
        $denominadorEfectividad = $atendidasMes + $inasistenciasMes;
        $tasaEfectividad = $denominadorEfectividad > 0
            ? round(($atendidasMes / $denominadorEfectividad) * 100, 2)
            : 0;

        $tasaAusentismo = $denominadorEfectividad > 0
            ? round(($inasistenciasMes / $denominadorEfectividad) * 100, 2)
            : 0;

        // 5. Métricas Financieras de Garantía de Cita (CU-27 / pagos_cita)
        $ingresosGarantia = 0.0;
        $penalizacionesRetenidas = 0.0;
        $reembolsosEmitidos = 0.0;

        if (DB::getSchemaBuilder()->hasTable('pagos_cita')) {
            $ingresosGarantia = (float)(DB::table('pagos_cita')
                ->where('estado_pago', 'completado')
                ->sum('monto') ?? 0);

            $penalizacionesRetenidas = (float)(DB::table('pagos_cita')
                ->where('estado_pago', 'retenido')
                ->sum('monto') ?? 0);

            $reembolsosEmitidos = (float)(DB::table('pagos_cita')
                ->where('estado_pago', 'reembolsado')
                ->sum('monto') ?? 0);
        }

        // 6. Distribución de Citas por Especialidad (Mes actual)
        $citasPorEspecialidad = DB::table('citas')
            ->join('especialidades', 'citas.id_especialidad', '=', 'especialidades.id_especialidad')
            ->whereBetween('citas.fecha_cita', [$inicioMes, $finMes])
            ->where('citas.estado', '!=', 'cancelada')
            ->select('especialidades.nombre as especialidad', DB::raw('count(citas.id_cita) as total'))
            ->groupBy('especialidades.nombre')
            ->orderByDesc('total')
            ->limit(5)
            ->get()
            ->map(function ($item) use ($totalCitasMes) {
                $item->porcentaje = $totalCitasMes > 0
                    ? round(($item->total / $totalCitasMes) * 100, 1)
                    : 0;
                return $item;
            });

        // 7. Últimas 7 Citas Registradas
        $ultimasCitas = DB::table('citas')
            ->join('pacientes', 'citas.id_paciente', '=', 'pacientes.id_paciente')
            ->join('personas as p_pac', 'pacientes.id_persona', '=', 'p_pac.id_persona')
            ->join('medicos', 'citas.id_medico', '=', 'medicos.id_medico')
            ->join('personas as p_med', 'medicos.id_persona', '=', 'p_med.id_persona')
            ->join('especialidades', 'citas.id_especialidad', '=', 'especialidades.id_especialidad')
            ->join('estados_cita', 'citas.id_estado_cita', '=', 'estados_cita.id_estado_cita')
            ->select(
                'citas.id_cita',
                'citas.codigo_cita',
                'citas.fecha_cita',
                'citas.hora_inicio',
                DB::raw("p_pac.nombres || ' ' || p_pac.apellidos as paciente"),
                'pacientes.codigo_historia',
                DB::raw("p_med.nombres || ' ' || p_med.apellidos as medico"),
                'especialidades.nombre as especialidad',
                'estados_cita.codigo as estado_codigo',
                'estados_cita.nombre as estado_nombre'
            )
            ->orderBy('citas.id_cita', 'desc')
            ->limit(7)
            ->get();

        // 8. Últimos 5 Eventos de la Bitácora de Auditoría (RN21)
        $ultimosEventosAuditoria = [];
        if (DB::getSchemaBuilder()->hasTable('bitacora_auditoria')) {
            $ultimosEventosAuditoria = DB::table('bitacora_auditoria')
                ->leftJoin('usuarios', 'bitacora_auditoria.id_usuario', '=', 'usuarios.id_usuario')
                ->select(
                    'bitacora_auditoria.id_bitacora',
                    'bitacora_auditoria.caso_uso',
                    'bitacora_auditoria.accion',
                    'bitacora_auditoria.tabla_afectada',
                    'bitacora_auditoria.fecha_hora',
                    'usuarios.nombre_usuario'
                )
                ->orderBy('bitacora_auditoria.id_bitacora', 'desc')
                ->limit(5)
                ->get();
        }

        return [
            'fecha_actual' => $hoy,
            'periodo_mes' => [
                'inicio' => $inicioMes,
                'fin' => $finMes,
            ],
            'kpis' => [
                'total_pacientes' => $totalPacientes,
                'pacientes_nuevos_mes' => $pacientesNuevosMes,
                'total_medicos' => $totalMedicos,
                'total_especialidades' => $totalEspecialidades,
                'citas_hoy' => $citasHoy,
                'citas_atendidas_hoy' => $citasAtendidasHoy,
                'citas_pendientes_hoy' => $citasPendientesHoy,
                'citas_canceladas_hoy' => $citasCanceladasHoy,
                'citas_semana' => $citasSemana,
                'citas_mes' => $totalCitasMes,
                'tasa_efectividad_asistencia' => $tasaEfectividad,
                'tasa_ausentismo' => $tasaAusentismo,
                'ingresos_garantia' => $ingresosGarantia,
                'penalizaciones_retenidas' => $penalizacionesRetenidas,
                'reembolsos_emitidos' => $reembolsosEmitidos,
            ],
            'estados_mes' => $conteoEstadosMes,
            'por_especialidad' => $citasPorEspecialidad,
            'ultimas_citas' => $ultimasCitas->toArray(),
            'ultimos_eventos_auditoria' => $ultimosEventosAuditoria,
        ];
    }
}
