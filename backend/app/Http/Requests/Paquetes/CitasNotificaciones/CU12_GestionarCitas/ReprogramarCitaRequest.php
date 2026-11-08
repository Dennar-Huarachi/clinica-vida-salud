<?php

namespace App\Http\Requests\Paquetes\CitasNotificaciones\CU12_GestionarCitas;

use App\Nucleo\Validaciones\FormRequestPersonalizado;

class ReprogramarCitaRequest extends FormRequestPersonalizado
{
    public function rules(): array
    {
        return [
            'fecha_cita' => 'required|date|after_or_equal:today',
            'hora_inicio' => 'required|date_format:H:i',
            'motivo_reprogramacion' => 'nullable|string|max:255',
        ];
    }
}
