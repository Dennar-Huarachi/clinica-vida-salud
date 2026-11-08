<?php

namespace App\Http\Controllers\Paquetes\CatalogosHorarios\CU10_ConsultarDisponibilidad;

use App\Paquetes\CatalogosHorarios\CU10_ConsultarDisponibilidad\ConsultarDisponibilidadServicio;
use App\Http\Requests\Paquetes\CatalogosHorarios\CU10_ConsultarDisponibilidad\ConsultarDisponibilidadRequest;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use App\Nucleo\Errores\RespuestaApi;

class ConsultarDisponibilidadControlador extends Controller
{
    public function __construct(
        protected ConsultarDisponibilidadServicio $servicio
    ) {}

    public function consultar(ConsultarDisponibilidadRequest $request): JsonResponse
    {
        $idMedico = (int)$request->input('id_medico');
        $idEspecialidad = (int)$request->input('id_especialidad');
        $fecha = (string)$request->input('fecha');

        $usuario = $request->attributes->get('usuario_autenticado');
        $rol = $usuario?->rol ? strtolower($usuario->rol) : null;

        try {
            $resultado = $this->servicio->consultar($idMedico, $idEspecialidad, $fecha, $rol);
            return RespuestaApi::exito($resultado);
        } catch (\Exception $e) {
            $codigo = (int)$e->getCode();
            $status = ($codigo >= 400 && $codigo <= 500) ? $codigo : 400;
            return RespuestaApi::error($e->getMessage(), $status);
        }
    }
}
