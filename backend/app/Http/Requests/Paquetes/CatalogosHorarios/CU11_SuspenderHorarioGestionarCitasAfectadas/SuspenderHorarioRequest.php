<?php

namespace App\Http\Requests\Paquetes\CatalogosHorarios\CU11_SuspenderHorarioGestionarCitasAfectadas;

use App\Nucleo\Validaciones\FormRequestPersonalizado;

class SuspenderHorarioRequest extends FormRequestPersonalizado
{
    public function rules(): array
    {
        return [
            'id_medico' => 'required|integer|exists:medicos,id_medico',
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date|after_or_equal:fecha_inicio',
            'motivo' => 'required|string|max:255',
            'accion_citas' => 'nullable|string|in:reprogramacion_pendiente,cancelar_con_aviso',
        ];
    }
}
