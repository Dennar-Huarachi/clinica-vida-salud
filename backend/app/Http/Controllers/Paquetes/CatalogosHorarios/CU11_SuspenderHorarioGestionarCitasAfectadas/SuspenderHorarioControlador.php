<?php

namespace App\Http\Controllers\Paquetes\CatalogosHorarios\CU11_SuspenderHorarioGestionarCitasAfectadas;

use App\Paquetes\CatalogosHorarios\CU11_SuspenderHorarioGestionarCitasAfectadas\SuspenderHorarioServicio;
use App\Http\Requests\Paquetes\CatalogosHorarios\CU11_SuspenderHorarioGestionarCitasAfectadas\SuspenderHorarioRequest;
use App\Http\Requests\Paquetes\CatalogosHorarios\CU11_SuspenderHorarioGestionarCitasAfectadas\ReubicarCitaPostergadaRequest;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Nucleo\Errores\RespuestaApi;

class SuspenderHorarioControlador extends Controller
{
    public function __construct(
        protected SuspenderHorarioServicio $servicio
    ) {}

    /**
     * Lista las suspensiones registradas.
     */
    public function index(Request $request): JsonResponse
    {
        $idMedico = $request->query('id_medico') ? (int)$request->query('id_medico') : null;
        return RespuestaApi::exito($this->servicio->listarSuspensiones($idMedico));
    }

    /**
     * Registra una suspensión de horario médico y procesa las citas afectadas.
     */
    public function store(SuspenderHorarioRequest $request): JsonResponse
    {
        try {
            $usuario = $request->attributes->get('usuario_autenticado');
            $resultado = $this->servicio->suspender($request->validated(), $usuario?->id_usuario);
            return RespuestaApi::exito($resultado, $resultado['mensaje'], 201);
        } catch (\Exception $e) {
            return RespuestaApi::error('Error al suspender horario médico: ' . $e->getMessage(), 400);
        }
    }

    /**
     * Lista todas las citas médicas en estado postergada para su gestión y reubicación.
     */
    public function citasPostergadas(Request $request): JsonResponse
    {
        try {
            $citas = $this->servicio->listarCitasPostergadas();
            return RespuestaApi::exito($citas);
        } catch (\Exception $e) {
            return RespuestaApi::error('Error al obtener citas postergadas: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Reubica una cita postergada hacia un nuevo turno libre disponible.
     */
    public function reubicar(ReubicarCitaPostergadaRequest $request): JsonResponse
    {
        try {
            $usuario = $request->attributes->get('usuario_autenticado');
            $resultado = $this->servicio->reubicarCita($request->validated(), $usuario?->id_usuario);
            return RespuestaApi::exito($resultado, $resultado['mensaje']);
        } catch (\Exception $e) {
            return RespuestaApi::error('Error al reubicar cita postergada: ' . $e->getMessage(), 400);
        }
    }

    /**
     * Levanta / cancela una suspensión médica previamente registrada.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $usuario = $request->attributes->get('usuario_autenticado');
            $resultado = $this->servicio->levantarSuspension($id, $usuario?->id_usuario);
            return RespuestaApi::exito($resultado, $resultado['mensaje']);
        } catch (\Exception $e) {
            return RespuestaApi::error('Error al levantar suspensión: ' . $e->getMessage(), 400);
        }
    }
}
