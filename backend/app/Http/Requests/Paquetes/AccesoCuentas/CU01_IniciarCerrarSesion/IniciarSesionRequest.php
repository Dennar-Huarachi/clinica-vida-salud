<?php

namespace App\Http\Requests\Paquetes\AccesoCuentas\CU01_IniciarCerrarSesion;

use App\Nucleo\Validaciones\FormRequestPersonalizado;

class IniciarSesionRequest extends FormRequestPersonalizado
{
    public function rules(): array
    {
        return [
            'tipo_acceso' => 'required|string|in:paciente,personal',
            'identificador' => 'required|string|max:100',
            'contrasena' => 'nullable|string',
            'password' => 'nullable|string',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $contrasena = $this->input('contrasena') ?? $this->input('password');
            if (empty($contrasena)) {
                $validator->errors()->add('contrasena', 'La contraseña es obligatoria.');
            }
        });
    }

    public function messages(): array
    {
        return [
            'tipo_acceso.required' => 'Debe indicar el tipo de acceso (paciente o personal).',
            'tipo_acceso.in' => 'El tipo de acceso seleccionado no es válido.',
            'identificador.required' => 'Debe ingresar su usuario, correo o cédula de identidad.',
            'identificador.max' => 'El identificador no puede exceder los 100 caracteres.',
        ];
    }
}
