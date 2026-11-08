<?php

namespace App\Nucleo\Validaciones;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;
use App\Nucleo\Errores\RespuestaApi;

abstract class FormRequestPersonalizado extends FormRequest
{
    /**
     * Determina si el usuario está autorizado a realizar esta solicitud.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Sanitización transversal de entradas de texto libre contra inyecciones XSS (OWASP A03).
     * Se limpia todo campo de texto mediante strip_tags() antes de ejecutar la validación.
     */
    protected function prepareForValidation(): void
    {
        $entradas = $this->all();
        $this->merge($this->sanitizarValores($entradas));
    }

    /**
     * Recorre recursivamente los arreglos de entrada para desinfectar strings.
     */
    protected function sanitizarValores(array $datos): array
    {
        foreach ($datos as $clave => $valor) {
            if (is_string($valor)) {
                // Se eliminan etiquetas HTML/JS potencialmente maliciosas
                $datos[$clave] = trim(strip_tags($valor));
            } elseif (is_array($valor)) {
                $datos[$clave] = $this->sanitizarValores($valor);
            }
        }
        return $datos;
    }

    /**
     * Manejo unificado de errores de validación devolviendo JSON amigable para el frontend.
     */
    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(
            RespuestaApi::validacion($validator->errors()->toArray())
        );
    }
}
