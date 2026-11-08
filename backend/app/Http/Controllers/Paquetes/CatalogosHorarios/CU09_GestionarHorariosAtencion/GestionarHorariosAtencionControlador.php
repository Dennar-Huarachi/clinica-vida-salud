<?php

namespace App\Http\Controllers\Paquetes\CatalogosHorarios\CU09_GestionarHorariosAtencion;

use App\Paquetes\CatalogosHorarios\CU09_GestionarHorariosAtencion\GestionarHorariosAtencionServicio;
use App\Http\Requests\Paquetes\CatalogosHorarios\CU09_GestionarHorariosAtencion\GuardarHorarioRequest;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Nucleo\Errores\RespuestaApi;

class GestionarHorariosAtencionControlador extends Controller
{
    public function __construct(
        protected GestionarHorariosAtencionServicio $servicio
    ) {}

    public function index(Request $request): JsonResponse
    {
        $idMedico = $request->query('id_medico') ? (int)$request->query('id_medico') : null;
        $idEspecialidad = $request->query('id_especialidad') ? (int)$request->query('id_especialidad') : null;

        return RespuestaApi::exito($this->servicio->listar($idMedico, $idEspecialidad));
    }

    public function store(GuardarHorarioRequest $request): JsonResponse
    {
        try {
            $resultado = $this->servicio->crear($request->validated());
            $datosRespuesta = is_array($resultado)
                ? ['ids_horarios' => $resultado, 'total_creados' => count($resultado)]
                : ['id_horario' => $resultado];
            return RespuestaApi::exito($datosRespuesta, 'Horario(s) de atención registrado(s) con éxito', 201);
        } catch (\Exception $e) {
            $codigo = ($e->getCode() >= 400 && $e->getCode() <= 499) ? $e->getCode() : 400;
            return RespuestaApi::error($e->getMessage(), $codigo);
        }
    }

    public function update(GuardarHorarioRequest $request, int $id): JsonResponse
    {
        try {
            $this->servicio->actualizar($id, $request->validated());
            return RespuestaApi::exito(null, 'Horario de atención actualizado exitosamente');
        } catch (\Exception $e) {
            $codigo = ($e->getCode() >= 400 && $e->getCode() <= 499) ? $e->getCode() : 400;
            return RespuestaApi::error($e->getMessage(), $codigo);
        }
    }

    public function alternarEstado(int $id): JsonResponse
    {
        try {
            $resultado = $this->servicio->alternarEstado($id);
            $mensaje = "Estado del horario actualizado a {$resultado['estado']}";

            return response()->json([
                'exito' => true,
                'mensaje' => $mensaje,
                'datos' => $resultado,
                'estado' => $resultado['estado'],
                'alerta' => $resultado['alerta'],
                'citas_afectadas' => $resultado['citas_afectadas'],
            ], 200);
        } catch (\Exception $e) {
            $codigo = ($e->getCode() >= 400 && $e->getCode() <= 499) ? $e->getCode() : 400;
            return RespuestaApi::error($e->getMessage(), $codigo);
        }
    }
}
