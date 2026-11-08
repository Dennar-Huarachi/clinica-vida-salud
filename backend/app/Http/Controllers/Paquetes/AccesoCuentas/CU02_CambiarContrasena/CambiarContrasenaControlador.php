<?php

namespace App\Http\Controllers\Paquetes\AccesoCuentas\CU02_CambiarContrasena;

use App\Paquetes\AccesoCuentas\CU02_CambiarContrasena\CambiarContrasenaServicio;
use App\Http\Requests\Paquetes\AccesoCuentas\CU02_CambiarContrasena\CambiarContrasenaRequest;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use App\Nucleo\Errores\RespuestaApi;

class CambiarContrasenaControlador extends Controller
{
    public function __construct(
        protected CambiarContrasenaServicio $servicio
    ) {}

    public function cambiar(CambiarContrasenaRequest $request): JsonResponse
    {
        try {
            $usuario = $request->attributes->get('usuario_autenticado');
            $this->servicio->cambiar(
                $usuario->id_usuario,
                $request->input('contrasena_actual'),
                $request->input('contrasena_nueva')
            );

            return RespuestaApi::exito(null, 'Contraseña actualizada satisfactoriamente');
        } catch (\Exception $e) {
            $codigo = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            return RespuestaApi::error($e->getMessage(), $codigo);
        }
    }
}
