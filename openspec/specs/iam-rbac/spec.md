# IAM and RBAC Specification

## Purpose
Proveer autenticación empresarial robusta, gestión de sesiones seguras mediante tokens con rotación y control de acceso granular basado en roles (RBAC) para proteger todas las entidades operativas del Service Desk.

## Requirements

### Requirement: Enterprise Authentication and Session Security
The system MUST (El sistema DEBE) autenticar usuarios mediante credenciales verificadas criptográficamente (Argon2/Bcrypt), emitiendo tokens de acceso de corta duración (JWT) y refresh tokens almacenados en cookies HttpOnly seguras con rotación automática por sesión.

#### Scenario: Successful agent login
- **WHEN** un usuario introduce credenciales válidas asociadas a un tenant activo
- **THEN** el sistema genera una sesión autenticada, devuelve el token de acceso junto con el perfil del usuario y establece la cookie de refresh token segura

#### Scenario: Refresh token rotation and replay prevention
- **WHEN** un cliente utiliza un refresh token para obtener un nuevo access token
- **THEN** el sistema invalida el refresh token previo, emite uno nuevo y, en caso de detectar reutilización indebida de un token revocado, invalida de inmediato toda la familia de tokens de la sesión

### Requirement: Role-Based Access Control (RBAC) and Custom Permissions
The system MUST (El sistema DEBE) verificar los permisos de acceso antes de autorizar cualquier operación de lectura, creación, actualización o eliminación en la API. Los roles base soportados incluyen SuperAdmin, OrgAdmin, SupportSupervisor, SupportAgent y Requester/EndUser.

#### Scenario: Support agent attempting administrative action
- **WHEN** un usuario con rol `SupportAgent` intenta modificar las políticas de SLA o los ajustes generales del tenant
- **THEN** el middleware de autorización intercepta la petición y retorna código HTTP 403 Forbidden indicando permisos insuficientes

#### Scenario: Requester viewing only own tickets
- **WHEN** un usuario final (Requester) solicita el listado o detalle de tickets
- **THEN** el sistema aplica un filtro mandatorio asegurando que el usuario solo pueda visualizar aquellos tickets donde figure como solicitante o participante explícito
