<?php

namespace App\Paquetes\CatalogosHorarios\CU08_GestionarMedicos;

use Illuminate\Support\Facades\DB;
use App\Models\Cita;
use App\Nucleo\Bitacora\ServicioBitacora;

class GestionarMedicosServicio
{
    public function listar(?string $termino = null, ?int $idEspecialidad = null, ?string $estado = null): array
    {
        $query = DB::table('medicos')
            ->join('personas', 'medicos.id_persona', '=', 'personas.id_persona')
            ->select(
                'medicos.id_medico',
                'medicos.nro_matricula',
                'medicos.biografia',
                'medicos.estado',
                'personas.id_persona',
                'personas.ci',
                'personas.nombres',
                'personas.apellidos',
                'personas.correo',
                'personas.telefono'
            )
            ->orderBy('personas.apellidos');

        if ($termino) {
            $query->where(function ($q) use ($termino) {
                $q->where('personas.nombres', 'ilike', "%{$termino}%")
                  ->orWhere('personas.apellidos', 'ilike', "%{$termino}%")
                  ->orWhere('personas.ci', 'ilike', "%{$termino}%")
                  ->orWhere('medicos.nro_matricula', 'ilike', "%{$termino}%");
            });
        }

        if ($estado) {
            $query->where('medicos.estado', $estado);
        }

        if ($idEspecialidad) {
            $query->whereExists(function ($sub) use ($idEspecialidad) {
                $sub->select(DB::raw(1))
                    ->from('medico_especialidad')
                    ->whereColumn('medico_especialidad.id_medico', 'medicos.id_medico')
                    ->where('medico_especialidad.id_especialidad', $idEspecialidad);
            });
        }

        $medicos = $query->get();

        // Cargar especialidades de cada médico
        foreach ($medicos as $medico) {
            $medico->especialidades = DB::table('medico_especialidad')
                ->join('especialidades', 'medico_especialidad.id_especialidad', '=', 'especialidades.id_especialidad')
                ->where('medico_especialidad.id_medico', $medico->id_medico)
                ->select(
                    'especialidades.id_especialidad',
                    'especialidades.nombre',
                    'especialidades.duracion_turno_minutos',
                    'especialidades.estado'
                )
                ->get()
                ->toArray();
        }

        return $medicos->toArray();
    }

    public function crear(array $datos): int
    {
        return DB::transaction(function () use ($datos) {
            $idPersona = DB::table('personas')->insertGetId([
                'ci' => $datos['ci'],
                'nombres' => $datos['nombres'],
                'apellidos' => $datos['apellidos'],
                'fecha_nacimiento' => $datos['fecha_nacimiento'] ?? null,
                'sexo' => $datos['sexo'] ?? null,
                'telefono' => $datos['telefono'] ?? null,
                'correo' => $datos['correo'],
                'direccion' => $datos['direccion'] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ], 'id_persona');

            $idMedico = DB::table('medicos')->insertGetId([
                'id_persona' => $idPersona,
                'nro_matricula' => $datos['nro_matricula'],
                'biografia' => $datos['biografia'] ?? null,
                'estado' => $datos['estado'] ?? 'activo',
                'created_at' => now(),
                'updated_at' => now(),
            ], 'id_medico');

            foreach ($datos['especialidades'] as $idEspecialidad) {
                DB::table('medico_especialidad')->insert([
                    'id_medico' => $idMedico,
                    'id_especialidad' => $idEspecialidad,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            ServicioBitacora::registrar(
                'CU08_GestionarMedicos',
                'CREAR_MEDICO',
                'medicos',
                (string)$idMedico,
                null,
                ['nro_matricula' => $datos['nro_matricula']]
            );

            return $idMedico;
        });
    }

    public function actualizar(int $idMedico, array $datos): void
    {
        DB::transaction(function () use ($idMedico, $datos) {
            $medico = DB::table('medicos')->where('id_medico', $idMedico)->first();
            if (!$medico) {
                throw new \Exception('Médico no encontrado', 404);
            }

            DB::table('personas')->where('id_persona', $medico->id_persona)->update([
                'ci' => $datos['ci'],
                'nombres' => $datos['nombres'],
                'apellidos' => $datos['apellidos'],
                'fecha_nacimiento' => $datos['fecha_nacimiento'] ?? null,
                'sexo' => $datos['sexo'] ?? null,
                'telefono' => $datos['telefono'] ?? null,
                'correo' => $datos['correo'],
                'direccion' => $datos['direccion'] ?? null,
                'updated_at' => now(),
            ]);

            DB::table('medicos')->where('id_medico', $idMedico)->update([
                'nro_matricula' => $datos['nro_matricula'],
                'biografia' => $datos['biografia'] ?? null,
                'estado' => $datos['estado'] ?? $medico->estado,
                'updated_at' => now(),
            ]);

            // Sincronizar especialidades
            DB::table('medico_especialidad')->where('id_medico', $idMedico)->delete();
            foreach ($datos['especialidades'] as $idEspecialidad) {
                DB::table('medico_especialidad')->insert([
                    'id_medico' => $idMedico,
                    'id_especialidad' => $idEspecialidad,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            ServicioBitacora::registrar(
                'CU08_GestionarMedicos',
                'ACTUALIZAR_MEDICO',
                'medicos',
                (string)$idMedico,
                ['estado' => $medico->estado],
                ['estado' => $datos['estado'] ?? $medico->estado]
            );
        });
    }

    /**
     * PROHIBIDO BORRADO FÍSICO. Desactivación o activación lógica.
     * Reglas: RN04 (especialidad obligatoria), RN11 (citas futuras y horarios al desactivar), RN21 (auditoría).
     */
    public function alternarEstado(int $idMedico): array
    {
        $medico = DB::table('medicos')->where('id_medico', $idMedico)->first();
        if (!$medico) {
            throw new \Exception('Médico no encontrado', 404);
        }

        $nuevoEstado = $medico->estado === 'activo' ? 'inactivo' : 'activo';
        $alerta = null;
        $citasFuturas = 0;
        $horariosActivos = 0;
        $sugerirSuspension = false;

        if ($nuevoEstado === 'activo') {
            // 1. Validación de reactivación (Inactivo -> Activo — RN04):
            // Debe contar con al menos una especialidad médica activa asociada
            $especialidadesActivas = DB::table('medico_especialidad')
                ->join('especialidades', 'medico_especialidad.id_especialidad', '=', 'especialidades.id_especialidad')
                ->where('medico_especialidad.id_medico', $idMedico)
                ->where('especialidades.estado', 'activo')
                ->count();

            if ($especialidadesActivas === 0) {
                throw new \Exception(
                    "No se puede activar al médico porque no cuenta con ninguna especialidad médica activa asignada. Asigne al menos una especialidad activa antes de habilitarlo.",
                    422
                );
            }
        } else {
            // 2. Advertencia de citas futuras y horarios al desactivar (Activo -> Inactivo — RN11):
            $hoy = date('Y-m-d');
            $citasFuturasQuery = DB::table('citas')
                ->where('citas.id_medico', $idMedico)
                ->where('citas.fecha_cita', '>=', $hoy);
            Cita::aplicarFiltroOcupantes($citasFuturasQuery, 'citas');
            $citasFuturas = $citasFuturasQuery->count();

            $horariosActivos = DB::table('horarios_atencion')
                ->where('id_medico', $idMedico)
                ->where('estado', 'activo')
                ->count();

            if ($citasFuturas > 0 || $horariosActivos > 0) {
                $sugerirSuspension = true;
                $alerta = "El médico ha sido desactivado. Tiene {$citasFuturas} cita(s) futura(s) programada(s) y horarios de atención vigentes. Se recomienda suspender su horario para reubicar oportunamente a los pacientes afectados.";
            }
        }

        DB::table('medicos')->where('id_medico', $idMedico)->update([
            'estado' => $nuevoEstado,
            'updated_at' => now(),
        ]);

        // 3. Auditoría enriquecida (RN21)
        ServicioBitacora::registrar(
            'CU08_GestionarMedicos',
            'CAMBIAR_ESTADO_LOGICO_MEDICO',
            'medicos',
            (string)$idMedico,
            ['estado' => $medico->estado],
            [
                'estado' => $nuevoEstado,
                'citas_afectadas' => $citasFuturas,
                'horarios_vigentes' => $horariosActivos,
                'alerta' => $alerta,
            ]
        );

        return [
            'estado' => $nuevoEstado,
            'alerta' => $alerta,
            'citas_afectadas' => $citasFuturas,
            'horarios_activos' => $horariosActivos,
            'sugerir_suspension' => $sugerirSuspension,
        ];
    }
}
