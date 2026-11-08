<?php

namespace App\Http\Controllers\Paquetes\CitasNotificaciones\CU15_ConsultarHistorialSeguimientoCitas;

use App\Paquetes\CitasNotificaciones\CU15_ConsultarHistorialSeguimientoCitas\HistorialSeguimientoCitasServicio;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use App\Nucleo\Errores\RespuestaApi;

class HistorialSeguimientoCitasControlador extends Controller
{
    public function __construct(
        protected HistorialSeguimientoCitasServicio $servicio
    ) {}

    public function index(Request $request): JsonResponse
    {
        $usuario = $request->attributes->get('usuario_autenticado');
        $idPaciente = $request->query('id_paciente') ? (int)$request->query('id_paciente') : null;

        // Blindaje IDOR (RN19): Si es rol paciente, forzar incondicionalmente su propio id_paciente
        if (strtolower($usuario?->rol ?? '') === 'paciente') {
            $idPaciente = (int)($usuario->id_paciente ?? 0);
            if (!$idPaciente && !empty($usuario->id_persona)) {
                $paciente = DB::table('pacientes')->where('id_persona', $usuario->id_persona)->first();
                $idPaciente = (int)($paciente?->id_paciente ?? 0);
            }
            if (!$idPaciente) {
                return RespuestaApi::error('Perfil de paciente no vinculado al usuario en sesión.', 403);
            }
        }

        $historial = $this->servicio->consultarHistorial(
            $idPaciente,
            $request->query('codigo_cita')
        );

        return RespuestaApi::exito($historial);
    }
}
