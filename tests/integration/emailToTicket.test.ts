import { describe, it, expect, vi } from 'vitest';
import { EmailInboundService } from '../../src/services/multichannel/emailInboundService';
import * as prismaModule from '../../src/infrastructure/database/prismaClient';
import { ticketService } from '../../src/services/ticketService';
import { ticketMessageService } from '../../src/services/ticketMessageService';

describe('Integration: Email-to-Ticket Inbound Processor', () => {
  const service = new EmailInboundService();

  it('debe crear un nuevo ticket cuando el correo no contiene código previo', async () => {
    const mockPrisma = {
      user: {
        findFirst: vi.fn().mockResolvedValue({ id: 'u-1', email: 'cliente@acme.cl', role: 'REQUESTER' }),
      },
      ticket: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    };
    vi.spyOn(prismaModule, 'getTenantPrisma').mockReturnValue(mockPrisma as any);

    vi.spyOn(ticketService, 'createTicket').mockResolvedValue({
      id: 'ticket-new-1',
      ticketCode: 'TICK-1050',
    } as any);

    const result = await service.processInboundEmail('tenant-1', {
      from: 'Juan Pérez <cliente@acme.cl>',
      to: 'soporte@satem.cl',
      subject: 'Problema al emitir liquidaciones',
      textBody: 'El módulo no calcula horas extras correctamente.',
      messageId: '<msg-id-001@acme.cl>',
    });

    expect(result.action).toBe('CREATED');
    expect(result.ticketCode).toBe('TICK-1050');
  });

  it('debe asociar la respuesta al ticket existente si el asunto contiene el código [TICK-1001]', async () => {
    const mockPrisma = {
      user: {
        findFirst: vi.fn().mockResolvedValue({ id: 'u-1', email: 'cliente@acme.cl', role: 'REQUESTER' }),
      },
      ticket: {
        findFirst: vi.fn().mockResolvedValue({ id: 'ticket-1001', ticketCode: 'TICK-1001' }),
      },
    };
    vi.spyOn(prismaModule, 'getTenantPrisma').mockReturnValue(mockPrisma as any);

    vi.spyOn(ticketMessageService, 'addMessage').mockResolvedValue({
      id: 'msg-reply-99',
    } as any);

    const result = await service.processInboundEmail('tenant-1', {
      from: 'cliente@acme.cl',
      to: 'soporte@satem.cl',
      subject: 'Re: [TICK-1001] Problema al emitir liquidaciones',
      textBody: 'Adjunto pantallazo solicitado.',
      messageId: '<msg-id-002@acme.cl>',
      inReplyTo: '<prev-msg@satem.cl>',
    });

    expect(result.action).toBe('APPENDED');
    expect(result.ticketId).toBe('ticket-1001');
    expect(result.messageId).toBe('msg-reply-99');
  });
});
