<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    private function normalizar(string $texto): string
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

    /**
     * Poblado inicial idempotente de la base de datos de la Clínica "Vida Salud".
     */
    public function run(): void
    {
        // 1. Catálogos base obligatorios (Roles, Estados de Cita, Parámetros del Sistema)
        $this->call(CatalogosBaseSeeder::class);

        // 2. Especialidades iniciales (sin IDs manuales, búsqueda idempotente por clave natural)
        $especialidades = [
            ['nombre' => 'Medicina General', 'descripcion' => 'Atención primaria y diagnóstico integral', 'duracion_turno_minutos' => 15, 'estado' => 'activo'],
            ['nombre' => 'Pediatría', 'descripcion' => 'Atención médica integral infantil y adolescente', 'duracion_turno_minutos' => 20, 'estado' => 'activo'],
            ['nombre' => 'Cardiología', 'descripcion' => 'Prevención, diagnóstico y tratamiento cardiovascular', 'duracion_turno_minutos' => 30, 'estado' => 'activo'],
            ['nombre' => 'Ginecología y Obstetricia', 'descripcion' => 'Salud reproductiva femenina y control prenatal', 'duracion_turno_minutos' => 20, 'estado' => 'activo'],
            ['nombre' => 'Traumatología', 'descripcion' => 'Lesiones osteoarticulares y rehabilitación musculoesquelética', 'duracion_turno_minutos' => 20, 'estado' => 'activo'],
        ];

        foreach ($especialidades as $esp) {
            $nombreNorm = $this->normalizar($esp['nombre']);
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
                    'estado' => $esp['estado'],
                    'updated_at' => now(),
                ]);
            } else {
                DB::table('especialidades')->insert([
                    'nombre' => $esp['nombre'],
                    'nombre_normalizado' => $nombreNorm,
                    'descripcion' => $esp['descripcion'],
                    'duracion_turno_minutos' => $esp['duracion_turno_minutos'],
                    'estado' => $esp['estado'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // 3. Obtener dinámicamente el ID del rol Administrador
        $idRolAdmin = DB::table('roles')->where('nombre', 'administrador')->value('id_rol');
        if (!$idRolAdmin) {
            throw new \RuntimeException("El rol 'administrador' no fue encontrado en la tabla roles.");
        }

        // 4. Usuario Administrador inicial (idempotente)
        $personaAdmin = DB::table('personas')->where('ci', '1000001')->orWhere('correo', 'admin@vidasalud.com')->first();
        if (!$personaAdmin) {
            $idPersonaAdmin = DB::table('personas')->insertGetId([
                'ci' => '1000001',
                'nombres' => 'Administrador',
                'apellidos' => 'Vida Salud',
                'fecha_nacimiento' => '1988-05-15',
                'sexo' => 'M',
                'telefono' => '70001234',
                'correo' => 'admin@vidasalud.com',
                'direccion' => 'Av. Principal #100',
                'created_at' => now(),
                'updated_at' => now(),
            ], 'id_persona');
        } else {
            $idPersonaAdmin = $personaAdmin->id_persona;
            DB::table('personas')->where('id_persona', $idPersonaAdmin)->update([
                'nombres' => 'Administrador',
                'apellidos' => 'Vida Salud',
                'fecha_nacimiento' => '1988-05-15',
                'sexo' => 'M',
                'telefono' => '70001234',
                'correo' => 'admin@vidasalud.com',
                'direccion' => 'Av. Principal #100',
                'updated_at' => now(),
            ]);
        }

        $usuarioAdmin = DB::table('usuarios')->where('nombre_usuario', 'admin')->orWhere('correo', 'admin@vidasalud.com')->first();
        if (!$usuarioAdmin) {
            DB::table('usuarios')->insert([
                'id_persona' => $idPersonaAdmin,
                'id_rol' => $idRolAdmin,
                'nombre_usuario' => 'admin',
                'correo' => 'admin@vidasalud.com',
                'contrasena_hash' => Hash::make('admin123'),
                'debe_cambiar_contrasena' => false,
                'estado' => 'activo',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            DB::table('usuarios')->where('id_usuario', $usuarioAdmin->id_usuario)->update([
                'id_persona' => $idPersonaAdmin,
                'id_rol' => $idRolAdmin,
                'nombre_usuario' => 'admin',
                'correo' => 'admin@vidasalud.com',
                'contrasena_hash' => Hash::make('admin123'),
                'debe_cambiar_contrasena' => false,
                'estado' => 'activo',
                'updated_at' => now(),
            ]);
        }

        // 5. Permisos del sistema y matriz modular
        $this->call(PermisosSeeder::class);
    }
}
