<?php

namespace App\Paquetes\AccesoCuentas\CU02_CambiarContrasena;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Nucleo\Bitacora\ServicioBitacora;

class CambiarContrasenaServicio
{
    public function cambiar(int $idUsuario, string $contrasenaActual, string $contrasenaNueva): void
    {
        $usuario = DB::table('usuarios')->where('id_usuario', $idUsuario)->first();

        if (!$usuario || !Hash::check($contrasenaActual, $usuario->contrasena_hash)) {
            throw new \Exception('La contraseña actual ingresada es incorrecta.', 422);
        }

        if (Hash::check($contrasenaNueva, $usuario->contrasena_hash)) {
            throw new \Exception('La nueva contraseña no puede ser idéntica a la contraseña actual.', 422);
        }

        DB::table('usuarios')->where('id_usuario', $idUsuario)->update([
            'contrasena_hash' => Hash::make($contrasenaNueva),
            'debe_cambiar_contrasena' => false,
            'updated_at' => now(),
        ]);

        ServicioBitacora::registrar(
            'CU02_CambiarContrasena',
            'CAMBIO_CONTRASENA',
            'usuarios',
            (string)$idUsuario,
            ['debe_cambiar_contrasena' => $usuario->debe_cambiar_contrasena],
            ['debe_cambiar_contrasena' => false],
            $idUsuario
        );
    }
}
