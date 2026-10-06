# Search and Analytics Specification

## Purpose
Proveer búsqueda avanzada de texto completo con filtros facetados multidimensionales, agregación de métricas operativas y paneles de rendimiento analítico del Service Desk para supervisión y toma de decisiones.

## Requirements

### Requirement: Advanced Faceted Ticket Search
The system MUST (El sistema DEBE) permitir búsquedas rápidas sobre tickets combinando términos de texto libre (título, descripción, comentarios) con filtros combinados por estado, prioridad, agente asignado, grupo resolutor, etiquetas, fechas y campos personalizados.

#### Scenario: Agent filters open urgent tickets with keyword
- **WHEN** un agente busca la palabra "servidor" filtrando por estado `Open` y prioridad `Urgent`
- **THEN** el sistema retorna los tickets coincidentes paginados en menos de 300 ms, respetando las restricciones de tenant y permisos del usuario

### Requirement: Operational Service Desk Analytics and CSAT Metrics
The system MUST (El sistema DEBE) calcular y presentar tableros con indicadores clave de desempeño (KPIs): Tiempo Medio de Primera Respuesta (MTFR), Tiempo Medio de Resolución (MTTR), tasa de cumplimiento de SLA, volumen de tickets creados vs cerrados y encuestas de satisfacción del cliente (CSAT).

#### Scenario: Customer rates solved ticket
- **WHEN** un solicitante responde la encuesta CSAT recibida tras el cierre de su ticket asignando una calificación y comentario
- **THEN** el sistema almacena el feedback, lo vincula al ticket y actualiza las métricas consolidadas del agente y del tenant

#### Scenario: Supervisor reviews SLA breach trends
- **WHEN** un supervisor consulta el panel analítico del período actual
- **THEN** la plataforma visualiza el porcentaje de cumplimiento de SLA segmentado por grupo y resalta los principales motivos de demora
