<?php

namespace App\Http\Controllers\Paquetes\HistoriaClinica\CU20_ConsultarHistorialClinico;

use App\Paquetes\HistoriaClinica\CU20_ConsultarHistorialClinico\ConsultarHistorialClinicoServicio;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use App\Nucleo\Errores\RespuestaApi;

class ConsultarHistorialClinicoControlador extends Controller
{
    public function __construct(
        protected ConsultarHistorialClinicoServicio $servicio
    ) {}

    /**
     * Consulta el expediente clínico consolidado de un paciente.
     * RN19 (Anti-IDOR): Si el usuario autenticado tiene rol 'paciente', se ignora
     * incondicionalmente cualquier idPaciente recibido en la ruta/URL y se fuerza
     * el id_paciente extraído directamente de la sesión criptográfica activa.
     */
    public function show(Request $request, int $idPaciente): JsonResponse
    {
        $usuario = $request->attributes->get('usuario_autenticado');
        if (!$usuario) {
            return RespuestaApi::error('Sesión no identificada.', 401);
        }

        $rol = strtolower($usuario->rol ?? '');

        // Blindaje estricto Anti-IDOR (RN19)
        if ($rol === 'paciente') {
            $idPacienteAutenticado = (int)($usuario->id_paciente ?? 0);
            if (!$idPacienteAutenticado && !empty($usuario->id_persona)) {
                $paciente = DB::table('pacientes')->where('id_persona', $usuario->id_persona)->first();
                $idPacienteAutenticado = (int)($paciente?->id_paciente ?? 0);
            }

            if (!$idPacienteAutenticado) {
                return RespuestaApi::error('Perfil de paciente no vinculado a la cuenta activa.', 403);
            }

            // Si intenta acceder al expediente de otro paciente, rechazar con 403 (RN19)
            if ($idPaciente !== 0 && (int)$idPaciente !== $idPacienteAutenticado) {
                return RespuestaApi::error('Acceso denegado: no tiene privilegios para consultar el expediente de otro paciente.', 403);
            }

            // Forzar el ID del paciente autenticado
            $idPaciente = $idPacienteAutenticado;
        }

        $historial = $this->servicio->obtenerHistorialCompleto($idPaciente);
        if (!$historial) {
            return RespuestaApi::error('Expediente clínico del paciente no encontrado.', 404);
        }

        return RespuestaApi::exito($historial);
    }
}
