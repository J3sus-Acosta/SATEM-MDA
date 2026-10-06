import { TicketPriority, TicketStatus } from '@prisma/client';
import { businessHoursCalculator, ScheduleConfig } from './businessHoursCalculator';
import { getTenantPrisma } from '../../infrastructure/database/prismaClient';

export interface SlaTargetRule {
  priority: TicketPriority;
  firstResponseMins: number;
  resolutionMins: number;
  warningThresholdPct: number;
}

export type SlaHealthStatus = 'MET' | 'PENDING' | 'PAUSED' | 'WARNING' | 'BREACHED';

export class SlaEngineService {
  calculateDueDates(
    createdAt: Date,
    target: SlaTargetRule,
    scheduleConfig: ScheduleConfig = {}
  ): { firstResponseDueAt: Date; resolutionDueAt: Date } {
    const firstResponseDueAt = businessHoursCalculator.addBusinessMinutes(
      createdAt,
      target.firstResponseMins,
      scheduleConfig
    );

    const resolutionDueAt = businessHoursCalculator.addBusinessMinutes(
      createdAt,
      target.resolutionMins,
      scheduleConfig
    );

    return { firstResponseDueAt, resolutionDueAt };
  }

  evaluateHealth(
    dueAt: Date | null | undefined,
    completedAt: Date | null | undefined,
    isPaused: boolean,
    now: Date = new Date(),
    warningThresholdPct: number = 80,
    totalMinutesAllowed?: number
  ): SlaHealthStatus {
    if (!dueAt) return 'PENDING';

    // Si ya se cumplió la meta
    if (completedAt) {
      return completedAt <= dueAt ? 'MET' : 'BREACHED';
    }

    if (isPaused) {
      return 'PAUSED';
    }

    // Si la fecha actual ya superó la fecha límite
    if (now > dueAt) {
      return 'BREACHED';
    }

    // Cálculo de advertencia por umbral
    if (totalMinutesAllowed && totalMinutesAllowed > 0) {
      const remainingMs = dueAt.getTime() - now.getTime();
      const totalMs = totalMinutesAllowed * 60 * 1000;
      const remainingPct = (remainingMs / totalMs) * 100;
      const elapsedPct = 100 - remainingPct;

      if (elapsedPct >= warningThresholdPct) {
        return 'WARNING';
      }
    }

    return 'PENDING';
  }

  calculateResumedDueDate(
    previousDueAt: Date,
    pausedAt: Date,
    resumedAt: Date,
    scheduleConfig: ScheduleConfig = {}
  ): Date {
    const pausedBusinessMins = businessHoursCalculator.calculateBusinessMinutesBetween(
      pausedAt,
      resumedAt,
      scheduleConfig
    );
    return businessHoursCalculator.addBusinessMinutes(previousDueAt, pausedBusinessMins, scheduleConfig);
  }
}

export const slaEngineService = new SlaEngineService();
