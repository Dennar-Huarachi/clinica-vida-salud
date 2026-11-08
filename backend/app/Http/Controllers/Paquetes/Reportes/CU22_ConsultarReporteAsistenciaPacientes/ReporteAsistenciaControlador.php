<?php

namespace App\Http\Controllers\Paquetes\Reportes\CU22_ConsultarReporteAsistenciaPacientes;

use App\Paquetes\Reportes\CU22_ConsultarReporteAsistenciaPacientes\ReporteAsistenciaServicio;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Nucleo\Errores\RespuestaApi;

class ReporteAsistenciaControlador extends Controller
{
    public function __construct(
        protected ReporteAsistenciaServicio $servicio
    ) {}

    /**
     * Consulta las tasas de asistencia, efectividad clínica y concurrencia de pacientes (CU-22).
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $reporte = $this->servicio->generarReporte(
                $request->query('fecha_inicio'),
                $request->query('fecha_fin'),
                $request->query('id_especialidad') ? (int)$request->query('id_especialidad') : null,
                $request->query('id_medico') ? (int)$request->query('id_medico') : null
            );

            return RespuestaApi::exito($reporte);
        } catch (\InvalidArgumentException $e) {
            return RespuestaApi::error($e->getMessage(), 422);
        } catch (\Throwable $e) {
            return RespuestaApi::error('Error al generar el reporte de asistencia: ' . $e->getMessage(), 500);
        }
    }
}
