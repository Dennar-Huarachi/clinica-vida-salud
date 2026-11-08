<?php

namespace App\Paquetes\AccesoCuentas\CU01_IniciarCerrarSesion;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Nucleo\Bitacora\ServicioBitacora;

class IniciarCerrarSesionServicio
{
    /**
     * Autentica credenciales diferenciando acceso de pacientes vs. personal institucional.
     */
    public function iniciarSesion(string $tipoAcceso, string $identificador, string $contrasena): array
    {
        $identificador = trim($identificador);

        // Búsqueda flexible por nombre_usuario, correo del usuario, correo de la persona o CI
        $usuario = DB::table('usuarios')
            ->join('roles', 'usuarios.id_rol', '=', 'roles.id_rol')
            ->join('personas', 'usuarios.id_persona', '=', 'personas.id_persona')
            ->where(function ($query) use ($identificador) {
                $query->where('usuarios.nombre_usuario', $identificador)
                      ->orWhere('usuarios.correo', $identificador)
                      ->orWhere('personas.correo', $identificador)
                      ->orWhere('personas.ci', $identificador);
            })
            ->select(
                'usuarios.*',
                'roles.nombre as rol_nombre',
                'personas.nombres',
                'personas.apellidos',
                'personas.ci',
                'personas.correo as persona_correo'
            )
            ->first();

        // 1. Verificación de existencia y coincidencia de contraseña
        if (!$usuario || !Hash::check($contrasena, $usuario->contrasena_hash)) {
            ServicioBitacora::registrar(
                'CU01_IniciarCerrarSesion',
                'INTENTO_FALLIDO_SESION',
                'usuarios',
                $usuario ? (string)$usuario->id_usuario : null,
                null,
                ['tipo_acceso' => $tipoAcceso, 'identificador' => $identificador],
                $usuario ? $usuario->id_usuario : null
            );

            throw new \Exception('Credenciales incorrectas o cuenta inactiva.', 401);
        }

        // 2. Validación de estado de cuenta
        if ($usuario->estado !== 'activo') {
            ServicioBitacora::registrar(
                'CU01_IniciarCerrarSesion',
                'INTENTO_SESION_CUENTA_INACTIVA',
                'usuarios',
                (string)$usuario->id_usuario,
                null,
                ['estado' => $usuario->estado, 'tipo_acceso' => $tipoAcceso],
                $usuario->id_usuario
            );

            throw new \Exception('Su cuenta se encuentra inactiva o bloqueada. Contacte a la administración.', 403);
        }

        // 3. Validación de segmento/tipo de acceso
        $rol = strtolower($usuario->rol_nombre);

        if ($tipoAcceso === 'paciente' && $rol !== 'paciente') {
            ServicioBitacora::registrar(
                'CU01_IniciarCerrarSesion',
                'INTENTO_ACCESO_CANAL_INCORRECTO',
                'usuarios',
                (string)$usuario->id_usuario,
                null,
                ['rol' => $rol, 'tipo_acceso_usado' => $tipoAcceso],
                $usuario->id_usuario
            );

            throw new \Exception('Esta cuenta corresponde a personal clínico. Por favor ingrese por la pestaña "Personal de la Clínica".', 403);
        }

        if ($tipoAcceso === 'personal' && $rol === 'paciente') {
            ServicioBitacora::registrar(
                'CU01_IniciarCerrarSesion',
                'INTENTO_ACCESO_CANAL_INCORRECTO',
                'usuarios',
                (string)$usuario->id_usuario,
                null,
                ['rol' => $rol, 'tipo_acceso_usado' => $tipoAcceso],
                $usuario->id_usuario
            );

            throw new \Exception('Esta cuenta corresponde a un paciente. Ingrese desde el "Portal Pacientes".', 403);
        }

        // 4. Generar token de sesión persistente
        $token = Str::random(60);

        DB::table('usuarios')->where('id_usuario', $usuario->id_usuario)->update([
            'token_sesion' => $token,
            'ultimo_acceso' => now(),
            'updated_at' => now(),
        ]);

        ServicioBitacora::registrar(
            'CU01_IniciarCerrarSesion',
            'INICIO_SESION',
            'usuarios',
            (string)$usuario->id_usuario,
            null,
            ['tipo_acceso' => $tipoAcceso, 'ultimo_acceso' => now()->toDateTimeString()],
            $usuario->id_usuario
        );

        // Asociar datos según rol (médico o paciente)
        $medico = DB::table('medicos')->where('id_persona', $usuario->id_persona)->first();
        $paciente = DB::table('pacientes')->where('id_persona', $usuario->id_persona)->first();

        return [
            'token' => $token,
            'usuario' => [
                'id_usuario' => $usuario->id_usuario,
                'nombre_usuario' => $usuario->nombre_usuario,
                'correo' => $usuario->correo,
                'rol' => $usuario->rol_nombre,
                'nombres' => $usuario->nombres,
                'apellidos' => $usuario->apellidos,
                'ci' => $usuario->ci,
                'debe_cambiar_contrasena' => (bool)$usuario->debe_cambiar_contrasena,
                'id_medico' => $medico?->id_medico,
                'id_paciente' => $paciente?->id_paciente,
            ]
        ];
    }

    /**
     * Invalida el token del usuario cerrando la sesión.
     */
    public function cerrarSesion(int $idUsuario): void
    {
        DB::table('usuarios')->where('id_usuario', $idUsuario)->update([
            'token_sesion' => null,
            'updated_at' => now(),
        ]);

        ServicioBitacora::registrar(
            'CU01_IniciarCerrarSesion',
            'CERRAR_SESION',
            'usuarios',
            (string)$idUsuario,
            null,
            null,
            $idUsuario
        );
    }
}
