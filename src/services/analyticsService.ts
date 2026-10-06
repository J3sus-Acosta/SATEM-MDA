export interface TicketStatsData {
  createdAt: Date;
  firstRespondedAt?: Date | null;
  firstResponseDueAt?: Date | null;
  resolvedAt?: Date | null;
  resolutionDueAt?: Date | null;
  status: string;
  priority: string;
}

export interface AnalyticsSummary {
  totalTickets: number;
  openTickets: number;
  solvedTickets: number;
  mtfrMinutes: number; // Mean Time to First Response
  mttrMinutes: number; // Mean Time to Resolution
  slaCompliancePct: number;
  csatAverage: number;
}

export class AnalyticsService {
  computeSummary(tickets: TicketStatsData[], csatRatings: number[] = []): AnalyticsSummary {
    if (tickets.length === 0) {
      return {
        totalTickets: 0,
        openTickets: 0,
        solvedTickets: 0,
        mtfrMinutes: 0,
        mttrMinutes: 0,
        slaCompliancePct: 100,
        csatAverage: csatRatings.length > 0 ? this.calculateAverage(csatRatings) : 5.0,
      };
    }

    let totalResponseTimeMs = 0;
    let respondedTicketsCount = 0;

    let totalResolutionTimeMs = 0;
    let resolvedTicketsCount = 0;

    let slaMetCount = 0;
    let slaEvaluatedCount = 0;

    let openTickets = 0;
    let solvedTickets = 0;

    for (const t of tickets) {
      if (['SOLVED', 'CLOSED'].includes(t.status)) {
        solvedTickets++;
      } else {
        openTickets++;
      }

      // MTFR
      if (t.firstRespondedAt) {
        respondedTicketsCount++;
        totalResponseTimeMs += t.firstRespondedAt.getTime() - t.createdAt.getTime();
      }

      // MTTR
      if (t.resolvedAt) {
        resolvedTicketsCount++;
        totalResolutionTimeMs += t.resolvedAt.getTime() - t.createdAt.getTime();
      }

      // Cumplimiento SLA
      let isMet = true;
      let evaluated = false;

      if (t.firstResponseDueAt && t.firstRespondedAt) {
        evaluated = true;
        if (t.firstRespondedAt > t.firstResponseDueAt) isMet = false;
      }

      if (t.resolutionDueAt && t.resolvedAt) {
        evaluated = true;
        if (t.resolvedAt > t.resolutionDueAt) isMet = false;
      }

      if (evaluated) {
        slaEvaluatedCount++;
        if (isMet) slaMetCount++;
      }
    }

    const mtfrMinutes =
      respondedTicketsCount > 0 ? Math.round(totalResponseTimeMs / respondedTicketsCount / 60000) : 0;

    const mttrMinutes =
      resolvedTicketsCount > 0 ? Math.round(totalResolutionTimeMs / resolvedTicketsCount / 60000) : 0;

    const slaCompliancePct =
      slaEvaluatedCount > 0 ? Math.round((slaMetCount / slaEvaluatedCount) * 100) : 100;

    const csatAverage = csatRatings.length > 0 ? this.calculateAverage(csatRatings) : 5.0;

    return {
      totalTickets: tickets.length,
      openTickets,
      solvedTickets,
      mtfrMinutes,
      mttrMinutes,
      slaCompliancePct,
      csatAverage,
    };
  }

  private calculateAverage(numbers: number[]): number {
    const sum = numbers.reduce((acc, curr) => acc + curr, 0);
    return Math.round((sum / numbers.length) * 10) / 10;
  }
}

export const analyticsService = new AnalyticsService();
