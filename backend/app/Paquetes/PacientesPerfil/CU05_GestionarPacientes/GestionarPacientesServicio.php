<?php

namespace App\Paquetes\PacientesPerfil\CU05_GestionarPacientes;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Nucleo\Bitacora\ServicioBitacora;

class GestionarPacientesServicio
{
    public function listar(?string $termino = null, ?string $estado = null): array
    {
        $query = DB::table('pacientes')
            ->join('personas', 'pacientes.id_persona', '=', 'personas.id_persona')
            ->leftJoin('informacion_medica_paciente', 'pacientes.id_paciente', '=', 'informacion_medica_paciente.id_paciente')
            ->leftJoin('contactos_emergencia', function ($join) {
                $join->on('pacientes.id_paciente', '=', 'contactos_emergencia.id_paciente')
                     ->where('contactos_emergencia.es_principal', true);
            })
            ->select(
                'pacientes.id_paciente',
                'pacientes.codigo_historia',
                'pacientes.grupo_sanguineo',
                'pacientes.estado',
                'personas.id_persona',
                'personas.ci',
                'personas.nombres',
                'personas.apellidos',
                'personas.fecha_nacimiento',
                'personas.sexo',
                'personas.telefono',
                'personas.correo',
                'personas.direccion',
                'informacion_medica_paciente.alergias',
                'informacion_medica_paciente.enfermedades_cronicas',
                'contactos_emergencia.nombre_completo as contacto_nombre',
                'contactos_emergencia.relacion as contacto_relacion',
                'contactos_emergencia.telefono as contacto_telefono',
                'contactos_emergencia.nombre_completo as contacto_emergencia_nombre',
                'contactos_emergencia.relacion as contacto_emergencia_parentesco',
                'contactos_emergencia.telefono as contacto_emergencia_telefono'
            )
            ->orderBy('pacientes.id_paciente', 'desc');

        if ($termino) {
            $query->where(function ($q) use ($termino) {
                $q->where('personas.nombres', 'ilike', "%{$termino}%")
                  ->orWhere('personas.apellidos', 'ilike', "%{$termino}%")
                  ->orWhere('personas.ci', 'ilike', "%{$termino}%")
                  ->orWhere('pacientes.codigo_historia', 'ilike', "%{$termino}%");
            });
        }

        if ($estado) {
            $query->where('pacientes.estado', $estado);
        }

        return $query->get()->toArray();
    }

    public function obtenerPorId(int $idPaciente): ?object
    {
        return DB::table('pacientes')
            ->join('personas', 'pacientes.id_persona', '=', 'personas.id_persona')
            ->leftJoin('informacion_medica_paciente', 'pacientes.id_paciente', '=', 'informacion_medica_paciente.id_paciente')
            ->leftJoin('contactos_emergencia', function ($join) {
                $join->on('pacientes.id_paciente', '=', 'contactos_emergencia.id_paciente')
                     ->where('contactos_emergencia.es_principal', true);
            })
            ->where('pacientes.id_paciente', $idPaciente)
            ->select(
                'pacientes.*',
                'personas.ci',
                'personas.nombres',
                'personas.apellidos',
                'personas.fecha_nacimiento',
                'personas.sexo',
                'personas.telefono',
                'personas.correo',
                'personas.direccion',
                'informacion_medica_paciente.alergias',
                'informacion_medica_paciente.enfermedades_cronicas',
                'informacion_medica_paciente.medicamentos_actuales',
                'informacion_medica_paciente.antecedentes_familiares',
                'informacion_medica_paciente.observaciones as observaciones_medicas',
                'contactos_emergencia.nombre_completo as contacto_emergencia_nombre',
                'contactos_emergencia.relacion as contacto_emergencia_parentesco',
                'contactos_emergencia.telefono as contacto_emergencia_telefono'
            )
            ->first();
    }

    public function crear(array $datos): int
    {
        return DB::transaction(function () use ($datos) {
            $ciLimpio = trim($datos['ci']);
            $correoLimpio = !empty(trim($datos['correo'] ?? '')) ? trim($datos['correo']) : null;

            $idPersona = DB::table('personas')->insertGetId([
                'ci' => $ciLimpio,
                'nombres' => trim($datos['nombres']),
                'apellidos' => trim($datos['apellidos']),
                'fecha_nacimiento' => $datos['fecha_nacimiento'] ?? null,
                'sexo' => $datos['sexo'] ?? null,
                'telefono' => $datos['telefono'] ?? null,
                'correo' => $correoLimpio,
                'direccion' => $datos['direccion'] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ], 'id_persona');

            $codigoHistoria = 'HC-' . date('Y') . '-' . str_pad($idPersona, 5, '0', STR_PAD_LEFT);

            $idPaciente = DB::table('pacientes')->insertGetId([
                'id_persona' => $idPersona,
                'codigo_historia' => $codigoHistoria,
                'grupo_sanguineo' => $datos['grupo_sanguineo'] ?? null,
                'estado' => $datos['estado'] ?? 'activo',
                'created_at' => now(),
                'updated_at' => now(),
            ], 'id_paciente');

            DB::table('informacion_medica_paciente')->insert([
                'id_paciente' => $idPaciente,
                'alergias' => $datos['alergias'] ?? null,
                'enfermedades_cronicas' => $datos['enfermedades_cronicas'] ?? null,
                'medicamentos_actuales' => $datos['medicamentos_actuales'] ?? null,
                'antecedentes_familiares' => $datos['antecedentes_familiares'] ?? null,
                'observaciones' => $datos['observaciones'] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            if (!empty($datos['contacto_emergencia_nombre']) || !empty($datos['contacto_emergencia_telefono']) || !empty($datos['contacto_emergencia_parentesco'])) {
                DB::table('contactos_emergencia')->insert([
                    'id_paciente' => $idPaciente,
                    'nombre_completo' => $datos['contacto_emergencia_nombre'] ?? 'Contacto de Emergencia',
                    'relacion' => $datos['contacto_emergencia_parentesco'] ?? 'Familiar',
                    'telefono' => $datos['contacto_emergencia_telefono'] ?? '',
                    'es_principal' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // 1. Recuperación del Rol de Paciente
            $rolPaciente = DB::table('roles')->where('nombre', 'paciente')->value('id_rol') ?? 4;

            // 2. Generación Automática del Usuario Web (CU-05)
            // Se usa el número de CI como nombre de usuario (o derivado único) y como contraseña temporal
            $nombreUsuarioBase = $ciLimpio;
            $nombreUsuario = $nombreUsuarioBase;
            $contador = 1;
            while (DB::table('usuarios')->where('nombre_usuario', $nombreUsuario)->exists()) {
                $nombreUsuario = $nombreUsuarioBase . '_' . $contador;
                $contador++;
            }

            $idUsuario = DB::table('usuarios')->insertGetId([
                'id_persona' => $idPersona,
                'id_rol' => $rolPaciente,
                'nombre_usuario' => $nombreUsuario,
                'correo' => $correoLimpio,
                'contrasena_hash' => Hash::make($ciLimpio),
                'debe_cambiar_contrasena' => true,
                'estado' => 'activo',
                'created_at' => now(),
                'updated_at' => now(),
            ], 'id_usuario');

            // 3. Auditoría con trazabilidad de creación administrativa (CU-24 / RN21)
            ServicioBitacora::registrar(
                'CU05_GestionarPacientes',
                'CREAR_PACIENTE',
                'pacientes',
                (string)$idPaciente,
                null,
                [
                    'codigo_historia' => $codigoHistoria,
                    'id_usuario' => $idUsuario,
                    'ci' => $ciLimpio,
                    'origen' => 'registro_presencial_administrativo',
                    'cuenta_usuario_generada' => true,
                    'debe_cambiar_contrasena' => true,
                ]
            );

            return $idPaciente;
        });
    }

    public function actualizar(int $idPaciente, array $datos): void
    {
        DB::transaction(function () use ($idPaciente, $datos) {
            $paciente = DB::table('pacientes')->where('id_paciente', $idPaciente)->first();
            if (!$paciente) {
                throw new \Exception('Paciente no encontrado', 404);
            }

            $correoLimpio = !empty(trim($datos['correo'] ?? '')) ? trim($datos['correo']) : null;

            DB::table('personas')->where('id_persona', $paciente->id_persona)->update([
                'ci' => trim($datos['ci']),
                'nombres' => trim($datos['nombres']),
                'apellidos' => trim($datos['apellidos']),
                'fecha_nacimiento' => $datos['fecha_nacimiento'] ?? null,
                'sexo' => $datos['sexo'] ?? null,
                'telefono' => $datos['telefono'] ?? null,
                'correo' => $correoLimpio,
                'direccion' => $datos['direccion'] ?? null,
                'updated_at' => now(),
            ]);

            // Si la persona tiene cuenta de usuario web, sincronizar correo
            DB::table('usuarios')->where('id_persona', $paciente->id_persona)->update([
                'correo' => $correoLimpio,
                'updated_at' => now(),
            ]);

            DB::table('pacientes')->where('id_paciente', $idPaciente)->update([
                'grupo_sanguineo' => $datos['grupo_sanguineo'] ?? $paciente->grupo_sanguineo,
                'estado' => $datos['estado'] ?? $paciente->estado,
                'updated_at' => now(),
            ]);

            DB::table('informacion_medica_paciente')
                ->updateOrInsert(
                    ['id_paciente' => $idPaciente],
                    [
                        'alergias' => $datos['alergias'] ?? null,
                        'enfermedades_cronicas' => $datos['enfermedades_cronicas'] ?? null,
                        'medicamentos_actuales' => $datos['medicamentos_actuales'] ?? null,
                        'antecedentes_familiares' => $datos['antecedentes_familiares'] ?? null,
                        'observaciones' => $datos['observaciones'] ?? null,
                        'updated_at' => now(),
                    ]
                );

            if (!empty($datos['contacto_emergencia_nombre']) || !empty($datos['contacto_emergencia_telefono']) || !empty($datos['contacto_emergencia_parentesco'])) {
                DB::table('contactos_emergencia')->updateOrInsert(
                    [
                        'id_paciente' => $idPaciente,
                        'es_principal' => true,
                    ],
                    [
                        'nombre_completo' => $datos['contacto_emergencia_nombre'] ?? '',
                        'relacion' => $datos['contacto_emergencia_parentesco'] ?? 'Familiar',
                        'telefono' => $datos['contacto_emergencia_telefono'] ?? '',
                        'updated_at' => now(),
                    ]
                );
            }

            ServicioBitacora::registrar(
                'CU05_GestionarPacientes',
                'ACTUALIZAR_PACIENTE',
                'pacientes',
                (string)$idPaciente,
                ['estado' => $paciente->estado],
                ['estado' => $datos['estado'] ?? $paciente->estado]
            );
        });
    }

    /**
     * Desactivación lógica obligatoria. PROHIBIDO BORRADO FÍSICO.
     */
    public function alternarEstado(int $idPaciente): string
    {
        $paciente = DB::table('pacientes')->where('id_paciente', $idPaciente)->first();
        if (!$paciente) {
            throw new \Exception('Paciente no encontrado', 404);
        }

        $nuevoEstado = $paciente->estado === 'activo' ? 'inactivo' : 'activo';

        DB::table('pacientes')->where('id_paciente', $idPaciente)->update([
            'estado' => $nuevoEstado,
            'updated_at' => now(),
        ]);

        ServicioBitacora::registrar(
            'CU05_GestionarPacientes',
            'CAMBIAR_ESTADO_LOGICO_PACIENTE',
            'pacientes',
            (string)$idPaciente,
            ['estado' => $paciente->estado],
            ['estado' => $nuevoEstado]
        );

        return $nuevoEstado;
    }
}
