<?php

namespace App\Http\Controllers\Paquetes\AccesoCuentas\CU03_RegistrarsePaciente;

use App\Paquetes\AccesoCuentas\CU03_RegistrarsePaciente\RegistrarsePacienteServicio;
use App\Http\Requests\Paquetes\AccesoCuentas\CU03_RegistrarsePaciente\RegistrarsePacienteRequest;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use App\Nucleo\Errores\RespuestaApi;

class RegistrarsePacienteControlador extends Controller
{
    public function __construct(
        protected RegistrarsePacienteServicio $servicio
    ) {}

    public function registrar(RegistrarsePacienteRequest $request): JsonResponse
    {
        try {
            $resultado = $this->servicio->registrar($request->validated());
            return RespuestaApi::exito($resultado, 'Registro de paciente completado con éxito', 201);
        } catch (\Exception $e) {
            return RespuestaApi::error('Error al registrar paciente: ' . $e->getMessage(), 400);
        }
    }
}
