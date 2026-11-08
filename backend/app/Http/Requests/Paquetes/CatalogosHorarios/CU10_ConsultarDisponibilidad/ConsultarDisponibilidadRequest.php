<?php

namespace App\Http\Requests\Paquetes\CatalogosHorarios\CU10_ConsultarDisponibilidad;

use App\Nucleo\Validaciones\FormRequestPersonalizado;

class ConsultarDisponibilidadRequest extends FormRequestPersonalizado
{
    protected function prepareForValidation(): void
    {
        // En peticiones GET los parámetros vienen por query string
        if ($this->query()) {
            $this->merge($this->query());
        }
    }

    public function rules(): array
    {
        return [
            'id_medico' => 'required|integer|exists:medicos,id_medico',
            'id_especialidad' => 'required|integer|exists:especialidades,id_especialidad',
            'fecha' => 'required|date_format:Y-m-d',
        ];
    }

    public function messages(): array
    {
        return [
            'id_medico.required' => 'El identificador del médico es obligatorio.',
            'id_medico.exists' => 'El médico seleccionado no existe en el sistema.',
            'id_especialidad.required' => 'La especialidad médica es obligatoria.',
            'id_especialidad.exists' => 'La especialidad médica seleccionada no existe en el sistema.',
            'fecha.required' => 'La fecha de consulta es obligatoria.',
            'fecha.date_format' => 'El formato de fecha debe ser YYYY-MM-DD.',
        ];
    }
}
