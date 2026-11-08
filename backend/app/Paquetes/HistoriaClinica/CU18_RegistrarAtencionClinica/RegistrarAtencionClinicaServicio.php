<?php

namespace App\Paquetes\HistoriaClinica\CU18_RegistrarAtencionClinica;

use Illuminate\Support\Facades\DB;
use App\Nucleo\Bitacora\ServicioBitacora;

class RegistrarAtencionClinicaServicio
{
    /**
     * Registra la atención clínica dentro de una transacción atómica y actualiza
     * de forma automática e inmediata el estado de la cita médica a 'atendida' (id=4).
     * Aplica la regla RN19 verificando que la cita pertenezca al médico en sesión.
     */
    public function registrar(array $datos, ?int $idUsuarioOperador = null, ?int $idMedicoOperador = null): int
    {
        return DB::transaction(function () use ($datos, $idUsuarioOperador, $idMedicoOperador) {
            $idCita = (int)$datos['id_cita'];

            // 1. Bloqueo pesimista de la cita
            $cita = DB::table('citas')->where('id_cita', $idCita)->lockForUpdate()->first();
            if (!$cita) {
                throw new \Exception('La cita médica indicada no fue encontrada en el sistema.', 404);
            }

            // 2. Validación de aislamiento de médico (RN19)
            if ($idMedicoOperador && (int)$cita->id_medico !== (int)$idMedicoOperador) {
                throw new \Exception('Acceso denegado: esta cita médica corresponde a la agenda de otro profesional.', 403);
            }

            // 3. Verificar si ya cuenta con atención clínica registrada
            $atencionExistente = DB::table('atenciones_clinicas')->where('id_cita', $idCita)->first();
            if ($atencionExistente) {
                throw new \Exception('Esta cita médica ya cuenta con una atención clínica registrada previamente.', 400);
            }

            // 4. Insertar la atención médica en atenciones_clinicas
            $idAtencion = DB::table('atenciones_clinicas')->insertGetId([
                'id_cita' => $idCita,
                'id_paciente' => $cita->id_paciente,
                'id_medico' => $cita->id_medico,
                'motivo_atencion' => $datos['motivo_atencion'],
                'examen_fisico' => $datos['examen_fisico'] ?? null,
                'diagnostico' => $datos['diagnostico'],
                'tratamiento_indicaciones' => $datos['tratamiento_indicaciones'],
                'receta_medica' => $datos['receta_medica'] ?? null,
                'fecha_atencion' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ], 'id_atencion');

            // 5. Cambio automático de estado de la cita a 'atendida' (id=5)
            $estadoAtendida = DB::table('estados_cita')->where('codigo', 'atendida')->first();
            $idEstadoAtendida = $estadoAtendida ? (int)$estadoAtendida->id_estado_cita : 5;

            DB::table('citas')->where('id_cita', $idCita)->update([
                'id_estado_cita' => $idEstadoAtendida,
                'estado' => 'activo',
                'updated_at' => now(),
            ]);

            // 6. Registro inmutable en bitácora de auditoría (RN21)
            ServicioBitacora::registrar(
                'CU18_RegistrarAtencionClinica',
                'REGISTRAR_ATENCION_CLINICA',
                'atenciones_clinicas',
                (string)$idAtencion,
                ['id_estado_cita_anterior' => $cita->id_estado_cita],
                [
                    'id_atencion' => $idAtencion,
                    'id_cita' => $idCita,
                    'id_paciente' => $cita->id_paciente,
                    'id_estado_cita_nuevo' => $idEstadoAtendida,
                    'diagnostico' => $datos['diagnostico'],
                ],
                $idUsuarioOperador
            );

            return $idAtencion;
        });
    }

    /**
     * Consulta el detalle clínico de una atención realizada por ID de cita.
     */
    public function consultarPorCita(int $idCita): ?object
    {
        return DB::table('atenciones_clinicas')
            ->join('citas', 'atenciones_clinicas.id_cita', '=', 'citas.id_cita')
            ->join('medicos', 'atenciones_clinicas.id_medico', '=', 'medicos.id_medico')
            ->join('personas as p_medico', 'medicos.id_persona', '=', 'p_medico.id_persona')
            ->join('pacientes', 'atenciones_clinicas.id_paciente', '=', 'pacientes.id_paciente')
            ->join('personas as p_paciente', 'pacientes.id_persona', '=', 'p_paciente.id_persona')
            ->join('especialidades', 'citas.id_especialidad', '=', 'especialidades.id_especialidad')
            ->where('atenciones_clinicas.id_cita', $idCita)
            ->select(
                'atenciones_clinicas.*',
                'citas.codigo_cita',
                'citas.fecha_cita',
                'citas.hora_inicio',
                'citas.hora_fin',
                'p_medico.nombres as medico_nombres',
                'p_medico.apellidos as medico_apellidos',
                'especialidades.nombre as especialidad_nombre',
                'p_paciente.nombres as paciente_nombres',
                'p_paciente.apellidos as paciente_apellidos',
                'p_paciente.ci as paciente_ci',
                'pacientes.codigo_historia'
            )
            ->first();
    }
}
