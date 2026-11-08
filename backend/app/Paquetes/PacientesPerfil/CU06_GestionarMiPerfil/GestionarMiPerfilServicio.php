<?php

namespace App\Paquetes\PacientesPerfil\CU06_GestionarMiPerfil;

use Illuminate\Support\Facades\DB;
use App\Nucleo\Bitacora\ServicioBitacora;

class GestionarMiPerfilServicio
{
    /**
     * Consulta el perfil consolidado del usuario autenticado en sesión.
     * Aplica la regla RN19 (Anti-IDOR) aislando los datos exclusivamente a la identidad activa.
     */
    public function obtenerPerfil(object $usuario): array
    {
        $persona = DB::table('personas')->where('id_persona', $usuario->id_persona)->first();

        // Resolver paciente vinculado a la persona si existe
        $paciente = DB::table('pacientes')->where('id_persona', $usuario->id_persona)->first();
        $idPaciente = $paciente ? $paciente->id_paciente : $usuario->id_paciente ?? null;

        $infoMedica = null;
        $contactoEmergencia = null;

        if ($idPaciente) {
            $infoMedica = DB::table('informacion_medica_paciente')
                ->where('id_paciente', $idPaciente)
                ->first();

            $contactoEmergencia = DB::table('contactos_emergencia')
                ->where('id_paciente', $idPaciente)
                ->where('es_principal', true)
                ->first();
        }

        // Resolver médico si corresponde
        $medico = DB::table('medicos')->where('id_persona', $usuario->id_persona)->first();

        return [
            'usuario' => [
                'id_usuario' => $usuario->id_usuario,
                'nombre_usuario' => $usuario->nombre_usuario,
                'correo' => $usuario->correo,
                'rol' => $usuario->rol,
                'ultimo_acceso' => $usuario->ultimo_acceso ?? null,
            ],
            'persona' => $persona,
            'paciente' => $paciente,
            'informacion_medica' => $infoMedica,
            'contacto_emergencia' => $contactoEmergencia,
            'medico' => $medico,
        ];
    }

    /**
     * Actualiza atómicamente la información de contacto, médica declarada y contacto de emergencia.
     * RN19: Los identificadores id_persona e id_paciente provienen estrictamente de la sesión.
     */
    public function actualizar(object $usuario, array $datos): void
    {
        DB::transaction(function () use ($usuario, $datos) {
            // 1. Actualizar canales de contacto en personas
            DB::table('personas')->where('id_persona', $usuario->id_persona)->update([
                'telefono' => $datos['telefono'] ?? null,
                'correo' => $datos['correo'],
                'direccion' => $datos['direccion'] ?? null,
                'updated_at' => now(),
            ]);

            // 2. Actualizar correo en la cuenta de usuario
            DB::table('usuarios')->where('id_usuario', $usuario->id_usuario)->update([
                'correo' => $datos['correo'],
                'updated_at' => now(),
            ]);

            // 3. Resolver paciente vinculado a la persona
            $paciente = DB::table('pacientes')->where('id_persona', $usuario->id_persona)->first();
            $idPaciente = $paciente ? $paciente->id_paciente : $usuario->id_paciente ?? null;

            if ($idPaciente) {
                // Actualizar grupo sanguíneo en la ficha del paciente si se especifica
                if (!empty($datos['grupo_sanguineo'])) {
                    DB::table('pacientes')->where('id_paciente', $idPaciente)->update([
                        'grupo_sanguineo' => $datos['grupo_sanguineo'],
                        'updated_at' => now(),
                    ]);
                }

                // Actualizar o insertar información médica declarada
                DB::table('informacion_medica_paciente')->updateOrInsert(
                    ['id_paciente' => $idPaciente],
                    [
                        'alergias' => $datos['alergias'] ?? null,
                        'enfermedades_cronicas' => $datos['enfermedades_cronicas'] ?? null,
                        'medicamentos_actuales' => $datos['medicamentos_actuales'] ?? null,
                        'antecedentes_familiares' => $datos['antecedentes_familiares'] ?? null,
                        'observaciones' => $datos['observaciones_medicas'] ?? null,
                        'updated_at' => now(),
                    ]
                );

                // Actualizar o insertar contacto de emergencia principal
                if (!empty($datos['contacto_nombre'])) {
                    DB::table('contactos_emergencia')->updateOrInsert(
                        ['id_paciente' => $idPaciente, 'es_principal' => true],
                        [
                            'nombre_completo' => $datos['contacto_nombre'],
                            'relacion' => $datos['contacto_relacion'] ?? 'Familiar',
                            'telefono' => $datos['contacto_telefono'] ?? ($datos['telefono'] ?? '0'),
                            'direccion' => $datos['contacto_direccion'] ?? null,
                            'es_principal' => true,
                            'updated_at' => now(),
                        ]
                    );
                }
            }

            // 4. Registro inmutable en bitácora de auditoría (RN21)
            ServicioBitacora::registrar(
                'CU06_GestionarMiPerfil',
                'ACTUALIZAR_MI_PERFIL',
                'personas',
                (string)$usuario->id_persona,
                null,
                [
                    'correo' => $datos['correo'],
                    'telefono' => $datos['telefono'] ?? null,
                    'direccion' => $datos['direccion'] ?? null,
                    'grupo_sanguineo' => $datos['grupo_sanguineo'] ?? null,
                    'tiene_alergias' => !empty($datos['alergias']),
                ],
                $usuario->id_usuario
            );
        });
    }
}
