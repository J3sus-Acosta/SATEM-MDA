# SLA Engine Specification

## Purpose
Gestionar políticas de niveles de servicio (SLA) dinámicas, cálculo de tiempos hábiles de primera respuesta y resolución, pausas de SLA por estado y mecanismos de escalamiento automático por riesgo de incumplimiento.

## Requirements

### Requirement: Dynamic SLA Policy Configuration
The system MUST (El sistema DEBE) permitir configurar políticas de SLA asociadas a criterios como prioridad, tipo de cliente/organización, canal de origen y servicio solicitado, especificando umbrales de Tiempo de Primera Respuesta (FRT) y Tiempo de Resolución (RT).

#### Scenario: Matching most specific SLA policy
- **WHEN** se crea un nuevo ticket
- **THEN** el motor evalúa las políticas de SLA ordenadas por especificidad y asigna al ticket las metas de tiempo de la primera política coincidente

### Requirement: Business Hours and SLA Pause Calculation
The system MUST (El sistema DEBE) calcular el cumplimiento de plazos considerando el calendario operativo del tenant (horas laborales de lunes a viernes o esquemas 24/7) y pausar el cronómetro de SLA cuando el ticket se encuentra en estados de espera (como `Pending` esperando al cliente).

#### Scenario: Ticket entered Pending state
- **WHEN** un ticket pasa a estado `Pending` a la espera de información del cliente
- **THEN** el sistema registra la fecha y hora de inicio de la pausa y detiene el conteo del tiempo de resolución hasta que el ticket vuelva a `Open`

#### Scenario: Business hours elapsed computation
- **WHEN** se computa el vencimiento de una meta con SLA de horario de oficina (09:00 a 18:00) y se crea un ticket a las 17:30
- **THEN** los minutos restantes se trasladan al inicio del siguiente día hábil a las 09:00

### Requirement: SLA Breach Warning and Escalation Triggers
The system MUST (El sistema DEBE) monitorear proactivamente el tiempo restante y disparar alertas de advertencia cuando se alcanza un porcentaje configurable (por ejemplo, 80% del tiempo transcurrido) o marcar el estado de `Breached` cuando se sobrepasa la meta.

#### Scenario: Warning escalation trigger fired
- **WHEN** el tiempo restante para la primera respuesta llega al 20% del total asignado
- **THEN** el sistema notifica al supervisor del grupo y cambia el indicador visual del ticket a advertencia de SLA
