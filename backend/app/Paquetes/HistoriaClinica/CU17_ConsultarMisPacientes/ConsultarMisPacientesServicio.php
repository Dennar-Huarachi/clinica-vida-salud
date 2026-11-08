<?php

namespace App\Paquetes\HistoriaClinica\CU17_ConsultarMisPacientes;

use Illuminate\Support\Facades\DB;

class ConsultarMisPacientesServicio
{
    /**
     * Consulta consolidada del padrón de pacientes asignados a un médico (Kardex Digital).
     * Aplica la regla RN19 (Anti-IDOR) aislando los pacientes a los turnos médicos del profesional.
     */
    public function consultar(?int $idMedico = null, ?string $termino = null): array
    {
        $query = DB::table('pacientes')
            ->join('personas', 'pacientes.id_persona', '=', 'personas.id_persona')
            ->join('citas', 'pacientes.id_paciente', '=', 'citas.id_paciente')
            ->leftJoin('informacion_medica_paciente', 'pacientes.id_paciente', '=', 'informacion_medica_paciente.id_paciente')
            ->where('citas.estado', '!=', 'cancelada')
            ->where('citas.id_estado_cita', '!=', 6);

        // Aislamiento por médico estricto (RN19)
        if ($idMedico) {
            $query->where('citas.id_medico', $idMedico);
        }

        // Búsqueda predictiva en tiempo real
        if ($termino && trim($termino) !== '') {
            $busqueda = '%' . trim($termino) . '%';
            $query->where(function ($q) use ($busqueda) {
                $q->where('personas.nombres', 'ilike', $busqueda)
                  ->orWhere('personas.apellidos', 'ilike', $busqueda)
                  ->orWhere('personas.ci', 'ilike', $busqueda)
                  ->orWhere('pacientes.codigo_historia', 'ilike', $busqueda)
                  ->orWhere('personas.telefono', 'ilike', $busqueda);
            });
        }

        $resultados = $query->select(
            'pacientes.id_paciente',
            'pacientes.codigo_historia',
            'pacientes.grupo_sanguineo',
            'personas.ci',
            'personas.nombres',
            'personas.apellidos',
            'personas.fecha_nacimiento',
            'personas.sexo',
            'personas.telefono',
            'personas.correo',
            'personas.direccion',
            'informacion_medica_paciente.alergias',
            'informacion_medica_paciente.enfermedades_cronicas',
            'informacion_medica_paciente.medicamentos_actuales',
            DB::raw('count(citas.id_cita) as total_consultas'),
            DB::raw('count(case when citas.id_estado_cita = 5 then 1 end) as consultas_atendidas'),
            DB::raw('max(case when citas.id_estado_cita = 5 then citas.fecha_cita else null end) as ultima_fecha_atencion'),
            DB::raw('max(citas.fecha_cita) as fecha_ultima_cita')
        )
        ->groupBy(
            'pacientes.id_paciente',
            'pacientes.codigo_historia',
            'pacientes.grupo_sanguineo',
            'personas.ci',
            'personas.nombres',
            'personas.apellidos',
            'personas.fecha_nacimiento',
            'personas.sexo',
            'personas.telefono',
            'personas.correo',
            'personas.direccion',
            'informacion_medica_paciente.alergias',
            'informacion_medica_paciente.enfermedades_cronicas',
            'informacion_medica_paciente.medicamentos_actuales'
        )
        ->orderByRaw('max(citas.fecha_cita) desc nulls last')
        ->orderBy('personas.apellidos', 'asc')
        ->get();

        return $resultados->map(function ($item) {
            $item->nombre_completo = trim("{$item->nombres} {$item->apellidos}");
            // Calcular edad a partir de fecha_nacimiento
            $item->edad = $item->fecha_nacimiento
                ? \Carbon\Carbon::parse($item->fecha_nacimiento)->age
                : null;
            return $item;
        })->toArray();
    }
}
