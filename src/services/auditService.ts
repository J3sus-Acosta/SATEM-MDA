import { getTenantPrisma } from '../infrastructure/database/prismaClient';

export interface CreateAuditLogEntry {
  tenantId: string;
  userId?: string;
  ticketId?: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT' | 'ASSIGN' | 'STATUS_CHANGE';
  entity: string;
  entityId: string;
  ipAddress?: string;
  userAgent?: string;
  changesDiff?: Record<string, { old: unknown; new: unknown }>;
}

export class AuditService {
  async log(entry: CreateAuditLogEntry) {
    const tenantPrisma = getTenantPrisma(entry.tenantId);

    return tenantPrisma.auditLog.create({
      data: {
        tenantId: entry.tenantId,
        userId: entry.userId || null,
        ticketId: entry.ticketId || null,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        ipAddress: entry.ipAddress || null,
        userAgent: entry.userAgent || null,
        changesDiff: (entry.changesDiff as any) || undefined,
      },
    });
  }

  // Principio de Inmutabilidad Forense: la tabla AuditLog es estrictamente APPEND-ONLY
  async updateAuditLog(): Promise<never> {
    throw new Error('AUDIT_LOG_IMMUTABLE: Los registros de auditoría no pueden ser modificados.');
  }

  async deleteAuditLog(): Promise<never> {
    throw new Error('AUDIT_LOG_IMMUTABLE: Los registros de auditoría no pueden ser eliminados.');
  }

  async queryLogs(
    tenantId: string,
    filters: {
      entity?: string;
      entityId?: string;
      userId?: string;
      fromDate?: Date;
      toDate?: Date;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const tenantPrisma = getTenantPrisma(tenantId);
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 50));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { tenantId };
    if (filters.entity) where.entity = filters.entity;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.userId) where.userId = filters.userId;
    if (filters.fromDate || filters.toDate) {
      where.createdAt = {
        ...(filters.fromDate ? { gte: filters.fromDate } : {}),
        ...(filters.toDate ? { lte: filters.toDate } : {}),
      };
    }

    return tenantPrisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, email: true, role: true } },
      },
    });
  }
}

export const auditService = new AuditService();
