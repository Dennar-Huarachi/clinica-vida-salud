<?php

namespace App\Paquetes\CatalogosHorarios\CU07_GestionarEspecialidades;

use Illuminate\Support\Facades\DB;
use App\Models\Cita;
use App\Nucleo\Bitacora\ServicioBitacora;
use App\Http\Requests\Paquetes\CatalogosHorarios\CU07_GestionarEspecialidades\GuardarEspecialidadRequest;

class GestionarEspecialidadesServicio
{
    public function listar(?string $termino = null, ?string $estado = null): array
    {
        $query = DB::table('especialidades')->orderBy('nombre');

        if ($termino) {
            $norm = GuardarEspecialidadRequest::normalizar($termino);
            $query->where(function ($q) use ($termino, $norm) {
                $q->where('nombre', 'ilike', "%{$termino}%")
                  ->orWhere('nombre_normalizado', 'like', "%{$norm}%");
            });
        }

        if ($estado) {
            $query->where('estado', $estado);
        }

        return $query->get()->toArray();
    }

    public function crear(array $datos): int
    {
        $nombreNormalizado = GuardarEspecialidadRequest::normalizar($datos['nombre']);

        $id = DB::table('especialidades')->insertGetId([
            'nombre' => trim($datos['nombre']),
            'nombre_normalizado' => $nombreNormalizado,
            'descripcion' => $datos['descripcion'] ?? null,
            'duracion_turno_minutos' => $datos['duracion_turno_minutos'] ?? 15,
            'reservable_en_linea' => $datos['reservable_en_linea'] ?? true,
            'estado' => $datos['estado'] ?? 'activo',
            'created_at' => now(),
            'updated_at' => now(),
        ], 'id_especialidad');

        ServicioBitacora::registrar(
            'CU07_GestionarEspecialidades',
            'CREAR_ESPECIALIDAD',
            'especialidades',
            (string)$id,
            null,
            [
                'nombre' => $datos['nombre'],
                'nombre_normalizado' => $nombreNormalizado,
                'reservable_en_linea' => $datos['reservable_en_linea'] ?? true
            ]
        );

        return $id;
    }

    public function actualizar(int $id, array $datos): void
    {
        $especialidad = DB::table('especialidades')->where('id_especialidad', $id)->first();
        if (!$especialidad) {
            throw new \Exception('Especialidad no encontrada', 404);
        }

        $nombreNormalizado = GuardarEspecialidadRequest::normalizar($datos['nombre']);

        $reservable = array_key_exists('reservable_en_linea', $datos)
            ? (bool)$datos['reservable_en_linea']
            : ($especialidad->reservable_en_linea ?? true);

        DB::table('especialidades')->where('id_especialidad', $id)->update([
            'nombre' => trim($datos['nombre']),
            'nombre_normalizado' => $nombreNormalizado,
            'descripcion' => $datos['descripcion'] ?? null,
            'duracion_turno_minutos' => $datos['duracion_turno_minutos'] ?? $especialidad->duracion_turno_minutos,
            'reservable_en_linea' => $reservable,
            'estado' => $datos['estado'] ?? $especialidad->estado,
            'updated_at' => now(),
        ]);

        ServicioBitacora::registrar(
            'CU07_GestionarEspecialidades',
            'ACTUALIZAR_ESPECIALIDAD',
            'especialidades',
            (string)$id,
            (array)$especialidad,
            $datos
        );
    }

    public function alternarEstado(int $id): array
    {
        $especialidad = DB::table('especialidades')->where('id_especialidad', $id)->first();
        if (!$especialidad) {
            throw new \Exception('Especialidad no encontrada', 404);
        }

        $nuevoEstado = $especialidad->estado === 'activo' ? 'inactivo' : 'activo';
        $advertencia = null;
        $medicosActivos = 0;
        $citasFuturas = 0;

        // Regla de Negocio CU-07: Si se desactiva, verificar dependencias activas (médicos y citas futuras)
        if ($nuevoEstado === 'inactivo') {
            $medicosActivos = DB::table('medico_especialidad')
                ->join('medicos', 'medicos.id_medico', '=', 'medico_especialidad.id_medico')
                ->where('medico_especialidad.id_especialidad', $id)
                ->where('medicos.estado', 'activo')
                ->count();

            $hoy = date('Y-m-d');
            $citasFuturasQuery = DB::table('citas')
                ->where('citas.id_especialidad', $id)
                ->where('citas.fecha_cita', '>=', $hoy);
            Cita::aplicarFiltroOcupantes($citasFuturasQuery, 'citas');
            $citasFuturas = $citasFuturasQuery->count();

            if ($medicosActivos > 0 || $citasFuturas > 0) {
                $advertencia = "La especialidad tiene {$medicosActivos} médico(s) activo(s) y {$citasFuturas} cita(s) futura(s) asociada(s). Dejará de ofrecerse en nuevos turnos, pero las citas programadas se mantienen vigentes (CU-07).";
            }
        }

        DB::table('especialidades')->where('id_especialidad', $id)->update([
            'estado' => $nuevoEstado,
            'updated_at' => now(),
        ]);

        ServicioBitacora::registrar(
            'CU07_GestionarEspecialidades',
            'CAMBIAR_ESTADO_ESPECIALIDAD',
            'especialidades',
            (string)$id,
            ['estado' => $especialidad->estado],
            [
                'estado' => $nuevoEstado,
                'medicos_asociados' => $medicosActivos,
                'citas_futuras' => $citasFuturas,
                'advertencia' => $advertencia,
            ]
        );

        return [
            'estado' => $nuevoEstado,
            'advertencia' => $advertencia,
            'medicos_asociados' => $medicosActivos,
            'citas_futuras' => $citasFuturas,
        ];
    }
}

