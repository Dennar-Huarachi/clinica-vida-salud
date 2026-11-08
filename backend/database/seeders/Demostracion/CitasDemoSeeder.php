<?php

namespace Database\Seeders\Demostracion;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CitasDemoSeeder extends Seeder
{
    public function run(): void
    {
        $hoy = Carbon::today('America/La_Paz');

        // 1. Mapeo dinámico y validación de estados de cita (sin números fijos)
        $estadosRequeridos = [
            'pendiente' => ['pendiente', 'Pendiente', 'programada', 'Programada'],
            'confirmada' => ['confirmada', 'Confirmada'],
            'atendida' => ['atendida', 'Atendida'],
            'cancelada' => ['cancelada', 'Cancelada'],
            'inasistencia' => ['inasistencia', 'Inasistencia'],
            'reprogramada' => ['reprogramada', 'Reprogramada'],
            'postergada' => ['postergada', 'Postergada', 'Postergada por Suspensión'],
        ];

        $estados = [];
        foreach ($estadosRequeridos as $clave => $busquedas) {
            $idEst = DB::table('estados_cita')
                ->whereIn('codigo', $busquedas)
                ->orWhereIn('nombre', $busquedas)
                ->value('id_estado_cita');

            if (!$idEst) {
                throw new \RuntimeException("Estado de cita obligatorio '{$clave}' no encontrado en estados_cita.");
            }
            $estados[$clave] = (int)$idEst;
        }

        // 2. Mapeo dinámico y validación de médicos por matrícula
        $matriculas = [
            1 => 'MED-BOL-10452', // Alarcón (Med Gral, Cardio)
            2 => 'MED-BOL-10453', // Torres (Pediatría)
            3 => 'MED-BOL-10454', // Guzmán (Geri, Endo)
            4 => 'MED-BOL-10455', // Rojas (Gineco)
            5 => 'MED-BOL-10456', // Vargas (Odonto)
            6 => 'MED-BOL-10457', // Suárez (Fisio)
        ];

        $medicos = [];
        foreach ($matriculas as $idx => $mat) {
            $idMed = DB::table('medicos')->where('nro_matricula', $mat)->value('id_medico');
            if (!$idMed) {
                throw new \RuntimeException("Médico con matrícula '{$mat}' no encontrado en tabla medicos.");
            }
            $medicos[$idx] = (int)$idMed;
        }

        // 3. Mapeo dinámico y validación de especialidades por nombre
        $nombresEsp = [
            'Med Gral' => 'Medicina General',
            'Pediatria' => 'Pediatría',
            'Geriatria' => 'Geriatría',
            'Ginecologia' => 'Ginecología',
            'Odontologia' => 'Odontología',
            'Cardiologia' => 'Cardiología',
            'Endocrinologia' => 'Endocrinología',
            'Fisioterapia' => 'Fisioterapia',
        ];

        $esp = [];
        foreach ($nombresEsp as $alias => $nombre) {
            $idEsp = DB::table('especialidades')->where('nombre', $nombre)->value('id_especialidad');
            if (!$idEsp) {
                throw new \RuntimeException("Especialidad '{$nombre}' no encontrada en tabla especialidades.");
            }
            $esp[$alias] = (int)$idEsp;
        }

        // 4. Mapeo dinámico de pacientes (1 a 20)
        $pacientes = [];
        for ($i = 1; $i <= 20; $i++) {
            $codigoHc = sprintf('HC-%04d', $i);
            $idPac = DB::table('pacientes')->where('codigo_historia', $codigoHc)->value('id_paciente');
            if (!$idPac) {
                throw new \RuntimeException("Paciente con historia clínica '{$codigoHc}' no encontrado.");
            }
            $pacientes[$i] = (int)$idPac;
        }

        // Usuarios creadores
        $idAdminUser = DB::table('usuarios')->where('nombre_usuario', 'admin')->value('id_usuario');
        $idRecepcionUser = DB::table('usuarios')->where('nombre_usuario', 'recepcion1')->value('id_usuario');
        $idCreador = $idRecepcionUser ?? $idAdminUser;

        if (!$idCreador) {
            throw new \RuntimeException("Usuario creador (recepcion1 o admin) no encontrado en tabla usuarios.");
        }

        // Fechas relativas dinámicas
        $proximoLunes = $hoy->copy()->next(Carbon::MONDAY);
        $lunesSemPasada1 = $hoy->copy()->previous(Carbon::MONDAY);
        $lunesSemPasada2 = $lunesSemPasada1->copy()->subWeek();
        $lunesSemPasada3 = $lunesSemPasada2->copy()->subWeek();

        $marPasada1 = $lunesSemPasada1->copy()->next(Carbon::TUESDAY);
        $miePasada1 = $lunesSemPasada1->copy()->next(Carbon::WEDNESDAY);
        $juePasada1 = $lunesSemPasada1->copy()->next(Carbon::THURSDAY);
        $viePasada1 = $lunesSemPasada1->copy()->next(Carbon::FRIDAY);

        $marPasada2 = $lunesSemPasada2->copy()->next(Carbon::TUESDAY);
        $miePasada2 = $lunesSemPasada2->copy()->next(Carbon::WEDNESDAY);
        $juePasada2 = $lunesSemPasada2->copy()->next(Carbon::THURSDAY);
        $viePasada2 = $lunesSemPasada2->copy()->next(Carbon::FRIDAY);

        $proxMar = $proximoLunes->copy()->next(Carbon::TUESDAY);
        $proxMie = $proximoLunes->copy()->next(Carbon::WEDNESDAY);
        $proxJue = $proximoLunes->copy()->next(Carbon::THURSDAY);
        $proxVie = $proximoLunes->copy()->next(Carbon::FRIDAY);
        $proxSab = $proximoLunes->copy()->next(Carbon::SATURDAY);

        // Definición de las 47 citas con referencias dinámicas a estados y especialidades
        $definicionCitas = [
            // ==========================================
            // CITAS PASADAS (Semana -3 a Semana -1): 26 citas
            // ==========================================

            // Semana -3
            ['codigo' => 'CM-0001', 'pac' => 1, 'med' => 1, 'esp' => $esp['Med Gral'], 'fecha' => $lunesSemPasada3->toDateString(), 'ini' => '08:00:00', 'fin' => '08:15:00', 'est' => $estados['atendida'], 'motivo' => 'Control de presión arterial'],
            ['codigo' => 'CM-0002', 'pac' => 2, 'med' => 1, 'esp' => $esp['Med Gral'], 'fecha' => $lunesSemPasada3->toDateString(), 'ini' => '08:15:00', 'fin' => '08:30:00', 'est' => $estados['atendida'], 'motivo' => 'Cefalea persistente y fatiga'],
            ['codigo' => 'CM-0003', 'pac' => 4, 'med' => 4, 'esp' => $esp['Ginecologia'], 'fecha' => $lunesSemPasada3->toDateString(), 'ini' => '09:00:00', 'fin' => '09:30:00', 'est' => $estados['atendida'], 'motivo' => 'Control prenatal rutinario'],
            ['codigo' => 'CM-0004', 'pac' => 3, 'med' => 2, 'esp' => $esp['Pediatria'], 'fecha' => $marPasada2->copy()->subWeek()->toDateString(), 'ini' => '08:30:00', 'fin' => '08:45:00', 'est' => $estados['atendida'], 'motivo' => 'Tos seca y congestión nasal'],
            ['codigo' => 'CM-0005', 'pac' => 5, 'med' => 5, 'esp' => $esp['Odontologia'], 'fecha' => $miePasada2->copy()->subWeek()->toDateString(), 'ini' => '09:00:00', 'fin' => '09:30:00', 'est' => $estados['inasistencia'], 'motivo' => 'Dolor en molar inferior derecho'],
            ['codigo' => 'CM-0006', 'pac' => 9, 'med' => 3, 'esp' => $esp['Geriatria'], 'fecha' => $marPasada2->copy()->subWeek()->toDateString(), 'ini' => '14:20:00', 'fin' => '14:40:00', 'est' => $estados['atendida'], 'motivo' => 'Dolor articular crónico en rodillas'],
            ['codigo' => 'CM-0007', 'pac' => 8, 'med' => 6, 'esp' => $esp['Fisioterapia'], 'fecha' => $juePasada2->copy()->subWeek()->toDateString(), 'ini' => '09:00:00', 'fin' => '09:30:00', 'est' => $estados['cancelada'], 'motivo' => 'Rehabilitación lumbo-sacra', 'obs' => 'Cancelada con anticipación por viaje del paciente.'],

            // Semana -2
            ['codigo' => 'CM-0008', 'pac' => 1, 'med' => 1, 'esp' => $esp['Cardiologia'], 'fecha' => $miePasada2->toDateString(), 'ini' => '08:00:00', 'fin' => '08:30:00', 'est' => $estados['atendida'], 'motivo' => 'Evaluación de palpitaciones esporádicas'],
            ['codigo' => 'CM-0009', 'pac' => 12, 'med' => 1, 'esp' => $esp['Cardiologia'], 'fecha' => $miePasada2->toDateString(), 'ini' => '08:30:00', 'fin' => '09:00:00', 'est' => $estados['atendida'], 'motivo' => 'Revisión de electrocardiograma'],
            ['codigo' => 'CM-0010', 'pac' => 7, 'med' => 2, 'esp' => $esp['Pediatria'], 'fecha' => $lunesSemPasada2->toDateString(), 'ini' => '14:00:00', 'fin' => '14:15:00', 'est' => $estados['atendida'], 'motivo' => 'Control de niño sano y vacunas'],
            ['codigo' => 'CM-0011', 'pac' => 10, 'med' => 2, 'esp' => $esp['Pediatria'], 'fecha' => $lunesSemPasada2->toDateString(), 'ini' => '14:15:00', 'fin' => '14:30:00', 'est' => $estados['inasistencia'], 'motivo' => 'Fiebre de 24 horas de evolución'],
            ['codigo' => 'CM-0012', 'pac' => 4, 'med' => 3, 'esp' => $esp['Endocrinologia'], 'fecha' => $juePasada2->toDateString(), 'ini' => '14:00:00', 'fin' => '14:30:00', 'est' => $estados['atendida'], 'motivo' => 'Control de glicemia y ajuste de dosis'],
            ['codigo' => 'CM-0013', 'pac' => 6, 'med' => 4, 'esp' => $esp['Ginecologia'], 'fecha' => $viePasada2->toDateString(), 'ini' => '08:00:00', 'fin' => '08:30:00', 'est' => $estados['cancelada'], 'motivo' => 'Consulta preventiva ginecológica', 'obs' => 'Cancelada 24 horas antes por paciente.'],
            ['codigo' => 'CM-0014', 'pac' => 11, 'med' => 4, 'esp' => $esp['Ginecologia'], 'fecha' => $viePasada2->toDateString(), 'ini' => '08:30:00', 'fin' => '09:00:00', 'est' => $estados['atendida'], 'motivo' => 'Revisión ecográfica pélvica'],
            ['codigo' => 'CM-0015', 'pac' => 15, 'med' => 5, 'esp' => $esp['Odontologia'], 'fecha' => $marPasada2->toDateString(), 'ini' => '08:00:00', 'fin' => '08:30:00', 'est' => $estados['atendida'], 'motivo' => 'Limpieza dental y profilaxis ultrasónica'],
            ['codigo' => 'CM-0016', 'pac' => 17, 'med' => 6, 'esp' => $esp['Fisioterapia'], 'fecha' => $viePasada2->toDateString(), 'ini' => '09:30:00', 'fin' => '10:00:00', 'est' => $estados['inasistencia'], 'motivo' => 'Terapia para hombro doloroso'],

            // Semana -1
            ['codigo' => 'CM-0017', 'pac' => 2, 'med' => 1, 'esp' => $esp['Med Gral'], 'fecha' => $lunesSemPasada1->toDateString(), 'ini' => '08:30:00', 'fin' => '08:45:00', 'est' => $estados['atendida'], 'motivo' => 'Faringitis con odinofagia intensa'],
            ['codigo' => 'CM-0018', 'pac' => 5, 'med' => 1, 'esp' => $esp['Med Gral'], 'fecha' => $lunesSemPasada1->toDateString(), 'ini' => '08:45:00', 'fin' => '09:00:00', 'est' => $estados['atendida'], 'motivo' => 'Certificado médico laboral'],
            ['codigo' => 'CM-0019', 'pac' => 14, 'med' => 2, 'esp' => $esp['Pediatria'], 'fecha' => $juePasada1->toDateString(), 'ini' => '08:00:00', 'fin' => '08:15:00', 'est' => $estados['atendida'], 'motivo' => 'Dermatitis del pañal y prurito'],
            ['codigo' => 'CM-0020', 'pac' => 3, 'med' => 2, 'esp' => $esp['Pediatria'], 'fecha' => $juePasada1->toDateString(), 'ini' => '08:15:00', 'fin' => '08:30:00', 'est' => $estados['inasistencia'], 'motivo' => 'Control de reflujo gastroesofágico'],
            ['codigo' => 'CM-0021', 'pac' => 13, 'med' => 3, 'esp' => $esp['Geriatria'], 'fecha' => $lunesSemPasada1->copy()->next(Carbon::SATURDAY)->toDateString(), 'ini' => '08:00:00', 'fin' => '08:20:00', 'est' => $estados['atendida'], 'motivo' => 'Descompensación leve por artritis'],
            ['codigo' => 'CM-0022', 'pac' => 16, 'med' => 4, 'esp' => $esp['Ginecologia'], 'fecha' => $miePasada1->toDateString(), 'ini' => '14:00:00', 'fin' => '14:30:00', 'est' => $estados['cancelada'], 'motivo' => 'Molestias pélvicas intermenstruales', 'obs' => 'Cancelada por cruce de horario de la paciente.'],
            ['codigo' => 'CM-0023', 'pac' => 18, 'med' => 4, 'esp' => $esp['Ginecologia'], 'fecha' => $miePasada1->toDateString(), 'ini' => '14:30:00', 'fin' => '15:00:00', 'est' => $estados['atendida'], 'motivo' => 'Control post-parto normal'],
            ['codigo' => 'CM-0024', 'pac' => 8, 'med' => 5, 'esp' => $esp['Odontologia'], 'fecha' => $viePasada1->toDateString(), 'ini' => '14:00:00', 'fin' => '14:30:00', 'est' => $estados['atendida'], 'motivo' => 'Restauración con resina compuesta'],
            ['codigo' => 'CM-0025', 'pac' => 12, 'med' => 5, 'esp' => $esp['Odontologia'], 'fecha' => $viePasada1->toDateString(), 'ini' => '14:30:00', 'fin' => '15:00:00', 'est' => $estados['inasistencia'], 'motivo' => 'Extracción de tercer molar indicada'],
            ['codigo' => 'CM-0026', 'pac' => 9, 'med' => 6, 'esp' => $esp['Fisioterapia'], 'fecha' => $viePasada1->toDateString(), 'ini' => '08:00:00', 'fin' => '08:30:00', 'est' => $estados['cancelada'], 'motivo' => 'Terapia cervical por contractura', 'obs' => 'Cancelada oportunamente por el usuario.'],

            // ==========================================
            // CITAS FUTURAS (Próximos 14 días): 21 citas
            // ==========================================

            // EL LUNES MÁS PRÓXIMO: Garantizar al menos 4 citas en total
            ['codigo' => 'CM-0027', 'pac' => 1, 'med' => 1, 'esp' => $esp['Med Gral'], 'fecha' => $proximoLunes->toDateString(), 'ini' => '08:00:00', 'fin' => '08:15:00', 'est' => $estados['confirmada'], 'motivo' => 'Chequeo médico de rutina general'],
            ['codigo' => 'CM-0028', 'pac' => 2, 'med' => 1, 'esp' => $esp['Med Gral'], 'fecha' => $proximoLunes->toDateString(), 'ini' => '08:15:00', 'fin' => '08:30:00', 'est' => $estados['pendiente'], 'motivo' => 'Consulta por malestar digestivo'],
            ['codigo' => 'CM-0029', 'pac' => 4, 'med' => 4, 'esp' => $esp['Ginecologia'], 'fecha' => $proximoLunes->toDateString(), 'ini' => '08:30:00', 'fin' => '09:00:00', 'est' => $estados['confirmada'], 'motivo' => 'Control mensual de gestación'],
            ['codigo' => 'CM-0030', 'pac' => 3, 'med' => 2, 'esp' => $esp['Pediatria'], 'fecha' => $proximoLunes->toDateString(), 'ini' => '14:00:00', 'fin' => '14:15:00', 'est' => $estados['confirmada'], 'motivo' => 'Evaluación pediátrica de crecimiento'],
            ['codigo' => 'CM-0031', 'pac' => 7, 'med' => 2, 'esp' => $esp['Pediatria'], 'fecha' => $proximoLunes->toDateString(), 'ini' => '14:15:00', 'fin' => '14:30:00', 'est' => $estados['pendiente'], 'motivo' => 'Revisión de cartilla de vacunas'],

            // Próximo Martes (M2 Pediatría, M3 Geriatría, M5 Odontología)
            ['codigo' => 'CM-0032', 'pac' => 10, 'med' => 2, 'esp' => $esp['Pediatria'], 'fecha' => $proxMar->toDateString(), 'ini' => '08:00:00', 'fin' => '08:15:00', 'est' => $estados['pendiente'], 'motivo' => 'Rinitis alérgica recurrente'],
            ['codigo' => 'CM-0033', 'pac' => 14, 'med' => 2, 'esp' => $esp['Pediatria'], 'fecha' => $proxMar->toDateString(), 'ini' => '08:15:00', 'fin' => '08:30:00', 'est' => $estados['pendiente'], 'motivo' => 'Evaluación de audición y lenguaje'],
            ['codigo' => 'CM-0034', 'pac' => 3, 'med' => 2, 'esp' => $esp['Pediatria'], 'fecha' => $proxMar->toDateString(), 'ini' => '08:30:00', 'fin' => '08:45:00', 'est' => $estados['confirmada'], 'motivo' => 'Control de peso y talla'],
            ['codigo' => 'CM-0035', 'pac' => 13, 'med' => 3, 'esp' => $esp['Geriatria'], 'fecha' => $proxMar->toDateString(), 'ini' => '14:00:00', 'fin' => '14:20:00', 'est' => $estados['pendiente'], 'motivo' => 'Consulta geriátrica de seguimiento'],
            ['codigo' => 'CM-0036', 'pac' => 5, 'med' => 5, 'esp' => $esp['Odontologia'], 'fecha' => $proxMar->toDateString(), 'ini' => '08:00:00', 'fin' => '08:30:00', 'est' => $estados['confirmada'], 'motivo' => 'Evaluación para ortodoncia'],

            // Próximo Miércoles (M1 Cardio, M4 Gineco, M5 Odonto)
            ['codigo' => 'CM-0037', 'pac' => 1, 'med' => 1, 'esp' => $esp['Cardiologia'], 'fecha' => $proxMie->toDateString(), 'ini' => '09:00:00', 'fin' => '09:30:00', 'est' => $estados['pendiente'], 'motivo' => 'Control de tratamiento antihipertensivo'],
            ['codigo' => 'CM-0038', 'pac' => 6, 'med' => 4, 'esp' => $esp['Ginecologia'], 'fecha' => $proxMie->toDateString(), 'ini' => '14:00:00', 'fin' => '14:30:00', 'est' => $estados['pendiente'], 'motivo' => 'Asesoría en planificación familiar'],
            ['codigo' => 'CM-0039', 'pac' => 15, 'med' => 5, 'esp' => $esp['Odontologia'], 'fecha' => $proxMie->toDateString(), 'ini' => '08:30:00', 'fin' => '09:00:00', 'est' => $estados['cancelada'], 'motivo' => 'Dolor dental agudo', 'obs' => 'Cancelada por el paciente antes del límite.'],

            // Próximo Jueves (M2 Pediatría, M3 Endocrino, M6 Fisio)
            ['codigo' => 'CM-0040', 'pac' => 7, 'med' => 2, 'esp' => $esp['Pediatria'], 'fecha' => $proxJue->toDateString(), 'ini' => '08:45:00', 'fin' => '09:00:00', 'est' => $estados['pendiente'], 'motivo' => 'Seguimiento bronquial'],
            ['codigo' => 'CM-0041', 'pac' => 4, 'med' => 3, 'esp' => $esp['Endocrinologia'], 'fecha' => $proxJue->toDateString(), 'ini' => '14:00:00', 'fin' => '14:30:00', 'est' => $estados['pendiente'], 'motivo' => 'Ajuste de dosis de levotiroxina'],
            ['codigo' => 'CM-0042', 'pac' => 8, 'med' => 6, 'esp' => $esp['Fisioterapia'], 'fecha' => $proxJue->toDateString(), 'ini' => '08:00:00', 'fin' => '08:30:00', 'est' => $estados['confirmada'], 'motivo' => 'Sesión de kinesioterapia motora'],

            // Próximo Viernes (M1 Med Gral, M4 Gineco, M5 Odonto, M6 Fisio)
            // CM-0043 REPROGRAMADA
            ['codigo' => 'CM-0043', 'pac' => 18, 'med' => 1, 'esp' => $esp['Med Gral'], 'fecha' => $proxVie->toDateString(), 'ini' => '14:00:00', 'fin' => '14:15:00', 'est' => $estados['reprogramada'], 'motivo' => 'Control médico general', 'obs' => 'Reprogramada a solicitud de la paciente. Turno previo: ' . $lunesSemPasada1->toDateString() . ' a las 09:15.'],
            ['codigo' => 'CM-0044', 'pac' => 11, 'med' => 4, 'esp' => $esp['Ginecologia'], 'fecha' => $proxVie->toDateString(), 'ini' => '08:00:00', 'fin' => '08:30:00', 'est' => $estados['pendiente'], 'motivo' => 'Control ecográfico de rutina'],
            ['codigo' => 'CM-0045', 'pac' => 12, 'med' => 6, 'esp' => $esp['Fisioterapia'], 'fecha' => $proxVie->toDateString(), 'ini' => '08:30:00', 'fin' => '09:00:00', 'est' => $estados['pendiente'], 'motivo' => 'Rehabilitación post-inmovilización'],

            // Próximo Sábado (M3 Geri, M6 Fisio)
            ['codigo' => 'CM-0046', 'pac' => 9, 'med' => 3, 'esp' => $esp['Geriatria'], 'fecha' => $proxSab->toDateString(), 'ini' => '08:00:00', 'fin' => '08:20:00', 'est' => $estados['confirmada'], 'motivo' => 'Evaluación integral geriátrica semestral'],
            ['codigo' => 'CM-0047', 'pac' => 17, 'med' => 6, 'esp' => $esp['Fisioterapia'], 'fecha' => $proxSab->toDateString(), 'ini' => '08:00:00', 'fin' => '08:30:00', 'est' => $estados['cancelada'], 'motivo' => 'Tratamiento de túnel carpiano', 'obs' => 'Cancelada por el personal médico.'],
        ];

        foreach ($definicionCitas as $c) {
            $idMed = $medicos[$c['med']] ?? null;
            $idPac = $pacientes[$c['pac']] ?? null;
            $idEsp = $c['esp'];
            $idEst = $c['est'];

            if (!$idMed || !$idPac || !$idEsp || !$idEst) {
                throw new \RuntimeException("Datos incompletos para registrar la cita {$c['codigo']}.");
            }

            $esCancelada = ($idEst === $estados['cancelada']);
            $estadoLogico = $esCancelada ? 'cancelada' : 'activo';
            $obs = $c['obs'] ?? null;

            // 1. Insertar / Actualizar Cita
            $citaExistente = DB::table('citas')->where('codigo_cita', $c['codigo'])->first();
            if ($citaExistente) {
                DB::table('citas')->where('id_cita', $citaExistente->id_cita)->update([
                    'id_paciente' => $idPac,
                    'id_medico' => $idMed,
                    'id_especialidad' => $idEsp,
                    'id_estado_cita' => $idEst,
                    'fecha_cita' => $c['fecha'],
                    'hora_inicio' => $c['ini'],
                    'hora_fin' => $c['fin'],
                    'motivo_consulta' => $c['motivo'],
                    'observaciones' => $obs,
                    'es_postergada' => false,
                    'creado_por_usuario' => $idCreador,
                    'estado' => $estadoLogico,
                    'pago_confirmado' => true,
                    'updated_at' => now(),
                ]);
                $idCita = (int)$citaExistente->id_cita;
            } else {
                $idCita = (int)DB::table('citas')->insertGetId([
                    'codigo_cita' => $c['codigo'],
                    'id_paciente' => $idPac,
                    'id_medico' => $idMed,
                    'id_especialidad' => $idEsp,
                    'id_estado_cita' => $idEst,
                    'fecha_cita' => $c['fecha'],
                    'hora_inicio' => $c['ini'],
                    'hora_fin' => $c['fin'],
                    'motivo_consulta' => $c['motivo'],
                    'observaciones' => $obs,
                    'es_postergada' => false,
                    'creado_por_usuario' => $idCreador,
                    'estado' => $estadoLogico,
                    'pago_confirmado' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ], 'id_cita');
            }

            // 2. Registro en pagos_cita
            $pagoExistente = DB::table('pagos_cita')->where('id_cita', $idCita)->first();
            $nroTrx = 'TRX-' . $c['codigo'];
            $estadoPago = $esCancelada ? 'reembolsado' : 'completado';
            $fechaReembolso = $esCancelada ? Carbon::parse($c['fecha'])->subDay()->toDateTimeString() : null;

            if ($pagoExistente) {
                DB::table('pagos_cita')->where('id_pago', $pagoExistente->id_pago)->update([
                    'monto' => 50.00,
                    'metodo_pago' => 'qr_transferencia',
                    'nro_transaccion' => $nroTrx,
                    'estado_pago' => $estadoPago,
                    'fecha_reembolso' => $fechaReembolso,
                    'updated_at' => now(),
                ]);
                $idPago = (int)$pagoExistente->id_pago;
            } else {
                $idPago = (int)DB::table('pagos_cita')->insertGetId([
                    'id_cita' => $idCita,
                    'monto' => 50.00,
                    'metodo_pago' => 'qr_transferencia',
                    'nro_transaccion' => $nroTrx,
                    'estado_pago' => $estadoPago,
                    'detalles_pasarela' => json_encode(['autorizacion' => 'AUTH-' . rand(100000, 999999), 'banco' => 'Banco Nacional de Bolivia']),
                    'fecha_pago' => Carbon::parse($c['fecha'])->subDays(2)->toDateTimeString(),
                    'fecha_reembolso' => $fechaReembolso,
                    'created_at' => now(),
                    'updated_at' => now(),
                ], 'id_pago');
            }

            DB::table('citas')->where('id_cita', $idCita)->update(['id_pago' => $idPago]);
        }
    }
}
