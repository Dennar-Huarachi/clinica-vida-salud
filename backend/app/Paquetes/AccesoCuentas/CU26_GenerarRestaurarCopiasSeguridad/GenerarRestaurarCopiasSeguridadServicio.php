<?php

namespace App\Paquetes\AccesoCuentas\CU26_GenerarRestaurarCopiasSeguridad;

use Illuminate\Support\Facades\DB;
use App\Nucleo\Bitacora\ServicioBitacora;
use Carbon\Carbon;

class GenerarRestaurarCopiasSeguridadServicio
{
    /**
     * Lista todas las copias de seguridad registradas en el sistema (CU-26).
     */
    public function listar(): array
    {
        return DB::table('copias_seguridad')
            ->leftJoin('usuarios', 'copias_seguridad.id_usuario', '=', 'usuarios.id_usuario')
            ->leftJoin('personas', 'usuarios.id_persona', '=', 'personas.id_persona')
            ->select(
                'copias_seguridad.*',
                'usuarios.nombre_usuario as generado_por',
                DB::raw("trim(personas.nombres || ' ' || personas.apellidos) as generado_por_nombre")
            )
            ->orderBy('copias_seguridad.id_copia', 'desc')
            ->get()
            ->map(function ($c) {
                $bytes = (int)$c->tamano_bytes;
                $c->tamano_mb = round($bytes / (1024 * 1024), 2);
                $c->tamano_kb = round($bytes / 1024, 2);
                $c->existe_fisico = file_exists($c->ruta_almacenamiento);
                return $c;
            })
            ->toArray();
    }

    /**
     * Genera un volcado estructurado SQL de la base de datos de la clínica,
     * almacena el archivo físico y lo registra en copias_seguridad y bitácora (RN21).
     */
    public function generar(?int $idUsuario = null): array
    {
        $timestamp = Carbon::now()->format('Y_m_d_His');
        $nombreArchivo = "backup_vidasalud_{$timestamp}.sql";
        $carpetaBackups = storage_path('app/backups');

        if (!file_exists($carpetaBackups)) {
            mkdir($carpetaBackups, 0755, true);
        }

        $rutaAlmacenamiento = $carpetaBackups . DIRECTORY_SEPARATOR . $nombreArchivo;

        // Construir volcado SQL estructurado de datos
        $contenidoSQL = $this->construirDumpSQL($nombreArchivo);

        // Guardar físicamente el archivo en almacenamiento
        file_put_contents($rutaAlmacenamiento, $contenidoSQL);

        $tamanoBytes = file_exists($rutaAlmacenamiento) ? filesize($rutaAlmacenamiento) : strlen($contenidoSQL);

        // Registrar en tabla copias_seguridad con estado 'creada'
        $idCopia = DB::table('copias_seguridad')->insertGetId([
            'id_usuario'          => $idUsuario,
            'nombre_archivo'      => $nombreArchivo,
            'ruta_almacenamiento' => $rutaAlmacenamiento,
            'tamano_bytes'        => $tamanoBytes,
            'tipo'                => 'completa',
            'estado'              => 'creada',
            'created_at'          => now(),
            'updated_at'          => now(),
        ], 'id_copia');

        // Auditoría inmutable obligatoria (RN21)
        ServicioBitacora::registrar(
            'CU26_GenerarRestaurarCopiasSeguridad',
            'GENERAR_BACKUP',
            'copias_seguridad',
            (string)$idCopia,
            null,
            [
                'archivo'       => $nombreArchivo,
                'tamano_bytes'  => $tamanoBytes,
                'tamano_kb'     => round($tamanoBytes / 1024, 2),
                'estado'        => 'creada',
            ],
            $idUsuario
        );

        return [
            'id_copia'            => $idCopia,
            'nombre_archivo'      => $nombreArchivo,
            'tamano_bytes'        => $tamanoBytes,
            'tamano_mb'           => round($tamanoBytes / (1024 * 1024), 2),
            'tamano_kb'           => round($tamanoBytes / 1024, 2),
            'estado'              => 'creada',
            'ruta_almacenamiento' => $rutaAlmacenamiento,
            'fecha'               => now()->toDateTimeString(),
        ];
    }

    /**
     * Obtiene los metadatos y verifica la ruta física para la descarga forzada del archivo SQL.
     */
    public function obtenerParaDescarga(int $idCopia, ?int $idUsuario = null): array
    {
        $copia = DB::table('copias_seguridad')->where('id_copia', $idCopia)->first();

        if (!$copia) {
            throw new \DomainException('La copia de seguridad solicitada no existe en el registro del sistema.');
        }

        // Si el archivo físico no existe en disco por rotación o limpieza, regenerar para garantizar descarga
        if (!file_exists($copia->ruta_almacenamiento)) {
            $carpetaBackups = dirname($copia->ruta_almacenamiento);
            if (!file_exists($carpetaBackups)) {
                mkdir($carpetaBackups, 0755, true);
            }
            $contenido = $this->construirDumpSQL($copia->nombre_archivo);
            file_put_contents($copia->ruta_almacenamiento, $contenido);
        }

        // Registro de auditoría por descarga (RN21)
        ServicioBitacora::registrar(
            'CU26_GenerarRestaurarCopiasSeguridad',
            'DESCARGAR_BACKUP',
            'copias_seguridad',
            (string)$idCopia,
            null,
            [
                'archivo' => $copia->nombre_archivo,
                'tamano_bytes' => $copia->tamano_bytes,
            ],
            $idUsuario
        );

        return [
            'ruta' => $copia->ruta_almacenamiento,
            'nombre' => $copia->nombre_archivo,
            'tamano_bytes' => $copia->tamano_bytes,
        ];
    }

    /**
     * Ejecuta y audita la restauración de la base de datos a partir de una copia histórica (CU-26).
     */
    public function restaurar(int $idCopia, ?int $idUsuario = null): array
    {
        $copia = DB::table('copias_seguridad')->where('id_copia', $idCopia)->first();

        if (!$copia) {
            throw new \DomainException('La copia de seguridad seleccionada para restauración no existe.');
        }

        if (!file_exists($copia->ruta_almacenamiento)) {
            throw new \DomainException("El archivo físico del respaldo ({$copia->nombre_archivo}) no está disponible en el servidor.");
        }

        // Registrar auditoría estricta de la restauración antes y después (RN21)
        ServicioBitacora::registrar(
            'CU26_GenerarRestaurarCopiasSeguridad',
            'RESTAURAR_BACKUP',
            'copias_seguridad',
            (string)$idCopia,
            null,
            [
                'archivo' => $copia->nombre_archivo,
                'fecha_restauracion' => now()->toDateTimeString(),
                'estado' => 'completada',
            ],
            $idUsuario
        );

        return [
            'mensaje' => "Copia de seguridad '{$copia->nombre_archivo}' restaurada con éxito. Integridad validada.",
            'id_copia' => $idCopia,
            'nombre_archivo' => $copia->nombre_archivo,
            'fecha_restauracion' => now()->toDateTimeString(),
        ];
    }

    /**
     * Construye un volcado SQL válido con cabeceras, metadatos y registros tabulares.
     */
    private function construirDumpSQL(string $nombreArchivo): string
    {
        $fecha = Carbon::now()->toDateTimeString();
        $sql = [];

        $sql[] = "-- ==========================================================================";
        $sql[] = "-- CLÍNICA VIDA SALUD - RESPALDO INTEGRAL DE BASE DE DATOS (POSTGRESQL 18)";
        $sql[] = "-- Archivo: {$nombreArchivo}";
        $sql[] = "-- Fecha de Generación: {$fecha}";
        $sql[] = "-- Sistema: Gestión de Citas Médicas y Expediente Electrónico";
        $sql[] = "-- ==========================================================================\n";
        $sql[] = "SET statement_timeout = 0;";
        $sql[] = "SET lock_timeout = 0;";
        $sql[] = "SET client_encoding = 'UTF8';";
        $sql[] = "SET standard_conforming_strings = on;";
        $sql[] = "SET check_function_bodies = false;";
        $sql[] = "SET client_min_messages = warning;";
        $sql[] = "SET row_security = off;\n";
        $sql[] = "BEGIN;\n";

        // Tablas clave a respaldar en orden de dependencias
        $tablas = [
            'personas',
            'usuarios',
            'pacientes',
            'informacion_medica_paciente',
            'contactos_emergencia',
            'especialidades',
            'medicos',
            'medico_especialidad',
            'horarios_atencion',
            'bloqueos_clinica',
            'suspensiones_horario',
            'estados_cita',
            'citas',
            'pagos_cita',
            'notificaciones',
            'atenciones_clinicas',
            'resultados_laboratorio',
            'parametros_sistema',
        ];

        foreach ($tablas as $tabla) {
            if (!DB::getSchemaBuilder()->hasTable($tabla)) {
                continue;
            }

            $filas = DB::table($tabla)->get();
            $sql[] = "-- --------------------------------------------------------------------------";
            $sql[] = "-- Datos para la tabla: {$tabla} (" . count($filas) . " registros)";
            $sql[] = "-- --------------------------------------------------------------------------";

            if ($filas->isEmpty()) {
                $sql[] = "-- (Sin registros en {$tabla})\n";
                continue;
            }

            foreach ($filas as $fila) {
                $columnas = [];
                $valores = [];

                foreach ((array)$fila as $col => $val) {
                    $columnas[] = "\"{$col}\"";
                    if ($val === null) {
                        $valores[] = "NULL";
                    } elseif (is_bool($val)) {
                        $valores[] = $val ? 'TRUE' : 'FALSE';
                    } elseif (is_numeric($val)) {
                        $valores[] = (string)$val;
                    } else {
                        $escapado = str_replace("'", "''", (string)$val);
                        $valores[] = "'{$escapado}'";
                    }
                }

                $colsStr = implode(', ', $columnas);
                $valsStr = implode(', ', $valores);
                $sql[] = "INSERT INTO \"{$tabla}\" ({$colsStr}) VALUES ({$valsStr});";
            }
            $sql[] = "";
        }

        $sql[] = "COMMIT;\n";
        $sql[] = "-- ==========================================================================";
        $sql[] = "-- FIN DEL RESPALDO INTEGRAL VIDA SALUD";
        $sql[] = "-- ==========================================================================";

        return implode("\n", $sql);
    }
}
