!INC Local Scripts.EAConstants-JScript

/*
 * =================================================================================================
 * Sparx Enterprise Architect - JScript
 * Diagrama de Clases de Análisis (VOPC / BCE / Robustez): CU11 - Suspender horario y gestionar citas afectadas
 * Contexto: Proyecto "Clínica Vida Salud" (Laravel 11 + PostgreSQL 16)
 *
 * Enfoque: Tablas principales e indispensables del caso de uso según requerimiento expreso.
 *
 * Componentes del diagrama:
 *  - Actor: Médico / Administrador (Usuario facultado para registrar licencias o contingencias)
 *  - Boundary: UI_SuspenderHorario (PaginaSuspensiones.jsx con vista de citas y modal de reubicación)
 *  - Control: SuspenderHorarioControlador (Controlador Laravel del CU11 que orquesta el servicio)
 *  - Entity: Usuario (Tabla DB: usuarios - operador autenticado que emite la suspensión)
 *  - Entity: BitacoraAuditoria (Tabla DB: bitacora_auditoria - registro inmutable RN21)
 *  - Entity: SuspensionHorario (Tabla DB: suspensiones_horario - registro formal de la ausencia)
 *  - Entity: Medico (Tabla DB: medicos - médico titular del horario suspendido)
 *  - Entity: Cita (Tabla DB: citas - citas programadas impactadas marcadas como postergadas RN17)
 *  - Entity: Notificacion (Tabla DB: notificaciones - avisos urgentes emitidos a los pacientes)
 * =================================================================================================
 */

var PACKAGE_NAME = "CU11 - Clases de análisis";
var DIAGRAM_NAME = "CU11 Suspender horario y gestionar citas afectadas";

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
    Repository.WriteOutput("Script", "=== Generando Diagrama de Clases de Analisis: CU11 Suspender horario y gestionar citas afectadas ===", 0);

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
        paquete.Notes = "Diagrama de clases de analisis del Caso de Uso 11 (Suspender horario y gestionar citas afectadas) centrado en tablas principales e indispensables.";
        guardar(paquete, "el paquete CU11");
        padre.Packages.Refresh();

        // Diagrama de tipo "Logical" (UML Class Diagram en Enterprise Architect)
        var diagrama = paquete.Diagrams.AddNew(DIAGRAM_NAME, "Logical");
        guardar(diagrama, "el diagrama de clases CU11");
        paquete.Diagrams.Refresh();

        // =====================================================================
        // 1. ACTOR
        // =====================================================================
        var actor = crearActor(
            paquete,
            "Médico / Administrador",
            "Profesional de la salud o supervisor facultado para registrar licencias, permisos o contingencias de agenda medica."
        );

        // =====================================================================
        // 2. BOUNDARY (Interfaz de Usuario)
        // =====================================================================
        var ui = crearClase(
            paquete,
            "UI_SuspenderHorario",
            "Modulo de suspensiones medicas (PaginaSuspensiones.jsx) que previsualiza citas afectadas, captura el motivo y reporta la reubicacion."
        );
        agregarMetodo(ui, "abrirModalReubicar", "void", "Public");
        agregarMetodo(ui, "cargarDatos", "void", "Public");
        agregarMetodo(ui, "confirmarReubicacion", "void", "Public");
        agregarMetodo(ui, "guardarSuspension", "void", "Public");
        agregarMetodo(ui, "levantarSuspension", "void", "Public");
        agregarMetodo(ui, "mostrarCitasPostergadas", "void", "Public");
        agregarMetodo(ui, "mostrarHistorialSuspensiones", "void", "Public");

        // =====================================================================
        // 3. CONTROL (Controlador Laravel)
        // =====================================================================
        var controlador = crearClase(
            paquete,
            "SuspenderHorarioControlador",
            "Controlador Laravel del CU11 que coordina transaccionalmente el registro de la suspension, el marcado de citas postergadas y la emision de avisos."
        );
        agregarMetodo(controlador, "citasPostergadas", "JsonResponse", "Public");
        agregarMetodo(controlador, "index", "JsonResponse", "Public");
        agregarMetodo(controlador, "reubicar", "JsonResponse", "Public");
        agregarMetodo(controlador, "store", "JsonResponse", "Public");

        // =====================================================================
        // 4. ENTITY: Usuario (Tabla: usuarios - Operador autenticado)
        // =====================================================================
        var usuario = crearClase(
            paquete,
            "Usuario",
            "Cuenta del operador autenticado (medico o administrador) que registra la suspension o efectua la reubicacion (Tabla: usuarios)."
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
            "Trazabilidad inmutable de eventos: SUSPENDER_HORARIO_MEDICO y REUBICAR_CITA_POSTERGADA (Tabla: bitacora_auditoria)."
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
        // 6. ENTITY: SuspensionHorario (Tabla: suspensiones_horario - Entidad Central)
        // =====================================================================
        var suspension = crearClase(
            paquete,
            "SuspensionHorario",
            "Registro formal de suspension temporal de atencion con motivo, rango de fechas y accion sobre citas (Tabla: suspensiones_horario)."
        );
        agregarAtributo(suspension, "created_at", "timestamp", "Private");
        agregarAtributo(suspension, "estado_citas_accion", "string", "Private");
        agregarAtributo(suspension, "fecha_fin", "timestamp", "Private");
        agregarAtributo(suspension, "fecha_inicio", "timestamp", "Private");
        agregarAtributo(suspension, "id_medico", "int", "Private");
        agregarAtributo(suspension, "id_suspension", "int", "Private");
        agregarAtributo(suspension, "motivo", "string", "Private");
        agregarAtributo(suspension, "updated_at", "timestamp", "Private");

        agregarMetodo(suspension, "get", "void", "Public");
        agregarMetodo(suspension, "insertGetId", "void", "Public");
        agregarMetodo(suspension, "where", "void", "Public");

        // =====================================================================
        // 7. ENTITY: Medico (Tabla: medicos - Titular de la suspension)
        // =====================================================================
        var medico = crearClase(
            paquete,
            "Medico",
            "Medico titular cuya jornada queda inhabilitada en el rango temporal indicado (Tabla: medicos)."
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
        // 8. ENTITY: Cita (Tabla: citas - Citas afectadas y reubicadas)
        // =====================================================================
        var cita = crearClase(
            paquete,
            "Cita",
            "Citas agendadas impactadas por la suspension, actualizadas a estado postergada con ventana prioritaria de 48h (Tabla: citas)."
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
        agregarAtributo(cita, "motivo_consulta", "string", "Private");
        agregarAtributo(cita, "observaciones", "string", "Private");
        agregarAtributo(cita, "updated_at", "timestamp", "Private");

        agregarMetodo(cita, "get", "void", "Public");
        agregarMetodo(cita, "update", "void", "Public");
        agregarMetodo(cita, "where", "void", "Public");

        // =====================================================================
        // 9. ENTITY: Notificacion (Tabla: notificaciones - Aviso urgente RN21)
        // =====================================================================
        var notificacion = crearClase(
            paquete,
            "Notificacion",
            "Avisos urgentes emitidos directamente a los pacientes con citas afectadas indicando motivo y plazo de prioridad de reubicacion (Tabla: notificaciones)."
        );
        agregarAtributo(notificacion, "created_at", "timestamp", "Private");
        agregarAtributo(notificacion, "fecha_leido", "timestamp", "Private");
        agregarAtributo(notificacion, "id_notificacion", "int", "Private");
        agregarAtributo(notificacion, "id_usuario", "int", "Private");
        agregarAtributo(notificacion, "leido", "boolean", "Private");
        agregarAtributo(notificacion, "mensaje", "string", "Private");
        agregarAtributo(notificacion, "metadata", "string", "Private");
        agregarAtributo(notificacion, "tipo", "string", "Private");
        agregarAtributo(notificacion, "titulo", "string", "Private");
        agregarAtributo(notificacion, "updated_at", "timestamp", "Private");

        agregarMetodo(notificacion, "create", "void", "Public");
        agregarMetodo(notificacion, "where", "void", "Public");

        // =====================================================================
        // ASOCIACIONES Y MULTIPLICIDADES
        // =====================================================================
        // Actor -> UI
        crearAsociacion(actor, ui, "", "", "");

        // UI -> Controlador
        crearAsociacion(ui, controlador, "", "", "");

        // Controlador -> Usuario (operador autenticado)
        crearAsociacion(controlador, usuario, "", "", "");

        // Usuario -> BitacoraAuditoria (1 a 0..*, label: 'genera traza')
        crearAsociacion(usuario, bitacora, "1", "0..*", "genera traza");

        // Controlador -> SuspensionHorario (1 a 1..*, label: 'registra suspension')
        crearAsociacion(controlador, suspension, "1", "1..*", "registra suspension");

        // SuspensionHorario -> Medico (0..* a 1, label: 'asociada a')
        crearAsociacion(suspension, medico, "0..*", "1", "asociada a");

        // SuspensionHorario -> Cita (1 a 0..*, label: 'identifica afectadas')
        crearAsociacion(suspension, cita, "1", "0..*", "identifica afectadas");

        // Cita -> Notificacion (1 a 0..*, label: 'emite aviso a paciente')
        crearAsociacion(cita, notificacion, "1", "0..*", "emite aviso a paciente");

        // =====================================================================
        // POSICIONAMIENTO EN EL DIAGRAMA (Topologia limpia ortogonal en 3 niveles)
        // =====================================================================
        // Nivel 1 (Superior - Seguridad, Auditoria y Notificaciones):
        // Usuario (Arriba de Controlador)
        colocar(diagrama, usuario,             420,  670,   50, 270);

        // BitacoraAuditoria (Arriba de SuspensionHorario, a la derecha de Usuario)
        colocar(diagrama, bitacora,            740,  990,   50, 270);

        // Notificacion (Arriba de Cita, a la derecha de BitacoraAuditoria)
        colocar(diagrama, notificacion,       1060, 1310,   50, 270);

        // Nivel 2 (Principal - Eje de Gestion de Suspensiones y Citas):
        // Actor (Extremo izquierdo)
        colocar(diagrama, actor,                30,  110,  340, 470);

        // UI_SuspenderHorario (Entre Actor y Controlador)
        colocar(diagrama, ui,                  150,  360,  320, 520);

        // SuspenderHorarioControlador (Centro-Izquierda)
        colocar(diagrama, controlador,         420,  670,  340, 500);

        // SuspensionHorario (Centro: entidad principal registrada)
        colocar(diagrama, suspension,          740,  990,  330, 570);

        // Cita (Centro-Derecha: citas afectadas y gestionadas)
        colocar(diagrama, cita,               1060, 1310,  320, 620);

        // Nivel 3 (Inferior - Medico Titular):
        // Medico (Directamente debajo de SuspensionHorario)
        colocar(diagrama, medico,              740,  990,  670, 920);

        diagrama.DiagramObjects.Refresh();
        diagrama.DiagramLinks.Refresh();
        guardar(diagrama, "el diagrama terminado");

        Repository.RefreshModelView(paquete.PackageID);
        Repository.OpenDiagram(diagrama.DiagramID);

        Repository.WriteOutput("Script", "Diagrama CU11 generado con exito total.", 0);
        Session.Prompt("Diagrama de Clases de Analisis del CU11 generado correctamente.", PROMPT_OK);

    } catch (e) {
        Repository.WriteOutput("Script", "ERROR: " + e.message, 0);
        Session.Prompt("Error al generar el diagrama: " + e.message, PROMPT_OK);
    }
}

main();
