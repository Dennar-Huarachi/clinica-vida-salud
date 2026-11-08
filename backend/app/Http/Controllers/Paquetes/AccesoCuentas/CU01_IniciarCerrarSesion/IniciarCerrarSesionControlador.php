<?php

namespace App\Http\Controllers\Paquetes\AccesoCuentas\CU01_IniciarCerrarSesion;

use App\Paquetes\AccesoCuentas\CU01_IniciarCerrarSesion\IniciarCerrarSesionServicio;
use App\Http\Requests\Paquetes\AccesoCuentas\CU01_IniciarCerrarSesion\IniciarSesionRequest;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Nucleo\Errores\RespuestaApi;

class IniciarCerrarSesionControlador extends Controller
{
    public function __construct(
        protected IniciarCerrarSesionServicio $servicio
    ) {}

    public function login(IniciarSesionRequest $request): JsonResponse
    {
        try {
            $tipoAcceso = $request->input('tipo_acceso', 'personal');
            $identificador = $request->input('identificador') ?? $request->input('nombre_usuario');
            $contrasena = $request->input('contrasena') ?? $request->input('password');

            $resultado = $this->servicio->iniciarSesion(
                $tipoAcceso,
                $identificador,
                $contrasena
            );

            $respuesta = RespuestaApi::exito($resultado, 'Sesión iniciada exitosamente');
            return $respuesta->withCookie(cookie('token_clinica', $resultado['token'], 120, '/', null, false, true, false, 'Lax'));
        } catch (\Exception $e) {
            $codigo = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            return RespuestaApi::error($e->getMessage(), $codigo);
        }
    }

    public function logout(Request $request): JsonResponse
    {
        $usuario = $request->attributes->get('usuario_autenticado');
        if ($usuario) {
            $this->servicio->cerrarSesion($usuario->id_usuario);
        }

        $respuesta = RespuestaApi::exito(null, 'Sesión cerrada correctamente');
        return $respuesta->withoutCookie('token_clinica');
    }

    public function verificar(Request $request): JsonResponse
    {
        $usuario = $request->attributes->get('usuario_autenticado');
        return RespuestaApi::exito($usuario, 'Sesión activa y válida');
    }
}
