import { describe, it, expect, vi } from 'vitest';
import { ApiClient } from '../../frontend/src/api/client';
import { TicketClientService } from '../../frontend/src/services/ticketClientService';

describe('Unit: TicketClientService Resilient Adapter', () => {
  it('debe mapear tickets del backend cuando la llamada es exitosa', async () => {
    const mockClient = new ApiClient('/api/v1');
    const mockRawTickets = [
      {
        id: 't-100',
        ticketCode: 'TICK-1001',
        title: 'Falla Servidor',
        status: 'OPEN',
        priority: 'HIGH',
        requester: { fullName: 'Juan' },
        assignee: { fullName: 'Pedro' },
        isSlaPaused: false,
      },
    ];

    vi.spyOn(mockClient, 'request').mockResolvedValue({
      success: true,
      data: mockRawTickets,
    });

    const service = new TicketClientService(mockClient);
    const result = await service.fetchTickets([]);

    expect(result.isLive).toBe(true);
    expect(result.tickets).toHaveLength(1);
    expect(result.tickets[0].ticketCode).toBe('TICK-1001');
    expect(result.tickets[0].requesterName).toBe('Juan');
    expect(service.isApiLive()).toBe(true);
  });

  it('debe recurrir a datos fallback locales cuando la API no responde o falla', async () => {
    const mockClient = new ApiClient('/api/v1');
    vi.spyOn(mockClient, 'request').mockRejectedValue(new Error('Network error'));

    const fallbackTickets = [
      {
        id: 'local-1',
        ticketCode: 'TICK-LOCAL',
        title: 'Ticket en Memoria',
        requesterName: 'Local User',
        status: 'OPEN' as const,
        priority: 'LOW' as const,
        slaHealth: 'MET' as const,
        slaDueText: 'Vence en 5h',
      },
    ];

    const service = new TicketClientService(mockClient);
    const result = await service.fetchTickets(fallbackTickets);

    expect(result.isLive).toBe(false);
    expect(result.tickets).toHaveLength(1);
    expect(result.tickets[0].ticketCode).toBe('TICK-LOCAL');
    expect(service.isApiLive()).toBe(false);
  });

  it('debe verificar la salud del backend con checkHealth', async () => {
    const mockClient = new ApiClient('/api/v1');
    vi.spyOn(mockClient, 'request').mockResolvedValue({ success: true, data: { status: 'ok' } });

    const service = new TicketClientService(mockClient);
    const isOnline = await service.checkHealth();

    expect(isOnline).toBe(true);
    expect(service.isApiLive()).toBe(true);
  });
});
