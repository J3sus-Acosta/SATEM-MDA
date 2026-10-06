import { TicketStatus, TicketPriority, TicketType } from '@prisma/client';
import { prisma, getTenantPrisma } from '../infrastructure/database/prismaClient';

export interface CreateTicketDTO {
  title: string;
  description: string;
  priority?: TicketPriority;
  type?: TicketType;
  sourceChannel?: string;
  groupId?: string;
  assigneeId?: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
}

export const VALID_STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  NEW: ['OPEN', 'PENDING', 'ON_HOLD', 'SOLVED'],
  OPEN: ['PENDING', 'ON_HOLD', 'SOLVED'],
  PENDING: ['OPEN', 'SOLVED'],
  ON_HOLD: ['OPEN', 'SOLVED'],
  SOLVED: ['OPEN', 'CLOSED'],
  CLOSED: [], // Estado terminal inmutable
};

export class TicketService {
  async generateNextTicketCode(tenantId: string): Promise<string> {
    const count = await prisma.ticket.count({
      where: { tenantId },
    });
    const nextNumber = 1000 + count + 1;
    return `TICK-${nextNumber}`;
  }

  isValidTransition(currentStatus: TicketStatus, newStatus: TicketStatus): boolean {
    if (currentStatus === newStatus) return true;
    const allowed = VALID_STATUS_TRANSITIONS[currentStatus] || [];
    return allowed.includes(newStatus);
  }

  async createTicket(tenantId: string, requesterId: string, data: CreateTicketDTO) {
    if (!data.title || data.title.trim().length < 3) {
      throw new Error('El título del ticket debe tener al menos 3 caracteres');
    }
    if (!data.description || data.description.trim().length < 5) {
      throw new Error('La descripción del ticket debe tener al menos 5 caracteres');
    }

    const ticketCode = await this.generateNextTicketCode(tenantId);
    const tenantPrisma = getTenantPrisma(tenantId);

    const ticket = await tenantPrisma.ticket.create({
      data: {
        tenantId,
        ticketCode,
        title: data.title.trim(),
        description: data.description.trim(),
        priority: data.priority || 'MEDIUM',
        type: data.type || 'INCIDENT',
        sourceChannel: data.sourceChannel || 'PORTAL',
        requesterId,
        groupId: data.groupId || null,
        assigneeId: data.assigneeId || null,
        tags: data.tags || [],
        customFields: data.customFields || undefined,
        status: 'NEW',
      },
      include: {
        requester: {
          select: { id: true, fullName: true, email: true, role: true },
        },
        assignee: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    return ticket;
  }

  async updateTicketStatus(tenantId: string, ticketId: string, newStatus: TicketStatus, _actorUserId?: string) {
    const tenantPrisma = getTenantPrisma(tenantId);
    const existing = await tenantPrisma.ticket.findFirst({
      where: { id: ticketId },
    });

    if (!existing) {
      throw new Error('TICKET_NOT_FOUND');
    }

    if (existing.status === 'CLOSED') {
      throw new Error('CANNOT_MODIFY_CLOSED_TICKET');
    }

    if (!this.isValidTransition(existing.status, newStatus)) {
      throw new Error(`INVALID_STATUS_TRANSITION: No se permite cambiar de '${existing.status}' a '${newStatus}'`);
    }

    const updates: Record<string, unknown> = { status: newStatus };

    if (newStatus === 'SOLVED' && !existing.resolvedAt) {
      updates.resolvedAt = new Date();
    }
    if (newStatus === 'CLOSED' && !existing.closedAt) {
      updates.closedAt = new Date();
    }

    // Manejo de pausa de SLA
    if (newStatus === 'PENDING' || newStatus === 'ON_HOLD') {
      updates.isSlaPaused = true;
      updates.slaPausedAt = new Date();
    } else if (existing.isSlaPaused && (newStatus === 'OPEN' || newStatus === 'SOLVED')) {
      updates.isSlaPaused = false;
      if (existing.slaPausedAt) {
        const pauseMins = Math.floor((Date.now() - existing.slaPausedAt.getTime()) / 60000);
        updates.totalSlaPausedMins = existing.totalSlaPausedMins + pauseMins;
      }
      updates.slaPausedAt = null;
    }

    return tenantPrisma.ticket.updateMany({
      where: { id: ticketId },
      data: updates,
    });
  }

  async assignTicket(tenantId: string, ticketId: string, assigneeId?: string, groupId?: string) {
    const tenantPrisma = getTenantPrisma(tenantId);
    const existing = await tenantPrisma.ticket.findFirst({
      where: { id: ticketId },
    });

    if (!existing) {
      throw new Error('TICKET_NOT_FOUND');
    }

    if (existing.status === 'CLOSED') {
      throw new Error('CANNOT_MODIFY_CLOSED_TICKET');
    }

    return tenantPrisma.ticket.updateMany({
      where: { id: ticketId },
      data: {
        assigneeId: assigneeId !== undefined ? assigneeId : existing.assigneeId,
        groupId: groupId !== undefined ? groupId : existing.groupId,
        status: existing.status === 'NEW' ? 'OPEN' : existing.status,
      },
    });
  }
}

export const ticketService = new TicketService();
