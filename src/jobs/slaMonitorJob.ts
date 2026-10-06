import { prisma } from '../infrastructure/database/prismaClient';
import { slaEngineService, SlaHealthStatus } from '../services/sla/slaEngineService';

export interface SlaMonitorEventEmitter {
  emit(event: string, payload: unknown): void;
}

export class SlaMonitorJob {
  private eventEmitter?: SlaMonitorEventEmitter;
  private intervalTimer?: NodeJS.Timeout;

  constructor(eventEmitter?: SlaMonitorEventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  setEventEmitter(emitter: SlaMonitorEventEmitter) {
    this.eventEmitter = emitter;
  }

  async runCheck(now: Date = new Date()): Promise<{ checkedCount: number; warnings: number; breaches: number }> {
    // 1. Obtener tickets activos sin pausar
    const activeTickets = await prisma.ticket.findMany({
      where: {
        status: { in: ['NEW', 'OPEN'] },
        isSlaPaused: false,
      },
      include: {
        slaPolicy: {
          include: { targets: true },
        },
      },
    });

    let warnings = 0;
    let breaches = 0;

    for (const ticket of activeTickets) {
      const target = ticket.slaPolicy?.targets.find((t) => t.priority === ticket.priority);
      const frtMins = target?.firstResponseMins || 60;
      const resMins = target?.resolutionMins || 480;

      // 1. Evaluar Primera Respuesta (FRT)
      if (!ticket.firstRespondedAt && ticket.firstResponseDueAt) {
        const frtHealth = slaEngineService.evaluateHealth(
          ticket.firstResponseDueAt,
          ticket.firstRespondedAt,
          ticket.isSlaPaused,
          now,
          80,
          frtMins
        );

        if (frtHealth === 'BREACHED') {
          breaches++;
          this.eventEmitter?.emit('sla:breached', {
            ticketId: ticket.id,
            tenantId: ticket.tenantId,
            metric: 'FIRST_RESPONSE',
            dueAt: ticket.firstResponseDueAt,
          });
        } else if (frtHealth === 'WARNING') {
          warnings++;
          this.eventEmitter?.emit('sla:warning', {
            ticketId: ticket.id,
            tenantId: ticket.tenantId,
            metric: 'FIRST_RESPONSE',
            dueAt: ticket.firstResponseDueAt,
          });
        }
      }

      // 2. Evaluar Resolución (RT)
      if (!ticket.resolvedAt && ticket.resolutionDueAt) {
        const resHealth = slaEngineService.evaluateHealth(
          ticket.resolutionDueAt,
          ticket.resolvedAt,
          ticket.isSlaPaused,
          now,
          80,
          resMins
        );

        if (resHealth === 'BREACHED') {
          breaches++;
          this.eventEmitter?.emit('sla:breached', {
            ticketId: ticket.id,
            tenantId: ticket.tenantId,
            metric: 'RESOLUTION',
            dueAt: ticket.resolutionDueAt,
          });
        } else if (resHealth === 'WARNING') {
          warnings++;
          this.eventEmitter?.emit('sla:warning', {
            ticketId: ticket.id,
            tenantId: ticket.tenantId,
            metric: 'RESOLUTION',
            dueAt: ticket.resolutionDueAt,
          });
        }
      }
    }

    return {
      checkedCount: activeTickets.length,
      warnings,
      breaches,
    };
  }

  start(intervalMs: number = 60000) {
    if (this.intervalTimer) return;
    this.intervalTimer = setInterval(() => {
      this.runCheck().catch((err) => console.error('Error en SlaMonitorJob:', err));
    }, intervalMs);
  }

  stop() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = undefined;
    }
  }
}

export const slaMonitorJob = new SlaMonitorJob();
