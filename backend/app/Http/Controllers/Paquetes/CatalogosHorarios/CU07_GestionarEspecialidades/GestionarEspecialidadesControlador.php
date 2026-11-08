<?php

namespace App\Http\Controllers\Paquetes\CatalogosHorarios\CU07_GestionarEspecialidades;

use App\Paquetes\CatalogosHorarios\CU07_GestionarEspecialidades\GestionarEspecialidadesServicio;
use App\Http\Requests\Paquetes\CatalogosHorarios\CU07_GestionarEspecialidades\GuardarEspecialidadRequest;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Nucleo\Errores\RespuestaApi;

class GestionarEspecialidadesControlador extends Controller
{
    public function __construct(
        protected GestionarEspecialidadesServicio $servicio
    ) {}

    public function index(Request $request): JsonResponse
    {
        return RespuestaApi::exito(
            $this->servicio->listar($request->query('termino'), $request->query('estado'))
        );
    }

    public function store(GuardarEspecialidadRequest $request): JsonResponse
    {
        try {
            $id = $this->servicio->crear($request->validated());
            return RespuestaApi::exito(['id_especialidad' => $id], 'Especialidad creada con éxito', 201);
        } catch (\Exception $e) {
            return RespuestaApi::error('Error al crear especialidad: ' . $e->getMessage(), 400);
        }
    }

    public function update(GuardarEspecialidadRequest $request, int $id): JsonResponse
    {
        try {
            $this->servicio->actualizar($id, $request->validated());
            return RespuestaApi::exito(null, 'Especialidad actualizada satisfactoriamente');
        } catch (\Exception $e) {
            return RespuestaApi::error('Error al actualizar especialidad: ' . $e->getMessage(), 400);
        }
    }

    public function alternarEstado(int $id): JsonResponse
    {
        try {
            $resultado = $this->servicio->alternarEstado($id);
            $mensaje = $resultado['advertencia'] ?? "Estado de especialidad actualizado a {$resultado['estado']}";

            return RespuestaApi::exito($resultado, $mensaje);
        } catch (\Exception $e) {
            return RespuestaApi::error('Error al cambiar estado de especialidad: ' . $e->getMessage(), 400);
        }
    }
}
