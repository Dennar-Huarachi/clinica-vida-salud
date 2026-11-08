!INC Local Scripts.EAConstants-JScript

/*
 * =================================================================================================
 * Sparx Enterprise Architect - JScript
 * Diagrama de Clases de Análisis (VOPC / BCE / Robustez): CU10 - Consultar disponibilidad
 * Contexto: Proyecto "Clínica Vida Salud" (Laravel 11 + PostgreSQL 16)
 *
 * Enfoque: Tablas principales e indispensables del caso de uso según requerimiento expreso.
 *
 * Componentes del diagrama:
 *  - Actor: Paciente / Recepcionista (Usuario que consulta turnos libres para agendamiento clínico)
 *  - Boundary: UI_ConsultarDisponibilidad (SelectorDisponibilidadTurnos.jsx con calendario interactivo)
 *  - Control: ConsultarDisponibilidadControlador (Controlador Laravel del CU10 que orquesta el algoritmo)
 *  - Entity: BloqueoClinica (Tabla DB: bloqueos_clinica - feriados y cierres institucionales RN20)
 *  - Entity: SuspensionHorario (Tabla DB: suspensiones_horario - ausencias y suspensiones médicas RN17)
 *  - Entity: HorarioAtencion (Tabla DB: horarios_atencion - plantilla recurrente por médico, día e intervalo)
 *  - Entity: Cita (Tabla DB: citas - citas agendadas activas que restan disponibilidad)
 *  - Entity: Medico (Tabla DB: medicos - profesional consultado)
 *  - Entity: Especialidad (Tabla DB: especialidades - validación de canal reservable en línea RN18)
 * =================================================================================================
 */

var PACKAGE_NAME = "CU10 - Clases de análisis";
var DIAGRAM_NAME = "CU10 Consultar disponibilidad";

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
    Repository.WriteOutput("Script", "=== Generando Diagrama de Clases de Analisis: CU10 Consultar disponibilidad ===", 0);

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
        paquete.Notes = "Diagrama de clases de analisis del Caso de Uso 10 (Consultar disponibilidad) centrado en tablas principales e indispensables.";
        guardar(paquete, "el paquete CU10");
        padre.Packages.Refresh();

        // Diagrama de tipo "Logical" (UML Class Diagram en Enterprise Architect)
        var diagrama = paquete.Diagrams.AddNew(DIAGRAM_NAME, "Logical");
        guardar(diagrama, "el diagrama de clases CU10");
        paquete.Diagrams.Refresh();

        // =====================================================================
        // 1. ACTOR
        // =====================================================================
        var actor = crearActor(
            paquete,
            "Paciente / Recepcionista",
            "Usuario solicitante (paciente via web o recepcionista en ventanilla) que consulta la disponibilidad de turnos libres para agendamiento clinico."
        );

        // =====================================================================
        // 2. BOUNDARY (Interfaz de Usuario)
        // =====================================================================
        var ui = crearClase(
            paquete,
            "UI_ConsultarDisponibilidad",
            "Componente de consulta y seleccion de disponibilidad (SelectorDisponibilidadTurnos.jsx) con calendario interactivo y descarte visual de horarios bloqueados."
        );
        agregarMetodo(ui, "consultarTurnosLibres", "void", "Public");
        agregarMetodo(ui, "desplegarCalendarioDisponibilidad", "void", "Public");
        agregarMetodo(ui, "mostrarAlertaBloqueoInstitucional", "void", "Public");
        agregarMetodo(ui, "mostrarAlertaSuspensionMedica", "void", "Public");
        agregarMetodo(ui, "seleccionarFecha", "void", "Public");
        agregarMetodo(ui, "seleccionarMedicoEspecialidad", "void", "Public");
        agregarMetodo(ui, "seleccionarTurno", "void", "Public");

        // =====================================================================
        // 3. CONTROL (Controlador Laravel)
        // =====================================================================
        var controlador = crearClase(
            paquete,
            "ConsultarDisponibilidadControlador",
            "Controlador Laravel del CU10 que coordina el algoritmo de generacion de turnos, cruce con bloqueos feriados (RN20), suspensiones (RN17) y citas agendadas."
        );
        agregarMetodo(controlador, "consultar", "JsonResponse", "Public");

        // =====================================================================
        // 4. ENTITY: BloqueoClinica (Tabla: bloqueos_clinica - RN20)
        // =====================================================================
        var bloqueo = crearClase(
            paquete,
            "BloqueoClinica",
            "Feriados nacionales y cierres institucionales programados de la clinica que invalidan turnos automaticamente (Tabla: bloqueos_clinica)."
        );
        agregarAtributo(bloqueo, "aplica_a_todos", "boolean", "Private");
        agregarAtributo(bloqueo, "created_at", "timestamp", "Private");
        agregarAtributo(bloqueo, "estado", "string", "Private");
        agregarAtributo(bloqueo, "fecha_fin", "timestamp", "Private");
        agregarAtributo(bloqueo, "fecha_inicio", "timestamp", "Private");
        agregarAtributo(bloqueo, "id_bloqueo", "int", "Private");
        agregarAtributo(bloqueo, "id_medico", "int", "Private");
        agregarAtributo(bloqueo, "motivo", "string", "Private");
        agregarAtributo(bloqueo, "titulo", "string", "Private");
        agregarAtributo(bloqueo, "updated_at", "timestamp", "Private");

        agregarMetodo(bloqueo, "first", "void", "Public");
        agregarMetodo(bloqueo, "where", "void", "Public");

        // =====================================================================
        // 5. ENTITY: SuspensionHorario (Tabla: suspensiones_horario - RN17 / CU-11)
        // =====================================================================
        var suspension = crearClase(
            paquete,
            "SuspensionHorario",
            "Permisos, licencias o ausencias temporales programadas del medico que cancelan turnos en la fecha consultada (Tabla: suspensiones_horario)."
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
        agregarMetodo(suspension, "where", "void", "Public");

        // =====================================================================
        // 6. ENTITY: HorarioAtencion (Tabla: horarios_atencion - Plantilla base)
        // =====================================================================
        var horario = crearClase(
            paquete,
            "HorarioAtencion",
            "Plantilla recurrente de atencion segun dia de la semana, intervalo y horas de inicio/fin (Tabla: horarios_atencion)."
        );
        agregarAtributo(horario, "created_at", "timestamp", "Private");
        agregarAtributo(horario, "dia_semana", "int", "Private");
        agregarAtributo(horario, "duracion_intervalo_minutos", "int", "Private");
        agregarAtributo(horario, "estado", "string", "Private");
        agregarAtributo(horario, "hora_fin", "time", "Private");
        agregarAtributo(horario, "hora_inicio", "time", "Private");
        agregarAtributo(horario, "id_especialidad", "int", "Private");
        agregarAtributo(horario, "id_horario", "int", "Private");
        agregarAtributo(horario, "id_medico", "int", "Private");
        agregarAtributo(horario, "updated_at", "timestamp", "Private");

        agregarMetodo(horario, "get", "void", "Public");
        agregarMetodo(horario, "where", "void", "Public");

        // =====================================================================
        // 7. ENTITY: Cita (Tabla: citas - Descarte de turnos ocupados)
        // =====================================================================
        var cita = crearClase(
            paquete,
            "Cita",
            "Citas agendadas activas que ocupan los intervalos horarios del dia consultado restando disponibilidad (Tabla: citas)."
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
        agregarMetodo(cita, "where", "void", "Public");

        // =====================================================================
        // 8. ENTITY: Medico (Tabla: medicos - Sujeto de consulta)
        // =====================================================================
        var medico = crearClase(
            paquete,
            "Medico",
            "Profesional de la salud consultado cuya disponibilidad de turnos se computa dinamicamente (Tabla: medicos)."
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
        // 9. ENTITY: Especialidad (Tabla: especialidades - RN18)
        // =====================================================================
        var especialidad = crearClase(
            paquete,
            "Especialidad",
            "Especialidad requerida verificando habilitacion para reserva web y duracion estandar de turno (Tabla: especialidades)."
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

        agregarMetodo(especialidad, "first", "void", "Public");
        agregarMetodo(especialidad, "where", "void", "Public");

        // =====================================================================
        // ASOCIACIONES Y MULTIPLICIDADES
        // =====================================================================
        // Actor -> UI
        crearAsociacion(actor, ui, "", "", "");

        // UI -> Controlador
        crearAsociacion(ui, controlador, "", "", "");

        // Controlador -> BloqueoClinica (1 a 0..*, label: 'verifica feriado institucional')
        crearAsociacion(controlador, bloqueo, "1", "0..*", "verifica feriado institucional");

        // Controlador -> HorarioAtencion (1 a 1..*, label: 'obtiene franjas base')
        crearAsociacion(controlador, horario, "1", "1..*", "obtiene franjas base");

        // HorarioAtencion -> SuspensionHorario (1 a 0..*, label: 'evalua suspension medica')
        crearAsociacion(horario, suspension, "1", "0..*", "evalua suspension medica");

        // HorarioAtencion -> Cita (1 a 0..*, label: 'descarta turnos ocupados')
        crearAsociacion(horario, cita, "1", "0..*", "descarta turnos ocupados");

        // HorarioAtencion -> Medico (0..* a 1, label: 'asignado a')
        crearAsociacion(horario, medico, "0..*", "1", "asignado a");

        // Medico -> Especialidad (0..* a 1..*, label: 'atiende en')
        crearAsociacion(medico, especialidad, "0..*", "1..*", "atiende en");

        // =====================================================================
        // POSICIONAMIENTO EN EL DIAGRAMA (Topologia limpia ortogonal en 3 niveles)
        // =====================================================================
        // Nivel 1 (Superior - Reglas y Restricciones):
        // BloqueoClinica (Arriba del Controlador)
        colocar(diagrama, bloqueo,             420,  670,   50, 270);

        // SuspensionHorario (Arriba de HorarioAtencion)
        colocar(diagrama, suspension,          740,  990,   50, 270);

        // Especialidad (Arriba de Medico)
        colocar(diagrama, especialidad,       1060, 1310,   50, 270);

        // Nivel 2 (Principal - Flujo de Generacion de Turnos):
        // Actor (Extremo izquierdo)
        colocar(diagrama, actor,                30,  110,  340, 470);

        // UI_ConsultarDisponibilidad (Entre Actor y Controlador)
        colocar(diagrama, ui,                  150,  360,  320, 520);

        // ConsultarDisponibilidadControlador (Centro-Izquierda)
        colocar(diagrama, controlador,         420,  670,  340, 480);

        // HorarioAtencion (Centro: entidad base)
        colocar(diagrama, horario,             740,  990,  320, 620);

        // Medico (Centro-Derecha, a la derecha de HorarioAtencion)
        colocar(diagrama, medico,             1060, 1310,  330, 580);

        // Nivel 3 (Inferior - Citas Ocupadas que restan disponibilidad):
        // Cita (Directamente debajo de HorarioAtencion)
        colocar(diagrama, cita,                740,  990,  690, 970);

        diagrama.DiagramObjects.Refresh();
        diagrama.DiagramLinks.Refresh();
        guardar(diagrama, "el diagrama terminado");

        Repository.RefreshModelView(paquete.PackageID);
        Repository.OpenDiagram(diagrama.DiagramID);

        Repository.WriteOutput("Script", "Diagrama CU10 generado con exito total.", 0);
        Session.Prompt("Diagrama de Clases de Analisis del CU10 generado correctamente.", PROMPT_OK);

    } catch (e) {
        Repository.WriteOutput("Script", "ERROR: " + e.message, 0);
        Session.Prompt("Error al generar el diagrama: " + e.message, PROMPT_OK);
    }
}

main();
