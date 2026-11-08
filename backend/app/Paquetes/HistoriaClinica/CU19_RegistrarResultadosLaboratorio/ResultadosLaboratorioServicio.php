<?php

namespace App\Paquetes\HistoriaClinica\CU19_RegistrarResultadosLaboratorio;

use Illuminate\Support\Facades\DB;
use App\Nucleo\Bitacora\ServicioBitacora;

class ResultadosLaboratorioServicio
{
    /**
     * Registra un resultado de estudio clínico o prueba diagnóstica vinculado a un paciente.
     */
    public function registrar(array $datos, ?int $idUsuarioOperador = null): int
    {
        $id = DB::table('resultados_laboratorio')->insertGetId([
            'id_paciente' => $datos['id_paciente'],
            'id_atencion' => $datos['id_atencion'] ?? null,
            'tipo_estudio' => $datos['tipo_estudio'],
            'descripcion' => $datos['descripcion'],
            'archivo_adjunto' => $datos['archivo_adjunto'] ?? null,
            'fecha_estudio' => $datos['fecha_estudio'],
            'created_at' => now(),
            'updated_at' => now(),
        ], 'id_resultado');

        ServicioBitacora::registrar(
            'CU19_RegistrarResultadosLaboratorio',
            'REGISTRAR_LABORATORIO',
            'resultados_laboratorio',
            (string)$id,
            null,
            [
                'id_resultado' => $id,
                'id_paciente' => $datos['id_paciente'],
                'tipo_estudio' => $datos['tipo_estudio'],
                'fecha_estudio' => $datos['fecha_estudio']
            ],
            $idUsuarioOperador
        );

        return $id;
    }

    /**
     * Lista los resultados de laboratorio de un paciente ordenados cronológicamente descendente.
     */
    public function listarPorPaciente(int $idPaciente): array
    {
        return DB::table('resultados_laboratorio')
            ->leftJoin('atenciones_clinicas', 'resultados_laboratorio.id_atencion', '=', 'atenciones_clinicas.id_atencion')
            ->where('resultados_laboratorio.id_paciente', $idPaciente)
            ->select(
                'resultados_laboratorio.*',
                'atenciones_clinicas.diagnostico as atencion_diagnostico'
            )
            ->orderBy('resultados_laboratorio.fecha_estudio', 'desc')
            ->get()
            ->toArray();
    }
}
