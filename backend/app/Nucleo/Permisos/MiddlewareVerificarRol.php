<?php

namespace App\Nucleo\Permisos;

use Closure;
use Illuminate\Http\Request;
use App\Nucleo\Errores\RespuestaApi;

class MiddlewareVerificarRol
{
    /**
     * Verifica que el usuario tenga alguno de los roles permitidos.
     * Ejemplo de uso en rutas: 'rol:administrador,medico'
     */
    public function handle(Request $request, Closure $next, ...$rolesPermitidos)
    {
        $usuario = $request->attributes->get('usuario_autenticado');

        if (!$usuario) {
            return RespuestaApi::error('Acceso no autorizado: usuario no autenticado', 401);
        }

        if (empty($rolesPermitidos)) {
            return $next($request);
        }

        $rolUsuario = strtolower($usuario->rol ?? '');

        // El administrador siempre tiene acceso o si el rol coincide
        if ($rolUsuario === 'administrador' || in_array($rolUsuario, array_map('strtolower', $rolesPermitidos), true)) {
            return $next($request);
        }

        return RespuestaApi::error('Permisos insuficientes para acceder a este caso de uso', 403);
    }
}
