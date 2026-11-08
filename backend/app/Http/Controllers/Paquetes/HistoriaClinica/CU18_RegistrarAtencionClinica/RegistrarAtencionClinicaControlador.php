<?php

namespace App\Http\Controllers\Paquetes\HistoriaClinica\CU18_RegistrarAtencionClinica;

use App\Paquetes\HistoriaClinica\CU18_RegistrarAtencionClinica\RegistrarAtencionClinicaServicio;
use App\Http\Requests\Paquetes\HistoriaClinica\CU18_RegistrarAtencionClinica\RegistrarAtencionRequest;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Nucleo\Errores\RespuestaApi;

class RegistrarAtencionClinicaControlador extends Controller
{
    public function __construct(
        protected RegistrarAtencionClinicaServicio $servicio
    ) {}

    /**
     * Registra la atención clínica y marca atómicamente la cita como atendida.
     * RN19: Asegura que el médico solo registre atenciones para sus propias citas agendadas.
     */
    public function store(RegistrarAtencionRequest $request): JsonResponse
    {
        try {
            $usuario = $request->attributes->get('usuario_autenticado');
            $idMedico = strtolower($usuario?->rol ?? '') === 'medico' ? (int)$usuario->id_medico : null;

            $id = $this->servicio->registrar($request->validated(), $usuario?->id_usuario, $idMedico);

            return RespuestaApi::exito(
                ['id_atencion' => $id],
                'Atención médica registrada exitosamente y estado de cita actualizado a atendida.',
                201
            );
        } catch (\Exception $e) {
            $codigo = $e->getCode() >= 400 && $e->getCode() <= 500 ? $e->getCode() : 400;
            return RespuestaApi::error('Error al registrar atención médica: ' . $e->getMessage(), $codigo);
        }
    }

    /**
     * Consulta el detalle de la atención médica vinculada a una cita.
     * RN19: Asegura que ni pacientes ni médicos vean atenciones ajenas.
     */
    public function showPorCita(Request $request, int $idCita): JsonResponse
    {
        try {
            $usuario = $request->attributes->get('usuario_autenticado');
            if (!$usuario) {
                return RespuestaApi::error('Sesión no identificada.', 401);
            }

            $atencion = $this->servicio->consultarPorCita($idCita);
            if (!$atencion) {
                return RespuestaApi::error('No se encontró atención médica registrada para esta cita.', 404);
            }

            $rol = strtolower($usuario->rol ?? '');
            if ($rol === 'paciente') {
                $idPac = (int)($usuario->id_paciente ?? 0);
                if (!$idPac && !empty($usuario->id_persona)) {
                    $p = DB::table('pacientes')->where('id_persona', $usuario->id_persona)->first();
                    $idPac = (int)($p?->id_paciente ?? 0);
                }
                if ((int)$atencion->id_paciente !== $idPac) {
                    return RespuestaApi::error('Acceso denegado: no tiene autorización para consultar la atención médica de otro paciente.', 403);
                }
            } elseif ($rol === 'medico') {
                $idMed = (int)($usuario->id_medico ?? 0);
                if (!$idMed && !empty($usuario->id_persona)) {
                    $m = DB::table('medicos')->where('id_persona', $usuario->id_persona)->first();
                    $idMed = (int)($m?->id_medico ?? 0);
                }
                if ((int)$atencion->id_medico !== $idMed) {
                    return RespuestaApi::error('Acceso denegado: no tiene autorización para consultar atenciones de otro profesional.', 403);
                }
            }

            return RespuestaApi::exito($atencion);
        } catch (\Exception $e) {
            return RespuestaApi::error('Error al consultar atención clínica: ' . $e->getMessage(), 500);
        }
    }
}
