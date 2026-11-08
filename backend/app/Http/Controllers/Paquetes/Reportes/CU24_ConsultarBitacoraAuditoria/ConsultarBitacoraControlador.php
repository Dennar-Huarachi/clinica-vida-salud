<?php

namespace App\Http\Controllers\Paquetes\Reportes\CU24_ConsultarBitacoraAuditoria;

use App\Paquetes\Reportes\CU24_ConsultarBitacoraAuditoria\ConsultarBitacoraServicio;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Nucleo\Errores\RespuestaApi;

class ConsultarBitacoraControlador extends Controller
{
    public function __construct(
        protected ConsultarBitacoraServicio $servicio
    ) {}

    /**
     * Consulta los registros inmutables de la bitácora de auditoría (CU-24 / RN21).
     * Exclusivo para el rol Administrador.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $usuario = $request->attributes->get('usuario_autenticado');
            if (!$usuario) {
                return RespuestaApi::error('Sesión no identificada.', 401);
            }
            if (strtolower($usuario->rol ?? '') !== 'administrador') {
                return RespuestaApi::error('Acceso denegado: solo el administrador puede consultar la bitácora de auditoría.', 403);
            }

            $eventos = $this->servicio->consultar(
                $request->query('caso_uso'),
                $request->query('accion') ?? $request->query('evento'),
                $request->query('usuario'),
                $request->query('tabla_afectada'),
                $request->query('fecha_inicio'),
                $request->query('fecha_fin'),
                $request->query('fecha'),
                (int)($request->query('limite', 150))
            );

            return RespuestaApi::exito($eventos);
        } catch (\Throwable $e) {
            return RespuestaApi::error('Error al consultar bitácora de auditoría: ' . $e->getMessage(), 500);
        }
    }
}
