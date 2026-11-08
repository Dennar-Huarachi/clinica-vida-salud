<?php

namespace App\Http\Requests\Paquetes\AccesoCuentas\CU03_RegistrarsePaciente;

use App\Nucleo\Validaciones\FormRequestPersonalizado;

class RegistrarsePacienteRequest extends FormRequestPersonalizado
{
    public function rules(): array
    {
        return [
            'ci' => [
                'required',
                'string',
                'max:20',
                function ($attribute, $value, $fail) {
                    $ciLimpio = trim($value);
                    $usuarioExiste = \Illuminate\Support\Facades\DB::table('usuarios')
                        ->join('personas', 'usuarios.id_persona', '=', 'personas.id_persona')
                        ->where('personas.ci', $ciLimpio)
                        ->exists();

                    if ($usuarioExiste) {
                        $fail('La cédula de identidad ya se encuentra registrada con una cuenta de usuario activa.');
                    }
                },
            ],
            'nombres' => 'required|string|max:80',
            'apellidos' => 'required|string|max:80',
            'fecha_nacimiento' => 'required|date',
            'sexo' => 'required|string|in:M,F',
            'telefono' => 'required|string|max:20',
            'correo' => 'required|email|max:100|unique:usuarios,correo',
            'direccion' => 'nullable|string|max:200',
            'nombre_usuario' => 'required|string|min:4|max:50|unique:usuarios,nombre_usuario',
            'contrasena' => [
                'required',
                'string',
                'min:8',
                'regex:/[A-Z]/',
                'regex:/[a-z]/',
                'regex:/[0-9]/',
                'regex:/[!@#$%^&*(),.?":{}|<>]/',
            ],
            'grupo_sanguineo' => 'nullable|string|max:10',
        ];
    }

    public function messages(): array
    {
        return [
            'ci.unique' => 'La cédula de identidad ya se encuentra registrada.',
            'correo.unique' => 'El correo electrónico ya se encuentra registrado.',
            'nombre_usuario.unique' => 'El nombre de usuario ya está en uso. Elija otro.',
            'contrasena.required' => 'La contraseña es obligatoria.',
            'contrasena.min' => 'La contraseña debe tener al menos 8 caracteres.',
            'contrasena.regex' => 'La contraseña debe contener al menos una mayúscula, una minúscula, un número y un símbolo especial (!@#$%^&*(),.?":{}|<>).',
        ];
    }
}
