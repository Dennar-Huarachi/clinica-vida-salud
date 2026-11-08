<?php

namespace App\Http\Requests\Paquetes\CatalogosHorarios\CU07_GestionarEspecialidades;

use App\Nucleo\Validaciones\FormRequestPersonalizado;

class GuardarEspecialidadRequest extends FormRequestPersonalizado
{
    /**
     * Normaliza una cadena de texto para comparaciones canónicas y unicidad:
     * minúsculas, sin tildes ni caracteres diacríticos, sin caracteres especiales y sin espacios dobles.
     */
    public static function normalizar(string $texto): string
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

    protected function prepareForValidation(): void
    {
        if ($this->has('nombre')) {
            $this->merge([
                'nombre_normalizado' => self::normalizar((string)$this->input('nombre')),
            ]);
        }
    }

    public function rules(): array
    {
        $idEspecialidad = $this->route('id');

        return [
            'nombre' => 'required|string|max:80',
            'nombre_normalizado' => 'required|string|max:80|unique:especialidades,nombre_normalizado,' . ($idEspecialidad ?? 'NULL') . ',id_especialidad',
            'descripcion' => 'nullable|string|max:255',
            'duracion_turno_minutos' => 'required|integer|min:5|max:120',
            'reservable_en_linea' => 'nullable|boolean',
            'estado' => 'nullable|string|in:activo,inactivo',
        ];
    }

    public function messages(): array
    {
        return [
            'nombre.required' => 'El nombre de la especialidad es obligatorio.',
            'nombre_normalizado.unique' => 'Ya existe una especialidad registrada con este nombre o una variación ortográfica similar (RF04).',
            'duracion_turno_minutos.required' => 'La duración del turno es obligatoria.',
            'duracion_turno_minutos.min' => 'La duración mínima de consulta es de 5 minutos.',
            'duracion_turno_minutos.max' => 'La duración máxima de consulta es de 120 minutos.',
        ];
    }
}

