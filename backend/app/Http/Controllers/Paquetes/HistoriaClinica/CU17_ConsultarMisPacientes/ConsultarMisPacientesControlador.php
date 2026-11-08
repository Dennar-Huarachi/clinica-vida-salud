<?php

namespace App\Http\Controllers\Paquetes\HistoriaClinica\CU17_ConsultarMisPacientes;

use App\Paquetes\HistoriaClinica\CU17_ConsultarMisPacientes\ConsultarMisPacientesServicio;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use App\Nucleo\Errores\RespuestaApi;

class ConsultarMisPacientesControlador extends Controller
{
    public function __construct(
        protected ConsultarMisPacientesServicio $servicio
    ) {}

    /**
     * Retorna el kardex consolidado de pacientes asignados al profesional médico.
     * RN19: Si el usuario es médico, extrae id_medico estrictamente del token criptográfico
     * de la sesión activa, ignorando cualquier ID enviado en la petición HTTP.
     */
    public function index(Request $request): JsonResponse
    {
        $usuario = $request->attributes->get('usuario_autenticado');
        if (!$usuario) {
            return RespuestaApi::error('Sesión no identificada.', 401);
        }

        $rol = strtolower($usuario->rol ?? '');
        $idMedico = null;

        if ($rol === 'medico') {
            // Regla RN19 estricta: Ignorar parámetros de cliente
            $idMedico = $usuario->id_medico;

            // En caso de que no estuviera pre-cargado, resolver por id_persona
            if (!$idMedico) {
                $medico = DB::table('medicos')->where('id_persona', $usuario->id_persona)->first();
                $idMedico = $medico ? $medico->id_medico : null;
            }

            if (!$idMedico) {
                return RespuestaApi::error('No se encontró una ficha médica activa asociada a este usuario.', 403);
            }
        } elseif ($rol === 'administrador') {
            // El administrador puede supervisar opcionalmente el kardex de un médico en particular
            $idMedico = $request->query('id_medico') ? (int)$request->query('id_medico') : null;
        } else {
            return RespuestaApi::error('Acceso denegado: su rol no tiene privilegios para consultar el kardex de pacientes.', 403);
        }

        $termino = $request->query('termino') ? (string)$request->query('termino') : null;
        $pacientes = $this->servicio->consultar($idMedico, $termino);

        return RespuestaApi::exito($pacientes);
    }
}
