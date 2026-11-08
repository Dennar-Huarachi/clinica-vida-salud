!INC Local Scripts.EAConstants-JScript

/*
 * =================================================================================================
 * Sparx Enterprise Architect - JScript
 * Diagrama de Clases de Análisis (VOPC / BCE / Robustez): CU09 - Gestionar horarios de atención
 * Contexto: Proyecto "Clínica Vida Salud" (Laravel 11 + PostgreSQL 16)
 *
 * Enfoque: Tablas principales e indispensables del caso de uso según requerimiento expreso.
 *
 * Componentes del diagrama:
 *  - Actor: Administrador (Personal encargado de parametrizar las franjas y turnos de atención)
 *  - Boundary: UI_GestionHorariosAtencion (PaginaHorarios.jsx, ModalHorario.jsx con calendario y filtros)
 *  - Control: GestionarHorariosAtencionControlador (Controlador Laravel del CU09 que orquesta el servicio)
 *  - Entity: Usuario (Tabla DB: usuarios - operador administrativo autenticado)
 *  - Entity: BitacoraAuditoria (Tabla DB: bitacora_auditoria - registro inmutable de trazabilidad RN21)
 *  - Entity: HorarioAtencion (Tabla DB: horarios_atencion - franja médica por día, horas e intervalo)
 *  - Entity: Medico (Tabla DB: medicos - profesional asignado al bloque de atención)
 *  - Entity: Especialidad (Tabla DB: especialidades - especialidad ejercida en la franja)
 * =================================================================================================
 */

var PACKAGE_NAME = "CU09 - Clases de análisis";
var DIAGRAM_NAME = "CU09 Gestionar horarios de atencion";

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
    Repository.WriteOutput("Script", "=== Generando Diagrama de Clases de Analisis: CU09 Gestionar horarios de atencion ===", 0);

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
        paquete.Notes = "Diagrama de clases de analisis del Caso de Uso 9 (Gestionar horarios de atencion) centrado en tablas principales e indispensables.";
        guardar(paquete, "el paquete CU09");
        padre.Packages.Refresh();

        // Diagrama de tipo "Logical" (UML Class Diagram en Enterprise Architect)
        var diagrama = paquete.Diagrams.AddNew(DIAGRAM_NAME, "Logical");
        guardar(diagrama, "el diagrama de clases CU09");
        paquete.Diagrams.Refresh();

        // =====================================================================
        // 1. ACTOR
        // =====================================================================
        var actor = crearActor(
            paquete,
            "Administrador",
            "Personal con privilegios de direccion y gestion clinica encargado de configurar la disponibilidad horaria semanal del cuerpo medico."
        );

        // =====================================================================
        // 2. BOUNDARY (Interfaz de Usuario)
        // =====================================================================
        var ui = crearClase(
            paquete,
            "UI_GestionHorariosAtencion",
            "Interfaz web del CU09 (PaginaHorarios.jsx, ModalHorario.jsx) con calendario semanal, filtros por medico/especialidad y alertas de solapamiento."
        );
        agregarMetodo(ui, "actualizarHorario", "void", "Public");
        agregarMetodo(ui, "alternarEstadoLogico", "void", "Public");
        agregarMetodo(ui, "calcularTurnosFranja", "void", "Public");
        agregarMetodo(ui, "configurarMultiplesDias", "void", "Public");
        agregarMetodo(ui, "filtrarPorMedicoEspecialidad", "void", "Public");
        agregarMetodo(ui, "ingresarHorario", "void", "Public");
        agregarMetodo(ui, "mostrarAgendaSemanal", "void", "Public");
        agregarMetodo(ui, "mostrarAlertaSolapamiento", "void", "Public");

        // =====================================================================
        // 3. CONTROL (Controlador Laravel)
        // =====================================================================
        var controlador = crearClase(
            paquete,
            "GestionarHorariosAtencionControlador",
            "Controlador Laravel del CU09 que orquesta la creacion (individual o multi-dia), actualizacion, listado y alternancia de estado validando reglas RN05 y RN07."
        );
        agregarMetodo(controlador, "alternarEstado", "JsonResponse", "Public");
        agregarMetodo(controlador, "index", "JsonResponse", "Public");
        agregarMetodo(controlador, "store", "JsonResponse", "Public");
        agregarMetodo(controlador, "update", "JsonResponse", "Public");

        // =====================================================================
        // 4. ENTITY: Usuario (Tabla: usuarios - Operador administrativo)
        // =====================================================================
        var usuario = crearClase(
            paquete,
            "Usuario",
            "Cuenta del administrador autenticado que ejecuta la configuracion de horarios de atencion (Tabla: usuarios)."
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
            "Registro inmutable de trazabilidad para eventos: CREAR_HORARIO_ATENCION, ACTUALIZAR_HORARIO_ATENCION y CAMBIAR_ESTADO_HORARIO_ATENCION (Tabla: bitacora_auditoria)."
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
        // 6. ENTITY: HorarioAtencion (Tabla: horarios_atencion - Entidad Central)
        // =====================================================================
        var horario = crearClase(
            paquete,
            "HorarioAtencion",
            "Franja horaria medica recurrente definida por dia de la semana, intervalo de atencion, horas de inicio y fin (Tabla: horarios_atencion)."
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

        agregarMetodo(horario, "create", "void", "Public");
        agregarMetodo(horario, "find", "void", "Public");
        agregarMetodo(horario, "insertGetId", "void", "Public");
        agregarMetodo(horario, "update", "void", "Public");
        agregarMetodo(horario, "where", "void", "Public");

        // =====================================================================
        // 7. ENTITY: Medico (Tabla: medicos - Profesional asignado)
        // =====================================================================
        var medico = crearClase(
            paquete,
            "Medico",
            "Profesional de salud al cual se le asigna la disponibilidad horaria y turnos de consulta (Tabla: medicos)."
        );
        agregarAtributo(medico, "biografia", "string", "Private");
        agregarAtributo(medico, "created_at", "timestamp", "Private");
        agregarAtributo(medico, "estado", "string", "Private");
        agregarAtributo(medico, "id_medico", "int", "Private");
        agregarAtributo(medico, "id_persona", "int", "Private");
        agregarAtributo(medico, "nro_matricula", "string", "Private");
        agregarAtributo(medico, "updated_at", "timestamp", "Private");

        agregarMetodo(medico, "create", "void", "Public");
        agregarMetodo(medico, "find", "void", "Public");
        agregarMetodo(medico, "update", "void", "Public");
        agregarMetodo(medico, "where", "void", "Public");

        // =====================================================================
        // 8. ENTITY: Especialidad (Tabla: especialidades - Disciplina atendida)
        // =====================================================================
        var especialidad = crearClase(
            paquete,
            "Especialidad",
            "Especialidad medica bajo la cual se prestara la atencion durante el bloque de horario configurado (Tabla: especialidades)."
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

        agregarMetodo(especialidad, "create", "void", "Public");
        agregarMetodo(especialidad, "find", "void", "Public");
        agregarMetodo(especialidad, "where", "void", "Public");

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

        // Controlador -> HorarioAtencion (persistencia y validacion)
        crearAsociacion(controlador, horario, "", "", "");

        // HorarioAtencion -> Medico (0..* a 1, label: 'asignado a')
        crearAsociacion(horario, medico, "0..*", "1", "asignado a");

        // HorarioAtencion -> Especialidad (0..* a 1, label: 'corresponde a')
        crearAsociacion(horario, especialidad, "0..*", "1", "corresponde a");

        // =====================================================================
        // POSICIONAMIENTO EN EL DIAGRAMA (Topologia limpia ortogonal en 3 niveles)
        // =====================================================================
        // Nivel 1 (Superior - Seguridad y Auditoria):
        // Usuario (Arriba de Controlador)
        colocar(diagrama, usuario,             420,  670,   50, 270);

        // BitacoraAuditoria (Arriba de HorarioAtencion, a la derecha de Usuario)
        colocar(diagrama, bitacora,            740,  990,   50, 270);

        // Nivel 2 (Principal - Eje de Gestion de Horarios):
        // Actor (Extremo izquierdo)
        colocar(diagrama, actor,                30,  110,  340, 470);

        // UI_GestionHorariosAtencion (Entre Actor y Controlador)
        colocar(diagrama, ui,                  150,  360,  320, 520);

        // GestionarHorariosAtencionControlador (Centro-Izquierda)
        colocar(diagrama, controlador,         420,  670,  340, 500);

        // HorarioAtencion (Centro: entidad central)
        colocar(diagrama, horario,             740,  990,  320, 620);

        // Medico (Centro-Derecha, a la derecha de HorarioAtencion)
        colocar(diagrama, medico,             1060, 1310,  330, 580);

        // Nivel 3 (Inferior - Especialidad):
        // Especialidad (Directamente debajo de HorarioAtencion)
        colocar(diagrama, especialidad,        740,  990,  690, 950);

        diagrama.DiagramObjects.Refresh();
        diagrama.DiagramLinks.Refresh();
        guardar(diagrama, "el diagrama terminado");

        Repository.RefreshModelView(paquete.PackageID);
        Repository.OpenDiagram(diagrama.DiagramID);

        Repository.WriteOutput("Script", "Diagrama CU09 generado con exito total.", 0);
        Session.Prompt("Diagrama de Clases de Analisis del CU09 generado correctamente.", PROMPT_OK);

    } catch (e) {
        Repository.WriteOutput("Script", "ERROR: " + e.message, 0);
        Session.Prompt("Error al generar el diagrama: " + e.message, PROMPT_OK);
    }
}

main();
