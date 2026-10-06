# Multichannel Notifications Specification

## Purpose
Gestionar la ingesta y despacho omnicanal de soporte mediante procesamiento de correos electrónicos entrantes y salientes (email-to-ticket), notificaciones push en tiempo real vía WebSockets y webhooks salientes para integraciones externas.

## Requirements

### Requirement: Email-to-Ticket and Outbound Notifications
The system MUST (El sistema DEBE) procesar correos electrónicos entrantes dirigidos a direcciones de soporte del tenant creando o actualizando tickets según las cabeceras `Message-ID` e `In-Reply-To`, y enviar notificaciones por email formateadas con plantillas HTML limpias al solicitante y agentes involucrados.

#### Scenario: Inbound reply appending to existing ticket
- **WHEN** un cliente responde al correo electrónico de notificación generado por el sistema
- **THEN** el procesador asocia el mensaje entrante como una nueva respuesta pública en el ticket correspondiente y notifica al agente asignado

#### Scenario: New ticket created from email
- **WHEN** se recibe un correo desde una dirección remitente válida no asociada a un ticket previo
- **THEN** el sistema crea un nuevo ticket asignando el asunto como título y el cuerpo del mensaje como descripción inicial, adjuntando los archivos válidos

### Requirement: Real-time In-App Notifications and Agent Presence
The system MUST (El sistema DEBE) proveer un canal de comunicación bidireccional en tiempo real (WebSockets / Server-Sent Events) para alertar a los agentes conectados sobre nuevos tickets asignados, menciones en notas internas y cambios de estado en vivo, además de prevenir colisión de agentes (Collision Detection) si dos personas están editando el mismo ticket.

#### Scenario: Agent collision alert
- **WHEN** dos agentes abren simultáneamente el mismo ticket en la interfaz
- **THEN** el sistema muestra un indicador visual en tiempo real informando a ambos que el otro agente está visualizando o respondiendo la solicitud

### Requirement: Outbound Webhooks and External Integrations
The system MUST (El sistema DEBE) despachar eventos de ciclo de vida (TicketCreated, TicketUpdated, SLABreached) a endpoints HTTP externos configurados por el tenant con firmas criptográficas HMAC (SHA-256) para verificación de autenticidad.

#### Scenario: Webhook delivery on ticket state change
- **WHEN** un ticket cambia de estado y existe un webhook activo registrado para dicho evento
- **THEN** el despachador envía una petición POST con el payload del evento y el encabezado `X-Signature-SHA256`, reintentando con backoff exponencial en caso de fallo temporal
