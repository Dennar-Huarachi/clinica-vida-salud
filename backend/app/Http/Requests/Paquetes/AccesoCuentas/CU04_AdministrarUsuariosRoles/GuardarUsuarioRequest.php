<?php

namespace App\Http\Requests\Paquetes\AccesoCuentas\CU04_AdministrarUsuariosRoles;

use App\Nucleo\Validaciones\FormRequestPersonalizado;

class GuardarUsuarioRequest extends FormRequestPersonalizado
{
    public function rules(): array
    {
        $idUsuario = $this->route('id');

        $reglaCorreo = $idUsuario
            ? "required|email|max:100|unique:usuarios,correo,{$idUsuario},id_usuario"
            : "required|email|max:100|unique:usuarios,correo";

        $reglaUsuario = $idUsuario
            ? "required|string|max:50|unique:usuarios,nombre_usuario,{$idUsuario},id_usuario"
            : "required|string|max:50|unique:usuarios,nombre_usuario";

        return [
            'ci' => 'required|string|max:20',
            'nombres' => 'required|string|max:80',
            'apellidos' => 'required|string|max:80',
            'correo' => $reglaCorreo,
            'telefono' => 'nullable|string|max:20',
            'id_rol' => 'required|integer|exists:roles,id_rol',
            'nombre_usuario' => $reglaUsuario,
            'contrasena' => $idUsuario ? 'nullable|string|min:6' : 'required|string|min:6',
            'estado' => 'nullable|string|in:activo,inactivo,bloqueado',
        ];
    }
}
