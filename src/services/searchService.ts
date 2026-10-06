import { getTenantPrisma } from '../infrastructure/database/prismaClient';
import { TicketStatus, TicketPriority, TicketType } from '@prisma/client';

export interface FacetedSearchParams {
  query?: string;
  statuses?: TicketStatus[];
  priorities?: TicketPriority[];
  types?: TicketType[];
  groupId?: string;
  assigneeId?: string;
  requesterId?: string;
  tags?: string[];
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
}

export class SearchService {
  async searchTickets(tenantId: string, params: FacetedSearchParams) {
    const startTime = performance.now();
    const tenantPrisma = getTenantPrisma(tenantId);

    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { tenantId };

    if (params.query && params.query.trim().length > 0) {
      const q = params.query.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { ticketCode: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (params.statuses && params.statuses.length > 0) {
      where.status = { in: params.statuses };
    }

    if (params.priorities && params.priorities.length > 0) {
      where.priority = { in: params.priorities };
    }

    if (params.types && params.types.length > 0) {
      where.type = { in: params.types };
    }

    if (params.groupId) where.groupId = params.groupId;
    if (params.assigneeId) where.assigneeId = params.assigneeId;
    if (params.requesterId) where.requesterId = params.requesterId;

    if (params.tags && params.tags.length > 0) {
      where.tags = { hasSome: params.tags };
    }

    if (params.fromDate || params.toDate) {
      where.createdAt = {
        ...(params.fromDate ? { gte: params.fromDate } : {}),
        ...(params.toDate ? { lte: params.toDate } : {}),
      };
    }

    const [tickets, total] = await Promise.all([
      tenantPrisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          requester: { select: { id: true, fullName: true, email: true } },
          assignee: { select: { id: true, fullName: true } },
          group: { select: { id: true, name: true } },
        },
      }),
      tenantPrisma.ticket.count({ where }),
    ]);

    const executionTimeMs = Math.round(performance.now() - startTime);

    return {
      tickets,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      executionTimeMs,
    };
  }
}

export const searchService = new SearchService();
