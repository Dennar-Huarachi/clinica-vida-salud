<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Confianza en proxies para Render / Entornos en la nube (HTTPS)
        $middleware->trustProxies(at: '*');

        // Cabeceras HTTP de Seguridad globales (OWASP Top 10)
        $middleware->append(\App\Http\Middleware\CabecerasSeguridad::class);

        $middleware->alias([
            'sesion.clinica' => \App\Nucleo\Sesion\ManejadorSesion::class,
            'rol' => \App\Nucleo\Permisos\MiddlewareVerificarRol::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // Manejo Seguro de Errores (Anti Information Disclosure)
        $exceptions->render(function (\Throwable $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                if ($e instanceof ValidationException) {
                    return response()->json([
                        'exito' => false,
                        'mensaje' => 'Los datos suministrados no son válidos.',
                        'errores' => $e->errors(),
                    ], 422);
                }

                if ($e instanceof HttpExceptionInterface) {
                    $codigo = $e->getStatusCode();
                    $mensajeDefecto = match ($codigo) {
                        401 => 'No autenticado. Por favor inicie sesión.',
                        403 => 'Acceso denegado: no cuenta con los permisos necesarios.',
                        404 => 'El recurso solicitado no fue encontrado.',
                        429 => 'Demasiadas solicitudes. Por favor intente más tarde.',
                        default => 'Error en la solicitud.',
                    };

                    return response()->json([
                        'exito' => false,
                        'mensaje' => $e->getMessage() ?: $mensajeDefecto,
                    ], $codigo);
                }

                // Error 500 no controlado: Registrar en log interno y ocultar trazas sensibles
                Log::error('Excepción no controlada en API: ' . $e->getMessage(), [
                    'excepcion' => get_class($e),
                    'archivo' => $e->getFile(),
                    'linea' => $e->getLine(),
                    'ruta' => $request->fullUrl(),
                    'metodo' => $request->method(),
                ]);

                return response()->json([
                    'exito' => false,
                    'mensaje' => 'Ocurrió un error en el servidor. Intente más tarde.',
                ], 500);
            }
        });
    })->create();
