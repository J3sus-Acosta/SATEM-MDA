export interface DaySchedule {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startHour: number; // e.g. 9
  startMinute: number; // e.g. 0
  endHour: number; // e.g. 18
  endMinute: number; // e.g. 0
}

export interface ScheduleConfig {
  timezone?: string;
  is24x7?: boolean;
  schedule?: DaySchedule[];
  holidays?: string[]; // 'YYYY-MM-DD'
}

export const DEFAULT_WORK_SCHEDULE: DaySchedule[] = [
  { dayOfWeek: 1, startHour: 9, startMinute: 0, endHour: 18, endMinute: 0 },
  { dayOfWeek: 2, startHour: 9, startMinute: 0, endHour: 18, endMinute: 0 },
  { dayOfWeek: 3, startHour: 9, startMinute: 0, endHour: 18, endMinute: 0 },
  { dayOfWeek: 4, startHour: 9, startMinute: 0, endHour: 18, endMinute: 0 },
  { dayOfWeek: 5, startHour: 9, startMinute: 0, endHour: 18, endMinute: 0 },
];

export class BusinessHoursCalculator {
  isHoliday(date: Date, holidays: string[] = []): boolean {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const formatted = `${yyyy}-${mm}-${dd}`;
    return holidays.includes(formatted);
  }

  isBusinessHour(date: Date, config: ScheduleConfig): boolean {
    if (config.is24x7) return true;
    if (this.isHoliday(date, config.holidays)) return false;

    const schedule = config.schedule || DEFAULT_WORK_SCHEDULE;
    const day = date.getDay();
    const dayRule = schedule.find((s) => s.dayOfWeek === day);
    if (!dayRule) return false;

    const currentMinutes = date.getHours() * 60 + date.getMinutes();
    const startMinutes = dayRule.startHour * 60 + dayRule.startMinute;
    const endMinutes = dayRule.endHour * 60 + dayRule.endMinute;

    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }

  addBusinessMinutes(startDate: Date, minutesToAdd: number, config: ScheduleConfig): Date {
    if (config.is24x7) {
      return new Date(startDate.getTime() + minutesToAdd * 60 * 1000);
    }

    const current = new Date(startDate);
    let remainingMinutes = minutesToAdd;

    while (remainingMinutes > 0) {
      // Si el minuto actual cae en horario laboral
      if (this.isBusinessHour(current, config)) {
        remainingMinutes--;
      }
      current.setMinutes(current.getMinutes() + 1);
    }

    return current;
  }

  calculateBusinessMinutesBetween(start: Date, end: Date, config: ScheduleConfig): number {
    if (end <= start) return 0;
    if (config.is24x7) {
      return Math.floor((end.getTime() - start.getTime()) / (60 * 1000));
    }

    let businessMinutes = 0;
    const current = new Date(start);

    while (current < end) {
      if (this.isBusinessHour(current, config)) {
        businessMinutes++;
      }
      current.setMinutes(current.getMinutes() + 1);
    }

    return businessMinutes;
  }
}

export const businessHoursCalculator = new BusinessHoursCalculator();
