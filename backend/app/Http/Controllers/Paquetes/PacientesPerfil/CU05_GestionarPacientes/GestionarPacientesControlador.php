<?php

namespace App\Http\Controllers\Paquetes\PacientesPerfil\CU05_GestionarPacientes;

use App\Paquetes\PacientesPerfil\CU05_GestionarPacientes\GestionarPacientesServicio;
use App\Http\Requests\Paquetes\PacientesPerfil\CU05_GestionarPacientes\GuardarPacienteRequest;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Nucleo\Errores\RespuestaApi;

class GestionarPacientesControlador extends Controller
{
    public function __construct(
        protected GestionarPacientesServicio $servicio
    ) {}

    public function index(Request $request): JsonResponse
    {
        $pacientes = $this->servicio->listar(
            $request->query('termino'),
            $request->query('estado')
        );

        return RespuestaApi::exito($pacientes);
    }

    public function show(int $id): JsonResponse
    {
        $paciente = $this->servicio->obtenerPorId($id);
        if (!$paciente) {
            return RespuestaApi::error('Paciente no encontrado', 404);
        }

        return RespuestaApi::exito($paciente);
    }

    public function store(GuardarPacienteRequest $request): JsonResponse
    {
        try {
            $id = $this->servicio->crear($request->validated());
            return RespuestaApi::exito(
                ['id_paciente' => $id],
                'Paciente registrado correctamente. Su cuenta de acceso ha sido creada usando su CI como contraseña.',
                201
            );
        } catch (\Throwable $e) {
            report($e);
            $codigo = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            return RespuestaApi::error('Error al registrar paciente: ' . $e->getMessage(), $codigo);
        }
    }

    public function update(GuardarPacienteRequest $request, int $id): JsonResponse
    {
        try {
            $this->servicio->actualizar($id, $request->validated());
            return RespuestaApi::exito(null, 'Paciente actualizado satisfactoriamente');
        } catch (\Throwable $e) {
            report($e);
            $codigo = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            return RespuestaApi::error('Error al actualizar paciente: ' . $e->getMessage(), $codigo);
        }
    }

    public function alternarEstado(int $id): JsonResponse
    {
        try {
            $nuevoEstado = $this->servicio->alternarEstado($id);
            return RespuestaApi::exito(['estado' => $nuevoEstado], "Estado del paciente actualizado a {$nuevoEstado}");
        } catch (\Throwable $e) {
            report($e);
            $codigo = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            return RespuestaApi::error('Error al cambiar estado lógico del paciente: ' . $e->getMessage(), $codigo);
        }
    }
}
