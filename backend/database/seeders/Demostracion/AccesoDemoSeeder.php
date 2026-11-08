<?php

namespace Database\Seeders\Demostracion;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AccesoDemoSeeder extends Seeder
{
    /**
     * Poblado de usuarios, roles y personal del sistema.
     */
    public function run(): void
    {
        $passwordHash = Hash::make('Clinica2026*');

        // 1. Obtener dinámicamente los IDs de roles (sin números fijos)
        $idRolAdmin = DB::table('roles')->where('nombre', 'administrador')->value('id_rol');
        $idRolMedico = DB::table('roles')->where('nombre', 'medico')->value('id_rol');
        $idRolRecepcionista = DB::table('roles')->where('nombre', 'recepcionista')->value('id_rol');

        if (!$idRolAdmin || !$idRolMedico || !$idRolRecepcionista) {
            throw new \RuntimeException("Roles institucionales no encontrados. Asegúrese de ejecutar CatalogosBaseSeeder previamente.");
        }

        // 2. Administrador general (admin@clinicavidasalud.com)
        $idPersonaAdmin = $this->crearOActualizarPersona([
            'ci' => '1000001',
            'nombres' => 'Carlos Alberto',
            'apellidos' => 'Mamani Quispe',
            'fecha_nacimiento' => '1985-06-15',
            'sexo' => 'M',
            'telefono' => '71000001',
            'correo' => 'admin@clinicavidasalud.com',
            'direccion' => 'Av. San Martín #450, Equipetrol, Santa Cruz',
        ]);

        $this->crearOActualizarUsuario([
            'id_persona' => $idPersonaAdmin,
            'id_rol' => $idRolAdmin,
            'nombre_usuario' => 'admin',
            'correo' => 'admin@clinicavidasalud.com',
            'contrasena_hash' => $passwordHash,
            'debe_cambiar_contrasena' => false,
            'estado' => 'activo',
        ]);

        // 3. Dos recepcionistas
        $recepcionistas = [
            [
                'ci' => '1000002',
                'nombres' => 'Lucía Mariana',
                'apellidos' => 'Fernández Vaca',
                'fecha_nacimiento' => '1994-03-22',
                'sexo' => 'F',
                'telefono' => '71000002',
                'correo' => 'recepcion1@clinicavidasalud.com',
                'direccion' => 'Calle Ballivián #210, Casco Viejo, Santa Cruz',
                'nombre_usuario' => 'recepcion1',
            ],
            [
                'ci' => '1000003',
                'nombres' => 'Paola Andrea',
                'apellidos' => 'Flores Choque',
                'fecha_nacimiento' => '1996-11-10',
                'sexo' => 'F',
                'telefono' => '71000003',
                'correo' => 'recepcion2@clinicavidasalud.com',
                'direccion' => 'Av. Cañoto #780, Santa Cruz',
                'nombre_usuario' => 'recepcion2',
            ],
        ];

        foreach ($recepcionistas as $rec) {
            $idPersonaRec = $this->crearOActualizarPersona([
                'ci' => $rec['ci'],
                'nombres' => $rec['nombres'],
                'apellidos' => $rec['apellidos'],
                'fecha_nacimiento' => $rec['fecha_nacimiento'],
                'sexo' => $rec['sexo'],
                'telefono' => $rec['telefono'],
                'correo' => $rec['correo'],
                'direccion' => $rec['direccion'],
            ]);

            $this->crearOActualizarUsuario([
                'id_persona' => $idPersonaRec,
                'id_rol' => $idRolRecepcionista,
                'nombre_usuario' => $rec['nombre_usuario'],
                'correo' => $rec['correo'],
                'contrasena_hash' => $passwordHash,
                'debe_cambiar_contrasena' => false,
                'estado' => 'activo',
            ]);
        }

        // 4. Seis Médicos (Personal Médico con cuentas de usuario)
        $medicos = [
            [
                'ci' => '1000011',
                'nombres' => 'Alejandro',
                'apellidos' => 'Alarcón Paz',
                'fecha_nacimiento' => '1979-08-14',
                'sexo' => 'M',
                'telefono' => '72000001',
                'correo' => 'dr.alarcon@clinicavidasalud.com',
                'direccion' => 'Av. Las Américas #300, Santa Cruz',
                'nombre_usuario' => 'dr.alarcon',
            ],
            [
                'ci' => '1000012',
                'nombres' => 'Beatriz Elena',
                'apellidos' => 'Torres Mendoza',
                'fecha_nacimiento' => '1983-04-19',
                'sexo' => 'F',
                'telefono' => '72000002',
                'correo' => 'dra.torres@clinicavidasalud.com',
                'direccion' => 'Barrio Sirari, Calle Los Claveles #45, Santa Cruz',
                'nombre_usuario' => 'dra.torres',
            ],
            [
                'ci' => '1000013',
                'nombres' => 'Carlos Javier',
                'apellidos' => 'Guzmán Roca',
                'fecha_nacimiento' => '1975-12-05',
                'sexo' => 'M',
                'telefono' => '72000003',
                'correo' => 'dr.guzman@clinicavidasalud.com',
                'direccion' => 'Av. Busch #1240, Santa Cruz',
                'nombre_usuario' => 'dr.guzman',
            ],
            [
                'ci' => '1000014',
                'nombres' => 'Daniela Sofía',
                'apellidos' => 'Rojas Arteaga',
                'fecha_nacimiento' => '1987-09-30',
                'sexo' => 'F',
                'telefono' => '72000004',
                'correo' => 'dra.rojas@clinicavidasalud.com',
                'direccion' => 'Condominio Sevilla Real #12, Santa Cruz',
                'nombre_usuario' => 'dra.rojas',
            ],
            [
                'ci' => '1000015',
                'nombres' => 'Eduardo Daniel',
                'apellidos' => 'Vargas Mercado',
                'fecha_nacimiento' => '1981-01-25',
                'sexo' => 'M',
                'telefono' => '72000005',
                'correo' => 'dr.vargas@clinicavidasalud.com',
                'direccion' => 'Av. Beni entre 2do y 3er anillo #650, Santa Cruz',
                'nombre_usuario' => 'dr.vargas',
            ],
            [
                'ci' => '1000016',
                'nombres' => 'Fernanda Lucía',
                'apellidos' => 'Suárez Justiniano',
                'fecha_nacimiento' => '1989-07-11',
                'sexo' => 'F',
                'telefono' => '72000006',
                'correo' => 'dra.suarez@clinicavidasalud.com',
                'direccion' => 'Av. Irala #890, Santa Cruz',
                'nombre_usuario' => 'dra.suarez',
            ],
        ];

        foreach ($medicos as $med) {
            $idPersonaMed = $this->crearOActualizarPersona([
                'ci' => $med['ci'],
                'nombres' => $med['nombres'],
                'apellidos' => $med['apellidos'],
                'fecha_nacimiento' => $med['fecha_nacimiento'],
                'sexo' => $med['sexo'],
                'telefono' => $med['telefono'],
                'correo' => $med['correo'],
                'direccion' => $med['direccion'],
            ]);

            $this->crearOActualizarUsuario([
                'id_persona' => $idPersonaMed,
                'id_rol' => $idRolMedico,
                'nombre_usuario' => $med['nombre_usuario'],
                'correo' => $med['correo'],
                'contrasena_hash' => $passwordHash,
                'debe_cambiar_contrasena' => false,
                'estado' => 'activo',
            ]);
        }
    }

    private function crearOActualizarPersona(array $datos): int
    {
        $persona = DB::table('personas')
            ->where('ci', $datos['ci'])
            ->orWhere('correo', $datos['correo'])
            ->first();

        if ($persona) {
            DB::table('personas')->where('id_persona', $persona->id_persona)->update(array_merge($datos, [
                'updated_at' => now(),
            ]));
            return (int)$persona->id_persona;
        }

        return (int)DB::table('personas')->insertGetId(array_merge($datos, [
            'created_at' => now(),
            'updated_at' => now(),
        ]), 'id_persona');
    }

    private function crearOActualizarUsuario(array $datos): int
    {
        $usuario = DB::table('usuarios')
            ->where('nombre_usuario', $datos['nombre_usuario'])
            ->orWhere('correo', $datos['correo'])
            ->orWhere('id_persona', $datos['id_persona'])
            ->first();

        if ($usuario) {
            DB::table('usuarios')->where('id_usuario', $usuario->id_usuario)->update(array_merge($datos, [
                'updated_at' => now(),
            ]));
            return (int)$usuario->id_usuario;
        }

        return (int)DB::table('usuarios')->insertGetId(array_merge($datos, [
            'created_at' => now(),
            'updated_at' => now(),
        ]), 'id_usuario');
    }
}
