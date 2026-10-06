# Tasks: Implementación de la Plataforma de Mesa de Ayuda SATEM (Helpdesk Enterprise)

## 1. Modelado de Datos y Capa de Persistencia Prisma

- [x] 1.1 Configurar estructura de modelos relacionales en `prisma/schema.prisma` (`Tenant`, `User`, `Role`, `Permission`, `Group`, `Ticket`, `TicketMessage`, `TicketAttachment`, `SlaPolicy`, `SlaTarget`, `BusinessHours`, `WorkflowRule`, `Macro`, `AuditLog`, `WebhookSubscription`) y verificar mediante `npx prisma validate`.
- [x] 1.2 Generar migración inicial de base de datos con índices compuestos multi-tenant y claves foráneas, verificando la ejecución exitosa de `npx prisma migrate dev --name init_helpdesk_core`.
- [x] 1.3 Implementar cliente de extensión Prisma con filtrado automático obligatorio por `tenant_id` en `src/infrastructure/database/prismaClient.ts` y verificar con pruebas unitarias de aislamiento en `tests/unit/prismaTenantIsolation.test.ts`.
- [x] 1.4 Crear seeders para roles base (`SuperAdmin`, `OrgAdmin`, `SupportSupervisor`, `SupportAgent`, `Requester`) y permisos de sistema, verificando mediante `npx prisma db seed`.

## 2. Core Backend, Middleware Multi-Tenant e IAM/RBAC

- [x] 2.1 Implementar middleware de resolución de tenant por subdominio o cabecera `X-Tenant-ID` en `src/middleware/tenantContext.ts` y verificar que peticiones sin tenant o con tenant inactivo retornen error 400/404 en `tests/integration/tenantResolution.test.ts`.
- [x] 2.2 Desarrollar servicio de autenticación con hashing Argon2, emisión de Access Token JWT (15m) y Refresh Token opaco con rotación en cookie HttpOnly en `src/services/authService.ts`, verificando rotación y revocación en `tests/integration/authRotation.test.ts`.
- [x] 2.3 Implementar middleware de RBAC y autorización granular por permisos (`requirePermission('tickets:write')`) en `src/middleware/rbacMiddleware.ts` y verificar denegación 403 ante permisos insuficientes en `tests/unit/rbacMiddleware.test.ts`.
- [x] 2.4 Configurar middleware global de seguridad (Helmet, Rate Limiter por IP/Tenant, CORS dinámico y parser Zod) en `src/app.ts` y validar cabeceras de respuesta en `tests/integration/securityHeaders.test.ts`.

## 3. Módulo de Tickets, Hilos de Conversación y Adjuntos

- [x] 3.1 Implementar servicio de ciclo de vida de tickets (`createTicket`, `updateTicketStatus`, `assignTicket`, `closeTicket`) con generación de código correlativo (`TICK-1001`) en `src/services/ticketService.ts` y verificar transiciones de estado válidas e inválidas en `tests/unit/ticketLifecycle.test.ts`.
- [x] 3.2 Desarrollar endpoints REST para gestión de tickets (`POST /api/v1/tickets`, `GET /api/v1/tickets`, `GET /api/v1/tickets/:id`, `PATCH /api/v1/tickets/:id`) en `src/controllers/ticketController.ts` y verificar contratos OpenAPI/Swagger con tests de integración en `tests/integration/ticketApi.test.ts`.
- [x] 3.3 Implementar soporte para hilos de mensajes distinguiendo respuestas públicas (`PUBLIC_REPLY`) y notas internas privadas (`INTERNAL_NOTE`) en `src/services/ticketMessageService.ts`, verificando que usuarios Requester no reciban notas internas en `tests/integration/ticketMessagePrivacy.test.ts`.
- [x] 3.4 Implementar servicio de validación y almacenamiento de adjuntos seguros (validación de Magic Bytes MIME, tamaño máximo y nombres UUID) en `src/services/attachmentService.ts` y verificar rechazo de ejecutables no permitidos en `tests/unit/attachmentSecurity.test.ts`.

## 4. Motor de SLA y Calendarios Laborales

- [x] 4.1 Implementar calculador de calendarios de negocio `BusinessHoursCalculator` con soporte de franjas horarias y feriados en `src/services/sla/businessHoursCalculator.ts`, verificando cálculo de minutos hábiles entre fechas en `tests/unit/businessHoursCalculator.test.ts`.
- [x] 4.2 Desarrollar motor de evaluación de SLAs `SlaEngineService` que determine la política aplicable, fije metas de primera respuesta/resolución y pause el reloj en estados de espera en `src/services/sla/slaEngineService.ts`, verificando pausas y reanudaciones en `tests/unit/slaEngine.test.ts`.
- [x] 4.3 Implementar scheduler en segundo plano para detección periódica de tickets en riesgo de incumplimiento (Warning 80%) y tickets vencidos (Breached) en `src/jobs/slaMonitorJob.ts`, verificando emisión de eventos de advertencia y escalamiento en `tests/integration/slaMonitorJob.test.ts`.

## 5. Motor de Workflows, Reglas de Asignación y Macros

- [x] 5.1 Implementar EventBus interno tipado (`ticket:created`, `ticket:updated`, `ticket:sla_breached`) en `src/infrastructure/events/eventBus.ts` y verificar publicación y suscripción asíncrona desacoplada en `tests/unit/eventBus.test.ts`.
- [x] 5.2 Desarrollar evaluador de reglas de automatización `WorkflowRuleEngine` que ejecute condiciones lógicas compuestas y dispare acciones ordenadas en `src/services/workflow/workflowRuleEngine.ts`, verificando prevención de bucles infinitos en `tests/unit/workflowEngine.test.ts`.
- [x] 5.3 Implementar algoritmos de balanceo de asignación (Round-Robin y Menor Carga de tickets abiertos) en `src/services/workflow/ticketAssignmentStrategy.ts` y validar distribución uniforme entre agentes en `tests/unit/assignmentStrategy.test.ts`.
- [x] 5.4 Crear gestión de Macros de agente (respuestas predefinidas con mutación de campos) y endpoint `POST /api/v1/tickets/:id/apply-macro` en `src/controllers/macroController.ts`, verificando aplicación atómica en `tests/integration/macroExecution.test.ts`.

## 6. Canal Multicanal (Email-to-Ticket, WebSockets en Tiempo Real y Webhooks)

- [x] 6.1 Implementar procesador de correos entrantes (Email Inbound Parse) con resolución de cabeceras `Message-ID` y `In-Reply-To` para enhebrado en `src/services/multichannel/emailInboundService.ts`, verificando creación y respuesta vía mock de email en `tests/integration/emailToTicket.test.ts`.
- [x] 6.2 Implementar despachador de emails salientes con plantillas HTML responsivas para confirmación al cliente y avisos a agentes en `src/services/multichannel/emailOutboundService.ts`, verificando renderizado y envío en `tests/unit/emailTemplates.test.ts`.
- [x] 6.3 Configurar servidor WebSockets con autenticación JWT y salas segmentadas por tenant (`tenant:{id}`) y ticket (`ticket:{id}`) en `src/infrastructure/websocket/socketServer.ts`, verificando notificación de colisión de agentes en `tests/integration/agentCollision.test.ts`.
- [x] 6.4 Implementar despachador de Webhooks salientes para integraciones externas con firma HMAC SHA-256 y reintentos con backoff exponencial en `src/services/multichannel/webhookDispatcher.ts`, verificando firma y entrega en `tests/unit/webhookSignature.test.ts`.

## 7. Auditoría, Búsqueda Facetada y Analíticas

- [x] 7.1 Implementar servicio de auditoría inmutable (Append-Only) en `src/services/auditService.ts` que capture `tenant_id`, `user_id`, IP, acción y diff estructurado de cambios, verificando imposibilidad de mutación en `tests/unit/auditImmutability.test.ts`.
- [x] 7.2 Implementar motor de búsqueda facetada con filtros combinados (texto libre, estado, prioridad, fechas, grupo, agente) en `src/services/searchService.ts` y verificar tiempos de respuesta indexados menores a 300ms en `tests/integration/searchQueries.test.ts`.
- [x] 7.3 Desarrollar servicio de agregación de métricas operativas y reportes CSAT (MTTR, MTFR, % cumplimiento SLA, volumen de tickets) en `src/services/analyticsService.ts` y validar cálculos estadísticos en `tests/unit/analyticsMetrics.test.ts`.

## 8. Frontend SPA: Workbench de Agente, Portal de Solicitante y Consola Admin

- [x] 8.1 Configurar arquitectura frontend SPA con React + TypeScript, TailwindCSS/Vanilla tokens corporativos, cliente HTTP con interceptores de autenticación y refresco automático en `frontend/src/api/client.ts`.
- [x] 8.2 Desarrollar el Workbench de Agente: Layout de 3 columnas (Vistas/Carpetas | Listado de tickets con badges de SLA | Detalle del ticket con editor de respuestas públicas, notas internas amarillas, historial y barra lateral de propiedades) en `frontend/src/features/agent-workbench/`.
- [x] 8.3 Implementar componente de presencia en tiempo real y alerta de colisión entre agentes (indicador visual "Agente X está respondiendo este ticket") en `frontend/src/features/agent-workbench/AgentCollisionBanner.tsx`.
- [x] 8.4 Desarrollar el Portal del Solicitante (End-User Portal) con catálogo de categorías, formulario de nuevo ticket con subida de adjuntos y seguimiento de historial en `frontend/src/features/customer-portal/`.
- [x] 8.5 Desarrollar la Consola de Administración para gestión de Tenants, Usuarios, Políticas de SLA, Reglas de Workflow y Tablero de Métricas/CSAT en `frontend/src/features/admin-console/`.

## 9. Empaquetado Docker, Pruebas de Integración y Validación de Seguridad

- [x] 9.1 Crear `Dockerfile` multi-stage optimizado para producción y `docker-compose.yml` para orquestación de backend, base de datos y frontend, verificando levantamiento exitoso mediante `docker compose up -d --build`.
- [x] 9.2 Ejecutar suite completa de pruebas unitarias y de integración del sistema, verificando cobertura mínima del 80% en lógica de negocio crítica con `npm run test:coverage`.
- [x] 9.3 Realizar auditoría de seguridad de dependencias (`npm audit`) y verificación de secretos (`security-reviewer`), asegurando cero vulnerabilidades críticas o credenciales expuestas.
