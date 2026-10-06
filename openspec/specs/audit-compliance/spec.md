# Audit Compliance Specification

## Purpose
Garantizar la trazabilidad exhaustiva, inmutabilidad y transparencia forense de todas las operaciones administrativas, cambios en tickets, accesos de usuarios y alteraciones de configuración en la plataforma.

## Requirements

### Requirement: Immutable Audit Logging
The system MUST (El sistema DEBE) registrar de manera inmutable y transaccional cada operación crítica (creación, modificación, eliminación, cambio de estado, inicio de sesión y exportación de datos), capturando `tenant_id`, `user_id`, timestamp UTC, dirección IP, agente de usuario (User-Agent), acción ejecutada y el diff estructurado (valores previos y posteriores).

#### Scenario: Agent modifies ticket priority and assignment
- **WHEN** un agente actualiza la prioridad de un ticket y lo transfiere a otro grupo
- **THEN** se almacena un registro en el log de auditoría con la entidad modificada, los campos afectados con sus valores anteriores y nuevos, y el autor del cambio

#### Scenario: Tampering prevention of audit records
- **WHEN** cualquier usuario, independientemente de su rol, intenta modificar o borrar un registro existente de auditoría
- **THEN** la capa de acceso a datos rechaza terminantemente la operación ya que la tabla de auditoría solo admite operaciones de inserción (`APPEND-ONLY`)

### Requirement: Compliance Querying and Log Exporting
The system MUST (El sistema DEBE) permitir a los administradores y oficiales de seguridad consultar, filtrar por rango temporal o actor y exportar los registros de auditoría en formatos estándar (JSON / CSV).

#### Scenario: Exporting audit trail for security review
- **WHEN** un administrador de organización solicita el reporte de auditoría del último mes
- **THEN** el sistema genera una descarga protegida con los eventos correspondientes exclusivamente a su `tenant_id`
