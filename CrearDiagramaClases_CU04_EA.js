!INC Local Scripts.EAConstants-JScript

/*
 * =================================================================================================
 * Sparx Enterprise Architect - JScript
 * Diagrama de Clases de Analisis (VOPC / BCE / Robustez): CU04 - Administrar usuarios y roles
 * Contexto: Proyecto "Clinica Vida Salud" (Laravel 11 + PostgreSQL)
 *
 * Componentes del diagrama:
 *  - Actor: Administrador (Usuario con privilegios de gestion de cuentas y control de accesos)
 *  - Boundary: UI_AdministrarUsuariosRoles (Pagina web de gestion de usuarios, roles y permisos)
 *  - Control: AdministrarUsuariosRolesControlador (Controlador Laravel del CU04 que orquesta el servicio)
 *  - Entity: Usuario (Tabla DB: usuarios - cuentas de personal clinico y administrativo)
 *  - Entity: Rol (Tabla DB: roles - catalogo institucional de roles del sistema)
 *  - Entity: RolPermiso (Tabla DB: rol_permiso - tabla intermedia de asignacion de privilegios)
 *  - Entity: Permiso (Tabla DB: permisos - catalogo de permisos granulares por modulo)
 *  - Entity: Persona (Tabla DB: personas - datos personales normalizados del usuario)
 *  - Entity: BitacoraAuditoria (Tabla DB: bitacora_auditoria - registro inmutable de auditoria de usuarios y roles)
 * =================================================================================================
 */

var PACKAGE_NAME = "CU04 - Clases de analisis";
var DIAGRAM_NAME = "CU04 Administrar usuarios y roles";

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
        paquete.Notes = "Diagrama de clases de analisis del Caso de Uso 4 (Administrar usuarios y roles) en el contexto de Clinica Vida Salud.";
        guardar(paquete, "el paquete CU04");
        padre.Packages.Refresh();

        // Diagrama de tipo "Logical" (UML Class Diagram en Enterprise Architect)
        var diagrama = paquete.Diagrams.AddNew(DIAGRAM_NAME, "Logical");
        guardar(diagrama, "el diagrama de clases CU04");
        paquete.Diagrams.Refresh();

        // =====================================================================
        // 1. ACTOR
        // =====================================================================
        var actor = crearActor(
            paquete,
            "Administrador",
            "Usuario con privilegios globales para crear personal, gestionar roles institucionales y sincronizar permisos."
        );

        // =====================================================================
        // 2. BOUNDARY (Interfaz de Usuario)
        // =====================================================================
        var ui = crearClase(
            paquete,
            "UI_AdministrarUsuariosRoles",
            "Modulo de administracion en frontend (PaginaUsuariosRoles.jsx, ModalNuevoRol.jsx y MatrizRolesPermisos.jsx)."
        );
        agregarMetodo(ui, "actualizarUsuario", "void", "Public");
        agregarMetodo(ui, "alternarEstadoUsuario", "void", "Public");
        agregarMetodo(ui, "crearRol", "void", "Public");
        agregarMetodo(ui, "gestionarPermisosRol", "void", "Public");
        agregarMetodo(ui, "listarRoles", "void", "Public");
        agregarMetodo(ui, "listarUsuarios", "void", "Public");
        agregarMetodo(ui, "registrarUsuario", "void", "Public");
        agregarMetodo(ui, "sincronizarPermisosRol", "void", "Public");

        // =====================================================================
        // 3. CONTROL (Controlador Laravel)
        // =====================================================================
        var controlador = crearClase(
            paquete,
            "AdministrarUsuariosRolesControlador",
            "Controlador Laravel del CU04 que orquesta la gestion integral de cuentas de usuario, roles y matriz de permisos."
        );
        agregarMetodo(controlador, "alternarEstado", "JsonResponse", "Public");
        agregarMetodo(controlador, "crearRol", "JsonResponse", "Public");
        agregarMetodo(controlador, "index", "JsonResponse", "Public");
        agregarMetodo(controlador, "permisosRol", "JsonResponse", "Public");
        agregarMetodo(controlador, "roles", "JsonResponse", "Public");
        agregarMetodo(controlador, "sincronizarPermisosRol", "JsonResponse", "Public");
        agregarMetodo(controlador, "store", "JsonResponse", "Public");
        agregarMetodo(controlador, "update", "JsonResponse", "Public");

        // =====================================================================
        // 4. ENTITY: Rol (Tabla: roles - Arriba de AdministrarUsuariosRolesControlador)
        // =====================================================================
        var rol = crearClase(
            paquete,
            "Rol",
            "Catalogo de roles institucionales (administrador, recepcionista, medico, paciente) con conteo de permisos (Tabla: roles)."
        );
        agregarAtributo(rol, "created_at", "timestamp", "Private");
        agregarAtributo(rol, "descripcion", "string", "Private");
        agregarAtributo(rol, "id_rol", "int", "Private");
        agregarAtributo(rol, "nombre", "string", "Private");
        agregarAtributo(rol, "updated_at", "timestamp", "Private");

        agregarMetodo(rol, "create", "void", "Public");
        agregarMetodo(rol, "find", "void", "Public");
        agregarMetodo(rol, "get", "void", "Public");
        agregarMetodo(rol, "where", "void", "Public");

        // =====================================================================
        // 5. ENTITY: RolPermiso (Tabla: rol_permiso - Intermedia, derecha de Rol)
        // =====================================================================
        var rolPermiso = crearClase(
            paquete,
            "RolPermiso",
            "Tabla asociativa pivote de relacion muchos a muchos entre roles y permisos del sistema (Tabla: rol_permiso)."
        );
        agregarAtributo(rolPermiso, "created_at", "timestamp", "Private");
        agregarAtributo(rolPermiso, "id_permiso", "int", "Private");
        agregarAtributo(rolPermiso, "id_rol", "int", "Private");
        agregarAtributo(rolPermiso, "updated_at", "timestamp", "Private");

        agregarMetodo(rolPermiso, "create", "void", "Public");
        agregarMetodo(rolPermiso, "delete", "void", "Public");
        agregarMetodo(rolPermiso, "where", "void", "Public");

        // =====================================================================
        // 6. ENTITY: Permiso (Tabla: permisos - Extremo derecho de la fila superior)
        // =====================================================================
        var permiso = crearClase(
            paquete,
            "Permiso",
            "Privilegios granulares del sistema agrupados por modulo funcional (Tabla: permisos)."
        );
        agregarAtributo(permiso, "created_at", "timestamp", "Private");
        agregarAtributo(permiso, "descripcion", "string", "Private");
        agregarAtributo(permiso, "id_permiso", "int", "Private");
        agregarAtributo(permiso, "modulo", "string", "Private");
        agregarAtributo(permiso, "nombre", "string", "Private");
        agregarAtributo(permiso, "slug", "string", "Private");
        agregarAtributo(permiso, "updated_at", "timestamp", "Private");

        agregarMetodo(permiso, "find", "void", "Public");
        agregarMetodo(permiso, "get", "void", "Public");
        agregarMetodo(permiso, "where", "void", "Public");

        // =====================================================================
        // 7. ENTITY: Persona (Tabla: personas - Abajo de AdministrarUsuariosRolesControlador)
        // =====================================================================
        var persona = crearClase(
            paquete,
            "Persona",
            "Informacion personal del empleado o usuario: nombres, apellidos, CI, telefono y correo (Tabla: personas)."
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
        // 8. ENTITY: Usuario (Tabla: usuarios - Centro-Derecha)
        // =====================================================================
        var usuario = crearClase(
            paquete,
            "Usuario",
            "Cuentas de acceso del personal clinico y administrativo con estado activo/inactivo y rol asignado (Tabla: usuarios)."
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
        // 9. ENTITY: BitacoraAuditoria (Tabla: bitacora_auditoria - Extremo derecho)
        // =====================================================================
        var bitacora = crearClase(
            paquete,
            "BitacoraAuditoria",
            "Trazabilidad inmutable: CREAR_USUARIO, ACTUALIZAR_USUARIO, CAMBIAR_ESTADO, CREAR_ROL, SINCRONIZAR_PERMISOS (Tabla: bitacora_auditoria)."
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

        // Controlador -> Usuario
        crearAsociacion(controlador, usuario, "", "", "");

        // Controlador -> Rol
        crearAsociacion(controlador, rol, "", "", "");

        // Rol -> RolPermiso (1 a 0..*, label: 'posee')
        crearAsociacion(rol, rolPermiso, "1", "0..*", "posee");

        // RolPermiso -> Permiso (0..* a 1, label: 'concedido en')
        crearAsociacion(rolPermiso, permiso, "0..*", "1", "concedido en");

        // Rol -> Usuario (1 a 0..*, label: 'asigna rol a')
        crearAsociacion(rol, usuario, "1", "0..*", "asigna rol a");

        // Usuario -> Persona (accede como, multiplicidad 1 en Persona)
        crearAsociacion(usuario, persona, "", "1", "accede como");

        // Usuario -> BitacoraAuditoria (1 a 0..*, label: 'genera traza')
        crearAsociacion(usuario, bitacora, "1", "0..*", "genera traza");

        // =====================================================================
        // POSICIONAMIENTO EN EL DIAGRAMA (Topologia sin cruces, 2 niveles armonicos)
        // =====================================================================
        // Actor (Extremo izquierdo)
        colocar(diagrama, actor,         30,  110,  320,  450);

        // UI_AdministrarUsuariosRoles (Entre Actor y Controlador)
        colocar(diagrama, ui,           150,  360,  300,  480);

        // AdministrarUsuariosRolesControlador (Centro-Izquierda)
        colocar(diagrama, controlador,  420,  670,  320,  460);

        // Fila Superior (RBAC y Permisos):
        // Rol (Arriba de Controlador)
        colocar(diagrama, rol,          420,  660,   40,  220);

        // RolPermiso (A la derecha de Rol)
        colocar(diagrama, rolPermiso,   740,  960,   50,  210);

        // Permiso (Extremo superior derecho)
        colocar(diagrama, permiso,     1060, 1310,   40,  240);

        // Persona (Abajo de Controlador)
        colocar(diagrama, persona,      420,  670,  560,  870);

        // Usuario (Centro-Derecha)
        colocar(diagrama, usuario,      740,  980,  290,  650);

        // BitacoraAuditoria (Extremo derecho)
        colocar(diagrama, bitacora,    1060, 1310,  320,  630);

        diagrama.DiagramObjects.Refresh();
        diagrama.DiagramLinks.Refresh();
        guardar(diagrama, "el diagrama terminado");

        Repository.RefreshModelView(paquete.PackageID);
        Repository.OpenDiagram(diagrama.DiagramID);
        Repository.ReloadDiagram(diagrama.DiagramID);

        Session.Prompt("El Diagrama de Clases de Analisis del CU04 fue creado exitosamente.", PROMPT_OK);
    } catch (error) {
        Session.Prompt("No se pudo crear el diagrama: " + error.message, PROMPT_OK);
    }
}

main();
