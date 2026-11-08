<?php

namespace App\Http\Controllers\Paquetes\Reportes\CU25_VisualizarDashboardAdministrativo;

use App\Paquetes\Reportes\CU25_VisualizarDashboardAdministrativo\DashboardAdministrativoServicio;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Nucleo\Errores\RespuestaApi;

class DashboardAdministrativoControlador extends Controller
{
    public function __construct(
        protected DashboardAdministrativoServicio $servicio
    ) {}

    /**
     * Retorna el conjunto consolidado de métricas operacionales, financieras y clínicas (CU-25).
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $metricas = $this->servicio->obtenerMetricas();
            return RespuestaApi::exito($metricas);
        } catch (\Throwable $e) {
            return RespuestaApi::error('Error al consolidar indicadores del dashboard: ' . $e->getMessage(), 500);
        }
    }
}
