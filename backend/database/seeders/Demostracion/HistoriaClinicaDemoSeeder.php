<?php

namespace Database\Seeders\Demostracion;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class HistoriaClinicaDemoSeeder extends Seeder
{
    public function run(): void
    {
        // 8 citas Atendida con pacientes distintos
        $atencionesData = [
            [
                'codigo_cita' => 'CM-0001', // Paciente 1, Med Gral
                'motivo' => 'Control rutinario de hipertensión arterial. Refiere mareos leves matutinos ocasionales.',
                'examen' => 'PA: 135/85 mmHg, FC: 74 lpm, FR: 16 rpm, SatO2: 98%. Ruidos cardíacos rítmicos normofonéticos sin soplos.',
                'diagnostico' => 'I10 Hipertensión Esencial (Primaria) en control farmacológico.',
                'tratamiento' => 'Mantener Losartán 50mg cada 12 horas. Dieta hiposódica estricta, hidratación adecuada y caminata 30 min diarios.',
                'receta' => 'Losartán 50mg VO #60 comprimidos. Tomar 1 comprimido a las 08:00 y 1 comprimido a las 20:00.',
                'laboratorio' => [
                    'tipo' => 'Perfil Lipídico y Función Renal',
                    'descripcion' => 'Laboratorio Central Vida Salud. Colesterol Total: 195 mg/dL, Triglicéridos: 160 mg/dL, Creatinina sérica: 0.9 mg/dL, Urea: 28 mg/dL. Función renal conservada.',
                ],
            ],
            [
                'codigo_cita' => 'CM-0002', // Paciente 2, Med Gral
                'motivo' => 'Cefalea pulsátil frontal y cervicalgia tensional de 4 días de evolución posterior a jornada laboral.',
                'examen' => 'PA: 115/75 mmHg, afebril, pupilas isocóricas reactivas. Contractura palpable en trapecios bilaterales.',
                'diagnostico' => 'G44.2 Cefalea tensional episódica asociada a estrés osteomuscular.',
                'tratamiento' => 'Reposo relativo de pantallas. Ejercicios de estiramiento cervical y terapia analgésica de rescate.',
                'receta' => 'Paracetamol 500mg VO #20 comprimidos. Tomar 1 comprimido cada 8 horas si hay dolor intenso.',
                'laboratorio' => null,
            ],
            [
                'codigo_cita' => 'CM-0003', // Paciente 4, Ginecología
                'motivo' => 'Control prenatal de rutina correspondiente al segundo trimestre de gestación (semana 22).',
                'examen' => 'PA: 110/70 mmHg, AU: 21 cm, FCF: 142 lpm presente y rítmica. Movimientos fetales activos. Sin edemas.',
                'diagnostico' => 'Z34.8 Supervisión de embarazo normal del segundo trimestre.',
                'tratamiento' => 'Continuar suplementación con hierro y ácido fólico. Ecografía morfológica de control programada.',
                'receta' => 'Sulfato Ferroso 200mg + Ácido Fólico 0.5mg VO #30 cápsulas. Tomar 1 cápsula en ayunas.',
                'laboratorio' => [
                    'tipo' => 'Hemograma Completo y Glucemia en Ayunas',
                    'descripcion' => 'Laboratorio Central Vida Salud. Hemoglobina: 12.8 g/dL, Hematocrito: 38.5%, Glucosa: 84 mg/dL. Sin indicios de anemia gestacional ni diabetes.',
                ],
            ],
            [
                'codigo_cita' => 'CM-0004', // Paciente 3 (Niño), Pediatría
                'motivo' => 'Cuadro respiratorio de 48 horas: rinorrea hialina, estornudos y tos seca no productiva.',
                'examen' => 'T: 36.8°C, mucosa nasal congestiva, faringe levemente eritematosa sin exudados. Murmullo vesicular conservado bilateral.',
                'diagnostico' => 'J00 Rinofaringitis aguda catarral de etiología viral (Resfrío común).',
                'tratamiento' => 'Lavados nasales frecuentes con solución salina al 0.9%. Abundante ingesta de líquidos tibios. Medidas de confort.',
                'receta' => 'Solución Salina Nasal spray frasco #1. Aplicar 2 pulverizaciones en cada fosa nasal cada 4 a 6 horas.',
                'laboratorio' => null,
            ],
            [
                'codigo_cita' => 'CM-0006', // Paciente 9, Geriatría
                'motivo' => 'Gonalgia bilateral que empeora con la deambulación prolongada y rigidez articular matutina breve.',
                'examen' => 'Crepitación articular femorotibial bilateral a la flexo-extensión. Sin derrame articular ni eritema.',
                'diagnostico' => 'M17.0 Gonartrosis primaria bilateral grado II.',
                'tratamiento' => 'Evitar sobrecargas de peso y escaleras empinadas. Fisioterapia motora suave y fortalecimiento de cuádriceps.',
                'receta' => 'Glucosamina sulfato 1500mg sobres #30. Disolver 1 sobre al día con el desayuno.',
                'laboratorio' => null,
            ],
            [
                'codigo_cita' => 'CM-0009', // Paciente 12, Cardiología
                'motivo' => 'Control cardiológico post-electrocardiograma de esfuerzo. Evaluación preventiva periódica.',
                'examen' => 'PA: 125/80 mmHg, FC: 68 lpm rítmica. Auscultación cardíaca sin soplos. Pulsos periféricos simétricos.',
                'diagnostico' => 'Z01.8 Examen médico especial cardiovascular preventivo.',
                'tratamiento' => 'Hábitos cardiosaludables. Mantener perfil lipídico dentro de metas primarias. Próximo control en 1 año.',
                'receta' => 'No requiere medicación específica actual. Mantener estilo de vida activo.',
                'laboratorio' => [
                    'tipo' => 'Perfil Lipídico Completo y Creatinina',
                    'descripcion' => 'Laboratorio Clínico Vida Salud. Triglicéridos: 138 mg/dL, Colesterol HDL: 52 mg/dL, Colesterol LDL: 108 mg/dL. Índice aterogénico bajo.',
                ],
            ],
            [
                'codigo_cita' => 'CM-0010', // Paciente 7, Pediatría
                'motivo' => 'Control de crecimiento y desarrollo de la niña sana (4 años).',
                'examen' => 'Peso: 16.5 kg (percentil 50), Talla: 102 cm (percentil 50). Examen neurológico y psicomotor acorde a su edad.',
                'diagnostico' => 'Z00.1 Control de salud de rutina del niño en edad preescolar.',
                'tratamiento' => 'Promoción de alimentación variada y rica en calcio. Hábitos de higiene dental supervisada.',
                'receta' => 'Vitamina C y Zinc suspensión pediátrica frasco #1. Tomar 5ml diarios por 1 mes.',
                'laboratorio' => null,
            ],
            [
                'codigo_cita' => 'CM-0015', // Paciente 15, Odontología
                'motivo' => 'Sensibilidad dental localizada en premolares superiores con bebidas frías. Profilaxis anual.',
                'examen' => 'Gingiva con ligera inflamación marginal sin sangrado espontáneo. Presencia de placa bacteriana leve.',
                'diagnostico' => 'K05.0 Gingivitis aguda marginal y sensibilidad dentinaria.',
                'tratamiento' => 'Profilaxis dental ultrasónica completada hoy. Aplicación tópica de barniz de flúor remineralizante.',
                'receta' => 'Clorhexidina al 0.12% colutorio frasco #1. Enjuagar 15ml después del cepillado durante 7 días.',
                'laboratorio' => [
                    'tipo' => 'Examen General de Orina y Glicemia',
                    'descripcion' => 'Laboratorio Central Vida Salud. Glucosa: 89 mg/dL. Sedimento urinario: leucocitos 0-2 x campo, células epiteliales escasas, bacterias negativas. Normal.',
                ],
            ],
        ];

        foreach ($atencionesData as $a) {
            $cita = DB::table('citas')->where('codigo_cita', $a['codigo_cita'])->first();
            if (!$cita) {
                throw new \RuntimeException("Cita '{$a['codigo_cita']}' no encontrada para registrar la atención clínica.");
            }

            $fechaAtencion = Carbon::parse($cita->fecha_cita . ' ' . $cita->hora_inicio);

            $atencionExistente = DB::table('atenciones_clinicas')->where('id_cita', $cita->id_cita)->first();
            if ($atencionExistente) {
                DB::table('atenciones_clinicas')->where('id_atencion', $atencionExistente->id_atencion)->update([
                    'id_paciente' => $cita->id_paciente,
                    'id_medico' => $cita->id_medico,
                    'motivo_atencion' => $a['motivo'],
                    'examen_fisico' => $a['examen'],
                    'diagnostico' => $a['diagnostico'],
                    'tratamiento_indicaciones' => $a['tratamiento'],
                    'receta_medica' => $a['receta'],
                    'fecha_atencion' => $fechaAtencion->toDateTimeString(),
                    'updated_at' => now(),
                ]);
                $idAtencion = (int)$atencionExistente->id_atencion;
            } else {
                $idAtencion = (int)DB::table('atenciones_clinicas')->insertGetId([
                    'id_cita' => $cita->id_cita,
                    'id_paciente' => $cita->id_paciente,
                    'id_medico' => $cita->id_medico,
                    'motivo_atencion' => $a['motivo'],
                    'examen_fisico' => $a['examen'],
                    'diagnostico' => $a['diagnostico'],
                    'tratamiento_indicaciones' => $a['tratamiento'],
                    'receta_medica' => $a['receta'],
                    'fecha_atencion' => $fechaAtencion->toDateTimeString(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ], 'id_atencion');
            }

            // Resultados de laboratorio vinculados (4 resultados)
            if ($a['laboratorio']) {
                $lab = $a['laboratorio'];
                $fechaEstudio = $fechaAtencion->copy()->addDay()->toDateString();

                DB::table('resultados_laboratorio')->updateOrInsert(
                    [
                        'id_paciente' => $cita->id_paciente,
                        'tipo_estudio' => $lab['tipo'],
                    ],
                    [
                        'id_atencion' => $idAtencion,
                        'descripcion' => $lab['descripcion'],
                        'archivo_adjunto' => 'lab_resultados_' . strtolower(str_replace(' ', '_', $cita->codigo_cita)) . '.pdf',
                        'fecha_estudio' => $fechaEstudio,
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]
                );
            }
        }
    }
}
