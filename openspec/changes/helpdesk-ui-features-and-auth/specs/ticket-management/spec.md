# Spec Delta: ticket-management

## ADDED Requirements

### Requirement: Workbench In-line Ticket Mutation and Macro Execution
The system MUST (El sistema DEBE) permitir a los agentes actualizar interactivamente desde la barra lateral derecha del Workbench el estado del ticket (Open, Pending, Solved), la prioridad (Low, Medium, High, Urgent), el agente asignado y el grupo resolutor, además de permitir la ejecución instantánea de macros de respuesta rápida.

#### Scenario: Agent updates ticket status in sidebar
- **WHEN** el agente cambia el selector de estado de `OPEN` a `PENDING` en la barra lateral del ticket
- **THEN** el sistema envía la petición de actualización a la API, actualiza el estado local en pantalla y pausa automáticamente el cronómetro de SLA

#### Scenario: Agent executes canned macro
- **WHEN** el agente selecciona la macro "Solicitar más información al cliente"
- **THEN** se inserta el texto predeterminado en el editor de respuesta pública, el estado cambia a `PENDING` y se aplica la etiqueta `esperando-cliente`
