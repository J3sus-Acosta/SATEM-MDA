# Spec Delta: ticket-management

## Purpose
Gestionar el ciclo de vida completo de solicitudes de soporte e incidentes, hilos de conversación interactivos (respuestas públicas y notas internas privadas), tipos ITIL, prioridades, estados y adjuntos estructurados.

## ADDED Requirements

### Requirement: Ticket Creation and Metadata Lifecycle
The system MUST (El sistema DEBE) permitir la creación y seguimiento de tickets con número de seguimiento correlativo y único por tenant, título, descripción enriquecida, solicitante, agente asignado, grupo resolutor, estado (New, Open, Pending, On-Hold, Solved, Closed), prioridad (Low, Medium, High, Urgent) y tipo (Incident, Service Request, Problem, Change).

#### Scenario: New ticket creation via API or Portal
- **WHEN** un solicitante o agente envía una solicitud válida con asunto y descripción
- **THEN** el sistema registra el ticket en estado `New`, calcula las fechas meta iniciales de SLA y emite el evento de dominio `TicketCreated`

#### Scenario: Transitioning ticket to Solved and Closed
- **WHEN** un agente asignado marca un ticket como `Solved` y transcurre el período de gracia sin objeciones del solicitante
- **THEN** el sistema bloquea ediciones adicionales en el ticket y lo transiciona automáticamente a estado inmutable `Closed`

### Requirement: Conversation Threads and Private Internal Notes
The system MUST (El sistema DEBE) permitir registrar mensajes en un ticket discriminando entre respuestas públicas (visibles para el solicitante y agentes) y notas internas privadas (estrictamente reservadas para agentes y supervisores con menciones colaborativas).

#### Scenario: Requester viewing ticket messages
- **WHEN** un solicitante consulta el historial de mensajes de su ticket
- **THEN** el sistema retorna únicamente las respuestas públicas, excluyendo cualquier nota interna del payload de respuesta

#### Scenario: Agent adding internal note with collaboration
- **WHEN** un agente registra una nota interna mencionando a otro compañero de equipo
- **THEN** la nota se guarda marcada como privada, se notifica al colega mencionado y no se envía ninguna notificación por correo al solicitante

### Requirement: Secure Attachment Management
The system MUST (El sistema DEBE) validar tipo MIME, tamaño y extensión de archivos adjuntos tanto en la creación de tickets como en las respuestas, almacenándolos en almacenamiento seguro y sirviéndolos mediante URLs firmadas temporales.

#### Scenario: Uploading disallowed file extension
- **WHEN** un usuario intenta adjuntar un archivo ejecutable no permitido (.exe, .sh, .bat)
- **THEN** el sistema rechaza la carga con código HTTP 400 y mensaje explicativo de extensiones permitidas
