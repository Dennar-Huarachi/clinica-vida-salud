<?php

namespace App\Http\Controllers\Paquetes\CitasNotificaciones\CU12_GestionarCitas;

use App\Paquetes\CitasNotificaciones\CU12_GestionarCitas\GestionarCitasServicio;
use App\Http\Requests\Paquetes\CitasNotificaciones\CU12_GestionarCitas\CrearCitaRequest;
use App\Http\Requests\Paquetes\CitasNotificaciones\CU12_GestionarCitas\ReprogramarCitaRequest;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use App\Nucleo\Errores\RespuestaApi;

class GestionarCitasControlador extends Controller
{
    public function __construct(
        protected GestionarCitasServicio $servicio
    ) {}

    public function index(Request $request): JsonResponse
    {
        $usuario = $request->attributes->get('usuario_autenticado');
        $idPaciente = $request->query('id_paciente') ? (int)$request->query('id_paciente') : null;
        $idMedico = $request->query('id_medico') ? (int)$request->query('id_medico') : null;

        // Blindaje IDOR (RN19): Si es rol paciente, forzar exclusivamente su propio id_paciente
        if (strtolower($usuario?->rol ?? '') === 'paciente') {
            $idPaciente = (int)($usuario->id_paciente ?? 0);
            if (!$idPaciente && !empty($usuario->id_persona)) {
                $paciente = DB::table('pacientes')->where('id_persona', $usuario->id_persona)->first();
                $idPaciente = (int)($paciente?->id_paciente ?? 0);
            }
            if (!$idPaciente) {
                return RespuestaApi::error('Perfil de paciente no vinculado al usuario en sesión.', 403);
            }
        }

        // Si es rol médico, forzar su propio id_medico si no es administrador
        if (strtolower($usuario?->rol ?? '') === 'medico') {
            $idMedico = $usuario->id_medico;
        }

        $citas = $this->servicio->listar(
            $request->query('fecha'),
            $idMedico,
            $idPaciente,
            $request->query('estado')
        );

        return RespuestaApi::exito($citas);
    }

    public function store(CrearCitaRequest $request): JsonResponse
    {
        try {
            $usuario = $request->attributes->get('usuario_autenticado');
            $datos = $request->validated();

            // Blindaje IDOR (RN19): Forzar incondicionalmente el id_paciente autenticado
            if (strtolower($usuario?->rol ?? '') === 'paciente') {
                $idPaciente = (int)($usuario->id_paciente ?? 0);
                if (!$idPaciente && !empty($usuario->id_persona)) {
                    $paciente = DB::table('pacientes')->where('id_persona', $usuario->id_persona)->first();
                    $idPaciente = (int)($paciente?->id_paciente ?? 0);
                }
                if (!$idPaciente) {
                    return RespuestaApi::error('Perfil de paciente no vinculado al usuario en sesión.', 403);
                }
                $datos['id_paciente'] = $idPaciente;
            }

            $resultado = $this->servicio->crear($datos, $usuario?->id_usuario);
            return RespuestaApi::exito($resultado, 'Cita reservada satisfactoriamente', 201);
        } catch (\Throwable $e) {
            $codigo = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            return RespuestaApi::error($e->getMessage(), $codigo);
        }
    }

    public function reprogramar(ReprogramarCitaRequest $request, int $id): JsonResponse
    {
        try {
            $usuario = $request->attributes->get('usuario_autenticado');
            // Pasar objeto de usuario para validación estricta de propiedad de cita (RN19)
            $resultado = $this->servicio->reprogramar($id, $request->validated(), $usuario);
            return RespuestaApi::exito($resultado, 'Cita reprogramada exitosamente');
        } catch (\Throwable $e) {
            $codigo = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            return RespuestaApi::error($e->getMessage(), $codigo);
        }
    }

    public function cancelar(Request $request, int $id): JsonResponse
    {
        try {
            $usuario = $request->attributes->get('usuario_autenticado');
            $motivo = $request->input('motivo', 'Cancelado a solicitud');
            $this->servicio->cancelar($id, $motivo, $usuario);
            return RespuestaApi::exito(null, 'Cita cancelada correctamente');
        } catch (\Throwable $e) {
            $codigo = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            return RespuestaApi::error($e->getMessage(), $codigo);
        }
    }

    public function confirmar(Request $request, int $id): JsonResponse
    {
        try {
            $usuario = $request->attributes->get('usuario_autenticado');
            $resultado = $this->servicio->confirmarCita($id, $usuario);
            return RespuestaApi::exito($resultado, 'Cita confirmada correctamente');
        } catch (\Throwable $e) {
            $codigo = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            return RespuestaApi::error($e->getMessage(), $codigo);
        }
    }

    /**
     * Consulta el detalle de una cita médica específica (RN19 Anti-IDOR).
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $usuario = $request->attributes->get('usuario_autenticado');
        if (!$usuario) {
            return RespuestaApi::error('Sesión no identificada.', 401);
        }

        $cita = DB::table('citas')
            ->join('estados_cita', 'citas.id_estado_cita', '=', 'estados_cita.id_estado_cita')
            ->join('medicos', 'citas.id_medico', '=', 'medicos.id_medico')
            ->join('personas as p_medico', 'medicos.id_persona', '=', 'p_medico.id_persona')
            ->join('pacientes', 'citas.id_paciente', '=', 'pacientes.id_paciente')
            ->join('personas as p_paciente', 'pacientes.id_persona', '=', 'p_paciente.id_persona')
            ->join('especialidades', 'citas.id_especialidad', '=', 'especialidades.id_especialidad')
            ->where('citas.id_cita', $id)
            ->select(
                'citas.*',
                'estados_cita.nombre as estado_nombre',
                'estados_cita.codigo as estado_codigo',
                'p_medico.nombres as medico_nombres',
                'p_medico.apellidos as medico_apellidos',
                'p_paciente.nombres as paciente_nombres',
                'p_paciente.apellidos as paciente_apellidos',
                'especialidades.nombre as especialidad_nombre'
            )
            ->first();

        if (!$cita) {
            return RespuestaApi::error('Cita médica no encontrada.', 404);
        }

        $rol = strtolower($usuario->rol ?? '');
        if ($rol === 'paciente') {
            $idPacienteUsuario = (int)($usuario->id_paciente ?? 0);
            if (!$idPacienteUsuario && !empty($usuario->id_persona)) {
                $p = DB::table('pacientes')->where('id_persona', $usuario->id_persona)->first();
                $idPacienteUsuario = (int)($p?->id_paciente ?? 0);
            }
            if ((int)$cita->id_paciente !== $idPacienteUsuario) {
                return RespuestaApi::error('Acceso denegado: no tiene autorización para ver la cita de otro paciente.', 403);
            }
        } elseif ($rol === 'medico') {
            $idMedicoUsuario = (int)($usuario->id_medico ?? 0);
            if (!$idMedicoUsuario && !empty($usuario->id_persona)) {
                $m = DB::table('medicos')->where('id_persona', $usuario->id_persona)->first();
                $idMedicoUsuario = (int)($m?->id_medico ?? 0);
            }
            if ((int)$cita->id_medico !== $idMedicoUsuario) {
                return RespuestaApi::error('Acceso denegado: no tiene autorización para ver citas asignadas a otro profesional.', 403);
            }
        }

        return RespuestaApi::exito($cita);
    }
}
