<?php

namespace App\Http\Controllers\Paquetes\PacientesPerfil\CU06_GestionarMiPerfil;

use App\Paquetes\PacientesPerfil\CU06_GestionarMiPerfil\GestionarMiPerfilServicio;
use App\Http\Requests\Paquetes\PacientesPerfil\CU06_GestionarMiPerfil\ActualizarPerfilRequest;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Nucleo\Errores\RespuestaApi;

class GestionarMiPerfilControlador extends Controller
{
    public function __construct(
        protected GestionarMiPerfilServicio $servicio
    ) {}

    /**
     * Muestra la información consolidada del perfil del usuario autenticado (Anti-IDOR / RN19).
     */
    public function show(Request $request): JsonResponse
    {
        $usuario = $request->attributes->get('usuario_autenticado');
        if (!$usuario) {
            return RespuestaApi::error('Sesión no autenticada.', 401);
        }

        return RespuestaApi::exito($this->servicio->obtenerPerfil($usuario));
    }

    /**
     * Actualiza los datos de contacto, médicos declarados y contacto de emergencia.
     */
    public function update(ActualizarPerfilRequest $request): JsonResponse
    {
        try {
            $usuario = $request->attributes->get('usuario_autenticado');
            if (!$usuario) {
                return RespuestaApi::error('Sesión no autenticada.', 401);
            }

            $this->servicio->actualizar($usuario, $request->validated());
            return RespuestaApi::exito(null, 'Perfil actualizado correctamente.');
        } catch (\Exception $e) {
            return RespuestaApi::error('Error al actualizar perfil: ' . $e->getMessage(), 400);
        }
    }
}
