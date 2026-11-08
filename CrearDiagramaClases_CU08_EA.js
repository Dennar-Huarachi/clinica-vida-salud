!INC Local Scripts.EAConstants-JScript

/*
 * =================================================================================================
 * Sparx Enterprise Architect - JScript
 * Diagrama de Clases de Analisis (VOPC / BCE / Robustez): CU08 - Gestionar medicos
 * Contexto: Proyecto "Clinica Vida Salud" (Laravel 11 + PostgreSQL)
 *
 * Enfoque: Tablas principales e indispensables del caso de uso segun requerimiento expreso.
 *
 * Componentes del diagrama:
 *  - Actor: Administrador (Personal con privilegios de gestion de profesionales y especialidades)
 *  - Boundary: UI_GestionMedicos (Pagina web PaginaMedicos.jsx con directorio, buscador y modal)
 *  - Control: GestionarMedicosControlador (Controlador Laravel del CU08 que orquesta el servicio)
 *  - Entity: Usuario (Tabla DB: usuarios - operador de sesion autenticado)
 *  - Entity: BitacoraAuditoria (Tabla DB: bitacora_auditoria - trazabilidad inmutable RN21)
 *  - Entity: Persona (Tabla DB: personas - identidad fisica y datos de contacto del medico)
 *  - Entity: Medico (Tabla DB: medicos - ficha profesional con numero de matricula y biografia)
 *  - Entity: MedicoEspecialidad (Tabla DB: medico_especialidad - tabla pivote de acreditacion)
 *  - Entity: Especialidad (Tabla DB: especialidades - catalogo de especialidades asignadas)
 * =================================================================================================
 */

var PACKAGE_NAME = "CU08 - Clases de analisis";
var DIAGRAM_NAME = "CU08 Gestionar medicos";

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

function agregarAtributo(clase, nombre, tipo, visibilidad) {
    var attr = clase.Attributes.AddNew(nombre, tipo || "string");
    attr.Visibility = visibilidad || "Private"; // Muestra '-'
    guardar(attr, "el atributo " + nombre + " de " + clase.Name);
    clase.Attributes.Refresh();
    return attr;
}

function agregarMetodo(clase, nombre, tipoRetorno, visibilidad) {
    var meth = clase.Methods.AddNew(nombre, tipoRetorno || "void");
    meth.Visibility = visibilidad || "Public"; // Muestra '+'
    meth.ReturnType = tipoRetorno || "void";
    guardar(meth, "el metodo " + nombre + " de " + clase.Name);
    clase.Methods.Refresh();
    return meth;
}

function colocar(diagrama, elemento, izquierda, derecha, arriba, abajo) {
    var posicion = "l=" + izquierda + ";r=" + derecha + ";t=" + arriba + ";b=" + abajo + ";";
    var figura = diagrama.DiagramObjects.AddNew(posicion, "");
    figura.ElementID = elemento.ElementID;
    guardar(figura, "la figura " + elemento.Name);
    diagrama.DiagramObjects.Refresh();
    return figura;
}

function crearAsociacion(origen, destino, multiplicidadOrigen, multiplicidadDestino, nombreAsociacion) {
    var conn = origen.Connectors.AddNew(nombreAsociacion || "", "Association");
    conn.SupplierID = destino.ElementID;
    conn.Direction = "Unspecified";
    if (multiplicidadOrigen && multiplicidadOrigen !== "") {
        conn.ClientEnd.Cardinality = multiplicidadOrigen;
    }
    if (multiplicidadDestino && multiplicidadDestino !== "") {
        conn.SupplierEnd.Cardinality = multiplicidadDestino;
    }
    guardar(conn, "la asociacion entre " + origen.Name + " y " + destino.Name);
    origen.Connectors.Refresh();
    return conn;
}

function main() {
    Repository.EnsureOutputVisible("Script");

    var padre = Repository.GetTreeSelectedPackage();
    if (!padre || padre.PackageID == 0) {
        Session.Prompt("Seleccione primero un paquete padre en el Project Browser.", PROMPT_OK);
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
        paquete.Notes = "Diagrama de clases de analisis del Caso de Uso 8 (Gestionar medicos) centrado en tablas principales e indispensables.";
        guardar(paquete, "el paquete CU08");
        padre.Packages.Refresh();

        // Diagrama de tipo "Logical" (UML Class Diagram en Enterprise Architect)
        var diagrama = paquete.Diagrams.AddNew(DIAGRAM_NAME, "Logical");
        guardar(diagrama, "el diagrama de clases CU08");
        paquete.Diagrams.Refresh();

        // =====================================================================
        // 1. ACTOR
        // =====================================================================
        var actor = crearActor(
            paquete,
            "Administrador",
            "Personal de direccion encargado de registrar al cuerpo medico, asignarle especialidades y administrar su estado operativo."
        );

        // =====================================================================
        // 2. BOUNDARY (Interfaz de Usuario)
        // =====================================================================
        var ui = crearClase(
            paquete,
            "UI_GestionMedicos",
            "Interfaz web del CU08 (PaginaMedicos.jsx) con directorio interactivo, filtro por especialidad, formulario modal y alerta de citas activas."
        );
        agregarMetodo(ui, "actualizarDatosMedico", "void", "Public");
        agregarMetodo(ui, "alternarEstadoLogico", "void", "Public");
        agregarMetodo(ui, "asignarEspecialidades", "void", "Public");
        agregarMetodo(ui, "filtrarPorEspecialidad", "void", "Public");
        agregarMetodo(ui, "ingresarDatosMedico", "void", "Public");
        agregarMetodo(ui, "mostrarAlertaCitasPendientes", "void", "Public");
        agregarMetodo(ui, "mostrarDirectorioMedicos", "void", "Public");

        // =====================================================================
        // 3. CONTROL (Controlador Laravel)
        // =====================================================================
        var controlador = crearClase(
            paquete,
            "GestionarMedicosControlador",
            "Controlador Laravel del CU08 que gestiona el padron medico y la vinculacion de especialidades mediante GestionarMedicosServicio."
        );
        agregarMetodo(controlador, "alternarEstado", "JsonResponse", "Public");
        agregarMetodo(controlador, "index", "JsonResponse", "Public");
        agregarMetodo(controlador, "store", "JsonResponse", "Public");
        agregarMetodo(controlador, "update", "JsonResponse", "Public");

        // =====================================================================
        // 4. ENTITY: Usuario (Tabla: usuarios - Operador de sesion)
        // =====================================================================
        var usuario = crearClase(
            paquete,
            "Usuario",
            "Cuenta del administrador que ejecuta el registro y la modificacion del cuerpo medico (Tabla: usuarios)."
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
            "Registro inmutable de trazabilidad para eventos: CREAR_MEDICO, ACTUALIZAR_MEDICO y CAMBIAR_ESTADO_MEDICO (Tabla: bitacora_auditoria)."
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
        // 6. ENTITY: Persona (Tabla: personas - Datos biograficos y contacto)
        // =====================================================================
        var persona = crearClase(
            paquete,
            "Persona",
            "Datos personales del profesional de la salud: CI, nombres, apellidos, correo, telefono y direccion (Tabla: personas)."
        );
        agregarAtributo(persona, "apellidos", "string", "Private");
        agregarAtributo(persona, "ci", "string", "Private");
        agregarAtributo(persona, "correo", "string", "Private");
        agregarAtributo(persona, "created_at", "timestamp", "Private");
        agregarAtributo(persona, "direccion", "string", "Private");
        agregarAtributo(persona, "fecha_nacimiento", "date", "Private");
        agregarAtributo(persona, "id_persona", "int", "Private");
        agregarAtributo(persona, "nombres", "string", "Private");
        agregarAtributo(persona, "sexo", "string", "Private");
        agregarAtributo(persona, "telefono", "string", "Private");
        agregarAtributo(persona, "updated_at", "timestamp", "Private");

        agregarMetodo(persona, "create", "void", "Public");
        agregarMetodo(persona, "find", "void", "Public");
        agregarMetodo(persona, "update", "void", "Public");
        agregarMetodo(persona, "where", "void", "Public");

        // =====================================================================
        // 7. ENTITY: Medico (Tabla: medicos - Entidad profesional central)
        // =====================================================================
        var medico = crearClase(
            paquete,
            "Medico",
            "Ficha profesional del medico con numero de matricula profesional unico, biografia y estado activo/inactivo (Tabla: medicos)."
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
        // 8. ENTITY: MedicoEspecialidad (Tabla: medico_especialidad - Pivote de asignacion)
        // =====================================================================
        var medicoEspecialidad = crearClase(
            paquete,
            "MedicoEspecialidad",
            "Tabla de asignacion asociativa muchos a muchos que acredita al medico en una o varias especialidades (Tabla: medico_especialidad)."
        );
        agregarAtributo(medicoEspecialidad, "created_at", "timestamp", "Private");
        agregarAtributo(medicoEspecialidad, "id_especialidad", "int", "Private");
        agregarAtributo(medicoEspecialidad, "id_medico", "int", "Private");
        agregarAtributo(medicoEspecialidad, "id_medico_especialidad", "int", "Private");
        agregarAtributo(medicoEspecialidad, "updated_at", "timestamp", "Private");

        agregarMetodo(medicoEspecialidad, "create", "void", "Public");
        agregarMetodo(medicoEspecialidad, "delete", "void", "Public");
        agregarMetodo(medicoEspecialidad, "where", "void", "Public");

        // =====================================================================
        // 9. ENTITY: Especialidad (Tabla: especialidades - Catalogo asignable)
        // =====================================================================
        var especialidad = crearClase(
            paquete,
            "Especialidad",
            "Catalogo institucional de especialidades medicas acreditadas al cuerpo profesional (Tabla: especialidades)."
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
        // ASOCIACIONES Y MULTIPLICIDADES SEGUN EL MODELO DE DATOS
        // =====================================================================
        // Actor -> UI
        crearAsociacion(actor, ui, "", "", "");

        // UI -> Controlador
        crearAsociacion(ui, controlador, "", "", "");

        // Controlador -> Usuario (operador autenticado)
        crearAsociacion(controlador, usuario, "", "", "");

        // Controlador -> Persona (transaccion de filiacion civil)
        crearAsociacion(controlador, persona, "", "", "");

        // Usuario -> BitacoraAuditoria (1 a 0..*, label: 'genera traza')
        crearAsociacion(usuario, bitacora, "1", "0..*", "genera traza");

        // Persona -> Medico (1 a 0..1, label: 'ejerce como')
        crearAsociacion(persona, medico, "1", "0..1", "ejerce como");

        // Medico -> MedicoEspecialidad (1 a 1..*, label: 'acreditado en')
        crearAsociacion(medico, medicoEspecialidad, "1", "1..*", "acreditado en");

        // MedicoEspecialidad -> Especialidad (0..* a 1, label: 'corresponde a')
        crearAsociacion(medicoEspecialidad, especialidad, "0..*", "1", "corresponde a");

        // =====================================================================
        // POSICIONAMIENTO EN EL DIAGRAMA (Topologia limpia ortogonal en 3 niveles)
        // =====================================================================
        // Nivel 1 (Superior - Seguridad y Auditoria):
        // Usuario (Arriba de Controlador)
        colocar(diagrama, usuario,             420,  670,   50, 260);

        // BitacoraAuditoria (Arriba de Persona, derecha de Usuario)
        colocar(diagrama, bitacora,            740,  990,   50, 270);

        // Nivel 2 (Principal - Eje de Gestion Medica):
        // Actor (Extremo izquierdo)
        colocar(diagrama, actor,                30,  110,  340, 470);

        // UI_GestionMedicos (Entre Actor y Controlador)
        colocar(diagrama, ui,                  150,  360,  320, 500);

        // GestionarMedicosControlador (Centro-Izquierda)
        colocar(diagrama, controlador,         420,  670,  340, 480);

        // Persona (Centro)
        colocar(diagrama, persona,             740,  990,  310, 620);

        // Medico (Centro-Derecha)
        colocar(diagrama, medico,             1060, 1310,  330, 580);

        // Nivel 3 (Inferior - Acreditacion de Especialidades):
        // MedicoEspecialidad (Debajo de Medico)
        colocar(diagrama, medicoEspecialidad, 1060, 1310,  670, 860);

        // Especialidad (A la derecha de MedicoEspecialidad)
        colocar(diagrama, especialidad,       1380, 1630,  650, 930);

        diagrama.DiagramObjects.Refresh();
        diagrama.DiagramLinks.Refresh();
        guardar(diagrama, "el diagrama terminado");

        Repository.RefreshModelView(paquete.PackageID);
        Repository.OpenDiagram(diagrama.DiagramID);
        Repository.ReloadDiagram(diagrama.DiagramID);

        Session.Prompt("El Diagrama de Clases de Analisis del CU08 fue creado exitosamente.", PROMPT_OK);
    } catch (error) {
        Session.Prompt("No se pudo crear el diagrama: " + error.message, PROMPT_OK);
    }
}

main();
