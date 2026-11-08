<?php

namespace App\Http\Controllers\Paquetes\Reportes\CU23_ExportarReportes;

use App\Paquetes\Reportes\CU23_ExportarReportes\ExportarReportesServicio;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use App\Nucleo\Errores\RespuestaApi;

class ExportarReportesControlador extends Controller
{
    public function __construct(
        protected ExportarReportesServicio $servicio
    ) {}

    /**
     * Exporta el set de datos filtrado en formato CSV descargable (CU-23).
     * Devuelve una respuesta HTTP con cabeceras Content-Type: text/csv y Content-Disposition: attachment.
     */
    public function exportar(Request $request): Response
    {
        $usuario = $request->attributes->get('usuario_autenticado');
        $tipo = strtolower($request->query('tipo', 'citas'));

        if ($tipo === 'asistencia') {
            $resultado = $this->servicio->exportarAsistenciaCSV(
                $request->query('fecha_inicio'),
                $request->query('fecha_fin'),
                $usuario?->id_usuario
            );
        } else {
            $resultado = $this->servicio->exportarCitasCSV(
                $request->query('fecha_inicio'),
                $request->query('fecha_fin'),
                $request->query('id_especialidad') ? (int)$request->query('id_especialidad') : null,
                $request->query('id_medico') ? (int)$request->query('id_medico') : null,
                $request->query('id_estado_cita') ? (int)$request->query('id_estado_cita') : null,
                $usuario?->id_usuario
            );
        }

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $resultado['nombre_archivo'] . '"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response($resultado['contenido'], 200, $headers);
    }
}
