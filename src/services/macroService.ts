import { getTenantPrisma } from '../infrastructure/database/prismaClient';
import { ticketMessageService } from './ticketMessageService';
import { ticketService } from './ticketService';
import { UserRole } from '@prisma/client';

export interface MacroAction {
  type: 'INSERT_REPLY' | 'INSERT_NOTE' | 'SET_STATUS' | 'SET_PRIORITY' | 'ADD_TAG';
  value: string;
}

export class MacroService {
  async applyMacro(
    tenantId: string,
    ticketId: string,
    macroId: string,
    author: { id: string; role: UserRole }
  ) {
    const tenantPrisma = getTenantPrisma(tenantId);
    const macro = await tenantPrisma.macro.findFirst({
      where: { id: macroId },
    });

    if (!macro) {
      throw new Error('MACRO_NOT_FOUND');
    }

    const actions = (macro.actions as unknown as MacroAction[]) || [];
    let createdMessageId: string | null = null;

    for (const action of actions) {
      switch (action.type) {
        case 'INSERT_REPLY': {
          const msg = await ticketMessageService.addMessage(
            tenantId,
            ticketId,
            author,
            { type: 'PUBLIC_REPLY', body: action.value }
          );
          createdMessageId = msg.id;
          break;
        }
        case 'INSERT_NOTE': {
          const msg = await ticketMessageService.addMessage(
            tenantId,
            ticketId,
            author,
            { type: 'INTERNAL_NOTE', body: action.value }
          );
          createdMessageId = msg.id;
          break;
        }
        case 'SET_STATUS': {
          await ticketService.updateTicketStatus(tenantId, ticketId, action.value as any, author.id);
          break;
        }
        case 'SET_PRIORITY': {
          await tenantPrisma.ticket.updateMany({
            where: { id: ticketId },
            data: { priority: action.value as any },
          });
          break;
        }
        case 'ADD_TAG': {
          const current = await tenantPrisma.ticket.findFirst({ where: { id: ticketId } });
          if (current) {
            const currentTags = current.tags || [];
            if (!currentTags.includes(action.value)) {
              await tenantPrisma.ticket.updateMany({
                where: { id: ticketId },
                data: { tags: [...currentTags, action.value] },
              });
            }
          }
          break;
        }
      }
    }

    return { success: true, appliedMacroId: macro.id, messageId: createdMessageId };
  }
}

export const macroService = new MacroService();
