<?php

namespace App\Http\Requests\Paquetes\CatalogosHorarios\CU09_GestionarHorariosAtencion;

use App\Nucleo\Validaciones\FormRequestPersonalizado;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class GuardarHorarioRequest extends FormRequestPersonalizado
{
    protected function prepareForValidation(): void
    {
        $inicio = $this->input('hora_inicio');
        $fin = $this->input('hora_fin');

        $merge = [];
        if ($inicio && is_string($inicio) && strlen($inicio) >= 5) {
            $merge['hora_inicio'] = substr($inicio, 0, 5);
        }
        if ($fin && is_string($fin) && strlen($fin) >= 5) {
            $merge['hora_fin'] = substr($fin, 0, 5);
        }
        if (!empty($merge)) {
            $this->merge($merge);
        }
    }

    public function rules(): array
    {
        return [
            'id_medico' => 'required|integer|exists:medicos,id_medico',
            'id_especialidad' => 'required|integer|exists:especialidades,id_especialidad',
            'dia_semana' => 'nullable|integer|between:1,7', // 1=Lunes .. 7=Domingo (un solo día)
            'dias_semana' => 'nullable|array|min:1',       // Múltiples días simultáneos
            'dias_semana.*' => 'integer|between:1,7',
            'hora_inicio' => 'required|date_format:H:i',
            'hora_fin' => 'required|date_format:H:i|after:hora_inicio',
            'duracion_intervalo_minutos' => 'required|integer|min:5|max:120',
            'estado' => 'nullable|string|in:activo,inactivo',
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // 1. Validar que exista al menos dia_semana o dias_semana
            $diaUnico = $this->input('dia_semana');
            $diasMultiples = $this->input('dias_semana');

            if (empty($diaUnico) && (empty($diasMultiples) || !is_array($diasMultiples) || count($diasMultiples) === 0)) {
                $validator->errors()->add(
                    'dias_semana',
                    'Debe seleccionar al menos un día de atención semanal.'
                );
            }

            // 2. Validar vinculación Médico-Especialidad activa
            $idMedico = $this->input('id_medico');
            $idEspecialidad = $this->input('id_especialidad');

            if ($idMedico && $idEspecialidad) {
                $vinculo = DB::table('medico_especialidad')
                    ->join('especialidades', 'medico_especialidad.id_especialidad', '=', 'especialidades.id_especialidad')
                    ->where('medico_especialidad.id_medico', $idMedico)
                    ->where('medico_especialidad.id_especialidad', $idEspecialidad)
                    ->where('especialidades.estado', 'activo')
                    ->exists();

                if (!$vinculo) {
                    $validator->errors()->add(
                        'id_especialidad',
                        'El médico seleccionado no tiene asignada esta especialidad médica o la especialidad se encuentra inactiva.'
                    );
                }
            }

            // 3. Validar coherencia temporal mínima (debe caber al menos 1 turno)
            $inicioStr = $this->input('hora_inicio');
            $finStr = $this->input('hora_fin');
            $duracion = (int)$this->input('duracion_intervalo_minutos', 15);

            if ($inicioStr && $finStr && $duracion > 0) {
                try {
                    $inicio = Carbon::createFromFormat('H:i', substr($inicioStr, 0, 5));
                    $fin = Carbon::createFromFormat('H:i', substr($finStr, 0, 5));

                    if ($fin->lte($inicio)) {
                        $validator->errors()->add('hora_fin', 'La hora de fin debe ser posterior a la hora de inicio.');
                    } else {
                        $diferenciaMinutos = $inicio->diffInMinutes($fin);
                        if ($diferenciaMinutos < $duracion) {
                            $validator->errors()->add(
                                'duracion_intervalo_minutos',
                                "El rango horario seleccionado ({$diferenciaMinutos} min) no permite alojar al menos un turno completo de {$duracion} min."
                            );
                        }
                    }
                } catch (\Throwable $e) {
                    // Errores de formato cubiertos por date_format
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'id_medico.required' => 'Debe seleccionar un profesional médico.',
            'id_especialidad.required' => 'Debe seleccionar una especialidad médica.',
            'dia_semana.between' => 'El día de la semana debe ser válido (1=Lunes a 7=Domingo).',
            'dias_semana.array' => 'La selección múltiple de días debe ser una lista válida.',
            'hora_fin.after' => 'La hora de fin debe ser estrictamente posterior a la hora de inicio.',
            'duracion_intervalo_minutos.min' => 'La duración del turno debe ser de al menos 5 minutos.',
        ];
    }
}
