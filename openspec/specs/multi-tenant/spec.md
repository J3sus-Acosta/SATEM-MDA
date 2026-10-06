# Multi-Tenant Specification

## Purpose
Proveer la infraestructura de aislamiento y gestión multi-inquilino (multi-tenant) lógica para organizaciones independientes, con soporte de resolución por subdominio/cabecera, cuotas de uso y configuraciones corporativas desacopladas.

## Requirements

### Requirement: Tenant Resolution and Isolation
The system MUST (El sistema DEBE) aislar de forma estricta todos los datos, recursos, configuraciones y transacciones de cada organización o cliente inquilino (tenant) mediante un identificador obligatorio `tenant_id` presente en cada consulta y entidad de persistencia.

#### Scenario: Request resolving valid tenant by subdomain or header
- **WHEN** un usuario o cliente realiza una petición HTTP incluyendo el subdominio del inquilino o la cabecera `X-Tenant-ID`
- **THEN** el middleware de contexto resuelve y valida la existencia y estado activo del inquilino, inyectando el `tenant_id` en el contexto de ejecución de la solicitud

#### Scenario: Rejecting cross-tenant access attempts
- **WHEN** una petición autenticada intenta acceder o modificar un recurso (ticket, usuario, regla) perteneciente a otro `tenant_id`
- **THEN** el sistema deniega el acceso retornando error 404 (Not Found) o 403 (Forbidden) sin revelar la existencia del recurso ajeno

### Requirement: Tenant Configuration and Branding
The system MUST (El sistema DEBE) permitir a los administradores de cada inquilino configurar su zona horaria, horarios de operación, logotipo, canales habilitados y políticas de soporte personalizadas.

#### Scenario: Updating tenant settings
- **WHEN** un administrador de organización actualiza la configuración horaria y el nombre visible de su mesa de ayuda
- **THEN** los cambios se persisten de forma aislada y aplican de inmediato a los cálculos de SLA y plantillas de correo de dicho inquilino

### Requirement: Quotas and Subscription Limits
The system MUST (El sistema DEBE) validar los límites de cuota contratados por inquilino (número máximo de agentes activos, almacenamiento de adjuntos y volumen mensual de tickets).

#### Scenario: Agent creation exceeds tenant plan quota
- **WHEN** un administrador intenta activar o invitar un nuevo agente y el total supera el límite asignado al inquilino
- **THEN** el sistema rechaza la operación informando que la cuota de agentes ha sido alcanzada y solicita contactar a ventas o ampliar el plan
