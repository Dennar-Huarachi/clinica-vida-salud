<?php

namespace App\Http\Requests\Paquetes\HistoriaClinica\CU18_RegistrarAtencionClinica;

use App\Nucleo\Validaciones\FormRequestPersonalizado;

class RegistrarAtencionRequest extends FormRequestPersonalizado
{
    public function rules(): array
    {
        return [
            'id_cita' => 'required|integer|exists:citas,id_cita',
            'motivo_atencion' => 'required|string',
            'examen_fisico' => 'nullable|string',
            'diagnostico' => 'required|string',
            'tratamiento_indicaciones' => 'required|string',
            'receta_medica' => 'nullable|string',
        ];
    }
}
