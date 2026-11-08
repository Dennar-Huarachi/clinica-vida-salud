<?php

namespace App\Paquetes\CitasNotificaciones\CU27_GestionarPagosReembolsos;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Nucleo\Bitacora\ServicioBitacora;

class GestionarPagosReembolsosServicio
{
    /**
     * Procesa y registra atómicamente el pago simulado del depósito de garantía (D17, RN15).
     */
    public function procesarDepositoGarantia(int $idCita, array $datosPago, $usuarioOperador = null): array
    {
        return DB::transaction(function () use ($idCita, $datosPago, $usuarioOperador) {
            $cita = DB::table('citas')->where('id_cita', $idCita)->lockForUpdate()->first();
            if (!$cita) {
                throw new \Exception("La cita médica referenciada no existe.", 404);
            }

            // Blindaje IDOR (RN19): Si es rol paciente, verificar propiedad de la cita
            if (is_object($usuarioOperador) && strtolower($usuarioOperador->rol ?? '') === 'paciente') {
                $idPacienteUsuario = (int)($usuarioOperador->id_paciente ?? 0);
                if (!$idPacienteUsuario && !empty($usuarioOperador->id_persona)) {
                    $paciente = DB::table('pacientes')->where('id_persona', $usuarioOperador->id_persona)->first();
                    $idPacienteUsuario = (int)($paciente?->id_paciente ?? 0);
                }
                if ((int)$cita->id_paciente !== $idPacienteUsuario) {
                    throw new \Exception('No tiene autorización para procesar pagos sobre citas de otro paciente.', 403);
                }
            }

            // Verificar si la cita ya cuenta con un pago completado
            $pagoExistente = DB::table('pagos_cita')
                ->where('id_cita', $idCita)
                ->where('estado_pago', 'completado')
                ->first();

            if ($pagoExistente) {
                return [
                    'id_pago' => $pagoExistente->id_pago,
                    'id_cita' => $idCita,
                    'codigo_cita' => $cita->codigo_cita,
                    'nro_transaccion' => $pagoExistente->nro_transaccion,
                    'monto' => (float)$pagoExistente->monto,
                    'metodo_pago' => $pagoExistente->metodo_pago,
                    'estado_pago' => $pagoExistente->estado_pago,
                    'fecha_pago' => $pagoExistente->fecha_pago,
                    'comprobante' => [
                        'titulo' => 'Comprobante Digital de Garantía de Reserva',
                        'institucion' => 'Clínica Médica Vida Salud',
                        'nro_transaccion' => $pagoExistente->nro_transaccion,
                        'codigo_cita' => $cita->codigo_cita,
                        'fecha_turno' => $cita->fecha_cita . ' ' . $cita->hora_inicio,
                        'monto_bs' => (float)$pagoExistente->monto,
                        'estado' => 'COMPLETADO',
                        'politica_rn15' => 'Reembolso del 100% disponible con al menos 12 horas de anticipación.',
                    ],
                ];
            }

            // Obtener monto configurado en el sistema
            $montoParam = DB::table('parametros_sistema')->where('clave', 'MONTO_FIJO_RESERVA_CITA')->value('valor') ?: '50.00';
            $montoReserva = isset($datosPago['monto']) && (float)$datosPago['monto'] > 0
                ? (float)$datosPago['monto']
                : (float)$montoParam;

            // Normalización de método de pago
            $metodo = $datosPago['metodo_pago'] ?? 'qr_transferencia';
            if ($metodo === 'qr') $metodo = 'qr_transferencia';
            if ($metodo === 'tarjeta') $metodo = 'tarjeta_debito_credito';

            $nroTransaccion = 'TX-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));
            $ahora = now();

            $idUsuario = is_object($usuarioOperador) ? ($usuarioOperador->id_usuario ?? null) : $usuarioOperador;

            $detallesPasarela = $datosPago['detalles_pasarela'] ?? [
                'pasarela' => 'simulada_interoperable',
                'referencia' => $datosPago['referencia_simulada'] ?? ('SIM-' . rand(100000, 999999)),
                'banco' => $metodo === 'qr_transferencia' ? 'Simple QR Interoperable' : 'Pasarela Tarjeta Simulada',
                'monto_bs' => $montoReserva,
            ];

            $idPago = DB::table('pagos_cita')->insertGetId([
                'id_cita' => $idCita,
                'monto' => $montoReserva,
                'metodo_pago' => $metodo,
                'nro_transaccion' => $nroTransaccion,
                'estado_pago' => 'completado',
                'detalles_pasarela' => is_string($detallesPasarela) ? $detallesPasarela : json_encode($detallesPasarela),
                'fecha_pago' => $ahora,
                'created_at' => $ahora,
                'updated_at' => $ahora,
            ], 'id_pago');

            // Actualizar cita con id_pago y confirmación de pago
            DB::table('citas')->where('id_cita', $idCita)->update([
                'id_pago' => $idPago,
                'pago_confirmado' => true,
                'updated_at' => $ahora,
            ]);

            ServicioBitacora::registrar(
                'CU27_GestionarPagosReembolsos',
                'PAGO_GARANTIA_RESERVA_COMPLETADO',
                'pagos_cita',
                (string)$idPago,
                null,
                [
                    'id_cita' => $idCita,
                    'codigo_cita' => $cita->codigo_cita,
                    'nro_transaccion' => $nroTransaccion,
                    'monto' => $montoReserva,
                    'metodo_pago' => $metodo,
                ],
                $idUsuario
            );

            return [
                'id_pago' => $idPago,
                'id_cita' => $idCita,
                'codigo_cita' => $cita->codigo_cita,
                'nro_transaccion' => $nroTransaccion,
                'monto' => $montoReserva,
                'metodo_pago' => $metodo,
                'estado_pago' => 'completado',
                'fecha_pago' => $ahora->toIso8601String(),
                'comprobante' => [
                    'titulo' => 'Comprobante Digital de Garantía de Reserva',
                    'institucion' => 'Clínica Médica Vida Salud',
                    'nro_transaccion' => $nroTransaccion,
                    'codigo_cita' => $cita->codigo_cita,
                    'fecha_turno' => $cita->fecha_cita . ' ' . $cita->hora_inicio,
                    'monto_bs' => $montoReserva,
                    'estado' => 'COMPLETADO',
                    'politica_rn15' => 'Reembolso del 100% disponible con al menos 12 horas de anticipación.',
                ],
            ];
        });
    }

    /**
     * Procesa la evaluación de reembolso o penalización con retención (RN15).
     */
    public function procesarReembolsoORetencion(int $idCita, $usuarioOperador = null, string $motivo = ''): array
    {
        return DB::transaction(function () use ($idCita, $usuarioOperador, $motivo) {
            $cita = DB::table('citas')->where('id_cita', $idCita)->lockForUpdate()->first();
            if (!$cita) {
                throw new \Exception("La cita médica no existe.", 404);
            }

            // Blindaje IDOR (RN19): Si es rol paciente, verificar propiedad de la cita
            if (is_object($usuarioOperador) && strtolower($usuarioOperador->rol ?? '') === 'paciente') {
                $idPacienteUsuario = (int)($usuarioOperador->id_paciente ?? 0);
                if (!$idPacienteUsuario && !empty($usuarioOperador->id_persona)) {
                    $paciente = DB::table('pacientes')->where('id_persona', $usuarioOperador->id_persona)->first();
                    $idPacienteUsuario = (int)($paciente?->id_paciente ?? 0);
                }
                if ((int)$cita->id_paciente !== $idPacienteUsuario) {
                    throw new \Exception('No tiene autorización para solicitar o procesar reembolsos sobre citas de otro paciente.', 403);
                }
            }

            $pago = DB::table('pagos_cita')->where('id_cita', $idCita)->lockForUpdate()->first();
            if (!$pago) {
                return [
                    'id_cita' => $idCita,
                    'estado_pago' => 'sin_pago',
                    'mensaje' => 'La cita no registra pagos asociados.',
                ];
            }

            // Calcular diferencia de horas respecto al turno
            $fechaHoraCita = Carbon::parse($cita->fecha_cita . ' ' . $cita->hora_inicio);
            $horasDiferencia = now()->diffInHours($fechaHoraCita, false);

            $paramHoras = DB::table('parametros_sistema')->where('clave', 'HORAS_ANTICIPACION_CANCELAR')->value('valor') ?: 12;
            $horasMinimas = (int)$paramHoras;

            $idUsuario = is_object($usuarioOperador) ? ($usuarioOperador->id_usuario ?? null) : $usuarioOperador;

            if ($horasDiferencia >= $horasMinimas) {
                // Reembolso oportuno (RN15)
                DB::table('pagos_cita')->where('id_pago', $pago->id_pago)->update([
                    'estado_pago' => 'reembolsado',
                    'fecha_reembolso' => now(),
                    'updated_at' => now(),
                ]);

                ServicioBitacora::registrar(
                    'CU27_GestionarPagosReembolsos',
                    'REEMBOLSO_RESERVA_RN15',
                    'pagos_cita',
                    (string)$pago->id_pago,
                    ['estado_pago' => $pago->estado_pago],
                    [
                        'id_cita' => $idCita,
                        'estado_pago' => 'reembolsado',
                        'monto' => (float)$pago->monto,
                        'nro_transaccion' => $pago->nro_transaccion,
                        'horas_anticipacion' => $horasDiferencia,
                        'motivo' => $motivo ?: 'Cancelación anticipada con derecho a reembolso (RN15)',
                    ],
                    $idUsuario
                );

                return [
                    'id_cita' => $idCita,
                    'id_pago' => $pago->id_pago,
                    'estado_pago' => 'reembolsado',
                    'monto' => (float)$pago->monto,
                    'nro_transaccion' => $pago->nro_transaccion,
                    'horas_anticipacion' => $horasDiferencia,
                    'mensaje' => 'Depósito de garantía reembolsado al paciente por cancelación oportuna.',
                ];
            } else {
                // Penalización por cancelación tardía (< 12h) o inasistencia (RN15)
                DB::table('pagos_cita')->where('id_pago', $pago->id_pago)->update([
                    'estado_pago' => 'retenido',
                    'updated_at' => now(),
                ]);

                ServicioBitacora::registrar(
                    'CU27_GestionarPagosReembolsos',
                    'PENALIZACION_RETENCION_PAGO_RN15',
                    'pagos_cita',
                    (string)$pago->id_pago,
                    ['estado_pago' => $pago->estado_pago],
                    [
                        'id_cita' => $idCita,
                        'estado_pago' => 'retenido',
                        'monto_retenido' => (float)$pago->monto,
                        'nro_transaccion' => $pago->nro_transaccion,
                        'horas_restantes' => $horasDiferencia,
                        'motivo' => $motivo ?: 'Penalización por cancelación tardía o inasistencia (< 12h, RN15)',
                    ],
                    $idUsuario
                );

                return [
                    'id_cita' => $idCita,
                    'id_pago' => $pago->id_pago,
                    'estado_pago' => 'retenido',
                    'monto' => (float)$pago->monto,
                    'nro_transaccion' => $pago->nro_transaccion,
                    'horas_anticipacion' => $horasDiferencia,
                    'mensaje' => 'Depósito de garantía retenido por cancelación tardía o inasistencia (menos de 12 horas de anticipación).',
                ];
            }
        });
    }

    /**
     * Consulta el pago y comprobante asociado a una cita médica.
     */
    public function consultarPagoPorCita(int $idCita): ?array
    {
        $pago = DB::table('pagos_cita')
            ->join('citas', 'pagos_cita.id_cita', '=', 'citas.id_cita')
            ->join('pacientes', 'citas.id_paciente', '=', 'pacientes.id_paciente')
            ->join('personas as per_paciente', 'pacientes.id_persona', '=', 'per_paciente.id_persona')
            ->where('pagos_cita.id_cita', $idCita)
            ->select(
                'pagos_cita.*',
                'citas.codigo_cita',
                'citas.fecha_cita',
                'citas.hora_inicio',
                'citas.hora_fin',
                'per_paciente.nombres as paciente_nombres',
                'per_paciente.apellidos as paciente_apellidos',
                'per_paciente.ci as paciente_ci'
            )
            ->first();

        if (!$pago) {
            return null;
        }

        $detalles = is_string($pago->detalles_pasarela)
            ? json_decode($pago->detalles_pasarela, true)
            : $pago->detalles_pasarela;

        return [
            'id_pago' => $pago->id_pago,
            'id_cita' => $pago->id_cita,
            'codigo_cita' => $pago->codigo_cita,
            'monto' => (float)$pago->monto,
            'metodo_pago' => $pago->metodo_pago,
            'nro_transaccion' => $pago->nro_transaccion,
            'estado_pago' => $pago->estado_pago,
            'fecha_pago' => $pago->fecha_pago,
            'fecha_reembolso' => $pago->fecha_reembolso,
            'detalles_pasarela' => $detalles,
            'paciente' => [
                'nombres' => $pago->paciente_nombres,
                'apellidos' => $pago->paciente_apellidos,
                'ci' => $pago->paciente_ci,
            ],
            'comprobante' => [
                'nro_transaccion' => $pago->nro_transaccion,
                'codigo_cita' => $pago->codigo_cita,
                'fecha_turno' => $pago->fecha_cita . ' ' . $pago->hora_inicio,
                'monto_bs' => (float)$pago->monto,
                'estado' => strtoupper($pago->estado_pago),
            ],
        ];
    }
}
