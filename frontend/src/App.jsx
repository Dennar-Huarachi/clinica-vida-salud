import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

import RutaProtegidaPorRol from './comun/componentes/RutaProtegidaPorRol';

import PaginaInicio from './publico/PaginaInicio';
import IniciarSesion from './Paquetes/AccesoCuentas/CU01_IniciarCerrarSesion/IniciarSesion';
import LoginPaciente from './Paquetes/AccesoCuentas/CU01_IniciarCerrarSesion/LoginPaciente';
import LoginPersonal from './Paquetes/AccesoCuentas/CU01_IniciarCerrarSesion/LoginPersonal';
import PaginaCambiarContrasena from './Paquetes/AccesoCuentas/CU02_CambiarContrasena/PaginaCambiarContrasena';
import PaginaRegistroPaciente from './Paquetes/AccesoCuentas/CU03_RegistrarsePaciente/PaginaRegistroPaciente';
import PaginaUsuariosRoles from './Paquetes/AccesoCuentas/CU04_AdministrarUsuariosRoles/PaginaUsuariosRoles';

import PaginaGestionPacientes from './Paquetes/PacientesPerfil/CU05_GestionarPacientes/PaginaGestionPacientes';
import PaginaMiPerfil from './Paquetes/PacientesPerfil/CU06_GestionarMiPerfil/PaginaMiPerfil';

import PaginaEspecialidades from './Paquetes/CatalogosHorarios/CU07_GestionarEspecialidades/PaginaEspecialidades';
import PaginaMedicos from './Paquetes/CatalogosHorarios/CU08_GestionarMedicos/PaginaMedicos';
import PaginaHorarios from './Paquetes/CatalogosHorarios/CU09_GestionarHorariosAtencion/PaginaHorarios';
import PaginaSuspensiones from './Paquetes/CatalogosHorarios/CU11_SuspenderHorarioGestionarCitasAfectadas/PaginaSuspensiones';

import PaginaReservaCitas from './Paquetes/CitasNotificaciones/CU12_GestionarCitas/PaginaReservaCitas';
import PaginaAgendaCitas from './Paquetes/CitasNotificaciones/CU14_ConsultarAgendaCitas/PaginaAgendaCitas';
import PaginaHistorialCitas from './Paquetes/CitasNotificaciones/CU15_ConsultarHistorialSeguimientoCitas/PaginaHistorialCitas';

import FormularioAtencionClinica from './Paquetes/HistoriaClinica/CU18_RegistrarAtencionClinica/FormularioAtencionClinica';
import PaginaKardexPacientes from './Paquetes/HistoriaClinica/CU17_ConsultarMisPacientes/PaginaKardexPacientes';
import PaginaHistorialClinico from './Paquetes/HistoriaClinica/CU20_ConsultarHistorialClinico/PaginaHistorialClinico';

import PaginaReportes from './Paquetes/Reportes/CU21_ConsultarReportesCitas/PaginaReportes';
import PaginaBitacora from './Paquetes/Reportes/CU24_ConsultarBitacoraAuditoria/PaginaBitacora';
import PaginaDashboard from './Paquetes/Reportes/CU25_VisualizarDashboardAdministrativo/PaginaDashboard';
import PaginaCopiasSeguridad from './Paquetes/AccesoCuentas/CU26_GenerarRestaurarCopiasSeguridad/PaginaCopiasSeguridad';

function PaginaNoEncontrada() {
  return (
    <main style={{ padding: '3rem 2rem', maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
      <h1 className="titulo">
        <b>Página</b> <span>no encontrada (404)</span>
      </h1>
      <p style={{ marginTop: '1rem', color: 'var(--texto-sec)' }}>
        La ruta solicitada no existe o no se encuentra disponible.
      </p>
      <div style={{ marginTop: '1.5rem' }}>
        <Link to="/" className="boton-primario">
          Volver al Inicio
        </Link>
      </div>
    </main>
  );
}

export default function App() {
  // Sincronización de sesión multi-pestaña en tiempo real (Anti-Suplantación)
  useEffect(() => {
    const sincronizarSesiones = (event) => {
      if (event.key === 'token_clinica' || event.key === 'usuario_clinica') {
        // Si otra pestaña cerró sesión o cambió de usuario/rol, forzar recarga
        window.location.reload();
      }
    };
    window.addEventListener('storage', sincronizarSesiones);
    return () => window.removeEventListener('storage', sincronizarSesiones);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas y de Autenticación */}
        <Route path="/" element={<PaginaInicio />} />
        <Route path="/login" element={<IniciarSesion />} />
        <Route path="/login/paciente" element={<LoginPaciente />} />
        <Route path="/login/personal" element={<LoginPersonal />} />
        <Route path="/iniciar-sesion" element={<IniciarSesion />} />
        <Route path="/registro-paciente" element={<PaginaRegistroPaciente />} />

        {/* ---------------- PACIENTE ---------------- */}
        <Route
          path="/paciente/mis-citas"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['paciente']}>
              <PaginaHistorialCitas />
            </RutaProtegidaPorRol>
          }
        />
        <Route
          path="/paciente/reservar"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['paciente']}>
              <PaginaReservaCitas />
            </RutaProtegidaPorRol>
          }
        />
        <Route
          path="/paciente/historial"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['paciente']}>
              <PaginaHistorialClinico />
            </RutaProtegidaPorRol>
          }
        />
        <Route
          path="/paciente/perfil"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['paciente']}>
              <PaginaMiPerfil />
            </RutaProtegidaPorRol>
          }
        />

        {/* ---------------- MÉDICO ---------------- */}
        <Route
          path="/medico/agenda"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['medico']}>
              <PaginaAgendaCitas />
            </RutaProtegidaPorRol>
          }
        />
        <Route
          path="/medico/pacientes"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['medico']}>
              <PaginaKardexPacientes />
            </RutaProtegidaPorRol>
          }
        />
        <Route
          path="/medico/pacientes/:idPaciente"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['medico', 'administrador']}>
              <PaginaHistorialClinico />
            </RutaProtegidaPorRol>
          }
        />
        <Route
          path="/medico/atenciones"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['medico']}>
              <PaginaHistorialClinico />
            </RutaProtegidaPorRol>
          }
        />
        <Route
          path="/medico/atenciones/:idPaciente"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['medico', 'administrador']}>
              <PaginaHistorialClinico />
            </RutaProtegidaPorRol>
          }
        />
        <Route
          path="/medico/laboratorio"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['medico']}>
              <PaginaHistorialClinico />
            </RutaProtegidaPorRol>
          }
        />
        <Route
          path="/medico/laboratorio/:idPaciente"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['medico', 'administrador']}>
              <PaginaHistorialClinico />
            </RutaProtegidaPorRol>
          }
        />

        {/* ---------------- RECEPCIONISTA ---------------- */}
        <Route
          path="/recepcion/citas"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['recepcionista', 'administrador']}>
              <PaginaAgendaCitas />
            </RutaProtegidaPorRol>
          }
        />
        <Route
          path="/recepcion/agendar"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['recepcionista', 'administrador']}>
              <PaginaReservaCitas />
            </RutaProtegidaPorRol>
          }
        />
        <Route
          path="/recepcion/pacientes"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['recepcionista', 'administrador']}>
              <PaginaGestionPacientes />
            </RutaProtegidaPorRol>
          }
        />
        <Route
          path="/recepcion/suspensiones"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['recepcionista', 'administrador']}>
              <PaginaSuspensiones />
            </RutaProtegidaPorRol>
          }
        />
        <Route
          path="/recepcion/reportes"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['recepcionista', 'administrador']}>
              <PaginaReportes />
            </RutaProtegidaPorRol>
          }
        />

        {/* ---------------- ADMINISTRADOR ---------------- */}
        <Route
          path="/admin/dashboard"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['administrador']}>
              <PaginaDashboard />
            </RutaProtegidaPorRol>
          }
        />
        <Route
          path="/admin/especialidades"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['administrador']}>
              <PaginaEspecialidades />
            </RutaProtegidaPorRol>
          }
        />
        <Route
          path="/admin/medicos"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['administrador']}>
              <PaginaMedicos />
            </RutaProtegidaPorRol>
          }
        />
        <Route
          path="/admin/horarios"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['administrador']}>
              <PaginaHorarios />
            </RutaProtegidaPorRol>
          }
        />
        <Route
          path="/admin/suspensiones"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['administrador']}>
              <PaginaSuspensiones />
            </RutaProtegidaPorRol>
          }
        />
        <Route
          path="/admin/citas"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['administrador']}>
              <PaginaAgendaCitas />
            </RutaProtegidaPorRol>
          }
        />
        <Route
          path="/admin/pacientes"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['administrador']}>
              <PaginaGestionPacientes />
            </RutaProtegidaPorRol>
          }
        />
        <Route
          path="/admin/usuarios"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['administrador']}>
              <PaginaUsuariosRoles />
            </RutaProtegidaPorRol>
          }
        />
        <Route
          path="/admin/bitacora"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['administrador']}>
              <PaginaBitacora />
            </RutaProtegidaPorRol>
          }
        />
        <Route
          path="/admin/respaldos"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['administrador']}>
              <PaginaCopiasSeguridad />
            </RutaProtegidaPorRol>
          }
        />
        <Route
          path="/respaldos"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['administrador']}>
              <PaginaCopiasSeguridad />
            </RutaProtegidaPorRol>
          }
        />
        <Route
          path="/seguridad/backups"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['administrador']}>
              <PaginaCopiasSeguridad />
            </RutaProtegidaPorRol>
          }
        />
        <Route
          path="/admin/reportes"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['administrador']}>
              <PaginaReportes />
            </RutaProtegidaPorRol>
          }
        />

        {/* ---------------- RUTAS GENERALES Y ALIASES PROTEGIDOS ---------------- */}
        <Route
          path="/dashboard"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['administrador']}>
              <PaginaDashboard />
            </RutaProtegidaPorRol>
          }
        />
        <Route
          path="/perfil"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['administrador', 'medico', 'recepcionista', 'paciente']}>
              <PaginaMiPerfil />
            </RutaProtegidaPorRol>
          }
        />
        <Route
          path="/cuenta/cambiar-contrasena"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['administrador', 'medico', 'recepcionista', 'paciente']}>
              <PaginaCambiarContrasena />
            </RutaProtegidaPorRol>
          }
        />

        {/* Citas y Agenda Aliases */}
        <Route
          path="/citas/reserva"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['paciente', 'recepcionista', 'administrador']}>
              <PaginaReservaCitas />
            </RutaProtegidaPorRol>
          }
        />
        <Route
          path="/citas/agenda"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['medico', 'recepcionista', 'administrador']}>
              <PaginaAgendaCitas />
            </RutaProtegidaPorRol>
          }
        />
        <Route
          path="/citas/historial"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['paciente', 'recepcionista', 'administrador', 'medico']}>
              <PaginaHistorialCitas />
            </RutaProtegidaPorRol>
          }
        />

        {/* Pacientes e Historias */}
        <Route
          path="/pacientes"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['recepcionista', 'administrador', 'medico']}>
              <PaginaGestionPacientes />
            </RutaProtegidaPorRol>
          }
        />
        <Route
          path="/historia-clinica"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['medico', 'recepcionista', 'administrador']}>
              <PaginaGestionPacientes />
            </RutaProtegidaPorRol>
          }
        />
        <Route
          path="/historia-clinica/:idPaciente"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['medico', 'administrador', 'recepcionista']}>
              <PaginaHistorialClinico />
            </RutaProtegidaPorRol>
          }
        />
        <Route
          path="/historia-clinica/pacientes/:idPaciente"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['medico', 'administrador', 'recepcionista']}>
              <PaginaHistorialClinico />
            </RutaProtegidaPorRol>
          }
        />
        <Route
          path="/historia-clinica/atencion/:idCita"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['medico']}>
              <FormularioAtencionClinica />
            </RutaProtegidaPorRol>
          }
        />

        {/* Catálogos */}
        <Route
          path="/medicos"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['administrador']}>
              <PaginaMedicos />
            </RutaProtegidaPorRol>
          }
        />
        <Route
          path="/especialidades"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['administrador']}>
              <PaginaEspecialidades />
            </RutaProtegidaPorRol>
          }
        />

        {/* Administración y Reportes */}
        <Route
          path="/usuarios"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['administrador']}>
              <PaginaUsuariosRoles />
            </RutaProtegidaPorRol>
          }
        />
        <Route
          path="/reportes"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['administrador', 'recepcionista']}>
              <PaginaReportes />
            </RutaProtegidaPorRol>
          }
        />
        <Route
          path="/auditoria"
          element={
            <RutaProtegidaPorRol rolesPermitidos={['administrador']}>
              <PaginaBitacora />
            </RutaProtegidaPorRol>
          }
        />

        {/* 404 */}
        <Route path="*" element={<PaginaNoEncontrada />} />
      </Routes>
    </BrowserRouter>
  );
}
