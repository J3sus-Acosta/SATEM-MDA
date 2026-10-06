# Design: Helpdesk UI Features and User Authentication

## Context

El backend de la plataforma se encuentra implementado con Node.js, Express, Prisma ORM y PostgreSQL en contenedores Docker, exponiendo endpoints para autenticación (`/api/v1/auth/*`), tickets (`/api/v1/tickets/*`) y presencia WebSocket. En el frontend, se cuenta con componentes base de React (Workbench, Portal y Consola) servidos mediante Vite en el puerto 3000 con proxy reverso a `:4000`. Se requiere conectar las piezas mediante gestión de estado, autenticación persistente y filtrado dinámico.

## Goals / Non-Goals

**Goals:**
- Implementar pantalla de Login (`LoginView`) con validación de credenciales contra la API y selectores demostrativos de acceso rápido.
- Proveer un contexto global de autenticación (`AuthContext`) que maneje el usuario actual, token JWT, rol y cierre de sesión.
- Convertir todas las carpetas del menú lateral izquierdo en filtros reactivos con contadores de tickets en tiempo real.
- Permitir la mutación de estado, prioridad y asignación de tickets desde la barra lateral derecha del Workbench.
- Integrar creación rápida de tickets mediante un modal accesible desde el Workbench de Agente.
- Consumir la API REST local con fallback automático resiliente a estado local.

**Non-Goals:**
- No se implementará login federado con Google/SAML en esta fase (se mantiene autenticación nativa con rotación de refresh tokens).
- No se reemplazarán los estilos base de CSS por frameworks pesados adicionales para preservar el rendimiento.

## Decisions

### 1. Manejo de Sesión con React Context (`AuthContext`)
- **Decisión**: Crear `AuthContext` que mantenga el estado de autenticación (`user`, `token`, `isAuthenticated`, `isLoading`, `login`, `logout`). El token se almacena en memoria de la aplicación con respaldo en `sessionStorage` para tolerar recargas de página, interactuando con la cookie HttpOnly del backend.
- **Alternativas consideradas**: Usar Redux Toolkit o Zustand. Se descartó para evitar añadir dependencias pesadas innecesarias cuando React Context nativo cubre el caso de uso con cero overhead.

### 2. Motor de Filtrado de Vistas en el Menú Lateral
- **Decisión**: Implementar un filtro declarativo puro `filterTicketsByView(tickets, view, currentUserId)` que opere sobre la colección de tickets:
  - `MY_ASSIGNED`: `ticket.assigneeId === currentUserId` o `ticket.assigneeName === currentUser.fullName`
  - `UNASSIGNED`: `!ticket.assigneeId && ticket.status !== 'CLOSED'`
  - `OPEN`: `ticket.status === 'NEW' || ticket.status === 'OPEN'`
  - `PENDING`: `ticket.status === 'PENDING' || ticket.status === 'ON_HOLD'`
  - `SOLVED`: `ticket.status === 'SOLVED'`
  - `CLOSED`: `ticket.status === 'CLOSED'`
  - `ALL`: Lista completa del tenant.
- **Alternativas consideradas**: Realizar una petición HTTP al backend en cada clic. Se descartó por latencia innecesaria en listados locales; se optó por sincronizar los tickets y filtrar en cliente en <2ms, con opción de refresco remoto.

### 3. Mutación de Atributos de Tickets en el Workbench
- **Decisión**: La barra lateral derecha del ticket activo expondrá controles interactivos (`<select>` de Estado, Prioridad y Asignado). Cada cambio dispara una actualización optimista en el estado de React y una llamada a `ticketService.updateTicketStatus` o `PATCH /api/v1/tickets/:id`.
- **Alternativas consideradas**: Guardar mediante un botón explícito "Guardar Cambios". Se prefirió el patrón moderno de Service Desk (Zendesk/Freshdesk) de guardado inmediato al cambiar el desplegable con feedback visual.

### 4. Capa de Integración Resiliente (`ticketService.ts` en cliente)
- **Decisión**: Crear una capa adaptadora que intente consumir `/api/v1/tickets`. Si la llamada falla por desconexión o backend temporalmente caído, captura el error silenciosamente, notifica con un badge visual "Modo Local / Demo" y utiliza los datos locales en memoria.

## Risks / Trade-offs

- **[Riesgo de discrepancia en estado offline]** → *Mitigación*: Mostrar claramente en la barra superior un badge de estado de conexión (`API Conectada` en verde vs `Modo Local` en ámbar).
- **[Expiración de access token durante uso prolongado]** → *Mitigación*: El interceptor de `client.ts` ya cuenta con soporte para solicitar `/api/v1/auth/refresh` y renovar el token transparentemente.
