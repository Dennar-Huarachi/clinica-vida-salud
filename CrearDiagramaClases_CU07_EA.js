!INC Local Scripts.EAConstants-JScript

/*
 * =================================================================================================
 * Sparx Enterprise Architect - JScript
 * Diagrama de Clases de Analisis (VOPC / BCE / Robustez): CU07 - Gestionar especialidades
 * Contexto: Proyecto "Clinica Vida Salud" (Laravel 11 + PostgreSQL)
 *
 * Enfoque: Tablas principales e indispensables del caso de uso segun requerimiento expreso.
 *
 * Componentes del diagrama:
 *  - Actor: Administrador (Usuario con privilegios de gestion de catalogos clinicos)
 *  - Boundary: UI_GestionEspecialidades (Pagina web PaginaEspecialidades.jsx con buscador y modal)
 *  - Control: GestionarEspecialidadesControlador (Controlador Laravel del CU07 que orquesta el servicio)
 *  - Entity: Especialidad (Tabla DB: especialidades - entidad central e indispensable del catalogo)
 *  - Entity: Usuario (Tabla DB: usuarios - cuenta del administrador operador de la sesion)
 *  - Entity: BitacoraAuditoria (Tabla DB: bitacora_auditoria - trazabilidad inmutable RN21)
 * =================================================================================================
 */

var PACKAGE_NAME = "CU07 - Clases de analisis";
var DIAGRAM_NAME = "CU07 Gestionar especialidades";

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
        paquete.Notes = "Diagrama de clases de analisis del Caso de Uso 7 (Gestionar especialidades) centrado en tablas principales e indispensables.";
        guardar(paquete, "el paquete CU07");
        padre.Packages.Refresh();

        // Diagrama de tipo "Logical" (UML Class Diagram en Enterprise Architect)
        var diagrama = paquete.Diagrams.AddNew(DIAGRAM_NAME, "Logical");
        guardar(diagrama, "el diagrama de clases CU07");
        paquete.Diagrams.Refresh();

        // =====================================================================
        // 1. ACTOR
        // =====================================================================
        var actor = crearActor(
            paquete,
            "Administrador",
            "Personal de direccion encargado de mantener y supervisar la oferta de especialidades medicas de la clinica."
        );

        // =====================================================================
        // 2. BOUNDARY (Interfaz de Usuario)
        // =====================================================================
        var ui = crearClase(
            paquete,
            "UI_GestionEspecialidades",
            "Pagina web del catalogo de especialidades (PaginaEspecialidades.jsx) con buscador reactivo, modal de alta/edicion y alertas de dependencias."
        );
        agregarMetodo(ui, "alternarEstadoLogico", "void", "Public");
        agregarMetodo(ui, "buscarPorFiltro", "void", "Public");
        agregarMetodo(ui, "confirmarModificacion", "void", "Public");
        agregarMetodo(ui, "ingresarEspecialidad", "void", "Public");
        agregarMetodo(ui, "mostrarAlertaDependencias", "void", "Public");
        agregarMetodo(ui, "mostrarCatalogo", "void", "Public");

        // =====================================================================
        // 3. CONTROL (Controlador Laravel)
        // =====================================================================
        var controlador = crearClase(
            paquete,
            "GestionarEspecialidadesControlador",
            "Controlador Laravel del CU07 que orquesta listar, registrar, actualizar y alternar estado logico mediante GestionarEspecialidadesServicio."
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
            "Cuenta del administrador autenticado que ejecuta y autoriza las modificaciones sobre el catalogo de especialidades (Tabla: usuarios)."
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
        // 5. ENTITY: Especialidad (Tabla: especialidades - Entidad Central)
        // =====================================================================
        var especialidad = crearClase(
            paquete,
            "Especialidad",
            "Catalogo institucional de ramas medicas ofertadas con duracion de turno estimada, visibilidad en reserva web y estado (Tabla: especialidades)."
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
        agregarMetodo(especialidad, "update", "void", "Public");
        agregarMetodo(especialidad, "where", "void", "Public");

        // =====================================================================
        // 6. ENTITY: BitacoraAuditoria (Tabla: bitacora_auditoria - Trazabilidad RN21)
        // =====================================================================
        var bitacora = crearClase(
            paquete,
            "BitacoraAuditoria",
            "Trazabilidad inmutable de eventos: CREAR_ESPECIALIDAD, ACTUALIZAR_ESPECIALIDAD y CAMBIAR_ESTADO_ESPECIALIDAD (Tabla: bitacora_auditoria)."
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
        // ASOCIACIONES Y MULTIPLICIDADES SEGUN EL MODELO DE DATOS
        // =====================================================================
        // Actor -> UI
        crearAsociacion(actor, ui, "", "", "");

        // UI -> Controlador
        crearAsociacion(ui, controlador, "", "", "");

        // Controlador -> Usuario (operador autenticado)
        crearAsociacion(controlador, usuario, "", "", "");

        // Controlador -> Especialidad (entidad administrada)
        crearAsociacion(controlador, especialidad, "", "", "");

        // Usuario -> BitacoraAuditoria (1 a 0..*, label: 'genera traza')
        crearAsociacion(usuario, bitacora, "1", "0..*", "genera traza");

        // Especialidad -> BitacoraAuditoria (1 a 0..*, label: 'auditada en')
        crearAsociacion(especialidad, bitacora, "1", "0..*", "auditada en");

        // =====================================================================
        // POSICIONAMIENTO EN EL DIAGRAMA (Topologia limpia ortogonal en 2 niveles)
        // =====================================================================
        // Nivel Superior (Seguridad y Auditoria):
        // Usuario (Arriba de Controlador)
        colocar(diagrama, usuario,      420,  670,   50, 260);

        // BitacoraAuditoria (Arriba de Especialidad, derecha de Usuario)
        colocar(diagrama, bitacora,     740,  990,   50, 270);

        // Nivel Principal (Flujo del Caso de Uso):
        // Actor (Extremo izquierdo)
        colocar(diagrama, actor,         30,  110,  340, 470);

        // UI_GestionEspecialidades (Entre Actor y Controlador)
        colocar(diagrama, ui,           150,  360,  320, 490);

        // GestionarEspecialidadesControlador (Centro-Izquierda)
        colocar(diagrama, controlador,  420,  670,  340, 480);

        // Especialidad (Centro-Derecha, entidad principal)
        colocar(diagrama, especialidad, 740,  990,  320, 580);

        diagrama.DiagramObjects.Refresh();
        diagrama.DiagramLinks.Refresh();
        guardar(diagrama, "el diagrama terminado");

        Repository.RefreshModelView(paquete.PackageID);
        Repository.OpenDiagram(diagrama.DiagramID);
        Repository.ReloadDiagram(diagrama.DiagramID);

        Session.Prompt("El Diagrama de Clases de Analisis del CU07 fue creado exitosamente.", PROMPT_OK);
    } catch (error) {
        Session.Prompt("No se pudo crear el diagrama: " + error.message, PROMPT_OK);
    }
}

main();
