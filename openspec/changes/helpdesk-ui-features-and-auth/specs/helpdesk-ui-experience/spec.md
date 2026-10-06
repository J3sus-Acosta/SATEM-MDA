# Spec Delta: helpdesk-ui-experience

## Purpose
Proveer una experiencia de usuario interactiva y completa en el navegador para la plataforma SATEM Helpdesk, permitiendo a los agentes gestionar tickets mediante vistas filtradas dinámicas, creación rápida de solicitudes y sincronización resiliente con la API.

## ADDED Requirements

### Requirement: Interactive Folder and View Navigation
The system MUST (El sistema DEBE) permitir a los agentes navegar por las carpetas y vistas del menú lateral izquierdo (Mis Asignados, Sin Asignar, Abiertos, En Espera/Pending, Resueltos, Cerrados, Todos los Tickets y Filtros por Grupo), actualizando reactivamente el listado central de tickets y mostrando contadores de volumen en tiempo real.

#### Scenario: Agent clicks on "Mis Asignados" view
- **WHEN** un agente hace clic en la carpeta "Mis Asignados" en el menú lateral izquierdo
- **THEN** el sistema filtra instantáneamente el listado mostrando únicamente aquellos tickets asignados al ID del agente en sesión

#### Scenario: Agent clicks on "Sin Asignar" view
- **WHEN** un agente selecciona la vista "Sin Asignar"
- **THEN** el listado presenta únicamente tickets que carecen de agente asignado (`assigneeId` nulo) y se encuentran en estado activo (`NEW` u `OPEN`)

### Requirement: Agent Quick Ticket Creation Modal
The system MUST (El sistema DEBE) proveer una acción de creación rápida de tickets desde el Workbench de Agente, permitiendo ingresar solicitante, título, descripción, prioridad, grupo resolutor y agente inicial.

#### Scenario: Agent creates ticket on behalf of a user
- **WHEN** un agente completa el formulario de nuevo ticket y presiona "Crear Ticket"
- **THEN** el sistema valida los campos requeridos, persiste el ticket en la API y lo selecciona de inmediato en la columna de detalle

### Requirement: Resilient API Integration with Offline Fallback
The system MUST (El sistema DEBE) consumir los datos operativos directamente desde la API REST local (`/api/v1/tickets`), garantizando degradación elegante con datos en caché/demostrativos en caso de interrupción temporal del servidor backend.

#### Scenario: Backend unreachable or offline
- **WHEN** el frontend no logra establecer conexión HTTP con el backend en el puerto 4000
- **THEN** el sistema muestra una notificación no intrusiva de advertencia de conectividad y conmuta al repositorio local en memoria para no interrumpir la interacción del usuario
