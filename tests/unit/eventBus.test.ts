import { describe, it, expect, vi } from 'vitest';
import { TypedEventBus, TicketCreatedEvent } from '../../src/infrastructure/events/eventBus';

describe('Unit: TypedEventBus (Asynchronous Event-Driven Decoupling)', () => {
  it('debe registrar oyentes y recibir eventos tipados emitidos', async () => {
    const bus = new TypedEventBus();
    const handler = vi.fn();

    bus.on('ticket:created', handler);

    const eventPayload: TicketCreatedEvent = {
      ticketId: 't-123',
      tenantId: 'tenant-1',
      ticketCode: 'TICK-1001',
      title: 'Problema de red',
      priority: 'HIGH',
      requesterId: 'u-1',
    };

    bus.emit('ticket:created', eventPayload);

    // Permitir ciclo de eventos microtask
    await new Promise((r) => setTimeout(r, 10));

    expect(handler).toHaveBeenCalledWith(eventPayload);
  });

  it('debe capturar errores en los oyentes sin romper el despachador de eventos', async () => {
    const bus = new TypedEventBus();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    bus.on('sla:breached', () => {
      throw new Error('Fallo simulado en oyente externo');
    });

    expect(() => {
      bus.emit('sla:breached', {
        ticketId: 't-99',
        tenantId: 'tenant-1',
        metric: 'RESOLUTION',
        dueAt: new Date(),
      });
    }).not.toThrow();

    await new Promise((r) => setTimeout(r, 10));
    expect(consoleSpy).toHaveBeenCalled();
  });
});
