<?php

namespace App\Http\Requests\Paquetes\CatalogosHorarios\CU08_GestionarMedicos;

use App\Nucleo\Validaciones\FormRequestPersonalizado;

class GuardarMedicoRequest extends FormRequestPersonalizado
{
    public function rules(): array
    {
        $idMedico = $this->route('id');
        $idPersona = null;

        if ($idMedico) {
            $medico = \Illuminate\Support\Facades\DB::table('medicos')->where('id_medico', $idMedico)->first();
            $idPersona = $medico?->id_persona;
        }

        return [
            'ci' => 'required|string|max:20|unique:personas,ci,' . ($idPersona ?? 'NULL') . ',id_persona',
            'nombres' => 'required|string|max:80',
            'apellidos' => 'required|string|max:80',
            'fecha_nacimiento' => 'nullable|date',
            'sexo' => 'nullable|string|in:M,F',
            'telefono' => 'nullable|string|max:20',
            'correo' => 'required|email|max:100',
            'direccion' => 'nullable|string|max:200',
            'nro_matricula' => 'required|string|max:50|unique:medicos,nro_matricula,' . ($idMedico ?? 'NULL') . ',id_medico',
            'biografia' => 'nullable|string',
            'especialidades' => 'required|array|min:1',
            'especialidades.*' => 'integer|exists:especialidades,id_especialidad',
            'estado' => 'nullable|string|in:activo,inactivo',
        ];
    }
}
