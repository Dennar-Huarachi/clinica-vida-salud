<?php

namespace App\Http\Controllers\Paquetes\CitasNotificaciones\CU27_GestionarPagosReembolsos;

use App\Paquetes\CitasNotificaciones\CU27_GestionarPagosReembolsos\GestionarPagosReembolsosServicio;
use App\Http\Requests\Paquetes\CitasNotificaciones\CU27_GestionarPagosReembolsos\ProcesarPagoRequest;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use App\Nucleo\Errores\RespuestaApi;

class GestionarPagosReembolsosControlador extends Controller
{
    public function __construct(
        protected GestionarPagosReembolsosServicio $servicio
    ) {}

    public function procesarPago(ProcesarPagoRequest $request): JsonResponse
    {
        try {
            $usuario = $request->attributes->get('usuario_autenticado');
            $datos = $request->validated();
            $resultado = $this->servicio->procesarDepositoGarantia(
                (int)$datos['id_cita'],
                $datos,
                $usuario
            );

            return RespuestaApi::exito(
                $resultado,
                'Depósito de garantía procesado y confirmado exitosamente',
                201
            );
        } catch (\Exception $e) {
            $codigo = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            return RespuestaApi::error($e->getMessage(), $codigo);
        }
    }

    public function procesarReembolso(Request $request, int $id_cita): JsonResponse
    {
        try {
            $usuario = $request->attributes->get('usuario_autenticado');
            $motivo = (string)$request->input('motivo', '');

            $resultado = $this->servicio->procesarReembolsoORetencion($id_cita, $usuario, $motivo);

            return RespuestaApi::exito(
                $resultado,
                $resultado['mensaje'] ?? 'Evaluación de reembolso/retención procesada'
            );
        } catch (\Exception $e) {
            $codigo = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            return RespuestaApi::error($e->getMessage(), $codigo);
        }
    }

    public function consultarPorCita(Request $request, int $id_cita): JsonResponse
    {
        try {
            $usuario = $request->attributes->get('usuario_autenticado');

            // Blindaje IDOR (RN19): Validar pertenencia de la cita si el usuario es paciente
            if (strtolower($usuario?->rol ?? '') === 'paciente') {
                $idPacienteUsuario = (int)($usuario->id_paciente ?? 0);
                if (!$idPacienteUsuario) {
                    $paciente = DB::table('pacientes')->where('id_usuario', $usuario->id_usuario)->first();
                    $idPacienteUsuario = (int)($paciente?->id_paciente ?? 0);
                }

                $cita = DB::table('citas')->where('id_cita', $id_cita)->first();
                if (!$cita) {
                    return RespuestaApi::error('Cita no encontrada.', 404);
                }

                if ((int)$cita->id_paciente !== $idPacienteUsuario) {
                    return RespuestaApi::error('No tiene autorización para consultar los pagos de otro paciente.', 403);
                }
            }

            $resultado = $this->servicio->consultarPagoPorCita($id_cita);

            if (!$resultado) {
                return RespuestaApi::error('No se registra depósito ni pago para la cita indicada.', 404);
            }

            return RespuestaApi::exito($resultado);
        } catch (\Exception $e) {
            $codigo = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            return RespuestaApi::error($e->getMessage(), $codigo);
        }
    }
}
