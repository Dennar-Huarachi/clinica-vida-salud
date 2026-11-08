<?php

namespace App\Http\Requests\Paquetes\AccesoCuentas\CU02_CambiarContrasena;

use App\Nucleo\Validaciones\FormRequestPersonalizado;

class CambiarContrasenaRequest extends FormRequestPersonalizado
{
    public function rules(): array
    {
        return [
            'contrasena_actual' => 'required|string',
            'contrasena_nueva' => [
                'required',
                'string',
                'min:8',
                'different:contrasena_actual',
                'regex:/[A-Z]/',
                'regex:/[a-z]/',
                'regex:/[0-9]/',
                'regex:/[!@#$%^&*(),.?":{}|<>]/',
            ],
            'confirmacion_contrasena' => 'required|string|same:contrasena_nueva',
        ];
    }

    public function messages(): array
    {
        return [
            'contrasena_actual.required' => 'La contraseña actual es obligatoria.',
            'contrasena_nueva.required' => 'La nueva contraseña es obligatoria.',
            'contrasena_nueva.min' => 'La nueva contraseña debe tener al menos 8 caracteres.',
            'contrasena_nueva.different' => 'La nueva contraseña no puede ser idéntica a la contraseña actual.',
            'contrasena_nueva.regex' => 'La nueva contraseña debe contener al menos una mayúscula, una minúscula, un número y un símbolo especial (!@#$%^&*(),.?":{}|<>).',
            'confirmacion_contrasena.required' => 'Debe confirmar la nueva contraseña.',
            'confirmacion_contrasena.same' => 'La confirmación no coincide con la nueva contraseña.',
        ];
    }
}
