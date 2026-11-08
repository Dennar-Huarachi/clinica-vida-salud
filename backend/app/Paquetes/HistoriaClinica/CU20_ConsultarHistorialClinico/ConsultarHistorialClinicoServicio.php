<?php

namespace App\Paquetes\HistoriaClinica\CU20_ConsultarHistorialClinico;

use Illuminate\Support\Facades\DB;

class ConsultarHistorialClinicoServicio
{
    /**
     * Consolida el expediente clínico electrónico integral de un paciente:
     * ficha civil/demográfica, información médica declarada, contacto de emergencia,
     * atenciones médicas cronológicas, estudios de laboratorio e historial de citas.
     */
    public function obtenerHistorialCompleto(int $idPaciente): ?array
    {
        // 1. Datos demográficos del paciente y persona
        $paciente = DB::table('pacientes')
            ->join('personas', 'pacientes.id_persona', '=', 'personas.id_persona')
            ->where('pacientes.id_paciente', $idPaciente)
            ->select(
                'pacientes.id_paciente',
                'pacientes.codigo_historia',
                'pacientes.grupo_sanguineo',
                'pacientes.estado as estado_paciente',
                'personas.id_persona',
                'personas.ci',
                'personas.nombres',
                'personas.apellidos',
                'personas.fecha_nacimiento',
                'personas.sexo',
                'personas.telefono',
                'personas.correo',
                'personas.direccion'
            )
            ->first();

        if (!$paciente) {
            return null;
        }

        // Calcular edad
        $paciente->edad = $paciente->fecha_nacimiento
            ? \Carbon\Carbon::parse($paciente->fecha_nacimiento)->age
            : null;
        $paciente->nombre_completo = trim("{$paciente->nombres} {$paciente->apellidos}");

        // 2. Información médica declarada (alergias, enfermedades crónicas, etc.)
        $infoMedica = DB::table('informacion_medica_paciente')
            ->where('id_paciente', $idPaciente)
            ->first();

        // 3. Contactos de emergencia
        $contactos = DB::table('contactos_emergencia')
            ->where('id_paciente', $idPaciente)
            ->orderBy('es_principal', 'desc')
            ->get()
            ->toArray();

        // 4. Cronología de atenciones clínicas concluidas
        $atenciones = DB::table('atenciones_clinicas')
            ->join('citas', 'atenciones_clinicas.id_cita', '=', 'citas.id_cita')
            ->join('medicos', 'atenciones_clinicas.id_medico', '=', 'medicos.id_medico')
            ->join('personas as per_medico', 'medicos.id_persona', '=', 'per_medico.id_persona')
            ->join('especialidades', 'citas.id_especialidad', '=', 'especialidades.id_especialidad')
            ->where('atenciones_clinicas.id_paciente', $idPaciente)
            ->select(
                'atenciones_clinicas.*',
                'citas.codigo_cita',
                'citas.fecha_cita',
                'citas.hora_inicio',
                'per_medico.nombres as medico_nombres',
                'per_medico.apellidos as medico_apellidos',
                'especialidades.nombre as especialidad_nombre'
            )
            ->orderBy('atenciones_clinicas.fecha_atencion', 'desc')
            ->get()
            ->map(function ($item) {
                $item->medico_nombre_completo = trim("Dr(a). {$item->medico_nombres} {$item->medico_apellidos}");
                return $item;
            })
            ->toArray();

        // 5. Estudios y resultados de laboratorio
        $laboratorios = DB::table('resultados_laboratorio')
            ->where('id_paciente', $idPaciente)
            ->orderBy('fecha_estudio', 'desc')
            ->get()
            ->toArray();

        // 6. Historial de citas médicas agendadas
        $citas = DB::table('citas')
            ->join('estados_cita', 'citas.id_estado_cita', '=', 'estados_cita.id_estado_cita')
            ->join('medicos', 'citas.id_medico', '=', 'medicos.id_medico')
            ->join('personas as per_medico', 'medicos.id_persona', '=', 'per_medico.id_persona')
            ->join('especialidades', 'citas.id_especialidad', '=', 'especialidades.id_especialidad')
            ->where('citas.id_paciente', $idPaciente)
            ->where('citas.estado', '!=', 'cancelada')
            ->select(
                'citas.id_cita',
                'citas.codigo_cita',
                'citas.fecha_cita',
                'citas.hora_inicio',
                'citas.hora_fin',
                'citas.motivo_consulta',
                'citas.id_estado_cita',
                'estados_cita.nombre as estado_nombre',
                'estados_cita.codigo as estado_codigo',
                'especialidades.nombre as especialidad_nombre',
                'per_medico.nombres as medico_nombres',
                'per_medico.apellidos as medico_apellidos'
            )
            ->orderBy('citas.fecha_cita', 'desc')
            ->orderBy('citas.hora_inicio', 'desc')
            ->get()
            ->map(function ($item) {
                $item->medico_nombre_completo = trim("Dr(a). {$item->medico_nombres} {$item->medico_apellidos}");
                $item->hora_inicio = substr($item->hora_inicio, 0, 5);
                $item->hora_fin = substr($item->hora_fin, 0, 5);
                return $item;
            })
            ->toArray();

        return [
            'paciente' => $paciente,
            'informacion_medica' => $infoMedica,
            'contactos_emergencia' => $contactos,
            'atenciones' => $atenciones,
            'resultados_laboratorio' => $laboratorios,
            'citas' => $citas,
        ];
    }
}
