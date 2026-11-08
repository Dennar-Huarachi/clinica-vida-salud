<?php

namespace Database\Seeders\Demostracion;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CatalogosHorariosDemoSeeder extends Seeder
{
    private function normalizarTexto(string $texto): string
    {
        $texto = mb_strtolower(trim($texto), 'UTF-8');
        $mapa = [
            'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ü' => 'u',
            'à' => 'a', 'è' => 'e', 'ì' => 'i', 'ò' => 'o', 'ù' => 'u',
            'ñ' => 'n',
        ];
        $texto = strtr($texto, $mapa);
        $texto = preg_replace('/[^a-z0-9\s]/u', '', $texto);
        $texto = preg_replace('/\s+/', ' ', $texto);
        return trim($texto);
    }

    public function run(): void
    {
        // 1. Especialidades requeridas (8 especialidades, sin IDs fijos)
        $especialidades = [
            [
                'nombre' => 'Medicina General',
                'descripcion' => 'Atención primaria ambulatoria y medicina preventiva integral.',
                'duracion_turno_minutos' => 15,
                'reservable_en_linea' => true,
            ],
            [
                'nombre' => 'Pediatría',
                'descripcion' => 'Cuidado integral de la salud en la infancia y adolescencia.',
                'duracion_turno_minutos' => 15,
                'reservable_en_linea' => true,
            ],
            [
                'nombre' => 'Geriatría',
                'descripcion' => 'Atención médica integral especializada en adultos mayores.',
                'duracion_turno_minutos' => 20,
                'reservable_en_linea' => true,
            ],
            [
                'nombre' => 'Ginecología',
                'descripcion' => 'Salud reproductiva femenina, obstetricia y control ginecológico.',
                'duracion_turno_minutos' => 30,
                'reservable_en_linea' => true,
            ],
            [
                'nombre' => 'Odontología',
                'descripcion' => 'Salud bucal, odontología preventiva y restauradora.',
                'duracion_turno_minutos' => 30,
                'reservable_en_linea' => true,
            ],
            [
                'nombre' => 'Cardiología',
                'descripcion' => 'Diagnóstico, tratamiento y seguimiento de patologías cardiovasculares.',
                'duracion_turno_minutos' => 30,
                'reservable_en_linea' => true,
            ],
            [
                'nombre' => 'Endocrinología',
                'descripcion' => 'Trastornos hormonales, metabolismo y diabetes (Atención Exclusiva Presencial).',
                'duracion_turno_minutos' => 30,
                'reservable_en_linea' => false,
            ],
            [
                'nombre' => 'Fisioterapia',
                'descripcion' => 'Rehabilitación física, neuromuscular y terapia motora (Atención Exclusiva Presencial).',
                'duracion_turno_minutos' => 30,
                'reservable_en_linea' => false,
            ],
        ];

        $especialidadesIds = [];

        foreach ($especialidades as $esp) {
            $nombreNorm = $this->normalizarTexto($esp['nombre']);
            $existente = DB::table('especialidades')
                ->where('nombre', $esp['nombre'])
                ->orWhere('nombre_normalizado', $nombreNorm)
                ->first();

            if ($existente) {
                DB::table('especialidades')->where('id_especialidad', $existente->id_especialidad)->update([
                    'nombre' => $esp['nombre'],
                    'nombre_normalizado' => $nombreNorm,
                    'descripcion' => $esp['descripcion'],
                    'duracion_turno_minutos' => $esp['duracion_turno_minutos'],
                    'reservable_en_linea' => $esp['reservable_en_linea'],
                    'estado' => 'activo',
                    'updated_at' => now(),
                ]);
                $especialidadesIds[$esp['nombre']] = (int)$existente->id_especialidad;
            } else {
                $idEsp = DB::table('especialidades')->insertGetId([
                    'nombre' => $esp['nombre'],
                    'nombre_normalizado' => $nombreNorm,
                    'descripcion' => $esp['descripcion'],
                    'duracion_turno_minutos' => $esp['duracion_turno_minutos'],
                    'reservable_en_linea' => $esp['reservable_en_linea'],
                    'estado' => 'activo',
                    'created_at' => now(),
                    'updated_at' => now(),
                ], 'id_especialidad');
                $especialidadesIds[$esp['nombre']] = (int)$idEsp;
            }
        }

        // 2. Seis Médicos Activos vinculados a sus personas y especialidades
        $medicosData = [
            [
                'ci' => '1000011',
                'nro_matricula' => 'MED-BOL-10452',
                'biografia' => 'Especialista en Medicina Familiar y Cardiología Clínica con más de 15 años de trayectoria.',
                'especialidades' => ['Medicina General', 'Cardiología'],
            ],
            [
                'ci' => '1000012',
                'nro_matricula' => 'MED-BOL-10453',
                'biografia' => 'Pediatra certificada enfocada en desarrollo infantil y prevención de enfermedades pediátricas.',
                'especialidades' => ['Pediatría'],
            ],
            [
                'ci' => '1000013',
                'nro_matricula' => 'MED-BOL-10454',
                'biografia' => 'Médico Geriatra y Endocrinólogo dedicado al tratamiento integral del adulto mayor.',
                'especialidades' => ['Geriatría', 'Endocrinología'],
            ],
            [
                'ci' => '1000014',
                'nro_matricula' => 'MED-BOL-10455',
                'biografia' => 'Ginecóloga obstetra con alta experiencia en control prenatal y salud integral femenina.',
                'especialidades' => ['Ginecología'],
            ],
            [
                'ci' => '1000015',
                'nro_matricula' => 'MED-BOL-10456',
                'biografia' => 'Cirujano Dentista con posgrado en Odontología Restauradora y Estética Dental.',
                'especialidades' => ['Odontología'],
            ],
            [
                'ci' => '1000016',
                'nro_matricula' => 'MED-BOL-10457',
                'biografia' => 'Fisioterapeuta especialista en kinesiología respiratoria y rehabilitación traumatológica.',
                'especialidades' => ['Fisioterapia'],
            ],
        ];

        $medicosIds = [];

        foreach ($medicosData as $idx => $m) {
            $persona = DB::table('personas')->where('ci', $m['ci'])->first();
            if (!$persona) {
                throw new \RuntimeException("Persona con CI {$m['ci']} no encontrada para registrar al médico {$m['nro_matricula']}.");
            }

            $medico = DB::table('medicos')
                ->where('nro_matricula', $m['nro_matricula'])
                ->orWhere('id_persona', $persona->id_persona)
                ->first();

            if ($medico) {
                DB::table('medicos')->where('id_medico', $medico->id_medico)->update([
                    'id_persona' => $persona->id_persona,
                    'nro_matricula' => $m['nro_matricula'],
                    'biografia' => $m['biografia'],
                    'estado' => 'activo',
                    'updated_at' => now(),
                ]);
                $idMedico = (int)$medico->id_medico;
            } else {
                $idMedico = (int)DB::table('medicos')->insertGetId([
                    'id_persona' => $persona->id_persona,
                    'nro_matricula' => $m['nro_matricula'],
                    'biografia' => $m['biografia'],
                    'estado' => 'activo',
                    'created_at' => now(),
                    'updated_at' => now(),
                ], 'id_medico');
            }

            $medicosIds[$idx + 1] = $idMedico;

            // Relación intermedia medico_especialidad
            foreach ($m['especialidades'] as $nombreEsp) {
                $idEsp = $especialidadesIds[$nombreEsp] ?? null;
                if (!$idEsp) {
                    throw new \RuntimeException("Especialidad '{$nombreEsp}' no encontrada para asociar al médico {$m['nro_matricula']}.");
                }

                DB::table('medico_especialidad')->updateOrInsert(
                    ['id_medico' => $idMedico, 'id_especialidad' => $idEsp],
                    ['updated_at' => now(), 'created_at' => now()]
                );
            }
        }

        // 3. Horarios de atención coherentes (2 o 3 días por médico, lunes a sábado)
        // dia_semana: 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado
        $horarios = [
            // M1 (Alejandro Alarcón)
            ['id_medico_idx' => 1, 'esp_nombre' => 'Medicina General', 'dia' => 1, 'ini' => '08:00:00', 'fin' => '12:00:00', 'dur' => 15],
            ['id_medico_idx' => 1, 'esp_nombre' => 'Cardiología', 'dia' => 3, 'ini' => '08:00:00', 'fin' => '12:00:00', 'dur' => 30],
            ['id_medico_idx' => 1, 'esp_nombre' => 'Medicina General', 'dia' => 5, 'ini' => '14:00:00', 'fin' => '18:00:00', 'dur' => 15],

            // M2 (Beatriz Torres)
            ['id_medico_idx' => 2, 'esp_nombre' => 'Pediatría', 'dia' => 1, 'ini' => '14:00:00', 'fin' => '18:00:00', 'dur' => 15],
            ['id_medico_idx' => 2, 'esp_nombre' => 'Pediatría', 'dia' => 2, 'ini' => '08:00:00', 'fin' => '12:00:00', 'dur' => 15],
            ['id_medico_idx' => 2, 'esp_nombre' => 'Pediatría', 'dia' => 4, 'ini' => '08:00:00', 'fin' => '12:00:00', 'dur' => 15],

            // M3 (Carlos Guzmán)
            ['id_medico_idx' => 3, 'esp_nombre' => 'Geriatría', 'dia' => 2, 'ini' => '14:00:00', 'fin' => '18:00:00', 'dur' => 20],
            ['id_medico_idx' => 3, 'esp_nombre' => 'Endocrinología', 'dia' => 4, 'ini' => '14:00:00', 'fin' => '18:00:00', 'dur' => 30],
            ['id_medico_idx' => 3, 'esp_nombre' => 'Geriatría', 'dia' => 6, 'ini' => '08:00:00', 'fin' => '12:00:00', 'dur' => 20],

            // M4 (Daniela Rojas)
            ['id_medico_idx' => 4, 'esp_nombre' => 'Ginecología', 'dia' => 1, 'ini' => '08:00:00', 'fin' => '12:00:00', 'dur' => 30],
            ['id_medico_idx' => 4, 'esp_nombre' => 'Ginecología', 'dia' => 3, 'ini' => '14:00:00', 'fin' => '18:00:00', 'dur' => 30],
            ['id_medico_idx' => 4, 'esp_nombre' => 'Ginecología', 'dia' => 5, 'ini' => '08:00:00', 'fin' => '12:00:00', 'dur' => 30],

            // M5 (Eduardo Vargas)
            ['id_medico_idx' => 5, 'esp_nombre' => 'Odontología', 'dia' => 2, 'ini' => '08:00:00', 'fin' => '12:00:00', 'dur' => 30],
            ['id_medico_idx' => 5, 'esp_nombre' => 'Odontología', 'dia' => 3, 'ini' => '08:00:00', 'fin' => '12:00:00', 'dur' => 30],
            ['id_medico_idx' => 5, 'esp_nombre' => 'Odontología', 'dia' => 5, 'ini' => '14:00:00', 'fin' => '18:00:00', 'dur' => 30],

            // M6 (Fernanda Suárez)
            ['id_medico_idx' => 6, 'esp_nombre' => 'Fisioterapia', 'dia' => 4, 'ini' => '08:00:00', 'fin' => '12:00:00', 'dur' => 30],
            ['id_medico_idx' => 6, 'esp_nombre' => 'Fisioterapia', 'dia' => 5, 'ini' => '08:00:00', 'fin' => '12:00:00', 'dur' => 30],
            ['id_medico_idx' => 6, 'esp_nombre' => 'Fisioterapia', 'dia' => 6, 'ini' => '08:00:00', 'fin' => '12:00:00', 'dur' => 30],
        ];

        foreach ($horarios as $h) {
            $idMed = $medicosIds[$h['id_medico_idx']] ?? null;
            $idEsp = $especialidadesIds[$h['esp_nombre']] ?? null;

            if (!$idMed) {
                throw new \RuntimeException("Médico de índice {$h['id_medico_idx']} no encontrado para programar horario.");
            }
            if (!$idEsp) {
                throw new \RuntimeException("Especialidad '{$h['esp_nombre']}' no encontrada para programar horario.");
            }

            DB::table('horarios_atencion')->updateOrInsert(
                [
                    'id_medico' => $idMed,
                    'dia_semana' => $h['dia'],
                    'hora_inicio' => $h['ini'],
                ],
                [
                    'id_especialidad' => $idEsp,
                    'hora_fin' => $h['fin'],
                    'duracion_intervalo_minutos' => $h['dur'],
                    'estado' => 'activo',
                    'updated_at' => now(),
                ]
            );
        }

        // 4. Bloqueos institucionales y feriados de la clínica
        $hoy = Carbon::today('America/La_Paz');
        $anoNavidad = ($hoy->month == 12 && $hoy->day > 25) ? $hoy->year + 1 : $hoy->year;
        $anoNuevo = $hoy->year + 1;

        $bloqueos = [
            [
                'titulo' => 'Feriado Nacional - Navidad',
                'motivo' => 'Cierre institucional por celebraciones de Navidad.',
                'fecha_inicio' => Carbon::create($anoNavidad, 12, 25, 0, 0, 0, 'America/La_Paz')->toDateTimeString(),
                'fecha_fin' => Carbon::create($anoNavidad, 12, 25, 23, 59, 59, 'America/La_Paz')->toDateTimeString(),
                'aplica_a_todos' => true,
                'id_medico' => null,
                'estado' => 'activo',
            ],
            [
                'titulo' => 'Feriado Nacional - Año Nuevo',
                'motivo' => 'Cierre institucional por inicio de año nuevo.',
                'fecha_inicio' => Carbon::create($anoNuevo, 1, 1, 0, 0, 0, 'America/La_Paz')->toDateTimeString(),
                'fecha_fin' => Carbon::create($anoNuevo, 1, 1, 23, 59, 59, 'America/La_Paz')->toDateTimeString(),
                'aplica_a_todos' => true,
                'id_medico' => null,
                'estado' => 'activo',
            ],
        ];

        foreach ($bloqueos as $b) {
            DB::table('bloqueos_clinica')->updateOrInsert(
                ['titulo' => $b['titulo']],
                array_merge($b, ['updated_at' => now()])
            );
        }
    }
}
