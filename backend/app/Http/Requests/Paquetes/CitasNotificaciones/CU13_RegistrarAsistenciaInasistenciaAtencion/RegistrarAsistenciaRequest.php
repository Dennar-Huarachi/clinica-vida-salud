<?php

namespace App\Http\Requests\Paquetes\CitasNotificaciones\CU13_RegistrarAsistenciaInasistenciaAtencion;

use App\Nucleo\Validaciones\FormRequestPersonalizado;

class RegistrarAsistenciaRequest extends FormRequestPersonalizado
{
    protected function prepareForValidation(): void
    {
        if (!$this->has('estado') && $this->has('estado_asistencia')) {
            $this->merge(['estado' => $this->input('estado_asistencia')]);
        }
        if (!$this->has('id_cita') && $this->route('id')) {
            $this->merge(['id_cita' => $this->route('id')]);
        }
    }

    public function rules(): array
    {
        return [
            'id_cita' => 'nullable|integer|exists:citas,id_cita',
            'estado' => 'required|string|in:en_espera,atendida,inasistencia,confirmada',
            'estado_asistencia' => 'nullable|string|in:en_espera,atendida,inasistencia,confirmada',
            'motivo_correccion' => 'nullable|string|max:500',
            'observaciones' => 'nullable|string|max:500',
        ];
    }
}
