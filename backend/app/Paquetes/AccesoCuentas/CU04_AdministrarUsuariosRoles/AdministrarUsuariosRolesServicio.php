<?php

namespace App\Paquetes\AccesoCuentas\CU04_AdministrarUsuariosRoles;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Nucleo\Bitacora\ServicioBitacora;

class AdministrarUsuariosRolesServicio
{
    public function listar(?string $termino = null, ?string $rol = null): array
    {
        $query = DB::table('usuarios')
            ->join('roles', 'usuarios.id_rol', '=', 'roles.id_rol')
            ->join('personas', 'usuarios.id_persona', '=', 'personas.id_persona')
            ->select(
                'usuarios.*',
                'personas.nombres',
                'personas.apellidos',
                'personas.ci',
                'personas.telefono',
                'personas.correo as persona_correo',
                'roles.nombre as rol',
                'roles.nombre as rol_nombre',
                'roles.descripcion as rol_descripcion',
                DB::raw("trim(COALESCE(personas.nombres, '') || ' ' || COALESCE(personas.apellidos, '')) as nombre_completo")
            )
            ->orderBy('usuarios.id_usuario', 'desc');

        if ($termino && trim($termino) !== '') {
            $t = trim($termino);
            $query->where(function ($q) use ($t) {
                $q->where('usuarios.nombre_usuario', 'ilike', "%{$t}%")
                  ->orWhere('usuarios.correo', 'ilike', "%{$t}%")
                  ->orWhere('personas.nombres', 'ilike', "%{$t}%")
                  ->orWhere('personas.apellidos', 'ilike', "%{$t}%")
                  ->orWhere('personas.ci', 'ilike', "%{$t}%");
            });
        }

        if ($rol && trim($rol) !== '') {
            $query->where('roles.nombre', 'ilike', trim($rol));
        }

        return $query->get()->toArray();
    }

    public function obtenerRoles(): array
    {
        return $this->obtenerRolesConConteo();
    }

    /**
     * Garantiza de forma idempotente y autorreparable los permisos del sistema si la tabla estuviese vacía.
     */
    private function garantizarPermisosIniciales(): void
    {
        try {
            $totalPermisos = DB::table('permisos')->count();
            if ($totalPermisos === 0) {
                $seeder = new \Database\Seeders\PermisosSeeder();
                $seeder->run();
                return;
            }

            // Si los permisos existen pero el rol administrador tiene 0 permisos asignados, re-vincularlos
            $adminRol = DB::table('roles')->where('nombre', 'administrador')->first();
            if ($adminRol) {
                $tienePermisos = DB::table('rol_permiso')->where('id_rol', $adminRol->id_rol)->exists();
                if (!$tienePermisos) {
                    $seeder = new \Database\Seeders\PermisosSeeder();
                    $seeder->run();
                }
            }
        } catch (\Throwable $e) {
            report($e);
        }
    }

    public function obtenerRolesConConteo(): array
    {
        $this->garantizarPermisosIniciales();

        return DB::table('roles')
            ->leftJoin('rol_permiso', 'roles.id_rol', '=', 'rol_permiso.id_rol')
            ->select(
                'roles.id_rol',
                'roles.nombre',
                'roles.descripcion',
                DB::raw('COUNT(rol_permiso.id_permiso) as permisos_count')
            )
            ->groupBy('roles.id_rol', 'roles.nombre', 'roles.descripcion')
            ->orderBy('roles.id_rol')
            ->get()
            ->map(function ($rol) {
                $rol->permisos_count = (int)$rol->permisos_count;
                return $rol;
            })
            ->toArray();
    }

    public function crearRol(array $datos): int
    {
        $nombre = trim($datos['nombre'] ?? '');
        if (empty($nombre)) {
            throw new \Exception('El nombre del rol es obligatorio.', 422);
        }

        $existe = DB::table('roles')->where('nombre', $nombre)->exists();
        if ($existe) {
            throw new \Exception("Ya existe un rol con el nombre '{$nombre}'.", 422);
        }

        $idRol = DB::table('roles')->insertGetId([
            'nombre' => $nombre,
            'descripcion' => $datos['descripcion'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ], 'id_rol');

        ServicioBitacora::registrar(
            'CU04_AdministrarUsuariosRoles',
            'CREAR_ROL',
            'roles',
            (string)$idRol,
            null,
            ['nombre' => $nombre, 'descripcion' => $datos['descripcion'] ?? null]
        );

        return $idRol;
    }

    public function obtenerPermisosRol(int $idRol): array
    {
        $this->garantizarPermisosIniciales();

        $rol = DB::table('roles')->where('id_rol', $idRol)->first();
        if (!$rol) {
            throw new \Exception('El rol solicitado no existe.', 404);
        }

        $asignados = DB::table('rol_permiso')
            ->where('id_rol', $idRol)
            ->pluck('id_permiso')
            ->toArray();

        $asignadosSet = array_flip($asignados);

        $permisos = DB::table('permisos')
            ->orderBy('modulo')
            ->orderBy('id_permiso')
            ->get();

        $modulos = [];
        foreach ($permisos as $p) {
            $item = [
                'id_permiso' => (int)$p->id_permiso,
                'modulo' => $p->modulo,
                'nombre' => $p->nombre,
                'slug' => $p->slug,
                'descripcion' => $p->descripcion,
                'asignado' => isset($asignadosSet[$p->id_permiso]),
            ];

            $modulos[$p->modulo][] = $item;
        }

        return [
            'rol' => $rol,
            'permisos_asignados_count' => count($asignados),
            'modulos' => $modulos,
        ];
    }

    public function sincronizarPermisosRol(int $idRol, array $permisosIds): void
    {
        $rol = DB::table('roles')->where('id_rol', $idRol)->first();
        if (!$rol) {
            throw new \Exception('El rol solicitado no existe.', 404);
        }

        // Filtrar únicamente los IDs de permisos que existan realmente en el catálogo
        $validos = DB::table('permisos')
            ->whereIn('id_permiso', array_map('intval', $permisosIds))
            ->pluck('id_permiso')
            ->toArray();

        DB::transaction(function () use ($idRol, $rol, $validos) {
            $anteriores = DB::table('rol_permiso')
                ->where('id_rol', $idRol)
                ->pluck('id_permiso')
                ->toArray();

            DB::table('rol_permiso')->where('id_rol', $idRol)->delete();

            $insertar = [];
            foreach ($validos as $idPermiso) {
                $insertar[] = [
                    'id_rol' => $idRol,
                    'id_permiso' => (int)$idPermiso,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            if (!empty($insertar)) {
                DB::table('rol_permiso')->insert($insertar);
            }

            ServicioBitacora::registrar(
                'CU04_AdministrarUsuariosRoles',
                'SINCRONIZAR_PERMISOS_ROL',
                'rol_permiso',
                (string)$idRol,
                ['rol' => $rol->nombre, 'permisos' => $anteriores],
                ['rol' => $rol->nombre, 'permisos' => $validos]
            );
        });
    }

    public function crear(array $datos): int
    {
        return DB::transaction(function () use ($datos) {
            // Sincronizar secuencias primarias en PostgreSQL si el catálogo previo desfasó el serial
            if (DB::getDriverName() === 'pgsql') {
                try {
                    DB::statement("SELECT setval(pg_get_serial_sequence('personas', 'id_persona'), COALESCE((SELECT MAX(id_persona) FROM personas), 1))");
                    DB::statement("SELECT setval(pg_get_serial_sequence('usuarios', 'id_usuario'), COALESCE((SELECT MAX(id_usuario) FROM usuarios), 1))");
                } catch (\Throwable) {}
            }

            // 1. Validar nombre de usuario único
            if (DB::table('usuarios')->where('nombre_usuario', trim($datos['nombre_usuario']))->exists()) {
                throw new \Exception("El nombre de usuario '{$datos['nombre_usuario']}' ya se encuentra registrado.", 422);
            }

            // 2. Validar correo electrónico único en usuarios
            if (DB::table('usuarios')->where('correo', trim($datos['correo']))->exists()) {
                throw new \Exception("El correo '{$datos['correo']}' ya se encuentra registrado por otro usuario.", 422);
            }

            // 3. Gestionar persona: reutilizar si ya existe por CI o crear una nueva
            $personaExistente = DB::table('personas')->where('ci', trim($datos['ci']))->first();
            if ($personaExistente) {
                // Verificar si esta persona ya tiene un usuario vinculado
                $cuentaVinculada = DB::table('usuarios')->where('id_persona', $personaExistente->id_persona)->first();
                if ($cuentaVinculada) {
                    throw new \Exception("El CI {$datos['ci']} ya está asociado a la cuenta de usuario @{$cuentaVinculada->nombre_usuario}.", 422);
                }

                $idPersona = $personaExistente->id_persona;
                DB::table('personas')->where('id_persona', $idPersona)->update([
                    'nombres' => $datos['nombres'],
                    'apellidos' => $datos['apellidos'],
                    'telefono' => $datos['telefono'] ?? $personaExistente->telefono,
                    'correo' => $datos['correo'] ?? $personaExistente->correo,
                    'updated_at' => now(),
                ]);
            } else {
                $idPersona = DB::table('personas')->insertGetId([
                    'ci' => trim($datos['ci']),
                    'nombres' => $datos['nombres'],
                    'apellidos' => $datos['apellidos'],
                    'telefono' => $datos['telefono'] ?? null,
                    'correo' => trim($datos['correo']),
                    'created_at' => now(),
                    'updated_at' => now(),
                ], 'id_persona');
            }

            // 4. Crear usuario con tipos de datos estrictos para PostgreSQL (boolean estricto)
            $idUsuario = DB::table('usuarios')->insertGetId([
                'id_persona' => $idPersona,
                'id_rol' => (int)$datos['id_rol'],
                'nombre_usuario' => trim($datos['nombre_usuario']),
                'correo' => trim($datos['correo']),
                'contrasena_hash' => Hash::make($datos['contrasena']),
                'debe_cambiar_contrasena' => true,
                'estado' => $datos['estado'] ?? 'activo',
                'created_at' => now(),
                'updated_at' => now(),
            ], 'id_usuario');

            // 5. Si el rol es 'medico', garantizar que exista su registro en la tabla medicos
            $rol = DB::table('roles')->where('id_rol', $datos['id_rol'])->value('nombre');
            if (strtolower((string)$rol) === 'medico') {
                $existeMedico = DB::table('medicos')->where('id_persona', $idPersona)->exists();
                if (!$existeMedico) {
                    if (DB::getDriverName() === 'pgsql') {
                        try {
                            DB::statement("SELECT setval(pg_get_serial_sequence('medicos', 'id_medico'), COALESCE((SELECT MAX(id_medico) FROM medicos), 1))");
                        } catch (\Throwable) {}
                    }
                    DB::table('medicos')->insert([
                        'id_persona' => $idPersona,
                        'nro_matricula' => 'MP-' . trim($datos['ci']),
                        'estado' => 'activo',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            ServicioBitacora::registrar(
                'CU04_AdministrarUsuariosRoles',
                'CREAR_USUARIO',
                'usuarios',
                (string)$idUsuario,
                null,
                ['nombre_usuario' => $datos['nombre_usuario'], 'id_rol' => $datos['id_rol']]
            );

            return $idUsuario;
        });
    }

    public function actualizar(int $idUsuario, array $datos): void
    {
        DB::transaction(function () use ($idUsuario, $datos) {
            $usuario = DB::table('usuarios')->where('id_usuario', $idUsuario)->first();
            if (!$usuario) {
                throw new \Exception('Usuario no encontrado', 404);
            }

            // Proteger contra la desactivación o desmonte del último administrador activo
            $rolAdmin = DB::table('roles')->where('nombre', 'administrador')->value('id_rol');
            if ($usuario->id_rol == $rolAdmin && $usuario->estado === 'activo') {
                $nuevoRol = isset($datos['id_rol']) ? (int)$datos['id_rol'] : $usuario->id_rol;
                $nuevoEstado = $datos['estado'] ?? $usuario->estado;
                if ($nuevoRol != $rolAdmin || $nuevoEstado === 'inactivo') {
                    $otrosAdmins = DB::table('usuarios')
                        ->where('id_rol', $rolAdmin)
                        ->where('estado', 'activo')
                        ->where('id_usuario', '!=', $idUsuario)
                        ->count();
                    if ($otrosAdmins === 0) {
                        throw new \Exception('No es posible desactivar ni cambiar el rol al único administrador activo del sistema.', 422);
                    }
                }
            }

            // Verificar si el correo ya está en uso por otro usuario
            if (isset($datos['correo']) && trim($datos['correo']) !== $usuario->correo) {
                $otroUsuario = DB::table('usuarios')
                    ->where('correo', trim($datos['correo']))
                    ->where('id_usuario', '!=', $idUsuario)
                    ->exists();
                if ($otroUsuario) {
                    throw new \Exception("El correo '{$datos['correo']}' ya se encuentra registrado por otro usuario.", 422);
                }
            }

            // Verificar si el nombre_usuario ya está en uso por otro usuario
            if (isset($datos['nombre_usuario']) && trim($datos['nombre_usuario']) !== $usuario->nombre_usuario) {
                $otroNombre = DB::table('usuarios')
                    ->where('nombre_usuario', trim($datos['nombre_usuario']))
                    ->where('id_usuario', '!=', $idUsuario)
                    ->exists();
                if ($otroNombre) {
                    throw new \Exception("El nombre de usuario '{$datos['nombre_usuario']}' ya está en uso.", 422);
                }
            }

            // Actualizar persona
            DB::table('personas')->where('id_persona', $usuario->id_persona)->update([
                'ci' => trim($datos['ci']),
                'nombres' => $datos['nombres'],
                'apellidos' => $datos['apellidos'],
                'telefono' => $datos['telefono'] ?? null,
                'correo' => trim($datos['correo']),
                'updated_at' => now(),
            ]);

            // Actualizar usuario
            $updateUsuario = [
                'id_rol' => (int)$datos['id_rol'],
                'nombre_usuario' => trim($datos['nombre_usuario']),
                'correo' => trim($datos['correo']),
                'estado' => $datos['estado'] ?? $usuario->estado,
                'updated_at' => now(),
            ];

            if (!empty($datos['contrasena'])) {
                $updateUsuario['contrasena_hash'] = Hash::make($datos['contrasena']);
                $updateUsuario['debe_cambiar_contrasena'] = true;
            }

            DB::table('usuarios')->where('id_usuario', $idUsuario)->update($updateUsuario);

            ServicioBitacora::registrar(
                'CU04_AdministrarUsuariosRoles',
                'ACTUALIZAR_USUARIO',
                'usuarios',
                (string)$idUsuario,
                ['id_rol' => $usuario->id_rol, 'estado' => $usuario->estado],
                $updateUsuario
            );
        });
    }

    public function alternarEstado(int $idUsuario): string
    {
        $usuario = DB::table('usuarios')->where('id_usuario', $idUsuario)->first();
        if (!$usuario) {
            throw new \Exception('Usuario no encontrado', 404);
        }

        $nuevoEstado = $usuario->estado === 'activo' ? 'inactivo' : 'activo';

        // Proteger contra la desactivación del último administrador activo
        $rolAdmin = DB::table('roles')->where('nombre', 'administrador')->value('id_rol');
        if ($usuario->id_rol == $rolAdmin && $usuario->estado === 'activo' && $nuevoEstado === 'inactivo') {
            $otrosAdmins = DB::table('usuarios')
                ->where('id_rol', $rolAdmin)
                ->where('estado', 'activo')
                ->where('id_usuario', '!=', $idUsuario)
                ->count();
            if ($otrosAdmins === 0) {
                throw new \Exception('No es posible desactivar al único administrador activo del sistema.', 422);
            }
        }

        DB::table('usuarios')->where('id_usuario', $idUsuario)->update([
            'estado' => $nuevoEstado,
            'updated_at' => now(),
        ]);

        ServicioBitacora::registrar(
            'CU04_AdministrarUsuariosRoles',
            'CAMBIAR_ESTADO_USUARIO',
            'usuarios',
            (string)$idUsuario,
            ['estado' => $usuario->estado],
            ['estado' => $nuevoEstado]
        );

        return $nuevoEstado;
    }
}
