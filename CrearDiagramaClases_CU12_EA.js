!INC Local Scripts.EAConstants-JScript

/*
 * =================================================================================================
 * Sparx Enterprise Architect - JScript
 * Diagrama de Clases de Análisis (VOPC / BCE / Robustez): CU12 - Gestionar citas
 * Contexto: Proyecto "Clínica Vida Salud" (Laravel 11 + PostgreSQL 16)
 *
 * Enfoque: Tablas principales e indispensables del caso de uso según requerimiento expreso.
 *
 * Componentes del diagrama:
 *  - Actor: Paciente / Recepcionista (Usuario facultado para agendar, reprogramar o cancelar citas)
 *  - Boundary: UI_GestionCitas (PaginaReservaCitas.jsx con pasarela de depósito de garantía y comprobante)
 *  - Control: GestionarCitasControlador (Controlador Laravel del CU12 que orquesta el servicio)
 *  - Entity: Usuario (Tabla DB: usuarios - operador autenticado en sesión)
 *  - Entity: BitacoraAuditoria (Tabla DB: bitacora_auditoria - registro inmutable RN21)
 *  - Entity: Paciente (Tabla DB: pacientes - titular que reserva el turno médico)
 *  - Entity: Cita (Tabla DB: citas - turno clínico central con control de concurrencia)
 *  - Entity: PagoCita (Tabla DB: pagos_cita - depósito de garantía de Bs 50 y reembolso CU27)
 *  - Entity: Medico (Tabla DB: medicos - profesional especialista asignado)
 *  - Entity: Especialidad (Tabla DB: especialidades - especialidad médica requerida)
 * =================================================================================================
 */

var PACKAGE_NAME = "CU12 - Clases de análisis";
var DIAGRAM_NAME = "CU12 Gestionar citas";

// Fallback seguro para promptOK si el include de EA no lo inicializa en tiempo de carga
var PROMPT_OK = (typeof promptOK !== "undefined") ? promptOK : 0;

function guardar(objeto, descripcion) {
    if (!objeto.Update()) {
        throw new Error("No se pudo guardar " + descripcion + ". " + objeto.GetLastError());
    }
}

function buscarPaquete(padre, nombre) {
    padre.Packages.Refresh();
    for (var i = 0; i < padre.Packages.Count; i++) {
        var paquete = padre.Packages.GetAt(i);
        if (paquete.Name == nombre) return paquete;
    }
    return null;
}

function crearClase(paquete, nombre, notas, estereotipo) {
    var elemento = paquete.Elements.AddNew(nombre, "Class");
    elemento.Stereotype = estereotipo || "";
    elemento.Notes = notas || "";
    guardar(elemento, "la clase " + nombre);
    paquete.Elements.Refresh();
    return elemento;
}

function crearActor(paquete, nombre, notas) {
    var actor = paquete.Elements.AddNew(nombre, "Actor");
    actor.Notes = notas || "";
    guardar(actor, "el actor " + nombre);
    paquete.Elements.Refresh();
    return actor;
}

function agregarAtributo(elemento, nombre, tipo, visibilidad) {
    var attr = elemento.Attributes.AddNew(nombre, tipo);
    attr.Visibility = visibilidad || "Private";
    guardar(attr, "el atributo " + nombre);
    elemento.Attributes.Refresh();
    return attr;
}

function agregarMetodo(elemento, nombre, tipoRetorno, visibilidad) {
    var met = elemento.Methods.AddNew(nombre, tipoRetorno || "void");
    met.Visibility = visibilidad || "Public";
    guardar(met, "el metodo " + nombre);
    elemento.Methods.Refresh();
    return met;
}

function crearAsociacion(origen, destino, multOrigen, multDestino, rolNombre) {
    var con = origen.Connectors.AddNew(rolNombre || "", "Association");
    con.ClientID = origen.ElementID;
    con.SupplierID = destino.ElementID;
    con.Direction = "Source -> Destination";
    if (multOrigen) con.ClientEnd.Cardinality = multOrigen;
    if (multDestino) con.SupplierEnd.Cardinality = multDestino;
    guardar(con, "la asociacion entre " + origen.Name + " y " + destino.Name);
    origen.Connectors.Refresh();
    return con;
}

function colocar(diagrama, elemento, left, right, top, bottom) {
    var pos = "l=" + left + ";r=" + right + ";t=" + top + ";b=" + bottom + ";";
    var diagObj = diagrama.DiagramObjects.AddNew(pos, "");
    diagObj.ElementID = elemento.ElementID;
    diagObj.Sequence = 1;
    guardar(diagObj, "el objeto visual para " + elemento.Name);
}

function main() {
    Repository.EnsureOutputVisible("Script");
    Repository.ClearOutput("Script");
    Repository.WriteOutput("Script", "=== Generando Diagrama de Clases de Analisis: CU12 Gestionar citas ===", 0);

    var padre = Repository.GetTreeSelectedPackage();
    if (!padre) {
        Session.Prompt("Por favor, seleccione un paquete en el Project Browser.", PROMPT_OK);
        return;
    }

    var existente = buscarPaquete(padre, PACKAGE_NAME);
    if (existente != null) {
        for (var i = padre.Packages.Count - 1; i >= 0; i--) {
            if (padre.Packages.GetAt(i).PackageID == existente.PackageID) {
                padre.Packages.Delete(i);
                break;
            }
        }
        padre.Packages.Refresh();
    }

    try {
        var paquete = padre.Packages.AddNew(PACKAGE_NAME, "");
        paquete.Notes = "Diagrama de clases de analisis del Caso de Uso 12 (Gestionar citas) centrado en tablas principales e indispensables.";
        guardar(paquete, "el paquete CU12");
        padre.Packages.Refresh();

        // Diagrama de tipo "Logical" (UML Class Diagram en Enterprise Architect)
        var diagrama = paquete.Diagrams.AddNew(DIAGRAM_NAME, "Logical");
        guardar(diagrama, "el diagrama de clases CU12");
        paquete.Diagrams.Refresh();

        // =====================================================================
        // 1. ACTOR
        // =====================================================================
        var actor = crearActor(
            paquete,
            "Paciente / Recepcionista",
            "Usuario solicitante (paciente via web o recepcionista en ventanilla) que reserva, reprograma, confirma o cancela turnos clinicos."
        );

        // =====================================================================
        // 2. BOUNDARY (Interfaz de Usuario)
        // =====================================================================
        var ui = crearClase(
            paquete,
            "UI_GestionCitas",
            "Modulo interactivo de reserva y seguimiento de citas (PaginaReservaCitas.jsx) con pasarela de pago de garantia simulada y emision de comprobante."
        );
        agregarMetodo(ui, "cancelarCita", "void", "Public");
        agregarMetodo(ui, "confirmarAsistencia", "void", "Public");
        agregarMetodo(ui, "iniciarProcesoReserva", "void", "Public");
        agregarMetodo(ui, "mostrarComprobante", "void", "Public");
        agregarMetodo(ui, "mostrarListadoCitas", "void", "Public");
        agregarMetodo(ui, "procesarPagoYConfirmar", "void", "Public");
        agregarMetodo(ui, "reprogramarTurno", "void", "Public");

        // =====================================================================
        // 3. CONTROL (Controlador Laravel)
        // =====================================================================
        var controlador = crearClase(
            paquete,
            "GestionarCitasControlador",
            "Controlador Laravel del CU12 que coordina el ciclo de vida de la cita, control de concurrencia lockForUpdate, blindaje IDOR y garantia financiera CU27."
        );
        agregarMetodo(controlador, "cancelar", "JsonResponse", "Public");
        agregarMetodo(controlador, "confirmar", "JsonResponse", "Public");
        agregarMetodo(controlador, "index", "JsonResponse", "Public");
        agregarMetodo(controlador, "reprogramar", "JsonResponse", "Public");
        agregarMetodo(controlador, "store", "JsonResponse", "Public");

        // =====================================================================
        // 4. ENTITY: Usuario (Tabla: usuarios - Operador en sesion)
        // =====================================================================
        var usuario = crearClase(
            paquete,
            "Usuario",
            "Cuenta del usuario en sesion que opera la reserva o gestion de la cita (Tabla: usuarios)."
        );
        agregarAtributo(usuario, "contrasena_hash", "string", "Private");
        agregarAtributo(usuario, "correo", "string", "Private");
        agregarAtributo(usuario, "created_at", "timestamp", "Private");
        agregarAtributo(usuario, "debe_cambiar_contrasena", "boolean", "Private");
        agregarAtributo(usuario, "estado", "string", "Private");
        agregarAtributo(usuario, "id_persona", "int", "Private");
        agregarAtributo(usuario, "id_rol", "int", "Private");
        agregarAtributo(usuario, "id_usuario", "int", "Private");
        agregarAtributo(usuario, "nombre_usuario", "string", "Private");
        agregarAtributo(usuario, "token_sesion", "string", "Private");
        agregarAtributo(usuario, "ultimo_acceso", "timestamp", "Private");
        agregarAtributo(usuario, "updated_at", "timestamp", "Private");

        agregarMetodo(usuario, "create", "void", "Public");
        agregarMetodo(usuario, "find", "void", "Public");
        agregarMetodo(usuario, "update", "void", "Public");
        agregarMetodo(usuario, "where", "void", "Public");

        // =====================================================================
        // 5. ENTITY: BitacoraAuditoria (Tabla: bitacora_auditoria - Trazabilidad RN21)
        // =====================================================================
        var bitacora = crearClase(
            paquete,
            "BitacoraAuditoria",
            "Trazabilidad inmutable de eventos: CREAR_CITA_CON_PAGO_GARANTIA, REPROGRAMAR_CITA y CANCELAR_CITA (Tabla: bitacora_auditoria)."
        );
        agregarAtributo(bitacora, "accion", "string", "Private");
        agregarAtributo(bitacora, "caso_uso", "string", "Private");
        agregarAtributo(bitacora, "created_at", "timestamp", "Private");
        agregarAtributo(bitacora, "datos_anteriores", "string", "Private");
        agregarAtributo(bitacora, "datos_nuevos", "string", "Private");
        agregarAtributo(bitacora, "fecha_hora", "timestamp", "Private");
        agregarAtributo(bitacora, "id_bitacora", "int", "Private");
        agregarAtributo(bitacora, "id_usuario", "int", "Private");
        agregarAtributo(bitacora, "ip_origen", "string", "Private");
        agregarAtributo(bitacora, "registro_id", "string", "Private");
        agregarAtributo(bitacora, "tabla_afectada", "string", "Private");
        agregarAtributo(bitacora, "user_agent", "string", "Private");

        agregarMetodo(bitacora, "create", "void", "Public");
        agregarMetodo(bitacora, "where", "void", "Public");

        // =====================================================================
        // 6. ENTITY: Paciente (Tabla: pacientes - Titular del turno)
        // =====================================================================
        var paciente = crearClase(
            paquete,
            "Paciente",
            "Paciente titular para quien se agenda la atencion medica con codigo unico de historial (Tabla: pacientes)."
        );
        agregarAtributo(paciente, "codigo_paciente", "string", "Private");
        agregarAtributo(paciente, "created_at", "timestamp", "Private");
        agregarAtributo(paciente, "estado", "string", "Private");
        agregarAtributo(paciente, "id_paciente", "int", "Private");
        agregarAtributo(paciente, "id_persona", "int", "Private");
        agregarAtributo(paciente, "updated_at", "timestamp", "Private");

        agregarMetodo(paciente, "find", "void", "Public");
        agregarMetodo(paciente, "where", "void", "Public");

        // =====================================================================
        // 7. ENTITY: Cita (Tabla: citas - Entidad Central)
        // =====================================================================
        var cita = crearClase(
            paquete,
            "Cita",
            "Reserva del turno clinico con codigo CIT-YYYYMMDD, control de concurrencia y seguimiento de estado (Tabla: citas)."
        );
        agregarAtributo(cita, "codigo_cita", "string", "Private");
        agregarAtributo(cita, "creado_por_usuario", "int", "Private");
        agregarAtributo(cita, "created_at", "timestamp", "Private");
        agregarAtributo(cita, "es_postergada", "boolean", "Private");
        agregarAtributo(cita, "estado", "string", "Private");
        agregarAtributo(cita, "fecha_cita", "date", "Private");
        agregarAtributo(cita, "fecha_expiracion_reserva", "timestamp", "Private");
        agregarAtributo(cita, "hora_fin", "time", "Private");
        agregarAtributo(cita, "hora_inicio", "time", "Private");
        agregarAtributo(cita, "id_cita", "int", "Private");
        agregarAtributo(cita, "id_especialidad", "int", "Private");
        agregarAtributo(cita, "id_estado_cita", "int", "Private");
        agregarAtributo(cita, "id_medico", "int", "Private");
        agregarAtributo(cita, "id_paciente", "int", "Private");
        agregarAtributo(cita, "id_pago", "int", "Private");
        agregarAtributo(cita, "motivo_consulta", "string", "Private");
        agregarAtributo(cita, "observaciones", "string", "Private");
        agregarAtributo(cita, "pago_confirmado", "boolean", "Private");
        agregarAtributo(cita, "updated_at", "timestamp", "Private");

        agregarMetodo(cita, "create", "void", "Public");
        agregarMetodo(cita, "find", "void", "Public");
        agregarMetodo(cita, "lockForUpdate", "void", "Public");
        agregarMetodo(cita, "update", "void", "Public");
        agregarMetodo(cita, "where", "void", "Public");

        // =====================================================================
        // 8. ENTITY: PagoCita (Tabla: pagos_cita - Garantia CU27)
        // =====================================================================
        var pagoCita = crearClase(
            paquete,
            "PagoCita",
            "Comprobante del deposito de garantia de reserva de Bs 50 y registro de reembolso o retencion financiera (Tabla: pagos_cita)."
        );
        agregarAtributo(pagoCita, "created_at", "timestamp", "Private");
        agregarAtributo(pagoCita, "detalles_pasarela", "string", "Private");
        agregarAtributo(pagoCita, "estado_pago", "string", "Private");
        agregarAtributo(pagoCita, "fecha_pago", "timestamp", "Private");
        agregarAtributo(pagoCita, "fecha_reembolso", "timestamp", "Private");
        agregarAtributo(pagoCita, "id_cita", "int", "Private");
        agregarAtributo(pagoCita, "id_pago", "int", "Private");
        agregarAtributo(pagoCita, "metodo_pago", "string", "Private");
        agregarAtributo(pagoCita, "monto", "decimal", "Private");
        agregarAtributo(pagoCita, "nro_transaccion", "string", "Private");
        agregarAtributo(pagoCita, "updated_at", "timestamp", "Private");

        agregarMetodo(pagoCita, "create", "void", "Public");
        agregarMetodo(pagoCita, "find", "void", "Public");
        agregarMetodo(pagoCita, "update", "void", "Public");
        agregarMetodo(pagoCita, "where", "void", "Public");

        // =====================================================================
        // 9. ENTITY: Medico (Tabla: medicos - Especialista)
        // =====================================================================
        var medico = crearClase(
            paquete,
            "Medico",
            "Profesional de salud especialista que atiende la consulta medica (Tabla: medicos)."
        );
        agregarAtributo(medico, "biografia", "string", "Private");
        agregarAtributo(medico, "created_at", "timestamp", "Private");
        agregarAtributo(medico, "estado", "string", "Private");
        agregarAtributo(medico, "id_medico", "int", "Private");
        agregarAtributo(medico, "id_persona", "int", "Private");
        agregarAtributo(medico, "nro_matricula", "string", "Private");
        agregarAtributo(medico, "updated_at", "timestamp", "Private");

        agregarMetodo(medico, "find", "void", "Public");
        agregarMetodo(medico, "where", "void", "Public");

        // =====================================================================
        // 10. ENTITY: Especialidad (Tabla: especialidades)
        // =====================================================================
        var especialidad = crearClase(
            paquete,
            "Especialidad",
            "Disciplina medica bajo la cual se pacta la atencion del turno clinico (Tabla: especialidades)."
        );
        agregarAtributo(especialidad, "created_at", "timestamp", "Private");
        agregarAtributo(especialidad, "descripcion", "string", "Private");
        agregarAtributo(especialidad, "duracion_turno_minutos", "int", "Private");
        agregarAtributo(especialidad, "estado", "string", "Private");
        agregarAtributo(especialidad, "id_especialidad", "int", "Private");
        agregarAtributo(especialidad, "nombre", "string", "Private");
        agregarAtributo(especialidad, "nombre_normalizado", "string", "Private");
        agregarAtributo(especialidad, "reservable_en_linea", "boolean", "Private");
        agregarAtributo(especialidad, "updated_at", "timestamp", "Private");

        agregarMetodo(especialidad, "find", "void", "Public");
        agregarMetodo(especialidad, "where", "void", "Public");

        // =====================================================================
        // ASOCIACIONES Y MULTIPLICIDADES
        // =====================================================================
        // Actor -> UI
        crearAsociacion(actor, ui, "", "", "");

        // UI -> Controlador
        crearAsociacion(ui, controlador, "", "", "");

        // Controlador -> Usuario (operador en sesion)
        crearAsociacion(controlador, usuario, "", "", "");

        // Usuario -> BitacoraAuditoria (1 a 0..*, label: 'genera traza')
        crearAsociacion(usuario, bitacora, "1", "0..*", "genera traza");

        // Controlador -> Paciente (1 a 1, label: 'identifica paciente')
        crearAsociacion(controlador, paciente, "1", "1", "identifica paciente");

        // Paciente -> Cita (1 a 0..*, label: 'titular de')
        crearAsociacion(paciente, cita, "1", "0..*", "titular de");

        // Cita -> PagoCita (1 a 0..1, label: 'garantizada por')
        crearAsociacion(cita, pagoCita, "1", "0..1", "garantizada por");

        // Cita -> Medico (0..* a 1, label: 'atendida por')
        crearAsociacion(cita, medico, "0..*", "1", "atendida por");

        // Medico -> Especialidad (0..* a 1..*, label: 'atiende en')
        crearAsociacion(medico, especialidad, "0..*", "1..*", "atiende en");

        // =====================================================================
        // POSICIONAMIENTO EN EL DIAGRAMA (Topologia limpia ortogonal en 3 niveles)
        // =====================================================================
        // Nivel 1 (Superior - Seguridad, Auditoria y Pago de Garantia):
        // Usuario (Arriba de Controlador)
        colocar(diagrama, usuario,             420,  670,   50, 270);

        // BitacoraAuditoria (Arriba de Paciente, a la derecha de Usuario)
        colocar(diagrama, bitacora,            740,  990,   50, 270);

        // PagoCita (Arriba de Cita, a la derecha de BitacoraAuditoria)
        colocar(diagrama, pagoCita,           1060, 1310,   50, 270);

        // Nivel 2 (Principal - Cadena de Reserva y Gestion):
        // Actor (Extremo izquierdo)
        colocar(diagrama, actor,                30,  110,  340, 470);

        // UI_GestionCitas (Entre Actor y Controlador)
        colocar(diagrama, ui,                  150,  360,  320, 520);

        // GestionarCitasControlador (Centro-Izquierda)
        colocar(diagrama, controlador,         420,  670,  340, 500);

        // Paciente (Centro: titular de la reserva)
        colocar(diagrama, paciente,            740,  990,  340, 570);

        // Cita (Centro-Derecha: entidad central)
        colocar(diagrama, cita,               1060, 1310,  320, 620);

        // Medico (Derecha: profesional asignado)
        colocar(diagrama, medico,             1380, 1630,  330, 580);

        // Nivel 3 (Inferior - Disciplina Medica):
        // Especialidad (Directamente debajo de Medico)
        colocar(diagrama, especialidad,       1380, 1630,  670, 930);

        diagrama.DiagramObjects.Refresh();
        diagrama.DiagramLinks.Refresh();
        guardar(diagrama, "el diagrama terminado");

        Repository.RefreshModelView(paquete.PackageID);
        Repository.OpenDiagram(diagrama.DiagramID);

        Repository.WriteOutput("Script", "Diagrama CU12 generado con exito total.", 0);
        Session.Prompt("Diagrama de Clases de Analisis del CU12 generado correctamente.", PROMPT_OK);

    } catch (e) {
        Repository.WriteOutput("Script", "ERROR: " + e.message, 0);
        Session.Prompt("Error al generar el diagrama: " + e.message, PROMPT_OK);
    }
}

main();
