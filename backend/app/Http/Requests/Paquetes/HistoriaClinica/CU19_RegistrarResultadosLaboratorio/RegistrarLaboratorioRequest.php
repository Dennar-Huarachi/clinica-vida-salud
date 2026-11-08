<?php

namespace App\Http\Requests\Paquetes\HistoriaClinica\CU19_RegistrarResultadosLaboratorio;

use App\Nucleo\Validaciones\FormRequestPersonalizado;

class RegistrarLaboratorioRequest extends FormRequestPersonalizado
{
    public function rules(): array
    {
        return [
            'id_paciente' => 'required|integer|exists:pacientes,id_paciente',
            'id_atencion' => 'nullable|integer|exists:atenciones_clinicas,id_atencion',
            'tipo_estudio' => 'required|string|max:100',
            'descripcion' => 'required|string',
            'archivo_adjunto' => 'nullable|string|max:255',
            'fecha_estudio' => 'required|date',
        ];
    }
}
