!INC Local Scripts.EAConstants-JScript

/*
 * =================================================================================================
 * Sparx Enterprise Architect - JScript
 * Diagrama de Clases de Analisis (VOPC / BCE / Robustez): CU01 - Iniciar y cerrar sesion
 * Contexto: Proyecto "Clinica Vida Salud" (Laravel 11 + PostgreSQL)
 *
 * Componentes del diagrama:
 *  - Actor: Usuario (Personal / Paciente / Administrador)
 *  - Boundary: UI_Sesion (Interfaces web de acceso, login y perfil)
 *  - Control: IniciarCerrarSesionControlador (Controlador Laravel de autenticacion)
 *  - Entity: Usuario (Tabla DB: usuarios)
 *  - Entity: Rol (Tabla DB: roles - relacion 'asigna rol a' 1 a 0..*)
 *  - Entity: Persona (Tabla DB: personas - relacion 'accede como' 1 a 0..1)
 *  - Entity: BitacoraAuditoria (Tabla DB: bitacora_auditoria - relacion 'genera traza' 1 a 0..*)
 * =================================================================================================
 */

var PACKAGE_NAME = "CU01 - Clases de analisis";
var DIAGRAM_NAME = "CU01 Iniciar y cerrar sesion";

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
        paquete.Notes = "Diagrama de clases de analisis del Caso de Uso 1 (Iniciar y cerrar sesion) en el contexto de Clinica Vida Salud.";
        guardar(paquete, "el paquete CU01");
        padre.Packages.Refresh();

        // Diagrama de tipo "Logical" (UML Class Diagram en Enterprise Architect)
        var diagrama = paquete.Diagrams.AddNew(DIAGRAM_NAME, "Logical");
        guardar(diagrama, "el diagrama de clases CU01");
        paquete.Diagrams.Refresh();

        // =====================================================================
        // 1. ACTOR
        // =====================================================================
        var actor = crearActor(
            paquete,
            "Usuario",
            "Personal de la clinica (medico, recepcionista, administrador) o paciente que interactua con el sistema de autenticacion."
        );

        // =====================================================================
        // 2. BOUNDARY (Interfaz de Usuario)
        // =====================================================================
        var ui = crearClase(
            paquete,
            "UI_Sesion",
            "Interfaz web del CU01 (formulario de login institucional / portal paciente, verificacion de sesion y selector de perfil)."
        );
        agregarMetodo(ui, "cambiarPassword", "void", "Public");
        agregarMetodo(ui, "cerrarSesion", "void", "Public");
        agregarMetodo(ui, "iniciarSesion", "void", "Public");
        agregarMetodo(ui, "obtenerUsuarioActual", "void", "Public");

        // =====================================================================
        // 3. CONTROL (Controlador Laravel)
        // =====================================================================
        var controlador = crearClase(
            paquete,
            "IniciarCerrarSesionControlador",
            "Controlador Laravel del CU01 que coordina la autenticacion, emision de token Bearer, validacion de estado y auditoria."
        );
        agregarMetodo(controlador, "cambiarPassword", "void", "Public");
        agregarMetodo(controlador, "login", "void", "Public");
        agregarMetodo(controlador, "logout", "void", "Public");
        agregarMetodo(controlador, "verificar", "void", "Public");

        // =====================================================================
        // 4. ENTITY: Rol (Tabla: roles - Arriba de IniciarCerrarSesionControlador)
        // =====================================================================
        var rol = crearClase(
            paquete,
            "Rol",
            "Catalogo de roles institucionales del sistema: administrador, recepcionista, medico, paciente (Tabla: roles)."
        );
        agregarAtributo(rol, "created_at", "timestamp", "Private");
        agregarAtributo(rol, "descripcion", "string", "Private");
        agregarAtributo(rol, "id_rol", "int", "Private");
        agregarAtributo(rol, "nombre", "string", "Private");
        agregarAtributo(rol, "updated_at", "timestamp", "Private");

        agregarMetodo(rol, "find", "void", "Public");
        agregarMetodo(rol, "get", "void", "Public");

        // =====================================================================
        // 5. ENTITY: Persona (Tabla: personas - Abajo de IniciarCerrarSesionControlador)
        // =====================================================================
        var persona = crearClase(
            paquete,
            "Persona",
            "Datos personales del usuario: nombres, apellidos, CI, telefono y direccion fisica (Tabla: personas)."
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

        agregarMetodo(persona, "find", "void", "Public");
        agregarMetodo(persona, "where", "void", "Public");

        // =====================================================================
        // 6. ENTITY: Usuario (Tabla: usuarios - Centro-Derecha)
        // =====================================================================
        var usuario = crearClase(
            paquete,
            "Usuario",
            "Entidad de persistencia que almacena credenciales criptograficas, token activo y estado de la cuenta (Tabla: usuarios)."
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
        // 7. ENTITY: BitacoraAuditoria (Tabla: bitacora_auditoria - Derecha de Usuario)
        // =====================================================================
        var bitacora = crearClase(
            paquete,
            "BitacoraAuditoria",
            "Registro inmutable de eventos de seguridad: inicios de sesion, intentos fallidos y cierres de sesion (Tabla: bitacora_auditoria)."
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
        // ASOCIACIONES Y MULTIPLICIDADES EXACTAS
        // =====================================================================
        // Actor -> UI
        crearAsociacion(actor, ui, "", "", "");

        // UI -> Controlador
        crearAsociacion(ui, controlador, "", "", "");

        // Controlador -> Usuario
        crearAsociacion(controlador, usuario, "", "", "");

        // Rol -> Usuario (1 a 0..*, label: 'asigna rol a')
        crearAsociacion(rol, usuario, "1", "0..*", "asigna rol a");

        // Usuario -> Persona (0..* a 1, label: 'accede como')
        crearAsociacion(usuario, persona, "", "1", "accede como");

        // Usuario -> BitacoraAuditoria (1 a 0..*, label: 'genera traza')
        crearAsociacion(usuario, bitacora, "1", "0..*", "genera traza");

        // =====================================================================
        // POSICIONAMIENTO EN EL DIAGRAMA (Coordenadas exactas segun la imagen)
        // =====================================================================
        // Rol (Arriba, centrado hacia la izquierda del centro)
        colocar(diagrama, rol,          440,  640,   30,  210);

        // Actor (Extremo izquierdo)
        colocar(diagrama, actor,         30,  110,  320,  450);

        // UI_Sesion (Entre Actor y Controlador)
        colocar(diagrama, ui,           150,  350,  310,  460);

        // IniciarCerrarSesionControlador (Centro-Izquierda)
        colocar(diagrama, controlador,  420,  660,  320,  450);

        // Persona (Abajo, centrado bajo el controlador)
        colocar(diagrama, persona,      420,  660,  560,  870);

        // Usuario (Centro-Derecha)
        colocar(diagrama, usuario,      720,  960,  230,  590);

        // BitacoraAuditoria (Extremo derecho)
        colocar(diagrama, bitacora,    1030, 1280,  260,  570);

        diagrama.DiagramObjects.Refresh();
        diagrama.DiagramLinks.Refresh();
        guardar(diagrama, "el diagrama terminado");

        Repository.RefreshModelView(paquete.PackageID);
        Repository.OpenDiagram(diagrama.DiagramID);
        Repository.ReloadDiagram(diagrama.DiagramID);

        Session.Prompt("El Diagrama de Clases de Analisis del CU01 fue creado exitosamente.", PROMPT_OK);
    } catch (error) {
        Session.Prompt("No se pudo crear el diagrama: " + error.message, PROMPT_OK);
    }
}

main();
