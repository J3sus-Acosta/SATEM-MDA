import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ticketService } from '../services/ticketService';
import { getTenantPrisma } from '../infrastructure/database/prismaClient';
import { TicketStatus, TicketPriority, TicketType } from '@prisma/client';

export const CreateTicketSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().min(5),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  type: z.enum(['INCIDENT', 'SERVICE_REQUEST', 'PROBLEM', 'CHANGE']).optional(),
  groupId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.unknown()).optional(),
});

export const UpdateTicketSchema = z.object({
  status: z.enum(['NEW', 'OPEN', 'PENDING', 'ON_HOLD', 'SOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  groupId: z.string().uuid().nullable().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export class TicketController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenant!.id;
      const requesterId = req.user!.id;
      const data = req.body;

      const ticket = await ticketService.createTicket(tenantId, requesterId, data);
      res.status(201).json({
        success: true,
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenant!.id;
      const tenantPrisma = getTenantPrisma(tenantId);
      const user = req.user!;

      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = { tenantId };

      // Si es Requester, solo puede ver sus propios tickets
      if (user.role === 'REQUESTER') {
        where.requesterId = user.id;
      } else if (req.query.requesterId) {
        where.requesterId = req.query.requesterId;
      }

      if (req.query.status) {
        where.status = req.query.status as TicketStatus;
      }
      if (req.query.priority) {
        where.priority = req.query.priority as TicketPriority;
      }
      if (req.query.type) {
        where.type = req.query.type as TicketType;
      }
      if (req.query.assigneeId) {
        where.assigneeId = req.query.assigneeId;
      }
      if (req.query.groupId) {
        where.groupId = req.query.groupId;
      }

      const [tickets, total] = await Promise.all([
        tenantPrisma.ticket.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            requester: { select: { id: true, fullName: true, email: true } },
            assignee: { select: { id: true, fullName: true, email: true } },
            group: { select: { id: true, name: true } },
          },
        }),
        tenantPrisma.ticket.count({ where }),
      ]);

      res.json({
        success: true,
        data: tickets,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenant!.id;
      const tenantPrisma = getTenantPrisma(tenantId);
      const user = req.user!;
      const id = req.params.id as string;

      const ticket = await tenantPrisma.ticket.findFirst({
        where: { id },
        include: {
          requester: { select: { id: true, fullName: true, email: true } },
          assignee: { select: { id: true, fullName: true, email: true } },
          group: { select: { id: true, name: true } },
          messages: {
            where: user.role === 'REQUESTER' ? { type: 'PUBLIC_REPLY' } : undefined,
            orderBy: { createdAt: 'asc' },
            include: {
              author: { select: { id: true, fullName: true, role: true } },
              attachments: true,
            },
          },
        },
      });

      if (!ticket) {
        res.status(404).json({ error: 'TICKET_NOT_FOUND', message: 'Ticket no encontrado.' });
        return;
      }

      if (user.role === 'REQUESTER' && ticket.requesterId !== user.id) {
        res.status(403).json({ error: 'ACCESS_DENIED', message: 'No tiene permiso para ver este ticket.' });
        return;
      }

      res.json({ success: true, data: ticket });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenant!.id;
      const id = req.params.id as string;
      const { status, priority, assigneeId, groupId, tags } = req.body;

      if (status) {
        await ticketService.updateTicketStatus(tenantId, id, status, req.user?.id);
      }

      const tenantPrisma = getTenantPrisma(tenantId);
      const updateData: Record<string, unknown> = {};
      if (priority) updateData.priority = priority;
      if (assigneeId !== undefined) updateData.assigneeId = assigneeId;
      if (groupId !== undefined) updateData.groupId = groupId;
      if (tags !== undefined) updateData.tags = tags;

      if (Object.keys(updateData).length > 0) {
        await tenantPrisma.ticket.updateMany({
          where: { id },
          data: updateData,
        });
      }

      const updated = await tenantPrisma.ticket.findFirst({
        where: { id },
        include: {
          assignee: { select: { id: true, fullName: true } },
          group: { select: { id: true, name: true } },
        },
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }
}

export const ticketController = new TicketController();
