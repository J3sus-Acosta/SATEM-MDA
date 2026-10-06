import { describe, it, expect } from 'vitest';
import { SlaEngineService } from '../../src/services/sla/slaEngineService';

describe('Unit: SlaEngineService (SLA Calculation and Health Monitoring)', () => {
  const service = new SlaEngineService();

  it('debe calcular las metas de primera respuesta y resolución según la prioridad', () => {
    const createdAt = new Date('2026-10-05T10:00:00Z');
    const target = {
      priority: 'URGENT' as const,
      firstResponseMins: 30,
      resolutionMins: 120,
      warningThresholdPct: 80,
    };

    const { firstResponseDueAt, resolutionDueAt } = service.calculateDueDates(createdAt, target, { is24x7: true });

    expect(firstResponseDueAt.toISOString()).toBe('2026-10-05T10:30:00.000Z');
    expect(resolutionDueAt.toISOString()).toBe('2026-10-05T12:00:00.000Z');
  });

  it('debe clasificar el estado de salud como MET si se respondió antes del vencimiento', () => {
    const dueAt = new Date('2026-10-05T10:30:00Z');
    const respondedAt = new Date('2026-10-05T10:15:00Z');

    const health = service.evaluateHealth(dueAt, respondedAt, false);
    expect(health).toBe('MET');
  });

  it('debe clasificar el estado como PAUSED si el ticket está pausado esperando cliente', () => {
    const dueAt = new Date('2026-10-05T12:00:00Z');
    const health = service.evaluateHealth(dueAt, null, true);
    expect(health).toBe('PAUSED');
  });

  it('debe clasificar el estado como WARNING si ha transcurrido más del 80% del tiempo', () => {
    const dueAt = new Date('2026-10-05T11:00:00Z');
    // Ahora son las 10:50 (50 min transcurridos de 60 min totales = 83.3%)
    const now = new Date('2026-10-05T10:50:00Z');

    const health = service.evaluateHealth(dueAt, null, false, now, 80, 60);
    expect(health).toBe('WARNING');
  });

  it('debe clasificar el estado como BREACHED si el tiempo actual superó la meta', () => {
    const dueAt = new Date('2026-10-05T11:00:00Z');
    const now = new Date('2026-10-05T11:05:00Z'); // 5 minutos tarde

    const health = service.evaluateHealth(dueAt, null, false, now);
    expect(health).toBe('BREACHED');
  });

  it('debe prorrogar la fecha de vencimiento cuando se reanuda un SLA pausado', () => {
    const previousDueAt = new Date('2026-10-05T12:00:00Z');
    const pausedAt = new Date('2026-10-05T10:00:00Z');
    const resumedAt = new Date('2026-10-05T11:00:00Z'); // 60 minutos en pausa

    const newDueAt = service.calculateResumedDueDate(previousDueAt, pausedAt, resumedAt, { is24x7: true });

    // La fecha límite se desplaza 60 minutos hacia adelante
    expect(newDueAt.toISOString()).toBe('2026-10-05T13:00:00.000Z');
  });
});
