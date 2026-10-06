import { describe, it, expect } from 'vitest';
import { BusinessHoursCalculator } from '../../src/services/sla/businessHoursCalculator';

describe('Unit: BusinessHoursCalculator (SLA Operating Schedules)', () => {
  const calculator = new BusinessHoursCalculator();

  it('debe sumar minutos directamente cuando el esquema es 24x7', () => {
    const start = new Date('2026-10-05T10:00:00Z');
    const result = calculator.addBusinessMinutes(start, 120, { is24x7: true });

    expect(result.toISOString()).toBe(new Date('2026-10-05T12:00:00Z').toISOString());
  });

  it('debe detectar correctamente si una fecha/hora cae dentro del horario hábil', () => {
    // Lunes a las 10:00 AM (Hábil)
    const mondayMorning = new Date(2026, 9, 5, 10, 0, 0); // 5 de Octubre 2026 es Lunes
    expect(calculator.isBusinessHour(mondayMorning, {})).toBe(true);

    // Lunes a las 20:00 PM (Fuera de horario hábil)
    const mondayNight = new Date(2026, 9, 5, 20, 0, 0);
    expect(calculator.isBusinessHour(mondayNight, {})).toBe(false);

    // Sábado (Fin de semana)
    const saturday = new Date(2026, 9, 10, 11, 0, 0);
    expect(calculator.isBusinessHour(saturday, {})).toBe(false);
  });

  it('debe transferir el tiempo restante al siguiente día hábil si se sobrepasa el horario de cierre (ej. 17:30 + 60 min -> 09:30 día siguiente)', () => {
    // Lunes 5 de Octubre 2026 a las 17:30
    const mondayLate = new Date(2026, 9, 5, 17, 30, 0);

    // Sumar 60 minutos hábiles (30 min el lunes de 17:30 a 18:00, y 30 min el martes de 09:00 a 09:30)
    const result = calculator.addBusinessMinutes(mondayLate, 60, {});

    expect(result.getDate()).toBe(6); // Martes 6 de Octubre
    expect(result.getHours()).toBe(9);
    expect(result.getMinutes()).toBe(30);
  });

  it('debe omitir feriados configurados en el cálculo', () => {
    // Lunes 5 de Octubre 2026 a las 17:30, pero Martes 6 de Octubre es feriado
    const mondayLate = new Date(2026, 9, 5, 17, 30, 0);
    const holidays = ['2026-10-06'];

    const result = calculator.addBusinessMinutes(mondayLate, 60, { holidays });

    // Salta el martes 6 y cae en el Miércoles 7 a las 09:30
    expect(result.getDate()).toBe(7);
    expect(result.getHours()).toBe(9);
    expect(result.getMinutes()).toBe(30);
  });
});
