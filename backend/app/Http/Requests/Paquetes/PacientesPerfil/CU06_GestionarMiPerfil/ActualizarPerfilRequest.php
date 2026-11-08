<?php

namespace App\Http\Requests\Paquetes\PacientesPerfil\CU06_GestionarMiPerfil;

use App\Nucleo\Validaciones\FormRequestPersonalizado;

class ActualizarPerfilRequest extends FormRequestPersonalizado
{
    public function rules(): array
    {
        return [
            // Contacto de la persona
            'telefono' => 'nullable|string|max:20',
            'correo' => 'required|email|max:100',
            'direccion' => 'nullable|string|max:200',

            // Información médica declarada (para pacientes)
            'grupo_sanguineo' => 'nullable|string|max:10|in:O+,O-,A+,A-,B+,B-,AB+,AB-',
            'alergias' => 'nullable|string|max:1000',
            'enfermedades_cronicas' => 'nullable|string|max:1000',
            'medicamentos_actuales' => 'nullable|string|max:1000',
            'antecedentes_familiares' => 'nullable|string|max:1000',
            'observaciones_medicas' => 'nullable|string|max:1000',

            // Contacto de emergencia
            'contacto_nombre' => 'nullable|string|max:120',
            'contacto_relacion' => 'nullable|string|max:50',
            'contacto_telefono' => 'nullable|string|max:20',
            'contacto_direccion' => 'nullable|string|max:200',
        ];
    }
}
