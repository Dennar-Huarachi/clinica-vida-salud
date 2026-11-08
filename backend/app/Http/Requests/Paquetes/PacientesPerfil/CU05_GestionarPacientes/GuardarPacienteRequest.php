<?php

namespace App\Http\Requests\Paquetes\PacientesPerfil\CU05_GestionarPacientes;

use App\Nucleo\Validaciones\FormRequestPersonalizado;
use Illuminate\Support\Facades\DB;

class GuardarPacienteRequest extends FormRequestPersonalizado
{
    public function rules(): array
    {
        $idPaciente = $this->route('id');
        $idPersona = null;
        $idUsuario = null;

        if ($idPaciente) {
            $paciente = DB::table('pacientes')->where('id_paciente', $idPaciente)->first();
            $idPersona = $paciente?->id_persona;
            if ($idPersona) {
                $idUsuario = DB::table('usuarios')->where('id_persona', $idPersona)->value('id_usuario');
            }
        }

        $reglaCi = $idPersona
            ? "required|string|max:20|unique:personas,ci,{$idPersona},id_persona"
            : "required|string|max:20|unique:personas,ci";

        $reglaCorreo = $idUsuario
            ? "nullable|email|max:100|unique:usuarios,correo,{$idUsuario},id_usuario"
            : "nullable|email|max:100|unique:usuarios,correo";

        return [
            'ci' => $reglaCi,
            'nombres' => 'required|string|max:80',
            'apellidos' => 'required|string|max:80',
            'fecha_nacimiento' => 'nullable|date',
            'sexo' => 'nullable|string|in:M,F',
            'telefono' => 'nullable|string|max:20',
            'correo' => $reglaCorreo,
            'direccion' => 'nullable|string|max:200',
            'grupo_sanguineo' => 'nullable|string|max:10',
            'estado' => 'nullable|string|in:activo,inactivo',
            'alergias' => 'nullable|string',
            'enfermedades_cronicas' => 'nullable|string',
            'medicamentos_actuales' => 'nullable|string',
            'antecedentes_familiares' => 'nullable|string',
            'observaciones' => 'nullable|string',
            'contacto_emergencia_nombre' => 'nullable|string|max:120',
            'contacto_emergencia_telefono' => 'nullable|string|max:20',
            'contacto_emergencia_parentesco' => 'nullable|string|max:40',
        ];
    }

    public function messages(): array
    {
        return [
            'ci.required' => 'El número de Cédula de Identidad (CI) es obligatorio.',
            'ci.unique' => 'Ya existe un paciente o persona registrada con este número de CI.',
            'correo.unique' => 'Este correo electrónico ya se encuentra vinculado a otra cuenta de usuario.',
            'nombres.required' => 'El o los nombres del paciente son obligatorios.',
            'apellidos.required' => 'Los apellidos del paciente son obligatorios.',
        ];
    }
}
