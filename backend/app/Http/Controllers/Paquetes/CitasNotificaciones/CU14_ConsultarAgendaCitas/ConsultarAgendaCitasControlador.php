<?php

namespace App\Http\Controllers\Paquetes\CitasNotificaciones\CU14_ConsultarAgendaCitas;

use App\Paquetes\CitasNotificaciones\CU14_ConsultarAgendaCitas\ConsultarAgendaCitasServicio;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Nucleo\Errores\RespuestaApi;
use Illuminate\Support\Facades\DB;

class ConsultarAgendaCitasControlador extends Controller
{
    public function __construct(
        protected ConsultarAgendaCitasServicio $servicio
    ) {}

    public function index(Request $request): JsonResponse
    {
        try {
            $usuario = $request->attributes->get('usuario_autenticado');
            $idMedico = $request->query('id_medico') ? (int)$request->query('id_medico') : null;

            // Regla estricta de aislamiento (RN12/RN19):
            // Si el usuario autenticado tiene el rol "medico", la consulta Query Builder
            // filtra FORZOSAMENTE por su propio id_medico. Jamás un médico puede ver citas de otros colegas.
            if (strtolower($usuario?->rol ?? '') === 'medico') {
                $idMedico = !empty($usuario->id_medico) ? (int)$usuario->id_medico : null;
                if (!$idMedico && !empty($usuario->id_persona)) {
                    $idMedico = (int) DB::table('medicos')->where('id_persona', $usuario->id_persona)->value('id_medico');
                }
                // Si por alguna razón extrema no tiene registro médico, forzar -1 para no divulgar citas ajenas
                if (!$idMedico) {
                    $idMedico = -1;
                }
            }

            $idEspecialidad = $request->query('id_especialidad') ? (int)$request->query('id_especialidad') : null;
            $estado = $request->query('estado') ? trim($request->query('estado')) : null;
            $fecha = $request->query('fecha') ? trim($request->query('fecha')) : null;
            $fechaInicio = $request->query('fecha_inicio') ? trim($request->query('fecha_inicio')) : null;
            $fechaFin = $request->query('fecha_fin') ? trim($request->query('fecha_fin')) : null;

            $agenda = $this->servicio->obtenerAgenda(
                $idMedico,
                $fecha,
                $idEspecialidad,
                $estado,
                $fechaInicio,
                $fechaFin
            );

            return RespuestaApi::exito($agenda);
        } catch (\Throwable $e) {
            report($e);
            return RespuestaApi::error('Error al consultar agenda de citas: ' . $e->getMessage(), 500);
        }
    }
}
