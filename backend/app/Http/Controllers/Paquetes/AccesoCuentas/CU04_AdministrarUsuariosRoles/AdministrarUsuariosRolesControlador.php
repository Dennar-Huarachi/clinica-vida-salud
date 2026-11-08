<?php

namespace App\Http\Controllers\Paquetes\AccesoCuentas\CU04_AdministrarUsuariosRoles;

use App\Paquetes\AccesoCuentas\CU04_AdministrarUsuariosRoles\AdministrarUsuariosRolesServicio;
use App\Http\Requests\Paquetes\AccesoCuentas\CU04_AdministrarUsuariosRoles\GuardarUsuarioRequest;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Nucleo\Errores\RespuestaApi;

class AdministrarUsuariosRolesControlador extends Controller
{
    public function __construct(
        protected AdministrarUsuariosRolesServicio $servicio
    ) {}

    public function index(Request $request): JsonResponse
    {
        try {
            $usuarios = $this->servicio->listar(
                $request->query('termino'),
                $request->query('rol')
            );

            return RespuestaApi::exito($usuarios);
        } catch (\Throwable $e) {
            report($e);
            return RespuestaApi::error('Error al listar usuarios: ' . $e->getMessage(), 500);
        }
    }

    public function roles(): JsonResponse
    {
        try {
            return RespuestaApi::exito($this->servicio->obtenerRolesConConteo());
        } catch (\Throwable $e) {
            report($e);
            return RespuestaApi::error('Error al obtener roles: ' . $e->getMessage(), 500);
        }
    }

    public function crearRol(Request $request): JsonResponse
    {
        $validados = $request->validate([
            'nombre' => 'required|string|max:50',
            'descripcion' => 'nullable|string|max:150',
        ]);

        try {
            $id = $this->servicio->crearRol($validados);
            return RespuestaApi::exito(['id_rol' => $id], 'Rol creado satisfactoriamente', 201);
        } catch (\Throwable $e) {
            report($e);
            $codigo = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            return RespuestaApi::error($e->getMessage(), $codigo);
        }
    }

    public function permisosRol(int $id): JsonResponse
    {
        try {
            $datos = $this->servicio->obtenerPermisosRol($id);
            return RespuestaApi::exito($datos);
        } catch (\Throwable $e) {
            report($e);
            $codigo = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            return RespuestaApi::error($e->getMessage(), $codigo);
        }
    }

    public function sincronizarPermisosRol(Request $request, int $id): JsonResponse
    {
        $permisosIds = $request->input('permisos', []);
        if (!is_array($permisosIds)) {
            return RespuestaApi::error('El formato de permisos debe ser una lista de identificadores.', 422);
        }

        try {
            $this->servicio->sincronizarPermisosRol($id, $permisosIds);
            return RespuestaApi::exito(null, 'Permisos del rol sincronizados correctamente');
        } catch (\Throwable $e) {
            report($e);
            $codigo = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            return RespuestaApi::error($e->getMessage(), $codigo);
        }
    }

    public function store(GuardarUsuarioRequest $request): JsonResponse
    {
        try {
            $id = $this->servicio->crear($request->validated());
            return RespuestaApi::exito(['id_usuario' => $id], 'Usuario creado satisfactoriamente', 201);
        } catch (\Throwable $e) {
            report($e);
            $codigo = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            return RespuestaApi::error('Error al crear usuario: ' . $e->getMessage(), $codigo);
        }
    }

    public function update(GuardarUsuarioRequest $request, int $id): JsonResponse
    {
        try {
            $this->servicio->actualizar($id, $request->validated());
            return RespuestaApi::exito(null, 'Usuario actualizado satisfactoriamente');
        } catch (\Throwable $e) {
            report($e);
            $codigo = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            return RespuestaApi::error('Error al actualizar usuario: ' . $e->getMessage(), $codigo);
        }
    }

    public function alternarEstado(int $id): JsonResponse
    {
        try {
            $nuevoEstado = $this->servicio->alternarEstado($id);
            return RespuestaApi::exito(['estado' => $nuevoEstado], "Estado cambiado a {$nuevoEstado}");
        } catch (\Throwable $e) {
            report($e);
            $codigo = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            return RespuestaApi::error('Error al cambiar estado: ' . $e->getMessage(), $codigo);
        }
    }
}
