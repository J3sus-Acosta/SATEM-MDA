import { describe, it, expect, vi } from 'vitest';
import { TicketMessageService } from '../../src/services/ticketMessageService';
import * as prismaModule from '../../src/infrastructure/database/prismaClient';

describe('Integration: Ticket Message Privacy (Public vs Internal Notes)', () => {
  const service = new TicketMessageService();

  it('debe rechazar a un Requester que intente crear una nota interna (INTERNAL_NOTE)', async () => {
    const author = { id: 'req-1', role: 'REQUESTER' as const };

    await expect(
      service.addMessage('tenant-1', 'ticket-1', author, {
        type: 'INTERNAL_NOTE',
        body: 'Nota que no debería poder crear',
      })
    ).rejects.toThrow('UNAUTHORIZED_NOTE');
  });

  it('debe excluir estrictamente las notas internas cuando consulta un Requester', async () => {
    const mockPrisma = {
      ticketMessage: {
        findMany: vi.fn().mockImplementation(({ where }) => {
          expect(where.type).toBe('PUBLIC_REPLY');
          return [
            { id: 'msg-1', type: 'PUBLIC_REPLY', body: 'Hola, estamos revisando su caso.' },
          ];
        }),
      },
    };
    vi.spyOn(prismaModule, 'getTenantPrisma').mockReturnValue(mockPrisma as any);

    const requesterUser = { id: 'req-1', role: 'REQUESTER' as const };
    const messages = await service.getMessagesForUser('tenant-1', 'ticket-1', requesterUser);

    expect(messages.length).toBe(1);
    expect(messages[0].type).toBe('PUBLIC_REPLY');
    expect(mockPrisma.ticketMessage.findMany).toHaveBeenCalled();
  });

  it('debe incluir tanto notas públicas como internas cuando consulta un SupportAgent', async () => {
    const mockPrisma = {
      ticketMessage: {
        findMany: vi.fn().mockImplementation(({ where }) => {
          expect(where.type).toBeUndefined(); // Sin filtro restrictivo
          return [
            { id: 'msg-1', type: 'PUBLIC_REPLY', body: 'Respuesta al cliente' },
            { id: 'msg-2', type: 'INTERNAL_NOTE', body: 'Nota interna: sospecha de bug en auth' },
          ];
        }),
      },
    };
    vi.spyOn(prismaModule, 'getTenantPrisma').mockReturnValue(mockPrisma as any);

    const agentUser = { id: 'agent-1', role: 'SUPPORT_AGENT' as const };
    const messages = await service.getMessagesForUser('tenant-1', 'ticket-1', agentUser);

    expect(messages.length).toBe(2);
    expect(messages.some((m) => m.type === 'INTERNAL_NOTE')).toBe(true);
  });
});
