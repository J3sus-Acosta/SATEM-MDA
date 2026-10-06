import { describe, it, expect, vi } from 'vitest';
import { MacroService } from '../../src/services/macroService';
import * as prismaModule from '../../src/infrastructure/database/prismaClient';
import { ticketMessageService } from '../../src/services/ticketMessageService';
import { ticketService } from '../../src/services/ticketService';

describe('Integration: Macro Execution on Tickets', () => {
  const service = new MacroService();

  it('debe ejecutar concurrentemente las acciones de la macro (insertar respuesta y cambiar estado)', async () => {
    const mockPrisma = {
      macro: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'macro-123',
          title: 'Pedir más antecedentes',
          actions: [
            { type: 'INSERT_REPLY', value: 'Estimado cliente, favor adjuntar captura de pantalla.' },
            { type: 'SET_STATUS', value: 'PENDING' },
          ],
        }),
      },
      ticket: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        findFirst: vi.fn().mockResolvedValue({ id: 't-1', tags: [] }),
      },
    };
    vi.spyOn(prismaModule, 'getTenantPrisma').mockReturnValue(mockPrisma as any);

    const messageSpy = vi.spyOn(ticketMessageService, 'addMessage').mockResolvedValue({
      id: 'msg-created-01',
    } as any);

    const statusSpy = vi.spyOn(ticketService, 'updateTicketStatus').mockResolvedValue({ count: 1 } as any);

    const author = { id: 'agent-1', role: 'SUPPORT_AGENT' as const };
    const result = await service.applyMacro('tenant-1', 'ticket-100', 'macro-123', author);

    expect(result.success).toBe(true);
    expect(result.appliedMacroId).toBe('macro-123');
    expect(messageSpy).toHaveBeenCalledWith(
      'tenant-1',
      'ticket-100',
      author,
      expect.objectContaining({ type: 'PUBLIC_REPLY', body: expect.stringContaining('favor adjuntar') })
    );
    expect(statusSpy).toHaveBeenCalledWith('tenant-1', 'ticket-100', 'PENDING', 'agent-1');
  });
});
