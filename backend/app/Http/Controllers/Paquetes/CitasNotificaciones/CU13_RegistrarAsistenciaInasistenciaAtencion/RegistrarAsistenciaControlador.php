<?php

namespace App\Http\Controllers\Paquetes\CitasNotificaciones\CU13_RegistrarAsistenciaInasistenciaAtencion;

use App\Paquetes\CitasNotificaciones\CU13_RegistrarAsistenciaInasistenciaAtencion\RegistrarAsistenciaServicio;
use App\Http\Requests\Paquetes\CitasNotificaciones\CU13_RegistrarAsistenciaInasistenciaAtencion\RegistrarAsistenciaRequest;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Nucleo\Errores\RespuestaApi;

class RegistrarAsistenciaControlador extends Controller
{
    public function __construct(
        protected RegistrarAsistenciaServicio $servicio
    ) {}

    public function registrar(RegistrarAsistenciaRequest $request, ?int $id = null): JsonResponse
    {
        try {
            $usuario = $request->attributes->get('usuario_autenticado');
            $datos = $request->validated();
            
            $idCita = $id ?? ($datos['id_cita'] ?? null);
            if (!$idCita) {
                return RespuestaApi::error('Identificador de cita no proporcionado.', 422);
            }
            $datos['id_cita'] = (int)$idCita;

            $resultado = $this->servicio->registrar($datos, $usuario);
            return RespuestaApi::exito($resultado, 'Estado de cita actualizado satisfactoriamente');
        } catch (\Exception $e) {
            $codigo = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            return RespuestaApi::error($e->getMessage(), $codigo);
        }
    }
}
