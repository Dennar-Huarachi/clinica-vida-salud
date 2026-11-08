<?php

namespace App\Nucleo\Sesion;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Nucleo\Errores\RespuestaApi;

class ManejadorSesion
{
    /**
     * Middleware para verificar el Bearer token y autenticar al usuario.
     */
    public function handle(Request $request, Closure $next)
    {
        $token = $request->bearerToken() ?: $request->cookie('token_clinica');

        if (!$token) {
            return RespuestaApi::error('Acceso no autorizado: se requiere un token de sesión válido', 401);
        }

        $usuario = DB::table('usuarios')
            ->join('roles', 'usuarios.id_rol', '=', 'roles.id_rol')
            ->join('personas', 'usuarios.id_persona', '=', 'personas.id_persona')
            ->where('usuarios.token_sesion', $token)
            ->where('usuarios.estado', 'activo')
            ->select(
                'usuarios.id_usuario',
                'usuarios.nombre_usuario',
                'usuarios.correo',
                'usuarios.id_rol',
                'usuarios.ultimo_acceso',
                'usuarios.debe_cambiar_contrasena',
                'roles.nombre as rol',
                'personas.id_persona',
                'personas.nombres',
                'personas.apellidos',
                'personas.ci'
            )
            ->first();

        if (!$usuario) {
            return RespuestaApi::error('Sesión inválida o expirada. Por favor vuelva a iniciar sesión.', 401);
        }

        $usuario->debe_cambiar_contrasena = (bool)$usuario->debe_cambiar_contrasena;

        // Si es médico o paciente, vincular IDs de entidades
        $medico = DB::table('medicos')->where('id_persona', $usuario->id_persona)->first();
        $paciente = DB::table('pacientes')->where('id_persona', $usuario->id_persona)->first();

        $usuario->id_medico = $medico ? $medico->id_medico : null;
        $usuario->id_paciente = $paciente ? $paciente->id_paciente : null;

        $request->attributes->set('usuario_autenticado', $usuario);

        return $next($request);
    }
}
