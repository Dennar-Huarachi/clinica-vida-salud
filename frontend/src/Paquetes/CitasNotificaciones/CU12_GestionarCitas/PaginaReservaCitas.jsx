import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../compartido/utilidades/api';
import CampoTexto from '../../../compartido/componentes/CampoTexto';
import SelectorBuscador from '../../../compartido/componentes/SelectorBuscador';
import Alerta from '../../../compartido/componentes/Alerta';
import LayoutPrincipal from '../../../compartido/layouts/LayoutPrincipal';
import SelectorDisponibilidadTurnos from '../../CatalogosHorarios/CU10_ConsultarDisponibilidad/SelectorDisponibilidadTurnos';
import ModalPasarelaPagoSimulada from '../CU27_GestionarPagosReembolsos/ModalPasarelaPagoSimulada';
import ComprobanteDigitalTransaccion from '../CU27_GestionarPagosReembolsos/ComprobanteDigitalTransaccion';

export default function PaginaReservaCitas() {
  const [especialidades, setEspecialidades] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [pacientes, setPacientes] = useState([]);

  const [idEspecialidad, setIdEspecialidad] = useState('');
  const [idMedico, setIdMedico] = useState('');
  const [idPaciente, setIdPaciente] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [motivoConsulta, setMotivoConsulta] = useState('');
  const [metodoPago, setMetodoPago] = useState('tarjeta_debito_credito'); // 'tarjeta_debito_credito' | 'qr_transferencia'
  const [claveRefrescoTurnos, setClaveRefrescoTurnos] = useState(0);

  const [errores, setErrores] = useState({});
  const [alerta, setAlerta] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // Estados para Modal de Pago Autónomo (CU-27 / D17)
  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [comprobanteExito, setComprobanteExito] = useState(null);

  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario_clinica') || '{}');
  const esPersonal = ['administrador', 'recepcionista'].includes((usuario?.rol || '').toLowerCase());

  // Cargar especialidades y pacientes
  useEffect(() => {
    api.get('/catalogos/especialidades-publicas')
      .then((res) => setEspecialidades(res.data.datos || []))
      .catch(() => {});

    if (esPersonal) {
      api.get('/pacientes')
        .then((res) => setPacientes(res.data.datos || []))
        .catch(() => {});
    }
  }, [esPersonal]);

  // Filtrar médicos al cambiar especialidad
  useEffect(() => {
    if (idEspecialidad) {
      api.get(`/catalogos/medicos-publicos?id_especialidad=${idEspecialidad}`)
        .then((res) => {
          setMedicos(res.data.datos || []);
          setIdMedico('');
          setTurnoSeleccionado(null);
        })
        .catch(() => {});
    } else {
      setMedicos([]);
      setIdMedico('');
      setTurnoSeleccionado(null);
    }
  }, [idEspecialidad]);

  // Paso 1: Abrir Modal de Pago Simulado
  const iniciarProcesoReserva = (e) => {
    e.preventDefault();
    setAlerta(null);
    setErrores({});

    const token = localStorage.getItem('token_clinica');
    if (!token) {
      setAlerta({ tipo: 'error', mensaje: 'Sesión no detectada o expirada. Por favor inicie sesión nuevamente.' });
      return;
    }

    if (!idEspecialidad) {
      setAlerta({ tipo: 'error', mensaje: 'Debe seleccionar una especialidad médica.' });
      return;
    }

    if (!idMedico) {
      setAlerta({ tipo: 'error', mensaje: 'Debe seleccionar un médico especialista.' });
      return;
    }

    if (!turnoSeleccionado || !turnoSeleccionado.hora_inicio) {
      setAlerta({ tipo: 'error', mensaje: 'Debe seleccionar un turno disponible en la lista inferior.' });
      return;
    }

    if (esPersonal && !idPaciente) {
      setAlerta({ tipo: 'error', mensaje: 'Debe seleccionar el paciente destinatario de la cita.' });
      return;
    }

    setMostrarModalPago(true);
  };

  // Paso 2: Procesar Pago Simulado y Crear Cita Atómica (CU-12 + CU-27)
  const procesarPagoYConfirmar = async (datosPago) => {
    setEnviando(true);
    setAlerta(null);
    setErrores({});

    const token = localStorage.getItem('token_clinica');
    if (!token) {
      setAlerta({
        tipo: 'error',
        mensaje: 'No se detectó un token de autenticación válido (401). Inicie sesión nuevamente.',
      });
      setMostrarModalPago(false);
      setEnviando(false);
      return;
    }

    // Normalizar método de pago: NUNCA etiquetas visuales como "Tarjeta" o "Simple QR"
    let metodoPagoValido = 'tarjeta_debito_credito';
    const metodoElegido = (datosPago?.metodo_pago || metodoPago || '').toLowerCase().trim();
    if (metodoElegido.includes('qr') || metodoElegido === 'qr_transferencia') {
      metodoPagoValido = 'qr_transferencia';
    } else {
      metodoPagoValido = 'tarjeta_debito_credito';
    }

    // Normalizar hora_inicio: asegurar estrictamente formato H:i (e.g. "08:00")
    let horaInicioLimpia = turnoSeleccionado?.hora_inicio
      ? String(turnoSeleccionado.hora_inicio).trim()
      : '';
    if (horaInicioLimpia.length > 5) {
      horaInicioLimpia = horaInicioLimpia.slice(0, 5);
    }
    if (/^\d:\d{2}$/.test(horaInicioLimpia)) {
      horaInicioLimpia = '0' + horaInicioLimpia;
    }

    // Obtener id_paciente numérico
    const idPacienteVal = esPersonal
      ? parseInt(idPaciente, 10)
      : parseInt(usuario?.id_paciente || usuario?.paciente?.id_paciente || usuario?.id_persona || 0, 10);

    // Payload canónico estricto alineado con CrearCitaRequest
    const payload = {
      id_medico: parseInt(idMedico, 10),
      id_especialidad: parseInt(idEspecialidad, 10),
      fecha_cita: String(fecha).trim(),
      hora_inicio: horaInicioLimpia,
      metodo_pago: metodoPagoValido,
      motivo_consulta: (motivoConsulta || '').trim() || 'Consulta médica general',
      referencia_simulada: datosPago?.referencia_simulada || (metodoPagoValido === 'qr_transferencia' ? 'QR-BCP-PAGO' : 'CARD-TRANSACCION'),
      detalles_pasarela: datosPago?.detalles_pasarela || {
        origen: 'pasarela_web',
        metodo: metodoPagoValido,
        banco: metodoPagoValido === 'qr_transferencia' ? 'Simple QR Interoperable' : 'Visa / MasterCard',
        monto_bs: 50.00,
      },
    };

    if (idPacienteVal > 0) {
      payload.id_paciente = idPacienteVal;
    }

    try {
      // Petición HTTP usando exclusivamente la instancia Axios configurada del proyecto (inyección Bearer)
      const configPeticion = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const res = await api.post('/citas', payload, configPeticion);
      const datosCita = res.data.datos;

      setComprobanteExito({
        codigo_cita: datosCita.codigo_cita,
        nro_transaccion: datosCita.nro_transaccion,
        monto: datosCita.monto_reserva || 50.00,
        fecha: fecha,
        hora: horaInicioLimpia,
        especialidad: especialidades.find((e) => Number(e.id_especialidad) === Number(idEspecialidad))?.nombre,
        medico: medicos.find((m) => Number(m.id_medico) === Number(idMedico))?.apellidos,
        metodo_pago: metodoPagoValido === 'qr_transferencia' ? 'Simple QR Interoperable' : 'Tarjeta de Débito/Crédito',
      });

      setMostrarModalPago(false);
      setTurnoSeleccionado(null);
      setMotivoConsulta('');
    } catch (err) {
      const codigoEstado = err.response?.status;
      const mensajeServidor = err.response?.data?.mensaje;

      // 1. Caso de conflicto por turno ocupado concurrentemente (HTTP 409 Conflict)
      if (codigoEstado === 409 || (codigoEstado === 400 && String(mensajeServidor).toLowerCase().includes('reservado'))) {
        setTurnoSeleccionado(null);
        setClaveRefrescoTurnos((prev) => prev + 1);
        setAlerta({
          tipo: 'error',
          mensaje: mensajeServidor || 'El turno médico seleccionado ya no se encuentra disponible. Por favor seleccione otro turno.',
        });
      } else if (codigoEstado === 401) {
        setAlerta({
          tipo: 'error',
          mensaje: 'Su sesión ha expirado o no está autorizado. Inicie sesión nuevamente.',
        });
      } else if (codigoEstado === 422) {
        if (err.response?.data?.errores) {
          setErrores(err.response.data.errores);
        }
        setAlerta({
          tipo: 'error',
          mensaje: mensajeServidor || 'Los datos de la reserva no son válidos. Por favor revise el formulario.',
        });
      } else if (codigoEstado >= 500) {
        setAlerta({
          tipo: 'error',
          mensaje: 'No fue posible completar la reserva debido a un problema técnico en el servidor. Por favor intente nuevamente.',
        });
      } else if (!err.response) {
        setAlerta({
          tipo: 'error',
          mensaje: 'No se pudo conectar con el servidor. Verifique su conexión a internet e intente de nuevo.',
        });
      } else {
        setAlerta({
          tipo: 'error',
          mensaje: mensajeServidor || 'No se pudo procesar la reserva de la cita médica.',
        });
      }

      setMostrarModalPago(false);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <LayoutPrincipal>
      <div style={{ maxWidth: '800px', margin: '0.5rem auto', width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
        <div className="tarjeta" style={{ overflowX: 'hidden', width: '100%', boxSizing: 'border-box' }}>
          <h2 className="titulo" style={{ marginBottom: '0.25rem' }}>
            <b>Reserva</b> <span>de Citas Médicas</span>
          </h2>
          <p style={{ color: 'var(--texto-sec)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Selecciona la especialidad, el médico y el horario de tu preferencia con confirmación inmediata de reserva.
          </p>

          <Alerta tipo={alerta?.tipo} mensaje={alerta?.mensaje} />

          <form onSubmit={iniciarProcesoReserva}>
            {esPersonal && (
              <SelectorBuscador
                etiqueta="Paciente Destinatario"
                nombre="id_paciente"
                valor={idPaciente}
                alCambiar={(e) => setIdPaciente(e.target.value)}
                error={errores.id_paciente?.[0] || errores.id_paciente}
                marcador="Buscar paciente por apellidos, nombres, CI o historial..."
                opciones={pacientes.map((p) => {
                  const apellidos = p.apellidos || '';
                  const nombres = p.nombres || '';
                  const ci = p.ci || '';
                  const hist = p.codigo_historia || '';
                  return {
                    valor: p.id_paciente,
                    etiqueta: `${apellidos}, ${nombres}`,
                    subtitulo: `CI: ${ci || 'S/N'} · Historial: ${hist || 'S/N'}`,
                    busqueda: `${apellidos} ${nombres} ${ci} ${hist}`,
                  };
                })}
                requerido
              />
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0 1rem' }}>
              <SelectorBuscador
                etiqueta="Especialidad Médica"
                nombre="id_especialidad"
                valor={idEspecialidad}
                alCambiar={(e) => {
                  setIdEspecialidad(e.target.value);
                  setTurnoSeleccionado(null);
                }}
                error={errores.id_especialidad?.[0] || errores.id_especialidad}
                marcador="Escriba o busque especialidad (ej. Pediatría)..."
                opciones={especialidades.map((esp) => ({
                  valor: esp.id_especialidad,
                  etiqueta: esp.nombre,
                  busqueda: esp.nombre,
                }))}
                requerido
              />

              <SelectorBuscador
                etiqueta="Médico Especialista"
                nombre="id_medico"
                valor={idMedico}
                alCambiar={(e) => {
                  setIdMedico(e.target.value);
                  setTurnoSeleccionado(null);
                }}
                error={errores.id_medico?.[0] || errores.id_medico}
                marcador={
                  !idEspecialidad
                    ? 'Primero seleccione una especialidad médica'
                    : 'Buscar por apellido, nombre o matrícula...'
                }
                opciones={medicos.map((med) => {
                  const apellidos = med.apellidos || '';
                  const nombres = med.nombres || '';
                  const matricula = med.nro_matricula || '';
                  const espNombres = (med.especialidades || []).map((e) => e.nombre).join(' ');
                  return {
                    valor: med.id_medico,
                    etiqueta: `Dr. ${apellidos}, ${nombres}`,
                    subtitulo: matricula ? `Matrícula: ${matricula}` : '',
                    busqueda: `${apellidos} ${nombres} ${matricula} ${espNombres}`,
                  };
                })}
                deshabilitado={!idEspecialidad}
                mensajeVacio={
                  !idEspecialidad
                    ? 'Primero seleccione una especialidad médica'
                    : 'No hay médicos disponibles para esta búsqueda'
                }
                requerido
              />
            </div>

            <CampoTexto
              etiqueta="Fecha de la Consulta"
              nombre="fecha_cita"
              tipo="date"
              valor={fecha}
              alCambiar={(e) => {
                setFecha(e.target.value);
                setTurnoSeleccionado(null);
              }}
              error={errores.fecha_cita?.[0] || errores.fecha_cita}
              requerido
            />

            {/* Selector Modular de Turnos / Disponibilidad (CU-10) */}
            <SelectorDisponibilidadTurnos
              idEspecialidad={idEspecialidad}
              idMedico={idMedico}
              fecha={fecha}
              onSeleccionarTurno={(turno) => setTurnoSeleccionado(turno)}
              turnoSeleccionado={turnoSeleccionado}
              claveRefresco={claveRefrescoTurnos}
            />

            <CampoTexto
              etiqueta="Motivo de la Consulta (Opcional)"
              nombre="motivo_consulta"
              valor={motivoConsulta}
              alCambiar={(e) => setMotivoConsulta(e.target.value)}
              error={errores.motivo_consulta?.[0] || errores.motivo_consulta}
              marcador="Describa brevemente sus síntomas o motivo de atención"
              filas={3}
            />

            <button
              type="submit"
              className="boton-primario"
              style={{ width: '100%', minHeight: '48px', fontSize: '1rem', marginTop: '0.5rem' }}
              disabled={enviando || !turnoSeleccionado}
            >
              Continuar con la Garantía de Reserva (50.00 Bs) ➔
            </button>
          </form>
        </div>

        {/* Modal Autónomo de Pasarela de Pago Simulado (CU-27 / D17) */}
        <ModalPasarelaPagoSimulada
          abierto={mostrarModalPago}
          alCerrar={() => setMostrarModalPago(false)}
          alConfirmarPago={procesarPagoYConfirmar}
          procesando={enviando}
          monto={50.00}
          metodoPago={metodoPago}
          setMetodoPago={setMetodoPago}
          detalleTurno={{
            fecha,
            hora: turnoSeleccionado?.hora_inicio,
            especialidad: especialidades.find((e) => Number(e.id_especialidad) === Number(idEspecialidad))?.nombre,
            medico: medicos.find((m) => Number(m.id_medico) === Number(idMedico))?.apellidos,
          }}
        />

        {/* Comprobante Digital Oficial Autónomo (CU-27 / D17) */}
        <ComprobanteDigitalTransaccion
          comprobante={comprobanteExito}
          alCerrar={() => setComprobanteExito(null)}
          alIrAHistorial={() => navigate('/citas/historial')}
        />
      </div>
    </LayoutPrincipal>
  );
}
