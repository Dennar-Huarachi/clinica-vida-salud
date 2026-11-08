<?php

namespace App\Http\Controllers\Paquetes\HistoriaClinica\CU19_RegistrarResultadosLaboratorio;

use App\Paquetes\HistoriaClinica\CU19_RegistrarResultadosLaboratorio\ResultadosLaboratorioServicio;
use App\Http\Requests\Paquetes\HistoriaClinica\CU19_RegistrarResultadosLaboratorio\RegistrarLaboratorioRequest;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Nucleo\Errores\RespuestaApi;

class ResultadosLaboratorioControlador extends Controller
{
    public function __construct(
        protected ResultadosLaboratorioServicio $servicio
    ) {}

    /**
     * Lista los estudios de laboratorio de un paciente.
     * RN19: Si el usuario es paciente, aísla la consulta forzosamente a su propio id_paciente.
     */
    public function index(Request $request): JsonResponse
    {
        $usuario = $request->attributes->get('usuario_autenticado');
        if (!$usuario) {
            return RespuestaApi::error('Sesión no identificada.', 401);
        }

        $rol = strtolower($usuario->rol ?? '');
        $idPaciente = null;

        if ($rol === 'paciente') {
            $idPaciente = (int)($usuario->id_paciente ?? 0);
            if (!$idPaciente && !empty($usuario->id_persona)) {
                $p = DB::table('pacientes')->where('id_persona', $usuario->id_persona)->first();
                $idPaciente = (int)($p?->id_paciente ?? 0);
            }
            if (!$idPaciente) {
                return RespuestaApi::error('Perfil de paciente no vinculado al usuario en sesión.', 403);
            }
            $requestedId = $request->query('id_paciente');
            if ($requestedId && (int)$requestedId !== $idPaciente) {
                return RespuestaApi::error('Acceso denegado: no tiene autorización para ver los resultados de laboratorio de otro paciente.', 403);
            }
        } else {
            $idPaciente = $request->query('id_paciente') ? (int)$request->query('id_paciente') : null;
            if (!$idPaciente) {
                return RespuestaApi::error('Debe indicar el identificador del paciente para listar sus estudios.', 422);
            }
        }

        $laboratorios = $this->servicio->listarPorPaciente($idPaciente);
        return RespuestaApi::exito($laboratorios);
    }

    /**
     * Registra un nuevo resultado de estudio clínico o prueba de laboratorio.
     */
    public function store(RegistrarLaboratorioRequest $request): JsonResponse
    {
        try {
            $usuario = $request->attributes->get('usuario_autenticado');
            $rol = strtolower($usuario?->rol ?? '');
            if (!in_array($rol, ['administrador', 'medico', 'recepcionista'])) {
                return RespuestaApi::error('Acceso denegado: no tiene privilegios para registrar estudios de laboratorio.', 403);
            }

            $id = $this->servicio->registrar($request->validated(), $usuario?->id_usuario);

            return RespuestaApi::exito(
                ['id_resultado' => $id],
                'Estudio de laboratorio registrado exitosamente en el historial clínico.',
                201
            );
        } catch (\Exception $e) {
            return RespuestaApi::error('Error al registrar estudio de laboratorio: ' . $e->getMessage(), 400);
        }
    }
}
