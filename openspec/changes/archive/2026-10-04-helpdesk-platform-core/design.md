# Design: Arquitectura Técnica de la Plataforma de Mesa de Ayuda SATEM (Helpdesk Enterprise)

## Context

Ver `proposal.md` y `specs/` para la motivación de negocio y los requisitos funcionales. 

El proyecto SATEM requiere una solución empresarial lista para producción que cumpla con los estándares técnicos corporativos (Node.js con TypeScript estricto, Express REST API, Prisma ORM sobre PostgreSQL o MySQL, frontend responsivo React/TypeScript, contenedores Docker y orquestación compatible con EasyPanel/VPS).

La plataforma debe soportar alta concurrencia, aislamiento multi-inquilino de datos, operaciones en tiempo real, colisiones de edición entre agentes y cumplimiento estricto de SLAs corporativos con auditoría inmutable.

## Goals / Non-Goals

**Goals:**
- Proveer una arquitectura desacoplada por capas (Controladores, Servicios de Aplicación, Repositorios/Prisma, EventBus interno) con tipado estricto de extremo a extremo.
- Asegurar aislamiento lógico multi-tenant infalible mediante filtrado a nivel de contexto de ejecución (`tenant_id`) en cada consulta de base de datos.
- Implementar un motor de SLA determinista con cálculo de calendarios laborales (horarios hábiles, fines de semana, festivos) y pausas de reloj automáticas.
- Proveer sincronización en tiempo real vía WebSockets para inbox interactivo, notificaciones instantáneas y detección de colisiones entre agentes.
- Garantizar seguridad empresarial de nivel bancario: tokens JWT + refresh tokens en cookies HttpOnly con rotación, RBAC estricto, validación con Zod, sanitización de inputs y registro de auditoría append-only.
- Diseñar una interfaz de usuario empresarial ergonómica, con paneles dedicados para Agentes (Ticket Workbench), Clientes (Portal de Autoservicio) y Administradores (Configuración, SLA, Workflows, Métricas).

**Non-Goals:**
- No incluye un motor de Inteligencia Artificial generativa autónomo para responder tickets sin supervisión en esta fase (se dejará la interfaz de webhook y eventos lista para plugins futuros de SATEM ONE).
- No contempla soporte de telefonía VoIP o PBX nativa en el core inicial (se cubrirá mediante webhooks hacia servicios CTI externos).
- No reemplaza un ERP o CRM completo; se enfoca específicamente en IT Service Management (ITSM) y Customer Support.

## Decisions

### 1. Modelo de Aislamiento Multi-Tenant (Discriminator Column vs Database-per-tenant)
- **Decisión**: Se implementa aislamiento por columna discriminadora (`tenant_id`) en un esquema de base de datos compartido con extensiones/middleware de Prisma que inyectan y validan automáticamente el `tenant_id` en cada consulta.
- **Razón**: Permite escalabilidad óptima en costos de infraestructura, mantenimiento de migraciones centralizadas y soporte de decenas a cientos de inquilinos en VPS/EasyPanel sin sobrecargar conexiones de base de datos.
- **Alternativas consideradas**: Base de datos dedicada por tenant (muy costosa en recursos para instancias pequeñas/medianas y compleja de migrar concurrentemente).

### 2. Capa de Persistencia y Modelado de Datos (Prisma ORM)
- **Decisión**: Uso de Prisma ORM con claves foráneas e índices compuestos multi-columna `[tenant_id, id]`, `[tenant_id, status]`, `[tenant_id, priority]`, `[tenant_id, createdAt]`.
- **Entidades Principales**:
  - `Tenant`: Identificación, slug, subdominio, plan, cuotas y configuración JSON.
  - `User`: Credenciales, tenantId, nombre, email, rol, estado y preferencias.
  - `Role` y `Permission`: Roles predefinidos y matriz granular de permisos por recurso (`tickets:read`, `tickets:update`, `sla:manage`, `audit:read`, etc.).
  - `Ticket`: Número secuencial correlativo por tenant (`TICK-1001`), título, descripción, estado (New, Open, Pending, On-Hold, Solved, Closed), prioridad (Low, Medium, High, Urgent), tipo (Incident, Request, Problem, Change), requesterId, assigneeId, groupId, slaPolicyId, fechas meta de SLA.
  - `TicketMessage`: Hilo de mensajes, type (`PUBLIC_REPLY` vs `INTERNAL_NOTE`), autor, body en HTML/Markdown sanitizado.
  - `TicketAttachment`: Archivos adjuntos validados (nombre, mimeType, sizeBytes, storageKey, hash SHA-256).
  - `Group` / `Department`: Equipos resolutores con asignación Round-Robin o Carga Balanceada.
  - `SlaPolicy` y `SlaTarget`: Reglas de tiempo por prioridad (FRT y RT) vinculadas a calendarios operativos `BusinessHours`.
  - `WorkflowRule`: Triggers de eventos (conditions compuestas en JSON y actions secuenciales).
  - `AuditLog`: Registro inmutable (timestamp, tenantId, userId, action, entity, entityId, ipAddress, userAgent, changesDiff).

### 3. Autenticación y Autorización (JWT + Refresh Tokens con Rotación)
- **Decisión**: Emisión de Access Token JWT en memoria / encabezado `Authorization: Bearer` (tiempo de vida corto: 15 minutos) y Refresh Token opaco con hash criptográfico guardado en base de datos y transmitido en cookie `HttpOnly`, `SameSite=Lax/Strict`, `Secure`.
- **Razón**: Mitiga ataques XSS al no guardar tokens de larga duración en `localStorage` y previene ataques de replay mediante rotación obligatoria de tokens en cada renovación.

### 4. Motor de SLA y Calendarios Laborales
- **Decisión**: Servicio especializado `SlaCalculatorService` con soporte de intervalos horarios y feriados.
  - Las pausas de SLA se activan al transicionar a estados con `is_sla_paused: true` (ej: `Pending`, esperando cliente).
  - Cálculo de horas hábiles proyectando los minutos restantes hacia las franjas hábiles siguientes.
  - Tarea periódica en segundo plano (Scheduler/Cron cada 1-2 minutos) para evaluar tickets en riesgo (`Warning`) o vencidos (`Breached`) y emitir eventos de escalamiento.

### 5. Motor de Workflows y Automatizaciones Basado en Eventos
- **Decisión**: Implementación de un `EventBus` interno desacoplado en el backend que emite eventos de dominio (`ticket:created`, `ticket:status_changed`, `ticket:assigned`, `ticket:sla_breached`).
- **Razón**: Permite que el motor de reglas (`WorkflowEngineService`) evalúe condiciones (`status == 'NEW' && priority == 'URGENT'`) y aplique acciones (`assignToGroup(Nivel2)`, `sendEmailAlert()`) sin acoplar la lógica al controlador HTTP.

### 6. Comunicación en Tiempo Real y Prevención de Colisiones (WebSockets)
- **Decisión**: Uso de WebSockets autenticados con salas (`rooms`) segmentadas por tenant (`tenant:{id}`) y por ticket (`ticket:{id}`).
- **Razón**: Mantiene actualizados los contadores del inbox de agentes sin necesidad de polling repetitivo y notifica de inmediato cuando otro agente abre el mismo ticket (Agent Collision Detection).

### 7. Canal de Correo Electrónico (Email-to-Ticket)
- **Decisión**: Ingesta modular mediante procesador de webhooks entrantes (compatible con servicios como SendGrid Inbound Parse, Mailgun, Postmark o IMAP Poller local) con parseo de cabeceras RFC 2822 (`Message-ID`, `References`, `In-Reply-To`) para enhebrar respuestas a tickets existentes o generar nuevos incidentes.

### 8. Arquitectura y Experiencia de Usuario Frontend (React + TypeScript)
- **Decisión**: Aplicación Single Page Application (SPA) modular estructurada en:
  - **Portal del Cliente**: Vista simplificada para abrir solicitudes, ver base de conocimiento y seguir el estado de sus tickets con interfaz limpia.
  - **Mesa de Agente (Workbench)**: Inbox en 3 paneles (Filtros/Vistas guardadas | Lista de tickets con badges de SLA | Detalle del ticket con editor de respuestas públicas, notas privadas amarillas, macros y barra lateral de propiedades).
  - **Consola de Administración**: Configuración de organización, usuarios y roles, grupos, políticas de SLA, reglas de automatización, webhooks y bitácora de auditoría.

## Risks / Trade-offs

- **[Riesgo: Fuga de datos entre Tenants]** → *Mitigación*: Middleware mandatorio en Express que inyecta `tenant_id` verificado criptográficamente en el objeto de request y métodos de repositorio con tipado estricto que exigen `tenantId` en todos los métodos de búsqueda y mutación.
- **[Riesgo: Cálculos de SLA complejos que degraden la base de datos]** → *Mitigación*: Cálculo estático de la fecha límite esperada (`dueAt`) al momento de crear o reanudar el ticket; el scheduler solo consulta tickets abiertos con `dueAt <= now` usando índices indexados en tiempo constante.
- **[Riesgo: Bucle infinito en reglas de automatización]** → *Mitigación*: Límite de profundidad de ejecución máxima (máximo 3 encadenamientos de reglas por evento) y detección de recursividad cíclica en el `WorkflowEngine`.
- **[Riesgo: Carga masiva de adjuntos maliciosos]** → *Mitigación*: Validación de Magic Bytes (tipo real de archivo), límite de tamaño (ej. 15MB) y almacenamiento de nombres anonimizados mediante UUIDs fuera de rutas ejecutables.

## Migration Plan

1. **Fase 1: Core de Base de Datos y Modelos Prisma**: Creación de migraciones iniciales de tablas (tenants, users, roles, tickets, audit_logs).
2. **Fase 2: Servicios Backend e IAM**: Middleware de autenticación, RBAC y CRUD de tickets con notas públicas/privadas.
3. **Fase 3: Motores de SLA y Workflows**: Implementación del calculador de horarios de negocio y evaluador de reglas.
4. **Fase 4: Multicanal y WebSockets**: Ingesta de emails, notificaciones en vivo y webhooks salientes.
5. **Fase 5: Frontend Workbench**: Vistas de agente, portal de solicitante y panel administrativo.
6. **Estrategia de Rollback**: Las migraciones de Prisma se diseñan con scripts idempotentes y pasos de reversión (`down migrations`).
