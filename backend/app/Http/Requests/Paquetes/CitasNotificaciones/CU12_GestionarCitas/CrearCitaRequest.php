<?php

namespace App\Http\Requests\Paquetes\CitasNotificaciones\CU12_GestionarCitas;

use App\Nucleo\Validaciones\FormRequestPersonalizado;
use Illuminate\Support\Facades\DB;

class CrearCitaRequest extends FormRequestPersonalizado
{
    protected function prepareForValidation(): void
    {
        parent::prepareForValidation();

        $usuario = $this->attributes->get('usuario_autenticado');
        if ($usuario) {
            $idPaciente = (int)($usuario->id_paciente ?? 0);
            if (!$idPaciente && !empty($usuario->id_persona)) {
                $paciente = DB::table('pacientes')
                    ->where('id_persona', $usuario->id_persona)
                    ->first();
                $idPaciente = (int)($paciente?->id_paciente ?? 0);
            }
            if ($idPaciente > 0) {
                // Forzar ID del paciente si es rol paciente (Anti-IDOR) o si no vino en el payload
                if (!$this->filled('id_paciente') || strtolower($usuario->rol ?? '') === 'paciente') {
                    $this->merge(['id_paciente' => $idPaciente]);
                }
            }
        }

        if ($this->has('hora_inicio') && is_string($this->hora_inicio)) {
            $hora = trim($this->hora_inicio);
            if (strlen($hora) > 5) {
                $hora = substr($hora, 0, 5);
            }
            if (preg_match('/^(\d):(\d{2})$/', $hora, $matches)) {
                $hora = '0' . $matches[1] . ':' . $matches[2];
            }
            $this->merge(['hora_inicio' => $hora]);
        }

        if ($this->has('metodo_pago')) {
            $metodo = strtolower(trim((string)$this->metodo_pago));
            if (in_array($metodo, ['qr', 'qr_transferencia', 'simple qr', 'simple_qr', 'transferencia'])) {
                $this->merge(['metodo_pago' => 'qr_transferencia']);
            } elseif (in_array($metodo, ['tarjeta', 'tarjeta_debito_credito', 'debito', 'credito', 'card'])) {
                $this->merge(['metodo_pago' => 'tarjeta_debito_credito']);
            } elseif (in_array($metodo, ['efectivo', 'cash'])) {
                $this->merge(['metodo_pago' => 'efectivo']);
            }
        }
    }

    public function rules(): array
    {
        return [
            'id_paciente' => 'required|integer|exists:pacientes,id_paciente',
            'id_medico' => 'required|integer|exists:medicos,id_medico',
            'id_especialidad' => 'required|integer|exists:especialidades,id_especialidad',
            'fecha_cita' => 'required|date|after_or_equal:today',
            'hora_inicio' => 'required|date_format:H:i',
            'motivo_consulta' => 'nullable|string|max:255',
            'observaciones' => 'nullable|string',
            'metodo_pago' => 'nullable|string|in:qr_transferencia,tarjeta_debito_credito,qr,tarjeta,efectivo',
            'referencia_simulada' => 'nullable|string|max:100',
            'detalles_pasarela' => 'nullable|array',
        ];
    }
}
