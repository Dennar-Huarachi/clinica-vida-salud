<?php

namespace App\Http\Requests\Paquetes\CatalogosHorarios\CU11_SuspenderHorarioGestionarCitasAfectadas;

use App\Nucleo\Validaciones\FormRequestPersonalizado;

class ReubicarCitaPostergadaRequest extends FormRequestPersonalizado
{
    public function rules(): array
    {
        return [
            'id_cita' => 'required|integer|exists:citas,id_cita',
            'nueva_fecha' => 'required|date|after_or_equal:today',
            'nueva_hora_inicio' => 'required|string',
            'nueva_hora_fin' => 'required|string',
            'nuevo_id_medico' => 'nullable|integer|exists:medicos,id_medico',
            'motivo_reubicacion' => 'nullable|string|max:255',
        ];
    }
}

