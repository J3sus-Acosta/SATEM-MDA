# Proposal: Plataforma Integral de Mesa de Ayuda Empresarial (Helpdesk / Service Desk SaaS)

## Why

Las organizaciones y equipos de soporte modernos requieren una plataforma de Mesa de Ayuda (Helpdesk / Service Desk) robusta, segura y escalable que centralice la atención al cliente, la gestión de incidentes y requerimientos de soporte bajo estándares internacionales (ITIL / SLA), comparable con soluciones líderes como Zendesk, Freshdesk y Jira Service Management. 

Actualmente, muchas herramientas operativas sufren de falta de aislamiento multi-tenant estricto, flujos de asignación y SLA rígidos, auditoría deficiente y limitaciones de integración omnicanal. Esta propuesta establece el diseño conceptual, las especificaciones de negocio y técnicas, y el plan de implementación detallado para construir una plataforma SaaS multi-inquilino de nivel corporativo para SATEM y sus clientes.

## What Changes

Se implementará el núcleo de la plataforma de Mesa de Ayuda con arquitectura limpia, escalable y modular basada en el stack SATEM (Node.js, TypeScript, Express, PostgreSQL/MySQL con Prisma ORM, frontend React/Angular y contenedores Docker):

- **Arquitectura Multi-Tenant nativa**: Separación lógica estricta de inquilinos con segregación de datos por `tenant_id`, configuración personalizada (branding, campos dinámicos, dominios) y soporte para cuotas operativas.
- **IAM y RBAC avanzado**: Autenticación segura con JWT, rotación de refresh tokens, cookies HttpOnly, sesiones concurrentes controladas y matriz de permisos por recurso y acción (Roles: SuperAdmin, OrgAdmin, SupportSupervisor, SupportAgent, Requester/EndUser).
- **Gestión integral de tickets y ciclo de vida ITIL**: Tickets multicanal con soporte para tipos (Incidente, Solicitud, Problema, Cambio), prioridades, estados configurables, hilos de conversación con distinción de respuestas públicas y notas internas privadas, y adjuntos validados.
- **Motor de Workflows y Automatizaciones**: Asignación automática inteligente (Round-Robin, balance de carga, basadas en skills), triggers automáticos basados en eventos y condiciones, y macros de productividad para agentes.
- **Motor de SLA (Service Level Agreements)**: Reglas de SLA dinámicas con cálculo de tiempos de primera respuesta y resolución basados en calendarios operativos (horarios hábiles vs 24/7), pausas de SLA configurables y alertas de escalamiento preventivo y reactivo.
- **Notificaciones y Comunicaciones Multicanal**: Procesamiento de correo electrónico entrante y saliente (email-to-ticket), notificaciones push en tiempo real vía WebSockets/SSE, webhooks salientes y plantillas de correo personalizables por tenant.
- **Auditoría, Trazabilidad y Seguridad Empresarial**: Registro de auditoría inmutable (Audit Log) de cada acción y cambio de estado, sanitización estricta de entradas contra XSS/Inyecciones, Rate Limiting distribuido y cifrado de datos sensibles en reposo y tránsito.
- **Búsqueda facetada y Métricas Operativas**: Búsqueda avanzada y filtrado multidimensional, tableros de rendimiento del equipo (MTTR, tiempo de primera respuesta, satisfacción CSAT, volumen de tickets y cumplimiento de SLA).

## Capabilities

### New Capabilities
- `multi-tenant`: Aislamiento multi-inquilino, resolución de contexto por tenant, cuotas y parametrización corporativa.
- `iam-rbac`: Autenticación robusta, sesiones seguras y control de acceso basado en roles (RBAC) con permisos granulares.
- `ticket-management`: Modelo de datos, ciclo de vida, estados, campos personalizados, conversaciones públicas y notas privadas.
- `workflow-engine`: Enrutamiento inteligente, asignación balanceada, triggers por eventos y macros de respuesta.
- `sla-engine`: Definición de políticas SLA, cómputo con calendarios laborales, detección de brechas y escalamiento.
- `multichannel-notifications`: Ingesta/envío de emails (email-to-ticket), eventos en tiempo real (WebSockets) y webhooks salientes.
- `audit-compliance`: Bitácora inmutable de auditoría para trazabilidad forense y cumplimiento normativo corporativo.
- `search-analytics`: Indexación de tickets, búsqueda avanzada facetada y reportes de métricas operativas (CSAT, MTTR, SLAs).

### Modified Capabilities
<!-- No se modifican capacidades existentes ya que es la plataforma base inicial -->

## Impact

- **Backend**: Creación del core modular en Node.js + TypeScript con Express y capas desacopladas (Controllers, Services, Repositories/Prisma, EventBus).
- **Base de Datos**: Esquema relacional optimizado en Prisma con índices compuestos por `tenant_id`, claves foráneas íntegras y auditoría.
- **Frontend**: Aplicación empresarial interactiva y responsiva con vistas para agentes (Inbox de tickets, detalle con hilo de conversación, panel de cliente) y consola administrativa (SLA, roles, workflows, analíticas).
- **Seguridad**: Políticas de CORS, cabeceras seguras (Helmet), protección CSRF, sanitización de payloads y validación tipada con Zod.
- **Infraestructura**: Despliegue contenerizado en Docker con Docker Compose, optimizado para EasyPanel y VPS según estándares SATEM.
