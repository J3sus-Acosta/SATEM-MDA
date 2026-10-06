import { getTenantPrisma } from '../../infrastructure/database/prismaClient';
import { ticketService } from '../ticketService';
import { ticketMessageService } from '../ticketMessageService';

export interface InboundEmailPayload {
  from: string; // e.g. "Juan Perez <juan@empresa.cl>"
  to: string;   // e.g. "soporte@tenant.satem.cl"
  subject: string;
  textBody: string;
  htmlBody?: string;
  messageId: string;
  inReplyTo?: string;
  references?: string[];
}

export class EmailInboundService {
  extractEmailAddress(raw: string): string {
    const match = raw.match(/<([^>]+)>/);
    return match ? match[1].toLowerCase().trim() : raw.toLowerCase().trim();
  }

  extractTicketCodeFromSubject(subject: string): string | null {
    const match = subject.match(/\[(TICK-\d+)\]/i);
    return match ? match[1].toUpperCase() : null;
  }

  async processInboundEmail(tenantId: string, payload: InboundEmailPayload) {
    const fromEmail = this.extractEmailAddress(payload.from);
    const tenantPrisma = getTenantPrisma(tenantId);

    // 1. Buscar o auto-provisionar usuario solicitante
    let user = await tenantPrisma.user.findFirst({
      where: { email: fromEmail },
    });

    if (!user) {
      user = await tenantPrisma.user.create({
        data: {
          tenantId,
          email: fromEmail,
          fullName: payload.from.split('<')[0].replace(/"/g, '').trim() || fromEmail,
          passwordHash: 'EMAIL_AUTO_PROVISIONED',
          role: 'REQUESTER',
          isActive: true,
        },
      });
    }

    // 2. Verificar si es una respuesta a un ticket existente por asunto o in-reply-to
    const ticketCode = this.extractTicketCodeFromSubject(payload.subject);
    let existingTicket = null;

    if (ticketCode) {
      existingTicket = await tenantPrisma.ticket.findFirst({
        where: { ticketCode },
      });
    }

    if (!existingTicket && payload.inReplyTo) {
      const referencedMessage = await tenantPrisma.ticketMessage.findFirst({
        where: { inReplyTo: payload.inReplyTo },
        include: { ticket: true },
      });
      if (referencedMessage) {
        existingTicket = referencedMessage.ticket;
      }
    }

    // 3. Si existe, agregar respuesta al hilo
    if (existingTicket) {
      const message = await ticketMessageService.addMessage(
        tenantId,
        existingTicket.id,
        { id: user.id, role: user.role },
        {
          type: 'PUBLIC_REPLY',
          body: payload.textBody || payload.htmlBody || '',
          isHtml: !!payload.htmlBody,
          inReplyTo: payload.messageId,
        }
      );

      return {
        action: 'APPENDED' as const,
        ticketId: existingTicket.id,
        ticketCode: existingTicket.ticketCode,
        messageId: message.id,
      };
    }

    // 4. Si no existe, crear un nuevo ticket desde el correo
    const newTicket = await ticketService.createTicket(tenantId, user.id, {
      title: payload.subject.replace(/\[TICK-\d+\]/gi, '').trim() || 'Solicitud sin asunto',
      description: payload.textBody || payload.htmlBody || 'Sin descripción',
      sourceChannel: 'EMAIL',
      priority: 'MEDIUM',
    });

    return {
      action: 'CREATED' as const,
      ticketId: newTicket.id,
      ticketCode: newTicket.ticketCode,
    };
  }
}

export const emailInboundService = new EmailInboundService();
