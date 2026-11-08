<?php

namespace App\Http\Controllers\Paquetes\CitasNotificaciones\CU16_EnviarNotificacionesRecordatorios;

use App\Paquetes\CitasNotificaciones\CU16_EnviarNotificacionesRecordatorios\EnviarNotificacionesServicio;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Nucleo\Errores\RespuestaApi;

class EnviarNotificacionesControlador extends Controller
{
    public function __construct(
        protected EnviarNotificacionesServicio $servicio
    ) {}

    /**
     * Lista las notificaciones del usuario en sesión junto con el total de no leídas.
     */
    public function index(Request $request): JsonResponse
    {
        $usuario = $request->attributes->get('usuario_autenticado');
        if (!$usuario) {
            return RespuestaApi::error('Sesión no identificada.', 401);
        }

        $soloNoLeidas = $request->query('no_leidas') === 'true';
        $notificaciones = $this->servicio->listarPorUsuario($usuario->id_usuario, $soloNoLeidas);
        $totalNoLeidas = $this->servicio->contarNoLeidas($usuario->id_usuario);

        return RespuestaApi::exito([
            'notificaciones' => $notificaciones,
            'total_no_leidas' => $totalNoLeidas,
        ]);
    }

    /**
     * Marca una notificación como leída.
     */
    public function marcarLeida(Request $request, int $id): JsonResponse
    {
        $usuario = $request->attributes->get('usuario_autenticado');
        if (!$usuario) {
            return RespuestaApi::error('Sesión no identificada.', 401);
        }

        $this->servicio->marcarLeida($id, $usuario->id_usuario);
        return RespuestaApi::exito(null, 'Notificación marcada como leída');
    }

    /**
     * Marca todas las notificaciones pendientes del usuario como leídas.
     */
    public function marcarTodasLeidas(Request $request): JsonResponse
    {
        $usuario = $request->attributes->get('usuario_autenticado');
        if (!$usuario) {
            return RespuestaApi::error('Sesión no identificada.', 401);
        }

        $actualizadas = $this->servicio->marcarTodasLeidas($usuario->id_usuario);
        return RespuestaApi::exito(['actualizadas' => $actualizadas], 'Todas las notificaciones fueron marcadas como leídas');
    }

    /**
     * Dispara masivamente recordatorios para citas del día siguiente.
     */
    public function dispararRecordatorios(Request $request): JsonResponse
    {
        try {
            $cantidad = $this->servicio->enviarRecordatoriosProximos();
            return RespuestaApi::exito(
                ['recordatorios_enviados' => $cantidad],
                $cantidad > 0
                    ? "Se enviaron {$cantidad} recordatorios de citas con éxito."
                    : "No había citas pendientes de recordatorio para el día de mañana."
            );
        } catch (\Exception $e) {
            return RespuestaApi::error('Error al procesar los recordatorios: ' . $e->getMessage(), 500);
        }
    }
}
