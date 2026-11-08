<?php

namespace App\Http\Requests\Paquetes\CitasNotificaciones\CU27_GestionarPagosReembolsos;

use App\Nucleo\Validaciones\FormRequestPersonalizado;

class ProcesarPagoRequest extends FormRequestPersonalizado
{
    protected function prepareForValidation(): void
    {
        parent::prepareForValidation();

        if ($this->has('metodo_pago')) {
            $metodo = strtolower(trim((string)$this->metodo_pago));
            if (in_array($metodo, ['qr', 'qr_transferencia', 'simple qr', 'simple_qr', 'transferencia'])) {
                $this->merge(['metodo_pago' => 'qr_transferencia']);
            } elseif (in_array($metodo, ['tarjeta', 'tarjeta_debito_credito', 'debito', 'credito', 'card'])) {
                $this->merge(['metodo_pago' => 'tarjeta_debito_credito']);
            }
        }
    }

    public function rules(): array
    {
        return [
            'id_cita' => 'required|integer|exists:citas,id_cita',
            'metodo_pago' => 'required|string|in:qr_transferencia,tarjeta_debito_credito,qr,tarjeta',
            'monto' => 'nullable|numeric|min:1',
            'referencia_simulada' => 'nullable|string|max:100',
            'detalles_pasarela' => 'nullable|array',
        ];
    }
}
