import { MessageType, UserRole } from '@prisma/client';
import { getTenantPrisma } from '../infrastructure/database/prismaClient';

export interface AddMessageDTO {
  type: MessageType;
  body: string;
  isHtml?: boolean;
  inReplyTo?: string;
}

export class TicketMessageService {
  async addMessage(
    tenantId: string,
    ticketId: string,
    author: { id: string; role: UserRole },
    data: AddMessageDTO
  ) {
    if (!data.body || data.body.trim().length === 0) {
      throw new Error('El mensaje no puede estar vacío');
    }

    // Regla de seguridad: los clientes (REQUESTER) solo pueden publicar respuestas públicas
    if (author.role === 'REQUESTER' && data.type === 'INTERNAL_NOTE') {
      throw new Error('UNAUTHORIZED_NOTE: Los solicitantes no tienen permiso para crear notas internas');
    }

    const tenantPrisma = getTenantPrisma(tenantId);
    const ticket = await tenantPrisma.ticket.findFirst({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new Error('TICKET_NOT_FOUND');
    }

    if (ticket.status === 'CLOSED') {
      throw new Error('CANNOT_REPLY_TO_CLOSED_TICKET');
    }

    // Registrar mensaje
    const message = await tenantPrisma.ticketMessage.create({
      data: {
        ticketId,
        authorId: author.id,
        type: data.type,
        body: data.body.trim(),
        isHtml: data.isHtml ?? true,
        inReplyTo: data.inReplyTo || null,
      },
      include: {
        author: { select: { id: true, fullName: true, role: true, email: true } },
      },
    });

    // Si es una respuesta pública de un agente y no se había registrado primera respuesta
    if (
      data.type === 'PUBLIC_REPLY' &&
      author.role !== 'REQUESTER' &&
      !ticket.firstRespondedAt
    ) {
      await tenantPrisma.ticket.updateMany({
        where: { id: ticketId },
        data: {
          firstRespondedAt: new Date(),
          status: ticket.status === 'NEW' ? 'OPEN' : ticket.status,
        },
      });
    }

    return message;
  }

  async getMessagesForUser(
    tenantId: string,
    ticketId: string,
    user: { id: string; role: UserRole }
  ) {
    const tenantPrisma = getTenantPrisma(tenantId);

    // Si el usuario es cliente solicitante, se excluyen estrictamente las notas internas privadas
    const whereClause: Record<string, unknown> = { ticketId };
    if (user.role === 'REQUESTER') {
      whereClause.type = 'PUBLIC_REPLY';
    }

    return tenantPrisma.ticketMessage.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, fullName: true, role: true } },
        attachments: true,
      },
    });
  }
}

export const ticketMessageService = new TicketMessageService();
