import { describe, it, expect } from 'vitest';
import { AnalyticsService } from '../../src/services/analyticsService';

describe('Unit: AnalyticsService (MTTR, MTFR, SLA Compliance & CSAT)', () => {
  const service = new AnalyticsService();

  it('debe calcular métricas operativas con precisión matemática', () => {
    const baseDate = new Date('2026-10-05T10:00:00Z');

    const sampleTickets = [
      // Ticket 1: Respuesta en 20 min, resuelto en 60 min. Cumplió SLA.
      {
        createdAt: baseDate,
        firstRespondedAt: new Date(baseDate.getTime() + 20 * 60000),
        firstResponseDueAt: new Date(baseDate.getTime() + 30 * 60000),
        resolvedAt: new Date(baseDate.getTime() + 60 * 60000),
        resolutionDueAt: new Date(baseDate.getTime() + 120 * 60000),
        status: 'SOLVED',
        priority: 'HIGH',
      },
      // Ticket 2: Respuesta en 40 min (incumplió primera respuesta que vencía en 30 min). Resuelto en 100 min.
      {
        createdAt: baseDate,
        firstRespondedAt: new Date(baseDate.getTime() + 40 * 60000),
        firstResponseDueAt: new Date(baseDate.getTime() + 30 * 60000),
        resolvedAt: new Date(baseDate.getTime() + 100 * 60000),
        resolutionDueAt: new Date(baseDate.getTime() + 120 * 60000),
        status: 'SOLVED',
        priority: 'HIGH',
      },
    ];

    const csatRatings = [5, 4, 5, 5, 4]; // Promedio: 4.6

    const summary = service.computeSummary(sampleTickets, csatRatings);

    expect(summary.totalTickets).toBe(2);
    expect(summary.solvedTickets).toBe(2);
    // MTFR: (20 + 40) / 2 = 30 minutos
    expect(summary.mtfrMinutes).toBe(30);
    // MTTR: (60 + 100) / 2 = 80 minutos
    expect(summary.mttrMinutes).toBe(80);
    // Cumplimiento SLA: 1 de 2 cumplió ambas metas = 50%
    expect(summary.slaCompliancePct).toBe(50);
    // CSAT promedio: 4.6
    expect(summary.csatAverage).toBe(4.6);
  });
});
