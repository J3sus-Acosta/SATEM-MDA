import { describe, it, expect, vi } from 'vitest';
import { SearchService } from '../../src/services/searchService';
import * as prismaModule from '../../src/infrastructure/database/prismaClient';

describe('Integration: Faceted Search & Performance Benchmarks', () => {
  const service = new SearchService();

  it('debe ejecutar búsquedas facetadas combinadas y retornar en menos de 300 ms', async () => {
    const mockPrisma = {
      ticket: {
        findMany: vi.fn().mockImplementation(() => {
          return Promise.resolve([
            {
              id: 't-1',
              ticketCode: 'TICK-1001',
              title: 'Incidente de servidor SQL',
              description: 'El motor no responde conexiones',
              status: 'OPEN',
              priority: 'URGENT',
            },
          ]);
        }),
        count: vi.fn().mockResolvedValue(1),
      },
    };
    vi.spyOn(prismaModule, 'getTenantPrisma').mockReturnValue(mockPrisma as any);

    const result = await service.searchTickets('tenant-1', {
      query: 'servidor',
      statuses: ['OPEN', 'NEW'],
      priorities: ['URGENT'],
      page: 1,
      limit: 20,
    });

    expect(result.total).toBe(1);
    expect(result.tickets.length).toBe(1);
    expect(result.tickets[0].ticketCode).toBe('TICK-1001');
    expect(result.executionTimeMs).toBeLessThan(300);
    expect(mockPrisma.ticket.findMany).toHaveBeenCalled();
  });
});
