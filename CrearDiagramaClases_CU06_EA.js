!INC Local Scripts.EAConstants-JScript

/*
 * =================================================================================================
 * Sparx Enterprise Architect - JScript
 * Diagrama de Clases de Analisis (VOPC / BCE / Robustez): CU06 - Gestionar mi perfil
 * Contexto: Proyecto "Clinica Vida Salud" (Laravel 11 + PostgreSQL)
 *
 * Componentes del diagrama:
 *  - Actor: Usuario Autenticado (Cualquier usuario con sesion activa en el sistema)
 *  - Boundary: UI_MiPerfil (Pagina web PaginaMiPerfil.jsx / MiPerfil.jsx con vista y edicion)
 *  - Control: GestionarMiPerfilControlador (Controlador Laravel del CU06 que delega en el servicio)
 *  - Entity: Usuario (Tabla DB: usuarios - cuenta activa, credenciales y sincronizacion de correo)
 *  - Entity: Persona (Tabla DB: personas - identidad base y actualizacion de canales de contacto)
 *  - Entity: Medico (Tabla DB: medicos - expediente profesional si el usuario ejerce como medico)
 *  - Entity: Paciente (Tabla DB: pacientes - ficha clinica correlativa HC-YYYY-XXXXX si es paciente)
 *  - Entity: InformacionMedicaPaciente (Tabla DB: informacion_medica_paciente - ficha de antecedentes)
 *  - Entity: ContactoEmergencia (Tabla DB: contactos_emergencia - contacto principal de auxilio)
 *  - Entity: BitacoraAuditoria (Tabla DB: bitacora_auditoria - registro de trazabilidad inmutable)
 * =================================================================================================
 */

var PACKAGE_NAME = "CU06 - Clases de analisis";
var DIAGRAM_NAME = "CU06 Gestionar mi perfil";

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
        paquete.Notes = "Diagrama de clases de analisis del Caso de Uso 6 (Gestionar mi perfil) en el contexto de Clinica Vida Salud.";
        guardar(paquete, "el paquete CU06");
        padre.Packages.Refresh();

        // Diagrama de tipo "Logical" (UML Class Diagram en Enterprise Architect)
        var diagrama = paquete.Diagrams.AddNew(DIAGRAM_NAME, "Logical");
        guardar(diagrama, "el diagrama de clases CU06");
        paquete.Diagrams.Refresh();

        // =====================================================================
        // 1. ACTOR
        // =====================================================================
        var actor = crearActor(
            paquete,
            "Usuario Autenticado",
            "Cualquier usuario con sesion activa en el sistema (Paciente, Medico, Recepcionista o Administrador) que gestiona su propio perfil."
        );

        // =====================================================================
        // 2. BOUNDARY (Interfaz de Usuario)
        // =====================================================================
        var ui = crearClase(
            paquete,
            "UI_MiPerfil",
            "Pagina web del CU06 (PaginaMiPerfil.jsx / MiPerfil.jsx) con vista de datos de sesion, antecedentes y formulario de contacto."
        );
        agregarMetodo(ui, "desplegarMensaje", "void", "Public");
        agregarMetodo(ui, "editarDatosContacto", "void", "Public");
        agregarMetodo(ui, "editarFichaMedica", "void", "Public");
        agregarMetodo(ui, "guardarCambios", "void", "Public");
        agregarMetodo(ui, "solicitarDatosPerfil", "void", "Public");
        agregarMetodo(ui, "verDatosPersonales", "void", "Public");

        // =====================================================================
        // 3. CONTROL (Controlador Laravel)
        // =====================================================================
        var controlador = crearClase(
            paquete,
            "GestionarMiPerfilControlador",
            "Controlador Laravel del CU06 que aplica Anti-IDOR (RN19) resolviendo la identidad del perfil mediante la sesion activa."
        );
        agregarMetodo(controlador, "show", "JsonResponse", "Public");
        agregarMetodo(controlador, "update", "JsonResponse", "Public");

        // =====================================================================
        // 4. ENTITY: Usuario (Tabla: usuarios - Eje de sesion activa)
        // =====================================================================
        var usuario = crearClase(
            paquete,
            "Usuario",
            "Cuenta activa del usuario autenticado con sincronizacion de correo, token de sesion y estado de la cuenta (Tabla: usuarios)."
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
        // 5. ENTITY: BitacoraAuditoria (Tabla: bitacora_auditoria - Sobre Usuario)
        // =====================================================================
        var bitacora = crearClase(
            paquete,
            "BitacoraAuditoria",
            "Registro inmutable de trazabilidad para el evento ACTUALIZAR_MI_PERFIL vinculando al usuario autenticado (Tabla: bitacora_auditoria)."
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
        // 6. ENTITY: Persona (Tabla: personas - Datos biograficos y canales de contacto)
        // =====================================================================
        var persona = crearClase(
            paquete,
            "Persona",
            "Identidad fisica del usuario: actualizacion de canales de contacto (telefono, correo, direccion) (Tabla: personas)."
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
        // 7. ENTITY: Medico (Tabla: medicos - Sobre Persona)
        // =====================================================================
        var medico = crearClase(
            paquete,
            "Medico",
            "Expediente profesional del usuario si desempena funciones medicas en la institucion (Tabla: medicos)."
        );
        agregarAtributo(medico, "created_at", "timestamp", "Private");
        agregarAtributo(medico, "estado", "string", "Private");
        agregarAtributo(medico, "id_medico", "int", "Private");
        agregarAtributo(medico, "id_persona", "int", "Private");
        agregarAtributo(medico, "numero_colegiado", "string", "Private");
        agregarAtributo(medico, "updated_at", "timestamp", "Private");

        agregarMetodo(medico, "create", "void", "Public");
        agregarMetodo(medico, "find", "void", "Public");
        agregarMetodo(medico, "update", "void", "Public");
        agregarMetodo(medico, "where", "void", "Public");

        // =====================================================================
        // 8. ENTITY: Paciente (Tabla: pacientes - Ficha institucional)
        // =====================================================================
        var paciente = crearClase(
            paquete,
            "Paciente",
            "Ficha clinica institucional con codigo correlativo unico HC-YYYY-XXXXX y actualizacion de grupo sanguineo (Tabla: pacientes)."
        );
        agregarAtributo(paciente, "codigo_historia", "string", "Private");
        agregarAtributo(paciente, "created_at", "timestamp", "Private");
        agregarAtributo(paciente, "estado", "string", "Private");
        agregarAtributo(paciente, "grupo_sanguineo", "string", "Private");
        agregarAtributo(paciente, "id_paciente", "int", "Private");
        agregarAtributo(paciente, "id_persona", "int", "Private");
        agregarAtributo(paciente, "updated_at", "timestamp", "Private");

        agregarMetodo(paciente, "create", "void", "Public");
        agregarMetodo(paciente, "find", "void", "Public");
        agregarMetodo(paciente, "update", "void", "Public");
        agregarMetodo(paciente, "where", "void", "Public");

        // =====================================================================
        // 9. ENTITY: InformacionMedicaPaciente (Tabla: informacion_medica_paciente - Sobre Paciente)
        // =====================================================================
        var infoMedica = crearClase(
            paquete,
            "InformacionMedicaPaciente",
            "Ficha de antecedentes de salud declarados por el paciente: alergias, enfermedades cronicas y medicamentos (Tabla: informacion_medica_paciente)."
        );
        agregarAtributo(infoMedica, "alergias", "string", "Private");
        agregarAtributo(infoMedica, "antecedentes_familiares", "string", "Private");
        agregarAtributo(infoMedica, "created_at", "timestamp", "Private");
        agregarAtributo(infoMedica, "enfermedades_cronicas", "string", "Private");
        agregarAtributo(infoMedica, "id_informacion_medica", "int", "Private");
        agregarAtributo(infoMedica, "id_paciente", "int", "Private");
        agregarAtributo(infoMedica, "medicamentos_actuales", "string", "Private");
        agregarAtributo(infoMedica, "observaciones", "string", "Private");
        agregarAtributo(infoMedica, "updated_at", "timestamp", "Private");

        agregarMetodo(infoMedica, "create", "void", "Public");
        agregarMetodo(infoMedica, "find", "void", "Public");
        agregarMetodo(infoMedica, "update", "void", "Public");
        agregarMetodo(infoMedica, "where", "void", "Public");

        // =====================================================================
        // 10. ENTITY: ContactoEmergencia (Tabla: contactos_emergencia - Bajo Paciente)
        // =====================================================================
        var contactoEmergencia = crearClase(
            paquete,
            "ContactoEmergencia",
            "Contacto de emergencia principal del paciente con datos de localizacion inmediata (Tabla: contactos_emergencia)."
        );
        agregarAtributo(contactoEmergencia, "created_at", "timestamp", "Private");
        agregarAtributo(contactoEmergencia, "direccion", "string", "Private");
        agregarAtributo(contactoEmergencia, "es_principal", "boolean", "Private");
        agregarAtributo(contactoEmergencia, "id_contacto_emergencia", "int", "Private");
        agregarAtributo(contactoEmergencia, "id_paciente", "int", "Private");
        agregarAtributo(contactoEmergencia, "nombre_completo", "string", "Private");
        agregarAtributo(contactoEmergencia, "relacion", "string", "Private");
        agregarAtributo(contactoEmergencia, "telefono", "string", "Private");
        agregarAtributo(contactoEmergencia, "updated_at", "timestamp", "Private");

        agregarMetodo(contactoEmergencia, "create", "void", "Public");
        agregarMetodo(contactoEmergencia, "find", "void", "Public");
        agregarMetodo(contactoEmergencia, "update", "void", "Public");
        agregarMetodo(contactoEmergencia, "where", "void", "Public");

        // =====================================================================
        // ASOCIACIONES Y MULTIPLICIDADES SEGUN EL MODELO DE DATOS
        // =====================================================================
        // Actor -> UI
        crearAsociacion(actor, ui, "", "", "");

        // UI -> Controlador
        crearAsociacion(ui, controlador, "", "", "");

        // Controlador -> Usuario
        crearAsociacion(controlador, usuario, "", "", "");

        // Usuario -> BitacoraAuditoria (1 a 0..*, label: 'genera traza')
        crearAsociacion(usuario, bitacora, "1", "0..*", "genera traza");

        // Usuario -> Persona (accede como, multiplicidad 1 en Persona)
        crearAsociacion(usuario, persona, "", "1", "accede como");

        // Persona -> Medico (1 a 0..1, label: 'ejerce como')
        crearAsociacion(persona, medico, "1", "0..1", "ejerce como");

        // Persona -> Paciente (1 a 0..1, label: 'se registra como')
        crearAsociacion(persona, paciente, "1", "0..1", "se registra como");

        // Paciente -> InformacionMedicaPaciente (1 a 0..1, label: 'posee ficha')
        crearAsociacion(paciente, infoMedica, "1", "0..1", "posee ficha");

        // Paciente -> ContactoEmergencia (1 a 0..*, label: 'registra')
        crearAsociacion(paciente, contactoEmergencia, "1", "0..*", "registra");

        // =====================================================================
        // POSICIONAMIENTO EN EL DIAGRAMA (Diseno de 3 niveles ortogonales sin cruces)
        // =====================================================================
        // Nivel 1 (Superior): BitacoraAuditoria (sobre Usuario), Medico (sobre Persona), InfoMedica (sobre Paciente)
        colocar(diagrama, bitacora,            710,  960,   50, 310);
        colocar(diagrama, medico,              990, 1220,   50, 270);
        colocar(diagrama, infoMedica,         1270, 1530,   50, 290);

        // Nivel 2 (Principal): Actor -> UI -> Controlador -> Usuario -> Persona -> Paciente
        colocar(diagrama, actor,                30,  110,  410, 540);
        colocar(diagrama, ui,                  150,  360,  380, 560);
        colocar(diagrama, controlador,         420,  660,  400, 530);
        colocar(diagrama, usuario,             710,  960,  370, 680);
        colocar(diagrama, persona,             990, 1220,  360, 640);
        colocar(diagrama, paciente,           1270, 1530,  370, 600);

        // Nivel 3 (Inferior): ContactoEmergencia (directamente debajo de Paciente)
        colocar(diagrama, contactoEmergencia, 1270, 1530,  670, 920);

        diagrama.DiagramObjects.Refresh();
        diagrama.DiagramLinks.Refresh();
        guardar(diagrama, "el diagrama terminado");

        Repository.RefreshModelView(paquete.PackageID);
        Repository.OpenDiagram(diagrama.DiagramID);
        Repository.ReloadDiagram(diagrama.DiagramID);

        Session.Prompt("El Diagrama de Clases de Analisis del CU06 fue creado exitosamente.", PROMPT_OK);
    } catch (error) {
        Session.Prompt("No se pudo crear el diagrama: " + error.message, PROMPT_OK);
    }
}

main();
