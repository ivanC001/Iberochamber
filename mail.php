<?php
/* ===================================================================
   Ibero Chamber — envío del formulario de contacto (contacto/)
   Requiere un hosting con PHP y la función mail() habilitada.
   =================================================================== */

// Correo que recibe los mensajes del formulario
$destinatario = "lucia.g@iberochamber.com";

header("Content-Type: text/plain; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(403);
    echo "Solicitud no permitida.";
    exit;
}

// Limpieza: sin etiquetas ni saltos de línea en los campos de una línea
function campo($nombre) {
    $valor = isset($_POST[$nombre]) ? trim($_POST[$nombre]) : "";
    return str_replace(array("\r", "\n"), " ", strip_tags($valor));
}

$nombre   = campo("name");
$telefono = campo("number");
$asunto   = campo("subject");
$correo   = filter_var(campo("email"), FILTER_SANITIZE_EMAIL);
$mensaje  = isset($_POST["message"]) ? trim(strip_tags($_POST["message"])) : "";

if ($nombre === "" || $mensaje === "" || $telefono === "" || $asunto === "" || !filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo "Por favor completa todos los campos e inténtalo de nuevo.";
    exit;
}

$titulo = "=?UTF-8?B?" . base64_encode("Web Ibero Chamber: " . $asunto) . "?=";
$cuerpo  = "Nombre: $nombre\n";
$cuerpo .= "Correo: $correo\n";
$cuerpo .= "Teléfono: $telefono\n";
$cuerpo .= "Asunto: $asunto\n\n";
$cuerpo .= "Mensaje:\n$mensaje\n";

$cabeceras  = "From: Ibero Chamber <no-responder@iberochamber.com>\r\n";
$cabeceras .= "Reply-To: $correo\r\n";
$cabeceras .= "Content-Type: text/plain; charset=utf-8\r\n";

if (mail($destinatario, $titulo, $cuerpo, $cabeceras)) {
    http_response_code(200);
    echo "¡Gracias! Tu mensaje fue enviado. Te responderemos pronto.";
} else {
    http_response_code(500);
    echo "No pudimos enviar tu mensaje. Escríbenos por WhatsApp o al correo $destinatario.";
}
