import { describe, it, expect, vi } from 'vitest';
import { TicketService } from '../../src/services/ticketService';
import { prisma } from '../../src/infrastructure/database/prismaClient';

describe('Unit: Ticket Lifecycle and Transitions', () => {
  const ticketService = new TicketService();

  it('debe generar códigos correlativos por tenant (TICK-1001, etc.)', async () => {
    vi.spyOn(prisma.ticket, 'count').mockResolvedValue(0);
    const code1 = await ticketService.generateNextTicketCode('tenant-1');
    expect(code1).toBe('TICK-1001');

    vi.spyOn(prisma.ticket, 'count').mockResolvedValue(15);
    const code2 = await ticketService.generateNextTicketCode('tenant-1');
    expect(code2).toBe('TICK-1016');
  });

  it('debe permitir transiciones de estado válidas según la matriz ITIL', () => {
    expect(ticketService.isValidTransition('NEW', 'OPEN')).toBe(true);
    expect(ticketService.isValidTransition('OPEN', 'PENDING')).toBe(true);
    expect(ticketService.isValidTransition('PENDING', 'OPEN')).toBe(true);
    expect(ticketService.isValidTransition('OPEN', 'SOLVED')).toBe(true);
    expect(ticketService.isValidTransition('SOLVED', 'CLOSED')).toBe(true);
    expect(ticketService.isValidTransition('SOLVED', 'OPEN')).toBe(true); // Reabrir ticket
  });

  it('debe rechazar transiciones inválidas o no permitidas', () => {
    expect(ticketService.isValidTransition('PENDING', 'NEW')).toBe(false);
    expect(ticketService.isValidTransition('CLOSED', 'OPEN')).toBe(false);
    expect(ticketService.isValidTransition('CLOSED', 'SOLVED')).toBe(false);
  });

  it('debe validar la longitud mínima de título y descripción al crear un ticket', async () => {
    await expect(
      ticketService.createTicket('t1', 'u1', { title: 'ab', description: 'descripción válida' })
    ).rejects.toThrow('El título del ticket debe tener al menos 3 caracteres');

    await expect(
      ticketService.createTicket('t1', 'u1', { title: 'Título válido', description: 'abc' })
    ).rejects.toThrow('La descripción del ticket debe tener al menos 5 caracteres');
  });
  it('debe actualizar estado y pausar/reanudar SLA adecuadamente', async () => {
    const mockFind = vi.fn().mockResolvedValue({
      id: 'tick-1',
      status: 'OPEN',
      isSlaPaused: false,
      totalSlaPausedMins: 0,
      slaPausedAt: null,
      resolvedAt: null,
      closedAt: null,
    });
    const mockUpdate = vi.fn().mockResolvedValue({ count: 1 });

    vi.spyOn(prisma, '$extends').mockReturnValue({
      ticket: {
        findFirst: mockFind,
        updateMany: mockUpdate,
      },
    } as any);

    // Pausar SLA al pasar a PENDING
    await ticketService.updateTicketStatus('tenant-1', 'tick-1', 'PENDING');
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'PENDING',
          isSlaPaused: true,
        }),
      })
    );

    // Reanudar SLA al pasar de PENDING a OPEN
    mockFind.mockResolvedValueOnce({
      id: 'tick-1',
      status: 'PENDING',
      isSlaPaused: true,
      totalSlaPausedMins: 10,
      slaPausedAt: new Date(Date.now() - 30 * 60000), // 30 mins ago
    });

    await ticketService.updateTicketStatus('tenant-1', 'tick-1', 'OPEN');
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'OPEN',
          isSlaPaused: false,
        }),
      })
    );
  });

  it('debe rechazar modificación de tickets CLOSED', async () => {
    vi.spyOn(prisma, '$extends').mockReturnValue({
      ticket: {
        findFirst: vi.fn().mockResolvedValue({ id: 't-closed', status: 'CLOSED' }),
      },
    } as any);

    await expect(
      ticketService.updateTicketStatus('tenant-1', 't-closed', 'OPEN')
    ).rejects.toThrow('CANNOT_MODIFY_CLOSED_TICKET');

    await expect(
      ticketService.assignTicket('tenant-1', 't-closed', 'agent-1')
    ).rejects.toThrow('CANNOT_MODIFY_CLOSED_TICKET');
  });
});

