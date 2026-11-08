<?php

namespace App\Http\Controllers\Paquetes\Reportes\CU21_ConsultarReportesCitas;

use App\Paquetes\Reportes\CU21_ConsultarReportesCitas\ReportesCitasServicio;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Nucleo\Errores\RespuestaApi;

class ReportesCitasControlador extends Controller
{
    public function __construct(
        protected ReportesCitasServicio $servicio
    ) {}

    /**
     * Consulta el reporte operacional de citas con filtros combinables (CU-21).
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $reporte = $this->servicio->generarReporte(
                $request->query('fecha_inicio'),
                $request->query('fecha_fin'),
                $request->query('id_especialidad') ? (int)$request->query('id_especialidad') : null,
                $request->query('id_medico') ? (int)$request->query('id_medico') : null,
                $request->query('id_estado_cita') ? (int)$request->query('id_estado_cita') : null
            );

            return RespuestaApi::exito($reporte);
        } catch (\InvalidArgumentException $e) {
            return RespuestaApi::error($e->getMessage(), 422);
        } catch (\Throwable $e) {
            return RespuestaApi::error('Error al generar el reporte de citas: ' . $e->getMessage(), 500);
        }
    }
}
