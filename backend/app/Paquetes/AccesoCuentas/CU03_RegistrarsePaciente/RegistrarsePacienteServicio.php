<?php

namespace App\Paquetes\AccesoCuentas\CU03_RegistrarsePaciente;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Nucleo\Bitacora\ServicioBitacora;

class RegistrarsePacienteServicio
{
    /**
     * Registra un nuevo paciente en una transacción atómica (personas + usuarios + pacientes).
     */
    public function registrar(array $datos): array
    {
        return DB::transaction(function () use ($datos) {
            $ci = trim($datos['ci']);
            $personaExistente = DB::table('personas')->where('ci', $ci)->first();

            if ($personaExistente) {
                // Verificar si ya tiene usuario asignado
                $usuarioExiste = DB::table('usuarios')->where('id_persona', $personaExistente->id_persona)->exists();
                if ($usuarioExiste) {
                    throw new \Exception('La cédula de identidad ya se encuentra registrada con una cuenta de usuario activa.', 422);
                }

                // Normalizar nombres y apellidos para comparar con la ficha clínica existente
                $normalizar = fn($txt) => mb_strtolower(trim(preg_replace('/\s+/', ' ', strtr($txt, [
                    'á'=>'a','é'=>'e','í'=>'i','ó'=>'o','ú'=>'u','Á'=>'a','É'=>'e','Í'=>'i','Ó'=>'o','Ú'=>'u','ñ'=>'n','Ñ'=>'n'
                ]))));

                $nombresCoinciden = str_contains($normalizar($personaExistente->nombres), $normalizar($datos['nombres']))
                    || str_contains($normalizar($datos['nombres']), $normalizar($personaExistente->nombres));
                $apellidosCoinciden = str_contains($normalizar($personaExistente->apellidos), $normalizar($datos['apellidos']))
                    || str_contains($normalizar($datos['apellidos']), $normalizar($personaExistente->apellidos));

                if (!$nombresCoinciden || !$apellidosCoinciden) {
                    throw new \Exception('Los datos personales ingresados no coinciden con la ficha clínica registrada para este documento de identidad. Acérquese a recepción.', 422);
                }

                // Coinciden: vincular a la persona y ficha clínica existente
                $idPersona = $personaExistente->id_persona;
                DB::table('personas')->where('id_persona', $idPersona)->update([
                    'telefono' => $datos['telefono'] ?? $personaExistente->telefono,
                    'correo' => $datos['correo'] ?? $personaExistente->correo,
                    'direccion' => $datos['direccion'] ?? $personaExistente->direccion,
                    'updated_at' => now(),
                ]);

                $paciente = DB::table('pacientes')->where('id_persona', $idPersona)->first();
                $idPaciente = $paciente ? $paciente->id_paciente : null;
                $codigoHistoria = $paciente ? $paciente->codigo_historia : 'HC-' . date('Y') . '-' . str_pad($idPersona, 5, '0', STR_PAD_LEFT);

                if (!$paciente) {
                    $idPaciente = DB::table('pacientes')->insertGetId([
                        'id_persona' => $idPersona,
                        'codigo_historia' => $codigoHistoria,
                        'grupo_sanguineo' => $datos['grupo_sanguineo'] ?? null,
                        'estado' => 'activo',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ], 'id_paciente');

                    DB::table('informacion_medica_paciente')->insert([
                        'id_paciente' => $idPaciente,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            } else {
                // 1. Crear persona
                $idPersona = DB::table('personas')->insertGetId([
                    'ci' => $ci,
                    'nombres' => trim($datos['nombres']),
                    'apellidos' => trim($datos['apellidos']),
                    'fecha_nacimiento' => $datos['fecha_nacimiento'],
                    'sexo' => $datos['sexo'],
                    'telefono' => $datos['telefono'],
                    'correo' => $datos['correo'],
                    'direccion' => $datos['direccion'] ?? null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ], 'id_persona');

                // 2. Crear paciente con código de historia único
                $codigoHistoria = 'HC-' . date('Y') . '-' . str_pad($idPersona, 5, '0', STR_PAD_LEFT);
                $idPaciente = DB::table('pacientes')->insertGetId([
                    'id_persona' => $idPersona,
                    'codigo_historia' => $codigoHistoria,
                    'grupo_sanguineo' => $datos['grupo_sanguineo'] ?? null,
                    'estado' => 'activo',
                    'created_at' => now(),
                    'updated_at' => now(),
                ], 'id_paciente');

                // 3. Inicializar ficha médica vacía
                DB::table('informacion_medica_paciente')->insert([
                    'id_paciente' => $idPaciente,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Obtener rol de paciente (id_rol = 4)
            $rolPaciente = DB::table('roles')->where('nombre', 'paciente')->first();
            $idRol = $rolPaciente ? $rolPaciente->id_rol : 4;

            // Crear usuario
            $token = Str::random(60);
            $idUsuario = DB::table('usuarios')->insertGetId([
                'id_persona' => $idPersona,
                'id_rol' => $idRol,
                'nombre_usuario' => $datos['nombre_usuario'],
                'correo' => $datos['correo'],
                'contrasena_hash' => Hash::make($datos['contrasena']),
                'debe_cambiar_contrasena' => false,
                'estado' => 'activo',
                'token_sesion' => $token,
                'ultimo_acceso' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ], 'id_usuario');

            ServicioBitacora::registrar(
                'CU03_RegistrarsePaciente',
                $personaExistente ? 'VINCULAR_CUENTA_PACIENTE' : 'AUTORREGISTRO_PACIENTE',
                'pacientes',
                (string)$idPaciente,
                null,
                ['codigo_historia' => $codigoHistoria, 'id_usuario' => $idUsuario, 'ci' => $ci],
                $idUsuario
            );

            return [
                'token' => $token,
                'usuario' => [
                    'id_usuario' => $idUsuario,
                    'nombre_usuario' => $datos['nombre_usuario'],
                    'correo' => $datos['correo'],
                    'rol' => 'paciente',
                    'nombres' => $datos['nombres'],
                    'apellidos' => $datos['apellidos'],
                    'id_paciente' => $idPaciente,
                    'codigo_historia' => $codigoHistoria,
                ]
            ];
        });
    }
}
