<?php

namespace App\Nucleo\Errores;

use Illuminate\Http\JsonResponse;

class RespuestaApi
{
    /**
     * Respuesta de éxito estandarizada.
     */
    public static function exito(mixed $datos = null, string $mensaje = 'Operación realizada correctamente', int $codigo = 200): JsonResponse
    {
        return response()->json([
            'exito' => true,
            'mensaje' => $mensaje,
            'datos' => $datos,
        ], $codigo);
    }

    /**
     * Respuesta de error estandarizada.
     */
    public static function error(string $mensaje = 'Ha ocurrido un error en la solicitud', int $codigo = 400, mixed $detalles = null): JsonResponse
    {
        return response()->json([
            'exito' => false,
            'mensaje' => $mensaje,
            'errores' => $detalles,
        ], $codigo);
    }

    /**
     * Respuesta de error de validación de campos.
     */
    public static function validacion(array $errores, string $mensaje = 'Los datos proporcionados no son válidos'): JsonResponse
    {
        return response()->json([
            'exito' => false,
            'mensaje' => $mensaje,
            'errores' => $errores,
        ], 422);
    }
}
