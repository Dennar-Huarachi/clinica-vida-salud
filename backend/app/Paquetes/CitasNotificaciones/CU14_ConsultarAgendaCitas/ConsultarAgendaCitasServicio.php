<?php

namespace App\Paquetes\CitasNotificaciones\CU14_ConsultarAgendaCitas;

use Illuminate\Support\Facades\DB;

class ConsultarAgendaCitasServicio
{
    public function obtenerAgenda(
        ?int $idMedico = null,
        ?string $fecha = null,
        ?int $idEspecialidad = null,
        ?string $estado = null,
        ?string $fechaInicio = null,
        ?string $fechaFin = null
    ): array {
        $query = DB::table('citas')
            ->join('pacientes', 'citas.id_paciente', '=', 'pacientes.id_paciente')
            ->join('personas as per_paciente', 'pacientes.id_persona', '=', 'per_paciente.id_persona')
            ->join('medicos', 'citas.id_medico', '=', 'medicos.id_medico')
            ->join('personas as per_medico', 'medicos.id_persona', '=', 'per_medico.id_persona')
            ->join('especialidades', 'citas.id_especialidad', '=', 'especialidades.id_especialidad')
            ->join('estados_cita', 'citas.id_estado_cita', '=', 'estados_cita.id_estado_cita')
            ->leftJoin('pagos_cita', 'citas.id_cita', '=', 'pagos_cita.id_cita')
            ->where('citas.estado', '!=', 'cancelada');

        // Soporte para rango de fechas (Vista Semanal) o fecha fija (Vista Diaria)
        if (!empty($fechaInicio) && !empty($fechaFin)) {
            $query->whereBetween('citas.fecha_cita', [$fechaInicio, $fechaFin]);
            $fechaConsulta = $fecha ?: $fechaInicio;
        } else {
            $fechaConsulta = $fecha ?: date('Y-m-d');
            $query->where('citas.fecha_cita', $fechaConsulta);
        }

        $query->select(
            'citas.id_cita',
            'citas.codigo_cita',
            'citas.fecha_cita',
            'citas.hora_inicio',
            'citas.hora_fin',
            'citas.motivo_consulta',
            'citas.observaciones',
            'citas.es_postergada',
            'citas.id_estado_cita',
            'citas.creado_por_usuario',
            'estados_cita.codigo as estado_codigo',
            'estados_cita.nombre as estado_nombre',
            'pacientes.id_paciente',
            'pacientes.codigo_historia',
            'per_paciente.ci as paciente_ci',
            'per_paciente.nombres as paciente_nombres',
            'per_paciente.apellidos as paciente_apellidos',
            'per_paciente.telefono as paciente_telefono',
            'medicos.id_medico',
            'per_medico.nombres as medico_nombres',
            'per_medico.apellidos as medico_apellidos',
            'especialidades.nombre as especialidad_nombre',
            'pagos_cita.monto as pago_monto',
            'pagos_cita.metodo_pago',
            'pagos_cita.nro_transaccion',
            'pagos_cita.estado_pago',
            DB::raw("CASE WHEN EXISTS (SELECT 1 FROM usuarios u JOIN roles r ON u.id_rol = r.id_rol WHERE u.id_usuario = citas.creado_por_usuario AND r.nombre = 'paciente') THEN 'en_linea' ELSE 'recepcion' END as canal")
        )
        ->orderBy('citas.fecha_cita')
        ->orderBy('citas.hora_inicio');

        if ($idMedico !== null) {
            $query->where('citas.id_medico', $idMedico);
        }

        if ($idEspecialidad) {
            $query->where('citas.id_especialidad', $idEspecialidad);
        }

        if ($estado) {
            $query->where('estados_cita.codigo', $estado);
        }

        return [
            'fecha' => $fechaConsulta,
            'fecha_inicio' => $fechaInicio,
            'fecha_fin' => $fechaFin,
            'citas' => $query->get()->toArray(),
        ];
    }
}
