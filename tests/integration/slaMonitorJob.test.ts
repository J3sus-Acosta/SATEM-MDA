import { describe, it, expect, vi } from 'vitest';
import { SlaMonitorJob } from '../../src/jobs/slaMonitorJob';
import { prisma } from '../../src/infrastructure/database/prismaClient';

describe('Integration: SlaMonitorJob (Periodic Background Monitoring)', () => {
  it('debe emitir eventos sla:warning y sla:breached al detectar tickets en riesgo o vencidos', async () => {
    const emittedEvents: Array<{ event: string; payload: any }> = [];
    const mockEmitter = {
      emit: (event: string, payload: any) => {
        emittedEvents.push({ event, payload });
      },
    };

    const monitor = new SlaMonitorJob(mockEmitter);

    const now = new Date('2026-10-05T12:00:00Z');

    // Mock active tickets
    vi.spyOn(prisma.ticket, 'findMany').mockResolvedValue([
      // Ticket 1: En advertencia (dueAt a las 12:10, 50 min pasados de 60 min)
      {
        id: 'ticket-warn-1',
        tenantId: 'tenant-1',
        priority: 'HIGH',
        status: 'OPEN',
        isSlaPaused: false,
        firstRespondedAt: null,
        firstResponseDueAt: new Date('2026-10-05T12:10:00Z'),
        resolvedAt: null,
        resolutionDueAt: null,
        slaPolicy: {
          targets: [{ priority: 'HIGH', firstResponseMins: 60, resolutionMins: 240, warningThresholdPct: 80 }],
        },
      } as any,
      // Ticket 2: Vencido (dueAt a las 11:30, ya son las 12:00)
      {
        id: 'ticket-breach-2',
        tenantId: 'tenant-1',
        priority: 'URGENT',
        status: 'OPEN',
        isSlaPaused: false,
        firstRespondedAt: null,
        firstResponseDueAt: new Date('2026-10-05T11:30:00Z'),
        resolvedAt: null,
        resolutionDueAt: null,
        slaPolicy: {
          targets: [{ priority: 'URGENT', firstResponseMins: 30, resolutionMins: 120, warningThresholdPct: 80 }],
        },
      } as any,
    ]);

    const result = await monitor.runCheck(now);

    expect(result.checkedCount).toBe(2);
    expect(result.warnings).toBe(1);
    expect(result.breaches).toBe(1);

    expect(emittedEvents.some((e) => e.event === 'sla:warning' && e.payload.ticketId === 'ticket-warn-1')).toBe(true);
    expect(emittedEvents.some((e) => e.event === 'sla:breached' && e.payload.ticketId === 'ticket-breach-2')).toBe(true);
  });
});
