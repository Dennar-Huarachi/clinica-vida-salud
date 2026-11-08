<?php

namespace Database\Seeders\Demostracion;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class PacientesDemoSeeder extends Seeder
{
    public function run(): void
    {
        $passwordHash = Hash::make('Clinica2026*');
        $hoy = Carbon::today('America/La_Paz');

        // Obtener dinámicamente el ID del rol paciente
        $idRolPaciente = DB::table('roles')->where('nombre', 'paciente')->value('id_rol');
        if (!$idRolPaciente) {
            throw new \RuntimeException("Rol 'paciente' no encontrado en la tabla roles. Verifique CatalogosBaseSeeder.");
        }

        // 20 Pacientes bolivianos con mezcla generacional (niños, adultos, adultos mayores)
        $pacientesData = [
            // 1. Adulto mayor (con cuenta P1, perfil completo)
            [
                'ci' => '7000001',
                'nombres' => 'Mario René',
                'apellidos' => 'Condori Gutiérrez',
                'fecha_nac' => $hoy->copy()->subYears(68)->subMonths(4)->toDateString(),
                'sexo' => 'M',
                'telefono' => '73000001',
                'correo' => 'paciente1@clinicavidasalud.com',
                'direccion' => 'Barrio Hamacas, Calle 8 #120, Santa Cruz',
                'codigo_hc' => 'HC-0001',
                'grupo_sang' => 'O+',
                'estado' => 'activo',
                'tiene_usuario' => true,
                'usuario' => 'paciente1',
                'perfil' => [
                    'alergias' => 'Penicilina y derivados betalactámicos.',
                    'cronicas' => 'Hipertensión Arterial Primaria (diagnosticada hace 10 años).',
                    'medicamentos' => 'Losartán 50mg (1 comprimido cada 12 hrs), Aspirina 100mg.',
                    'antecedentes' => 'Padre con antecedentes de infarto agudo de miocardio.',
                    'observaciones' => 'Paciente colaborador, controles cardiológicos semestrales.',
                    'contacto' => [
                        'nombre' => 'Elena Condori Vargas',
                        'relacion' => 'Hija',
                        'telefono' => '73100001',
                        'direccion' => 'Barrio Hamacas, Calle 8 #120, Santa Cruz',
                    ],
                ],
            ],
            // 2. Adulto (con cuenta P2, perfil completo)
            [
                'ci' => '7000002',
                'nombres' => 'Valeria',
                'apellidos' => 'Camacho Soliz',
                'fecha_nac' => $hoy->copy()->subYears(34)->subMonths(2)->toDateString(),
                'sexo' => 'F',
                'telefono' => '73000002',
                'correo' => 'paciente2@clinicavidasalud.com',
                'direccion' => 'Av. Cristóbal de Mendoza #550, Santa Cruz',
                'codigo_hc' => 'HC-0002',
                'grupo_sang' => 'A+',
                'estado' => 'activo',
                'tiene_usuario' => true,
                'usuario' => 'paciente2',
                'perfil' => [
                    'alergias' => 'AINEs (Ibuprofeno, Diclofenaco) causan urticaria leve.',
                    'cronicas' => 'Rinitis alérgica estacional.',
                    'medicamentos' => 'Cetirizina 10mg en episodios alérgicos agudos.',
                    'antecedentes' => 'Madre con hipotiroidismo.',
                    'observaciones' => 'Monitoreo preventivo ginecológico y general.',
                    'contacto' => [
                        'nombre' => 'Roberto Carlos Soliz',
                        'relacion' => 'Esposo',
                        'telefono' => '73100002',
                        'direccion' => 'Av. Cristóbal de Mendoza #550, Santa Cruz',
                    ],
                ],
            ],
            // 3. Niño (con cuenta P3 tutor, perfil completo)
            [
                'ci' => '7000003',
                'nombres' => 'Mateo Nicolás',
                'apellidos' => 'Aguilera Pinto',
                'fecha_nac' => $hoy->copy()->subYears(7)->subMonths(6)->toDateString(),
                'sexo' => 'M',
                'telefono' => '73000003',
                'correo' => 'paciente3@clinicavidasalud.com',
                'direccion' => 'Villa 1ro de Mayo, Calle 3 #45, Santa Cruz',
                'codigo_hc' => 'HC-0003',
                'grupo_sang' => 'B+',
                'estado' => 'activo',
                'tiene_usuario' => true,
                'usuario' => 'paciente3',
                'perfil' => [
                    'alergias' => 'Ninguna conocida.',
                    'cronicas' => 'Asma bronquial infantil controlada.',
                    'medicamentos' => 'Salbutamol en aerosol según demanda bronquial.',
                    'antecedentes' => 'Tío materno con dermatitis atópica.',
                    'observaciones' => 'Esquema nacional de vacunación completo.',
                    'contacto' => [
                        'nombre' => 'Carla Pinto Méndez',
                        'relacion' => 'Madre',
                        'telefono' => '73100003',
                        'direccion' => 'Villa 1ro de Mayo, Calle 3 #45, Santa Cruz',
                    ],
                ],
            ],
            // 4. Adulto mayor (con cuenta P4, perfil completo)
            [
                'ci' => '7000004',
                'nombres' => 'Esperanza',
                'apellidos' => 'Vargas vda. de Roca',
                'fecha_nac' => $hoy->copy()->subYears(74)->subMonths(8)->toDateString(),
                'sexo' => 'F',
                'telefono' => '73000004',
                'correo' => 'paciente4@clinicavidasalud.com',
                'direccion' => 'Barrio Las Palmas, Calle Las Begonias #80, Santa Cruz',
                'codigo_hc' => 'HC-0004',
                'grupo_sang' => 'O-',
                'estado' => 'activo',
                'tiene_usuario' => true,
                'usuario' => 'paciente4',
                'perfil' => [
                    'alergias' => 'Sulfas y sulfamidas.',
                    'cronicas' => 'Osteoartritis degenerativa en rodilla bilateral, Diabetes Tipo 2.',
                    'medicamentos' => 'Metformina 850mg (con almuerzo), Glucosamina/Condroitina.',
                    'antecedentes' => 'Ambos padres diabéticos.',
                    'observaciones' => 'Utiliza bastón para apoyo motor. Asiste con acompañante.',
                    'contacto' => [
                        'nombre' => 'Fernando Roca Vargas',
                        'relacion' => 'Hijo',
                        'telefono' => '73100004',
                        'direccion' => 'Barrio Las Palmas, Calle Las Begonias #80, Santa Cruz',
                    ],
                ],
            ],
            // 5. Adulto (con cuenta P5)
            [
                'ci' => '7000005',
                'nombres' => 'Jorge Luis',
                'apellidos' => 'Salvatierra Morales',
                'fecha_nac' => $hoy->copy()->subYears(41)->toDateString(),
                'sexo' => 'M',
                'telefono' => '73000005',
                'correo' => 'paciente5@clinicavidasalud.com',
                'direccion' => 'Av. Santos Dumont #310, Santa Cruz',
                'codigo_hc' => 'HC-0005',
                'grupo_sang' => 'O+',
                'estado' => 'activo',
                'tiene_usuario' => true,
                'usuario' => 'paciente5',
                'perfil' => null,
            ],
            // 6. Adulto (con cuenta P6)
            [
                'ci' => '7000006',
                'nombres' => 'Natalia',
                'apellidos' => 'Paredes Justiniano',
                'fecha_nac' => $hoy->copy()->subYears(28)->toDateString(),
                'sexo' => 'F',
                'telefono' => '73000006',
                'correo' => 'paciente6@clinicavidasalud.com',
                'direccion' => 'Condominio Urbari #204, Santa Cruz',
                'codigo_hc' => 'HC-0006',
                'grupo_sang' => 'A-',
                'estado' => 'activo',
                'tiene_usuario' => true,
                'usuario' => 'paciente6',
                'perfil' => null,
            ],
            // 7. Niña (sin cuenta)
            [
                'ci' => '7000007',
                'nombres' => 'Luciana',
                'apellidos' => 'Gutiérrez Mercado',
                'fecha_nac' => $hoy->copy()->subYears(4)->toDateString(),
                'sexo' => 'F',
                'telefono' => '73000007',
                'correo' => null,
                'direccion' => 'Av. San Aurelio #140, Santa Cruz',
                'codigo_hc' => 'HC-0007',
                'grupo_sang' => 'O+',
                'estado' => 'activo',
                'tiene_usuario' => false,
                'perfil' => null,
            ],
            // 8. Adulto (sin cuenta)
            [
                'ci' => '7000008',
                'nombres' => 'Gustavo Adolfo',
                'apellidos' => 'Ríos Barba',
                'fecha_nac' => $hoy->copy()->subYears(45)->toDateString(),
                'sexo' => 'M',
                'telefono' => '73000008',
                'correo' => 'gustavo.rios@gmail.com',
                'direccion' => 'Plan 3000, Barrio Los Lotes #55, Santa Cruz',
                'codigo_hc' => 'HC-0008',
                'grupo_sang' => 'A+',
                'estado' => 'activo',
                'tiene_usuario' => false,
                'perfil' => null,
            ],
            // 9. Adulto mayor (sin cuenta)
            [
                'ci' => '7000009',
                'nombres' => 'Dora',
                'apellidos' => 'Méndez Ortiz',
                'fecha_nac' => $hoy->copy()->subYears(71)->toDateString(),
                'sexo' => 'F',
                'telefono' => '73000009',
                'correo' => null,
                'direccion' => 'Calle 24 de Septiembre #110, Santa Cruz',
                'codigo_hc' => 'HC-0009',
                'grupo_sang' => 'O+',
                'estado' => 'activo',
                'tiene_usuario' => false,
                'perfil' => null,
            ],
            // 10. Niño (sin cuenta)
            [
                'ci' => '7000010',
                'nombres' => 'Joaquín',
                'apellidos' => 'Baldivieso Paz',
                'fecha_nac' => $hoy->copy()->subYears(10)->toDateString(),
                'sexo' => 'M',
                'telefono' => '73000010',
                'correo' => null,
                'direccion' => 'Av. Banzer km 8 1/2, Santa Cruz',
                'codigo_hc' => 'HC-0010',
                'grupo_sang' => 'B+',
                'estado' => 'activo',
                'tiene_usuario' => false,
                'perfil' => null,
            ],
            // 11. Adulto (sin cuenta)
            [
                'ci' => '7000011',
                'nombres' => 'Camila',
                'apellidos' => 'Chávez Dorado',
                'fecha_nac' => $hoy->copy()->subYears(31)->toDateString(),
                'sexo' => 'F',
                'telefono' => '73000011',
                'correo' => 'camila.chavez@hotmail.com',
                'direccion' => 'Barrio Sirari, Calle 2 #15, Santa Cruz',
                'codigo_hc' => 'HC-0011',
                'grupo_sang' => 'O+',
                'estado' => 'activo',
                'tiene_usuario' => false,
                'perfil' => null,
            ],
            // 12. Adulto (sin cuenta)
            [
                'ci' => '7000012',
                'nombres' => 'Víctor Hugo',
                'apellidos' => 'Mamani Choque',
                'fecha_nac' => $hoy->copy()->subYears(52)->toDateString(),
                'sexo' => 'M',
                'telefono' => '73000012',
                'correo' => 'vh.mamani@gmail.com',
                'direccion' => 'Av. Mutualista entre 3er y 4to anillo #210, Santa Cruz',
                'codigo_hc' => 'HC-0012',
                'grupo_sang' => 'O+',
                'estado' => 'activo',
                'tiene_usuario' => false,
                'perfil' => null,
            ],
            // 13. Adulto mayor (sin cuenta)
            [
                'ci' => '7000013',
                'nombres' => 'Genaro',
                'apellidos' => 'Rojas Claros',
                'fecha_nac' => $hoy->copy()->subYears(80)->toDateString(),
                'sexo' => 'M',
                'telefono' => '73000013',
                'correo' => null,
                'direccion' => 'Av. Piraí #430, Santa Cruz',
                'codigo_hc' => 'HC-0013',
                'grupo_sang' => 'A+',
                'estado' => 'activo',
                'tiene_usuario' => false,
                'perfil' => null,
            ],
            // 14. Niña (sin cuenta)
            [
                'ci' => '7000014',
                'nombres' => 'Sofía Valentina',
                'apellidos' => 'Zeballos Arce',
                'fecha_nac' => $hoy->copy()->subYears(6)->toDateString(),
                'sexo' => 'F',
                'telefono' => '73000014',
                'correo' => null,
                'direccion' => 'Calle Suárez Arana #89, Santa Cruz',
                'codigo_hc' => 'HC-0014',
                'grupo_sang' => 'O+',
                'estado' => 'activo',
                'tiene_usuario' => false,
                'perfil' => null,
            ],
            // 15. Adulto (sin cuenta)
            [
                'ci' => '7000015',
                'nombres' => 'Pablo Andrés',
                'apellidos' => 'Molina Velasco',
                'fecha_nac' => $hoy->copy()->subYears(38)->toDateString(),
                'sexo' => 'M',
                'telefono' => '73000015',
                'correo' => 'pablo.molina@gmail.com',
                'direccion' => 'Barrio Equipetrol Norte #340, Santa Cruz',
                'codigo_hc' => 'HC-0015',
                'grupo_sang' => 'B-',
                'estado' => 'activo',
                'tiene_usuario' => false,
                'perfil' => null,
            ],
            // 16. Adulto (sin cuenta)
            [
                'ci' => '7000016',
                'nombres' => 'Mariana',
                'apellidos' => 'Quiroga Salvatierra',
                'fecha_nac' => $hoy->copy()->subYears(26)->toDateString(),
                'sexo' => 'F',
                'telefono' => '73000016',
                'correo' => 'mariana.quiroga@yahoo.es',
                'direccion' => 'Av. Centenario #78, Santa Cruz',
                'codigo_hc' => 'HC-0016',
                'grupo_sang' => 'O+',
                'estado' => 'activo',
                'tiene_usuario' => false,
                'perfil' => null,
            ],
            // 17. Adulto mayor (sin cuenta)
            [
                'ci' => '7000017',
                'nombres' => 'Julio César',
                'apellidos' => 'Añez Justiniano',
                'fecha_nac' => $hoy->copy()->subYears(66)->toDateString(),
                'sexo' => 'M',
                'telefono' => '73000017',
                'correo' => null,
                'direccion' => 'Calle Warnes #310, Santa Cruz',
                'codigo_hc' => 'HC-0017',
                'grupo_sang' => 'AB+',
                'estado' => 'activo',
                'tiene_usuario' => false,
                'perfil' => null,
            ],
            // 18. Adulto (sin cuenta)
            [
                'ci' => '7000018',
                'nombres' => 'Gabriela',
                'apellidos' => 'Terceros Antelo',
                'fecha_nac' => $hoy->copy()->subYears(36)->toDateString(),
                'sexo' => 'F',
                'telefono' => '73000018',
                'correo' => 'gaby.terceros@gmail.com',
                'direccion' => 'Av. Busch #890, Santa Cruz',
                'codigo_hc' => 'HC-0018',
                'grupo_sang' => 'A+',
                'estado' => 'activo',
                'tiene_usuario' => false,
                'perfil' => null,
            ],
            // 19. Paciente INACTIVO 1
            [
                'ci' => '7000019',
                'nombres' => 'Esteban',
                'apellidos' => 'Barrientos Cuéllar',
                'fecha_nac' => $hoy->copy()->subYears(48)->toDateString(),
                'sexo' => 'M',
                'telefono' => '73000019',
                'correo' => 'esteban.barrientos@gmail.com',
                'direccion' => 'Barrio El Trompillo #12, Santa Cruz',
                'codigo_hc' => 'HC-0019',
                'grupo_sang' => 'O+',
                'estado' => 'inactivo',
                'tiene_usuario' => false,
                'perfil' => null,
            ],
            // 20. Paciente INACTIVO 2
            [
                'ci' => '7000020',
                'nombres' => 'Teresa',
                'apellidos' => 'Villarroel Saucedo',
                'fecha_nac' => $hoy->copy()->subYears(57)->toDateString(),
                'sexo' => 'F',
                'telefono' => '73000020',
                'correo' => 'teresa.villarroel@hotmail.com',
                'direccion' => 'Av. Radial 10 #650, Santa Cruz',
                'codigo_hc' => 'HC-0020',
                'grupo_sang' => 'O+',
                'estado' => 'inactivo',
                'tiene_usuario' => false,
                'perfil' => null,
            ],
        ];

        foreach ($pacientesData as $p) {
            // Persona
            $persona = DB::table('personas')->where('ci', $p['ci'])->first();
            if ($persona) {
                DB::table('personas')->where('id_persona', $persona->id_persona)->update([
                    'nombres' => $p['nombres'],
                    'apellidos' => $p['apellidos'],
                    'fecha_nacimiento' => $p['fecha_nac'],
                    'sexo' => $p['sexo'],
                    'telefono' => $p['telefono'],
                    'correo' => $p['correo'],
                    'direccion' => $p['direccion'],
                    'updated_at' => now(),
                ]);
                $idPersona = $persona->id_persona;
            } else {
                $idPersona = DB::table('personas')->insertGetId([
                    'ci' => $p['ci'],
                    'nombres' => $p['nombres'],
                    'apellidos' => $p['apellidos'],
                    'fecha_nacimiento' => $p['fecha_nac'],
                    'sexo' => $p['sexo'],
                    'telefono' => $p['telefono'],
                    'correo' => $p['correo'],
                    'direccion' => $p['direccion'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ], 'id_persona');
            }

            // Paciente
            $paciente = DB::table('pacientes')->where('codigo_historia', $p['codigo_hc'])->first();
            if ($paciente) {
                DB::table('pacientes')->where('id_paciente', $paciente->id_paciente)->update([
                    'id_persona' => $idPersona,
                    'grupo_sanguineo' => $p['grupo_sang'],
                    'estado' => $p['estado'],
                    'updated_at' => now(),
                ]);
                $idPaciente = $paciente->id_paciente;
            } else {
                $idPaciente = DB::table('pacientes')->insertGetId([
                    'id_persona' => $idPersona,
                    'codigo_historia' => $p['codigo_hc'],
                    'grupo_sanguineo' => $p['grupo_sang'],
                    'estado' => $p['estado'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ], 'id_paciente');
            }

            // Cuenta de usuario (si aplica)
            if ($p['tiene_usuario']) {
                $usuario = DB::table('usuarios')->where('nombre_usuario', $p['usuario'])->first();
                if ($usuario) {
                    DB::table('usuarios')->where('id_usuario', $usuario->id_usuario)->update([
                        'id_persona' => $idPersona,
                        'id_rol' => $idRolPaciente,
                        'correo' => $p['correo'],
                        'contrasena_hash' => $passwordHash,
                        'debe_cambiar_contrasena' => false,
                        'estado' => 'activo',
                        'updated_at' => now(),
                    ]);
                } else {
                    DB::table('usuarios')->insert([
                        'id_persona' => $idPersona,
                        'id_rol' => $idRolPaciente,
                        'nombre_usuario' => $p['usuario'],
                        'correo' => $p['correo'],
                        'contrasena_hash' => $passwordHash,
                        'debe_cambiar_contrasena' => false,
                        'estado' => 'activo',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            // Perfil médico y contacto de emergencia (4 pacientes)
            if ($p['perfil']) {
                DB::table('informacion_medica_paciente')->updateOrInsert(
                    ['id_paciente' => $idPaciente],
                    [
                        'alergias' => $p['perfil']['alergias'],
                        'enfermedades_cronicas' => $p['perfil']['cronicas'],
                        'medicamentos_actuales' => $p['perfil']['medicamentos'],
                        'antecedentes_familiares' => $p['perfil']['antecedentes'],
                        'observaciones' => $p['perfil']['observaciones'],
                        'updated_at' => now(),
                    ]
                );

                if (isset($p['perfil']['contacto'])) {
                    $cont = $p['perfil']['contacto'];
                    DB::table('contactos_emergencia')->updateOrInsert(
                        ['id_paciente' => $idPaciente, 'nombre_completo' => $cont['nombre']],
                        [
                            'relacion' => $cont['relacion'],
                            'telefono' => $cont['telefono'],
                            'direccion' => $cont['direccion'],
                            'es_principal' => true,
                            'updated_at' => now(),
                        ]
                    );
                }
            }
        }
    }
}

