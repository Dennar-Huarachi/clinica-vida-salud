<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Parámetros clínicos del sistema
    |--------------------------------------------------------------------------
    |
    | Valores de configuración del negocio (reglas de citas médicas).
    | Se cargan desde el archivo .env para poder ajustarlos sin tocar código.
    |
    */

    // Horas mínimas de anticipación con las que un paciente aún puede
    // cancelar su turno. Si cancela con menos horas, el sistema no lo permite.
    // Ejemplo: con 2 horas, un turno de las 10:00 debe cancelarse antes de las 08:00.
    'horas_anticipacion_cancelar' => (int) env('HORAS_ANTICIPACION_CANCELAR', 2),

    // Horas durante las cuales los turnos que se liberan o habilitan tras suspender
    // el horario de un médico quedan reservados solo para reubicar las citas
    // postergadas. Pasado ese tiempo, esos turnos pasan a la disponibilidad general.
    // Ejemplo: con 48, un turno liberado hoy está reservado para postergadas durante 2 días.
    'horas_ventana_postergadas' => (int) env('HORAS_VENTANA_POSTERGADAS', 48),

    // Duración estándar de cada turno de atención, en minutos.
    // Ejemplo: 15 significa turnos de 15 minutos (10:00, 10:15, 10:30, ...).
    'minutos_duracion_turno' => (int) env('MINUTOS_DURACION_TURNO', 15),

];
