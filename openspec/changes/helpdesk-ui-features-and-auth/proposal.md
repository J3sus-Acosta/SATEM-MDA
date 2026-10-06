# Proposal: Helpdesk UI Features and User Authentication

## Why

El backend empresarial de SATEM Helpdesk se encuentra desplegado, probado y funcional con soporte multi-tenant, SLA, auditoría y REST API. Sin embargo, la interfaz de usuario en el navegador requiere implementar la pantalla de autenticación y control de acceso por roles, la funcionalidad completa del menú lateral izquierdo (filtrado dinámico por carpetas/vistas ITSM), y la conexión en vivo con la API REST local para permitir una experiencia operativa fluida de punta a punta.

## What Changes

- **Flujo de Autenticación y Gestión de Sesión Frontend**:
  - Implementación de pantalla interactiva de inicio de sesión (`/login`) con selector rápido de usuarios de prueba (`admin@satem.cl`, agente de soporte y solicitante).
  - Almacenamiento seguro del access token en memoria y sincronización con cookies HttpOnly de refresh token hacia el backend `/api/v1/auth`.
  - Redirección automática inteligente según el rol del usuario autenticado (`OrgAdmin` / `SupportAgent` hacia el Workbench de Agente; `Requester` hacia el Portal del Solicitante).
  - Menú de perfil de usuario en la barra superior con información del tenant, rol activo y botón de cierre de sesión (`logout`).
- **Funcionalidad Completa del Menú Lateral Izquierdo (Vistas ITSM)**:
  - Activación interactiva de todas las carpetas y filtros del panel izquierdo:
    - *Mis Asignados*: Tickets asignados directamente al usuario en sesión.
    - *Tickets Sin Asignar*: Cola general esperando asignación.
    - *Tickets Abiertos*: Tickets en estado `NEW` u `OPEN`.
    - *En Espera (Pending)*: Tickets pausados esperando respuesta del cliente o terceros.
    - *Resueltos (Solved)*: Tickets completados pendientes de cierre definitivo.
    - *Todos los Tickets*: Inventario completo del tenant.
    - *Filtros por Grupo y Prioridad*: Agrupación por soporte N1, N2 o urgencia.
  - Contadores numéricos dinámicos en cada carpeta del menú.
- **Acciones Rápidas del Agente en el Workbench**:
  - Botón "+ Nuevo Ticket" directo en el Workbench para registrar tickets en nombre de solicitantes.
  - Modificación en línea de atributos del ticket (cambio de estado, prioridad y asignación de agente/grupo).
  - Ejecución de macros preconfiguradas desde el editor de respuestas.
- **Capa de Conexión API con Fallback Resiliente**:
  - Conexión del cliente HTTP con el backend de Docker (`http://localhost:4000/api/v1`), manteniendo fallback automático a almacenamiento local/demo si el servicio backend no está disponible.

## Capabilities

### New Capabilities
- `helpdesk-ui-experience`: Experiencia integral de usuario del Service Desk, cubriendo navegación de vistas y carpetas dinámicas del menú lateral, modales de creación rápida y sincronización de datos con la API.

### Modified Capabilities
- `iam-rbac`: Extensión de los requerimientos de autenticación para soportar el flujo web de inicio de sesión en interfaz de usuario, redirección por roles y cierre de sesión.
- `ticket-management`: Incorporación de especificaciones de filtrado facetado por vistas operativas del agente, mutación directa de atributos y aplicación de macros desde la vista de detalle.

## Impact

- **Frontend**: Modificaciones en `frontend/src/App.tsx`, `frontend/src/features/agent-workbench/TicketWorkbench.tsx`, creación de componente `frontend/src/features/auth/LoginView.tsx` y adaptadores en `frontend/src/api/client.ts`.
- **Backend**: Consumo de endpoints existentes `/api/v1/auth/login`, `/api/v1/auth/refresh`, `/api/v1/auth/logout`, `/api/v1/tickets` y `/api/v1/tickets/:id`.
- **Dependencias**: Ninguna dependencia nueva requerida (aprovecha React, TypeScript y Vite ya instalados).
- **Riesgo**: Nulo para el backend; incrementa sustancialmente la cobertura de uso funcional en navegador.
